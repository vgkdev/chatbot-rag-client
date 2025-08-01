import React, { useEffect, useRef, useState } from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListIcon from "@mui/icons-material/List";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import {
  Avatar,
  CircularProgress,
  InputBase,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextareaAutosize,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { AppBar } from "../components/AppBar";
import { pdfjs } from "react-pdf";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import ReactMarkdown from "react-markdown";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import ThinkingAnimation from "../components/ThinkingAnimation";
import TypingText from "../components/TypingText";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import {
  deleteChatFromFirebase,
  getVectorStoreAndMetadata,
  loadChatsFromFirebase,
  renameChatInFirebase,
  saveChatToFirebase,
  subscribeToChats,
} from "../servers/firebaseUtils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../configs/firebase";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { ChatItem2 } from "../components/ChatItem2";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { generateChatTitle, getRelevantChunks } from "../servers/ragProcessor";
import useSnackbarUtils from "../utils/useSnackbarUtils";

const drawerWidth = 300;
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const MAX_HISTORY_LENGTH = 10;

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0,
  maxRetries: 3,
  apiKey: apiKey,
});

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: open ? `${drawerWidth}px` : 0,
  })
);

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  justifyContent: "space-between",
  ...theme.mixins.toolbar,
}));

export default function HomePage() {
  const { user, setUser } = useContext(UserContext);
  const chatEndRef = useRef(null);

  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]); // Lưu danh sách file đã upload
  const [isThinking, setIsThinking] = useState(false);
  const [latestBotMessageIndex, setLatestBotMessageIndex] = useState(-1);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [isNewBotMessage, setIsNewBotMessage] = useState(false);
  const [fileList, setFileList] = useState([]); // Danh sách file từ Firebase
  const [fullText, setFullText] = useState(""); // Nội dung đã gộp từ tất cả file

  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingFilesFromFirebase, setLoadingFilesFromFirebase] =
    useState(true);
  const [loadingChatContent, setLoadingChatContent] = useState(false);

  const [isHoveredChat, setIsHoveredChat] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [metadataOfFiles, setMetadataOfFiles] = useState("");
  const [vectorStore, setVectorStore] = useState(null); // Thêm state để lưu vectorStore
  const { showSuccess, showError } = useSnackbarUtils();

  // console.log(">>>check user: ", user.major.name);

  useEffect(() => {
    let unsubscribe;
    const subscribeChats = async () => {
      if (user) {
        setLoadingChats(true);
        try {
          unsubscribe = subscribeToChats(user.userId, (chats) => {
            setChats(chats);
            setLoadingChats(false);
          });
        } catch (error) {
          console.error("Error subscribing to chats:", error);
          setLoadingChats(false);
        }
      }
    };
    subscribeChats();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    // Khi load chat, scroll xuống cuối
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  useEffect(() => {
    fetchVectorStoreAndMetadata();
  }, []);

  const fetchVectorStoreAndMetadata = async () => {
    setLoadingFilesFromFirebase(true);
    try {
      const { vectorStoreData, metadata } = await getVectorStoreAndMetadata();
      const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey });
      const combinedVectorStore = new MemoryVectorStore(embeddings);

      // Kết hợp tất cả vector store vào một MemoryVectorStore duy nhất
      for (const vectorStoreDataItem of vectorStoreData) {
        const documents = vectorStoreDataItem.memoryVectors.map((vec) => ({
          pageContent: vec.content,
          metadata: vec.metadata,
        }));
        await combinedVectorStore.addDocuments(documents);
      }

      setMetadataOfFiles(metadata || "");
      setVectorStore(combinedVectorStore); // Lưu combinedVectorStore
      console.log(">>>Vector store loaded successfully: ", combinedVectorStore);
    } catch (error) {
      console.error("Error fetching vector store and metadata:", error);
      showError("Lỗi khi tải vector store và metadata!");
    } finally {
      setLoadingFilesFromFirebase(false);
    }
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const sendMessage = async () => {
    setMessage("");
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    const newChatHistory = [...chatHistory, userMessage]; // Tạo một bản sao mới của chatHistory

    // Giới hạn lịch sử trò chuyện
    if (newChatHistory.length > MAX_HISTORY_LENGTH) {
      newChatHistory.slice(-MAX_HISTORY_LENGTH);
    }

    setChatHistory(newChatHistory); // Cập nhật chatHistory
    setIsThinking(true);

    let contextFromChunks = "";
    try {
      if (vectorStore) {
        contextFromChunks = await getRelevantChunks(
          message,
          5,
          vectorStore,
          0.8
        );
        console.log(">>>check contextFromChunks: ", contextFromChunks);
      } else {
        console.log("No vector store available, skipping chunk retrieval");
      }
    } catch (error) {
      console.error("Error retrieving relevant chunks:", error);
      showError("Lỗi khi tìm nội dung liên quan!");
    }

    try {
      const messages = [
        {
          role: "system",
          content: `
            Bạn là một trợ lý AI thân thiện và học thuật, chuyên hỗ trợ sinh viên đại học trong việc tìm kiếm và giải đáp các câu hỏi liên quan đến môn học.
            
            🧠 **Phân loại và xử lý câu hỏi**:
              - **Xác định câu hỏi mơ hồ**:
                - Một câu hỏi được coi là mơ hồ nếu:
                  - Ngắn và thiếu ngữ cảnh cụ thể mà không nêu rõ môn học, chủ đề, hoặc mục đích cụ thể (ví dụ: "mượn sách", "hồ sơ khách hàng", "tháp hà nội",...).
                  - Chỉ chứa từ khóa chung chung (như "quy trình", "tài liệu", "hệ thống", "cách làm",...) mà không nêu rõ môn học, chủ đề, hoặc mục đích cụ thể.
                  - Không đủ thông tin để xác định nội dung cần trả lời (ví dụ: không rõ thư viện, môn học, hoặc bối cảnh cụ thể).
                - Đối với câu hỏi mơ hồ, ngay cả khi tìm thấy nội dung liên quan trong tài liệu, **không trả lời dựa trên nội dung đó** mà yêu cầu làm rõ:
                  \`\`\`markdown
                  📌 Câu hỏi bạn vừa gửi chưa đủ thông tin để tôi cung cấp câu trả lời chính xác.  
                  Vui lòng làm rõ thêm, ví dụ:  
                  - Môn học hoặc chủ đề cụ thể.  
                  - Loại tài liệu cần tìm (giáo trình, bài giảng, đề cương).  
                  - Bối cảnh hoặc mục đích.  
                  Ví dụ câu hỏi rõ ràng: "Tôi cần tài liệu môn Cấu trúc dữ liệu" hoặc "Giải thích về thuật toán sắp xếp nhanh trong môn Cấu trúc dữ liệu".
                  \`\`\`

              - **Câu hỏi yêu cầu giải thích khái niệm** (ví dụ: "Giải thích hồi quy tuyến tính"):
                - Nếu có nội dung liên quan trong \`\`\`${contextFromChunks}\`\`\` (và không phải "Không tìm thấy nội dung liên quan."), cung cấp giải thích ngắn gọn (tối đa 300 từ), dễ hiểu, sử dụng ví dụ minh họa nếu cần, dựa trên nội dung từ \`\`\`${contextFromChunks}\`\`\`.
                - Nếu \`\`\`${contextFromChunks}\`\`\` là "Không tìm thấy nội dung liên quan.", trả lời:
                  \`\`\`markdown
                  😥 Xin lỗi, hiện tại tôi chưa có dữ liệu liên quan đến câu hỏi của bạn.  
                  📎 Bạn có thể gửi thêm tài liệu để tôi hỗ trợ tốt hơn,  
                  hoặc đặt một câu hỏi khác nhé! 😊
                  \`\`\`

              - **Câu hỏi yêu cầu so sánh hoặc phân tích** (ví dụ: "So sánh thuật toán Dijkstra và Bellman-Ford"):
                - Nếu có nội dung liên quan trong \`\`\`${contextFromChunks}\`\`\` (và không phải "Không tìm thấy nội dung liên quan."), trả lời theo cấu trúc: **Giới thiệu**, **Điểm giống nhau**, **Điểm khác biệt**, **Kết luận**, dựa trên \`\`\`${contextFromChunks}\`\`\`.
                - Nếu \`\`\`${contextFromChunks}\`\`\` là "Không tìm thấy nội dung liên quan.", trả lời:
                  \`\`\`markdown
                  😥 Xin lỗi, hiện tại tôi chưa có dữ liệu liên quan đến câu hỏi của bạn.  
                  📎 Bạn có thể gửi thêm tài liệu để tôi hỗ trợ tốt hơn,  
                  hoặc đặt một câu hỏi khác nhé! 😊
                  \`\`\`
                - Đảm bảo câu hỏi đủ cụ thể (nêu rõ thuật toán, tiêu chí so sánh). Nếu không, yêu cầu làm rõ như trên.

              - **Câu hỏi yêu cầu tính toán** (ví dụ: "Tính tích phân của x^2"):
                - Nếu có nội dung liên quan trong \`\`\`${contextFromChunks}\`\`\` (và không phải "Không tìm thấy nội dung liên quan."), trả lời từng bước, sử dụng ký tự Unicode cho công thức toán học (ví dụ: aₙ, ×) trong code block (\`\`\`) hoặc code inline (\`...\`) trên dòng riêng biệt, dựa trên \`\`\`${contextFromChunks}\`\`\`.
                - Nếu \`\`\`${contextFromChunks}\`\`\` là "Không tìm thấy nội dung liên quan.", trả lời:
                  \`\`\`markdown
                  😥 Xin lỗi, hiện tại tôi chưa có dữ liệu liên quan đến câu hỏi của bạn.  
                  📎 Bạn có thể gửi thêm tài liệu để tôi hỗ trợ tốt hơn,  
                  hoặc đặt một câu hỏi khác nhé! 😊
                  \`\`\`
                - Nếu câu hỏi không rõ (ví dụ: thiếu giới hạn tích phân), yêu cầu làm rõ:
                \`\`\`markdown
                📌 Câu hỏi của bạn chưa đủ thông tin (ví dụ: giới hạn tích phân).  
                Vui lòng cung cấp thêm chi tiết để tôi hỗ trợ chính xác hơn!
                \`\`\`

              - **Câu hỏi yêu cầu tài liệu** (có từ khóa: "gửi tài liệu", "gửi file", "gửi link", "muốn tài liệu"):
                - **Bước 1**: Kiểm tra câu hỏi có chứa từ khóa yêu cầu tài liệu như "gửi tài liệu", "gửi file", "gửi link", "muốn tài liệu" hay không.
                - **Bước 2**: Phân tích câu hỏi để xác định môn học, chuyên ngành, hoặc loại tài liệu cụ thể (ví dụ: "giáo trình", "bài giảng", "đề cương").
                - **Bước 3**: Tìm kiếm trong \`\`\`${metadataOfFiles}\`\`\` để xác định tài liệu phù hợp dựa trên:
                  - Môn học (so khớp với \`\`\`Môn học: Tên môn học\`\`\` trong metadata).
                  - Chuyên ngành (so khớp với \`\`\`Chuyên ngành: Tên chuyên ngành\`\`\` hoặc "Cơ sở ngành").
                  - Tên file hoặc tên gốc nếu người dùng nêu cụ thể.
                - **Bước 4**: Trả về tối đa 5 tài liệu phù hợp với định dạng:
                  \`\`\`markdown
                  📎 Link tài liệu: [tên file - tên file upload](url)
                  \`\`\`
                - **Bước 5**: Nếu không tìm thấy tài liệu phù hợp trong \`\`\`${metadataOfFiles}\`\`\`, trả lời:
                  \`\`\`markdown
                  📌 Hiện tại chưa có tài liệu phù hợp với câu hỏi của bạn.  
                  Bạn có thể thử hỏi cụ thể hơn (ví dụ: "Giáo trình môn Hệ điều hành") hoặc tôi có thể giải thích khái niệm thay thế. Bạn muốn tiếp tục như thế nào?
                  \`\`\`
                - **Lưu ý**: Không sử dụng \`\`\`${contextFromChunks}\`\`\` để tìm tài liệu trừ khi câu hỏi yêu cầu nội dung cụ thể trong tài liệu (ví dụ: "Tài liệu giải thích thuật toán Dijkstra").

              - **Khi không tìm thấy tài liệu phù hợp**:
                - Trả lời:
                  \`\`\`markdown
                  📌 Hiện tại chưa có tài liệu phù hợp với câu hỏi của bạn.  
                  Bạn có thể thử hỏi cụ thể hơn (ví dụ: "Giáo trình môn Hệ điều hành") hoặc tôi có thể giải thích khái niệm thay thế. Bạn muốn tiếp tục như thế nào?
                  \`\`\`

            👉 **Nguyên tắc trình bày câu trả lời**:
            - Sử dụng **Markdown** để trình bày, bao gồm các đề mục \`##\`, gạch đầu dòng, bảng nếu cần.
            - Thêm các biểu tượng (emoji) phù hợp để làm nổi bật nội dung và dễ đọc hơn.
            - Mỗi phần nên có **tiêu đề rõ ràng**, chia nhỏ theo từng mục để người học dễ theo dõi.
            - Ngắt dòng hợp lý để tránh lỗi khi chuyển đổi văn bản.

            📏 **Độ dài câu trả lời**:
            - Giữ câu trả lời ngắn gọn, súc tích, tối đa 300 từ cho phần giải thích.
            - Nếu cần cung cấp thêm chi tiết, tách thành các mục nhỏ với tiêu đề rõ ràng.
            - Đối với câu hỏi yêu cầu tài liệu, chỉ gợi ý tối đa 3 liên kết tài liệu.
            - Nếu nội dung quá dài, tóm tắt và cung cấp liên kết tài liệu để người dùng tham khảo thêm.

            📚 **Thông tin nền tảng**:
            1. 📝 Tài liệu người dùng đã tải lên:  
            \`\`\`  
            ${context}
            \`\`\`

            2. 📂 Cơ sở dữ liệu chính thức gồm giáo trình, bài giảng, và các tài liệu khác có đường dẫn:  
            📑 Danh sách metadata:
            \`\`\`
            ${metadataOfFiles}
            \`\`\`

            📚 Nội dung liên quan được truy xuất:
            \`\`\`
            ${contextFromChunks}
            \`\`\`

            💬 **Lịch sử trò chuyện trước đó**:
            ${newChatHistory
              .map(
                (msg) =>
                  `${msg.role === "user" ? "👨‍🎓 Người dùng" : "🤖 Trợ lý"}: ${
                    msg.content
                  }`
              )
              .join("\n")}
              
            ❗ **Xử lý các câu hỏi thiếu thông tin, sai cú pháp**:
            - Khi người dùng đặt câu hỏi không rõ ràng hoặc thiếu ngữ cảnh như:  
              "Tôi cần tài liệu", "Bạn có gì?", "Hệ thống thông tin", "Tài liệu môn học", "Gửi tôi file"...
            - Tuyệt đối **không đoán mò**.
            - Yêu cầu người dùng cung cấp thêm thông tin cụ thể như:
              - Môn học nào?
              - Cần loại tài liệu nào? (bài giảng, giáo trình, đề cương, v.v.)
            - Trả lời mẫu gợi ý:
            \`\`\`markdown
            mẫu 1:
            📌 Câu hỏi bạn vừa gửi chưa đủ thông tin.  
            Vui lòng cho biết rõ hơn bạn cần tài liệu gì (môn học, loại tài liệu, nội dung)?  
            Ví dụ: "Tôi cần giáo trình môn Cấu trúc dữ liệu."
            mẫu 2:
            😥 Xin lỗi, hiện tại tôi chưa có dữ liệu liên quan đến câu hỏi này.  
            📎 Bạn có thể tải lên thêm tài liệu liên quan để tôi hỗ trợ tốt hơn,  
            hoặc thử đặt một câu hỏi khác nhé! 😊
            \`\`\`
          `,
        },
        {
          role: "user",
          content: `
            🧭 **Hướng dẫn xử lý câu hỏi**:
            1. ✅ Ưu tiên nội dung từ file tải lên nếu có thông tin liên quan.
            2. 🧠 Sử dụng dữ liệu từ cơ sở dữ liệu để bổ sung khái niệm hoặc bối cảnh học thuật.
            3. 🚫 Không tự suy đoán nếu không có dữ liệu rõ ràng.
            4. 🔍 Không trích dẫn số trang, số slide hay định dạng tài liệu.
            5. ❓ Nếu không tìm thấy thông tin, trả lời: **"Xin lỗi, tôi chưa có thông tin."**

            📤 **Yêu cầu liên quan đến tài liệu** (file, link, url...):
            - Khi phát hiện người dùng hỏi về tài liệu bằng các từ khóa như:  
            "gửi tài liệu", "gửi file", "gửi link", "muốn tài liệu",...  
            → **Phải cung cấp link tài liệu đúng đã nhắc trước đó trong lịch sử trò chuyện.**
            → **Ưu tiên tìm kiếm trong \`\`\`${metadataOfFiles}\`\`\` để gợi ý tài liệu phù hợp.**
            - Nếu câu hỏi nêu rõ môn học (ví dụ: "Tài liệu môn Hệ điều hành"), so khớp với \`\`\`Môn học\`\`\` trong metadata.
            - Nếu câu hỏi nêu rõ chuyên ngành, so khớp với \`\`\`Chuyên ngành\`\`\` hoặc "Cơ sở ngành".
            - Nếu câu hỏi nêu rõ tên tài liệu, so khớp với \`\`\`Tên file\`\`\` hoặc \`\`\`Tên gốc\`\`\`.
            - Giới hạn tối đa 5 tài liệu gợi ý, theo định dạng:
              **"📎 Link tài liệu: [tên file - tên file upload](url)"**

            📎 **Định dạng bắt buộc khi gửi link tài liệu**:
            - Khi gửi link tài liệu, phải theo định dạng sau:
              **"📎 Link tài liệu: [tên file - tên file upload](url)"**
            - Trong đó:
              - **tên file** là tên gọi riêng của tài liệu (trong CSDL: \`file.name\`)
              - **tên file upload** là tên gốc của file (trong CSDL: \`file.fileName\`)
              - **url** là đường dẫn chính xác đến file (trong CSDL: \`file.url\`)

            📌 Ví dụ:
            📎 Link tài liệu: [Đề cương môn học - syllabus.pdf](https://domain.com/syllabus.pdf)

            🎓 **Thông tin người dùng**:  
            - Ngành học: **${user?.major?.name || "Chưa có chuyên ngành"}**
            - Gợi ý 1-3 tài liệu học phù hợp với ngành nếu có thể.
            - Nếu không có tài liệu phù hợp, đề xuất tìm kiếm thêm hoặc giải thích khái niệm.

            😊 **Tính tương tác và thân thiện**:
            - Bắt đầu câu trả lời bằng lời chào hoặc động viên (ví dụ: "Chào bạn! 👋", "Rất vui được hỗ trợ bạn! 😊").
            - Kết thúc bằng lời khuyến khích hỏi thêm (ví dụ: "Bạn có câu hỏi nào khác không? 😊").
            - Sử dụng ngôn ngữ gần gũi, tránh quá trang trọng, nhưng giữ tính học thuật.

            ---

            📝 **Câu hỏi hiện tại**:  
            ${message}
           `,
        },
      ];

      const response = await model.invoke(messages);

      const aiMessage = { role: "assistant", content: response.text };
      const updatedChatHistory = [...newChatHistory, aiMessage]; // Thêm tin nhắn của bot vào lịch sử

      // Giới hạn lịch sử trò chuyện
      if (updatedChatHistory.length > MAX_HISTORY_LENGTH) {
        updatedChatHistory.slice(-MAX_HISTORY_LENGTH);
      }

      setChatHistory(updatedChatHistory); // Cập nhật chatHistory
      setLatestBotMessageIndex(updatedChatHistory.length - 1); // Sử dụng updatedChatHistory để cập nhật latestBotMessageIndex
      setIsNewBotMessage(true); // Đánh dấu tin nhắn mới từ bot
      // console.log(">>>check length: ", chatHistory.length);

      // Lưu lịch sử chat vào Firebase
      const chatId = activeChatId || `chat_${new Date().getTime()}`; // Tạo một chatId duy nhất
      // const title = `Chat ${new Date().toLocaleString()}`; // Tạo tiêu đề cho cuộc trò chuyện
      let title = activeChatId ? null : await generateChatTitle(message); // Tạo tiêu đề nếu không có activeChatId

      await saveChatToFirebase(
        user.userId,
        chatId,
        updatedChatHistory,
        context,
        title
      );
      // Nếu không có activeChatId, đặt chatId hiện tại làm activeChatId
      if (!activeChatId) {
        setActiveChatId(chatId);
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      showError("Lỗi khi gửi tin nhắn!");
    } finally {
      setIsThinking(false);
    }
    // // Lấy kết quả trả về từ Gemini API
    // console.log(">>>check response: ", response);
    console.log(">>>check message: ", message);
  };

  const loadChat = async (chatId) => {
    setLoadingChatContent(true);
    try {
      const chatRef = doc(db, "users", user.userId, "chats", chatId);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        setSelectedChatId(chatId);
        setChatHistory(chatData.chatHistory);
        setContext(chatData.context);
        setLatestBotMessageIndex(chatData.chatHistory.length - 1);
        setActiveChatId(chatId); // Đặt activeChatId
        setIsNewBotMessage(false); // Đánh dấu không phải tin nhắn mới từ bot
      } else {
        console.log("No such chat!");
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setLoadingChatContent(false);
    }
  };

  const handleClickNewChat = () => {
    setSelectedChatId(null);
    setChatHistory([]);
    setContext("");
    setLatestBotMessageIndex(-1);
    setActiveChatId(null);
    setIsNewBotMessage(false);
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files; // Lấy danh sách file được tải lên
    if (!files || files.length === 0) return;

    let combinedContent = ""; // Biến lưu nội dung đã gộp từ tất cả file
    const fileNames = []; // Lưu tên file

    try {
      for (const file of files) {
        const fileReader = new FileReader();

        // Xử lý từng file với Promise để đợi hoàn tất đọc file
        const fileContent = await new Promise((resolve, reject) => {
          fileReader.onload = async (e) => {
            try {
              const pdf = await pdfjs.getDocument({ data: e.target.result })
                .promise;

              let fullText = "";
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item) => item.str)
                  .join(" ");
                fullText += `Page ${i}: ${pageText}\n\n`;
              }

              resolve(`--- Content from ${file.name} ---\n${fullText}`);
            } catch (error) {
              reject(error);
            }
          };

          fileReader.onerror = (err) => reject(err);
          fileReader.readAsArrayBuffer(file);
        });

        fileNames.push(file.name); // Lưu tên file hiện tại
        // Thêm nội dung của file hiện tại vào nội dung tổng
        combinedContent += `${fileContent}\n`;
      }

      console.log("Combined PDF Content:\n", combinedContent);
      setContext(combinedContent); // Cập nhật nội dung vào state
      setUploadedFiles((prev) => [...prev, ...fileNames]); // Cập nhật danh sách file đã upload
    } catch (error) {
      console.error("Error reading one or more files:", error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        // Cho phép xuống dòng khi Shift + Enter
        return;
      }
      event.preventDefault(); // Ngăn tạo dòng mới khi chỉ ấn Enter
      sendMessage(); // Gửi tin nhắn
    }
  };

  const handleMenuOpen = (event, chatId) => {
    setAnchorEl(event.currentTarget);
    setSelectedChatId(chatId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedChatId(null);
  };

  const handleRename = async (chatId, newTitle) => {
    if (chatId && newTitle.trim()) {
      try {
        const success = await renameChatInFirebase(
          user.userId,
          chatId,
          newTitle
        );
        if (success) {
          // Cập nhật danh sách chats sau khi đổi tên
          const loadedChats = await loadChatsFromFirebase(user.userId);
          setChats(loadedChats);
          showSuccess("Đổi tên thành công!");
        }
      } catch (error) {
        console.error("Failed to rename chat:", error);
        showError("Có lỗi xảy ra khi đổi tên!");
      }
    }
    handleMenuClose();
  };

  const handleDelete = async (selectedChatId) => {
    setChatToDelete(selectedChatId);
    setOpenConfirmDialog(true); // Mở modal xác nhận
    handleMenuClose();
    // if (selectedChatId) {
    //   setIsDeleting(true); // Bật trạng thái loading khi xóa
    //   try {
    //     const success = await deleteChatFromFirebase(
    //       user.userId,
    //       selectedChatId
    //     );
    //     if (success) {
    //       console.log("Chat deleted successfully");
    //       // Load lại danh sách chats sau khi xóa
    //       const loadedChats = await loadChatsFromFirebase(user.userId);
    //       setChats(loadedChats);
    //       // Nếu chat đang active bị xóa, reset giao diện
    //       if (activeChatId === selectedChatId) {
    //         setChatHistory([]);
    //         setContext("");
    //         setLatestBotMessageIndex(-1);
    //         setActiveChatId(null);
    //         setIsNewBotMessage(false);
    //       }
    //     }
    //   } catch (error) {
    //     console.error("Failed to delete chat:", error);
    //   } finally {
    //     setIsDeleting(false); // Tắt trạng thái loading sau khi hoàn tất
    //     handleMenuClose();
    //   }
    // }
    // handleMenuClose();
  };

  const confirmDelete = async () => {
    if (chatToDelete) {
      setIsDeleting(true); // Bật trạng thái loading
      try {
        const success = await deleteChatFromFirebase(user.userId, chatToDelete);
        if (success) {
          console.log("Chat deleted successfully");
          // Load lại danh sách chats sau khi xóa
          const loadedChats = await loadChatsFromFirebase(user.userId);
          setChats(loadedChats);
          showSuccess("Xóa cuộc trò chuyện thành công");
          // Nếu chat đang active bị xóa, reset giao diện
          if (activeChatId === chatToDelete) {
            setChatHistory([]);
            setContext("");
            setLatestBotMessageIndex(-1);
            setActiveChatId(null);
            setIsNewBotMessage(false);
          }
        }
      } catch (error) {
        console.error("Failed to delete chat:", error);
        showError("Lỗi khi xóa cuộc trò chuyện");
      } finally {
        setIsDeleting(false); // Tắt trạng thái loading
        setOpenConfirmDialog(false); // Đóng modal sau khi hoàn tất
      }
    }
  };

  const openDeleteConfirmation = (chatId) => {
    setChatToDelete(chatId);
    setOpenConfirmDialog(true);
    handleMenuClose();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar open={open} handleDrawerOpen={handleDrawerOpen} />

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            <ListIcon />
          </IconButton>
          <IconButton onClick={handleClickNewChat}>
            <EditNoteOutlinedIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {loadingChats ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            [...chats].reverse().map((chat) => {
              return (
                <ChatItem2
                  key={chat.id}
                  chat={chat}
                  loadChat={loadChat}
                  onRename={handleRename}
                  onDelete={openDeleteConfirmation}
                  anchorEl={anchorEl}
                  selectedChatId={selectedChatId}
                  handleMenuOpen={handleMenuOpen}
                  handleMenuClose={handleMenuClose}
                  isDeleting={isDeleting}
                />
              );
            })
          )}
        </List>
      </Drawer>

      {loadingFilesFromFirebase ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Đang tải dữ liệu từ hệ thống...
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              Vui lòng chờ trong giây lát
            </Typography>
          </Box>
        </Box>
      ) : (
        <Main
          open={open}
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            pb: 3,
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              p: 2,
              // backgroundColor: "#f1f1f1",
              borderRadius: "8px",
              // border: "1px solid red",
              my: 5,
              mx: 10,
            }}
          >
            {loadingChatContent ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : chatHistory.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "60vh",
                  textAlign: "center",
                  color: "#aaa",
                }}
              >
                <SmartToyOutlinedIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 1 }}>
                  👋 Chào bạn, mình là <strong>DocsBot</strong>!
                </Typography>
                <Typography variant="body1">
                  Hãy bắt đầu bằng cách đặt câu hỏi hoặc tải lên tài liệu PDF
                  của bạn nhé.
                </Typography>
              </Box>
            ) : (
              chatHistory.map((chat, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 2,
                    display: "flex",
                    justifyContent:
                      chat.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: "12px",
                      backgroundColor:
                        chat.role === "user" ? "#303030" : "#242424",
                      color: chat.role === "user" ? "#fff" : "#fff",
                      maxWidth: "70%",
                    }}
                  >
                    {chat.role === "assistant" ? (
                      <Box
                        sx={{
                          // border: "1px solid red",
                          display: "flex",
                          gap: "25px",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 35,
                            height: 35,
                            background:
                              "linear-gradient(45deg, #142ccb, #124acd)",
                            color: "#ffffff",
                          }}
                        >
                          <SmartToyOutlinedIcon />
                        </Avatar>

                        {/* Bot trả lời */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            // flex: 1,
                            wordWrap: "break-word",
                          }}
                        >
                          {/* <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => (
                            <p
                              {...props}
                              style={{
                                marginBottom: "4px", // Khoảng cách giữa các đoạn
                                lineHeight: "1.4", // Khoảng cách giữa các dòng trong đoạn
                              }}
                            />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1
                              {...props}
                              style={{
                                marginBottom: "24px",
                                lineHeight: "1.2",
                              }}
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2
                              {...props}
                              style={{
                                marginBottom: "20px",
                                lineHeight: "1.2",
                              }}
                            />
                          ),
                        }}
                      >
                        {chat.content}
                      </ReactMarkdown> */}
                          {/* <TypingText text={chat.content} /> */}
                          {isNewBotMessage &&
                          index === latestBotMessageIndex ? (
                            <TypingText text={chat.content} />
                          ) : (
                            <ReactMarkdown
                              components={{
                                p: ({ node, ...props }) => (
                                  <p
                                    {...props}
                                    style={{
                                      marginBottom: "4px",
                                      lineHeight: "1.4",
                                    }}
                                  />
                                ),
                                h1: ({ node, ...props }) => (
                                  <h1
                                    {...props}
                                    style={{
                                      marginBottom: "24px",
                                      lineHeight: "1.2",
                                    }}
                                  />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2
                                    {...props}
                                    style={{
                                      marginBottom: "20px",
                                      lineHeight: "1.2",
                                    }}
                                  />
                                ),
                                a: ({ node, href, ...props }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...props}
                                    style={{
                                      color: "#1e90ff",
                                      textDecoration: "underline",
                                    }}
                                  />
                                ),
                                hr: ({ node, ...props }) => (
                                  <Divider
                                    {...props}
                                    sx={{
                                      my: 2, // Khoảng cách trên và dưới divider
                                      borderColor: "#555", // Màu của đường ngang, tùy chỉnh theo theme
                                    }}
                                  />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul
                                    {...props}
                                    style={{
                                      marginBottom: "12px",
                                      paddingLeft: "24px", // Thụt lề danh sách
                                      listStyleType: "disc", // Dùng dấu đầu dòng tròn
                                    }}
                                  />
                                ),
                                li: ({ node, ...props }) => (
                                  <li
                                    {...props}
                                    style={{
                                      marginBottom: "8px", // Khoảng cách giữa các mục trong danh sách
                                      lineHeight: "1.5",
                                    }}
                                  />
                                ),
                                strong: ({ node, ...props }) => (
                                  <strong
                                    {...props}
                                    style={{
                                      fontWeight: 700, // Đậm hơn cho văn bản in đậm
                                    }}
                                  />
                                ),
                                em: ({ node, ...props }) => (
                                  <em
                                    {...props}
                                    style={{
                                      fontStyle: "italic", // In nghiêng
                                    }}
                                  />
                                ),
                              }}
                            >
                              {chat.content}
                            </ReactMarkdown>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      chat.content
                    )}
                  </Box>
                </Box>
              ))
            )}
            {isThinking && (
              <Box
                sx={{
                  // border: "1px solid red",
                  display: "flex",
                  gap: "25px",
                  alignItems: "center",
                }}
              >
                <Avatar
                  sx={{
                    width: 35,
                    height: 35,
                    background: "linear-gradient(45deg, #142ccb, #124acd)",
                    color: "#ffffff",
                  }}
                >
                  <SmartToyOutlinedIcon />
                </Avatar>
                <ThinkingAnimation />
              </Box>
            )}
            <div ref={chatEndRef} /> {/* Đây là phần tự động cuộn xuống */}
          </Box>

          <Box
            sx={{
              display: "flex",
              // alignItems: "center",
              flexDirection: "column",
              p: 1,
              borderRadius: "24px",
              backgroundColor: "#333",
              color: "white",
              boxShadow: "none",
              maxWidth: "600px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                flexGrow: 1,
                overflowX: "auto", // Kích hoạt cuộn ngang
                px: 2,
              }}
            >
              <List
                sx={{
                  display: "flex", // Hiển thị ngang
                  flexDirection: "row",
                  gap: 2, // Khoảng cách giữa các file
                  py: 1, // Khoảng cách padding trên và dưới
                }}
              >
                {uploadedFiles.map((fileName, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      display: "inline-flex", // Hiển thị mỗi item như một mục ngang
                      width: "auto", // Không bị cố định chiều rộng
                      whiteSpace: "nowrap", // Tránh xuống dòng nếu tên file dài
                      border: "1px solid #444",
                      borderRadius: "8px",
                    }}
                  >
                    <ListItemIcon>
                      <PictureAsPdfOutlinedIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={fileName}
                      sx={{
                        textAlign: "center", // Căn giữa nội dung
                        overflow: "hidden", // Giới hạn hiển thị nếu tên quá dài
                        textOverflow: "ellipsis", // Hiển thị "..." nếu quá dài
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Attachment Icon */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton component="label" sx={{ color: "white" }}>
                <AttachFileIcon />
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  multiple
                  onChange={handleFileUpload}
                />
              </IconButton>

              {/* Input Field */}
              {/* <InputBase
                placeholder="Hãy nhập câu hỏi"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{
                  ml: 1,
                  flex: 1,
                  color: "white",
                }}
                onKeyDown={handleKeyDown}
              /> */}

              <TextareaAutosize
                minRows={1}
                maxRows={6}
                placeholder="Hãy nhập câu hỏi"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  backgroundColor: "transparent",
                  border: "none",
                  resize: "none",
                  outline: "none",
                  color: "white",
                  fontSize: "1rem",
                  padding: "10px",
                  fontFamily: "inherit",
                }}
              />

              <IconButton
                sx={{ color: "white" }}
                onClick={() => sendMessage()}
                disabled={!message.trim()}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
          <ConfirmationDialog
            open={openConfirmDialog}
            onClose={() => setOpenConfirmDialog(false)}
            onConfirm={confirmDelete}
            title="Xác nhận xóa"
            message="Bạn có chắc chắn muốn xóa cuộc trò chuyện này không? Hành động này không thể hoàn tác."
            confirmText="Xác nhận"
            cancelText="Hủy"
            confirmColor="error"
            isLoading={isDeleting}
          />
        </Main>
      )}
    </Box>
  );
}

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
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { AppBar } from "../components/AppBar";
import { pdfjs } from "react-pdf";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import ReactMarkdown from "react-markdown";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import ThinkingAnimation from "../components/ThinkingAnimation";
import TypingText from "../components/TypingText";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import {
  deleteChatFromFirebase,
  getFilesFromFirebase,
  loadChatsFromFirebase,
  renameChatInFirebase,
  saveChatToFirebase,
} from "../servers/firebaseUtils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../configs/firebase";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { ChatItem } from "../components/ChatItem";
import ConfirmationDialog from "../components/ConfirmationDialog";

const drawerWidth = 240;
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
const MAX_HISTORY_LENGTH = 10;

// console.log(">>>check apiKey: ", apiKey);
const model = new ChatGoogleGenerativeAI({
  // model: "gemini-1.5-pro",
  model: "gemini-1.5-flash",
  temperature: 0,
  maxRetries: 2,
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

  // console.log(">>>check user: ", user);

  useEffect(() => {
    const fetchChats = async () => {
      if (user) {
        setLoadingChats(true);
        try {
          const loadedChats = await loadChatsFromFirebase(user.userId);
          setChats(loadedChats);
        } catch (error) {
          console.error("Error loading chats:", error);
        } finally {
          setLoadingChats(false);
        }
      }
    };
    fetchChats();
  }, [user]);

  useEffect(() => {
    // Khi load chat, scroll xuống cuối
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  useEffect(() => {
    fetchFiles(); // Lấy danh sách file khi component được mount
  }, []);

  const fetchFiles = async () => {
    setLoadingFilesFromFirebase(true);
    try {
      const files = await getFilesFromFirebase(); // Lấy danh sách file từ Firebase
      // console.log(">>>check files: ", files);
      setFileList(files); // Cập nhật state

      let combinedContent = ""; // Biến lưu nội dung đã gộp từ tất cả file
      files.forEach((file) => {
        combinedContent += `--- Content from ${file.name} (URL: ${file.url}) ---\n${file.textContent}\n\n`;
      });
      console.log(">>>check combined PDF Content:\n", combinedContent);
      setFullText(combinedContent); // Cập nhật nội dung vào state
    } catch (error) {
      console.error("Error fetching files:", error);
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

    try {
      const messages = [
        {
          role: "system",
          content: `
          Bạn là trợ lý AI chuyên hỗ trợ sinh viên đại học,
          chi tiết và trình bày chúng trong Markdown và ngắt dòng khi
          có tiêu đề để chuyển đổi không có lỗi. Khi người dùng đặt
          câu hỏi ngắn hoặc không rõ ràng, hãy cung cấp câu trả lời
          toàn diện với tiêu đề và giải thích cụ thể. Tránh đoán mò
          nhưng hãy đề cập đến mọi khía cạnh có thể liên quan đến câu hỏi. 
          1. File người dùng tải lên chứa tài liệu học sau đây: \n${context}
          2. Cơ sở dữ liệu có dữ liệu về giáo trình và bài giảng chính thức từ trường đại học, trong đó có kèm link(url) đến file: \n${fullText}
          3. Khi người dùng muốn có tài liệu đó hãy cung cấp link(url) đến file đó.
          Lịch sử trò chuyện trước đó:\n${newChatHistory
            .map(
              (msg) =>
                `${msg.role === "user" ? "Người dùng" : "Trợ lý"}: ${
                  msg.content
                }`
            )
            .join("\n")}\n,
          `,
        },
        // {
        //   role: "system",
        //   content: `Lịch sử trò chuyện trước đó:\n${newChatHistory
        //     .map(
        //       (msg) =>
        //         `${msg.role === "user" ? "Người dùng" : "Trợ lý"}: ${
        //           msg.content
        //         }`
        //     )
        //     .join("\n")}\n`,
        // },
        // ...newChatHistory, //dùng cái này
        // ...chatHistory,
        {
          role: "user",
          content: `
          Trả lời bằng cách:  
          1. Ưu tiên nội dung từ file tải lên nếu có thông tin phù hợp.  
          2. Sử dụng dữ liệu Cơ sở dữ liệu nếu cần làm rõ khái niệm chung.  
          3. Không tự suy đoán nếu không có thông tin chính xác.
          4. Khi trả lời vui lòng chỉ cung cấp thông tin tổng quan từ tài liệu tham khảo mà không đề cập đến chi tiết như số slide, số trang hoặc định dạng tài liệu
          5. Nếu không biết về thông tin đó thì trả lời: "Xin lỗi, tôi chưa có thông tin.".
          6. Khi yêu cầu có các từ như: "gửi tài liệu", "gửi file", "gửi link", "gửi url", "muốn tài liệu", "muốn file", "muốn link", "muốn url" thì hãy cung cấp link(url) đến chính xác file mà người dùng đã đề cập đến trước đó thông qua Lịch sử trò chuyện, không gửi những file khác không liên quan.
          7. Khi gửi kèm link(url) phải theo định dạng sau: "Link tài liệu: [tên file](link)".
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
      const title = `Chat ${new Date().toLocaleString()}`; // Tạo tiêu đề cho cuộc trò chuyện

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
      sendMessage();
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
        }
      } catch (error) {
        console.error("Failed to rename chat:", error);
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
        <List>
          {loadingChats ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            [...chats].reverse().map((chat) => {
              return (
                <ChatItem
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
              <InputBase
                placeholder="Chat"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                sx={{
                  ml: 1,
                  flex: 1,
                  color: "white",
                }}
                onKeyDown={handleKeyDown}
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

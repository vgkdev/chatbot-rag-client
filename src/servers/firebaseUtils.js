import {
  addDoc,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  getMetadata,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../configs/firebase";
import readPdfFile from "../utils/readPdfFile";

export const saveChatToFirebase = async (
  userId,
  chatId,
  chatHistory,
  context,
  title
) => {
  try {
    // const chatRef = doc(db, "chats", chatId);
    console.log(">>>check user id: ", userId);
    const chatRef = doc(db, "users", userId, "chats", chatId);
    await setDoc(
      chatRef,
      {
        chatHistory,
        context,
        title,
        timestamp: new Date(),
      },
      { merge: true }
    );
    console.log("Chat saved to Firebase");
  } catch (error) {
    console.error("Error saving chat to Firebase:", error);
  }
};

export const loadChatsFromFirebase = async (userId) => {
  console.log(">>>check user id: ", userId);
  try {
    const chatsRef = collection(db, "users", userId, "chats");
    const querySnapshot = await getDocs(chatsRef);
    const chats = [];
    querySnapshot.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() });
    });
    return chats;
  } catch (error) {
    console.error("Error loading chats from Firebase:", error);
    return [];
  }
};

// export const fetchKnowledgeBase = async () => {
//   try {
//     const docRef = doc(db, "data", "knowledgeBase");
//     const docSnap = await getDoc(docRef);

//     if (docSnap.exists()) {
//       const knowledgeBaseData = docSnap.data();
//       return knowledgeBaseData.data; // Giả sử dữ liệu được lưu trong trường `content`
//     } else {
//       console.log("No knowledge base found!");
//       return "";
//     }
//   } catch (error) {
//     console.error("Error fetching knowledge base:", error);
//     return "";
//   }
// };

/**
 * Upload file lên Firebase Storage và trả về URL của file
 * @param {File} file - File cần upload
 * @param {string} folderPath - Đường dẫn thư mục trong Firebase Storage (ví dụ: "uploads")
 * @returns {Promise<string>} - URL của file sau khi upload
 */
export const uploadFileToFirebase = async (file, folderPath = "uploads") => {
  try {
    // Tạo reference tới file trong Firebase Storage
    const storageRef = ref(storage, `${folderPath}/${file.name}`);
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    // Lấy URL của file sau khi upload
    const fileUrl = await getDownloadURL(snapshot.ref);
    console.log("File uploaded successfully. URL:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file to Firebase:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

/**
 * Upload nhiều file lên Firebase Storage và trả về danh sách URL
 * @param {File[]} files - Danh sách file cần upload
 * @param {string} folderPath - Đường dẫn thư mục trong Firebase Storage (ví dụ: "uploads")
 * @returns {Promise<string[]>} - Danh sách URL của các file sau khi upload
 */
export const uploadMultipleFilesToFirebase = async (
  files,
  folderPath = "uploads"
) => {
  try {
    const uploadPromises = files.map((file) =>
      uploadFileToFirebase(file, folderPath)
    );
    const fileUrls = await Promise.all(uploadPromises); // Chờ tất cả các file upload xong
    console.log("All files uploaded. URLs:", fileUrls);
    return fileUrls;
  } catch (error) {
    console.error("Error uploading multiple files to Firebase:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

/**
 * Lấy danh sách file trong folder `uploads` từ Firebase Storage
 * @param {string} folderPath - Đường dẫn thư mục trong Firebase Storage (ví dụ: "uploads")
 * @returns {Promise<{ name: string, url: string }[]>} - Danh sách file với tên và URL
 */
export const getFilesFromFirebase = async (folderPath = "uploads") => {
  try {
    const storageRef = ref(storage, folderPath); // Tạo reference tới folder
    const fileList = await listAll(storageRef); // Lấy danh sách file trong folder

    // Lấy thông tin chi tiết của từng file
    const filesWithDetails = await Promise.all(
      fileList.items.map(async (item, index) => {
        const url = await getDownloadURL(item); // Lấy URL của file
        const metadata = await getMetadata(item); // Lấy metadata của file

        // Kiểm tra nếu file là PDF thì đọc nội dung text
        let textContent = "";
        if (item.name.endsWith(".pdf")) {
          // console.log(">>>check url: ", url);
          textContent = await readPdfFile(url); // Đọc nội dung text từ file PDF
        }
        return {
          stt: index + 1, // STT (số thứ tự)
          name: item.name, // Tên file
          size: `${(metadata.size / 1024).toFixed(2)} KB`, // Kích thước file (chuyển sang KB)
          createdAt: new Date(metadata.timeCreated).toLocaleDateString(), // Ngày tải lên
          url, // URL của file
          textContent, // Nội dung text (nếu là PDF)
        };
      })
    );

    return filesWithDetails;
  } catch (error) {
    console.error("Error fetching files from Firebase:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

/**
 * Xóa file từ Firebase Storage
 * @param {Object} file - File object chứa thông tin file cần xóa
 * @param {string} folderPath - Đường dẫn thư mục trong Firebase Storage (mặc định: "uploads")
 * @returns {Promise<boolean>} - Trả về true nếu xóa thành công
 */
export const deleteFileFromFirebase = async (file, folderPath = "uploads") => {
  try {
    // Tạo reference tới file cần xóa
    const fileRef = ref(storage, `${folderPath}/${file.name}`);

    // Thực hiện xóa file
    await deleteObject(fileRef);

    console.log(`File ${file.name} deleted successfully`);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${file.name}:`, error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

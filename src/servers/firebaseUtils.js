import {
  addDoc,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  onSnapshot,
  updateDoc,
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

export const fetchAllUsers = async () => {
  try {
    const userCollection = collection(db, "users");
    const userSnapshot = await getDocs(userCollection);
    return userSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUserData = async (userId, userData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        ...userData,
        // Ensure critical fields are properly formatted
        userName: userData.userName?.trim(),
        role: Number(userData.role) || 0, // Ensure role is a number
      },
      { merge: true } // This preserves existing fields not in userData
    );
    return { id: userId, ...userData };
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUserData = async (userId) => {
  try {
    await deleteDoc(doc(db, "users", userId));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const subscribeToUsers = (callback) => {
  const usersRef = collection(db, "users");
  return onSnapshot(usersRef, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(users);
  });
};

export const updateUserProfile = async (userId, userData) => {
  try {
    // Prepare the data to be saved in Firebase
    const firebaseUserData = {
      userName: userData.userName,
      email: userData.email,
      role: userData.role || 0, // Default to role 0 if not provided
      major: userData.major,
      userId: userId, // Include userId in the document
    };

    await updateDoc(doc(db, "users", userId), firebaseUserData);

    // Return the complete user data including all fields
    return {
      userId,
      userName: userData.userName,
      email: userData.email,
      role: userData.role || 0,
      major: userData.major,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

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
export const deleteFileFromFirebase = async (
  fileName,
  folderPath = "uploads"
) => {
  try {
    // Tạo reference tới file cần xóa
    const fileRef = ref(storage, `${folderPath}/${fileName}`);

    // Thực hiện xóa file
    await deleteObject(fileRef);

    console.log(`File ${fileName} deleted successfully`);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${fileName}:`, error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

/**
 * Xóa chat khỏi Firebase Firestore dựa trên userId và chatId
 * @param {string} userId - ID của người dùng
 * @param {string} chatId - ID của chat cần xóa
 * @returns {Promise<boolean>} - Trả về true nếu xóa thành công
 */
export const deleteChatFromFirebase = async (userId, chatId) => {
  console.log(">>>check selectedChatId: ", chatId);
  console.log(">>>check userId: ", userId);
  try {
    const chatRef = doc(db, "users", userId, "chats", chatId);
    await deleteDoc(chatRef);
    console.log(`Chat ${chatId} deleted successfully for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting chat ${chatId} for user ${userId}:`, error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

/**
 * Đổi tên chat trong Firebase Firestore
 * @param {string} userId - ID của người dùng
 * @param {string} chatId - ID của chat cần đổi tên
 * @param {string} newTitle - Tiêu đề mới
 * @returns {Promise<boolean>} - Trả về true nếu đổi tên thành công
 */
export const renameChatInFirebase = async (userId, chatId, newTitle) => {
  try {
    const chatRef = doc(db, "users", userId, "chats", chatId);
    await setDoc(chatRef, { title: newTitle }, { merge: true });
    console.log(`Chat ${chatId} renamed to "${newTitle}" for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error renaming chat ${chatId} for user ${userId}:`, error);
    throw error;
  }
};

// Subject-related Firebase operations
export const getSubjects = async () => {
  try {
    const subjectsRef = collection(db, "system", "subjects", "items");
    const querySnapshot = await getDocs(subjectsRef);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting subjects:", error);
    throw error;
  }
};

export const addSubject = async (subjectData) => {
  try {
    const subjectsRef = collection(db, "system", "subjects", "items");

    const subjectToAdd = {
      name: subjectData.name.trim(),
      majors: subjectData.majors || [], // Mảng các object {id, name}
      isBasic: subjectData.isBasic || false, // Boolean để xác định môn cơ bản
      // majorIds: subjectData.majors ? subjectData.majors.map((m) => m.id) : [], // Mảng các id để dễ query
      createdAt: new Date(),
    };

    await addDoc(subjectsRef, subjectToAdd);
  } catch (error) {
    console.error("Error adding subject:", error);
    throw error;
  }
};

export const deleteSubject = async (subjectId) => {
  try {
    const subjectRef = doc(db, "system", "subjects", "items", subjectId);
    await deleteDoc(subjectRef);
  } catch (error) {
    console.error("Error deleting subject:", error);
    throw error;
  }
};

export const subscribeToSubjects = (callback) => {
  const subjectsRef = collection(db, "system", "subjects", "items");
  return onSnapshot(subjectsRef, (snapshot) => {
    const subjects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(subjects);
  });
};

export const updateSubject = async (subjectId, subjectData) => {
  try {
    const subjectRef = doc(db, "system", "subjects", "items", subjectId);
    await setDoc(
      subjectRef,
      {
        name: subjectData.name.trim(),
        majors: subjectData.majors || [],
        isBasic: subjectData.isBasic || false,
      },
      { merge: true } // Chỉ cập nhật các trường được chỉ định, giữ nguyên các trường khác
    );
  } catch (error) {
    console.error("Error updating subject:", error);
    throw error;
  }
};

// Major-related Firebase operations
export const getMajors = async () => {
  try {
    const majorsRef = collection(db, "system", "majors", "items");
    const querySnapshot = await getDocs(majorsRef);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting majors:", error);
    throw error;
  }
};

export const addMajor = async (majorName) => {
  try {
    const majorsRef = collection(db, "system", "majors", "items");
    await addDoc(majorsRef, {
      name: majorName.trim(),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error adding major:", error);
    throw error;
  }
};

export const deleteMajor = async (majorId) => {
  try {
    const majorRef = doc(db, "system", "majors", "items", majorId);
    await deleteDoc(majorRef);
  } catch (error) {
    console.error("Error deleting major:", error);
    throw error;
  }
};

export const subscribeToMajors = (callback) => {
  const majorsRef = collection(db, "system", "majors", "items");
  return onSnapshot(majorsRef, (snapshot) => {
    const majors = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(majors);
  });
};

export const updateMajor = async (majorId, newName) => {
  try {
    const majorRef = doc(db, "system", "majors", "items", majorId);
    await setDoc(majorRef, { name: newName.trim() }, { merge: true });
  } catch (error) {
    console.error("Error updating major:", error);
    throw error;
  }
};

/**
 * Thêm tài liệu mới vào Firestore
 * @param {Object} documentData - Dữ liệu tài liệu
 * @returns {Promise<string>} - ID của tài liệu vừa được thêm
 */
export const addDocument = async (documentData) => {
  try {
    const documentsRef = collection(db, "system", "documents", "items");
    const docRef = await addDoc(documentsRef, {
      name: documentData.name,
      fileName: documentData.fileName,
      url: documentData.url,
      subject: documentData.subject || null,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};

/**
 * Lấy tất cả tài liệu từ Firestore
 * @returns {Promise<Array>} - Danh sách tài liệu
 */
export const getDocuments = async () => {
  try {
    const documentsRef = collection(db, "system", "documents", "items");
    const querySnapshot = await getDocs(documentsRef);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting documents:", error);
    throw error;
  }
};

/**
 * Lấy tài liệu theo ID
 * @param {string} documentId - ID của tài liệu
 * @returns {Promise<Object>} - Thông tin tài liệu
 */
export const getDocumentById = async (documentId) => {
  try {
    const docRef = doc(db, "system", "documents", "items", documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Document not found");
    }
  } catch (error) {
    console.error("Error getting document:", error);
    throw error;
  }
};

/**
 * Cập nhật tài liệu
 * @param {string} documentId - ID của tài liệu
 * @param {Object} updateData - Dữ liệu cập nhật
 * @returns {Promise<void>}
 */
export const updateDocument = async (documentId, updateData) => {
  try {
    const docRef = doc(db, "system", "documents", "items", documentId);
    console.log(">>>check updateData: ", updateData);
    await setDoc(
      docRef,
      {
        name: updateData.name,
        subject: updateData.subject,
        url: updateData.url,
        // createdAt: updateData.createdAt,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

/**
 * Xóa tài liệu
 * @param {string} documentId - ID của tài liệu
 * @returns {Promise<void>}
 */
export const deleteDocument = async (documentId) => {
  try {
    const docRef = doc(db, "system", "documents", "items", documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

/**
 * Lắng nghe thay đổi trên collection documents
 * @param {Function} callback - Hàm callback khi có thay đổi
 * @returns {Function} - Hàm unsubscribe
 */
export const subscribeToDocuments = (callback) => {
  const documentsRef = collection(db, "system", "documents", "items");
  return onSnapshot(documentsRef, (snapshot) => {
    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(documents);
  });
};

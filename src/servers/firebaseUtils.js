import {
  addDoc,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../configs/firebase";

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

export const fetchKnowledgeBase = async () => {
  try {
    const docRef = doc(db, "data", "knowledgeBase");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const knowledgeBaseData = docSnap.data();
      return knowledgeBaseData.data; // Giả sử dữ liệu được lưu trong trường `content`
    } else {
      console.log("No knowledge base found!");
      return "";
    }
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return "";
  }
};

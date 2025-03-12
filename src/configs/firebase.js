// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCdEx77JJFGY8Ppa9tx4gIpfgo9JoEs7Ys",
//   authDomain: "chatbot-rag-1eb24.firebaseapp.com",
//   projectId: "chatbot-rag-1eb24",
//   storageBucket: "chatbot-rag-1eb24.firebasestorage.app",
//   messagingSenderId: "1064014910023",
//   appId: "1:1064014910023:web:932f37a83f71ca684e9762",
//   measurementId: "G-TH8XD5FDBG",
// };

const firebaseConfig = {
  apiKey: "AIzaSyCM-TwU8x4WOe3RneSzzsZ517lwee1iLxA",
  authDomain: "documents-app-50bd0.firebaseapp.com",
  projectId: "documents-app-50bd0",
  storageBucket: "documents-app-50bd0.appspot.com",
  messagingSenderId: "448930022250",
  appId: "1:448930022250:web:37fc5a20fdb81bd6f35b13",
  measurementId: "G-82WEEXKB1H",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

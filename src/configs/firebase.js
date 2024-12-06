// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCdEx77JJFGY8Ppa9tx4gIpfgo9JoEs7Ys",
  authDomain: "chatbot-rag-1eb24.firebaseapp.com",
  projectId: "chatbot-rag-1eb24",
  storageBucket: "chatbot-rag-1eb24.firebasestorage.app",
  messagingSenderId: "1064014910023",
  appId: "1:1064014910023:web:932f37a83f71ca684e9762",
  measurementId: "G-TH8XD5FDBG",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

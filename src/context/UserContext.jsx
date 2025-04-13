import React, { createContext, useEffect, useState } from "react";
import { auth } from "../configs/firebase";
import { onAuthStateChanged } from "firebase/auth";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  // Khôi phục trạng thái remember me từ localStorage khi khởi động
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    const storedUser = localStorage.getItem("user");

    setRememberMe(remembered);
    if (remembered && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Theo dõi trạng thái đăng nhập của Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && rememberMe) {
        // Nếu có rememberMe, giữ nguyên user từ localStorage
      } else if (firebaseUser) {
        // Nếu không có rememberMe, chỉ set user khi có firebaseUser
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } else {
        // Nếu đăng xuất
        if (!rememberMe) {
          localStorage.removeItem("user");
        }
        setUser(null);
      }
    });
    return unsubscribe;
  }, [rememberMe]);

  return (
    <UserContext.Provider
      value={{ user, setUser, rememberMe, setRememberMe, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};

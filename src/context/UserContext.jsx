import React, { createContext, useEffect, useState } from "react";

// Tạo Context
export const UserContext = createContext();

// Tạo Provider
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // State lưu thông tin user

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

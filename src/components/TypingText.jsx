import { Divider } from "@mui/material";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const TypingText = ({ text, speed = 0.05 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        // console.log(text[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
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
      {displayedText}
    </ReactMarkdown>
  );
};

export default TypingText;

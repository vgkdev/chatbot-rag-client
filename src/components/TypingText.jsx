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
      {displayedText}
    </ReactMarkdown>
  );
};

export default TypingText;

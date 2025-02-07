import React, { useState } from "react";
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
  InputBase,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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

const drawerWidth = 240;
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

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
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]); // Lưu danh sách file đã upload
  const [isThinking, setIsThinking] = useState(false);

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
    setChatHistory((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      const response = await model.invoke([
        {
          role: "system",
          content: `Dữ liệu: \n${context}
          You are a chatbot that supports clear, detailed answers and presents them in Markdown and with line breaks when there are titles for error-free conversion. When users ask short or unclear questions, provide comprehensive answers with specific titles and explanations. Avoid guessing but cover every possible aspect relevant to the question.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ]);

      const aiMessage = { role: "assistant", content: response.text };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error in sendMessage:", error);
    } finally {
      setIsThinking(false);
    }
    // // Lấy kết quả trả về từ Gemini API
    // console.log(">>>check response: ", response);
    console.log(">>>check message: ", message);
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
          <IconButton>
            <EditNoteOutlinedIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
      </Drawer>

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
          {chatHistory.map((chat, index) => (
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
                  backgroundColor: chat.role === "user" ? "#303030" : "#242424",
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
                        background: "linear-gradient(45deg, #142ccb, #124acd)",
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
                      <TypingText text={chat.content} />
                    </Box>
                  </Box>
                ) : (
                  chat.content
                )}
              </Box>
            </Box>
          ))}

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
      </Main>
    </Box>
  );
}

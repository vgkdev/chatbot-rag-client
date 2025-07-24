import { useEffect, useRef, useState } from "react";
import {
  ListItem,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  TextField,
  Box,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Check, Close } from "@mui/icons-material";

export const ChatItem2 = ({
  chat,
  loadChat,
  onRename,
  onDelete,
  anchorEl,
  selectedChatId,
  handleMenuOpen,
  handleMenuClose,
  isDeleting,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);
  const inputRef = useRef(null);
  // const renameContainerRef = useRef(null);

  // Tự động focus vào input khi bật chế độ rename
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRenaming]);

  // Xử lý click bên ngoài để hủy rename
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (
  //       isRenaming &&
  //       renameContainerRef.current &&
  //       !renameContainerRef.current.contains(event.target)
  //     ) {
  //       console.log(">>>check click outside");
  //       handleCancelRename();
  //       // setTimeout(() => {
  //       //   handleSaveRename();
  //       // }, 0);
  //     }
  //   };

  //   if (isRenaming) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [isRenaming]);

  const handleRenameClick = () => {
    setIsRenaming(true);
    handleMenuClose();
  };

  const handleSaveRename = () => {
    // console.log(">>>check call save rename", newTitle);

    if (newTitle.trim() && newTitle !== chat.title) {
      onRename(chat.id, newTitle);
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setNewTitle(chat.title);
    setIsRenaming(false);
  };

  return (
    <ListItem
      sx={{
        cursor: "pointer",
        position: "relative",
        borderRadius: "8px",
        backgroundColor: chat.id === selectedChatId ? "#424242" : "#121212", // Nền xanh lam cho chat đang mở, đen cho chat khác
        color: "#ababab",
        "&:hover": {
          backgroundColor: "#424242", // Xám đậm
          color: "#ffffff",
        },
        transition: "all 0.2s",
        mb: 1,
        p: 1,
        paddingRight: isRenaming ? "70px" : "48px", // Thêm khoảng trống cho nút khi rename
        width: "95%",
      }}
      key={chat.id}
      onClick={!isRenaming ? () => loadChat(chat.id) : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isRenaming ? (
        <Box
        // ref={renameContainerRef}
        //   sx={{ width: "100%", position: "relative" }}
        >
          <TextField
            inputRef={inputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveRename();
              if (e.key === "Escape") handleCancelRename();
            }}
            // onBlur={() => {
            //   if (newTitle.trim()) {
            //     onRename(chat.id, newTitle);
            //   }
            //   setIsRenaming(false);
            // }}
            // autoFocus
            variant="standard"
            fullWidth
            sx={{
              "& .MuiInputBase-input": {
                padding: "8px 0",
                color: "#fff",
              },
              "& .MuiInput-underline:before": {
                borderBottomColor: "#555",
              },
              "& .MuiInput-underline:hover:before": {
                borderBottomColor: "#888",
              },
              "& .MuiInput-underline:after": {
                borderBottomColor: "#aaa",
              },
            }}
          />
        </Box>
      ) : (
        <ListItemText primary={chat.title} />
      )}
      {!isRenaming ? (
        <div
          style={{
            position: "absolute",
            right: "1px",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          {isDeleting && selectedChatId === chat.id ? (
            <CircularProgress size={24} sx={{ color: "#fff", mr: 1 }} />
          ) : (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e, chat.id);
              }}
              sx={{ color: "#fff" }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </div>
      ) : (
        <Box
          sx={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            gap: "4px",
          }}
        >
          <IconButton
            onClick={handleSaveRename}
            size="small"
            sx={{
              color: "#4caf50",
              "&:hover": { backgroundColor: "rgba(76, 175, 80, 0.1)" },
            }}
          >
            <Check fontSize="small" />
          </IconButton>
          <IconButton
            onClick={handleCancelRename}
            size="small"
            sx={{
              color: "#f44336",
              "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && selectedChatId === chat.id}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            style: {
              backgroundColor: "#424242",
              color: "#fff",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            },
          },
        }}
      >
        <MenuItem
          onClick={handleRenameClick}
          sx={{
            display: "flex",
            gap: "8px",
            padding: "8px 16px",
            "&:hover": { backgroundColor: "#616161" },
          }}
        >
          <EditIcon sx={{ fontSize: "20px" }} />
          Đổi tên
        </MenuItem>
        <MenuItem
          onClick={() => onDelete(chat.id)}
          sx={{
            display: "flex",
            gap: "8px",
            padding: "8px 16px",
            color: "#ff4d4f",
            "&:hover": { backgroundColor: "#ff4d4f", color: "#fff" },
          }}
        >
          <DeleteIcon sx={{ fontSize: "20px" }} />
          Xóa
        </MenuItem>
      </Menu>
    </ListItem>
  );
};

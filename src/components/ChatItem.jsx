import { useState } from "react";
import {
  ListItem,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  TextField,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export const ChatItem = ({
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

  const handleRenameClick = () => {
    setIsRenaming(true);
    handleMenuClose();
  };

  const handleRenameSubmit = (e) => {
    if (e.key === "Enter" && newTitle.trim()) {
      onRename(chat.id, newTitle);
      setIsRenaming(false);
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setNewTitle(chat.title); // Khôi phục tiêu đề gốc nếu hủy
    }
  };

  return (
    <ListItem
      sx={{
        cursor: "pointer",
        position: "relative",
        "&:hover": {
          backgroundColor: "#2f2f2f",
        },
      }}
      key={chat.id}
      onClick={!isRenaming ? () => loadChat(chat.id) : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isRenaming ? (
        <TextField
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleRenameSubmit}
          // onBlur={() => {
          //   if (newTitle.trim()) {
          //     onRename(chat.id, newTitle);
          //   }
          //   setIsRenaming(false);
          // }}
          autoFocus
          fullWidth
          sx={{
            "& .MuiInputBase-input": {
              padding: "8px",
              color: "#fff",
              backgroundColor: "#333",
              borderRadius: "4px",
            },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#555",
              },
              "&:hover fieldset": {
                borderColor: "#888",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#aaa",
              },
            },
          }}
        />
      ) : (
        <ListItemText primary={chat.title} />
      )}
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
          Rename
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
          Delete
        </MenuItem>
      </Menu>
    </ListItem>
  );
};

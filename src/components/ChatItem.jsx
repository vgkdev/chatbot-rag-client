import { useState } from "react";
import {
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import useSnackbarUtils from "../utils/useSnackbarUtils.jsx";

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
  const { showSuccess, showError, showWarning } = useSnackbarUtils();
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);

  const handleRenameClick = () => {
    setNewTitle(chat.title);
    setIsRenaming(true);
    handleMenuClose();
  };

  const handleSaveTitle = async () => {
    if (!newTitle.trim()) {
      showWarning("Tiêu đề không được để trống!", 3000);
      setIsRenaming(false);
      return;
    }
    try {
      await onRename(chat.id, newTitle);
      setIsRenaming(false);
      showSuccess("Cập nhật tiêu đề thành công!", 4000);
    } catch (error) {
      showError("Lỗi khi cập nhật tiêu đề. Vui lòng thử lại.", 6000);
      setIsRenaming(false);
    }
  };

  const handleCancelEdit = () => {
    setNewTitle(chat.title);
    setIsRenaming(false);
  };

  return (
    <ListItem
      sx={{
        cursor: "pointer",
        position: "relative",
        borderRadius: "8px",
        backgroundColor: "#121212", // Đen
        "&:hover": {
          backgroundColor: "#424242", // Xám đậm
          color: "#ffffff",
        },
        transition: "all 0.2s",
        mb: 1,
        p: 1,
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
          autoFocus
          fullWidth
          size="small"
          sx={{
            "& .MuiInputBase-input": {
              padding: "8px",
              color: "#ffffff",
              backgroundColor: "#424242", // Xám đậm
              borderRadius: "4px",
            },
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#B0B0B0", // Xám nhạt
              },
              "&:hover fieldset": {
                borderColor: "#E0E0E0", // Xám sáng
              },
              "&.Mui-focused fieldset": {
                borderColor: "#E0E0E0",
              },
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleSaveTitle}
                  sx={{
                    color: "#4caf50",
                    "&:hover": { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                    transition: "all 0.2s",
                  }}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={handleCancelEdit}
                  sx={{
                    color: "#f44336",
                    "&:hover": { backgroundColor: "rgba(244, 67, 54, 0.1)" },
                    transition: "all 0.2s",
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      ) : (
        <ListItemText
          primary={chat.title}
          primaryTypographyProps={{
            fontWeight: "medium",
            color: isHovered ? "#ffffff" : "#B0B0B0", // Xám nhạt
          }}
        />
      )}
      {!isRenaming && (
        <Box
          sx={{
            position: "absolute",
            right: "8px",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          {isDeleting && selectedChatId === chat.id ? (
            <CircularProgress size={24} sx={{ color: "#ffffff", mr: 1 }} />
          ) : (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleMenuOpen(e, chat.id);
              }}
              sx={{ color: isHovered ? "#ffffff" : "#B0B0B0" }}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>
      )}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && selectedChatId === chat.id}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#121212", // Đen
              color: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
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

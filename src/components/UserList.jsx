import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  deleteUserData,
  fetchAllUsers,
  subscribeToUsers,
  updateUserData,
} from "../servers/firebaseUtils";
import { Delete, Edit } from "@mui/icons-material";
import useSnackbarUtils from "../utils/useSnackbarUtils";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editForm, setEditForm] = useState({
    userName: "",
    role: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError, showWarning } = useSnackbarUtils(); // Sử dụng useSnackbarUtils

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToUsers((users) => {
      setUsers(users);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Fetch user data from Firestore
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userList = await fetchAllUsers();
      setUsers(userList);
      showSuccess("Lấy danh sách người dùng thành công!");
    } catch (error) {
      console.error("Error:", error);
      showError("Lỗi khi lấy danh sách người dùng!");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await deleteUserData(userId);
      showSuccess("Xóa người dùng thành công!");
    } catch (error) {
      console.error("Error:", error);
      showError("Lỗi khi xóa người dùng!");
    }
  };

  const handleUpdateUser = async () => {
    // Kiểm tra nếu userName trống
    if (!editForm.userName.trim()) {
      showWarning("Tên người dùng không được để trống!");
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser = await updateUserData(currentUser.id, {
        userName: editForm.userName,
        role: editForm.role,
      });
      showSuccess("Cập nhật người dùng thành công!");
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error:", error);
      showError("Lỗi khi cập nhật người dùng!");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setEditForm({
      userName: user.userName,
      role: user.role || 0,
    });
    setEditModalOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "role" ? parseInt(value) : value,
    }));
  };

  // Function to convert role number to text
  const getRoleDisplay = (role) => {
    switch (role) {
      case 0:
        return { label: "Sinh viên", color: "#2196F3" };
      case 1:
        return { label: "Quản trị viên", color: "#FF9800" };
      case 2:
        return { label: "Giảng viên", color: "#00C853" };
      default:
        return { label: "Không xác định", color: "grey" };
    }
  };

  const userColumns = [
    { field: "id", headerName: "ID", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    { field: "userName", headerName: "Tên", width: 200 },
    {
      field: "role",
      headerName: "Vai trò",
      width: 150,
      renderCell: (params) => {
        const { label, color } = getRoleDisplay(params.value);
        return (
          <Chip
            label={label}
            sx={{
              backgroundColor: color,
              color: "white",
              fontWeight: "bold",
              fontSize: "0.75rem",
            }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            color="primary"
            onClick={() => openEditModal(params.row)}
            aria-label="edit"
          >
            <Edit />
          </IconButton>
          {/* <IconButton
            color="error"
            onClick={() => deleteUser(params.row.id)}
            aria-label="delete"
          >
            <Delete />
          </IconButton> */}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ padding: 2, backgroundColor: "#121212", color: "white" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Danh sách người dùng
      </Typography>

      <Box sx={{ height: 400, backgroundColor: "#1e1e1e" }}>
        <DataGrid
          rows={users}
          columns={userColumns}
          pageSize={5}
          loading={loading}
          disableSelectionOnClick
          sx={{
            "& .MuiDataGrid-cell": {
              color: "white",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#333",
              color: "#b3b3b3",
            },
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: "#333",
              color: "#b3b3b3",
            },
          }}
        />
      </Box>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Tên người dùng"
            name="userName"
            value={editForm.userName}
            onChange={handleEditFormChange}
            sx={{ mb: 3 }}
          />

          <FormControl fullWidth>
            <InputLabel>Vai trò</InputLabel>
            <Select
              name="role"
              value={editForm.role}
              label="Vai trò"
              onChange={handleEditFormChange}
            >
              <MenuItem value={0}>Sinh viên</MenuItem>
              <MenuItem value={1}>Quản trị viên</MenuItem>
              <MenuItem value={2}>Giảng viên</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Hủy</Button>
          <Button
            onClick={handleUpdateUser}
            variant="contained"
            color="primary"
            disabled={isSaving}
          >
            {isSaving ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Cập nhật"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList;

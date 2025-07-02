import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
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
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../configs/firebase";
import {
  deleteUserData,
  fetchAllUsers,
  subscribeToUsers,
  updateUserData,
} from "../servers/firebaseUtils";
import { Delete, Edit } from "@mui/icons-material";
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

  // useEffect(() => {
  //   fetchUsers();
  // }, []);
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
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await deleteUserData(userId);
      // setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleUpdateUser = async () => {
    try {
      setIsSaving(true);
      const updatedUser = await updateUserData(currentUser.id, {
        userName: editForm.userName,
        role: editForm.role,
      });

      // setUsers(
      //   users.map((user) => (user.id === currentUser.id ? updatedUser : user))
      // );
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error:", error);
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
  const getRoleText = (role) => {
    switch (role) {
      case 0:
        return "Sinh viên";
      case 1:
        return "Quản trị viên";
      case 2:
        return "Giảng viên";
      default:
        return "Không xác định";
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
      valueGetter: (params) => getRoleText(params),
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
          <IconButton
            color="error"
            onClick={() => deleteUser(params.row.id)}
            aria-label="delete"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ padding: 2, backgroundColor: "#121212", color: "white" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        User List
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

import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import { UserContext } from "../context/UserContext";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../configs/firebase";
import { getMajors, updateUserProfile } from "../servers/firebaseUtils";
import useSnackbarUtils from "../utils/useSnackbarUtils";

export const ProfilePage = () => {
  const { user, setUser } = useContext(UserContext);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    userName: "",
    major: null,
  });
  const [majors, setMajors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbarUtils();

  useEffect(() => {
    const loadMajors = async () => {
      try {
        const majorsData = await getMajors();
        setMajors(majorsData);
      } catch (error) {
        console.error("Error loading majors:", error);
        showError("Lỗi khi tải danh sách chuyên ngành!", 6000);
      }
    };
    loadMajors();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        userName: user.userName,
        major: user.major,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMajorChange = (event) => {
    const selectedMajorId = event.target.value;
    const selectedMajor = majors.find((major) => major.id === selectedMajorId);
    setFormData((prev) => ({ ...prev, major: selectedMajor }));
  };

  const handleSave = async () => {
    if (!formData.userName || !formData.major) {
      showError("Vui lòng điền đầy đủ thông tin!", 4000);
      return;
    }
    try {
      setLoading(true);

      // Prepare the complete user data
      const updatedUserData = {
        userId: user.userId,
        userName: formData.userName,
        email: user.email, // Keep original email
        role: user.role, // Keep original role
        major: formData.major,
      };

      const updatedUser = await updateUserProfile(user.userId, updatedUserData);

      console.log(">>>check updatedUser", updatedUser);

      // Update local state
      setUser(updatedUser);

      // Save to localStorage with the exact structure
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: updatedUser.userId,
          userName: updatedUser.userName,
          email: updatedUser.email,
          role: updatedUser.role,
          major: updatedUser.major,
        })
      );

      showSuccess("Cập nhật hồ sơ thành công!", 4000);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      showError("Lỗi khi cập nhật hồ sơ. Vui lòng thử lại.", 6000);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 600,
          borderRadius: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar
            sx={{
              width: 100,
              height: 100,
              fontSize: 40,
              bgcolor: "primary.main",
              mb: 2,
            }}
          >
            {user.userName.charAt(0).toUpperCase()}
          </Avatar>

          <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
            {user.userName || "User Profile"}
          </Typography>

          <Box sx={{ width: "100%", mb: 3 }}>
            <Typography variant="subtitle1">Email</Typography>
            <Typography>{user.email}</Typography>
            <Divider sx={{ my: 2 }} />
          </Box>

          {editMode ? (
            <>
              <TextField
                fullWidth
                label="Tên người dùng"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Chuyên ngành</InputLabel>
                <Select
                  value={formData.major?.id || ""}
                  onChange={handleMajorChange}
                  label="Major"
                >
                  {majors.map((major) => (
                    <MenuItem key={major.id} value={major.id}>
                      {major.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Lưu"
                  )}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(false)}
                  fullWidth
                >
                  Hủy
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ width: "100%", mb: 3 }}>
                <Typography variant="subtitle1">Tên người dùng</Typography>
                <Typography>{user.userName}</Typography>
                <Divider sx={{ my: 2 }} />
              </Box>

              <Box sx={{ width: "100%", mb: 3 }}>
                <Typography variant="subtitle1">Chuyên ngành</Typography>
                <Typography>{user.major?.name || "Not specified"}</Typography>
                <Divider sx={{ my: 2 }} />
              </Box>

              <Button
                variant="contained"
                onClick={() => setEditMode(true)}
                fullWidth
              >
                Chỉnh sửa
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

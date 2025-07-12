import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Link,
} from "@mui/material";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../configs/firebase";
import {
  doc,
  setDoc,
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { getMajors } from "../servers/firebaseUtils";
import useSnackbarUtils from "../utils/useSnackbarUtils";

export const RegisterPage = () => {
  const { setUser } = useContext(UserContext);
  const { showSuccess, showError } = useSnackbarUtils();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "", // Thêm trường confirmPassword
    major: null,
  });
  const [errors, setErrors] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false, // Thêm lỗi cho confirmPassword
    major: false,
  });
  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState([]);
  const navigate = useNavigate();

  // Fetch majors from Firebase
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const majorsData = await getMajors();
        setMajors(majorsData);
      } catch (error) {
        console.error("Error fetching majors:", error);
        showError("Không thể tải danh sách chuyên ngành. Vui lòng thử lại.");
      }
    };
    fetchMajors();
  }, [showError]);

  const validateForm = () => {
    const newErrors = {
      username: formData.username.trim() === "",
      email: formData.email === "" || !/^\S+@\S+\.\S+$/.test(formData.email),
      password: formData.password === "" || formData.password.length < 6,
      confirmPassword:
        formData.confirmPassword === "" ||
        formData.confirmPassword !== formData.password,
      major: formData.major === null,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleMajorChange = (event) => {
    const selectedMajorId = event.target.value;
    const selectedMajor = majors.find((major) => major.id === selectedMajorId);
    setFormData((prev) => ({ ...prev, major: selectedMajor }));
    if (errors.major) {
      setErrors((prev) => ({ ...prev, major: false }));
    }
  };

  const checkEmailExists = async (email) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty; // Trả về true nếu email đã tồn tại
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      if (errors.confirmPassword) {
        showError("Mật khẩu xác nhận không khớp!");
      }
      return;
    }

    try {
      setLoading(true);

      // Kiểm tra xem email đã tồn tại chưa
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setErrors((prev) => ({ ...prev, email: true }));
        showError("Email đã được sử dụng. Vui lòng chọn email khác.");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;
      const userData = {
        userId: user.uid,
        userName: formData.username,
        email: user.email,
        role: 0,
        major: formData.major,
      };

      await setDoc(doc(db, "users", user.uid), userData);

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      setLoading(false);
      showSuccess("Đăng ký thành công! Chào mừng bạn đến với hệ thống.");
      navigate("/homepage");
    } catch (error) {
      console.error("Registration error:", error.message);
      showError("Đăng ký thất bại. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <Grid
      container
      component="main"
      sx={{
        minHeight: "100vh",
        backgroundImage: "linear-gradient(135deg, #121212 0%, #1e1e1e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Grid item xs={12} sm={8} md={6} lg={4}>
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 4,
            backgroundColor: "rgba(30, 30, 30, 0.9)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              sx={{
                mb: 3,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Tạo tài khoản
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ width: "100%" }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Tên người dùng"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                helperText={errors.username && "Tên người dùng là bắt buộc"}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {},
                  },
                  "& .MuiInputLabel-root": {
                    color: "#b3b3b3",
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                helperText={errors.email && "Vui lòng nhập email hợp lệ"}
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {},
                  },
                  "& .MuiInputLabel-root": {
                    color: "#b3b3b3",
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Mật khẩu"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                helperText={
                  errors.password && "Mật khẩu phải có ít nhất 6 ký tự"
                }
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {},
                  },
                  "& .MuiInputLabel-root": {
                    color: "#b3b3b3",
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                helperText={
                  errors.confirmPassword && "Mật khẩu xác nhận không khớp"
                }
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {},
                  },
                  "& .MuiInputLabel-root": {
                    color: "#b3b3b3",
                  },
                }}
              />

              <FormControl
                fullWidth
                margin="normal"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    color: "white",
                    "& fieldset": {
                      borderColor: "#555",
                    },
                    "&:hover fieldset": {},
                  },
                  "& .MuiInputLabel-root": {
                    color: "#b3b3b3",
                  },
                }}
              >
                <InputLabel id="major-label">Chuyên ngành</InputLabel>
                <Select
                  labelId="major-label"
                  id="major"
                  name="major"
                  value={formData.major?.id || ""}
                  onChange={handleMajorChange}
                  label="Chuyên ngành"
                  error={errors.major}
                  renderValue={(selected) => {
                    if (!selected) return <em>Chọn chuyên ngành</em>;
                    const major = majors.find((m) => m.id === selected);
                    return major?.name || selected;
                  }}
                >
                  <MenuItem value="">
                    <em>Chọn chuyên ngành</em>
                  </MenuItem>
                  {majors.map((major) => (
                    <MenuItem key={major.id} value={major.id}>
                      {major.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.major && (
                  <Typography variant="caption" color="error">
                    Chuyên ngành là bắt buộc
                  </Typography>
                )}
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  color: "black",
                  "&:hover": {
                    transform: "translateY(-2px)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Đăng ký"
                )}
              </Button>

              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link
                    component={RouterLink}
                    to="/login"
                    variant="body2"
                    sx={{
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Đã có tài khoản? Đăng nhập
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

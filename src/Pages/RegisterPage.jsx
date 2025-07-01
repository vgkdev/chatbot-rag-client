import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
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
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { getMajors } from "../servers/firebaseUtils";

export const RegisterPage = () => {
  const { setUser } = useContext(UserContext);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    major: null,
  });
  const [errors, setErrors] = useState({
    username: false,
    email: false,
    password: false,
    major: false,
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
        setErrorMessage("Failed to load majors. Please refresh the page.");
      }
    };
    fetchMajors();
  }, []);

  const validateForm = () => {
    const newErrors = {
      username: formData.username === "",
      email: formData.email === "" || !/^\S+@\S+\.\S+$/.test(formData.email),
      password: formData.password === "" || formData.password.length < 6,
      major: formData.major === null,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setLoading(true);
        setErrorMessage("");

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

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        await setDoc(doc(db, "users", user.uid), userData);

        setLoading(false);
        setSuccessMessage("Registration Successful! Redirecting...");

        // setTimeout(() => navigate("/homepage"), 2000);
        navigate("/homepage");
      } catch (error) {
        console.error("Registration error:", error.message);
        setErrorMessage(
          error.message || "Registration failed. Please try again."
        );
        setLoading(false);
      }
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

            {successMessage && (
              <Alert severity="success" sx={{ width: "100%", mb: 3 }}>
                {successMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert severity="error" sx={{ width: "100%", mb: 3 }}>
                {errorMessage}
              </Alert>
            )}

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
                helperText={errors.username && "Username is required"}
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
                helperText={errors.email && "Please enter a valid email"}
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
                  errors.password && "Password must be at least 6 characters"
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
                  label="Major"
                  error={errors.major}
                  renderValue={(selected) => {
                    if (!selected) return <em>Select your major</em>;
                    const major = majors.find((m) => m.id === selected);
                    return major?.name || selected;
                  }}
                >
                  <MenuItem value="">
                    <em>Chuyên ngành của bạn</em>
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
                  // fontWeight: "bold",
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

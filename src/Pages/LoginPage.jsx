import React, { useState, useContext } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Link,
  Paper,
  Grid,
  Divider,
  Container,
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, db } from "../configs/firebase";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { doc, getDoc } from "firebase/firestore";
import useSnackbarUtils from "../utils/useSnackbarUtils.jsx";

export const LoginPage = () => {
  const { setUser, setRememberMe } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbarUtils();

  const validateForm = () => {
    let isValid = true;
    if (email === "" || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError(true);
      isValid = false;
    } else {
      setEmailError(false);
    }
    if (password === "") {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setLoading(true);

        const persistence = remember
          ? browserLocalPersistence
          : browserSessionPersistence;
        await setPersistence(auth, persistence);

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        const userData = docSnap.data();

        setUser(userData);
        setRememberMe(remember);

        if (remember) {
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }

        setLoading(false);
        showSuccess("Đăng nhập thành công! Chào mừng bạn trở lại.");
        navigate("/");
      } catch (error) {
        console.error("Login error: ", error.message);
        setLoading(false);
        if (
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          showError("Email hoặc mật khẩu không chính xác.", 6000);
        } else if (error.code === "auth/invalid-credential") {
          showError("Email hoặc mật khẩu không hợp lệ.", 6000);
        } else {
          showError("Đăng nhập thất bại. Vui lòng thử lại.", 6000);
        }
        // setErrorMessage("Invalid email or password. Please try again.");
      }
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          p: 4,
          borderRadius: 2,
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
            sx={{ mb: 3, fontWeight: 700, textAlign: "center" }}
          >
            Chat Bot Hỗ Trợ Tìm Kiếm Tài Liệu
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Đăng nhập để tiếp tục vào tài khoản của bạn
          </Typography>

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
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              helperText={emailError && "Vui lòng nhập email"}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mật khẩu"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
              helperText={passwordError && "Vui lòng nhập mật khẩu"}
              sx={{ mb: 1 }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    color="primary"
                  />
                }
                label="Ghi nhớ đăng nhập"
              />
              {/* <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
              >
                Quên mật khẩu?
              </Link> */}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                backgroundColor: "#1976d2",
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Đăng nhập"
              )}
            </Button>

            <Divider sx={{ my: 3 }}>Hoặc</Divider>

            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Chưa có tài khoản?{" "}
                <Link
                  component={RouterLink}
                  to="/register"
                  variant="body2"
                  sx={{ fontWeight: 600 }}
                >
                  Đăng ký ngay
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

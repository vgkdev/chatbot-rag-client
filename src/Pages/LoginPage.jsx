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
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, db } from "../configs/firebase";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { doc, getDoc } from "firebase/firestore";

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

        // Thiết lập persistence dựa trên remember me
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

        // Lưu thông tin user và remember me
        setUser(userData);
        setRememberMe(remember);

        if (remember) {
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
          // Không xóa user ngay để tránh flash khi reload
        }

        setLoading(false);
        navigate("/homepage");
      } catch (error) {
        console.error("Login error: ", error.message);
        setLoading(false);
        setErrorMessage("Invalid email or password. Please try again.");
      }
    }
  };

  return (
    <Box
      sx={
        {
          /* styles giữ nguyên */
        }
      }
    >
      <Box
        sx={
          {
            /* styles giữ nguyên */
          }
        }
      >
        <Typography variant="h5" sx={{ mb: 3, textAlign: "center" }}>
          Login
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            helperText={emailError && "Enter a valid email"}
            fullWidth
            sx={
              {
                /* styles giữ nguyên */
              }
            }
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            helperText={passwordError && "Password is required"}
            fullWidth
            sx={
              {
                /* styles giữ nguyên */
              }
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                color="primary"
              />
            }
            label="Remember me"
            sx={{ color: "#b3b3b3", mb: 2 }}
          />

          {loading ? (
            <Button
              variant="contained"
              fullWidth
              disabled
              sx={
                {
                  /* styles giữ nguyên */
                }
              }
            >
              <CircularProgress size="30px" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="contained"
              fullWidth
              sx={
                {
                  /* styles giữ nguyên */
                }
              }
            >
              Login
            </Button>
          )}
        </>
      </Box>
    </Box>
  );
};

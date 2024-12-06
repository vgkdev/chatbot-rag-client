import React, { useState, useContext } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../configs/firebase";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { doc, getDoc } from "firebase/firestore";

export const LoginPage = () => {
  const { setUser } = useContext(UserContext);

  // State for form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State for errors
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Loading and success states
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
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        console.log(">>>check user login: ", docSnap.data());
        const userData = docSnap.data();

        setUser({
          id: userData.userId,
          email: userData.email,
          userName: userData.userName,
        });
        localStorage.setItem("user", JSON.stringify(userData));

        setLoading(false);
        setErrorMessage("");

        // Navigate to homepage
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
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "white",
      }}
    >
      <Box
        sx={{
          width: 400,
          padding: 3,
          backgroundColor: "#1e1e1e",
          borderRadius: 2,
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.5)",
        }}
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
            variant="outlined"
            size="small"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                color: "white",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#555",
              },
              "& .MuiFormHelperText-root": {
                color: "red",
              },
              "& .MuiInputLabel-root": {
                color: "#b3b3b3",
              },
            }}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            helperText={passwordError && "Password is required"}
            fullWidth
            variant="outlined"
            size="small"
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                color: "white",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#555",
              },
              "& .MuiFormHelperText-root": {
                color: "red",
              },
              "& .MuiInputLabel-root": {
                color: "#b3b3b3",
              },
            }}
          />

          {loading ? (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled
              sx={{
                bgcolor: "#00C853",
                color: "black",
                "&:hover": {
                  bgcolor: "#00b84d",
                },
              }}
            >
              <CircularProgress size="30px" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                bgcolor: "#00C853",
                color: "black",
                "&:hover": {
                  bgcolor: "#00b84d",
                },
              }}
            >
              Login
            </Button>
          )}
        </>
      </Box>
    </Box>
  );
};

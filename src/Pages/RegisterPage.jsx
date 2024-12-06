import React, { useState, useContext } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../configs/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

export const RegisterPage = () => {
  const { setUser } = useContext(UserContext);

  // Individual states for form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Individual states for errors
  const [usernameError, setUsernameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Success message
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const validateForm = () => {
    let isValid = true;

    if (username === "") {
      setUsernameError(true);
      isValid = false;
    } else {
      setUsernameError(false);
    }

    if (email === "" || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError(true);
      isValid = false;
    } else {
      setEmailError(false);
    }

    if (password === "" || password.length < 6) {
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
      //   setSuccessMessage("Registration Successful!");

      try {
        setLoading(true);
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        console.log(">>>check user: ", user);

        setUser({
          id: user.uid,
          userName: username,
          email: user.email,
        });
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.uid,
            userName: username,
            email: user.email,
          })
        );

        // Lưu thông tin vào Firestore
        await setDoc(doc(db, "users", user.uid), {
          userId: user.uid,
          userName: username,
          email: email,
        });

        setLoading(false);
        setSuccessMessage("Registration Successful!");
        setUsername("");
        setEmail("");
        setPassword("");

        navigate("/homepage");
      } catch (error) {
        console.error(">>>check error: ", error.message);
        setSuccessMessage("");
      }
    } else {
      setSuccessMessage("");
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
          Register
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={usernameError}
            helperText={usernameError && "Username is required"}
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
            helperText={
              passwordError && "Password must be at least 6 characters long"
            }
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
              Register
            </Button>
          )}
        </>
      </Box>
    </Box>
  );
};

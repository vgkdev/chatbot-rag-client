import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "white",
        textAlign: "center",
        p: 3,
      }}
    >
      <Typography variant="h4" sx={{ mb: 2 }}>
        403 - Forbidden
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        You dont have permission to access this page.
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate("/homepage")}
        sx={{
          bgcolor: "#00C853",
          color: "black",
          "&:hover": {
            bgcolor: "#00b84d",
          },
        }}
      >
        Go to Homepage
      </Button>
    </Box>
  );
};

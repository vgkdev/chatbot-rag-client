import React, { useContext } from "react";
import { Box, Tabs, Tab, Button } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { FilesTab } from "../components/FilesTab";
import { ResourcesTab } from "../components/ResourcesTab";
import { UserContext } from "../context/UserContext";

export const Settings = () => {
  const { user, loading, setUser } = useContext(UserContext);
  const [tabValue, setTabValue] = React.useState(0);

  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBackToChat = () => {
    navigate("/homepage");
    // console.log("Navigating back to Chat");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#121212",
        minHeight: "100vh",
        p: 3,
        color: "white",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 24,
          right: 24,
          display: "flex",
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          onClick={handleBackToChat}
          sx={{
            bgcolor: "#00C853",
            "&:hover": { backgroundColor: "#089242" },
            color: "black",
          }}
        >
          Quay lại Chat
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleLogout}
          sx={{
            bgcolor: "#D32F2F",
            "&:hover": { backgroundColor: "#B71C1C" },
            color: "white",
          }}
        >
          Đăng xuất
        </Button>
      </Box>

      {/* Top Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        textColor="inherit"
        // indicatorColor="secondary"
        sx={{ mt: 4 }} // Adjusting for the button above
      >
        {user.role === 2 && <Tab label="Tài liệu" />}
        {user.role === 1 && <Tab label="Tài nguyên" />}
        {/* <Tab label="Settings" /> */}
        {/* <Tab label="Help" /> */}
      </Tabs>

      {user.role === 2 && tabValue === 0 && <FilesTab />}
      {user.role === 1 && tabValue === 0 && <ResourcesTab />}
    </Box>
  );
};

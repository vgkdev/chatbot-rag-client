import React from "react";
import { Box, Tabs, Tab, Button } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { FilesTab } from "../components/FilesTab";
import { ResourcesTab } from "../components/ResourcesTab";

export const Settings = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBackToChat = () => {
    navigate("/homepage");
    // console.log("Navigating back to Chat");
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
      {/* Back to Chat Button */}
      <Button
        variant="contained"
        color="secondary"
        onClick={handleBackToChat}
        sx={{
          position: "absolute",
          top: 24,
          right: 24,
          bgcolor: "#00C853",
          "&:hover": { backgroundColor: "#089242" },
          color: "black",
        }}
      >
        Back to Chat
      </Button>

      {/* Top Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        textColor="inherit"
        // indicatorColor="secondary"
        sx={{ mt: 4 }} // Adjusting for the button above
      >
        <Tab label="Files" />
        <Tab label="Resources" />
        {/* <Tab label="Settings" /> */}
        {/* <Tab label="Help" /> */}
      </Tabs>

      {/* Files Tab */}
      {tabValue === 0 && <FilesTab />}

      {/* Resources Tab */}
      {tabValue === 1 && <ResourcesTab />}
    </Box>
  );
};

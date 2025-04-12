import { Box, Divider, Tab, Tabs } from "@mui/material";
import React, { useState } from "react";
import UserList from "./UserList";

export const ResourcesTab = () => {
  const [resourceTabValue, setResourceTabValue] = useState(0);

  const handleResourceTabChange = (event, newValue) => {
    setResourceTabValue(newValue);
  };

  return (
    <Box sx={{ padding: 2, backgroundColor: "#121212", color: "white" }}>
      {/* Chỉ giữ lại tab Users */}
      <Tabs
        value={resourceTabValue}
        onChange={handleResourceTabChange}
        textColor="inherit"
      >
        <Tab label="Users" />
      </Tabs>

      <Divider sx={{ mt: 2, mb: 3, bgcolor: "gray" }} />

      {/* Chỉ hiển thị UserList */}
      <UserList />
    </Box>
  );
};

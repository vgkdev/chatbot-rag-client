import { Box, Divider, Tab, Tabs } from "@mui/material";
import React, { useState } from "react";
import UserList from "./UserList";
import { SubjectList } from "./SubjectList";
import { MajorList } from "./MajorList";

export const ResourcesTab = () => {
  const [resourceTabValue, setResourceTabValue] = useState(0);

  const handleResourceTabChange = (event, newValue) => {
    setResourceTabValue(newValue);
  };

  return (
    <Box sx={{ padding: 2, backgroundColor: "#121212", color: "white" }}>
      <Tabs
        value={resourceTabValue}
        onChange={handleResourceTabChange}
        textColor="inherit"
      >
        <Tab label="Người dùng" />
        <Tab label="Môn học" />
        <Tab label="Chuyên ngành" />
      </Tabs>

      <Divider sx={{ mt: 2, mb: 3, bgcolor: "gray" }} />

      {/* {resourceTabValue === 0 ? <UserList /> : <SubjectList />} */}
      {resourceTabValue === 0 && <UserList />}
      {resourceTabValue === 1 && <SubjectList />}
      {resourceTabValue === 2 && <MajorList />}
    </Box>
  );
};

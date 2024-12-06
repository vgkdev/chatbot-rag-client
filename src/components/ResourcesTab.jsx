import {
  Box,
  Button,
  Divider,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import React, { useState } from "react";
import UserList from "./UserList";

export const ResourcesTab = () => {
  const [resourceTabValue, setResourceTabValue] = useState(0);

  const handleResourceTabChange = (event, newValue) => {
    setResourceTabValue(newValue);
  };

  const resourceRows = [
    { id: 1, name: "File", indexType: "FileIndex" },
    { id: 2, name: "GraphRAG", indexType: "GraphRAGIndex" },
  ];

  const resourceColumns = [
    { field: "id", headerName: "ID", width: 100 },
    {
      field: "name",
      headerName: "Name",
      width: 200,
      cellClassName: "resource-name-cell",
    },
    { field: "indexType", headerName: "Index Type", width: 150 },
  ];

  return (
    <Box sx={{ padding: 2, backgroundColor: "#121212", color: "white" }}>
      {/* Sub Tabs for Resources */}
      <Tabs
        value={resourceTabValue}
        onChange={handleResourceTabChange}
        textColor="inherit"
        // TabIndicatorProps={{ style: { backgroundColor: "#00C853" } }}
        // sx={{
        //   "& .MuiTab-root": {
        //     color: "#b3b3b3",
        //     "&.Mui-selected": {
        //       color: "#00C853",
        //     },
        //   },
        // }}
      >
        <Tab label="Index Collections" />
        <Tab label="LLMs" />
        <Tab label="Embeddings" />
        <Tab label="Rerankings" />
        <Tab label="Users" />
      </Tabs>
      <Divider sx={{ mt: 2, mb: 3, bgcolor: "gray" }} />

      {/* Content for Resources */}
      {resourceTabValue === 0 && (
        <Box>
          <Tabs
            value={0}
            textColor="inherit"
            // sx={{
            //   "& .MuiTab-root": {
            //     color: "#b3b3b3",
            //     "&.Mui-selected": {
            //       color: "#00C853",
            //     },
            //   },
            // }}
          >
            <Tab label="View" />
            <Tab label="Add" />
          </Tabs>
          <Divider sx={{ mt: 1, mb: 3, bgcolor: "gray" }} />

          {/* Index Collections Content */}
          <Box sx={{ height: 300, width: "100%", backgroundColor: "#1e1e1e" }}>
            <DataGrid
              rows={resourceRows}
              columns={resourceColumns}
              pageSize={5}
              disableSelectionOnClick
              sx={{
                "& .MuiDataGrid-cell": {
                  color: "white",
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#333",
                  color: "#b3b3b3",
                },
                "& .MuiDataGrid-footerContainer": {
                  backgroundColor: "#333",
                  color: "#b3b3b3",
                },
                "& .resource-name-cell": {
                  fontWeight: "bold",
                  color: "#00C853",
                },
              }}
            />
          </Box>
        </Box>
      )}

      {/* Add New Resource Content */}
      {resourceTabValue === 1 && (
        <Box>
          <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
            Add New Resource
          </Typography>
          <TextField
            placeholder="Resource Name"
            fullWidth
            variant="outlined"
            size="small"
            sx={{
              mb: 2,
              bgcolor: "#333",
              "& .MuiOutlinedInput-root": {
                color: "white",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#555",
              },
              "& .MuiInputBase-input": {
                color: "#b3b3b3",
              },
            }}
          />
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ mt: 2, bgcolor: "#00C853", color: "black" }}
          >
            Add Resource
          </Button>
        </Box>
      )}

      {resourceTabValue === 4 && <UserList />}
    </Box>
  );
};

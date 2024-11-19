import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import FolderIcon from "@mui/icons-material/Folder";

const FileUploadContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: "#1e1e1e",
  color: "#b3b3b3",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
}));

export const FilesTab = () => {
  const [subTabValue, setSubTabValue] = useState(0);
  const handleSubTabChange = (event, newValue) => {
    setSubTabValue(newValue);
  };

  const columns = [
    { field: "name", headerName: "Name", width: 150 },
    { field: "size", headerName: "Size", width: 100 },
    { field: "token", headerName: "Token Loader", width: 130 },
    { field: "created", headerName: "Date Created", width: 150 },
  ];
  const rows = [];
  return (
    <Box sx={{ padding: 2 }}>
      {/* Sub Tabs */}
      <Tabs
        value={subTabValue}
        onChange={handleSubTabChange}
        textColor="inherit"
      >
        <Tab label="File Collection" />
        <Tab label="GraphRAG Collection" />
      </Tabs>

      <Divider sx={{ mt: 2, mb: 3, bgcolor: "gray" }} />

      {/* File Upload and List */}
      <Box display="flex" gap={3}>
        {/* File Upload Section */}
        <Box width="30%">
          <FileUploadContainer>
            <CloudUploadIcon fontSize="large" />
            <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
              Drop File Here <br /> - or - <br /> Click to Upload
            </Typography>
            <Typography variant="caption" color="gray">
              Supported file types: .png, .jpeg, .jpg, .tiff, .pdf, .xls, .doc,
              .html, .txt, etc.
            </Typography>
            <Typography variant="caption" color="gray">
              Maximum file size: 1000 MB
            </Typography>
          </FileUploadContainer>

          {/* Advanced Options */}
          <Typography variant="body2" color="white" sx={{ mb: 1 }}>
            Advanced indexing options
          </Typography>
          <FormControlLabel
            control={<Checkbox color="secondary" />}
            label={
              <Typography variant="caption" color="gray">
                Force reindex file
              </Typography>
            }
            sx={{ ml: 1 }}
          />

          {/* Upload Button */}
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ mt: 2, bgcolor: "#00C853", color: "black" }}
          >
            Upload and Index
          </Button>
        </Box>

        {/* File List Section */}
        <Box width="70%">
          <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
            File List
          </Typography>

          {/* Filter Input */}
          <TextField
            placeholder="Filter by name"
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

          {/* File List DataGrid */}
          <Box sx={{ height: 300, width: "100%", backgroundColor: "#1e1e1e" }}>
            <DataGrid
              rows={rows}
              columns={columns}
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
              }}
            />
          </Box>

          {/* Selected file info and advanced options */}
          <Box mt={2}>
            <Typography variant="body2" color="white" sx={{ mb: 1 }}>
              Selected file: (please select above)
            </Typography>
            <TextField
              placeholder="Advance options"
              fullWidth
              variant="outlined"
              size="small"
              sx={{
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
              InputProps={{
                endAdornment: (
                  <IconButton>
                    <FolderIcon sx={{ color: "#b3b3b3" }} />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

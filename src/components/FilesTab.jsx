import React, { useState, useRef, useEffect } from "react";
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
import DeleteIcon from "@mui/icons-material/Delete"; // Thêm icon xóa

import {
  deleteFileFromFirebase,
  getFilesFromFirebase,
  uploadFileToFirebase,
  uploadMultipleFilesToFirebase,
} from "../servers/firebaseUtils";

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
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    fetchFiles(); // Lấy danh sách file khi component được mount
  }, []);

  const handleSubTabChange = (event, newValue) => {
    setSubTabValue(newValue);
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
    // Handle file upload logic here
    uploadFiles(selectedFiles);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
    // Handle file upload logic here
    uploadFiles(droppedFiles);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const uploadFiles = async (files) => {
    try {
      const fileUrls = await uploadMultipleFilesToFirebase(files); // Sử dụng hàm từ firebaseUtils
      console.log("Files uploaded successfully. URLs:", fileUrls);
      // Bạn có thể lưu các URL này vào Firestore hoặc thực hiện các hành động khác
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const fetchFiles = async () => {
    try {
      const files = await getFilesFromFirebase(); // Lấy danh sách file từ Firebase
      console.log(">>>check files: ", files);
      setFileList(files); // Cập nhật state
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  // Hàm xử lý xóa file
  const handleDeleteFile = async (fileId) => {
    try {
      // Tìm file cần xóa trong danh sách
      const fileToDelete = fileList.find((file) => file.stt === fileId);

      if (fileToDelete) {
        // Gọi hàm xóa file từ Firebase
        await deleteFileFromFirebase({
          name: fileToDelete.name, // Tên file (bắt buộc)
          // Có thể thêm các trường khác nếu hàm deleteFileFromFirebase cần
        });

        // Cập nhật lại danh sách file sau khi xóa
        setFileList(fileList.filter((file) => file.stt !== fileId));
        console.log("File deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const columns = [
    { field: "stt", headerName: "STT", width: 80 }, // Cột STT
    { field: "name", headerName: "Tên file", width: 400 }, // Cột Tên file
    { field: "size", headerName: "Kích thước", width: 120 }, // Cột Kích thước
    { field: "createdAt", headerName: "Ngày tải lên", width: 150 }, // Cột Ngày tải lên
    {
      field: "actions",
      headerName: "Thao tác",
      width: 100,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleDeleteFile(params.row.stt)}
          color="error"
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const rows = fileList.map((file) => ({
    id: file.stt, // Sử dụng STT làm ID duy nhất
    stt: file.stt, // STT
    name: file.name, // Tên file
    size: file.size, // Kích thước
    createdAt: file.createdAt, // Ngày tải lên
  }));

  return (
    <Box sx={{ padding: 2 }}>
      {/* Sub Tabs */}
      {/* <Tabs
        value={subTabValue}
        onChange={handleSubTabChange}
        textColor="inherit"
      >
        <Tab label="File Collection" />
        <Tab label="GraphRAG Collection" />
      </Tabs> */}

      <Divider sx={{ mt: 2, mb: 3, bgcolor: "gray" }} />

      {/* File Upload and List */}
      <Box display="flex" gap={3}>
        {/* File Upload Section */}
        <Box width="30%">
          <FileUploadContainer
            onClick={handleUploadClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            sx={{ cursor: "pointer" }}
          >
            <CloudUploadIcon fontSize="large" />
            <Typography variant="body1" sx={{ mt: 2, mb: 2 }}>
              Drop File Here <br /> - or - <br /> Click to Upload
            </Typography>
            <Typography variant="caption" color="gray">
              Supported file types: .pdf .docx.
            </Typography>
            <Typography variant="caption" color="gray">
              Maximum file size: 1000 MB
            </Typography>
          </FileUploadContainer>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
            multiple
          />

          {/* Advanced Options */}
          {/* <Typography variant="body2" color="white" sx={{ mb: 1 }}>
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
          /> */}

          {/* Upload Button */}
          {/* <Button
            variant="contained"
            color="secondary"
            fullWidth
            sx={{ mt: 2, bgcolor: "#00C853", color: "black" }}
            onClick={handleUploadClick}
          >
            Upload and Index
          </Button> */}
        </Box>

        {/* File List Section */}
        <Box width="70%">
          {/* <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
            File List
          </Typography> */}

          {/* Filter Input */}
          {/* <TextField
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
          /> */}

          {/* File List DataGrid */}
          <Box sx={{ height: 300, width: "100%", backgroundColor: "#1e1e1e" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              disableSelectionOnClick
              hideFooterSelectedRowCount
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
          {/* <Box mt={2}>
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
          </Box> */}
        </Box>
      </Box>
    </Box>
  );
};

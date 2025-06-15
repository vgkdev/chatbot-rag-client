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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import FolderIcon from "@mui/icons-material/Folder";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

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
  const [openModal, setOpenModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [majors, setMajors] = useState([
    { id: 1, name: "Công nghệ thông tin" },
    { id: 2, name: "Kế toán" },
    { id: 3, name: "Quản trị kinh doanh" },
  ]);
  const [subjects, setSubjects] = useState([
    { id: 1, name: "Lập trình web", majorId: 1 },
    { id: 2, name: "Cơ sở dữ liệu", majorId: 1 },
    { id: 3, name: "Kế toán tài chính", majorId: 2 },
  ]);
  const [formData, setFormData] = useState({
    fileName: "",
    majorId: "",
    subjectId: "",
    file: null,
  });

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSubTabChange = (event, newValue) => {
    setSubTabValue(newValue);
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
    uploadFiles(selectedFiles);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(droppedFiles);
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
      const fileUrls = await uploadMultipleFilesToFirebase(files);
      console.log("Files uploaded successfully. URLs:", fileUrls);
      fetchFiles();
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const fetchFiles = async () => {
    try {
      const files = await getFilesFromFirebase();
      setFileList(files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const fileToDelete = fileList.find((file) => file.stt === fileId);
      if (fileToDelete) {
        await deleteFileFromFirebase({
          name: fileToDelete.name,
        });
        setFileList(fileList.filter((file) => file.stt !== fileId));
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({
      fileName: "",
      majorId: "",
      subjectId: "",
      file: null,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      file: file,
      fileName: file ? file.name : "",
    });
  };

  const handleSubmit = async () => {
    try {
      if (formData.file) {
        // Upload file và lưu thông tin phân loại
        const fileUrl = await uploadFileToFirebase(formData.file);
        console.log("File uploaded with classification:", {
          ...formData,
          url: fileUrl,
        });
        fetchFiles();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error uploading classified file:", error);
    }
  };

  const filteredSubjects = formData.majorId
    ? subjects.filter((subject) => subject.majorId == formData.majorId)
    : [];

  const columns = [
    { field: "stt", headerName: "STT", width: 80 },
    { field: "name", headerName: "Tên file", width: 400 },
    { field: "size", headerName: "Kích thước", width: 120 },
    { field: "createdAt", headerName: "Ngày tải lên", width: 150 },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 200,
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
    id: file.stt,
    stt: file.stt,
    name: file.name,
    size: file.size,
    createdAt: file.createdAt,
  }));

  return (
    <Box sx={{ padding: 2 }}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenModal}
          sx={{
            backgroundColor: "#00C853",
            "&:hover": { backgroundColor: "#089242" },
          }}
        >
          Thêm tài liệu
        </Button>
      </Box>

      <Divider sx={{ mt: 2, mb: 3, bgcolor: "gray" }} />

      <Box width="100%">
        <Box sx={{ height: 500, width: "100%", backgroundColor: "#1e1e1e" }}>
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
      </Box>

      {/* Modal thêm tài liệu mới */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Thêm tài liệu mới</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Tên file"
              name="fileName"
              value={formData.fileName}
              onChange={handleFormChange}
              sx={{ mb: 2 }}
              InputProps={{
                readOnly: true,
              }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Chuyên ngành</InputLabel>
              <Select
                name="majorId"
                value={formData.majorId}
                onChange={handleFormChange}
                label="Chuyên ngành"
              >
                {majors.map((major) => (
                  <MenuItem key={major.id} value={major.id}>
                    {major.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Môn học</InputLabel>
              <Select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleFormChange}
                label="Môn học"
                disabled={!formData.majorId}
              >
                {filteredSubjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
            >
              Chọn file
              <input
                type="file"
                hidden
                onChange={handleFileUpload}
                accept="application/pdf"
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.file || !formData.majorId || !formData.subjectId
            }
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

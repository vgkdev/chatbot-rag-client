import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
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
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import {
  deleteFileFromFirebase,
  uploadFileToFirebase,
  getSubjects,
  addDocument,
  getDocuments,
  deleteDocument,
  updateDocument,
} from "../servers/firebaseUtils";
import { Edit } from "@mui/icons-material";

export const FilesTab = () => {
  const [fileList, setFileList] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    fileName: "",
    subject: null,
    file: null,
  });
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isUpLoading, setIsUpLoading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  //get subjects from firebase
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const subjectsData = await getSubjects();
        console.log(">>>check subjects:", subjectsData);
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (openUpdateModal && currentDocument) {
      setFormData({
        fileName: currentDocument.name,
        subject: currentDocument.subject,
      });
    }
  }, [openUpdateModal, currentDocument]);

  const fetchFiles = async () => {
    try {
      const files = await getDocuments();
      console.log(">>>check files:", files);
      // Thêm stt (số thứ tự) cho mỗi document
      const filesWithStt = files.map((file, index) => ({
        ...file,
        stt: index + 1,
        formattedCreatedAt: file.createdAt.toDate().toLocaleDateString("vi-VN"),
        subjectName: file.subject?.name || "Không có môn học",
        isBasic: file.subject?.isBasic || false,
        majors: file.subject?.majors || [], // Thêm majors vào data grid
      }));
      // console.log(">>>check filesWithStt:", filesWithStt);
      setFileList(filesWithStt);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      // Tìm file để lấy tên file trước khi xóa
      const fileToDelete = fileList.find((file) => file.id === fileId);
      if (fileToDelete) {
        // Xóa file từ Storage
        await deleteFileFromFirebase({
          name: fileToDelete.name,
          url: fileToDelete.url,
        });

        // Xóa document từ Firestore (cần thêm hàm deleteDocument trong firebaseUtils)
        await deleteDocument(fileId);

        // Cập nhật UI
        setFileList(fileList.filter((file) => file.id !== fileId));
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
      subject: {},
      file: null,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "subjectId") {
      const selectedSubject = subjects.find((subject) => subject.id === value);
      setFormData({
        ...formData,
        subject: selectedSubject || null,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFormData({
      ...formData,
      file: file,
      // fileName: file ? file.name : "",
    });
  };

  const handleSubmit = async () => {
    try {
      if (formData.file && formData.subject) {
        setIsUpLoading(true);
        // Upload file và lưu thông tin phân loại
        const fileUrl = await uploadFileToFirebase(formData.file);
        console.log("File uploaded with classification:", {
          ...formData,
          url: fileUrl,
        });

        await addDocument({
          name: formData.fileName || formData.file.name,
          url: fileUrl,
          subject: formData.subject || null,
        });

        fetchFiles();
        handleCloseModal();
      }
    } catch (error) {
      console.error("Error uploading classified file:", error);
    } finally {
      setIsUpLoading(false);
      setFormData({
        fileName: "",
        subject: null,
        file: null,
      });
    }
  };

  const handleUpdateDocument = async () => {
    try {
      if (currentDocument) {
        setIsUpLoading(true);
        console.log(">>>check currentDocument:", currentDocument);
        console.log(">>>check formData:", formData);
        const updateData = {
          name: formData.fileName || currentDocument.name,
          subject: {
            ...formData.subject, // Giữ nguyên các trường khác của subject
            id: formData.subject?.id || currentDocument.subject.id,
            name: formData.subject?.name || currentDocument.subject.name,
          },
          url: currentDocument.url, // Giữ nguyên URL
          createdAt: currentDocument.createdAt, // Giữ nguyên ngày tạo
        };

        await updateDocument(currentDocument.id, updateData);

        fetchFiles();
        setOpenUpdateModal(false);
        setCurrentDocument(null);
      }
    } catch (error) {
      console.error("Error updating document:", error);
    } finally {
      setIsUpLoading(false);
      setFormData({
        fileName: "",
        subject: null,
        file: null,
      });
    }
  };

  const columns = [
    { field: "stt", headerName: "STT", width: 80 },
    { field: "name", headerName: "Tên file", width: 250 },
    {
      field: "subjectName",
      headerName: "Môn học",
      width: 400,
      renderCell: (params) => (
        <Box>
          <Typography>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "majors",
      headerName: "Chuyên ngành",
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
          {params.value.map((major) => (
            <Chip
              key={major.id}
              label={major.name}
              size="small"
              sx={{
                backgroundColor: "#333",
                color: "white",
                fontSize: "0.7rem",
              }}
            />
          ))}
          {params.row.isBasic && (
            <Chip
              label="Cơ sở ngành"
              size="small"
              sx={{
                backgroundColor: "#00C853",
                color: "white",
                ml: 1,
                fontSize: "0.7rem",
              }}
            />
          )}
        </Box>
      ),
    },
    { field: "formattedCreatedAt", headerName: "Ngày tải lên", width: 150 },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 150,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => {
              // console.log(">>>check params:", params.row);
              setCurrentDocument(params.row);
              setOpenUpdateModal(true);
            }}
            color="primary"
            size="small"
            sx={{ mr: 1 }}
          >
            <Edit />
          </IconButton>
          <IconButton
            onClick={() => handleDeleteFile(params.row.id)}
            color="error"
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const rows = fileList.map((file) => ({
    id: file.id, // Sử dụng file.id thay vì file.stt
    stt: file.stt,
    name: file.name,
    subjectName: file.subjectName,
    isBasic: file.isBasic,
    majors: file.majors,
    formattedCreatedAt: file.formattedCreatedAt,
    url: file.url,
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
              // InputProps={{
              //   readOnly: true,
              // }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Môn học</InputLabel>
              <Select
                name="subjectId"
                value={formData.subject?.id || ""}
                onChange={handleFormChange}
                label="Môn học"
              >
                {subjects.map((subject) => (
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
            {formData.file && (
              <Typography variant="body2" sx={{ mt: 1, color: "#4CAF50" }}>
                Đã chọn: {formData.file.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.file || !formData.subject || isUpLoading}
          >
            {isUpLoading ? "Đang tải lên..." : "Lưu"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal cập nhật tài liệu */}
      <Dialog
        open={openUpdateModal}
        onClose={() => {
          setOpenUpdateModal(false);
          setCurrentDocument(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cập nhật tài liệu</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Tên file"
              name="fileName"
              value={formData.fileName || currentDocument?.name || ""}
              onChange={handleFormChange}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Môn học</InputLabel>
              <Select
                name="subjectId"
                value={
                  formData.subject?.id || currentDocument?.subject?.id || ""
                }
                onChange={handleFormChange}
                label="Môn học"
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.id} value={subject.id}>
                    {subject.name}
                    {subject.isBasic && " (Cơ sở ngành)"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenUpdateModal(false);
              setCurrentDocument(null);
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpdateDocument}
            variant="contained"
            disabled={!formData.subject || isUpLoading}
          >
            {isUpLoading ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

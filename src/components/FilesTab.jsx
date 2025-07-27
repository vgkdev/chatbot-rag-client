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
  rebuildAllVectorStores,
} from "../servers/firebaseUtils";
import { BuildCircleOutlined, Edit } from "@mui/icons-material";
import useSnackbarUtils from "../utils/useSnackbarUtils";
import { buildVectorStore } from "../servers/ragProcessor";

export const FilesTab = () => {
  const [fileList, setFileList] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    subject: null,
    file: null,
  });
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isUpLoading, setIsUpLoading] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const { showSuccess, showError, showWarning } = useSnackbarUtils();

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
        showError("Lỗi khi lấy danh sách môn học!");
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (openUpdateModal && currentDocument) {
      setFormData({
        name: currentDocument.name,
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
      showError("Lỗi khi lấy danh sách tài liệu!");
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const fileToDelete = fileList.find((file) => file.id === fileId);
      if (fileToDelete) {
        await deleteFileFromFirebase(fileToDelete.fileName);
        await deleteDocument(fileId);
        setFileList(fileList.filter((file) => file.id !== fileId));
        showSuccess("Xóa tài liệu thành công!");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      showError("Lỗi khi xóa tài liệu!");
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({
      name: "",
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
    if (file) {
      // Kiểm tra định dạng file
      if (file.type !== "application/pdf") {
        showWarning("Vui lòng chọn file định dạng PDF!");
        return;
      }
      setFormData({
        ...formData,
        file: file,
        // name: file ? file.name : "",
      });
    }
  };
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showWarning("Tên tài liệu không được để trống!");
      return;
    }
    if (!formData.subject) {
      showWarning("Vui lòng chọn môn học!");
      return;
    }
    if (!formData.file) {
      showWarning("Vui lòng chọn file để tải lên!");
      return;
    }
    try {
      setIsUpLoading(true);
      const fileUrl = await uploadFileToFirebase(formData.file);
      await addDocument({
        name: formData.name,
        fileName: formData.file.name,
        url: fileUrl,
        subject: formData.subject || null,
      });

      await fetchFiles();
      handleCloseModal();
      showSuccess("Tải lên tài liệu thành công!");
    } catch (error) {
      console.error("Error uploading classified file:", error);
      showError("Lỗi khi tải lên tài liệu!");
    } finally {
      setIsUpLoading(false);
      setFormData({
        name: "",
        subject: null,
        file: null,
      });
    }
  };

  const handleUpdateDocument = async () => {
    if (!formData.name.trim()) {
      showWarning("Tên tài liệu không được để trống!");
      return;
    }
    if (!formData.subject) {
      showWarning("Vui lòng chọn môn học!");
      return;
    }
    try {
      setIsUpLoading(true);
      const updateData = {
        name: formData.name || currentDocument.name,
        subject: {
          ...formData.subject,
          id: formData.subject?.id || currentDocument.subject.id,
          name: formData.subject?.name || currentDocument.subject.name,
        },
        url: currentDocument.url,
      };

      await updateDocument(currentDocument.id, updateData);
      await fetchFiles();
      setOpenUpdateModal(false);
      setCurrentDocument(null);
      showSuccess("Cập nhật tài liệu thành công!");
    } catch (error) {
      console.error("Error updating document:", error);
      showError("Lỗi khi cập nhật tài liệu!");
    } finally {
      setIsUpLoading(false);
      setFormData({
        name: "",
        subject: null,
        file: null,
      });
    }
  };

  const handleOpenFile = (url) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      showError("Không tìm thấy URL của file!");
    }
  };

  // Hàm xử lý rebuild vector stores
  const handleRebuildVectorStores = async () => {
    try {
      setIsRebuilding(true);
      await rebuildAllVectorStores();
      await fetchFiles(); // Cập nhật lại danh sách file sau khi rebuild
      showSuccess("Xây dựng lại vector stores thành công!");
    } catch (error) {
      console.error("Error rebuilding vector stores:", error);
      showError("Lỗi khi xây dựng lại vector stores!");
    } finally {
      setIsRebuilding(false);
    }
  };

  const columns = [
    { field: "stt", headerName: "STT", width: 80 },
    { field: "name", headerName: "Tên file", width: 250 },
    {
      field: "fileName",
      headerName: "Tên gốc",
      width: 250,
      renderCell: (params) => (
        <Typography
          sx={{
            color: "#00C853",
            cursor: "pointer",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={() => handleOpenFile(params.row.url)}
        >
          {params.value}
        </Typography>
      ),
    },
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
    fileName: file.fileName,
    subjectName: file.subjectName,
    isBasic: file.isBasic,
    majors: file.majors,
    formattedCreatedAt: file.formattedCreatedAt,
    url: file.url,
  }));

  return (
    <Box sx={{ padding: 2 }}>
      <Box display="flex" justifyContent="flex-end" mb={2} gap={1}>
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
        <Button
          variant="contained"
          startIcon={<BuildCircleOutlined />}
          onClick={handleRebuildVectorStores}
          disabled={isRebuilding}
          sx={{
            backgroundColor: "#1976d2",
            "&:hover": { backgroundColor: "#1565c0" },
          }}
        >
          {isRebuilding ? "Đang xây dựng..." : "Xây dựng lại Vector Stores"}
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
              label="Tên tài liệu"
              name="name"
              value={formData.name}
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
              label="Tên tài liệu"
              name="name"
              // value={formData.name || currentDocument?.name || ""} // code này bị lỗi khi xóa toàn bộ text trong TextField
              value={formData.name}
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

import {
  Box,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  Chip,
  Typography,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Delete, Edit, Search } from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import {
  addSubject,
  deleteSubject,
  getMajors,
  subscribeToSubjects,
  updateSubject,
} from "../servers/firebaseUtils";
import useSnackbarUtils from "../utils/useSnackbarUtils";

export const SubjectList = () => {
  const [newSubject, setNewSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEdit, setCurrentEdit] = useState({
    id: "",
    name: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [majors, setMajors] = useState([]);
  const [currentSubject, setCurrentSubject] = useState({
    id: "",
    name: "",
    majors: [],
    isBasic: false,
  });
  const { showSuccess, showError, showWarning } = useSnackbarUtils(); // Sử dụng useSnackbarUtils

  useEffect(() => {
    const unsubscribe = subscribeToSubjects((subjects) => {
      setSubjects(subjects);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  //get majors from firebase
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const majorsData = await getMajors();
        setMajors(majorsData);
      } catch (error) {
        console.error("Error fetching majors:", error);
        showError("Lỗi khi lấy danh sách chuyên ngành!");
      }
    };
    fetchMajors();
  }, []);

  const handleAddSubjectClick = () => {
    setCurrentSubject({
      id: "",
      name: "",
      majors: [],
      isBasic: false,
    });
    setIsEditMode(false);
    setModalOpen(true);
  };

  const handleSaveSubject = async () => {
    if (currentSubject.name.trim() === "") {
      showWarning("Vui lòng nhập tên môn học");
      return;
    }

    if (!currentSubject.isBasic && currentSubject.majors.length === 0) {
      showWarning(
        "Vui lòng chọn ít nhất một chuyên ngành hoặc đánh dấu là môn cơ sở"
      );
      return;
    }

    setIsSaving(true);

    try {
      const subjectData = {
        name: currentSubject.name.trim(),
        majors: currentSubject.majors,
        isBasic: currentSubject.isBasic,
        createdAt: isEditMode ? currentSubject.createdAt : new Date(),
      };

      if (isEditMode) {
        await updateSubject(currentSubject.id, subjectData);
        showSuccess("Cập nhật môn học thành công!");
      } else {
        await addSubject(subjectData);
        showSuccess("Thêm môn học thành công!");
      }

      setModalOpen(false);
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "adding"} subject:`,
        error
      );
      showError(`Lỗi khi ${isEditMode ? "cập nhật" : "thêm"} môn học!`);
    } finally {
      setIsSaving(false);
      setCurrentSubject({
        id: "",
        name: "",
        majors: [],
        isBasic: false,
      });
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    try {
      await deleteSubject(subjectId);
      showSuccess("Xóa môn học thành công!");
    } catch (error) {
      console.error("Error deleting subject:", error);
      showError("Lỗi khi xóa môn học!");
    }
  };

  const handleEditClick = (subject) => {
    setCurrentSubject({
      id: subject.id,
      name: subject.name,
      majors: subject.majors || [],
      isBasic: subject.isBasic || false,
      createdAt: subject.createdAt, // Giữ nguyên createdAt khi chỉnh sửa
    });
    setIsEditMode(true);
    setModalOpen(true);
  };

  const handleUpdateSubject = async (newName) => {
    try {
      await updateSubject(currentEdit.id, newName);
      showSuccess("Cập nhật môn học thành công!");
    } catch (error) {
      console.error("Error updating subject:", error);
      showError("Lỗi khi cập nhật môn học!");
    }
  };

  // Xử lý chọn/bỏ chọn chuyên ngành
  const handleMajorToggle = (major) => {
    // Nếu là môn cơ sở ngành thì không cho chọn chuyên ngành
    if (currentSubject.isBasic) return;

    setCurrentSubject((prev) => {
      const isSelected = prev.majors.some((m) => m.id === major.id);
      const newMajors = isSelected
        ? prev.majors.filter((m) => m.id !== major.id)
        : [...prev.majors, major];
      return { ...prev, majors: newMajors };
    });
  };

  const handleBasicChange = (e) => {
    const isBasic = e.target.checked;
    setCurrentSubject((prev) => ({
      ...prev,
      isBasic,
      majors: isBasic ? [] : prev.majors, // Nếu chọn cơ sở ngành thì xóa hết majors đã chọn
    }));
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      field: "stt",
      headerName: "STT",
      width: 100,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "name",
      headerName: "Tên môn học",
      flex: 1,
      renderCell: (params) => (
        <div style={{ fontWeight: "bold" }}>{params.value}</div>
      ),
    },
    {
      field: "majors",
      headerName: "Chuyên ngành",
      width: 500,
      renderCell: (params) => (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            paddingTop: "4px",
          }}
        >
          {params.row.isBasic ? (
            <Chip
              label="CƠ SỞ NGÀNH"
              size="small"
              sx={{
                backgroundColor: "#00C853",
                color: "white",
                fontWeight: "bold",
                fontSize: "0.75rem",
              }}
            />
          ) : (
            params.row.majors?.map((major) => (
              <Chip
                key={major.id}
                label={major.name}
                size="small"
                sx={{
                  backgroundColor: "#333",
                  color: "white",
                  fontSize: "0.75rem",
                }}
              />
            ))
          )}
        </div>
      ),
    },
    {
      field: "createdAt",
      headerName: "Ngày tạo",
      width: 150,
      valueFormatter: (params) => {
        try {
          if (params.toDate) {
            return params.toDate().toLocaleDateString("vi-VN");
          }
          if (params.seconds) {
            return new Date(params.seconds * 1000).toLocaleDateString("vi-VN");
          }
          return "N/A";
        } catch (error) {
          console.error("Error formatting date:", error);
          return "N/A";
        }
      },
    },
    {
      field: "actions",
      headerName: "Thao tác",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => handleEditClick(params.row)}
          >
            <Edit />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteSubject(params.row.id)}
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  const rowsWithStt = filteredSubjects.map((subject, index) => ({
    ...subject,
    stt: index + 1,
  }));

  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2 }}
    >
      {/* Add Subject Section */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleAddSubjectClick}
          sx={{
            backgroundColor: "#00C853",
            "&:hover": { backgroundColor: "#089242" },
          }}
        >
          Thêm môn học
        </Button>
      </Box>

      {/* Search Section */}
      <TextField
        variant="outlined"
        size="small"
        placeholder="Tìm kiếm môn học..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{
          backgroundColor: "#1E1E1E",
          borderRadius: 1,
          width: "50%",
        }}
        InputProps={{
          style: { color: "white" },
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: "gray" }} />
            </InputAdornment>
          ),
        }}
      />

      {/* DataGrid Section */}
      <Box sx={{ height: 500, width: "100%", flexGrow: 1 }}>
        <DataGrid
          rows={rowsWithStt}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            backgroundColor: "#1E1E1E",
            color: "white",
            borderColor: "#333",
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #333",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#333",
              color: "white",
            },
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: "#333",
              color: "white",
            },
          }}
        />
      </Box>

      {/* Modal thêm môn học mới */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isEditMode ? "Chỉnh sửa môn học" : "Thêm môn học mới"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Tên môn học"
              value={currentSubject.name}
              onChange={(e) =>
                setCurrentSubject({ ...currentSubject, name: e.target.value })
              }
              sx={{ mb: 3 }}
              InputProps={{
                style: { color: "white" },
              }}
              InputLabelProps={{
                style: { color: "gray" },
              }}
            />

            <Typography variant="subtitle1" sx={{ mb: 1, color: "white" }}>
              Chọn chuyên ngành:
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={currentSubject.isBasic || false}
                  onChange={handleBasicChange}
                  sx={{
                    "&.Mui-checked": {
                      color: "#00C853",
                    },
                  }}
                />
              }
              label="Môn cơ sở ngành"
              sx={{ mb: 2 }}
            />
            <List
              sx={{
                maxHeight: 200,
                overflow: "auto",
                backgroundColor: "#1E1E1E",
                borderRadius: 1,
                p: 1,
              }}
            >
              {majors.map((major) => (
                <ListItem key={major.id} disablePadding>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={currentSubject.majors.some(
                          (m) => m.id === major.id
                        )}
                        onChange={() => handleMajorToggle(major)}
                        disabled={currentSubject.isBasic} // Disable nếu là môn cơ sở
                        sx={{
                          color: "white",
                          "&.Mui-checked": {
                            color: "#00C853",
                          },
                          "&.Mui-disabled": { color: "text.disabled" },
                        }}
                      />
                    }
                    label={major.name}
                    sx={{
                      color: currentSubject.isBasic
                        ? "text.disabled"
                        : "text.primary",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} sx={{ color: "white" }}>
            Hủy
          </Button>
          <Button
            onClick={handleSaveSubject}
            variant="contained"
            disabled={!currentSubject.name.trim() || isSaving}
            sx={{
              backgroundColor: "#00C853",
              "&:hover": { backgroundColor: "#089242" },
              minWidth: 100,
            }}
          >
            {isSaving ? (
              <CircularProgress size={24} color="inherit" />
            ) : isEditMode ? (
              "Cập nhật"
            ) : (
              "Thêm"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

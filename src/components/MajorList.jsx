import {
  Box,
  Button,
  TextField,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Delete, Edit, Search } from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import {
  addMajor,
  deleteMajor,
  subscribeToMajors,
  updateMajor,
} from "../servers/firebaseUtils";
import { EditModal } from "./EditModal";

export const MajorList = () => {
  const [newMajor, setNewMajor] = useState("");
  const [majors, setMajors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState({
    id: "",
    name: "",
  });

  useEffect(() => {
    const unsubscribe = subscribeToMajors((majors) => {
      setMajors(majors);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddMajor = async () => {
    if (newMajor.trim() === "") return;
    try {
      await addMajor(newMajor);
      setNewMajor("");
    } catch (error) {
      console.error("Error adding major:", error);
    }
  };

  const handleDeleteMajor = async (majorId) => {
    try {
      await deleteMajor(majorId);
    } catch (error) {
      console.error("Error deleting major:", error);
    }
  };

  const handleEditClick = (major) => {
    setCurrentEdit({
      id: major.id,
      name: major.name,
    });
    setEditModalOpen(true);
  };

  const handleUpdateMajor = async (newName) => {
    try {
      await updateMajor(currentEdit.id, newName);
    } catch (error) {
      console.error("Error updating major:", error);
    }
  };

  const filteredMajors = majors.filter((major) =>
    major.name.toLowerCase().includes(searchText.toLowerCase())
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
      headerName: "Tên chuyên ngành",
      flex: 1,
      renderCell: (params) => (
        <div style={{ fontWeight: "bold" }}>{params.value}</div>
      ),
    },
    {
      field: "createdAt",
      headerName: "Ngày tạo",
      width: 150,
      valueFormatter: (params) => {
        try {
          // Kiểm tra và xử lý mọi trường hợp có thể
          const timestamp = params;
          // console.log(">>>check timestamp:", params.seconds);

          if (!timestamp) return "N/A";

          // Trường hợp 1: Là Timestamp object của Firebase
          if (typeof timestamp.toDate === "function") {
            return timestamp.toDate().toLocaleDateString("vi-VN");
          }

          // Trường hợp 2: Là object {seconds, nanoseconds}
          if (timestamp.seconds && typeof timestamp.seconds === "number") {
            return new Date(timestamp.seconds * 1000).toLocaleDateString(
              "vi-VN"
            );
          }

          // Trường hợp 3: Là chuỗi ISO
          if (typeof timestamp === "string") {
            return new Date(timestamp).toLocaleDateString("vi-VN");
          }

          // Trường hợp 4: Là số epoch
          if (typeof timestamp === "number") {
            return new Date(timestamp).toLocaleDateString("vi-VN");
          }

          return "N/A";
        } catch (error) {
          console.error("Error formatting date:", error, params.value);
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
            onClick={() => handleDeleteMajor(params.row.id)}
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  const rowsWithStt = filteredMajors.map((major, index) => ({
    ...major,
    stt: index + 1,
  }));

  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2 }}
    >
      {/* Add Major Section */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Tên chuyên ngành mới"
          variant="outlined"
          size="small"
          fullWidth
          value={newMajor}
          onChange={(e) => setNewMajor(e.target.value)}
          sx={{ backgroundColor: "#1E1E1E", borderRadius: 1, height: "100%" }}
          InputProps={{
            style: { color: "white" },
          }}
          InputLabelProps={{
            style: { color: "gray" },
          }}
        />
        <Button
          variant="contained"
          onClick={handleAddMajor}
          sx={{
            backgroundColor: "#00C853",
            "&:hover": { backgroundColor: "#089242" },
          }}
        >
          Thêm chuyên ngành
        </Button>
      </Box>

      {/* Search Section */}
      <TextField
        variant="outlined"
        size="small"
        placeholder="Tìm kiếm chuyên ngành..."
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

      <EditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Chỉnh sửa chuyên ngành"
        label="Tên chuyên ngành"
        initialValue={currentEdit.name}
        onSave={handleUpdateMajor}
      />
    </Box>
  );
};

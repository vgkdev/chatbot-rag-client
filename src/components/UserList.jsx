import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../configs/firebase";
const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data from Firestore
  const fetchUsers = async () => {
    try {
      const userCollection = collection(db, "users"); // Replace 'users' with your Firestore collection name
      const userSnapshot = await getDocs(userCollection);
      const userList = userSnapshot.docs.map((doc) => ({
        id: doc.id, // Firestore document ID
        ...doc.data(), // Firestore document data
      }));
      setUsers(userList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId)); // Cập nhật lại danh sách user trong state
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const userColumns = [
    { field: "id", headerName: "User ID", width: 200 },
    { field: "email", headerName: "Email", width: 250 },
    { field: "userName", headerName: "User Name", width: 200 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="error"
          size="small"
          //   onClick={() => deleteUser(params.row.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ padding: 2, backgroundColor: "#121212", color: "white" }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        User List
      </Typography>

      <Box sx={{ height: 400, backgroundColor: "#1e1e1e" }}>
        <DataGrid
          rows={users}
          columns={userColumns}
          pageSize={5}
          loading={loading}
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
    </Box>
  );
};

export default UserList;

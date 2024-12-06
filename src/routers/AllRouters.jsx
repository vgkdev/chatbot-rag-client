import { Box } from "@mui/material";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import HomePage from "../Pages/HomePage";
import { Settings } from "../Pages/Settings";
import { RegisterPage } from "../Pages/RegisterPage";
import { LoginPage } from "../Pages/LoginPage";

const AllRoutes = () => {
  //   const user = useSelector((state) => state.user.user);
  //   console.log(">>>check user: ", user);
  //   const isStaffOrAdmin = user ? user.isStaff || user.isManager : false;
  //   const isAdmin = user ? user.isManager : false;

  return (
    <Router>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* <NavBar /> */}

        <Box sx={{ flexGrow: 1 }}>
          <Routes>
            {/* -------------------all routers-------------------- */}
            <Route path="/" element={<Navigate to="/homepage" />} />
            <Route path="/homepage" element={<HomePage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </Box>
        {/* <Box sx={{ flexShrink: 0 }}>
          <Footer />
        </Box> */}
      </Box>
    </Router>
  );
};

export default AllRoutes;

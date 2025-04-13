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
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { UnauthorizedPage } from "../Pages/UnauthorizedPage";

const AllRoutes = () => {
  const { user } = useContext(UserContext);

  // Component bảo vệ route cho trang Settings
  const ProtectedSettingsRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (user.role !== 1) {
      return <Navigate to="/unauthorized" replace />;
    }

    return children;
  };

  return (
    <Router>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Routes>
            {/* -------------------all routers-------------------- */}
            <Route path="/" element={<Navigate to="/homepage" />} />
            <Route path="/homepage" element={<HomePage />} />

            {/* Route Settings được bảo vệ */}
            <Route
              path="/settings"
              element={
                <ProtectedSettingsRoute>
                  <Settings />
                </ProtectedSettingsRoute>
              }
            />

            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
};

export default AllRoutes;

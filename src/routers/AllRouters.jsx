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
import { ProfilePage } from "../Pages/ProfilePage";

const AllRoutes = () => {
  const { user, loading } = useContext(UserContext);

  // Component bảo vệ route chung
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // Component bảo vệ route cho trang Settings (role = 1)
  const ProtectedSettingsRoute = ({ children }) => {
    if (user?.role !== 1 && user?.role !== 2) {
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
            {/* Route công khai */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Route được bảo vệ */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/homepage" replace />
                </ProtectedRoute>
              }
            />

            <Route
              path="/homepage"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ProtectedSettingsRoute>
                    <Settings />
                  </ProtectedSettingsRoute>
                </ProtectedRoute>
              }
            />

            {/* Redirect mọi route không khớp */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
};

export default AllRoutes;

import React, { useContext } from "react";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MuiAppBar from "@mui/material/AppBar";
import ListIcon from "@mui/icons-material/List";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import { styled } from "@mui/material/styles";
import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  AccountCircle,
  Logout,
  PersonAdd,
  Settings,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const drawerWidth = 240;

const CustomAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  backgroundColor: "#121212",
  boxShadow: "none",
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  width: open ? `calc(100% - ${drawerWidth}px)` : "100%",
  marginLeft: open ? `${drawerWidth}px` : 0,
}));

export const AppBar = ({ open, handleDrawerOpen }) => {
  const { user, setUser } = useContext(UserContext);
  // console.log(">>>check user: ", user);

  const [anchorEl, setAnchorEl] = React.useState(null);

  const navigate = useNavigate();

  const openMenu = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    handleClose();
  };

  return (
    <CustomAppBar position="fixed">
      <Toolbar
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            //   sx={{ mr: 2, display: open ? "none" : "block" }}
            sx={{ mr: 2, display: open ? "block" : "block" }}
          >
            <ListIcon />
          </IconButton>
          {/* <Typography variant="h6" noWrap component="div">
            New Chat
          </Typography> */}
        </>

        <>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={openMenu}
            onClose={handleClose}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  //   border: "1px solid red",
                  width: "15%",
                  overflow: "visible",
                  filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                  mt: 1.5,
                  "& .MuiAvatar-root": {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  "&::before": {
                    content: '""',
                    display: "block",
                    position: "absolute",
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                  },
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            {user ? (
              <div>
                <MenuItem
                  onClick={() => {
                    navigate("/profile");
                  }}
                >
                  <Avatar />
                  <Typography sx={{ ml: "5px" }}>{user.userName}</Typography>
                </MenuItem>

                <Divider />

                {(user.role === 1 || user.role === 2) && (
                  <MenuItem
                    onClick={() => {
                      navigate("/settings");
                      handleClose();
                    }}
                  >
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    Cài đặt
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Đăng xuất
                </MenuItem>
              </div>
            ) : (
              <div>
                <MenuItem
                  onClick={() => {
                    navigate("/login");
                    handleClose();
                  }}
                >
                  <ListItemIcon>
                    <LoginIcon fontSize="small" />
                  </ListItemIcon>
                  Đăng nhập
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    navigate("/register");
                    handleClose();
                  }}
                >
                  <ListItemIcon>
                    <PersonAddAltIcon fontSize="small" />
                  </ListItemIcon>
                  Đăng ký
                </MenuItem>
              </div>
            )}
          </Menu>
        </>
      </Toolbar>
    </CustomAppBar>
  );
};

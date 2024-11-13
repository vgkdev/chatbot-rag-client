import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import CssBaseline from "@mui/material/CssBaseline";
import MuiAppBar from "@mui/material/AppBar";

import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListIcon from "@mui/icons-material/List";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { InputBase } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { AppBar } from "../components/AppBar";

const drawerWidth = 240;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: open ? `${drawerWidth}px` : 0,
  })
);

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  justifyContent: "space-between",
  ...theme.mixins.toolbar,
}));

export default function HomePage() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar open={open} handleDrawerOpen={handleDrawerOpen} />
      {/* <CssBaseline /> */}
      {/* <AppBar position="fixed" open={open}>
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
              sx={{ mr: 2, display: open ? "none" : "block" }}
            >
              <ListIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              New Chat
            </Typography>
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
              onClick={handleClose}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
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
              <MenuItem onClick={handleClose}>
                <Avatar /> Profile
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <Avatar /> My account
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <PersonAdd fontSize="small" />
                </ListItemIcon>
                Add another account
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </>
        </Toolbar>
      </AppBar> */}

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            <ListIcon />
          </IconButton>
          <IconButton>
            <EditNoteOutlinedIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
      </Drawer>

      <Main
        open={open}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          pb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 1,
            borderRadius: "24px",
            backgroundColor: "#333",
            color: "white",
            boxShadow: "none",
            maxWidth: "600px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Attachment Icon */}
          <IconButton sx={{ color: "white" }}>
            <AttachFileIcon />
          </IconButton>

          {/* Input Field */}
          <InputBase
            placeholder="Tin nhắn"
            sx={{
              ml: 1,
              flex: 1,
              color: "white",
            }}
          />

          <IconButton sx={{ color: "white" }}>
            <SendIcon />
          </IconButton>
        </Box>
      </Main>
    </Box>
  );
}

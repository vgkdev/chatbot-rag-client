import { ThemeProvider } from "@mui/material";
import "./App.css";
import { darkTheme, lightTheme } from "./theme/AppThemes";
import AllRoutes from "./routers/AllRouters";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <UserProvider>
      <ThemeProvider theme={darkTheme}>
        <AllRoutes />
      </ThemeProvider>
    </UserProvider>
  );
}

export default App;

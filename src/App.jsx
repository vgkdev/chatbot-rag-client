import { ThemeProvider } from "@mui/material";
import "./App.css";
import { darkTheme, lightTheme } from "./theme/AppThemes";
import AllRoutes from "./routers/AllRouters";

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <AllRoutes />
    </ThemeProvider>
  );
}

export default App;

import { ThemeProvider } from "@mui/material";
import "./App.css";
import HomePage from "./Pages/HomePage";
import { darkTheme, lightTheme } from "./theme/AppThemes";

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <HomePage />
    </ThemeProvider>
  );
}

export default App;

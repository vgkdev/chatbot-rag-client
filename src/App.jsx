import { ThemeProvider } from "@mui/material";
import "./App.css";
import { darkTheme, lightTheme } from "./theme/AppThemes";
import AllRoutes from "./routers/AllRouters";
import { UserProvider } from "./context/UserContext";

import { GlobalWorkerOptions, version as pdfjsVersion } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

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

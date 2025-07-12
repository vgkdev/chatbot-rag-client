import { useSnackbar } from "notistack";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const useSnackbarUtils = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  // Thời gian hiển thị mặc định (ms)
  const DEFAULT_DURATION = 5000;

  const showSnackbar = (message, variant, duration = DEFAULT_DURATION) => {
    enqueueSnackbar(message, {
      variant,
      autoHideDuration: duration,
      action: (key) => (
        <IconButton
          size="small"
          color="inherit"
          onClick={() => closeSnackbar(key)}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ),
    });
  };

  const showSuccess = (message, duration = DEFAULT_DURATION) => {
    showSnackbar(message, "success", duration);
  };

  const showError = (message, duration = DEFAULT_DURATION) => {
    showSnackbar(message, "error", duration);
  };

  const showWarning = (message, duration = DEFAULT_DURATION) => {
    showSnackbar(message, "warning", duration);
  };

  const showInfo = (message, duration = DEFAULT_DURATION) => {
    showSnackbar(message, "info", duration);
  };

  return { showSuccess, showError, showWarning, showInfo };
};

export default useSnackbarUtils;

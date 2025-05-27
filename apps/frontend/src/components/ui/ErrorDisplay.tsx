import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

interface ErrorDisplayProps {
  error: Error | string | null;
  title?: string;
  severity?: "error" | "warning" | "info";
  variant?: "alert" | "paper" | "minimal";
  showRetry?: boolean;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  severity = "error",
  variant = "alert",
  showRetry = true,
  showDetails = false,
  onRetry,
  onDismiss,
}) => {
  const [showDetailedError, setShowDetailedError] = React.useState(false);

  if (!error) return null;

  const errorMessage = typeof error === "string" ? error : error.message;
  const errorStack =
    typeof error === "object" && error.stack ? error.stack : null;

  const getIcon = () => {
    switch (severity) {
      case "warning":
        return <WarningIcon />;
      case "info":
        return <InfoIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (severity) {
      case "warning":
        return "警告";
      case "info":
        return "情報";
      default:
        return "エラーが発生しました";
    }
  };

  const renderContent = () => (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        {getIcon()}
        <Typography variant="h6" component="h3">
          {getTitle()}
        </Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 2 }}>
        {errorMessage}
      </Typography>

      {(showDetails || showRetry || onDismiss) && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {showRetry && onRetry && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              再試行
            </Button>
          )}

          {onDismiss && (
            <Button variant="text" size="small" onClick={onDismiss}>
              閉じる
            </Button>
          )}

          {showDetails && errorStack && (
            <Button
              variant="text"
              size="small"
              endIcon={
                showDetailedError ? <ExpandLessIcon /> : <ExpandMoreIcon />
              }
              onClick={() => setShowDetailedError(!showDetailedError)}
            >
              詳細
            </Button>
          )}
        </Box>
      )}

      {showDetails && errorStack && (
        <Collapse in={showDetailedError}>
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "grey.100",
              borderRadius: 1,
              border: 1,
              borderColor: "grey.300",
            }}
          >
            <Typography
              variant="caption"
              component="pre"
              sx={{ whiteSpace: "pre-wrap" }}
            >
              {errorStack}
            </Typography>
          </Box>
        </Collapse>
      )}
    </Box>
  );

  if (variant === "alert") {
    return (
      <Alert
        severity={severity}
        onClose={onDismiss}
        action={
          showRetry && onRetry ? (
            <IconButton
              color="inherit"
              size="small"
              onClick={onRetry}
              aria-label="再試行"
            >
              <RefreshIcon />
            </IconButton>
          ) : undefined
        }
      >
        <AlertTitle>{getTitle()}</AlertTitle>
        <Typography variant="body2">{errorMessage}</Typography>

        {showDetails && errorStack && (
          <>
            <Button
              variant="text"
              size="small"
              endIcon={
                showDetailedError ? <ExpandLessIcon /> : <ExpandMoreIcon />
              }
              onClick={() => setShowDetailedError(!showDetailedError)}
              sx={{ mt: 1, p: 0, minWidth: "auto" }}
            >
              詳細を表示
            </Button>
            <Collapse in={showDetailedError}>
              <Box
                sx={{
                  mt: 1,
                  p: 1,
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  {errorStack}
                </Typography>
              </Box>
            </Collapse>
          </>
        )}
      </Alert>
    );
  }

  if (variant === "paper") {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          border: 1,
          borderColor: severity === "error" ? "error.main" : "warning.main",
        }}
      >
        {renderContent()}
      </Paper>
    );
  }

  // minimal variant
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        color: `${severity}.main`,
      }}
    >
      {getIcon()}
      <Typography variant="body2" color="inherit">
        {errorMessage}
      </Typography>
      {showRetry && onRetry && (
        <IconButton size="small" onClick={onRetry} color="inherit">
          <RefreshIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

export default ErrorDisplay;

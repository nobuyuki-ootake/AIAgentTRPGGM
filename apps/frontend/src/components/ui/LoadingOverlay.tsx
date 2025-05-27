import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  LinearProgress,
  Paper,
  Fade,
} from "@mui/material";
import { SmartToy as AIIcon } from "@mui/icons-material";

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  variant?: "overlay" | "inline" | "minimal";
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  message = "処理中...",
  progress,
  showProgress = false,
  variant = "overlay",
}) => {
  if (!open) return null;

  const renderContent = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        p: variant === "minimal" ? 1 : 3,
      }}
    >
      <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
        <CircularProgress
          size={variant === "minimal" ? 24 : 48}
          color="primary"
          {...(showProgress && progress !== undefined
            ? { variant: "determinate", value: progress }
            : {})}
        />
        {variant !== "minimal" && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <AIIcon
              sx={{
                fontSize: 20,
                color: "primary.main",
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 0.6 },
                  "50%": { opacity: 1 },
                  "100%": { opacity: 0.6 },
                },
              }}
            />
          </Box>
        )}
      </Box>

      {variant !== "minimal" && (
        <>
          <Typography
            variant="body1"
            color="text.primary"
            textAlign="center"
            sx={{ fontWeight: 500 }}
          >
            {message}
          </Typography>

          {showProgress && progress !== undefined && (
            <Box sx={{ width: "100%", maxWidth: 300 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block", textAlign: "center" }}
              >
                {Math.round(progress)}%
              </Typography>
            </Box>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            この処理には少し時間がかかる場合があります
          </Typography>
        </>
      )}
    </Box>
  );

  if (variant === "overlay") {
    return (
      <Fade in={open}>
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              borderRadius: 2,
              maxWidth: 400,
              mx: 2,
            }}
          >
            {renderContent()}
          </Paper>
        </Box>
      </Fade>
    );
  }

  if (variant === "inline") {
    return (
      <Fade in={open}>
        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            my: 2,
          }}
        >
          {renderContent()}
        </Paper>
      </Fade>
    );
  }

  // minimal variant
  return (
    <Fade in={open}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {renderContent()}
        {message && (
          <Typography variant="caption" color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default LoadingOverlay;

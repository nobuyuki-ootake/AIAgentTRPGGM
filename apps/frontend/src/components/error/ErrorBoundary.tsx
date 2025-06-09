import React, { Component, ReactNode } from "react";
import { Box, Container, Button, Typography, Paper } from "@mui/material";
import { Error as ErrorIcon, Refresh as RefreshIcon, Home as HomeIcon } from "@mui/icons-material";
import ErrorDisplay from "../ui/ErrorDisplay";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
  section?: string;
  allowReset?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error);
      console.error("Error info:", errorInfo);
    }

    // Log error to external service in production
    if (process.env.NODE_ENV === "production") {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // TODO: Implement logging to external service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      section: this.props.section,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error("Error logged:", errorData);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo } = this.state;
      const sectionName = this.props.section || "アプリケーション";

      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <ErrorIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                {sectionName}でエラーが発生しました
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                申し訳ございませんが、予期しないエラーが発生しました。
                下記のボタンから再試行するか、ホームページに戻ってください。
              </Typography>
            </Box>

            <ErrorDisplay
              error={error}
              title={`${sectionName}エラー`}
              severity="error"
              variant="paper"
              showDetails={this.props.showDetails || process.env.NODE_ENV === "development"}
              showRetry={false}
            />

            <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "center" }}>
              {this.props.allowReset !== false && (
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReset}
                  color="primary"
                >
                  再試行
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.handleGoHome}
              >
                ホームに戻る
              </Button>
            </Box>

            {process.env.NODE_ENV === "development" && errorInfo && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  開発者情報:
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: "grey.100",
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    overflow: "auto",
                    maxHeight: 300,
                  }}
                >
                  <pre>{errorInfo.componentStack}</pre>
                </Box>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
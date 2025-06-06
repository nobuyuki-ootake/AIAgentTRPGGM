import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
} from '@mui/material';

interface TRPGErrorBoundaryProps {
  children: React.ReactNode;
}

interface TRPGErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class TRPGErrorBoundary extends React.Component<
  TRPGErrorBoundaryProps,
  TRPGErrorBoundaryState
> {
  constructor(props: TRPGErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TRPGErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TRPGSessionPage Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h5" color="error" gutterBottom>
              TRPGセッションページでエラーが発生しました
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              エラー詳細: {this.state.error?.message}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default TRPGErrorBoundary;
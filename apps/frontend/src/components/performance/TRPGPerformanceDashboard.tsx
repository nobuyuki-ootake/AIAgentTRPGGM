import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent
} from '@mui/material';

export const TRPGPerformanceDashboard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Performance Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Performance dashboard temporarily disabled due to dependency issues.
            Will be restored after package updates.
          </Typography>
          {onClose && (
            <Button variant="contained" onClick={onClose}>
              Close
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Modal wrapper for the dashboard
export const TRPGPerformanceDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  return (
    <TRPGPerformanceDashboard onClose={onClose} />
  );
};

export default TRPGPerformanceDashboard;

/*
 * TODO: Restore full performance dashboard implementation
 * 
 * The complete dashboard implementation has been temporarily disabled
 * due to recharts dependency issues and Material-UI Grid API compatibility.
 * 
 * Features to restore:
 * - Real-time performance monitoring
 * - Memory usage analysis
 * - Resource loading metrics
 * - Performance test suite integration
 * - Interactive charts and visualizations
 * 
 * Dependencies needed:
 * - recharts (for charts)
 * - Performance monitoring hooks
 * - TRPG performance test suite
 */
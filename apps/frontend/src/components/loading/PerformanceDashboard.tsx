import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Speed,
  TrendingUp,
  TrendingDown,
  Assessment,
  Download,
  Refresh
} from '@mui/icons-material';
import { performanceMonitor, PerformanceAnalytics, PerformanceMetric } from '../../utils/performanceMonitor';

export const PerformanceDashboard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [operations, setOperations] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Get all unique operation types
    const allMetrics = Array.from((performanceMonitor as any).metrics.values()) as PerformanceMetric[];
    const uniqueOperations = Array.from(new Set(allMetrics.map(m => m.operationType)));
    setOperations(uniqueOperations);

    // Get analytics for selected operation
    const analyticsData = selectedOperation === 'all' 
      ? performanceMonitor.getAnalytics()
      : performanceMonitor.getAnalytics(selectedOperation);
    
    setAnalytics(analyticsData);
  }, [selectedOperation, refreshTrigger]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleExport = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trpg-performance-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!analytics) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" p={4}>
            <Typography>Loading performance data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const overallScore = selectedOperation === 'all' 
    ? Math.round(operations.reduce((sum, op) => 
        sum + performanceMonitor.getPerformanceScore(op), 0) / Math.max(operations.length, 1))
    : Math.round(performanceMonitor.getPerformanceScore(selectedOperation));

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Performance Dashboard</Typography>
        <Box display="flex" gap={2}>
          <Button startIcon={<Refresh />} onClick={handleRefresh}>
            Refresh
          </Button>
          <Button startIcon={<Download />} onClick={handleExport}>
            Export Data
          </Button>
          {onClose && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter */}
      <Box mb={3}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Operation Type</InputLabel>
          <Select
            value={selectedOperation}
            label="Operation Type"
            onChange={(e) => setSelectedOperation(e.target.value)}
          >
            <MenuItem value="all">All Operations</MenuItem>
            {operations.map(op => (
              <MenuItem key={op} value={op}>
                {op.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Assessment color="primary" />
                <Box>
                  <Typography variant="h4">{overallScore}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Performance Score
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={overallScore}
                color={getPerformanceColor(overallScore) as any}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Speed color="primary" />
                <Box>
                  <Typography variant="h4">
                    {formatDuration(analytics.averageDuration)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Duration
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Median: {formatDuration(analytics.medianDuration)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingUp color="success" />
                <Box>
                  <Typography variant="h4">
                    {analytics.successRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Success Rate
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {analytics.totalOperations} total operations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <TrendingDown color="error" />
                <Box>
                  <Typography variant="h4">
                    {analytics.failureRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failure Rate
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Timeout: {analytics.timeoutRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Last Hour</Typography>
                <Chip 
                  label={analytics.operationsLastHour} 
                  size="small" 
                  color="primary"
                />
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Last 24 Hours</Typography>
                <Chip 
                  label={analytics.operationsLast24h} 
                  size="small" 
                  color="secondary"
                />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Total</Typography>
                <Chip 
                  label={analytics.totalOperations} 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Range
              </Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Fastest</Typography>
                  <Typography variant="body2" color="success.main">
                    {formatDuration(analytics.minDuration)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Average</Typography>
                  <Typography variant="body2">
                    {formatDuration(analytics.averageDuration)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Slowest</Typography>
                  <Typography variant="body2" color="error.main">
                    {formatDuration(analytics.maxDuration)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Operation Tables */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Slowest Operations
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Operation</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.slowestOperations.slice(0, 5).map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">
                            {metric.operationType}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(metric.startTime).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={metric.duration! > 30000 ? 'error' : 'text.primary'}
                          >
                            {formatDuration(metric.duration!)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={metric.status} 
                            size="small"
                            color={
                              metric.status === 'completed' ? 'success' :
                              metric.status === 'failed' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fastest Operations
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Operation</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.fastestOperations.slice(0, 5).map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">
                            {metric.operationType}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(metric.startTime).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="success.main">
                            {formatDuration(metric.duration!)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={metric.status} 
                            size="small"
                            color={
                              metric.status === 'completed' ? 'success' :
                              metric.status === 'failed' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Modal wrapper for the dashboard
export const PerformanceDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
    <DialogTitle>Performance Dashboard</DialogTitle>
    <DialogContent>
      <PerformanceDashboard />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default PerformanceDashboard;
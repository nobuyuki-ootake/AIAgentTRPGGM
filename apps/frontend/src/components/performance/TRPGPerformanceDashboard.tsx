import React, { useState, useEffect, useCallback } from 'react';
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
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Speed,
  Memory,
  TrendingUp,
  TrendingDown,
  Assessment,
  Download,
  Refresh,
  PlayArrow,
  Stop,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  ExpandMore,
  Info,
  Timeline as TimelineIcon,
  Storage,
  NetworkCheck,
  BugReport
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { performanceMonitor, PerformanceAnalytics, PerformanceMetric } from '../../utils/performanceMonitor';
import { trpgPerformanceTestSuite, TRPGTestResult, TRPG_BENCHMARKS } from '../../utils/trpgPerformanceTesting';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const TRPGPerformanceDashboard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [operations, setOperations] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [isRealTimeMonitoring, setIsRealTimeMonitoring] = useState(false);
  const [testResults, setTestResults] = useState<TRPGTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [memoryHistory, setMemoryHistory] = useState<Array<{timestamp: number, usage: number}>>([]);

  const performanceHooks = usePerformanceMonitoring({
    componentName: 'TRPGPerformanceDashboard',
    enableMemoryMonitoring: true,
    enableResourceMonitoring: true
  });

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

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRealTimeMonitoring) {
      intervalId = setInterval(() => {
        setRefreshTrigger(prev => prev + 1);
        
        // Track memory usage over time
        if (performanceHooks.memory?.memoryUsage.length) {
          const latest = performanceHooks.memory.memoryUsage[performanceHooks.memory.memoryUsage.length - 1];
          setMemoryHistory(prev => {
            const newHistory = [...prev, {
              timestamp: latest.timestamp,
              usage: latest.usedJSHeapSize / 1024 / 1024 // Convert to MB
            }];
            return newHistory.slice(-50); // Keep last 50 measurements
          });
        }
      }, 2000); // Update every 2 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRealTimeMonitoring, performanceHooks.memory?.memoryUsage]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getHealthStatus = () => {
    if (!analytics) return 'unknown';
    if (analytics.successRate >= 95 && analytics.averageDuration < 5000) return 'excellent';
    if (analytics.successRate >= 90 && analytics.averageDuration < 10000) return 'good';
    if (analytics.successRate >= 80 && analytics.averageDuration < 20000) return 'fair';
    return 'poor';
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleExport = () => {
    const data = {
      metrics: performanceMonitor.exportMetrics(),
      testResults,
      memoryHistory,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trpg-performance-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runPerformanceTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await trpgPerformanceTestSuite.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('Failed to run performance tests:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const runSingleTest = async (testName: string) => {
    try {
      const result = await trpgPerformanceTestSuite.runTest(testName);
      setTestResults(prev => {
        const newResults = prev.filter(r => r.testName !== testName);
        return [...newResults, result];
      });
    } catch (error) {
      console.error(`Failed to run test ${testName}:`, error);
    }
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

  const healthStatus = getHealthStatus();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">TRPG Performance Dashboard</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={isRealTimeMonitoring}
                onChange={(e) => setIsRealTimeMonitoring(e.target.checked)}
              />
            }
            label="Real-time Monitoring"
          />
          <Button 
            startIcon={<Refresh />} 
            onClick={handleRefresh}
            disabled={isRealTimeMonitoring}
          >
            Refresh
          </Button>
          <Button startIcon={<Download />} onClick={handleExport}>
            Export Report
          </Button>
          {onClose && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </Box>
      </Box>

      {/* Health Status Alert */}
      <Box mb={3}>
        <Alert 
          severity={
            healthStatus === 'excellent' ? 'success' :
            healthStatus === 'good' ? 'info' :
            healthStatus === 'fair' ? 'warning' : 'error'
          }
          icon={
            healthStatus === 'excellent' ? <CheckCircle /> :
            healthStatus === 'good' ? <Info /> :
            healthStatus === 'fair' ? <Warning /> : <ErrorIcon />
          }
        >
          System Performance: {healthStatus.toUpperCase()} 
          {healthStatus === 'poor' && ' - Immediate attention required'}
          {healthStatus === 'fair' && ' - Consider optimization'}
          {healthStatus === 'good' && ' - Performance is acceptable'}
          {healthStatus === 'excellent' && ' - System running optimally'}
        </Alert>
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Performance Tests" />
          <Tab label="Memory Analysis" />
          <Tab label="Resource Monitoring" />
          <Tab label="Real-time Metrics" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
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
                  color={getPerformanceColor(overallScore)}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
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

          <Grid item xs={12} sm={6} md={3}>
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

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  {performanceHooks.memory ? <Memory color="info" /> : <TrendingDown color="error" />}
                  <Box>
                    <Typography variant="h4">
                      {performanceHooks.memory ? 
                        formatBytes(performanceHooks.memory.memoryUsage[performanceHooks.memory.memoryUsage.length - 1]?.usedJSHeapSize || 0) :
                        analytics.failureRate.toFixed(1) + '%'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {performanceHooks.memory ? 'Memory Usage' : 'Failure Rate'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {performanceHooks.memory ? 
                    `Pressure: ${performanceHooks.memory.pressure}` :
                    `Timeout: ${analytics.timeoutRate.toFixed(1)}%`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Performance Trends Chart */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={memoryHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                      formatter={(value) => [`${value.toFixed(2)} MB`, 'Memory Usage']}
                    />
                    <Line type="monotone" dataKey="usage" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Benchmark Comparison
                </Typography>
                <Box>
                  {Object.entries(TRPG_BENCHMARKS.campaignLoad).map(([size, benchmark]) => {
                    const actualPerformance = performanceMonitor.getAnalytics('campaign-load').averageDuration;
                    const performance = actualPerformance > 0 ? (benchmark / actualPerformance) * 100 : 100;
                    
                    return (
                      <Box key={size} mb={2}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">{size} campaign</Typography>
                          <Typography variant="body2">
                            {performance.toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(performance, 100)}
                          color={performance >= 100 ? 'success' : performance >= 80 ? 'warning' : 'error'}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Operation Tables */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
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

          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Box>
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
                  <Box display="flex" justifyContent="space-between" mb={3}>
                    <Typography variant="body2">Total</Typography>
                    <Chip 
                      label={analytics.totalOperations} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="h6" gutterBottom>
                    Performance Range
                  </Typography>
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
      </TabPanel>

      {/* Performance Tests Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">TRPG Performance Test Suite</Typography>
          <Button
            variant="contained"
            startIcon={isRunningTests ? <Stop /> : <PlayArrow />}
            onClick={runPerformanceTests}
            disabled={isRunningTests}
          >
            {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </Box>

        {/* Test Categories */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {Object.entries(trpgPerformanceTestSuite.getTestSummary().testCategories).map(([category, count]) => (
            <Grid item key={category}>
              <Chip 
                label={`${category}: ${count} tests`}
                variant="outlined"
                size="small"
              />
            </Grid>
          ))}
        </Grid>

        {/* Test Results */}
        {testResults.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testResults.map((result, index) => {
                  const benchmark = Object.values(TRPG_BENCHMARKS).flat()
                    .find(b => typeof b === 'object' && Object.values(b).includes(result.duration)) as any;
                  const performance = benchmark ? (benchmark / result.duration) * 100 : 0;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {result.testName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          {result.errors && result.errors.length > 0 && (
                            <Typography variant="caption" color="error">
                              {result.errors[0]}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDuration(result.duration)}</TableCell>
                      <TableCell>
                        <Chip
                          label={result.success ? 'Passed' : 'Failed'}
                          color={result.success ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {performance > 0 && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(performance, 100)}
                              color={performance >= 100 ? 'success' : performance >= 80 ? 'warning' : 'error'}
                              sx={{ width: 60 }}
                            />
                            <Typography variant="caption">
                              {performance.toFixed(0)}%
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => runSingleTest(result.testName)}
                          title="Rerun Test"
                        >
                          <Refresh />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Memory Analysis Tab */}
      <TabPanel value={activeTab} index={2}>
        {performanceHooks.memory && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Memory Usage Over Time
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={memoryHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                      />
                      <YAxis />
                      <RechartsTooltip 
                        labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                        formatter={(value) => [`${value.toFixed(2)} MB`, 'Memory Usage']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="usage" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Memory Statistics
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Current Usage</Typography>
                    <Typography variant="h6">
                      {formatBytes(performanceHooks.memory.memoryUsage[performanceHooks.memory.memoryUsage.length - 1]?.usedJSHeapSize || 0)}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Total Heap</Typography>
                    <Typography variant="h6">
                      {formatBytes(performanceHooks.memory.memoryUsage[performanceHooks.memory.memoryUsage.length - 1]?.totalJSHeapSize || 0)}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Heap Limit</Typography>
                    <Typography variant="h6">
                      {formatBytes(performanceHooks.memory.memoryUsage[performanceHooks.memory.memoryUsage.length - 1]?.jsHeapSizeLimit || 0)}
                    </Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Memory Pressure</Typography>
                    <Chip 
                      label={performanceHooks.memory.pressure}
                      color={
                        performanceHooks.memory.pressure === 'low' ? 'success' :
                        performanceHooks.memory.pressure === 'medium' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Trend</Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {performanceHooks.memory.trend === 'increasing' ? (
                        <TrendingUp color="error" />
                      ) : performanceHooks.memory.trend === 'decreasing' ? (
                        <TrendingDown color="success" />
                      ) : (
                        <TimelineIcon color="info" />
                      )}
                      <Typography variant="body2">
                        {performanceHooks.memory.trend}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Resource Monitoring Tab */}
      <TabPanel value={activeTab} index={3}>
        {performanceHooks.resources && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resource Loading Performance
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceHooks.resources.resources.slice(-20)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={false}
                      />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value, name) => [
                          name === 'duration' ? formatDuration(value as number) : formatBytes(value as number),
                          name === 'duration' ? 'Load Time' : 'Transfer Size'
                        ]}
                      />
                      <Bar dataKey="duration" fill="#8884d8" name="duration" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resource Summary
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Total Resources</Typography>
                    <Typography variant="h6">{performanceHooks.resources.resources.length}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Total Transfer Size</Typography>
                    <Typography variant="h6">{formatBytes(performanceHooks.resources.totalTransferSize)}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">Slow Resources</Typography>
                    <Typography variant="h6" color="error">
                      {performanceHooks.resources.slowResources.length}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Large Resources</Typography>
                    <Typography variant="h6" color="warning.main">
                      {performanceHooks.resources.largeResources.length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Resource Type Breakdown */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resource Type Breakdown
                  </Typography>
                  <Grid container spacing={2}>
                    {['script', 'stylesheet', 'image', 'fetch'].map(type => {
                      const resourcesOfType = performanceHooks.resources!.getResourcesByType(type);
                      const totalSize = resourcesOfType.reduce((sum, r) => sum + r.transferSize, 0);
                      
                      return (
                        <Grid item xs={12} sm={6} md={3} key={type}>
                          <Box p={2} border={1} borderColor="divider" borderRadius={1}>
                            <Typography variant="body2" color="text.secondary" textTransform="capitalize">
                              {type}
                            </Typography>
                            <Typography variant="h6">{resourcesOfType.length}</Typography>
                            <Typography variant="caption">
                              {formatBytes(totalSize)}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Real-time Metrics Tab */}
      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Live Performance Score</Typography>
                  <Typography variant="h4" color={getPerformanceColor(performanceHooks.performanceScore)}>
                    {performanceHooks.performanceScore.toFixed(0)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={performanceHooks.performanceScore}
                  color={getPerformanceColor(performanceHooks.performanceScore)}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>System Health Indicators</Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Memory Pressure</Typography>
                    <Chip 
                      label={performanceHooks.memory?.pressure || 'Unknown'}
                      color={
                        performanceHooks.memory?.pressure === 'low' ? 'success' :
                        performanceHooks.memory?.pressure === 'medium' ? 'warning' : 'error'
                      }
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Resource Loading</Typography>
                    <Chip 
                      label={performanceHooks.resources?.slowResources.length === 0 ? 'Optimal' : 'Issues Detected'}
                      color={performanceHooks.resources?.slowResources.length === 0 ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">API Performance</Typography>
                    <Chip 
                      label={analytics.successRate >= 95 ? 'Excellent' : analytics.successRate >= 90 ? 'Good' : 'Poor'}
                      color={analytics.successRate >= 95 ? 'success' : analytics.successRate >= 90 ? 'info' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Metrics Updates */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Real-time Activity Monitor</Typography>
                <Typography variant="body2" color="text.secondary">
                  {isRealTimeMonitoring ? 'Monitoring active - updates every 2 seconds' : 'Real-time monitoring disabled'}
                </Typography>
                {isRealTimeMonitoring && (
                  <Box mt={2}>
                    <Typography variant="body2">
                      Last Update: {new Date().toLocaleTimeString()}
                    </Typography>
                    <Typography variant="body2">
                      Operations in Last Hour: {analytics.operationsLastHour}
                    </Typography>
                    <Typography variant="body2">
                      Current Success Rate: {analytics.successRate.toFixed(1)}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

// Modal wrapper for the dashboard
export const TRPGPerformanceDashboardModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
    <DialogTitle>TRPG Performance Dashboard</DialogTitle>
    <DialogContent>
      <TRPGPerformanceDashboard />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default TRPGPerformanceDashboard;
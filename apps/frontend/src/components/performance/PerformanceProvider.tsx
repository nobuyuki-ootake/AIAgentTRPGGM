import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Snackbar, Alert, Fab, Badge } from '@mui/material';
import { Speed, Warning } from '@mui/icons-material';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { resourceTracker } from '../../utils/resourceTracker';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';
import { TRPGPerformanceDashboardModal } from './TRPGPerformanceDashboard';

interface PerformanceContextType {
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  showDashboard: () => void;
  hideDashboard: () => void;
  currentScore: number;
  activeAlerts: number;
  resourceSummary: any;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

interface PerformanceProviderProps {
  children: React.ReactNode;
  enableAutoMonitoring?: boolean;
  enableAlerts?: boolean;
  showFloatingButton?: boolean;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({
  children,
  enableAutoMonitoring = false,
  enableAlerts = true,
  showFloatingButton = true
}) => {
  const [isMonitoring, setIsMonitoring] = useState(enableAutoMonitoring);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ id: string; message: string; severity: 'warning' | 'error' }>>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const performanceHooks = usePerformanceMonitoring({
    componentName: 'PerformanceProvider',
    enableMemoryMonitoring: isMonitoring,
    enableResourceMonitoring: isMonitoring
  });

  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    resourceTracker.startTracking();
    console.log('Performance monitoring started');
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    resourceTracker.stopTracking();
    console.log('Performance monitoring stopped');
  }, []);

  // Dashboard controls
  const showDashboard = useCallback(() => setIsDashboardOpen(true), []);
  const hideDashboard = useCallback(() => setIsDashboardOpen(false), []);

  // Alert management
  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    resourceTracker.resolveAlert(alertId);
  }, []);

  // Monitor for performance issues and create alerts
  useEffect(() => {
    if (!isMonitoring || !enableAlerts) return;

    const checkPerformanceIssues = () => {
      const resourceSummary = resourceTracker.getResourceSummary();
      const activeResourceAlerts = resourceTracker.getActiveAlerts();
      const newAlerts: Array<{ id: string; message: string; severity: 'warning' | 'error' }> = [];

      // Memory pressure alerts
      if (performanceHooks.memory?.pressure === 'high') {
        newAlerts.push({
          id: `memory-pressure-${Date.now()}`,
          message: 'High memory usage detected. Consider closing unused features.',
          severity: 'warning'
        });
      } else if (performanceHooks.memory?.pressure === 'critical') {
        newAlerts.push({
          id: `memory-critical-${Date.now()}`,
          message: 'Critical memory usage! The application may become unstable.',
          severity: 'error'
        });
      }

      // Network performance alerts
      if (resourceSummary.network.failures > 5) {
        newAlerts.push({
          id: `network-failures-${Date.now()}`,
          message: `Multiple network failures detected (${resourceSummary.network.failures}). Check your connection.`,
          severity: 'warning'
        });
      }

      // CPU performance alerts
      if (resourceSummary.cpu.frameDrops > 10) {
        newAlerts.push({
          id: `frame-drops-${Date.now()}`,
          message: 'Performance issues detected. Consider reducing visual effects.',
          severity: 'warning'
        });
      }

      // Resource tracker alerts
      activeResourceAlerts.forEach(alert => {
        if (!dismissedAlerts.has(alert.id)) {
          newAlerts.push({
            id: alert.id,
            message: alert.message,
            severity: alert.severity === 'critical' || alert.severity === 'high' ? 'error' : 'warning'
          });
        }
      });

      // Update alerts state
      setAlerts(prev => {
        const existingIds = new Set(prev.map(alert => alert.id));
        const filteredNew = newAlerts.filter(alert => !existingIds.has(alert.id));
        return [...prev, ...filteredNew];
      });
    };

    const interval = setInterval(checkPerformanceIssues, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [isMonitoring, enableAlerts, performanceHooks.memory?.pressure, dismissedAlerts]);

  // Auto-start monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && enableAutoMonitoring) {
      startMonitoring();
    }
  }, [enableAutoMonitoring, startMonitoring]);

  // Context value
  const contextValue: PerformanceContextType = {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    showDashboard,
    hideDashboard,
    currentScore: performanceHooks.performanceScore,
    activeAlerts: alerts.filter(alert => !dismissedAlerts.has(alert.id)).length,
    resourceSummary: resourceTracker.getResourceSummary()
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}

      {/* Performance Alerts */}
      {enableAlerts && alerts.map(alert => (
        !dismissedAlerts.has(alert.id) && (
          <Snackbar
            key={alert.id}
            open={true}
            autoHideDuration={alert.severity === 'error' ? null : 6000}
            onClose={() => dismissAlert(alert.id)}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Alert
              severity={alert.severity}
              onClose={() => dismissAlert(alert.id)}
              variant="filled"
            >
              {alert.message}
            </Alert>
          </Snackbar>
        )
      ))}

      {/* Floating Performance Button */}
      {showFloatingButton && isMonitoring && (
        <Fab
          color="primary"
          aria-label="performance"
          onClick={showDashboard}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            opacity: 0.8,
            '&:hover': {
              opacity: 1
            }
          }}
        >
          <Badge 
            badgeContent={contextValue.activeAlerts} 
            color="error"
            max={99}
          >
            <Speed />
          </Badge>
        </Fab>
      )}

      {/* Performance Dashboard Modal */}
      <TRPGPerformanceDashboardModal
        open={isDashboardOpen}
        onClose={hideDashboard}
      />
    </PerformanceContext.Provider>
  );
};

export default PerformanceProvider;
// Performance monitoring components and utilities
export { default as TRPGPerformanceDashboard, TRPGPerformanceDashboardModal } from './TRPGPerformanceDashboard';
export { default as PerformanceProvider, usePerformance } from './PerformanceProvider';

// Performance hooks and utilities
export { usePerformanceMonitoring, useComponentPerformance, usePageLoadPerformance, useMemoryMonitoring, useAPIPerformance, useResourceMonitoring } from '../../hooks/usePerformanceMonitoring';

// Performance testing utilities
export { trpgPerformanceTestSuite, TRPGTestDataGenerator, TRPG_BENCHMARKS } from '../../utils/trpgPerformanceTesting';

// Resource tracking
export { resourceTracker } from '../../utils/resourceTracker';

// Performance monitor
export { performanceMonitor } from '../../utils/performanceMonitor';

// Types
export type {
  PerformanceMetric,
  PerformanceAnalytics,
  PerformanceBenchmark
} from '../../utils/performanceMonitor';

export type {
  TRPGPerformanceTest,
  TRPGTestResult,
  CampaignLoadTestConfig,
  TRPGPerformanceBenchmarks
} from '../../utils/trpgPerformanceTesting';

export type {
  ResourceUsage,
  NetworkRequest,
  PerformanceAlert,
  ResourceThresholds
} from '../../utils/resourceTracker';

export type {
  MemoryUsage,
  ResourceTiming,
  PerformanceVitals
} from '../../hooks/usePerformanceMonitoring';
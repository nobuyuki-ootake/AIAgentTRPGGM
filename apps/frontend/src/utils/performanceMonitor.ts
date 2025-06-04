export interface PerformanceMetric {
  operationId: string;
  operationType: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  sessionId?: string;
}

export interface PerformanceAnalytics {
  averageDuration: number;
  medianDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  failureRate: number;
  timeoutRate: number;
  totalOperations: number;
  operationsLast24h: number;
  operationsLastHour: number;
  slowestOperations: PerformanceMetric[];
  fastestOperations: PerformanceMetric[];
}

export interface PerformanceBenchmark {
  operationType: string;
  expectedDuration: number;
  acceptableRange: number;
  warningThreshold: number;
  errorThreshold: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private benchmarks: Map<string, PerformanceBenchmark> = new Map();
  private sessionId: string;
  private maxMetricsRetention = 1000;
  private storageKey = 'trpg_performance_metrics';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredMetrics();
    this.setupBenchmarks();
    
    // Cleanup old metrics periodically
    setInterval(() => this.cleanupOldMetrics(), 5 * 60 * 1000); // Every 5 minutes
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupBenchmarks(): void {
    const defaultBenchmarks: PerformanceBenchmark[] = [
      {
        operationType: 'campaign-load',
        expectedDuration: 3000,
        acceptableRange: 2000,
        warningThreshold: 8000,
        errorThreshold: 15000
      },
      {
        operationType: 'character-sheet',
        expectedDuration: 2000,
        acceptableRange: 1500,
        warningThreshold: 6000,
        errorThreshold: 10000
      },
      {
        operationType: 'ai-generation',
        expectedDuration: 25000,
        acceptableRange: 15000,
        warningThreshold: 45000,
        errorThreshold: 60000
      },
      {
        operationType: 'image-generation',
        expectedDuration: 35000,
        acceptableRange: 20000,
        warningThreshold: 60000,
        errorThreshold: 90000
      },
      {
        operationType: 'timeline-processing',
        expectedDuration: 5000,
        acceptableRange: 3000,
        warningThreshold: 12000,
        errorThreshold: 20000
      },
      {
        operationType: 'session-initialization',
        expectedDuration: 8000,
        acceptableRange: 5000,
        warningThreshold: 20000,
        errorThreshold: 30000
      },
      {
        operationType: 'world-building-load',
        expectedDuration: 6000,
        acceptableRange: 4000,
        warningThreshold: 15000,
        errorThreshold: 25000
      },
      {
        operationType: 'dice-animation',
        expectedDuration: 1500,
        acceptableRange: 800,
        warningThreshold: 3000,
        errorThreshold: 5000
      }
    ];

    defaultBenchmarks.forEach(benchmark => {
      this.benchmarks.set(benchmark.operationType, benchmark);
    });
  }

  private loadStoredMetrics(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Only load recent metrics (last 24 hours)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        
        Object.entries(data).forEach(([key, metric]: [string, any]) => {
          if (metric.startTime > dayAgo) {
            this.metrics.set(key, metric);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load stored performance metrics:', error);
    }
  }

  private saveMetrics(): void {
    try {
      const metricsObj = Object.fromEntries(this.metrics);
      localStorage.setItem(this.storageKey, JSON.stringify(metricsObj));
    } catch (error) {
      console.warn('Failed to save performance metrics:', error);
    }
  }

  private cleanupOldMetrics(): void {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const keysToDelete: string[] = [];

    this.metrics.forEach((metric, key) => {
      if (metric.startTime < dayAgo) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.metrics.delete(key));

    // Enforce max retention limit
    if (this.metrics.size > this.maxMetricsRetention) {
      const sortedMetrics = Array.from(this.metrics.entries())
        .sort(([, a], [, b]) => b.startTime - a.startTime);
      
      const toKeep = sortedMetrics.slice(0, this.maxMetricsRetention);
      this.metrics.clear();
      toKeep.forEach(([key, metric]) => this.metrics.set(key, metric));
    }

    this.saveMetrics();
  }

  startOperation(
    operationId: string,
    operationType: string,
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      operationId,
      operationType,
      startTime: Date.now(),
      status: 'started',
      metadata,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId
    };

    this.metrics.set(operationId, metric);
    this.saveMetrics();
  }

  completeOperation(operationId: string, metadata?: Record<string, any>): void {
    const metric = this.metrics.get(operationId);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const updatedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      status: 'completed',
      metadata: { ...metric.metadata, ...metadata }
    };

    this.metrics.set(operationId, updatedMetric);
    this.saveMetrics();

    // Log performance warnings
    this.checkPerformanceThresholds(updatedMetric);
  }

  failOperation(operationId: string, error: string, metadata?: Record<string, any>): void {
    const metric = this.metrics.get(operationId);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const updatedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      status: 'failed',
      error,
      metadata: { ...metric.metadata, ...metadata }
    };

    this.metrics.set(operationId, updatedMetric);
    this.saveMetrics();
  }

  cancelOperation(operationId: string): void {
    const metric = this.metrics.get(operationId);
    if (!metric) return;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const updatedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      status: 'cancelled'
    };

    this.metrics.set(operationId, updatedMetric);
    this.saveMetrics();
  }

  getOperationMetric(operationId: string): PerformanceMetric | undefined {
    return this.metrics.get(operationId);
  }

  getAnalytics(operationType?: string): PerformanceAnalytics {
    const relevantMetrics = Array.from(this.metrics.values())
      .filter(metric => {
        if (operationType && metric.operationType !== operationType) return false;
        return metric.status === 'completed' && metric.duration !== undefined;
      });

    if (relevantMetrics.length === 0) {
      return {
        averageDuration: 0,
        medianDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        failureRate: 0,
        timeoutRate: 0,
        totalOperations: 0,
        operationsLast24h: 0,
        operationsLastHour: 0,
        slowestOperations: [],
        fastestOperations: []
      };
    }

    const durations = relevantMetrics.map(m => m.duration!).sort((a, b) => a - b);
    const totalMetrics = Array.from(this.metrics.values())
      .filter(metric => !operationType || metric.operationType === operationType);

    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const completed = totalMetrics.filter(m => m.status === 'completed').length;
    const failed = totalMetrics.filter(m => m.status === 'failed').length;
    const cancelled = totalMetrics.filter(m => m.status === 'cancelled').length;
    const total = completed + failed + cancelled;

    return {
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: durations[Math.floor(durations.length / 2)] || 0,
      minDuration: durations[0] || 0,
      maxDuration: durations[durations.length - 1] || 0,
      successRate: total > 0 ? (completed / total) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
      timeoutRate: total > 0 ? (cancelled / total) * 100 : 0,
      totalOperations: total,
      operationsLast24h: totalMetrics.filter(m => m.startTime > dayAgo).length,
      operationsLastHour: totalMetrics.filter(m => m.startTime > hourAgo).length,
      slowestOperations: relevantMetrics
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 5),
      fastestOperations: relevantMetrics
        .sort((a, b) => (a.duration || 0) - (b.duration || 0))
        .slice(0, 5)
    };
  }

  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const benchmark = this.benchmarks.get(metric.operationType);
    if (!benchmark || !metric.duration) return;

    const duration = metric.duration;

    if (duration > benchmark.errorThreshold) {
      console.error(`Performance: ${metric.operationType} took ${duration}ms (expected ${benchmark.expectedDuration}ms)`);
    } else if (duration > benchmark.warningThreshold) {
      console.warn(`Performance: ${metric.operationType} took ${duration}ms (expected ${benchmark.expectedDuration}ms)`);
    }
  }

  getBenchmark(operationType: string): PerformanceBenchmark | undefined {
    return this.benchmarks.get(operationType);
  }

  setBenchmark(benchmark: PerformanceBenchmark): void {
    this.benchmarks.set(benchmark.operationType, benchmark);
  }

  getPerformanceScore(operationType: string): number {
    const analytics = this.getAnalytics(operationType);
    const benchmark = this.getBenchmark(operationType);
    
    if (!benchmark || analytics.totalOperations === 0) return 0;

    // Calculate score based on multiple factors
    const speedScore = Math.max(0, 100 - ((analytics.averageDuration - benchmark.expectedDuration) / benchmark.expectedDuration) * 100);
    const reliabilityScore = analytics.successRate;
    const consistencyScore = analytics.medianDuration > 0 
      ? Math.max(0, 100 - ((analytics.maxDuration - analytics.minDuration) / analytics.medianDuration) * 50)
      : 0;

    return (speedScore * 0.4 + reliabilityScore * 0.4 + consistencyScore * 0.2);
  }

  exportMetrics(): string {
    const data = {
      sessionId: this.sessionId,
      exportTime: Date.now(),
      metrics: Array.from(this.metrics.values()),
      analytics: this.getAnalytics()
    };
    
    return JSON.stringify(data, null, 2);
  }

  clearMetrics(): void {
    this.metrics.clear();
    localStorage.removeItem(this.storageKey);
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
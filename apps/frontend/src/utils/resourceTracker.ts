import { performanceMonitor } from './performanceMonitor';

// Resource tracking interfaces
export interface ResourceUsage {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    limit: number;
  };
  network: {
    totalRequests: number;
    failedRequests: number;
    totalBytes: number;
    avgResponseTime: number;
  };
  cpu: {
    estimatedUsage: number; // Estimated based on frame timing
    frameDrops: number;
  };
  storage: {
    localStorage: number;
    sessionStorage: number;
    indexedDB: number;
  };
}

export interface NetworkRequest {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  status?: number;
  responseSize?: number;
  requestSize?: number;
  failed: boolean;
  error?: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'memory' | 'network' | 'cpu' | 'storage' | 'api';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  data?: Record<string, any>;
  resolved?: boolean;
}

export interface ResourceThresholds {
  memory: {
    warning: number;    // 70% of heap limit
    critical: number;   // 90% of heap limit
  };
  network: {
    maxFailureRate: number;     // 5%
    maxResponseTime: number;    // 10 seconds
    maxRequestsPerMinute: number; // 100
  };
  cpu: {
    maxFrameDropRate: number;   // 10%
    maxEstimatedUsage: number;  // 80%
  };
  storage: {
    maxLocalStorage: number;    // 5MB
    maxSessionStorage: number;  // 5MB
    maxIndexedDB: number;       // 50MB
  };
}

class ResourceTracker {
  private isTracking = false;
  private resourceHistory: ResourceUsage[] = [];
  private networkRequests: NetworkRequest[] = [];
  private alerts: PerformanceAlert[] = [];
  private frameTimings: number[] = [];
  private lastFrameTime = 0;
  private animationFrameId?: number;
  
  private readonly maxHistorySize = 1000;
  private readonly maxNetworkRequestHistory = 500;
  private readonly maxAlerts = 100;
  
  private readonly thresholds: ResourceThresholds = {
    memory: {
      warning: 0.7,
      critical: 0.9
    },
    network: {
      maxFailureRate: 0.05,
      maxResponseTime: 10000,
      maxRequestsPerMinute: 100
    },
    cpu: {
      maxFrameDropRate: 0.1,
      maxEstimatedUsage: 0.8
    },
    storage: {
      maxLocalStorage: 5 * 1024 * 1024,
      maxSessionStorage: 5 * 1024 * 1024,
      maxIndexedDB: 50 * 1024 * 1024
    }
  };

  constructor() {
    this.setupNetworkMonitoring();
    this.setupPerformanceObservers();
  }

  startTracking(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.startFrameTracking();
    this.startResourcePolling();
    
    console.log('Resource tracking started');
  }

  stopTracking(): void {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    this.stopFrameTracking();
    
    console.log('Resource tracking stopped');
  }

  private startResourcePolling(): void {
    const pollResources = () => {
      if (!this.isTracking) return;
      
      this.collectResourceUsage();
      setTimeout(pollResources, 5000); // Poll every 5 seconds
    };
    
    pollResources();
  }

  private startFrameTracking(): void {
    const trackFrame = (timestamp: number) => {
      if (!this.isTracking) return;
      
      if (this.lastFrameTime > 0) {
        const frameDuration = timestamp - this.lastFrameTime;
        this.frameTimings.push(frameDuration);
        
        // Keep only last 1000 frame timings
        if (this.frameTimings.length > 1000) {
          this.frameTimings = this.frameTimings.slice(-1000);
        }
      }
      
      this.lastFrameTime = timestamp;
      this.animationFrameId = requestAnimationFrame(trackFrame);
    };
    
    this.animationFrameId = requestAnimationFrame(trackFrame);
  }

  private stopFrameTracking(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  private setupNetworkMonitoring(): void {
    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
      (this as any)._resourceTracker = {
        method,
        url: url.toString(),
        startTime: Date.now()
      };
      return originalXHROpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | BodyInit | null) {
      const tracker = (this as any)._resourceTracker;
      if (tracker) {
        this.addEventListener('loadend', () => {
          resourceTracker.recordNetworkRequest({
            url: tracker.url,
            method: tracker.method,
            startTime: tracker.startTime,
            endTime: Date.now(),
            status: this.status,
            responseSize: this.responseText?.length || 0,
            requestSize: body ? body.toString().length : 0,
            failed: this.status >= 400 || this.status === 0
          });
        });
      }
      return originalXHRSend.apply(this, arguments as any);
    };

    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0].toString();
      const method = typeof args[1] === 'object' && args[1]?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();
        
        // Try to get response size
        const clone = response.clone();
        let responseSize = 0;
        try {
          const text = await clone.text();
          responseSize = text.length;
        } catch (e) {
          // Ignore if we can't read the response
        }
        
        resourceTracker.recordNetworkRequest({
          url,
          method,
          startTime,
          endTime,
          status: response.status,
          responseSize,
          failed: !response.ok
        });
        
        return response;
      } catch (error) {
        resourceTracker.recordNetworkRequest({
          url,
          method,
          startTime,
          endTime: Date.now(),
          failed: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };
  }

  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks (potential CPU issues)
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.createAlert({
                type: 'cpu',
                severity: entry.duration > 100 ? 'high' : 'medium',
                message: `Long task detected: ${entry.duration.toFixed(2)}ms`,
                data: { duration: entry.duration, name: entry.name }
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('Long task observer not supported');
      }

      // Monitor layout shifts
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as any;
            if (layoutShift.value > 0.1) { // Significant layout shift
              this.createAlert({
                type: 'cpu',
                severity: layoutShift.value > 0.25 ? 'high' : 'medium',
                message: `Layout shift detected: ${layoutShift.value.toFixed(3)}`,
                data: { value: layoutShift.value }
              });
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.log('Layout shift observer not supported');
      }
    }
  }

  private collectResourceUsage(): void {
    const timestamp = Date.now();
    
    // Memory usage
    const memory = this.getMemoryUsage();
    
    // Network statistics
    const network = this.getNetworkStatistics();
    
    // CPU estimation
    const cpu = this.getCPUEstimation();
    
    // Storage usage
    const storage = this.getStorageUsage();

    const usage: ResourceUsage = {
      timestamp,
      memory,
      network,
      cpu,
      storage
    };

    this.resourceHistory.push(usage);
    
    // Maintain history size
    if (this.resourceHistory.length > this.maxHistorySize) {
      this.resourceHistory = this.resourceHistory.slice(-this.maxHistorySize);
    }

    // Check thresholds and create alerts
    this.checkThresholds(usage);
    
    // Record in performance monitor
    performanceMonitor.startOperation(
      `resource-usage-${timestamp}`,
      'resource-monitoring',
      usage
    );
  }

  private getMemoryUsage(): ResourceUsage['memory'] {
    const defaultMemory = { used: 0, total: 0, limit: 0 };
    
    if (!(performance as any).memory) {
      return defaultMemory;
    }

    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }

  private getNetworkStatistics(): ResourceUsage['network'] {
    const recentRequests = this.networkRequests.filter(req => 
      req.startTime > Date.now() - 60000 // Last minute
    );

    const totalRequests = recentRequests.length;
    const failedRequests = recentRequests.filter(req => req.failed).length;
    const totalBytes = recentRequests.reduce((sum, req) => 
      sum + (req.responseSize || 0) + (req.requestSize || 0), 0);
    const completedRequests = recentRequests.filter(req => req.endTime);
    const avgResponseTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, req) => sum + (req.endTime! - req.startTime), 0) / completedRequests.length
      : 0;

    return {
      totalRequests,
      failedRequests,
      totalBytes,
      avgResponseTime
    };
  }

  private getCPUEstimation(): ResourceUsage['cpu'] {
    const recentFrames = this.frameTimings.slice(-100); // Last 100 frames
    
    if (recentFrames.length === 0) {
      return { estimatedUsage: 0, frameDrops: 0 };
    }

    const targetFrameTime = 16.67; // 60 FPS
    const frameDrops = recentFrames.filter(timing => timing > targetFrameTime * 2).length;
    const avgFrameTime = recentFrames.reduce((sum, time) => sum + time, 0) / recentFrames.length;
    const estimatedUsage = Math.min(avgFrameTime / targetFrameTime, 2); // Cap at 200%

    return {
      estimatedUsage,
      frameDrops
    };
  }

  private getStorageUsage(): ResourceUsage['storage'] {
    const getStorageSize = (storage: Storage): number => {
      let total = 0;
      for (let key in storage) {
        if (storage.hasOwnProperty(key)) {
          total += storage[key].length + key.length;
        }
      }
      return total;
    };

    const localStorage = getStorageSize(window.localStorage);
    const sessionStorage = getStorageSize(window.sessionStorage);
    
    // IndexedDB size estimation (simplified)
    let indexedDB = 0;
    // Note: Getting accurate IndexedDB size requires async operations
    // This is a simplified estimation based on localStorage entries that might be IDB-related
    const idbKeys = Object.keys(window.localStorage).filter(key => 
      key.includes('idb') || key.includes('indexeddb') || key.includes('db')
    );
    indexedDB = idbKeys.reduce((sum, key) => sum + window.localStorage[key].length, 0);

    return {
      localStorage,
      sessionStorage,
      indexedDB
    };
  }

  private checkThresholds(usage: ResourceUsage): void {
    // Memory threshold checks
    if (usage.memory.limit > 0) {
      const memoryUsageRatio = usage.memory.used / usage.memory.limit;
      
      if (memoryUsageRatio > this.thresholds.memory.critical) {
        this.createAlert({
          type: 'memory',
          severity: 'critical',
          message: `Critical memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`,
          data: { usage: usage.memory }
        });
      } else if (memoryUsageRatio > this.thresholds.memory.warning) {
        this.createAlert({
          type: 'memory',
          severity: 'medium',
          message: `High memory usage: ${(memoryUsageRatio * 100).toFixed(1)}%`,
          data: { usage: usage.memory }
        });
      }
    }

    // Network threshold checks
    const failureRate = usage.network.totalRequests > 0 
      ? usage.network.failedRequests / usage.network.totalRequests 
      : 0;
    
    if (failureRate > this.thresholds.network.maxFailureRate) {
      this.createAlert({
        type: 'network',
        severity: failureRate > 0.2 ? 'high' : 'medium',
        message: `High network failure rate: ${(failureRate * 100).toFixed(1)}%`,
        data: { network: usage.network }
      });
    }

    if (usage.network.avgResponseTime > this.thresholds.network.maxResponseTime) {
      this.createAlert({
        type: 'network',
        severity: 'medium',
        message: `Slow network responses: ${usage.network.avgResponseTime.toFixed(0)}ms average`,
        data: { network: usage.network }
      });
    }

    // CPU threshold checks
    const frameDropRate = usage.cpu.frameDrops / 100; // Last 100 frames
    if (frameDropRate > this.thresholds.cpu.maxFrameDropRate) {
      this.createAlert({
        type: 'cpu',
        severity: frameDropRate > 0.3 ? 'high' : 'medium',
        message: `High frame drop rate: ${(frameDropRate * 100).toFixed(1)}%`,
        data: { cpu: usage.cpu }
      });
    }

    // Storage threshold checks
    Object.entries(usage.storage).forEach(([storageType, size]) => {
      const threshold = this.thresholds.storage[storageType as keyof ResourceThresholds['storage']];
      if (size > threshold) {
        this.createAlert({
          type: 'storage',
          severity: size > threshold * 1.5 ? 'high' : 'medium',
          message: `High ${storageType} usage: ${(size / 1024 / 1024).toFixed(2)}MB`,
          data: { storageType, size }
        });
      }
    });
  }

  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const newAlert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...alert
    };

    this.alerts.push(newAlert);
    
    // Maintain alerts size
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('CRITICAL Performance Alert:', alert.message, alert.data);
    } else if (alert.severity === 'high') {
      console.warn('Performance Alert:', alert.message, alert.data);
    }

    // Record in performance monitor
    performanceMonitor.startOperation(
      `performance-alert-${newAlert.id}`,
      'performance-alert',
      newAlert
    );
  }

  recordNetworkRequest(request: Omit<NetworkRequest, 'failed'> & { failed?: boolean }): void {
    const networkRequest: NetworkRequest = {
      ...request,
      failed: request.failed || false
    };

    this.networkRequests.push(networkRequest);
    
    // Maintain request history size
    if (this.networkRequests.length > this.maxNetworkRequestHistory) {
      this.networkRequests = this.networkRequests.slice(-this.maxNetworkRequestHistory);
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  getResourceHistory(minutes: number = 60): ResourceUsage[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.resourceHistory.filter(usage => usage.timestamp > cutoff);
  }

  getNetworkRequests(minutes: number = 60): NetworkRequest[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.networkRequests.filter(req => req.startTime > cutoff);
  }

  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getCurrentUsage(): ResourceUsage | null {
    return this.resourceHistory.length > 0 
      ? this.resourceHistory[this.resourceHistory.length - 1] 
      : null;
  }

  getResourceSummary(): {
    memory: { current: number; peak: number; trend: 'up' | 'down' | 'stable' };
    network: { requests: number; failures: number; avgResponse: number };
    cpu: { avgFrameTime: number; frameDrops: number };
    storage: { total: number; breakdown: Record<string, number> };
    alerts: { total: number; critical: number; active: number };
  } {
    const recent = this.getResourceHistory(10); // Last 10 minutes
    
    if (recent.length === 0) {
      return {
        memory: { current: 0, peak: 0, trend: 'stable' },
        network: { requests: 0, failures: 0, avgResponse: 0 },
        cpu: { avgFrameTime: 0, frameDrops: 0 },
        storage: { total: 0, breakdown: {} },
        alerts: { total: 0, critical: 0, active: 0 }
      };
    }

    const current = recent[recent.length - 1];
    const peak = recent.reduce((max, usage) => 
      usage.memory.used > max ? usage.memory.used : max, 0);
    
    // Memory trend calculation
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    const firstAvg = firstHalf.reduce((sum, u) => sum + u.memory.used, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, u) => sum + u.memory.used, 0) / secondHalf.length;
    const memoryTrend = secondAvg > firstAvg * 1.1 ? 'up' : 
                        secondAvg < firstAvg * 0.9 ? 'down' : 'stable';

    const networkStats = this.getNetworkRequests(10);
    const avgFrameTime = this.frameTimings.length > 0 
      ? this.frameTimings.reduce((sum, time) => sum + time, 0) / this.frameTimings.length 
      : 0;

    return {
      memory: {
        current: current.memory.used,
        peak,
        trend: memoryTrend
      },
      network: {
        requests: networkStats.length,
        failures: networkStats.filter(req => req.failed).length,
        avgResponse: networkStats.length > 0 
          ? networkStats.reduce((sum, req) => sum + (req.endTime || req.startTime) - req.startTime, 0) / networkStats.length 
          : 0
      },
      cpu: {
        avgFrameTime,
        frameDrops: recent.reduce((sum, usage) => sum + usage.cpu.frameDrops, 0)
      },
      storage: {
        total: current.storage.localStorage + current.storage.sessionStorage + current.storage.indexedDB,
        breakdown: current.storage
      },
      alerts: {
        total: this.alerts.length,
        critical: this.alerts.filter(a => a.severity === 'critical').length,
        active: this.getActiveAlerts().length
      }
    };
  }

  exportData(): string {
    const data = {
      resourceHistory: this.resourceHistory,
      networkRequests: this.networkRequests,
      alerts: this.alerts,
      summary: this.getResourceSummary(),
      exportTime: new Date().toISOString(),
      thresholds: this.thresholds
    };
    
    return JSON.stringify(data, null, 2);
  }

  clearHistory(): void {
    this.resourceHistory = [];
    this.networkRequests = [];
    this.alerts = [];
    this.frameTimings = [];
  }

  updateThresholds(newThresholds: Partial<ResourceThresholds>): void {
    Object.assign(this.thresholds, newThresholds);
  }
}

// Singleton instance
export const resourceTracker = new ResourceTracker();
export default resourceTracker;
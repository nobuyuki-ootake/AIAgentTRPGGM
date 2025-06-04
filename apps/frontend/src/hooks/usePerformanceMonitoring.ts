import { useEffect, useRef, useCallback, useState } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';

// Memory usage tracking interface
export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

// Resource timing interface
export interface ResourceTiming {
  name: string;
  duration: number;
  transferSize: number;
  decodedBodySize: number;
  type: string;
  timestamp: number;
}

// Performance vitals interface
export interface PerformanceVitals {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

/**
 * Hook for monitoring component performance
 */
export const useComponentPerformance = (componentName: string) => {
  const startTimeRef = useRef<number>();
  const operationIdRef = useRef<string>();

  const startMeasurement = useCallback((metadata?: Record<string, any>) => {
    const operationId = `${componentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    operationIdRef.current = operationId;
    startTimeRef.current = performance.now();
    
    performanceMonitor.startOperation(operationId, 'component-render', {
      componentName,
      ...metadata
    });
  }, [componentName]);

  const endMeasurement = useCallback((metadata?: Record<string, any>) => {
    if (operationIdRef.current) {
      performanceMonitor.completeOperation(operationIdRef.current, {
        renderTime: performance.now() - (startTimeRef.current || 0),
        ...metadata
      });
    }
  }, []);

  const failMeasurement = useCallback((error: string, metadata?: Record<string, any>) => {
    if (operationIdRef.current) {
      performanceMonitor.failOperation(operationIdRef.current, error, metadata);
    }
  }, []);

  return {
    startMeasurement,
    endMeasurement,
    failMeasurement
  };
};

/**
 * Hook for measuring page load performance
 */
export const usePageLoadPerformance = (pageName: string) => {
  const [vitals, setVitals] = useState<Partial<PerformanceVitals>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const operationId = `page-load-${pageName}-${Date.now()}`;
    performanceMonitor.startOperation(operationId, 'page-load', { pageName });

    // Measure page load metrics
    const measureVitals = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const newVitals: Partial<PerformanceVitals> = {};

      // Time to First Byte
      if (navigation) {
        newVitals.ttfb = navigation.responseStart - navigation.fetchStart;
      }

      // First Contentful Paint
      const fcpEntry = paint.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        newVitals.fcp = fcpEntry.startTime;
      }

      setVitals(newVitals);

      // Complete the operation
      performanceMonitor.completeOperation(operationId, {
        ...newVitals,
        loadComplete: performance.now()
      });
      setIsLoading(false);
    };

    // Measure Web Vitals using Observer API
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        if (lastEntry) {
          setVitals(prev => ({ ...prev, lcp: lastEntry.startTime }));
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        setVitals(prev => ({ ...prev, cls: clsValue }));
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          setVitals(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cleanup observers
      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
      };
    }

    // Fallback measurement
    setTimeout(measureVitals, 1000);
  }, [pageName]);

  return { vitals, isLoading };
};

/**
 * Hook for monitoring memory usage
 */
export const useMemoryMonitoring = (interval: number = 5000) => {
  const [memoryUsage, setMemoryUsage] = useState<MemoryUsage[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if memory API is supported
    const supported = 'memory' in performance;
    setIsSupported(supported);

    if (!supported) return;

    const measureMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const usage: MemoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };

        setMemoryUsage(prev => {
          const newUsage = [...prev, usage];
          // Keep only last 100 measurements
          return newUsage.slice(-100);
        });

        // Check for potential memory leaks
        if (usage.usedJSHeapSize > usage.jsHeapSizeLimit * 0.8) {
          console.warn('High memory usage detected:', usage);
          performanceMonitor.startOperation(
            `memory-warning-${Date.now()}`,
            'memory-warning',
            usage
          );
        }
      }
    };

    measureMemory();
    const intervalId = setInterval(measureMemory, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  const getMemoryTrend = useCallback(() => {
    if (memoryUsage.length < 2) return 'stable';
    
    const recent = memoryUsage.slice(-10);
    const average = recent.reduce((sum, usage) => sum + usage.usedJSHeapSize, 0) / recent.length;
    const latest = recent[recent.length - 1].usedJSHeapSize;
    
    const changePercent = ((latest - average) / average) * 100;
    
    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }, [memoryUsage]);

  const getMemoryPressure = useCallback(() => {
    if (!memoryUsage.length) return 'unknown';
    
    const latest = memoryUsage[memoryUsage.length - 1];
    const usagePercent = (latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100;
    
    if (usagePercent > 80) return 'high';
    if (usagePercent > 60) return 'medium';
    return 'low';
  }, [memoryUsage]);

  return {
    memoryUsage,
    isSupported,
    trend: getMemoryTrend(),
    pressure: getMemoryPressure()
  };
};

/**
 * Hook for monitoring API performance
 */
export const useAPIPerformance = () => {
  const measureAPICall = useCallback(async <T>(
    apiName: string,
    apiCall: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const operationId = `api-${apiName}-${Date.now()}`;
    const startTime = performance.now();
    
    performanceMonitor.startOperation(operationId, 'api-call', {
      apiName,
      ...metadata
    });

    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      performanceMonitor.completeOperation(operationId, {
        duration,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.failOperation(operationId, error instanceof Error ? error.message : 'Unknown error', {
        duration
      });
      throw error;
    }
  }, []);

  const getBatchAPIPerformance = useCallback((apiNames: string[]) => {
    return apiNames.map(apiName => ({
      apiName,
      analytics: performanceMonitor.getAnalytics('api-call'),
      score: performanceMonitor.getPerformanceScore('api-call')
    }));
  }, []);

  return {
    measureAPICall,
    getBatchAPIPerformance
  };
};

/**
 * Hook for monitoring resource loading performance
 */
export const useResourceMonitoring = () => {
  const [resources, setResources] = useState<ResourceTiming[]>([]);

  useEffect(() => {
    const measureResources = () => {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const newResources: ResourceTiming[] = resourceEntries.map(entry => ({
        name: entry.name,
        duration: entry.duration,
        transferSize: entry.transferSize || 0,
        decodedBodySize: entry.decodedBodySize || 0,
        type: entry.initiatorType,
        timestamp: entry.startTime
      }));

      setResources(newResources);
    };

    measureResources();
    
    // Set up PerformanceObserver for new resources
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        const newEntries: ResourceTiming[] = entries.map(entry => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize || 0,
          decodedBodySize: entry.decodedBodySize || 0,
          type: entry.initiatorType,
          timestamp: entry.startTime
        }));

        setResources(prev => [...prev, ...newEntries]);
      });

      observer.observe({ entryTypes: ['resource'] });

      return () => observer.disconnect();
    }
  }, []);

  const getSlowResources = useCallback((threshold: number = 3000) => {
    return resources.filter(resource => resource.duration > threshold);
  }, [resources]);

  const getLargeResources = useCallback((threshold: number = 1024 * 1024) => {
    return resources.filter(resource => resource.transferSize > threshold);
  }, [resources]);

  const getResourcesByType = useCallback((type: string) => {
    return resources.filter(resource => resource.type === type);
  }, [resources]);

  return {
    resources,
    slowResources: getSlowResources(),
    largeResources: getLargeResources(),
    getResourcesByType,
    totalTransferSize: resources.reduce((sum, r) => sum + r.transferSize, 0)
  };
};

/**
 * Hook for comprehensive performance monitoring
 */
export const usePerformanceMonitoring = (config: {
  componentName?: string;
  enableMemoryMonitoring?: boolean;
  enableResourceMonitoring?: boolean;
  memoryInterval?: number;
}) => {
  const componentPerf = useComponentPerformance(config.componentName || 'unknown');
  const memoryMonitoring = useMemoryMonitoring(config.memoryInterval);
  const resourceMonitoring = useResourceMonitoring();
  const apiPerformance = useAPIPerformance();

  const [performanceScore, setPerformanceScore] = useState<number>(0);

  useEffect(() => {
    // Calculate overall performance score
    const calculateScore = () => {
      const memoryScore = memoryMonitoring.pressure === 'low' ? 100 : 
                         memoryMonitoring.pressure === 'medium' ? 70 : 30;
      
      const resourceScore = resourceMonitoring.slowResources.length === 0 ? 100 :
                           Math.max(0, 100 - resourceMonitoring.slowResources.length * 10);

      const overallScore = (memoryScore + resourceScore) / 2;
      setPerformanceScore(overallScore);
    };

    calculateScore();
  }, [memoryMonitoring.pressure, resourceMonitoring.slowResources.length]);

  return {
    component: componentPerf,
    memory: config.enableMemoryMonitoring !== false ? memoryMonitoring : null,
    resources: config.enableResourceMonitoring !== false ? resourceMonitoring : null,
    api: apiPerformance,
    performanceScore
  };
};
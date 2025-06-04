import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingOperation {
  id: string;
  message: string;
  progress?: number;
  estimatedTime?: number;
  startTime: number;
  timeoutMs?: number;
}

export interface LoadingState {
  isLoading: boolean;
  operations: LoadingOperation[];
  error?: string;
  totalProgress: number;
}

export interface UseLoadingStateReturn {
  loadingState: LoadingState;
  startLoading: (id: string, message: string, options?: {
    estimatedTime?: number;
    timeoutMs?: number;
  }) => void;
  updateProgress: (id: string, progress: number, message?: string) => void;
  finishLoading: (id: string) => void;
  setError: (id: string, error: string) => void;
  clearError: () => void;
  clearAllLoading: () => void;
  isOperationLoading: (id: string) => boolean;
  getOperationProgress: (id: string) => number;
  getElapsedTime: (id: string) => number;
  getRemainingTime: (id: string) => number;
}

export const useLoadingState = (): UseLoadingStateReturn => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    operations: [],
    totalProgress: 0
  });

  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);

  const calculateTotalProgress = useCallback((operations: LoadingOperation[]) => {
    if (operations.length === 0) return 0;
    
    const totalProgress = operations.reduce((sum, op) => sum + (op.progress || 0), 0);
    return totalProgress / operations.length;
  }, []);

  const startLoading = useCallback((
    id: string, 
    message: string, 
    options: { estimatedTime?: number; timeoutMs?: number } = {}
  ) => {
    const { estimatedTime, timeoutMs = 30000 } = options;

    setLoadingState(prev => {
      const existingOpIndex = prev.operations.findIndex(op => op.id === id);
      const newOperation: LoadingOperation = {
        id,
        message,
        progress: 0,
        estimatedTime,
        startTime: Date.now(),
        timeoutMs
      };

      let newOperations: LoadingOperation[];
      if (existingOpIndex >= 0) {
        newOperations = [...prev.operations];
        newOperations[existingOpIndex] = newOperation;
      } else {
        newOperations = [...prev.operations, newOperation];
      }

      return {
        ...prev,
        isLoading: true,
        operations: newOperations,
        totalProgress: calculateTotalProgress(newOperations)
      };
    });

    // Set timeout for operation
    if (timeoutMs) {
      const timeoutId = setTimeout(() => {
        setError(id, 'Operation timed out');
      }, timeoutMs);
      
      timeoutRefs.current.set(id, timeoutId);
    }
  }, [calculateTotalProgress]);

  const updateProgress = useCallback((id: string, progress: number, message?: string) => {
    setLoadingState(prev => {
      const operations = prev.operations.map(op => 
        op.id === id 
          ? { ...op, progress: Math.min(100, Math.max(0, progress)), ...(message && { message }) }
          : op
      );

      return {
        ...prev,
        operations,
        totalProgress: calculateTotalProgress(operations)
      };
    });
  }, [calculateTotalProgress]);

  const finishLoading = useCallback((id: string) => {
    // Clear timeout
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }

    setLoadingState(prev => {
      const operations = prev.operations.filter(op => op.id !== id);
      
      return {
        ...prev,
        isLoading: operations.length > 0,
        operations,
        totalProgress: calculateTotalProgress(operations),
        error: prev.error // Keep error if it exists
      };
    });
  }, [calculateTotalProgress]);

  const setError = useCallback((id: string, error: string) => {
    // Clear timeout
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }

    setLoadingState(prev => ({
      ...prev,
      error,
      operations: prev.operations.filter(op => op.id !== id),
      isLoading: prev.operations.filter(op => op.id !== id).length > 0
    }));
  }, []);

  const clearError = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      error: undefined
    }));
  }, []);

  const clearAllLoading = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();

    setLoadingState({
      isLoading: false,
      operations: [],
      totalProgress: 0
    });
  }, []);

  const isOperationLoading = useCallback((id: string) => {
    return loadingState.operations.some(op => op.id === id);
  }, [loadingState.operations]);

  const getOperationProgress = useCallback((id: string) => {
    const operation = loadingState.operations.find(op => op.id === id);
    return operation?.progress || 0;
  }, [loadingState.operations]);

  const getElapsedTime = useCallback((id: string) => {
    const operation = loadingState.operations.find(op => op.id === id);
    if (!operation) return 0;
    return Math.floor((Date.now() - operation.startTime) / 1000);
  }, [loadingState.operations]);

  const getRemainingTime = useCallback((id: string) => {
    const operation = loadingState.operations.find(op => op.id === id);
    if (!operation || !operation.estimatedTime) return 0;
    
    const elapsed = getElapsedTime(id);
    return Math.max(0, operation.estimatedTime - elapsed);
  }, [loadingState.operations, getElapsedTime]);

  return {
    loadingState,
    startLoading,
    updateProgress,
    finishLoading,
    setError,
    clearError,
    clearAllLoading,
    isOperationLoading,
    getOperationProgress,
    getElapsedTime,
    getRemainingTime
  };
};

export default useLoadingState;
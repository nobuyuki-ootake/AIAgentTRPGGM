import React, { ReactNode, useState, useEffect } from "react";
import { ErrorBoundary } from "./ErrorBoundary";

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
  section?: string;
}

interface AsyncErrorBoundaryState {
  asyncError: Error | null;
}

/**
 * AsyncErrorBoundary - Handles both synchronous React errors and async errors
 * This component can catch errors from async operations like API calls
 */
export const AsyncErrorBoundary: React.FC<AsyncErrorBoundaryProps> = ({
  children,
  onError,
  section,
}) => {
  const [asyncError, setAsyncError] = useState<Error | null>(null);

  // Reset async error when children change
  useEffect(() => {
    setAsyncError(null);
  }, [children]);

  // Handle async errors
  const handleAsyncError = (error: Error) => {
    setAsyncError(error);
    if (onError) {
      onError(error);
    }
  };

  // If there's an async error, throw it to be caught by ErrorBoundary
  if (asyncError) {
    throw asyncError;
  }

  return (
    <ErrorBoundary section={section} onError={onError}>
      <AsyncErrorProvider onError={handleAsyncError}>
        {children}
      </AsyncErrorProvider>
    </ErrorBoundary>
  );
};

// Context for async error handling
const AsyncErrorContext = React.createContext<{
  throwError: (error: Error) => void;
}>({
  throwError: () => {},
});

export const useAsyncError = () => {
  const { throwError } = React.useContext(AsyncErrorContext);
  return throwError;
};

const AsyncErrorProvider: React.FC<{
  children: ReactNode;
  onError: (error: Error) => void;
}> = ({ children, onError }) => {
  const throwError = (error: Error) => {
    onError(error);
  };

  return (
    <AsyncErrorContext.Provider value={{ throwError }}>
      {children}
    </AsyncErrorContext.Provider>
  );
};

// Hook for handling async operations with error boundary
export const useAsyncErrorHandler = () => {
  const throwError = useAsyncError();

  const handleAsync = async <T,>(
    asyncOperation: () => Promise<T>,
    errorContext?: string
  ): Promise<T | null> => {
    try {
      return await asyncOperation();
    } catch (error) {
      const errorToThrow = error instanceof Error 
        ? error 
        : new Error(`${errorContext || "Async operation"} failed: ${String(error)}`);
      
      throwError(errorToThrow);
      return null;
    }
  };

  return { handleAsync };
};

export default AsyncErrorBoundary;
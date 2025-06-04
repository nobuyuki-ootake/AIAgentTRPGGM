// Error Boundary Components
export { ErrorBoundary } from './ErrorBoundary';
export { TRPGErrorBoundary } from './TRPGErrorBoundary';
export { AsyncErrorBoundary, useAsyncError, useAsyncErrorHandler } from './AsyncErrorBoundary';

// Error State Management
export { 
  ErrorStateManager, 
  useErrorState, 
  useTRPGErrorHandler,
  type ErrorState 
} from './ErrorStateManager';

// Error Notification Center
export { ErrorNotificationCenter } from './ErrorNotificationCenter';

// Form Error Handling
export { 
  FormValidationProvider, 
  useFormValidation, 
  TRPGFormValidator,
  FormErrorSummary,
  type FormFieldError,
  type FormValidationState 
} from './FormErrorHandler';

// Error Display (from ui/ErrorDisplay)
export { default as ErrorDisplay } from '../ui/ErrorDisplay';

// Error Handling Utilities
export { 
  TRPGErrorSimulator, 
  TRPGErrorTestUtils, 
  MockErrorComponents,
  type TRPGErrorScenario 
} from '../../utils/errorTestUtils';

export { 
  NetworkErrorHandler, 
  TRPGNetworkUtils, 
  NetworkError,
  type RetryConfig,
  type NetworkErrorDetails 
} from '../../utils/networkErrorHandler';

export { 
  TRPGAPIErrorHandler, 
  APIError,
  type APIErrorDetails,
  type APIResponse 
} from '../../utils/apiErrorHandler';

// Error Handling Hook for Components
export const useErrorHandling = () => {
  const errorState = useErrorState();
  const trpgHandler = useTRPGErrorHandler();
  
  return {
    ...errorState,
    ...trpgHandler,
  };
};

// Global Error Handler Setup
export const setupGlobalErrorHandling = () => {
  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    // You can integrate with your error reporting service here
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent the default browser behavior
  });
};

// Error Boundary HOC for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: {
    section?: string;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// TRPG Error Boundary HOC
export const withTRPGErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  section: 'campaign' | 'character' | 'timeline' | 'worldbuilding' | 'session' | 'dice' | 'ai',
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <TRPGErrorBoundary section={section} onError={onError}>
      <Component {...props} />
    </TRPGErrorBoundary>
  );

  WrappedComponent.displayName = `withTRPGErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};
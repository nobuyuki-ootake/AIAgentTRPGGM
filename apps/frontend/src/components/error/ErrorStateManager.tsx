import React, { createContext, useContext, useReducer, ReactNode } from "react";

// Error state types
export interface ErrorState {
  id: string;
  type: 'network' | 'api' | 'validation' | 'data' | 'ai' | 'dice' | 'session';
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  context?: string;
  timestamp: number;
  retryable: boolean;
  dismissed: boolean;
  retryCount: number;
  maxRetries: number;
}

// Error actions
type ErrorAction =
  | { type: 'ADD_ERROR'; payload: Omit<ErrorState, 'id' | 'timestamp' | 'dismissed' | 'retryCount'> }
  | { type: 'DISMISS_ERROR'; payload: { id: string } }
  | { type: 'RETRY_ERROR'; payload: { id: string } }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'CLEAR_ERROR_TYPE'; payload: { type: ErrorState['type'] } };

// Error state
interface ErrorStateManagerState {
  errors: ErrorState[];
}

// Error context
interface ErrorContextValue {
  errors: ErrorState[];
  addError: (error: Omit<ErrorState, 'id' | 'timestamp' | 'dismissed' | 'retryCount'>) => string;
  dismissError: (id: string) => void;
  retryError: (id: string) => void;
  clearErrors: () => void;
  clearErrorsByType: (type: ErrorState['type']) => void;
  getErrorsByType: (type: ErrorState['type']) => ErrorState[];
  getActiveErrors: () => ErrorState[];
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

// Error reducer
function errorReducer(state: ErrorStateManagerState, action: ErrorAction): ErrorStateManagerState {
  switch (action.type) {
    case 'ADD_ERROR': {
      const newError: ErrorState = {
        ...action.payload,
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        dismissed: false,
        retryCount: 0,
      };

      return {
        ...state,
        errors: [...state.errors, newError],
      };
    }

    case 'DISMISS_ERROR': {
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload.id
            ? { ...error, dismissed: true }
            : error
        ),
      };
    }

    case 'RETRY_ERROR': {
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload.id
            ? { ...error, retryCount: error.retryCount + 1 }
            : error
        ),
      };
    }

    case 'CLEAR_ERRORS': {
      return {
        ...state,
        errors: [],
      };
    }

    case 'CLEAR_ERROR_TYPE': {
      return {
        ...state,
        errors: state.errors.filter(error => error.type !== action.payload.type),
      };
    }

    default:
      return state;
  }
}

// Error state manager component
export const ErrorStateManager: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, { errors: [] });

  const addError = (error: Omit<ErrorState, 'id' | 'timestamp' | 'dismissed' | 'retryCount'>): string => {
    const action: ErrorAction = { type: 'ADD_ERROR', payload: error };
    dispatch(action);
    
    // Return the generated error ID for reference
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return errorId;
  };

  const dismissError = (id: string) => {
    dispatch({ type: 'DISMISS_ERROR', payload: { id } });
  };

  const retryError = (id: string) => {
    dispatch({ type: 'RETRY_ERROR', payload: { id } });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const clearErrorsByType = (type: ErrorState['type']) => {
    dispatch({ type: 'CLEAR_ERROR_TYPE', payload: { type } });
  };

  const getErrorsByType = (type: ErrorState['type']): ErrorState[] => {
    return state.errors.filter(error => error.type === type && !error.dismissed);
  };

  const getActiveErrors = (): ErrorState[] => {
    return state.errors.filter(error => !error.dismissed);
  };

  const contextValue: ErrorContextValue = {
    errors: state.errors,
    addError,
    dismissError,
    retryError,
    clearErrors,
    clearErrorsByType,
    getErrorsByType,
    getActiveErrors,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

// Hook to use error context
export const useErrorState = (): ErrorContextValue => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorState must be used within an ErrorStateManager');
  }
  return context;
};

// Hook for TRPG-specific error handling
export const useTRPGErrorHandler = () => {
  const errorState = useErrorState();

  const handleCampaignError = (error: Error, context?: string) => {
    return errorState.addError({
      type: 'data',
      severity: 'error',
      message: 'キャンペーンデータの処理中にエラーが発生しました',
      details: error.message,
      context: context || 'campaign',
      retryable: true,
      maxRetries: 3,
    });
  };

  const handleCharacterError = (error: Error, context?: string) => {
    return errorState.addError({
      type: 'validation',
      severity: 'error',
      message: 'キャラクターデータの処理中にエラーが発生しました',
      details: error.message,
      context: context || 'character',
      retryable: true,
      maxRetries: 3,
    });
  };

  const handleAIError = (error: Error, service?: string) => {
    return errorState.addError({
      type: 'ai',
      severity: 'warning',
      message: 'AI機能でエラーが発生しました',
      details: error.message,
      context: service || 'ai',
      retryable: true,
      maxRetries: 2,
    });
  };

  const handleDiceError = (error: Error, diceExpression?: string) => {
    return errorState.addError({
      type: 'dice',
      severity: 'error',
      message: 'ダイスロールでエラーが発生しました',
      details: error.message,
      context: diceExpression || 'dice',
      retryable: true,
      maxRetries: 3,
    });
  };

  const handleSessionError = (error: Error, sessionId?: string) => {
    return errorState.addError({
      type: 'session',
      severity: 'error',
      message: 'セッション中にエラーが発生しました',
      details: error.message,
      context: sessionId || 'session',
      retryable: true,
      maxRetries: 1,
    });
  };

  const handleNetworkError = (error: Error, endpoint?: string) => {
    return errorState.addError({
      type: 'network',
      severity: 'warning',
      message: 'ネットワークエラーが発生しました',
      details: error.message,
      context: endpoint || 'network',
      retryable: true,
      maxRetries: 5,
    });
  };

  const handleValidationError = (message: string, field?: string) => {
    return errorState.addError({
      type: 'validation',
      severity: 'warning',
      message: '入力内容に問題があります',
      details: message,
      context: field || 'validation',
      retryable: false,
      maxRetries: 0,
    });
  };

  return {
    handleCampaignError,
    handleCharacterError,
    handleAIError,
    handleDiceError,
    handleSessionError,
    handleNetworkError,
    handleValidationError,
    ...errorState,
  };
};

export default ErrorStateManager;
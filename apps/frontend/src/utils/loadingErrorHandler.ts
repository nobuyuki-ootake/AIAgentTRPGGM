export interface LoadingError {
  id: string;
  type: LoadingErrorType;
  message: string;
  code?: string;
  context?: Record<string, any>;
  timestamp: number;
  retryable: boolean;
  maxRetries?: number;
  currentRetries?: number;
}

export type LoadingErrorType = 
  | 'timeout'
  | 'network'
  | 'server'
  | 'ai_provider'
  | 'validation'
  | 'permission'
  | 'rate_limit'
  | 'storage'
  | 'unknown';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: LoadingError) => boolean;
}

export class LoadingErrorHandler {
  private static defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  };

  private static errorMessages: Record<LoadingErrorType, string> = {
    timeout: 'The operation took too long to complete. Please try again.',
    network: 'Network connection error. Please check your internet connection.',
    server: 'Server error occurred. Please try again later.',
    ai_provider: 'AI service is temporarily unavailable. Please try again.',
    validation: 'Data validation error. Please check your input.',
    permission: 'You do not have permission to perform this action.',
    rate_limit: 'Too many requests. Please wait a moment before trying again.',
    storage: 'Storage error occurred. Please try again.',
    unknown: 'An unexpected error occurred. Please try again.'
  };

  static createError(
    id: string,
    type: LoadingErrorType,
    message?: string,
    context?: Record<string, any>
  ): LoadingError {
    return {
      id,
      type,
      message: message || this.errorMessages[type],
      context,
      timestamp: Date.now(),
      retryable: this.isRetryable(type),
      currentRetries: 0,
      maxRetries: this.getMaxRetries(type)
    };
  }

  static isRetryable(type: LoadingErrorType): boolean {
    const retryableTypes: LoadingErrorType[] = [
      'timeout',
      'network',
      'server',
      'ai_provider',
      'rate_limit',
      'storage'
    ];
    return retryableTypes.includes(type);
  }

  static getMaxRetries(type: LoadingErrorType): number {
    const retryLimits: Partial<Record<LoadingErrorType, number>> = {
      timeout: 2,
      network: 3,
      server: 2,
      ai_provider: 3,
      rate_limit: 1,
      storage: 2
    };
    return retryLimits[type] || 1;
  }

  static shouldRetry(error: LoadingError): boolean {
    if (!error.retryable) return false;
    if (!error.maxRetries) return false;
    if ((error.currentRetries || 0) >= error.maxRetries) return false;
    return true;
  }

  static calculateRetryDelay(
    attempt: number,
    config: RetryConfig = this.defaultRetryConfig
  ): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    errorId: string,
    config: RetryConfig = this.defaultRetryConfig,
    onError?: (error: LoadingError) => void,
    onRetry?: (attempt: number, delay: number) => void
  ): Promise<T> {
    let lastError: LoadingError | null = null;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const loadingError = this.parseError(errorId, error);
        lastError = {
          ...loadingError,
          currentRetries: attempt
        };

        if (onError) {
          onError(lastError);
        }

        if (attempt === config.maxRetries || !this.shouldRetry(lastError)) {
          throw lastError;
        }

        if (config.retryCondition && !config.retryCondition(lastError)) {
          throw lastError;
        }

        const delay = this.calculateRetryDelay(attempt, config);
        
        if (onRetry) {
          onRetry(attempt + 1, delay);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  static parseError(id: string, error: any): LoadingError {
    // Network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return this.createError(id, 'network', error.message);
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return this.createError(id, 'timeout', error.message);
    }

    // HTTP errors
    if (error.response) {
      const status = error.response.status;
      
      if (status === 429) {
        return this.createError(id, 'rate_limit', 'Rate limit exceeded');
      }
      
      if (status === 403) {
        return this.createError(id, 'permission', 'Access forbidden');
      }
      
      if (status >= 500) {
        return this.createError(id, 'server', `Server error: ${status}`);
      }
      
      if (status === 400) {
        return this.createError(id, 'validation', error.response.data?.message || 'Validation error');
      }
    }

    // AI Provider specific errors
    if (error.message?.includes('AI') || error.code?.includes('AI')) {
      return this.createError(id, 'ai_provider', error.message);
    }

    // Storage errors
    if (error.name === 'QuotaExceededError' || error.code === 'STORAGE_ERROR') {
      return this.createError(id, 'storage', error.message);
    }

    // Default to unknown error
    return this.createError(id, 'unknown', error.message || 'Unknown error occurred');
  }

  static getErrorTypeIcon(type: LoadingErrorType): string {
    const icons: Record<LoadingErrorType, string> = {
      timeout: 'AccessTime',
      network: 'WifiOff',
      server: 'Error',
      ai_provider: 'Psychology',
      validation: 'Warning',
      permission: 'Lock',
      rate_limit: 'Speed',
      storage: 'Storage',
      unknown: 'Help'
    };
    return icons[type];
  }

  static getErrorSeverity(type: LoadingErrorType): 'error' | 'warning' | 'info' {
    const warningTypes: LoadingErrorType[] = ['timeout', 'rate_limit'];
    const infoTypes: LoadingErrorType[] = ['validation'];
    
    if (warningTypes.includes(type)) return 'warning';
    if (infoTypes.includes(type)) return 'info';
    return 'error';
  }

  static formatErrorForUser(error: LoadingError): string {
    const baseMessage = error.message;
    
    if (error.retryable && this.shouldRetry(error)) {
      return `${baseMessage} (Attempt ${(error.currentRetries || 0) + 1} of ${error.maxRetries || 1})`;
    }
    
    return baseMessage;
  }

  static getRecoveryActions(type: LoadingErrorType): string[] {
    const actions: Record<LoadingErrorType, string[]> = {
      timeout: [
        'Try again with a more specific request',
        'Check your internet connection',
        'Contact support if the problem persists'
      ],
      network: [
        'Check your internet connection',
        'Try refreshing the page',
        'Contact your network administrator'
      ],
      server: [
        'Try again in a few minutes',
        'Contact support if the problem persists',
        'Check our status page for updates'
      ],
      ai_provider: [
        'Try using a different AI provider',
        'Simplify your request',
        'Try again in a few minutes'
      ],
      validation: [
        'Check your input data',
        'Ensure all required fields are filled',
        'Review the format requirements'
      ],
      permission: [
        'Contact an administrator',
        'Check your account permissions',
        'Log out and log back in'
      ],
      rate_limit: [
        'Wait a moment before trying again',
        'Reduce the frequency of your requests',
        'Consider upgrading your plan'
      ],
      storage: [
        'Clear browser cache',
        'Free up storage space',
        'Try using a different browser'
      ],
      unknown: [
        'Try refreshing the page',
        'Clear browser cache',
        'Contact support with error details'
      ]
    };
    
    return actions[type] || actions.unknown;
  }
}

export default LoadingErrorHandler;
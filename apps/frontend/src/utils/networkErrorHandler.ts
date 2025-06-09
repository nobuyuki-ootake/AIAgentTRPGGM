/**
 * Network error handling and retry mechanisms for TRPG application
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryOn: number[];
  timeout: number;
}

export interface NetworkErrorDetails {
  status?: number;
  statusText?: string;
  message: string;
  url?: string;
  method?: string;
  retryCount: number;
  timestamp: number;
}

export class NetworkError extends Error {
  public readonly details: NetworkErrorDetails;
  public readonly isRetryable: boolean;

  constructor(message: string, details: Partial<NetworkErrorDetails> = {}) {
    super(message);
    this.name = 'NetworkError';
    this.details = {
      message,
      retryCount: 0,
      timestamp: Date.now(),
      ...details,
    };
    this.isRetryable = this.determineRetryability();
  }

  private determineRetryability(): boolean {
    if (!this.details.status) return true; // Network errors are generally retryable
    
    // Don't retry client errors (4xx) except for specific cases
    if (this.details.status >= 400 && this.details.status < 500) {
      return [408, 429].includes(this.details.status); // Timeout and rate limit
    }
    
    // Retry server errors (5xx)
    return this.details.status >= 500;
  }
}

export class NetworkErrorHandler {
  private static defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryOn: [408, 429, 500, 501, 502, 503, 504],
    timeout: 30000,
  };

  private static retryQueue = new Map<string, Promise<any>>();

  /**
   * Enhanced fetch with retry logic for TRPG API calls
   */
  static async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const requestId = this.generateRequestId(url, options);

    // Return existing promise if request is already in progress
    if (this.retryQueue.has(requestId)) {
      return this.retryQueue.get(requestId);
    }

    const promise = this.executeWithRetry<T>(url, options, finalConfig);
    this.retryQueue.set(requestId, promise);

    try {
      const result = await promise;
      this.retryQueue.delete(requestId);
      return result;
    } catch (error) {
      this.retryQueue.delete(requestId);
      throw error;
    }
  }

  private static async executeWithRetry<T>(
    url: string,
    options: RequestInit,
    config: RetryConfig
  ): Promise<T> {
    let lastError: NetworkError;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            {
              status: response.status,
              statusText: response.statusText,
              url,
              method: options.method || 'GET',
              retryCount: attempt,
            }
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (error instanceof NetworkError) {
          lastError = error;
        } else if (error instanceof TypeError || (error as Error).name === 'AbortError') {
          lastError = new NetworkError(
            (error as Error).name === 'AbortError' ? 'Request timeout' : 'Network connection failed',
            {
              url,
              method: options.method || 'GET',
              retryCount: attempt,
            }
          );
        } else {
          lastError = new NetworkError(
            `Unexpected error: ${(error as Error).message || 'Unknown error'}`,
            {
              url,
              method: options.method || 'GET',
              retryCount: attempt,
            }
          );
        }

        // Don't retry on the last attempt or if error is not retryable
        if (attempt >= config.maxRetries || !this.shouldRetry(lastError, config)) {
          throw lastError;
        }

        // Wait before retrying
        const delay = this.calculateDelay(attempt, config);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private static shouldRetry(error: NetworkError, config: RetryConfig): boolean {
    if (!error.isRetryable) return false;
    if (error.details.status && !config.retryOn.includes(error.details.status)) return false;
    return true;
  }

  private static calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, config.maxDelay);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static generateRequestId(url: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }
}

/**
 * TRPG-specific network utilities
 */
export class TRPGNetworkUtils {
  /**
   * Handle campaign data API calls with TRPG-specific error messages
   */
  static async fetchCampaignData<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await NetworkErrorHandler.fetchWithRetry<T>(
        `/api/campaigns/${endpoint}`,
        options,
        { maxRetries: 3, timeout: 10000 }
      );
    } catch (error) {
      if (error instanceof NetworkError) {
        throw new NetworkError(
          this.getCampaignErrorMessage(error.details.status),
          error.details
        );
      }
      throw error;
    }
  }

  /**
   * Handle character data API calls
   */
  static async fetchCharacterData<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await NetworkErrorHandler.fetchWithRetry<T>(
        `/api/characters/${endpoint}`,
        options,
        { maxRetries: 2, timeout: 8000 }
      );
    } catch (error) {
      if (error instanceof NetworkError) {
        throw new NetworkError(
          this.getCharacterErrorMessage(error.details.status),
          error.details
        );
      }
      throw error;
    }
  }

  /**
   * Handle AI service API calls with longer timeout and more retries
   */
  static async fetchAIResponse<T>(
    service: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await NetworkErrorHandler.fetchWithRetry<T>(
        `/api/ai-agent/${service}/${endpoint}`,
        options,
        { 
          maxRetries: 2, 
          timeout: 60000, // AI requests can take longer
          retryOn: [429, 500, 502, 503, 504] // Don't retry on 401/403 (API key issues)
        }
      );
    } catch (error) {
      if (error instanceof NetworkError) {
        throw new NetworkError(
          this.getAIErrorMessage(service, error.details.status),
          error.details
        );
      }
      throw error;
    }
  }

  /**
   * Handle dice rolling API calls
   */
  static async rollDice<T>(
    expression: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await NetworkErrorHandler.fetchWithRetry<T>(
        '/api/dice/roll',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expression }),
          ...options,
        },
        { maxRetries: 3, timeout: 5000 }
      );
    } catch (error) {
      if (error instanceof NetworkError) {
        throw new NetworkError(
          this.getDiceErrorMessage(error.details.status),
          error.details
        );
      }
      throw error;
    }
  }

  /**
   * Handle session state synchronization
   */
  static async syncSessionState<T>(
    sessionId: string,
    data: any,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await NetworkErrorHandler.fetchWithRetry<T>(
        `/api/sessions/${sessionId}/sync`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          ...options,
        },
        { maxRetries: 5, timeout: 15000 } // More retries for session sync
      );
    } catch (error) {
      if (error instanceof NetworkError) {
        throw new NetworkError(
          this.getSessionErrorMessage(error.details.status),
          error.details
        );
      }
      throw error;
    }
  }

  private static getCampaignErrorMessage(status?: number): string {
    switch (status) {
      case 404:
        return 'キャンペーンが見つかりません。削除されたか、アクセス権限がない可能性があります。';
      case 403:
        return 'キャンペーンへのアクセス権限がありません。';
      case 409:
        return 'キャンペーンデータが競合しています。他のユーザーが同時に編集している可能性があります。';
      case 413:
        return 'キャンペーンデータが大きすぎます。';
      case 429:
        return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
      case 500:
        return 'サーバーエラーによりキャンペーンデータを処理できませんでした。';
      default:
        return 'キャンペーンデータの読み込み中にネットワークエラーが発生しました。';
    }
  }

  private static getCharacterErrorMessage(status?: number): string {
    switch (status) {
      case 400:
        return 'キャラクターデータが無効です。入力内容を確認してください。';
      case 404:
        return 'キャラクターが見つかりません。';
      case 409:
        return 'キャラクター名が重複しています。';
      case 413:
        return 'キャラクターデータが大きすぎます。画像サイズを確認してください。';
      default:
        return 'キャラクターデータの処理中にネットワークエラーが発生しました。';
    }
  }

  private static getAIErrorMessage(service: string, status?: number): string {
    switch (status) {
      case 401:
        return `${service}のAPIキーが無効です。設定を確認してください。`;
      case 403:
        return `${service}へのアクセスが拒否されました。`;
      case 429:
        return `${service}のレート制限に達しました。しばらく待ってから再試行してください。`;
      case 500:
        return `${service}で内部エラーが発生しました。`;
      case 502:
      case 503:
      case 504:
        return `${service}が一時的に利用できません。`;
      default:
        return `${service}との通信中にエラーが発生しました。`;
    }
  }

  private static getDiceErrorMessage(status?: number): string {
    switch (status) {
      case 400:
        return 'ダイス記法が無効です。正しい形式で入力してください（例: 3d6+2）。';
      case 413:
        return 'ダイスの数値が大きすぎます。より小さい値を使用してください。';
      default:
        return 'ダイスロール中にネットワークエラーが発生しました。';
    }
  }

  private static getSessionErrorMessage(status?: number): string {
    switch (status) {
      case 404:
        return 'セッションが見つかりません。終了したか削除された可能性があります。';
      case 409:
        return 'セッション状態が競合しています。他のプレイヤーと同期してください。';
      case 413:
        return 'セッションデータが大きすぎます。';
      default:
        return 'セッション同期中にネットワークエラーが発生しました。';
    }
  }
}

export default NetworkErrorHandler;
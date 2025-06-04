/**
 * API error handling with user-friendly messages for TRPG application
 */

import { NetworkError, TRPGNetworkUtils } from './networkErrorHandler';

export interface APIErrorDetails {
  code: string;
  message: string;
  details?: any;
  field?: string;
  context?: string;
  suggestions?: string[];
  documentation?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIErrorDetails;
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export class APIError extends Error {
  public readonly details: APIErrorDetails;
  public readonly statusCode: number;
  public readonly isUserError: boolean;

  constructor(message: string, statusCode: number, details: Partial<APIErrorDetails> = {}) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = {
      code: details.code || 'UNKNOWN_ERROR',
      message: details.message || message,
      ...details,
    };
    this.isUserError = statusCode >= 400 && statusCode < 500;
  }
}

export class TRPGAPIErrorHandler {
  private static errorMessages: Record<string, string> = {
    // Campaign errors
    CAMPAIGN_NOT_FOUND: 'キャンペーンが見つかりません',
    CAMPAIGN_ACCESS_DENIED: 'キャンペーンへのアクセス権限がありません',
    CAMPAIGN_NAME_DUPLICATE: '同名のキャンペーンが既に存在します',
    CAMPAIGN_DATA_CORRUPTED: 'キャンペーンデータが破損しています',
    CAMPAIGN_TOO_LARGE: 'キャンペーンデータが制限サイズを超えています',

    // Character errors
    CHARACTER_NOT_FOUND: 'キャラクターが見つかりません',
    CHARACTER_NAME_DUPLICATE: '同名のキャラクターが既に存在します',
    CHARACTER_VALIDATION_FAILED: 'キャラクターデータの検証に失敗しました',
    CHARACTER_ABILITY_INVALID: '能力値が無効です',
    CHARACTER_IMAGE_TOO_LARGE: 'キャラクター画像が大きすぎます',

    // AI service errors
    AI_SERVICE_UNAVAILABLE: 'AI機能が一時的に利用できません',
    AI_API_KEY_INVALID: 'AIサービスのAPIキーが無効です',
    AI_RATE_LIMIT_EXCEEDED: 'AIサービスのレート制限に達しました',
    AI_QUOTA_EXCEEDED: 'AIサービスの利用枠を超過しました',
    AI_CONTENT_FILTERED: '生成されたコンテンツがフィルタリングされました',

    // Dice errors
    DICE_EXPRESSION_INVALID: 'ダイス記法が無効です',
    DICE_RESULT_OVERFLOW: 'ダイス結果が計算範囲を超えました',
    DICE_TOO_MANY_DICE: 'ダイスの数が多すぎます',

    // Session errors
    SESSION_NOT_FOUND: 'セッションが見つかりません',
    SESSION_ALREADY_STARTED: 'セッションは既に開始されています',
    SESSION_PLAYER_LIMIT: 'セッションの参加者数が上限に達しています',
    SESSION_STATE_CORRUPTED: 'セッション状態が破損しています',

    // Timeline errors
    TIMELINE_EVENT_CONFLICT: 'タイムラインイベントが競合しています',
    TIMELINE_DEPENDENCY_INVALID: 'イベントの依存関係が無効です',
    TIMELINE_DATE_INVALID: 'イベントの日付が無効です',

    // World building errors
    WORLD_LOCATION_DUPLICATE: '同名の場所が既に存在します',
    WORLD_MAP_TOO_LARGE: 'ワールドマップが大きすぎます',
    WORLD_DATA_INVALID: '世界観データが無効です',

    // General errors
    VALIDATION_FAILED: '入力データの検証に失敗しました',
    UNAUTHORIZED: '認証が必要です',
    FORBIDDEN: 'アクセス権限がありません',
    RATE_LIMIT_EXCEEDED: 'リクエスト回数の制限に達しました',
    SERVER_ERROR: 'サーバーエラーが発生しました',
    NETWORK_ERROR: 'ネットワークエラーが発生しました',
  };

  private static errorSuggestions: Record<string, string[]> = {
    CAMPAIGN_NOT_FOUND: [
      'キャンペーン一覧から正しいキャンペーンを選択してください',
      '削除されたキャンペーンの場合、バックアップから復元してください',
    ],
    CHARACTER_VALIDATION_FAILED: [
      '必須項目（名前、クラス、能力値）が入力されているか確認してください',
      '能力値の合計が規定範囲内であることを確認してください',
      '不正な文字が含まれていないか確認してください',
    ],
    AI_API_KEY_INVALID: [
      'AI設定画面でAPIキーを再入力してください',
      'APIキーに有効期限がある場合、新しいキーを取得してください',
      'APIキーの権限設定を確認してください',
    ],
    DICE_EXPRESSION_INVALID: [
      '正しいダイス記法を使用してください（例: 3d6+2, 1d20）',
      'ダイスの面数は1以上の整数で指定してください',
      '修正値は数値で指定してください',
    ],
    SESSION_STATE_CORRUPTED: [
      'セッションを一度終了して再開してください',
      'ブラウザのキャッシュをクリアしてください',
      '最新の保存データから復元してください',
    ],
  };

  /**
   * Enhanced API request wrapper with comprehensive error handling
   */
  static async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await TRPGNetworkUtils.fetchCampaignData<APIResponse<T>>(url, options);
      
      if (!response.success && response.error) {
        throw new APIError(
          response.error.message,
          400, // Assume client error for API-level errors
          response.error
        );
      }

      return response.data!;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw this.convertNetworkError(error);
      }
      if (error instanceof APIError) {
        throw this.enhanceAPIError(error);
      }
      throw new APIError('予期しないエラーが発生しました', 500, {
        code: 'UNEXPECTED_ERROR',
        message: error.message,
      });
    }
  }

  /**
   * Handle campaign-specific API calls
   */
  static async handleCampaignRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await this.request<T>(`/campaigns/${endpoint}`, options);
    } catch (error) {
      if (error instanceof APIError) {
        error.details.context = 'campaign';
        throw this.addCampaignSpecificSuggestions(error);
      }
      throw error;
    }
  }

  /**
   * Handle character-specific API calls
   */
  static async handleCharacterRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await this.request<T>(`/characters/${endpoint}`, options);
    } catch (error) {
      if (error instanceof APIError) {
        error.details.context = 'character';
        throw this.addCharacterSpecificSuggestions(error);
      }
      throw error;
    }
  }

  /**
   * Handle AI service API calls
   */
  static async handleAIRequest<T>(
    service: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await TRPGNetworkUtils.fetchAIResponse<APIResponse<T>>(
        service,
        endpoint,
        options
      );
      
      if (!response.success && response.error) {
        throw new APIError(
          response.error.message,
          400,
          { ...response.error, context: `ai_${service}` }
        );
      }

      return response.data!;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw this.convertNetworkError(error, `ai_${service}`);
      }
      if (error instanceof APIError) {
        error.details.context = `ai_${service}`;
        throw this.addAISpecificSuggestions(error, service);
      }
      throw error;
    }
  }

  /**
   * Handle dice rolling API calls
   */
  static async handleDiceRequest<T>(
    expression: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      return await TRPGNetworkUtils.rollDice<APIResponse<T>>(expression, options);
    } catch (error) {
      if (error instanceof NetworkError) {
        throw this.convertNetworkError(error, 'dice');
      }
      if (error instanceof APIError) {
        error.details.context = 'dice';
        throw this.addDiceSpecificSuggestions(error);
      }
      throw error;
    }
  }

  /**
   * Convert NetworkError to APIError with user-friendly messages
   */
  private static convertNetworkError(error: NetworkError, context?: string): APIError {
    const apiError = new APIError(
      this.getUserFriendlyMessage(error.message),
      error.details.status || 500,
      {
        code: this.getErrorCode(error.details.status),
        message: this.getUserFriendlyMessage(error.message),
        context,
        details: error.details,
      }
    );

    return this.enhanceAPIError(apiError);
  }

  /**
   * Enhance APIError with suggestions and user-friendly messages
   */
  private static enhanceAPIError(error: APIError): APIError {
    const friendlyMessage = this.errorMessages[error.details.code] || error.details.message;
    const suggestions = this.errorSuggestions[error.details.code] || [];

    error.details.message = friendlyMessage;
    error.details.suggestions = suggestions;

    return error;
  }

  private static getUserFriendlyMessage(message: string): string {
    if (message.includes('timeout') || message.includes('タイムアウト')) {
      return 'リクエストがタイムアウトしました。ネットワーク接続を確認してください。';
    }
    if (message.includes('network') || message.includes('ネットワーク')) {
      return 'ネットワーク接続に問題があります。インターネット接続を確認してください。';
    }
    if (message.includes('JSON')) {
      return 'サーバーからの応答が無効です。しばらく待ってから再試行してください。';
    }
    return message;
  }

  private static getErrorCode(status?: number): string {
    switch (status) {
      case 400: return 'VALIDATION_FAILED';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 413: return 'PAYLOAD_TOO_LARGE';
      case 429: return 'RATE_LIMIT_EXCEEDED';
      case 500: return 'SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'NETWORK_ERROR';
    }
  }

  private static addCampaignSpecificSuggestions(error: APIError): APIError {
    if (error.details.code === 'NOT_FOUND') {
      error.details.suggestions = this.errorSuggestions.CAMPAIGN_NOT_FOUND;
    }
    return error;
  }

  private static addCharacterSpecificSuggestions(error: APIError): APIError {
    if (error.details.code === 'VALIDATION_FAILED') {
      error.details.suggestions = this.errorSuggestions.CHARACTER_VALIDATION_FAILED;
    }
    return error;
  }

  private static addAISpecificSuggestions(error: APIError, service: string): APIError {
    if (error.details.code === 'UNAUTHORIZED') {
      error.details.suggestions = this.errorSuggestions.AI_API_KEY_INVALID;
    }
    error.details.documentation = `https://docs.${service}.com/api-errors`;
    return error;
  }

  private static addDiceSpecificSuggestions(error: APIError): APIError {
    if (error.details.code === 'VALIDATION_FAILED') {
      error.details.suggestions = this.errorSuggestions.DICE_EXPRESSION_INVALID;
    }
    return error;
  }

  /**
   * Format error for display to user
   */
  static formatErrorForUser(error: APIError): {
    title: string;
    message: string;
    suggestions: string[];
    canRetry: boolean;
  } {
    const context = error.details.context || 'system';
    const contextLabels: Record<string, string> = {
      campaign: 'キャンペーン',
      character: 'キャラクター',
      dice: 'ダイス',
      ai_openai: 'OpenAI',
      ai_anthropic: 'Claude',
      ai_gemini: 'Gemini',
      session: 'セッション',
      timeline: 'タイムライン',
      worldbuilding: '世界観構築',
    };

    return {
      title: `${contextLabels[context] || 'システム'}エラー`,
      message: error.details.message,
      suggestions: error.details.suggestions || [],
      canRetry: !error.isUserError || error.statusCode === 429,
    };
  }
}

export default TRPGAPIErrorHandler;
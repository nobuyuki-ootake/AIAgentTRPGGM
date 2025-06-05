/**
 * Error testing utilities for TRPG application
 * Provides helpers for simulating and testing various error scenarios
 */

export interface TRPGErrorScenario {
  type: 'network' | 'api' | 'data' | 'validation' | 'ui' | 'ai';
  context: string;
  error: Error;
  recovery?: () => void;
}

export class TRPGErrorSimulator {
  private static isTestMode = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
  private static errorQueue: TRPGErrorScenario[] = [];
  private static listeners: ((scenario: TRPGErrorScenario) => void)[] = [];

  /**
   * Simulate a campaign data loading error
   */
  static simulateCampaignError(campaignId: string, errorType: 'not_found' | 'corrupted' | 'network') {
    if (!this.isTestMode) return;

    const error = new Error(this.getCampaignErrorMessage(errorType));
    const scenario: TRPGErrorScenario = {
      type: 'data',
      context: `campaign_${campaignId}_${errorType}`,
      error,
      recovery: () => console.log(`Recovering from campaign error: ${errorType}`)
    };

    this.triggerError(scenario);
  }

  /**
   * Simulate a character creation error
   */
  static simulateCharacterError(characterData: any, errorType: 'validation' | 'calculation' | 'save') {
    if (!this.isTestMode) return;

    const error = new Error(this.getCharacterErrorMessage(errorType));
    const scenario: TRPGErrorScenario = {
      type: 'validation',
      context: `character_${errorType}`,
      error,
      recovery: () => console.log(`Recovering from character error: ${errorType}`)
    };

    this.triggerError(scenario);
  }

  /**
   * Simulate an AI service error
   */
  static simulateAIError(service: 'openai' | 'anthropic' | 'gemini', errorType: 'rate_limit' | 'api_key' | 'timeout') {
    if (!this.isTestMode) return;

    const error = new Error(this.getAIErrorMessage(service, errorType));
    const scenario: TRPGErrorScenario = {
      type: 'ai',
      context: `ai_${service}_${errorType}`,
      error,
      recovery: () => console.log(`Recovering from AI error: ${service} ${errorType}`)
    };

    this.triggerError(scenario);
  }

  /**
   * Simulate a dice rolling error
   */
  static simulateDiceError(diceExpression: string, errorType: 'invalid_syntax' | 'overflow' | 'network') {
    if (!this.isTestMode) return;

    const error = new Error(this.getDiceErrorMessage(errorType));
    const scenario: TRPGErrorScenario = {
      type: 'ui',
      context: `dice_${errorType}_${diceExpression}`,
      error,
      recovery: () => console.log(`Recovering from dice error: ${errorType}`)
    };

    this.triggerError(scenario);
  }

  /**
   * Simulate a timeline event error
   */
  static simulateTimelineError(eventId: string, errorType: 'dependency' | 'date_conflict' | 'data_corruption') {
    if (!this.isTestMode) return;

    const error = new Error(this.getTimelineErrorMessage(errorType));
    const scenario: TRPGErrorScenario = {
      type: 'data',
      context: `timeline_${eventId}_${errorType}`,
      error,
      recovery: () => console.log(`Recovering from timeline error: ${errorType}`)
    };

    this.triggerError(scenario);
  }

  /**
   * Simulate a session state corruption
   */
  static simulateSessionError(sessionId: string, errorType: 'state_corruption' | 'desync' | 'player_disconnect') {
    if (!this.isTestMode) return;

    const error = new Error(this.getSessionErrorMessage(errorType));
    const scenario: TRPGErrorScenario = {
      type: 'network',
      context: `session_${sessionId}_${errorType}`,
      error,
      recovery: () => console.log(`Recovering from session error: ${errorType}`)
    };

    this.triggerError(scenario);
  }

  /**
   * Add error listener for testing
   */
  static addErrorListener(callback: (scenario: TRPGErrorScenario) => void) {
    this.listeners.push(callback);
  }

  /**
   * Remove error listener
   */
  static removeErrorListener(callback: (scenario: TRPGErrorScenario) => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Clear all pending errors
   */
  static clearErrors() {
    this.errorQueue = [];
  }

  /**
   * Get all pending errors
   */
  static getPendingErrors(): TRPGErrorScenario[] {
    return [...this.errorQueue];
  }

  private static triggerError(scenario: TRPGErrorScenario) {
    this.errorQueue.push(scenario);
    this.listeners.forEach(listener => listener(scenario));
  }

  private static getCampaignErrorMessage(errorType: string): string {
    switch (errorType) {
      case 'not_found':
        return 'キャンペーンが見つかりません。削除されたか、アクセス権限がない可能性があります。';
      case 'corrupted':
        return 'キャンペーンデータが破損しています。バックアップから復元してください。';
      case 'network':
        return 'ネットワークエラーによりキャンペーンを読み込めませんでした。';
      default:
        return 'キャンペーンの読み込み中にエラーが発生しました。';
    }
  }

  private static getCharacterErrorMessage(errorType: string): string {
    switch (errorType) {
      case 'validation':
        return 'キャラクターデータの検証に失敗しました。必須項目を確認してください。';
      case 'calculation':
        return '能力値の計算中にエラーが発生しました。数値を確認してください。';
      case 'save':
        return 'キャラクターデータの保存に失敗しました。';
      default:
        return 'キャラクター処理中にエラーが発生しました。';
    }
  }

  private static getAIErrorMessage(service: string, errorType: string): string {
    switch (errorType) {
      case 'rate_limit':
        return `${service}のレート制限に達しました。しばらく待ってから再試行してください。`;
      case 'api_key':
        return `${service}のAPIキーが無効です。設定を確認してください。`;
      case 'timeout':
        return `${service}への接続がタイムアウトしました。`;
      default:
        return `${service}でエラーが発生しました。`;
    }
  }

  private static getDiceErrorMessage(errorType: string): string {
    switch (errorType) {
      case 'invalid_syntax':
        return 'ダイス記法が無効です。正しい形式で入力してください（例: 3d6+2）。';
      case 'overflow':
        return 'ダイスの数値が大きすぎます。より小さい値を使用してください。';
      case 'network':
        return 'ダイスロールサーバーへの接続に失敗しました。';
      default:
        return 'ダイスロール中にエラーが発生しました。';
    }
  }

  private static getTimelineErrorMessage(errorType: string): string {
    switch (errorType) {
      case 'dependency':
        return 'イベントの依存関係に問題があります。前提条件を確認してください。';
      case 'date_conflict':
        return 'イベントの日時が競合しています。スケジュールを調整してください。';
      case 'data_corruption':
        return 'タイムラインデータが破損しています。';
      default:
        return 'タイムライン処理中にエラーが発生しました。';
    }
  }

  private static getSessionErrorMessage(errorType: string): string {
    switch (errorType) {
      case 'state_corruption':
        return 'セッション状態が破損しています。セッションを再開してください。';
      case 'desync':
        return 'プレイヤー間でデータの同期が取れていません。';
      case 'player_disconnect':
        return 'プレイヤーとの接続が切断されました。';
      default:
        return 'セッション中にエラーが発生しました。';
    }
  }
}

/**
 * Error assertion utilities for testing
 */
export class TRPGErrorTestUtils {
  /**
   * Assert that an error is of a specific TRPG type
   */
  static assertTRPGError(error: any, expectedType: TRPGErrorScenario['type'], expectedContext?: string) {
    expect(error).toBeInstanceOf(Error);
    if (expectedContext) {
      expect(error.message).toContain(expectedContext);
    }
  }

  /**
   * Create a mock error for testing
   */
  static createMockError(type: TRPGErrorScenario['type'], message: string): Error {
    const error = new Error(message);
    (error as any).trpgErrorType = type;
    return error;
  }

  /**
   * Simulate network failure
   */
  static simulateNetworkFailure(): void {
    // Mock fetch to reject
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    
    // Restore after 1 second
    setTimeout(() => {
      global.fetch = originalFetch;
    }, 1000);
  }

  /**
   * Wait for error to be thrown
   */
  static async waitForError(timeout = 5000): Promise<TRPGErrorScenario> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for error'));
      }, timeout);

      const errorListener = (scenario: TRPGErrorScenario) => {
        clearTimeout(timeoutId);
        TRPGErrorSimulator.removeErrorListener(errorListener);
        resolve(scenario);
      };

      TRPGErrorSimulator.addErrorListener(errorListener);
    });
  }
}

/**
 * Mock error components for testing
 */
export const MockErrorComponents = {
  ErrorThrowingComponent: ({ errorType }: { errorType: string }) => {
    React.useEffect(() => {
      if (errorType) {
        throw new Error(`Test error: ${errorType}`);
      }
    }, [errorType]);
    return React.createElement('div', null, 'Component that throws errors');
  },

  AsyncErrorThrowingComponent: ({ errorType }: { errorType: string }) => {
    React.useEffect(() => {
      if (errorType) {
        setTimeout(() => {
          throw new Error(`Async test error: ${errorType}`);
        }, 100);
      }
    }, [errorType]);
    return React.createElement('div', null, 'Component that throws async errors');
  },

  NetworkErrorComponent: () => {
    React.useEffect(() => {
      fetch('/api/test-error').catch(() => {
        throw new Error('Network request failed');
      });
    }, []);
    return React.createElement('div', null, 'Component that makes failing network requests');
  },
};

export default TRPGErrorSimulator;
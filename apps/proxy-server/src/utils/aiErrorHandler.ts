/**
 * AI通信のエラーハンドリングとリトライ機構
 * AIとの通信における様々なエラーに対処し、自動的なリトライを実装します
 */

import * as yaml from 'js-yaml';

// エラータイプの定義
export enum AIErrorType {
  NETWORK = 'NETWORK', // ネットワークエラー
  TIMEOUT = 'TIMEOUT', // タイムアウト
  API_RATE_LIMIT = 'RATE_LIMIT', // APIレート制限
  CONTENT_POLICY = 'CONTENT_POLICY', // コンテンツポリシー違反
  INVALID_RESPONSE = 'INVALID_RESPONSE', // 無効なレスポンス
  PARSE_ERROR = 'PARSE_ERROR', // パースエラー
  YAML_PARSE_ERROR = 'YAML_PARSE_ERROR', // YAMLパースエラー
  UNKNOWN = 'UNKNOWN', // 不明なエラー
}

// AIエラー情報
export interface AIError {
  type: AIErrorType;
  message: string;
  statusCode?: number;
  originalError?: any;
  retryCount?: number;
  timestamp: Date;
  // 追加: リクエスト情報とレスポンスを保存
  requestData?: any;
  responseData?: any;
}

// リトライ設定
export interface RetryConfig {
  maxRetries: number; // 最大リトライ回数
  initialDelayMs: number; // 初期遅延（ミリ秒）
  maxDelayMs: number; // 最大遅延（ミリ秒）
  backoffFactor: number; // バックオフ係数
  retryableErrors: AIErrorType[]; // リトライ可能なエラータイプ
}

// デフォルトのリトライ設定
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1秒
  maxDelayMs: 10000, // 10秒
  backoffFactor: 2, // 指数バックオフ
  retryableErrors: [
    AIErrorType.NETWORK,
    AIErrorType.TIMEOUT,
    AIErrorType.API_RATE_LIMIT,
    AIErrorType.INVALID_RESPONSE,
  ],
};

/**
 * AIエラーを分類する関数
 * @param error 元のエラー
 * @param requestData リクエストデータ（オプション）
 * @param responseData レスポンスデータ（オプション）
 * @returns 分類されたAIエラー
 */
export function classifyAIError(
  error: any,
  requestData?: any,
  responseData?: any,
): AIError {
  if (!error) {
    return {
      type: AIErrorType.UNKNOWN,
      message: '不明なエラーが発生しました',
      timestamp: new Date(),
      requestData,
      responseData,
    };
  }

  // ステータスコードが存在する場合
  const statusCode =
    error.status ||
    error.statusCode ||
    (error.response && error.response.status) ||
    (error.error && error.error.status);

  // エラーメッセージを抽出
  const errorMessage =
    error.message ||
    (error.error && error.error.message) ||
    (error.response && error.response.data && error.response.data.error) ||
    '不明なエラーが発生しました';

  // エラータイプを分類
  let errorType = AIErrorType.UNKNOWN;

  // ネットワークエラー
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.name === 'NetworkError' ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection')
  ) {
    errorType = AIErrorType.NETWORK;
  }
  // タイムアウト
  else if (
    error.code === 'TIMEOUT' ||
    error.name === 'TimeoutError' ||
    errorMessage.includes('timeout')
  ) {
    errorType = AIErrorType.TIMEOUT;
  }
  // レート制限
  else if (
    statusCode === 429 ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests')
  ) {
    errorType = AIErrorType.API_RATE_LIMIT;
  }
  // コンテンツポリシー違反
  else if (
    statusCode === 400 &&
    (errorMessage.includes('content policy') ||
      errorMessage.includes('safety') ||
      errorMessage.includes('inappropriate') ||
      errorMessage.includes('moderation'))
  ) {
    errorType = AIErrorType.CONTENT_POLICY;
  }
  // YAMLパースエラー
  else if (
    error instanceof yaml.YAMLException ||
    errorMessage.includes('YAML')
  ) {
    errorType = AIErrorType.YAML_PARSE_ERROR;
  }
  // JSONパースエラー
  else if (
    error instanceof SyntaxError ||
    errorMessage.includes('parse') ||
    errorMessage.includes('JSON')
  ) {
    errorType = AIErrorType.PARSE_ERROR;
  }
  // 無効なレスポンス
  else if (
    statusCode >= 500 ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('unexpected')
  ) {
    errorType = AIErrorType.INVALID_RESPONSE;
  }

  // 詳細なログ出力
  console.error(`[AI] エラー発生 (${errorType}): ${errorMessage}`);
  if (requestData) {
    console.error('[AI] リクエスト内容:', JSON.stringify(requestData, null, 2));
  }
  if (responseData) {
    console.error(
      '[AI] レスポンス内容:',
      typeof responseData === 'string'
        ? responseData.substring(0, 500) +
            (responseData.length > 500 ? '...' : '')
        : responseData,
    );
  }

  return {
    type: errorType,
    message: errorMessage,
    statusCode,
    originalError: error,
    timestamp: new Date(),
    requestData,
    responseData,
  };
}

/**
 * 指数バックオフでの遅延時間を計算
 * @param retryCount リトライ回数
 * @param config リトライ設定
 * @returns 遅延時間（ミリ秒）
 */
function calculateBackoff(retryCount: number, config: RetryConfig): number {
  const delay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffFactor, retryCount),
    config.maxDelayMs,
  );

  // ジッターを追加（±10%）して同時に多くのリトライが発生することを回避
  const jitter = 0.1;
  const randomFactor = 1 - jitter + Math.random() * jitter * 2;

  return Math.floor(delay * randomFactor);
}

/**
 * 指定時間だけ待機する関数
 * @param ms 待機時間（ミリ秒）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * AIリクエストの実行とリトライを処理する関数
 * @param requestFn リクエスト関数
 * @param requestData リクエストデータ（エラーログ用）
 * @param customConfig カスタムリトライ設定（オプション）
 * @returns リクエスト結果
 */
export async function executeWithRetry<T>(
  requestFn: () => Promise<T>,
  requestData?: any,
  customConfig?: Partial<RetryConfig>,
): Promise<T> {
  // リトライ設定をマージ
  const config: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...customConfig,
  };

  let retryCount = 0;
  let lastError: AIError | null = null;
  let responseData: any = null;

  while (retryCount <= config.maxRetries) {
    try {
      // リクエストを実行
      const result = await requestFn();
      responseData = result;

      // 成功した場合、結果を返す
      if (retryCount > 0) {
        console.log(`[AI] リトライ成功: ${retryCount}回目`);
      }
      return result;
    } catch (error) {
      // エラーを分類
      const aiError = classifyAIError(error, requestData, responseData);
      aiError.retryCount = retryCount;
      lastError = aiError;

      // リトライ可能なエラーかチェック
      const canRetry = config.retryableErrors.includes(aiError.type);

      // 最大リトライ回数に達した、またはリトライ不可能なエラーの場合
      if (retryCount >= config.maxRetries || !canRetry) {
        if (!canRetry) {
          console.error(`[AI] リトライ不可能なエラー: ${aiError.type}`);
        } else {
          console.error(
            `[AI] 最大リトライ回数(${config.maxRetries})に達しました`,
          );
        }
        throw aiError;
      }

      // バックオフ時間を計算
      const backoffMs = calculateBackoff(retryCount, config);
      console.log(
        `[AI] ${backoffMs}ms後にリトライ (${retryCount + 1}/${
          config.maxRetries
        })`,
      );

      // 待機
      await sleep(backoffMs);

      // リトライカウンターを増加
      retryCount++;
    }
  }

  // 最後のエラーをスロー（ここには通常到達しないはず）
  throw lastError || new Error('不明なエラーが発生しました');
}

/**
 * JSONパースエラーから回復を試みる関数
 * @param jsonString JSON文字列
 * @returns パースされたオブジェクト
 */
export function recoverFromJSONParseError(jsonString: string): any {
  try {
    // 通常のJSONパースを試みる
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('[AI] JSONパースエラー、修復を試みます');

    try {
      // クリーニング: コードブロックの除去
      let cleaned = jsonString.replace(/```(json|yaml)?|```/g, '').trim();

      // クリーニング: 余分な装飾や特殊文字を除去
      cleaned = cleaned.replace(/(\*\*|##|--|\*)/g, '');

      // クリーニング: 引用符の修正
      cleaned = cleaned.replace(/[""]/g, '"').replace(/'/g, '"');

      // クリーニング: 末尾カンマの修正
      cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']');

      // 再度パースを試みる
      return JSON.parse(cleaned);
    } catch (recoveryError) {
      console.error('[AI] JSONの修復に失敗しました', recoveryError);
      console.debug('[AI] 問題の原文:\n', jsonString);

      // 何らかのオブジェクトを返すことでUIが完全に壊れることを防ぐ
      return {
        parseError: true,
        originalText: jsonString,
        errorMessage: (recoveryError as Error).message,
      };
    }
  }
}

/**
 * YAMLパースエラーから回復を試みる関数
 * @param yamlString YAML文字列
 * @returns パースされたオブジェクト
 */
export function parseYAML(yamlString: string): any {
  try {
    // 通常のYAMLパースを試みる
    return yaml.load(yamlString);
  } catch (error) {
    console.warn('[AI] YAMLパースエラー、修復を試みます');
    console.debug('[AI] 問題のYAML文字列:\n', yamlString);

    try {
      // クリーニング: コードブロックの除去
      let cleaned = yamlString.replace(/```(yaml|yml)?|```/g, '').trim();

      // YAMLデリミタの検出と抽出
      const yamlPattern = /^---\s*\n([\s\S]+?)(\n---|\n\.\.\.|\Z)/m;
      const match = cleaned.match(yamlPattern);

      if (match) {
        // YAMLブロックが見つかった場合、その部分だけを抽出
        cleaned = match[1];
      }

      // インデントの修正を試みる
      const lines = cleaned.split('\n');
      const fixedLines = [];
      let lastIndent = 0;

      for (const line of lines) {
        // 空行をスキップ
        if (line.trim() === '') continue;

        // 現在の行のインデントを取得
        const currentIndent = line.search(/\S|$/);

        // インデントが不正な場合に修正
        if (currentIndent % 2 !== 0 && currentIndent > 0) {
          const correctIndent = Math.floor(currentIndent / 2) * 2;
          fixedLines.push(' '.repeat(correctIndent) + line.trim());
        } else {
          fixedLines.push(line);
        }

        lastIndent = currentIndent;
      }

      cleaned = fixedLines.join('\n');

      // パースを試みる
      return yaml.load(cleaned);
    } catch (recoveryError) {
      console.error('[AI] YAMLの修復に失敗しました', recoveryError);
      console.error(
        '[AI] 問題のYAML文字列（先頭100文字）:',
        yamlString.substring(0, 100),
      );
      console.error('[AI] インデントやフォーマットの問題が考えられます');

      // 明示的にエラーをスローして、呼び出し元でハンドリングを強制する
      throw {
        type: 'YAML_PARSE_ERROR',
        message: 'YAMLのパースに失敗しました',
        originalYaml: yamlString,
        originalError: recoveryError,
      };
    }
  }
}

/**
 * AI応答のパースエラーから回復する関数
 * @param responseText AIからのレスポンステキスト
 * @param expectStructured 構造化データ（JSONまたはYAML）を期待するか
 * @param format データ形式（'json'または'yaml'）
 * @returns パースされたレスポンスまたは元のテキスト
 */
export function handleAIResponseParsing(
  responseText: string,
  expectStructured: boolean = false,
  format: 'json' | 'yaml' = 'yaml',
): any {
  if (!responseText) {
    return expectStructured ? (format === 'json' ? [] : {}) : '';
  }

  if (expectStructured) {
    try {
      // YAML形式を試みる
      if (format === 'yaml') {
        // YAMLデータの検出
        const containsYaml =
          responseText.includes('---') &&
          (responseText.includes('\n- ') || responseText.includes('\n  '));

        if (containsYaml) {
          return parseYAML(responseText);
        }
      }

      // JSON形式を試みる
      if (format === 'json' || !format) {
        // JSONパターンを検出
        const jsonPattern = /\[\s*\{.+\}\s*\]/s;
        const match = responseText.match(jsonPattern);

        if (match) {
          return recoverFromJSONParseError(match[0]);
        }
      }

      // どちらも失敗した場合はエラーを投げる
      console.error(
        '[AI] レスポンスのパース失敗: JSONもYAMLとしても解析できません',
      );
      console.error(
        '[AI] レスポンステキスト（先頭100文字）:',
        responseText.substring(0, 100),
      );

      // エラーを投げる
      throw {
        type: 'PARSE_ERROR',
        message: '構造化データとして解析できないレスポンスを受け取りました',
        responseText: responseText,
      };
    } catch (error) {
      console.error('[AI] レスポンスのパースに失敗しました', error);
      console.debug('[AI] 問題のレスポンス:\n', responseText);

      // エラーを投げて呼び出し元で処理させる
      throw {
        type: 'PARSE_ERROR',
        message: 'レスポンスのパースに失敗しました',
        originalError: error,
        responseText: responseText,
        format: format,
      };
    }
  }

  // 構造化データが不要な場合はテキストをそのまま返す
  return responseText;
}

// 頑健なAI呼び出しをラップする高階関数
export function withRobustAICall<T, P extends any[]>(
  aiCallFn: (...args: P) => Promise<T>,
  expectStructured: boolean = false,
  format: 'json' | 'yaml' = 'yaml',
): (...args: P) => Promise<T> {
  return async (...args: P): Promise<T> => {
    try {
      // リクエストデータをログ用に抽出
      const requestData = args.length > 0 ? args[0] : undefined;

      // リトライ機構を使用してAI呼び出しを実行
      return await executeWithRetry(async () => {
        const result = await aiCallFn(...args);

        // レスポンスを検証（テキスト形式か構造化データかに応じて）
        if (typeof result === 'string' && expectStructured) {
          return handleAIResponseParsing(result, true, format) as unknown as T;
        }

        return result;
      }, requestData);
    } catch (error) {
      // 最終的なエラーハンドリング
      console.error('[AI] AIリクエストに最終的に失敗しました', error);
      throw error;
    }
  };
}

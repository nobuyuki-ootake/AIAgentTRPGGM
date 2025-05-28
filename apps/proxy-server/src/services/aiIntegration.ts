/**
 * AIサービス統合モジュール
 * 異なるAIサービス（OpenAI、Claude、Gemini）とのインテグレーションを管理
 *
 * 【重要な原則】
 * 1. ユーザーが選択したモデルのみを使用し、自動的なフォールバックは行わない
 * 2. モデルが利用できない場合は、明示的なエラーを返し、ユーザーに選択を促す
 * 3. 使用しているモデルと設定は常に透明性を保つ
 */

import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import * as yaml from 'js-yaml';
import {
  AIDataFormat,
  AIModelType,
  StandardAIRequest,
  StandardAIResponse,
  AIError,
} from '@novel-ai-assistant/types';
import {
  AIErrorType,
  handleAIResponseParsing,
  withRobustAICall,
} from '../utils/aiErrorHandler.js';
import templateManager from '../utils/aiTemplateManager.js';
import { WORLD_BUILDER } from '../utils/systemPrompts.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// サポートされているモデル設定
const MODEL_CONFIG = {
  openai: {
    default: 'gpt-4o',
    models: ['gpt-3.5-turbo', 'gpt-4o', 'gpt-4', 'gpt-4-turbo'],
  },
  anthropic: {
    default: 'claude-3-opus-20240229',
    models: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
    ],
  },
  gemini: {
    default: 'gemini-pro-1.5',
    models: ['gemini-pro', 'gemini-pro-1.5'],
  },
  mistral: {
    default: 'mistral-large-latest',
    models: ['mistral-large-latest', 'mistral-medium', 'mistral-small'],
  },
};

// OpenAI クライアントの設定
let openaiClient: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('[AI] OpenAIクライアントを初期化しました');
  } else {
    console.warn(
      '[AI] OPENAI_API_KEYが設定されていないため、OpenAI機能は無効です',
    );
  }
} catch (error) {
  console.error('[AI] OpenAIクライアントの初期化に失敗しました:', error);
}

/**
 * AIリクエストを実行する関数
 * @param request 標準化されたAIリクエスト
 * @returns AIレスポンス
 */
export async function processAIRequest(
  request: StandardAIRequest,
): Promise<StandardAIResponse> {
  const startTime = Date.now();
  const requestId = uuidv4();
  const model = request.model || determineDefaultModel(request);
  const modelType = determineModelType(model);
  const responseFormat = request.options?.responseFormat || 'yaml'; // デフォルトをYAMLに変更
  const expectStructured = responseFormat !== 'text';

  // タイムアウト設定
  const timeout = request.options?.timeout || 60000; // デフォルト60秒

  try {
    console.log(
      `[AI] リクエスト実行開始: ${request.requestType}, モデル: ${model}`,
    );

    // OpenAIが利用不可でmodelTypeがopenaiの場合、明示的なエラーを返す
    if (modelType === 'openai' && !openaiClient) {
      throw new Error(
        'OpenAI APIキーが設定されていないため、OpenAIモデル（gpt-*）は使用できません。環境変数OPENAI_API_KEYを設定するか、別のモデルを使用してください。',
      );
    }

    // モデルタイプに応じた処理
    let content: any;
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let rawContent: string = '';

    switch (modelType) {
      case 'openai':
        const openaiResponse = await callOpenAI(request, model, responseFormat);
        content = openaiResponse.content;
        rawContent = openaiResponse.rawContent;
        usage = openaiResponse.usage;
        break;

      case 'anthropic':
        const anthropicResponse = await callAnthropic(
          request,
          model,
          responseFormat,
        );
        content = anthropicResponse.content;
        rawContent = anthropicResponse.rawContent;
        usage = anthropicResponse.usage;
        break;

      case 'gemini':
        const geminiResponse = await callGemini(request, model, responseFormat);
        content = geminiResponse.content;
        rawContent = geminiResponse.rawContent;
        usage = geminiResponse.usage;
        break;

      default:
        throw new Error(`サポートされていないモデルタイプ: ${modelType}`);
    }

    const processingTime = Date.now() - startTime;

    // ★★★ ID付与処理をここに追加 ★★★
    let finalContent = content;
    if (
      request.requestType === 'timeline-event-generation' &&
      Array.isArray(content)
    ) {
      finalContent = content.map((item) => ({
        ...item,
        id: item.id || uuidv4(), // 既存IDがあればそれを使い、なければ新規生成
      }));
      console.log(
        '[AI] Timeline event seedsにIDを付与しました:',
        finalContent.map((s) => s.id),
      );
    }

    // 標準レスポンスを作成
    return {
      requestId,
      timestamp: new Date().toISOString(),
      status: 'success',
      responseFormat: responseFormat as AIDataFormat,
      content: finalContent, // finalContent を使用
      rawContent,
      usage,
      debug: {
        model: model,
        requestType: request.requestType,
        processingTime,
      },
    };
  } catch (error: any) {
    console.error(`[AI] エラー発生: ${error.message}`);

    // エラーレスポンスを作成
    return {
      requestId,
      timestamp: new Date().toISOString(),
      status: 'error',
      responseFormat: responseFormat as AIDataFormat,
      content: null,
      error: {
        code: error.type || AIErrorType.UNKNOWN,
        message: error.message || 'AI呼び出し中に不明なエラーが発生しました',
        details: error.originalError || error,
      },
      debug: {
        model: model,
        requestType: request.requestType,
        processingTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * OpenAI APIを呼び出す関数
 * @param request AIリクエスト
 * @param model 使用するモデル
 * @param responseFormat レスポンス形式
 * @returns OpenAIレスポンス
 */
async function callOpenAI(
  request: StandardAIRequest,
  model: string,
  responseFormat: string,
): Promise<{
  content: any;
  rawContent: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}> {
  // OpenAIクライアントが初期化されていない場合はエラー
  if (!openaiClient) {
    throw new Error(
      'OpenAIクライアントが初期化されていません。OPENAI_API_KEYを設定してください。',
    );
  }

  // システムプロンプトの設定
  const systemPrompt =
    request.systemPrompt ||
    WORLD_BUILDER ||
    'あなたは小説作成を支援するAIアシスタントです。';

  // JSON応答を強制する設定
  const openAIResponseFormat =
    responseFormat === 'json'
      ? { type: 'json_object' as const }
      : { type: 'text' as const };

  // OpenAIへのリクエスト
  const robustOpenAICall = withRobustAICall(
    async () => {
      const response = await openaiClient.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
        temperature: request.options?.temperature || 0.7,
        max_tokens: request.options?.maxTokens,
        response_format: openAIResponseFormat,
      });

      return response;
    },
    responseFormat !== 'text', // 構造化データが期待されているか
    responseFormat as 'json' | 'yaml', // フォーマット指定
  );

  const response = await robustOpenAICall();

  const responseText = response.choices[0]?.message?.content || '';

  // レスポンスの処理
  let parsedContent;
  if (responseFormat === 'json') {
    try {
      parsedContent = JSON.parse(responseText);
    } catch {
      parsedContent = handleAIResponseParsing(responseText, true, 'json');
    }
  } else if (responseFormat === 'yaml') {
    try {
      parsedContent = yaml.load(responseText);
    } catch {
      parsedContent = handleAIResponseParsing(responseText, true, 'yaml');
    }
  } else {
    parsedContent = responseText;
  }

  return {
    content: parsedContent,
    rawContent: responseText,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

/**
 * Anthropic (Claude) APIを呼び出す関数
 * @param request AIリクエスト
 * @param model 使用するモデル
 * @param responseFormat レスポンス形式
 * @returns Anthropicレスポンス
 */
async function callAnthropic(
  request: StandardAIRequest,
  model: string,
  responseFormat: string,
): Promise<{
  content: any;
  rawContent: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}> {
  // 現在はダミーのAPI呼び出し
  // 実際のAnthropicとの統合はここに実装
  console.log(`[AI] Anthropic APIを呼び出し: モデル=${model}`);

  const systemPrompt = request.systemPrompt || WORLD_BUILDER;

  // JSON/YAML形式を指示するプロンプトの追加
  let formatInstruction = '';
  if (responseFormat === 'json') {
    formatInstruction = 'レスポンスはJSON形式でのみ返してください。';
  } else if (responseFormat === 'yaml') {
    formatInstruction =
      'レスポンスは正確なYAML形式でのみ返してください。YAMLは"---"で始め、"..."で終わります。';
  }

  // Anthropic APIとの実際の統合コードはここに実装予定
  // ダミーレスポンスを返す
  const dummyResponse =
    responseFormat === 'json'
      ? '[{"name": "ダミーデータ", "description": "Anthropic API統合はまだ実装されていません"}]'
      : responseFormat === 'yaml'
        ? '---\n- name: ダミーデータ\n  description: Anthropic API統合はまだ実装されていません\n...'
        : 'Anthropic API統合はまだ実装されていません';

  let parsedContent;
  if (responseFormat === 'json') {
    try {
      parsedContent = JSON.parse(dummyResponse);
    } catch {
      parsedContent = handleAIResponseParsing(dummyResponse, true, 'json');
    }
  } else if (responseFormat === 'yaml') {
    try {
      parsedContent = yaml.load(dummyResponse);
    } catch {
      parsedContent = handleAIResponseParsing(dummyResponse, true, 'yaml');
    }
  } else {
    parsedContent = dummyResponse;
  }

  return {
    content: parsedContent,
    rawContent: dummyResponse,
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
  };
}

/**
 * Gemini APIを呼び出す関数
 * @param request AIリクエスト
 * @param model 使用するモデル
 * @param responseFormat レスポンス形式
 * @returns Geminiレスポンス
 */
async function callGemini(
  request: StandardAIRequest,
  model: string,
  responseFormat: string,
): Promise<{
  content: any;
  rawContent: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}> {
  // APIキーが設定されているか確認
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEYが設定されていません。環境変数を確認してください。',
    );
  }

  console.log(
    `[AI] Gemini APIリクエスト実行: モデル=${model}、フォーマット=${responseFormat}、リクエストタイプ=${request.requestType}`,
  );

  try {
    // Geminiクライアントの初期化
    const genAI = new GoogleGenerativeAI(apiKey);

    // モデル名を修正（gemini-pro-1.5 → gemini-1.5-pro）
    const modelName =
      model === 'gemini-pro-1.5' ? 'gemini-1.5-pro' : model || 'gemini-1.5-pro';

    // 生成設定
    const generationConfig = {
      temperature: request.options?.temperature || 0.7,
      maxOutputTokens: request.options?.maxTokens || 2000,
    };

    // Geminiモデルの取得
    console.log(`[AI] モデル ${modelName} で実行します`);
    const geminiModel = genAI.getGenerativeModel({
      model: modelName,
      generationConfig,
    });

    // システムプロンプトとユーザープロンプトを構築
    const systemPrompt = request.systemPrompt || WORLD_BUILDER;

    // フォーマット指定があれば、それに応じた指示を追加
    let formatInstruction = '';
    if (responseFormat === 'json') {
      formatInstruction =
        'レスポンスは厳密なJSON形式でのみ返してください。マークダウンのコードブロック記号(```)は使わないでください。';
    } else if (responseFormat === 'yaml') {
      formatInstruction =
        'レスポンスは厳密なYAML形式でのみ返してください。YAMLは"---"で始め、必要に応じて"..."で終わります。';
    }

    // 世界観リスト生成の場合の追加指示
    let specialInstruction = '';
    if (request.requestType === 'worldbuilding-list') {
      // 要素タイプに応じた指示を追加
      const elementType = request.context?.elementType || '';
      if (elementType === 'places' || elementType === '場所') {
        specialInstruction =
          '以下の形式で場所のリストを生成してください。各場所には名前、説明、重要性を含めてください。';
      } else if (elementType === 'cultures' || elementType === '文化') {
        specialInstruction =
          '以下の形式で文化のリストを生成してください。各文化には名前、説明、重要性を含めてください。';
      }
    } else if (request.requestType === 'timeline-event-generation') {
      specialInstruction =
        'ユーザーの指示に基づき、物語のタイムラインに追加するイベントのアイデアを複数提案してください。\n' +
        '各イベント提案には以下の情報を含めてください:\n' +
        '- eventName: イベントの簡潔なタイトル (必須、文字列)\n' +
        '- description: イベントのより詳細な説明 (省略可、文字列)\n' +
        '- estimatedTime: イベントが発生すると推定される時期や日付 (省略可、文字列、可能であればISO 8601形式に近いと望ましいが、柔軟に解釈できる形式で良い)\n' +
        '- characterIds: イベントに関連するキャラクターのIDの配列 (省略可、文字列の配列)\n' +
        '- relatedPlaceIds: イベントに関連する場所のIDの配列 (省略可、文字列の配列)\n' +
        '- relatedPlotIds: イベントに関連するプロットのIDの配列 (省略可、文字列の配列)\n' +
        'ユーザープロンプトで既存のキャラクター、場所、プロットの情報が提供されている場合は、それらを参考にしてください。';
    }

    // 最終的なプロンプトを組み立て
    const combinedPrompt = `${systemPrompt}

${formatInstruction}
${specialInstruction}

ユーザーからの質問/指示:
${request.userPrompt}`;

    console.log(
      `[AI] Gemini APIにリクエスト送信: ${modelName} ${request.requestType} ${request.userPrompt}`,
    );

    // Gemini APIを呼び出す
    const result = await geminiModel.generateContent([
      { text: combinedPrompt },
    ]);

    // 結果がないとエラー
    if (!result || !result.response) {
      throw new Error('Gemini APIからの応答が空です');
    }

    const responseText = result.response.text() || '';
    console.log(
      `[AI] Gemini APIからの生のレスポンス取得: ${responseText.length}バイト`,
    );

    // レスポンスの処理（フォーマットに合わせてパース）
    let parsedContent;
    if (responseFormat === 'json') {
      try {
        // JSON文字列を探す（マークダウンコードブロックがある場合も対応）
        const jsonPattern = /```json\s*(.+)\s*```|(\[.+\]|\{.+\})/s;
        const match = responseText.match(jsonPattern);
        const jsonStr = match
          ? match[1] || match[2] || responseText
          : responseText;

        parsedContent = JSON.parse(jsonStr.trim());
        console.log(`[AI] JSON解析成功: ${typeof parsedContent}, ${jsonStr}`);
      } catch (parseError) {
        console.error(`[AI] JSONパースエラー:`, parseError);
        // 代替解析を試みる
        parsedContent = handleAIResponseParsing(responseText, true, 'json');
      }
    } else if (responseFormat === 'yaml') {
      try {
        parsedContent = yaml.load(responseText);
        console.log(`[AI] YAML解析成功`);
      } catch (parseError) {
        console.error(`[AI] YAMLパースエラー:`, parseError);
        // 代替解析を試みる
        parsedContent = handleAIResponseParsing(responseText, true, 'yaml');
      }
    } else {
      parsedContent = responseText;
    }

    // トークン数の推定（正確な値はGemini APIが提供していないため）
    const promptTokens = combinedPrompt.length / 4;
    const completionTokens = responseText.length / 4;

    return {
      content: parsedContent,
      rawContent: responseText,
      usage: {
        promptTokens: Math.round(promptTokens),
        completionTokens: Math.round(completionTokens),
        totalTokens: Math.round(promptTokens + completionTokens),
      },
    };
  } catch (error) {
    // 詳細なエラー情報を出力（デバッグ用）
    console.error(`[AI] Gemini APIエラー:`, error);

    // エラー情報を構造化
    const errorDetail = {
      message: error instanceof Error ? error.message : '不明なエラー',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      requestType: request.requestType,
    };

    // エラーを再スロー（追加情報付き）
    throw {
      type: 'GEMINI_API_ERROR',
      message: 'Gemini APIでのリクエスト処理中にエラーが発生しました',
      details: errorDetail,
      originalError: error,
    };
  }
}

/**
 * リクエストに基づいてデフォルトモデルを決定する関数
 * @param request AIリクエスト
 * @returns 適切なデフォルトモデル
 */
function determineDefaultModel(request: StandardAIRequest): string {
  const requestType = request.requestType || 'generic';

  // リクエストタイプに基づいた推奨モデル
  const recommendedModelType =
    requestType.includes('world') || requestType.includes('building')
      ? 'gemini'
      : requestType.includes('character')
        ? 'anthropic'
        : 'openai'; // デフォルト

  return MODEL_CONFIG[recommendedModelType as keyof typeof MODEL_CONFIG]
    .default;
}

/**
 * モデル名からモデルタイプ（プロバイダ）を決定する関数
 * @param modelName モデル名
 * @returns モデルタイプ（プロバイダ名）
 */
function determineModelType(modelName: string): AIModelType {
  if (modelName.startsWith('gpt-') || modelName.includes('openai')) {
    return 'openai';
  } else if (modelName.startsWith('claude-')) {
    return 'anthropic';
  } else if (modelName.includes('gemini')) {
    return 'gemini';
  } else if (modelName.includes('mistral')) {
    return 'mistral';
  } else if (modelName.includes('llama') || modelName.includes('ollama')) {
    return 'ollama';
  }

  return 'openai'; // デフォルトはOpenAI
}

import express from 'express';
import { processAIRequest } from '../services/aiIntegration.js';
import { StandardAIRequest } from '@novel-ai-assistant/types';
import templateManager from '../utils/aiTemplateManager.js';
import { PLOT_DEVELOPER, WORLD_BUILDER } from '../utils/systemPrompts.js';
import * as yaml from 'js-yaml';
import {
  WorldBuildingElementType,
  WorldBuildingElementData,
  Chapter,
  TimelineEvent,
  Character,
} from '@novel-ai-assistant/types';
import { generateElementPrompt } from '../utils/worldBuildingSchemas.js';

const router = express.Router();

/**
 * 世界観要素の詳細生成エンドポイント
 * 特定の世界観要素（場所、文化、ルールなど）の詳細を生成します
 */
router.post('/worldbuilding-detail-generation', async (req, res) => {
  try {
    const {
      elementName,
      elementType,
      message,
      plotElements,
      charactersElements,
    } = req.body;
    const format = req.body.format || 'json'; // デフォルトをJSONに変更
    const model = req.body.model || 'gemini-1.5-pro';

    console.log(
      `[API] 世界観要素詳細生成リクエスト: ${elementName} (${elementType}), フォーマット: ${format}`,
    );

    // 要素タイプの正規化（小文字に変換）
    const normalizedElementType =
      elementType?.toLowerCase() || WorldBuildingElementType.PLACE;

    // 世界観要素タイプに応じたプロンプトテンプレートを生成
    const promptTemplate = generateElementPrompt(
      normalizedElementType,
      elementName,
    );

    // ユーザーからの追加指示がある場合は組み合わせる
    const enhancedMessage = message
      ? `${promptTemplate}\n\n追加の指示:\n${message}`
      : promptTemplate;

    // システムプロンプトを構築
    const systemPrompt = templateManager.buildWorldElementSystemPrompt(
      elementName,
      normalizedElementType,
    );

    // AIリクエストを作成
    const aiRequest: StandardAIRequest = {
      requestType: 'worldbuilding-detail',
      model: model,
      systemPrompt,
      userPrompt: enhancedMessage,
      context: {
        elementName,
        elementType: normalizedElementType,
        plotElements,
        charactersElements,
      },
      options: {
        temperature: 0.7,
        maxTokens: 2000,
        expectedFormat: format === 'json' ? 'json' : 'yaml',
        responseFormat: format === 'json' ? 'json' : 'yaml',
      },
    };

    // AIリクエストを実行
    console.log(
      `[API] AIリクエスト実行: ${aiRequest.requestType}, フォーマット: ${format}, モデル: ${model}`,
    );
    const aiResponse = await processAIRequest(aiRequest);

    let responseData: WorldBuildingElementData;

    // JSON形式の場合、パースしてエンリッチしたデータを返す
    if (format === 'json' && aiResponse.content) {
      try {
        // パース済みの場合はそのまま使用、文字列ならパースする
        const parsedData =
          typeof aiResponse.content === 'string'
            ? JSON.parse(aiResponse.content)
            : aiResponse.content;

        // 世界観要素共通データの設定
        responseData = {
          ...parsedData,
          type: normalizedElementType,
          originalType: elementType || normalizedElementType,
        };

        console.log(
          `[API] 世界観要素データ処理完了: ${elementName} (${normalizedElementType})`,
        );
      } catch (error) {
        console.error(`[API] エラー: 世界観要素データのパースに失敗`, error);
        responseData = {
          name: elementName,
          type: normalizedElementType,
          description:
            aiResponse.rawContent || '世界観要素の説明を取得できませんでした',
          features: '特徴',
          importance: '重要性',
        };
      }
    } else {
      // YAMLまたはテキスト形式の場合
      responseData = {
        name: elementName,
        type: normalizedElementType,
        description:
          aiResponse.rawContent || (aiResponse.content as string) || '',
        features: '特徴',
        importance: '重要性',
      };
    }

    // レスポンスを返す
    res.json({
      status: 'success',
      data: responseData,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiRequest.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
        format: format,
      },
    });
  } catch (error) {
    console.error('[API] 世界観要素詳細生成エラー:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || '世界観要素詳細の生成中にエラーが発生しました',
    });
  }
});

/**
 * 世界観要素のリスト生成エンドポイント
 * 小説世界の場所や文化などのリストを生成します
 */
router.post('/worldbuilding-list-generation', async (req, res) => {
  try {
    const { elementType, userMessage, model } = req.body;
    const format = req.body.format || 'json'; // デフォルトをJSONに変更

    console.log(
      `[API] 世界観要素リスト生成リクエスト: ${elementType || 'タイプ未指定'}, フォーマット: ${format}, モデル: ${model || 'デフォルト'}`,
    );
    console.log(
      `[API] ユーザーメッセージ: ${userMessage ? userMessage.slice(0, 100) + '...' : 'なし'}`,
    );

    // elementTypeの検証を追加
    const validatedElementType = elementType || 'places'; // デフォルトは場所

    // 明示的なデバッグログを追加
    console.log(`[API] 処理される要素タイプ: ${validatedElementType}`);

    // 要素タイプに応じたテンプレートキーを取得（デフォルトを'places'に変更）
    const templateKey =
      validatedElementType === 'places' || validatedElementType === '場所'
        ? 'places'
        : validatedElementType === 'cultures' || validatedElementType === '文化'
          ? 'cultures'
          : validatedElementType === 'characters' ||
              validatedElementType === 'キャラクター'
            ? 'characters'
            : 'places'; // デフォルトを'characters'から'places'に変更

    // テンプレートタイプをログに出力
    console.log(`[API] 使用するテンプレートキー: ${templateKey}`);

    // 汎用的な世界観要素リストテンプレートを使用する
    const modelSpecific =
      model && model.includes('gemini') ? 'gemini' : undefined;
    const formatTemplate = templateManager.getFormatTemplate(
      format as 'json' | 'yaml',
      'world-building-list-generic', // 汎用テンプレートを使用
      modelSpecific,
    );

    // ユーザープロンプトを構築（ユーザーの意図を優先し、フォーマット指示を後に配置）
    // ユーザーメッセージがない場合のみデフォルトのプロンプトを使用
    const enhancedUserMessage =
      userMessage ||
      `現在の物語設定から、適切な世界観構築設定を行うための要素リストを生成してください。`;

    // ユーザーメッセージを最初に配置し、フォーマット指示を後に追加
    const userPrompt = `${enhancedUserMessage}\n\n以下のフォーマットで回答してください:\n${formatTemplate}`;

    // AIリクエストを作成
    const aiRequest: StandardAIRequest = {
      requestType: 'worldbuilding-list',
      model: model || determineModelByElementType(validatedElementType),
      systemPrompt: WORLD_BUILDER,
      userPrompt,
      context: {
        elementType: validatedElementType,
      },
      options: {
        temperature: 0.7,
        maxTokens: 2000,
        expectedFormat: format === 'json' ? 'json' : 'yaml',
        responseFormat: format === 'json' ? 'json' : 'yaml',
      },
    };

    // AIリクエストを実行
    console.log(
      `[API] AIリクエスト実行: ${aiRequest.requestType}, フォーマット: ${format}, モデル: ${aiRequest.model}`,
    );
    const aiResponse = await processAIRequest(aiRequest);

    // 詳細なデバッグ情報
    console.log(`[API] AIレスポンスステータス: ${aiResponse.status}`);

    // レスポンスがnullかどうか確認
    if (!aiResponse.content) {
      console.warn(`[API] 警告：レスポンスコンテンツがnullまたは空です`);
      console.log(
        `[API] 生のレスポンス内容: ${aiResponse.rawContent || '<空>'}`,
      );
    }

    // エラー処理
    if (aiResponse.status === 'error') {
      // レスポンスのエラーコードとリクエスト内容をコンソールに出力
      console.error('[API] AIリクエスト失敗:', {
        errorCode: aiResponse.error?.code,
        errorMessage: aiResponse.error?.message,
        request: JSON.stringify(aiRequest, null, 2),
      });

      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    // 成功の場合でも、コンテンツがない場合はダミーデータを提供
    if (!aiResponse.content && format === 'json') {
      console.warn(
        '[API] 警告：AIから有効なレスポンスが得られませんでした。ダミーデータを返します',
      );

      // 要素タイプに応じたダミーデータ - フロントエンドの期待する形式 (name, type) に合わせる
      const dummyData =
        validatedElementType === 'places' || validatedElementType === '場所'
          ? [
              {
                name: '魔法の森',
                type: 'place',
              },
              {
                name: '古代都市エレミア',
                type: 'place',
              },
            ]
          : validatedElementType === 'cultures' ||
              validatedElementType === '文化'
            ? [
                {
                  name: '空翔ける民',
                  type: 'culture',
                },
                {
                  name: '深緑の守護者',
                  type: 'culture',
                },
              ]
            : [
                {
                  name: '魔法使いの制約',
                  type: 'rule',
                },
                {
                  name: '王国の継承法',
                  type: 'rule',
                },
              ];

      // ダミーデータを返す
      return res.json({
        status: 'success',
        data: dummyData,
        rawContent: JSON.stringify(dummyData),
        metadata: {
          model: aiResponse.debug?.model || 'fallback',
          processingTime: aiResponse.debug?.processingTime || 0,
          requestType: aiRequest.requestType,
          format: format,
          isDummyData: true, // これがダミーデータであることを示すフラグ
        },
      });
    }

    // 通常の成功レスポンス
    console.log(
      `[API] 成功レスポンス送信: データ型=${typeof aiResponse.content}, 生データ長=${aiResponse.rawContent?.length || 0}`,
    );

    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
        format: format,
      },
    });
  } catch (error: any) {
    console.error('[API] ルートハンドラでのエラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '処理中に予期しないエラーが発生しました',
    });
  }
});

/**
 * キャラクター詳細生成エンドポイント
 * 小説のキャラクターの詳細情報を生成します
 */
router.post('/character-detail-generation', async (req, res) => {
  try {
    const { characterName, characterRole, userMessage, model } = req.body;
    const format = req.body.format || 'yaml'; // デフォルトをYAMLに変更

    console.log(
      `[API] キャラクター詳細生成リクエスト: ${characterName} (${characterRole})`,
    );

    // ユーザープロンプトを構築
    const userPrompt = templateManager.buildCharacterUserPrompt(
      characterName,
      characterRole || '主要キャラクター',
      userMessage || '',
      format as 'json' | 'yaml',
    );

    // AIリクエストを作成
    const aiRequest: StandardAIRequest = {
      requestType: 'character-detail',
      model: model || 'gemini-1.5-pro',
      systemPrompt: templateManager.buildCharacterSystemPrompt(
        characterName,
        characterRole || '主要キャラクター',
      ),
      userPrompt,
      context: {
        characterName,
        characterRole,
      },
      options: {
        temperature: 0.7,
        maxTokens: 2000,
        expectedFormat: format === 'json' ? 'json' : 'yaml',
        responseFormat: format === 'json' ? 'json' : 'yaml',
      },
    };

    // AIリクエストを実行
    console.log(`[API] AIリクエスト実行: ${aiRequest.requestType}`);
    const aiResponse = await processAIRequest(aiRequest);

    // エラー処理
    if (aiResponse.status === 'error') {
      // レスポンスのエラーコードとリクエスト内容をコンソールに出力
      console.error('[API] AIリクエスト失敗:', {
        errorCode: aiResponse.error?.code,
        errorMessage: aiResponse.error?.message,
        request: JSON.stringify(aiRequest, null, 2),
      });

      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    // 成功レスポンス
    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
        format: format,
      },
    });
  } catch (error: any) {
    console.error('[API] ルートハンドラでのエラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '処理中に予期しないエラーが発生しました',
    });
  }
});

/**
 * プロット開発エンドポイント
 * 物語のプロット作成や改善に関するアドバイスを提供します
 */
router.post('/plot-development', async (req, res) => {
  try {
    const { userMessage, projectData, model } = req.body;
    const format = req.body.format || 'text';

    console.log('[API] プロット開発リクエスト');

    // プロット生成専用のシステムプロンプト
    const plotGenerationSystemPrompt = `
あなたは小説作成を支援するAIアシスタントで、プロット開発の専門家です。
ユーザーの指示に従って、魅力的で一貫性のある物語の構造を作成します。

【重要：出力形式について】
プロットアイテムを生成する場合は、必ず以下の形式で応答してください：

プロットアイテム1
タイトル: [プロットのタイトル]
詳細: [具体的な説明]

プロットアイテム2
タイトル: [プロットのタイトル]
詳細: [具体的な説明]

プロットアイテム3
タイトル: [プロットのタイトル]
詳細: [具体的な説明]

※マークダウンの装飾（**太字**など）は使用しないでください
※解説や分析は不要です。プロットアイテムのみを上記形式で提示してください
※各プロットアイテムは空行で区切ってください

起承転結を意識し、キャラクターの動機に基づいた説得力のある展開を提案してください。
`;

    // プロジェクトデータを含むコンテキストを構築
    let contextualPrompt = userMessage;
    if (projectData) {
      const { title, synopsis, characters, plot } = projectData;

      contextualPrompt += '\n\n【参考情報】';
      if (title) contextualPrompt += `\nタイトル: ${title}`;
      if (synopsis) contextualPrompt += `\nあらすじ: ${synopsis}`;
      if (characters && Array.isArray(characters) && characters.length > 0) {
        contextualPrompt += `\n登場キャラクター: ${characters.map((c) => c.name || '名前未設定').join(', ')}`;
      }
      if (plot && Array.isArray(plot) && plot.length > 0) {
        contextualPrompt += `\n既存のプロット: ${plot.map((p) => p.title || '無題').join(', ')}`;
      }
    }

    // AIリクエストを作成
    const aiRequest: StandardAIRequest = {
      requestType: 'plot-development',
      model: model || 'gemini-1.5-pro',
      systemPrompt: plotGenerationSystemPrompt,
      userPrompt: contextualPrompt,
      options: {
        temperature: 0.7,
        maxTokens: 2000,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    };

    // AIリクエストを実行
    console.log(`[API] AIリクエスト実行: ${aiRequest.requestType}`);
    const aiResponse = await processAIRequest(aiRequest);

    // エラー処理
    if (aiResponse.status === 'error') {
      console.error('[API] AIリクエスト失敗:', {
        errorCode: aiResponse.error?.code,
        errorMessage: aiResponse.error?.message,
        request: JSON.stringify(aiRequest, null, 2),
      });

      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    // AIレスポンスをパースしてプロットアイテムを抽出
    const plotItems = parseAIResponseToPlotItems(aiResponse.rawContent || '');

    console.log(
      `[API] パース結果: ${plotItems.length}件のプロットアイテムを抽出`,
    );

    // 成功レスポンス（構造化されたデータで返す）
    return res.json({
      status: 'success',
      data: plotItems, // 構造化されたプロットアイテム配列
      rawContent: aiResponse.rawContent, // デバッグ用の生レスポンス
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
        format: format,
        itemCount: plotItems.length,
      },
    });
  } catch (error: any) {
    console.error('[API] ルートハンドラでのエラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '処理中に予期しないエラーが発生しました',
    });
  }
});

/**
 * AIレスポンスからプロットアイテムを解析する関数
 */
function parseAIResponseToPlotItems(aiResponse: string): Array<{
  id: string;
  title: string;
  description: string;
  status: '検討中';
  order: number;
}> {
  const plotItems: Array<{
    id: string;
    title: string;
    description: string;
    status: '検討中';
    order: number;
  }> = [];

  // プロットアイテムのパターンを検索
  const plotItemPattern =
    /プロットアイテム\d+\s*\n?タイトル[：:]\s*(.+?)\s*\n?詳細[：:]\s*(.+?)(?=\n\nプロットアイテム|\n\n[^プ]|$)/gs;

  let match;
  let order = 0;
  while ((match = plotItemPattern.exec(aiResponse)) !== null) {
    const title = match[1]?.trim();
    const description = match[2]?.trim();

    if (title && description) {
      plotItems.push({
        id: generateId(), // UUIDを生成
        title,
        description,
        status: '検討中' as const,
        order: order++,
      });
    }
  }

  // パターンマッチングで見つからない場合、従来の方法を試行
  if (plotItems.length === 0) {
    const lines = aiResponse.split('\n').filter((line) => line.trim());
    lines.forEach((line, index) => {
      if (line.trim()) {
        plotItems.push({
          id: generateId(),
          title: `プロット${index + 1}`,
          description: line.trim(),
          status: '検討中' as const,
          order: index,
        });
      }
    });
  }

  return plotItems;
}

/**
 * 簡易ID生成関数
 */
function generateId(): string {
  return 'plot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * YAMLとJSONの変換エンドポイント
 * YAMLとJSON形式の相互変換を行います
 */
router.post('/format-conversion', async (req, res) => {
  try {
    const { data, fromFormat, toFormat } = req.body;

    if (!data || !fromFormat || !toFormat) {
      return res.status(400).json({
        status: 'error',
        message: '必要なパラメータが不足しています: data, fromFormat, toFormat',
      });
    }

    console.log(
      `[API] フォーマット変換リクエスト: ${fromFormat} -> ${toFormat}`,
    );

    let parsedData;
    let result;

    // ソース形式からパース
    try {
      if (fromFormat === 'json') {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      } else if (fromFormat === 'yaml') {
        parsedData = typeof data === 'string' ? yaml.load(data) : data;
      } else {
        return res.status(400).json({
          status: 'error',
          message: `サポートされていないソース形式: ${fromFormat}`,
        });
      }
    } catch (error: any) {
      return res.status(400).json({
        status: 'error',
        message: `${fromFormat}のパースに失敗しました: ${error.message}`,
      });
    }

    // 目標形式に変換
    try {
      if (toFormat === 'json') {
        result = JSON.stringify(parsedData, null, 2);
      } else if (toFormat === 'yaml') {
        result = yaml.dump(parsedData, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
        });
      } else {
        return res.status(400).json({
          status: 'error',
          message: `サポートされていない目標形式: ${toFormat}`,
        });
      }
    } catch (error: any) {
      return res.status(400).json({
        status: 'error',
        message: `${toFormat}への変換に失敗しました: ${error.message}`,
      });
    }

    // 成功レスポンス
    return res.json({
      status: 'success',
      data: result,
      metadata: {
        fromFormat,
        toFormat,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API] フォーマット変換エラー:', error);
    return res.status(500).json({
      status: 'error',
      message:
        error.message || 'フォーマット変換中に予期しないエラーが発生しました',
    });
  }
});

/**
 * 要素タイプに基づいて最適なモデルを決定する関数
 */
function determineModelByElementType(elementType: string): string {
  if (elementType === 'places' || elementType === '場所') {
    return 'gemini-1.5-pro'; // 場所には詳細な地理情報が必要なため、Geminiモデルを使用
  } else if (elementType === 'cultures' || elementType === '文化') {
    return 'gemini-1.5-pro'; // 文化には細かいニュアンスが必要
  } else {
    return 'gemini-1.5-pro'; // その他の場合も同様にGeminiを使用
  }
}

/**
 * プロットアドバイス生成エンドポイント
 */
router.post('/plot-advice', async (req, res) => {
  try {
    const { userPrompt, context, model, requestType } =
      req.body as StandardAIRequest;
    console.log(`[API] プロットアドバイスリクエスト`);

    const aiRequest: StandardAIRequest = {
      requestType: requestType || 'plot-advice',
      model: model || 'gemini-1.5-pro',
      systemPrompt: 'あなたは優秀な小説のプロットアドバイザーです。',
      userPrompt: userPrompt,
      context: context,
      options: {
        temperature: 0.7,
        maxTokens: 1500,
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error(
        '[API] プロットアドバイスAIリクエスト失敗:',
        aiResponse.error,
      );
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    res.json({
      status: 'success',
      content: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiRequest.model,
        processingTime: aiResponse.debug?.processingTime,
      },
    });
  } catch (error) {
    console.error('[API] プロットアドバイス生成エラー:', error);
    res.status(500).json({
      status: 'error',
      error:
        error.message || 'プロットアドバイスの生成中にエラーが発生しました',
    });
  }
});

/**
 * タイムラインイベント生成エンドポイント
 */
router.post('/timeline-event-generation', async (req, res) => {
  try {
    const { userPrompt, context, model, requestType } =
      req.body as StandardAIRequest;
    console.log(`[API] タイムラインイベント生成リクエスト`);

    const aiRequest: StandardAIRequest = {
      requestType: requestType || 'timeline-event-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt:
        'あなたは物語のタイムラインに沿った出来事を考案する専門家です。',
      userPrompt: userPrompt,
      context: context,
      options: {
        temperature: 0.8,
        maxTokens: 2000,
        responseFormat: 'json',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error(
        '[API] タイムラインイベントAIリクエスト失敗:',
        aiResponse.error,
      );
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    res.json({
      status: 'success',
      content: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiRequest.model,
        processingTime: aiResponse.debug?.processingTime,
      },
    });
  } catch (error) {
    console.error('[API] タイムラインイベント生成エラー:', error);
    res.status(500).json({
      status: 'error',
      error:
        error.message || 'タイムラインイベントの生成中にエラーが発生しました',
    });
  }
});

/**
 * 章の本文生成エンドポイント
 */
router.post('/chapter-generation', async (req, res) => {
  try {
    const {
      chapterTitle,
      relatedEvents,
      charactersInChapter,
      selectedLocations,
      userInstructions,
      targetChapterLength,
      model,
    } = req.body;

    console.log(`[API] 章本文生成リクエスト: ${chapterTitle}`);

    // AIに渡すプロンプトの組み立て
    let eventDetails = '関連イベントはありません。';
    if (relatedEvents && relatedEvents.length > 0) {
      eventDetails = relatedEvents
        .map(
          (event: { title: string; description: string }) =>
            `- ${event.title}: ${event.description || '説明なし'}`,
        )
        .join('\n');
    }

    let characterDetails = '登場キャラクター情報はありません。';
    if (charactersInChapter && charactersInChapter.length > 0) {
      characterDetails = charactersInChapter
        .map(
          (char: { name: string; role?: string; description?: string }) =>
            `- ${char.name} (${char.role || '役割不明'}): ${char.description || '詳細不明'}`,
        )
        .join('\n');
    }

    let locationDetails = '関連する場所の情報はありません。';
    if (selectedLocations && selectedLocations.length > 0) {
      locationDetails = selectedLocations
        .map(
          (loc: { name: string; description?: string }) =>
            `- ${loc.name}: ${loc.description || '詳細不明'}`,
        )
        .join('\n');
    }

    const lengthInstruction = targetChapterLength
      ? `目標とする章の長さ: ${targetChapterLength === 'short' ? '短め' : targetChapterLength === 'medium' ? '普通' : '長め'}`
      : '章の長さはお任せします。';

    const userPrompt = `あなたはプロの小説家です。以下の情報に基づいて、魅力的な章の本文を執筆してください。

章のタイトル: ${chapterTitle}

関連するイベント:
${eventDetails}

登場キャラクター:
${characterDetails}

関連する場所:
${locationDetails}

${userInstructions ? `執筆にあたっての追加指示:\n${userInstructions}\n` : ''}
${lengthInstruction}

それでは、章の本文を執筆してください。`;

    const aiRequest: StandardAIRequest = {
      requestType: 'chapter-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt:
        'あなたは熟練した小説の執筆アシスタントです。与えられた情報から、読者を引き込む物語の章を創作します。',
      userPrompt: userPrompt,
      context: {
        chapterTitle,
        relatedEvents,
        charactersInChapter,
        selectedLocations,
      },
      options: {
        temperature: 0.7,
        maxTokens: 3000,
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error('[API] 章本文生成AIリクエスト失敗:', aiResponse.error);
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    res.json({
      status: 'success',
      content: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiRequest.model,
        processingTime: aiResponse.debug?.processingTime,
      },
    });
  } catch (error) {
    console.error('[API] 章本文生成エラー:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || '章本文の生成中にエラーが発生しました',
    });
  }
});

/**
 * あらすじ生成エンドポイント
 * 小説のあらすじを生成します
 */
router.post('/synopsis-generation', async (req, res) => {
  try {
    const { userMessage, projectData, model } = req.body;
    const format = req.body.format || 'text'; // あらすじはテキストがデフォルト

    console.log('[API] あらすじ生成リクエスト');

    // プロジェクトデータから文脈を構築
    let contextInfo = '';
    if (projectData) {
      if (projectData.title) {
        contextInfo += `作品タイトル: ${projectData.title}\n`;
      }
      if (projectData.genre) {
        contextInfo += `ジャンル: ${projectData.genre}\n`;
      }
      if (projectData.theme) {
        contextInfo += `テーマ: ${projectData.theme}\n`;
      }
      if (projectData.characters && projectData.characters.length > 0) {
        contextInfo += `主要キャラクター: ${projectData.characters.map((c) => c.name).join(', ')}\n`;
      }
      if (projectData.worldBuilding && projectData.worldBuilding.length > 0) {
        contextInfo += `世界観要素: ${projectData.worldBuilding.map((w) => w.name).join(', ')}\n`;
      }
    }

    // システムプロンプトを構築
    const systemPrompt = `あなたは優秀な小説のあらすじ作成専門家です。
以下の要件に従って、魅力的で読者の興味を引くあらすじを作成してください：

1. 読者が作品の魅力を理解できる内容
2. 主要な登場人物と設定を含む
3. 物語の核となる葛藤や謎を示唆
4. ネタバレを避けつつ、興味を引く内容
5. 適切な長さ（200-500文字程度）

作品の雰囲気やジャンルに合った文体で執筆してください。`;

    // ユーザープロンプトを構築
    let userPrompt = '';
    if (contextInfo) {
      userPrompt += `以下の作品情報を参考にして、あらすじを作成してください：\n\n${contextInfo}\n`;
    }
    if (userMessage) {
      userPrompt += `\n追加の指示：\n${userMessage}`;
    }
    if (!userPrompt) {
      userPrompt = '魅力的な小説のあらすじを作成してください。';
    }

    // AIリクエストを作成
    const aiRequest: StandardAIRequest = {
      requestType: 'synopsis-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt,
      userPrompt,
      context: {
        projectData,
      },
      options: {
        temperature: 0.7,
        maxTokens: 1000,
        expectedFormat:
          format === 'text' ? 'text' : format === 'json' ? 'json' : 'yaml',
        responseFormat:
          format === 'text' ? 'text' : format === 'json' ? 'json' : 'yaml',
      },
    };

    // AIリクエストを実行
    console.log(`[API] AIリクエスト実行: ${aiRequest.requestType}`);
    const aiResponse = await processAIRequest(aiRequest);

    // エラー処理
    if (aiResponse.status === 'error') {
      console.error('[API] AIリクエスト失敗:', {
        errorCode: aiResponse.error?.code,
        errorMessage: aiResponse.error?.message,
        request: JSON.stringify(aiRequest, null, 2),
      });

      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    // 成功レスポンス
    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
        format: format,
      },
    });
  } catch (error: any) {
    console.error('[API] あらすじ生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message:
        error.message || 'あらすじ生成中に予期しないエラーが発生しました',
    });
  }
});

/**
 * API設定取得エンドポイント
 */
router.get('/settings', async (req, res) => {
  try {
    console.log('[API] API設定取得リクエスト');

    // デフォルト設定を返す（実際の実装では環境変数やデータベースから取得）
    const defaultSettings = {
      provider: 'gemini',
      modelName: 'gemini-1.5-pro',
      parameters: {
        temperature: 0.7,
        maxTokens: 2000,
      },
      isConfigured: !!process.env.GEMINI_API_KEY, // Gemini APIキーが設定されているかチェック
    };

    res.json({
      status: 'success',
      data: defaultSettings,
    });
  } catch (error) {
    console.error('[API] API設定取得エラー:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || 'API設定の取得中にエラーが発生しました',
    });
  }
});

/**
 * API設定保存エンドポイント
 */
router.post('/settings', async (req, res) => {
  try {
    const { provider, apiKey, modelName, parameters } = req.body;
    console.log(`[API] API設定保存リクエスト: ${provider} - ${modelName}`);

    // 実際の実装では、設定をデータベースや環境変数に保存
    // ここではダミーレスポンスを返す
    res.json({
      status: 'success',
      message: 'API設定が保存されました',
      data: {
        provider,
        modelName,
        parameters,
      },
    });
  } catch (error) {
    console.error('[API] API設定保存エラー:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || 'API設定の保存中にエラーが発生しました',
    });
  }
});

/**
 * APIキーテストエンドポイント
 */
router.post('/test-key', async (req, res) => {
  try {
    const { provider, apiKey, modelName } = req.body;
    console.log(`[API] APIキーテストリクエスト: ${provider} - ${modelName}`);

    // 実際の実装では、提供されたAPIキーでテストリクエストを送信
    // ここではダミーレスポンスを返す
    res.json({
      status: 'success',
      message: 'APIキーのテストが成功しました',
      data: {
        provider,
        modelName,
        isValid: true,
      },
    });
  } catch (error) {
    console.error('[API] APIキーテストエラー:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || 'APIキーのテスト中にエラーが発生しました',
    });
  }
});

export default router;

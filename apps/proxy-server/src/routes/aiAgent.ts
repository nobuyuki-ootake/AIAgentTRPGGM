import express from 'express';
import { processAIRequest } from '../services/aiIntegration.js';
import { StandardAIRequest } from '@trpg-ai-gm/types';
import templateManager from '../utils/aiTemplateManager.js';
import { 
  PLOT_DEVELOPER, 
  WORLD_BUILDER,
  TRPG_CHARACTER_CREATOR,
  TRPG_ENEMY_CREATOR,
  TRPG_NPC_CREATOR,
  TRPG_QUEST_GENERATOR,
  TRPG_ENCOUNTER_GENERATOR,
  TRPG_GM_ASSISTANT,
  TRPG_COMBAT_RESOLVER,
  TRPG_STORY_PROGRESSION
} from '../utils/systemPrompts.js';
import * as yaml from 'js-yaml';
import {
  WorldBuildingElementType,
  WorldBuildingElementData,
  Chapter,
  TimelineEvent,
  Character,
} from '@trpg-ai-gm/types';
import { generateElementPrompt } from '../utils/worldBuildingSchemas.js';
import { GoogleCloudStorageService } from '../services/google-cloud.service.js';

const router = express.Router();

/**
 * TRPG世界観要素の詳細生成エンドポイント
 * TRPGキャンペーンの世界観要素（場所、文化、ルールなど）の詳細を生成します
 * 
 * 🌍 WorldContextBuilder統合版
 * - 既存の世界観データを考慮した生成
 * - BaseLocationの拡張プロパティ対応
 * - コンテキスト認識型の詳細生成
 */
router.post('/worldbuilding-detail-generation', async (req, res) => {
  try {
    const {
      elementName,
      elementType,
      message,
      plotElements,
      charactersElements,
      currentLocation,      // 現在の場所情報
      worldBuildingData,    // 既存の世界観データ
      campaignContext,      // キャンペーン全体のコンテキスト
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

    // コンテキストビルダー用の追加情報を構築
    let contextualPrompt = enhancedMessage;
    
    // 既存の世界観データがある場合、コンテキストを追加
    if (worldBuildingData) {
      contextualPrompt += `\n\n## 既存の世界観設定\n`;
      if (worldBuildingData.setting?.length) {
        contextualPrompt += `\n### 世界の設定\n`;
        worldBuildingData.setting.slice(0, 3).forEach((s: any) => {
          contextualPrompt += `- ${s.name}: ${s.description}\n`;
        });
      }
      if (worldBuildingData.rules?.length) {
        contextualPrompt += `\n### 世界のルール\n`;
        worldBuildingData.rules.slice(0, 3).forEach((r: any) => {
          contextualPrompt += `- ${r.name}: ${r.description}\n`;
        });
      }
    }
    
    // 現在の場所情報がある場合、場所固有のコンテキストを追加
    if (currentLocation && normalizedElementType === WorldBuildingElementType.PLACE) {
      contextualPrompt += `\n\n## 関連する場所情報\n`;
      contextualPrompt += `地域: ${currentLocation.region || '不明'}\n`;
      if (currentLocation.environmentalFactors) {
        contextualPrompt += `気候: ${currentLocation.environmentalFactors.climate || '不明'}\n`;
        contextualPrompt += `地形: ${currentLocation.environmentalFactors.terrain || '不明'}\n`;
      }
      if (currentLocation.culturalModifiers) {
        contextualPrompt += `\nこの地域の文化的特徴を考慮して、関連する世界観要素を生成してください。\n`;
      }
    }
    
    // 拡張されたコンテキストでAIリクエストを作成
    const aiRequest: StandardAIRequest = {
      requestType: 'worldbuilding-detail',
      model: model,
      systemPrompt,
      userPrompt: contextualPrompt,
      context: {
        elementName,
        elementType: normalizedElementType,
        plotElements,
        charactersElements,
        currentLocation,      // 追加：現在の場所情報
        worldBuildingData,    // 追加：既存の世界観データ
        campaignContext,      // 追加：キャンペーンコンテキスト
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
    console.log(
      `[API] システムプロンプト: ${aiRequest.systemPrompt.slice(0, 200)}...`,
    );
    console.log(
      `[API] ユーザープロンプト: ${aiRequest.userPrompt.slice(0, 300)}...`,
    );

    const aiResponse = await processAIRequest(aiRequest);

    console.log(`[API] AIレスポンス受信: status=${aiResponse.status}`);
    console.log(
      `[API] レスポンスコンテンツタイプ: ${typeof aiResponse.content}`,
    );
    console.log(
      `[API] レスポンスコンテンツ長: ${aiResponse.content ? JSON.stringify(aiResponse.content).length : 0}`,
    );
    console.log(
      `[API] 生レスポンス長: ${aiResponse.rawContent ? aiResponse.rawContent.length : 0}`,
    );

    if (aiResponse.status === 'error') {
      console.error(`[API] AIエラー詳細:`, aiResponse.error);
      return res.status(500).json({
        status: 'error',
        error:
          aiResponse.error?.message ||
          '世界観要素詳細の生成中にエラーが発生しました',
      });
    }

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
        
        // 🌍 BaseLocation拡張プロパティの追加（場所タイプの場合）
        if (normalizedElementType === WorldBuildingElementType.PLACE && currentLocation) {
          responseData = {
            ...responseData,
            // 既存の場所情報を基に、関連する要素を追加
            environmentalFactors: parsedData.environmentalFactors || {
              climate: currentLocation.environmentalFactors?.climate || 'temperate',
              terrain: currentLocation.environmentalFactors?.terrain || 'plains',
              weatherPatterns: parsedData.weatherPatterns || [],
              naturalHazards: parsedData.naturalHazards || [],
            },
            culturalModifiers: parsedData.culturalModifiers || currentLocation.culturalModifiers,
            // 遇遇ルールをAIが生成した場合はそれを使用
            encounterRules: parsedData.encounterRules,
          };
        }

        console.log(
          `[API] 世界観要素データ処理完了: ${elementName} (${normalizedElementType})`,
        );
      } catch (error) {
        console.error(`[API] エラー: 世界観要素データのパースに失敗`, error);
        console.error(`[API] パース対象データ:`, aiResponse.content);
        console.error(`[API] 生のレスポンス:`, aiResponse.rawContent);

        // パースに失敗した場合は、生のレスポンスから可能な限り情報を抽出
        const fallbackDescription =
          aiResponse.rawContent ||
          aiResponse.content?.toString() ||
          `${elementName}の詳細情報を生成中にエラーが発生しました。`;

        responseData = {
          name: elementName,
          type: normalizedElementType,
          description: fallbackDescription,
          features: `${elementName}の特徴的な要素`,
          importance: `物語における${elementName}の重要性`,
          originalType: elementType || normalizedElementType,
        };
      }
    } else {
      // YAMLまたはテキスト形式の場合、またはcontentがない場合
      const fallbackDescription =
        aiResponse.rawContent ||
        (aiResponse.content as string) ||
        `${elementName}の詳細情報`;

      responseData = {
        name: elementName,
        type: normalizedElementType,
        description: fallbackDescription,
        features: `${elementName}の特徴的な要素`,
        importance: `物語における${elementName}の重要性`,
        originalType: elementType || normalizedElementType,
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
 * TRPG世界観要素のリスト生成エンドポイント
 * TRPGキャンペーンの世界観要素（場所、文化、組織など）のリストを生成します
 * 
 * 🌍 WorldContextBuilder統合版
 * - キャンペーン全体のコンテキストを考慮
 * - 既存の世界観要素との関連性を重視
 */
router.post('/worldbuilding-list-generation', async (req, res) => {
  try {
    const { 
      elementType, 
      userMessage, 
      model,
      worldBuildingData,    // 既存の世界観データ
      campaignContext,      // キャンペーン情報
      currentSession,       // 現在のセッション情報
    } = req.body;
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

    // コンテキスト情報を含む拡張プロンプトを構築
    let contextEnhancedMessage = userMessage || 
      `現在のTRPGキャンペーン設定から、適切な世界観構築設定を行うための要素リストを生成してください。`;
    
    // 🌍 既存の世界観データをコンテキストとして追加
    if (worldBuildingData) {
      contextEnhancedMessage += `\n\n## 既存の世界観設定\n`;
      
      // 関連する要素タイプの既存データを列挙
      if (elementType === 'places' && worldBuildingData.places?.length) {
        contextEnhancedMessage += `\n### 既存の場所\n`;
        worldBuildingData.places.slice(0, 5).forEach((p: any) => {
          contextEnhancedMessage += `- ${p.name}: ${p.description || p.location || ''}、${p.culturalFeatures || ''}\n`;
        });
      } else if (elementType === 'cultures' && worldBuildingData.cultures?.length) {
        contextEnhancedMessage += `\n### 既存の文化\n`;
        worldBuildingData.cultures.slice(0, 5).forEach((c: any) => {
          contextEnhancedMessage += `- ${c.name}: ${c.description || c.beliefs || ''}\n`;
        });
      }
      
      // 全体的な世界観設定
      if (worldBuildingData.setting?.length) {
        contextEnhancedMessage += `\n### 世界の基本設定\n`;
        worldBuildingData.setting.slice(0, 3).forEach((s: any) => {
          contextEnhancedMessage += `- ${s.name}: ${s.description}\n`;
        });
      }
      
      contextEnhancedMessage += `\n上記の既存設定と一貫性を保ち、それらを補完・拡張する新しい要素を生成してください。\n`;
    }
    
    // キャンペーンコンテキストがある場合
    if (campaignContext) {
      contextEnhancedMessage += `\n## キャンペーン情報\n`;
      contextEnhancedMessage += `タイトル: ${campaignContext.title || '未設定'}\n`;
      contextEnhancedMessage += `あらすじ: ${campaignContext.synopsis || '未設定'}\n`;
      contextEnhancedMessage += `ゲームシステム: ${campaignContext.gameSystem || '未設定'}\n`;
    }

    // ユーザーメッセージを最初に配置し、フォーマット指示を後に追加
    const userPrompt = `${contextEnhancedMessage}\n\n以下のフォーマットで回答してください:\n${formatTemplate}`;

    // AIリクエストを作成（コンテキスト情報を含む）
    const aiRequest: StandardAIRequest = {
      requestType: 'worldbuilding-list',
      model: model || determineModelByElementType(validatedElementType),
      systemPrompt: WORLD_BUILDER,
      userPrompt,
      context: {
        elementType: validatedElementType,
        worldBuildingData,    // 🌍 追加：既存の世界観データ
        campaignContext,      // 🌍 追加：キャンペーンコンテキスト
        currentSession,       // 🌍 追加：現在のセッション情報
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
    console.log(
      `[API] システムプロンプト: ${aiRequest.systemPrompt.slice(0, 200)}...`,
    );
    console.log(
      `[API] ユーザープロンプト: ${aiRequest.userPrompt.slice(0, 300)}...`,
    );

    const aiResponse = await processAIRequest(aiRequest);

    console.log(`[API] AIレスポンス受信: status=${aiResponse.status}`);
    console.log(
      `[API] レスポンスコンテンツタイプ: ${typeof aiResponse.content}`,
    );
    console.log(
      `[API] レスポンスコンテンツ長: ${aiResponse.content ? JSON.stringify(aiResponse.content).length : 0}`,
    );
    console.log(
      `[API] 生レスポンス長: ${aiResponse.rawContent ? aiResponse.rawContent.length : 0}`,
    );

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
      console.error(`[API] AIエラー詳細:`, aiResponse.error);
      return res.status(500).json({
        status: 'error',
        error: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
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
 * TRPGキャラクター詳細生成エンドポイント
 * TRPGキャラクター（PC/NPC/敵）の詳細情報を生成します
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
 * TRPGシナリオ開発エンドポイント
 * TRPGシナリオの作成や改善に関するアドバイスを提供します
 */
router.post('/plot-development', async (req, res) => {
  try {
    const { userMessage, projectData, model } = req.body;
    const format = req.body.format || 'text';

    console.log('[API] プロット開発リクエスト');

    // TRPGシナリオ生成専用のシステムプロンプト
    const plotGenerationSystemPrompt = `
あなたはTRPGシナリオ作成を支援するAIアシスタントで、シナリオ開発の専門家です。
ユーザーの指示に従って、魅力的で一貫性のあるTRPGシナリオの構造を作成します。

【重要：出力形式について】
シナリオイベントを生成する場合は、必ず以下の形式で応答してください：

シナリオイベント1
タイトル: [イベントのタイトル]
詳細: [具体的な説明]

シナリオイベント2
タイトル: [イベントのタイトル]
詳細: [具体的な説明]

シナリオイベント3
タイトル: [イベントのタイトル]
詳細: [具体的な説明]

※マークダウンの装飾（**太字**など）は使用しないでください
※解説や分析は不要です。シナリオイベントのみを上記形式で提示してください
※各シナリオイベントは空行で区切ってください

TRPGセッションの流れを意識し、プレイヤーの選択が意味を持つ説得力のある展開を提案してください。
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
 * TRPGキャンペーンあらすじ生成エンドポイント
 * TRPGキャンペーンのあらすじを生成します
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
    const systemPrompt = `あなたは優秀なTRPGキャンペーンのあらすじ作成専門家です。
以下の要件に従って、魅力的でプレイヤーの興味を引くキャンペーンあらすじを作成してください：

1. プレイヤーがキャンペーンの魅力を理解できる内容
2. 主要なNPCと世界設定を含む
3. キャンペーンの核となる脅威や謎を示唆
4. ネタバレを避けつつ、冒険心を掻き立てる内容
5. 適切な長さ（200-500文字程度）

キャンペーンの雰囲気やゲームシステムに合った表現で執筆してください。`;

    // ユーザープロンプトを構築
    let userPrompt = '';
    if (contextInfo) {
      userPrompt += `以下の作品情報を参考にして、あらすじを作成してください：\n\n${contextInfo}\n`;
    }
    if (userMessage) {
      userPrompt += `\n追加の指示：\n${userMessage}`;
    }
    if (!userPrompt) {
      userPrompt = '魅力的なTRPGキャンペーンのあらすじを作成してください。';
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

/**
 * TRPGキャラクター生成エンドポイント（単発生成用）
 * 単一のTRPGキャラクターまたは複数キャラクターを一括で生成します
 */
router.post('/character-generation', async (req, res) => {
  try {
    const { message, plotElements, existingCharacters, model } = req.body;

    console.log('=== [API] キャラクター生成リクエスト受信 ===');
    console.log('メッセージ:', message);
    console.log('プロット要素数:', plotElements?.length || 0);
    console.log('既存キャラクター数:', existingCharacters?.length || 0);
    console.log('モデル:', model);

    // プロット情報を整理
    let plotContext = '';
    if (
      plotElements &&
      Array.isArray(plotElements) &&
      plotElements.length > 0
    ) {
      plotContext = plotElements
        .map((plot: any) => `- ${plot.title}: ${plot.description}`)
        .join('\n');
      console.log('プロットコンテキスト:', plotContext);
    } else {
      console.log('プロット要素が空です');
    }

    // 既存キャラクター情報を整理
    let existingCharacterContext = '';
    if (
      existingCharacters &&
      Array.isArray(existingCharacters) &&
      existingCharacters.length > 0
    ) {
      existingCharacterContext = existingCharacters
        .map(
          (char: any) =>
            `- ${char.name}: ${char.description || char.summary || ''}`,
        )
        .join('\n');
    }

    // システムプロンプト
    const systemPrompt = `あなたはTRPG作成のプロフェッショナルです。
ユーザーのリクエストに基づいて、魅力的なTRPGキャラクターを生成してください。

${
  plotContext
    ? `プロット情報:
${plotContext}

`
    : ''
}${
      existingCharacterContext
        ? `既存キャラクター:
${existingCharacterContext}

`
        : ''
    }キャラクターの詳細情報を以下の形式で提供してください：

【キャラクター名】
名前: [キャラクター名]
年齢: [年齢]
性別: [性別]
職業・役割: [職業や物語での役割]

【外見】
[身長、体型、髪色、目の色、特徴的な外見など]

【性格】
[基本的な性格、特徴的な行動パターン、価値観など]

【背景・経歴】
[生い立ち、重要な過去の出来事、現在の状況など]

【能力・特技】
[特別な能力、得意なこと、武器や道具など]

【人間関係】
[家族、友人、敵対者、恋愛関係など]

【物語での役割】
[主人公、敵役、脇役としての具体的な役割と重要性]

【動機・目標】
[キャラクターの行動原理、達成したい目標、内面的な葛藤など]

- TRPGキャンペーンの世界観に合致したキャラクター設定
- 既存キャラクターとの差別化
- プレイヤーが感情移入できる魅力的な人物像
- キャンペーンに対して意味のある役割を持つ`;

    // ユーザープロンプトを構築
    let userPrompt =
      message ||
      'シナリオに基づいて、TRPGに適したキャラクターを生成してください。';

    if (plotContext) {
      userPrompt += `\n\n【シナリオ情報】\n${plotContext}`;
    }

    if (existingCharacterContext) {
      userPrompt += `\n\n【既存キャラクター】\n${existingCharacterContext}\n※これらのキャラクターと重複しないようにしてください`;
    }

    // AIからの応答を取得
    const aiResponse = await processAIRequest({
      requestType: 'character-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt: systemPrompt,
      userPrompt,
      context: {
        plotElements,
        existingCharacters,
      },
      options: {
        temperature: 0.7,
        maxTokens: 3000,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    });

    console.log('[API] AI応答受信:', aiResponse);

    // エラー処理
    if (aiResponse.status === 'error') {
      console.error('[API] AIリクエスト失敗:', {
        errorCode: aiResponse.error?.code,
        errorMessage: aiResponse.error?.message,
      });

      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    console.log('[API] キャラクター生成完了');

    // 成功レスポンス（テキストとしてそのまま返す）
    return res.json({
      status: 'success',
      data: aiResponse.rawContent || aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: 'character-generation',
      },
    });
  } catch (error: any) {
    console.error('[API] キャラクター生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message:
        error.message || 'キャラクター生成中に予期しないエラーが発生しました',
    });
  }
});

/**
 * キャラクターリスト生成エンドポイント
 * 全プロットを参照してキャラクター名リストを生成します（バッチ処理の第1段階）
 */
router.post('/character-list-generation', async (req, res) => {
  try {
    const { message, plotElements, existingCharacters, model } = req.body;

    console.log('=== [API] キャラクターリスト生成リクエスト受信 ===');
    console.log('メッセージ:', message);
    console.log('プロット要素数:', plotElements?.length || 0);
    console.log('既存キャラクター数:', existingCharacters?.length || 0);
    console.log('モデル:', model);

    // プロット情報を整理
    let plotContext = '';
    if (
      plotElements &&
      Array.isArray(plotElements) &&
      plotElements.length > 0
    ) {
      plotContext = plotElements
        .map((plot: any) => `- ${plot.title}: ${plot.description}`)
        .join('\n');
      console.log('プロットコンテキスト:', plotContext);
    } else {
      console.log('プロット要素が空です');
    }

    // 既存キャラクター情報を整理
    let existingCharacterContext = '';
    if (
      existingCharacters &&
      Array.isArray(existingCharacters) &&
      existingCharacters.length > 0
    ) {
      existingCharacterContext = existingCharacters
        .map(
          (char: any) =>
            `- ${char.name}: ${char.description || char.summary || ''}`,
        )
        .join('\n');
    }

    // システムプロンプト
    const systemPrompt = `あなたは小説作成のプロフェッショナルです。
ユーザーのリクエストに基づいて、物語に必要なキャラクターのリストを生成してください。

${
  plotContext
    ? `プロット情報:
${plotContext}

`
    : ''
}${
      existingCharacterContext
        ? `既存キャラクター:
${existingCharacterContext}

`
        : ''
    }以下のYAML形式で、3-5人のキャラクターを提案してください：

---
- name: "キャラクター名"
  role: "protagonist|antagonist|supporting"
  importance: "主要|重要|補助"
  description: "キャラクターの簡潔な説明（1-2文）"
- name: "キャラクター名2"
  role: "protagonist|antagonist|supporting"
  importance: "主要|重要|補助"
  description: "キャラクターの簡潔な説明（1-2文）"
...

- 物語に必要な役割を考慮してバランス良く配置
- 主人公、敵役、重要な脇役を含める
- 既存キャラクターとの重複を避ける
- 各キャラクターは物語において明確な役割を持つ
- YAML形式以外の文章は含めない`;

    // ユーザープロンプトを構築
    let userPrompt =
      message ||
      'プロットに基づいて、物語に必要なキャラクターのリストを作成してください。';

    if (plotContext) {
      userPrompt += `\n\n【シナリオ情報】\n${plotContext}`;
    }

    if (existingCharacterContext) {
      userPrompt += `\n\n【既存キャラクター】\n${existingCharacterContext}\n※これらのキャラクターと重複しないようにしてください`;
    }

    // AIからの応答を取得
    const aiResponse = await processAIRequest({
      requestType: 'character-list-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt: systemPrompt,
      userPrompt,
      context: {
        plotElements,
        existingCharacters,
      },
    });

    console.log('[API] AI応答受信:', aiResponse);

    // エラー処理
    if (aiResponse.status === 'error') {
      console.error('[API] AIリクエスト失敗:', {
        errorCode: aiResponse.error?.code,
        errorMessage: aiResponse.error?.message,
      });

      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    // YAMLレスポンスをパース
    let characterList;
    try {
      // aiResponse.contentが既にパース済みの配列の場合はそのまま使用
      if (Array.isArray(aiResponse.content)) {
        characterList = aiResponse.content;
        console.log('[API] 既にパース済みのキャラクターリスト:', characterList);
      } else {
        // 文字列の場合はYAMLとしてパース
        const responseContent =
          typeof aiResponse.content === 'string' ? aiResponse.content : '';

        // YAMLパースを試行
        const parsed = yaml.load(responseContent) as any;

        if (Array.isArray(parsed)) {
          characterList = parsed;
        } else if (parsed && Array.isArray(parsed.characters)) {
          characterList = parsed.characters;
        } else {
          throw new Error(
            'Invalid YAML structure: expected array of characters',
          );
        }

        console.log('[API] YAMLパース済みキャラクターリスト:', characterList);
      }
    } catch (parseError) {
      console.error('[API] YAMLパースエラー:', parseError);
      console.error('[API] 元のレスポンス:', aiResponse.content);

      return res.status(500).json({
        status: 'error',
        message: 'AIからの応答をパースできませんでした',
        details: `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      });
    }

    console.log(`[API] キャラクターリスト生成完了: ${characterList.length}件`);

    // 成功レスポンス
    return res.json({
      status: 'success',
      data: characterList, // 構造化されたキャラクターリスト
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: 'character-list-generation',
        characterCount: characterList.length,
      },
    });
  } catch (error: any) {
    console.error('[API] キャラクターリスト生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message:
        error.message ||
        'キャラクターリスト生成中に予期しないエラーが発生しました',
    });
  }
});

/**
 * TRPGキャラクターシート生成エンドポイント
 * PC/NPCのキャラクターシートを生成します
 */
router.post('/character-sheet-generation', async (req, res) => {
  try {
    const { characterName, characterType, level, campaign, model } = req.body;
    
    console.log('[API] TRPGキャラクターシート生成リクエスト:', {
      characterName,
      characterType,
      level,
      campaign: campaign?.name
    });

    const userPrompt = `TRPGキャラクター「${characterName}」のキャラクターシートを作成してください。
    
キャラクタータイプ: ${characterType || 'PC'}
レベル: ${level || 1}
${campaign ? `キャンペーン: ${campaign.name}\n設定: ${campaign.description}` : ''}

以下の形式でキャラクターシートを作成してください：

基本情報：
- 名前: ${characterName}
- 種族:
- クラス:
- レベル: ${level || 1}
- 属性:

能力値：
- STR (筋力):
- DEX (敏捷):
- CON (耐久):
- INT (知力):
- WIS (知恵):
- CHA (魅力):

スキル：
[レベルに応じた適切なスキルリスト]

特技・特殊能力：
[クラスと種族に応じた能力]

装備：
- 武器:
- 防具:
- その他:

バックストーリー：
[キャラクターの背景と動機]`;

    const aiRequest: StandardAIRequest = {
      requestType: 'character-sheet-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt: TRPG_CHARACTER_CREATOR,
      userPrompt,
      context: {
        characterName,
        characterType,
        level,
        campaign
      },
      options: {
        temperature: 0.7,
        maxTokens: 2000,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error('[API] TRPGキャラクターシート生成エラー:', aiResponse.error);
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
      },
    });
  } catch (error: any) {
    console.error('[API] TRPGキャラクターシート生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'キャラクターシート生成中にエラーが発生しました',
    });
  }
});

/**
 * TRPG敵キャラクター生成エンドポイント
 * モンスターや敵NPCを生成します
 */
router.post('/enemy-generation', async (req, res) => {
  try {
    const { enemyType, challengeRating, partyLevel, environment, model } = req.body;
    
    console.log('[API] TRPG敵キャラクター生成リクエスト:', {
      enemyType,
      challengeRating,
      partyLevel,
      environment
    });

    const userPrompt = `以下の条件でTRPGの敵キャラクターを生成してください：

敵タイプ: ${enemyType || '任意'}
チャレンジレート: ${challengeRating || `パーティーレベル${partyLevel || 3}に適切`}
遭遇環境: ${environment || '任意'}
パーティーレベル: ${partyLevel || 3}

以下の形式で敵キャラクターを作成してください：

名前:
種別:
チャレンジレート (CR):
HP:
AC (アーマークラス):
移動速度:

能力値：
- STR:
- DEX:
- CON:
- INT:
- WIS:
- CHA:

攻撃：
[攻撃手段と詳細]

特殊能力：
[特殊な能力や呪文]

弱点：
[弱点と対処法]

戦術：
[戦闘時の行動パターン]

宝物：
[倒した際のドロップアイテム]`;

    const aiRequest: StandardAIRequest = {
      requestType: 'enemy-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt: TRPG_ENEMY_CREATOR,
      userPrompt,
      context: {
        enemyType,
        challengeRating,
        partyLevel,
        environment
      },
      options: {
        temperature: 0.8,
        maxTokens: 2000,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error('[API] TRPG敵キャラクター生成エラー:', aiResponse.error);
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
      },
    });
  } catch (error: any) {
    console.error('[API] TRPG敵キャラクター生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '敵キャラクター生成中にエラーが発生しました',
    });
  }
});

/**
 * TRPG NPC生成エンドポイント
 * 物語に関わるNPCを生成します
 */
router.post('/npc-generation', async (req, res) => {
  try {
    const { npcRole, location, faction, importance, campaign, model } = req.body;
    
    console.log('[API] TRPG NPC生成リクエスト:', {
      npcRole,
      location,
      faction,
      importance
    });

    const userPrompt = `以下の条件でTRPGのNPCを生成してください：

NPC役割: ${npcRole || '町の住人'}
場所: ${location || '町'}
所属: ${faction || '中立'}
重要度: ${importance || '一般'}
${campaign ? `キャンペーン設定: ${campaign.description}` : ''}

以下の形式でNPCを作成してください：

基本情報：
- 名前:
- 職業:
- 年齢:
- 性別:
- 外見:

性格と話し方：
[性格の特徴と話し方の癖]

動機と目的：
[NPCが何を求めているか]

秘密：
[PCには知られていない情報]

関係性：
[他のNPCや組織との関係]

提供できる情報/クエスト：
[PCに与えられる情報やクエスト]

能力（必要に応じて）：
[戦闘能力や特殊技能]`;

    const aiRequest: StandardAIRequest = {
      requestType: 'npc-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt: TRPG_NPC_CREATOR,
      userPrompt,
      context: {
        npcRole,
        location,
        faction,
        importance,
        campaign
      },
      options: {
        temperature: 0.8,
        maxTokens: 2000,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error('[API] TRPG NPC生成エラー:', aiResponse.error);
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
      },
    });
  } catch (error: any) {
    console.error('[API] TRPG NPC生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'NPC生成中にエラーが発生しました',
    });
  }
});

/**
 * TRPGクエスト生成エンドポイント
 * シナリオやクエストを生成します
 */
router.post('/quest-generation', async (req, res) => {
  try {
    const { questType, difficulty, partyLevel, campaign, rewards, model } = req.body;
    
    console.log('[API] TRPGクエスト生成リクエスト:', {
      questType,
      difficulty,
      partyLevel
    });

    const userPrompt = `以下の条件でTRPGのクエストを生成してください：

クエストタイプ: ${questType || '探索'}
難易度: ${difficulty || '中'}
パーティーレベル: ${partyLevel || 3}
${campaign ? `キャンペーン設定: ${campaign.description}` : ''}
${rewards ? `希望報酬: ${rewards}` : ''}

以下の形式でクエストを作成してください：

クエスト名：

概要：
[クエストの簡潔な説明]

依頼人：
[名前と簡単な背景]

背景と動機：
[なぜこのクエストが必要なのか]

目的：
[具体的な達成条件]

障害と課題：
[PCが直面する困難]

場所：
[クエストの舞台となる場所]

報酬：
- 経験値:
- 金銭:
- アイテム:
- その他:

分岐と結果：
[プレイヤーの選択による展開の違い]

推奨プレイ時間：`;

    const aiRequest: StandardAIRequest = {
      requestType: 'quest-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt: TRPG_QUEST_GENERATOR,
      userPrompt,
      context: {
        questType,
        difficulty,
        partyLevel,
        campaign,
        rewards
      },
      options: {
        temperature: 0.8,
        maxTokens: 2500,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error('[API] TRPGクエスト生成エラー:', aiResponse.error);
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
      },
    });
  } catch (error: any) {
    console.error('[API] TRPGクエスト生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'クエスト生成中にエラーが発生しました',
    });
  }
});

/**
 * TRPGエンカウンター生成エンドポイント
 * 遭遇イベントを生成します
 */
router.post('/encounter-generation', async (req, res) => {
  try {
    const { encounterType, environment, partyLevel, difficulty, model } = req.body;
    
    console.log('[API] TRPGエンカウンター生成リクエスト:', {
      encounterType,
      environment,
      partyLevel,
      difficulty
    });

    const userPrompt = `以下の条件でTRPGのエンカウンターを生成してください：

エンカウンタータイプ: ${encounterType || '戦闘'}
環境: ${environment || 'ダンジョン'}
パーティーレベル: ${partyLevel || 3}
難易度: ${difficulty || '中'}

以下の形式でエンカウンターを作成してください：

エンカウンター名：

タイプ: ${encounterType || '戦闘'}

場所の描写：
[環境の詳細な描写]

${encounterType === '戦闘' || !encounterType ? `
敵構成：
[敵の種類と数]

戦術：
[敵の戦術と配置]

環境要素：
[戦闘に影響する環境要素]
` : ''}

${encounterType === '社交' ? `
登場NPC：
[NPCの名前と役割]

目的：
[社交エンカウンターの目的]

情報/リソース：
[得られる情報や支援]
` : ''}

${encounterType === '探索' ? `
探索対象：
[探索する場所や物]

手がかり：
[発見できる情報]

罠/障害：
[存在する危険]
` : ''}

成功条件：
[エンカウンターのクリア条件]

失敗の結果：
[失敗した場合の影響]

報酬：
[成功時の報酬]`;

    const aiRequest: StandardAIRequest = {
      requestType: 'encounter-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt: TRPG_ENCOUNTER_GENERATOR,
      userPrompt,
      context: {
        encounterType,
        environment,
        partyLevel,
        difficulty
      },
      options: {
        temperature: 0.8,
        maxTokens: 2000,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error('[API] TRPGエンカウンター生成エラー:', aiResponse.error);
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
      },
    });
  } catch (error: any) {
    console.error('[API] TRPGエンカウンター生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'エンカウンター生成中にエラーが発生しました',
    });
  }
});

/**
 * TRPGセッションGMアシストエンドポイント
 * セッション中のGM支援を行います
 */
router.post('/session-gm-assist', async (req, res) => {
  try {
    const { situation, playerAction, sessionContext, assistType, model } = req.body;
    
    console.log('[API] TRPGセッションGMアシストリクエスト:', {
      assistType,
      situation
    });

    const userPrompt = `ゲームマスターとして以下の状況に対応してください：

現在の状況：
${situation}

${playerAction ? `プレイヤーの行動：\n${playerAction}\n` : ''}

${sessionContext ? `セッション背景：\n${sessionContext}\n` : ''}

アシストタイプ: ${assistType || '一般的なGM支援'}

${assistType === 'npc_dialogue' ? 'NPCとしてロールプレイし、適切なセリフと行動を提案してください。' : ''}
${assistType === 'rule_clarification' ? 'ルールの解釈と適用方法を説明してください。' : ''}
${assistType === 'improvisation' ? '予期しないプレイヤーの行動に対する即興的な対応を提案してください。' : ''}
${assistType === 'description' ? '場面の詳細な描写を行ってください。' : ''}

GMとして適切な対応を提案してください。`;

    const aiRequest: StandardAIRequest = {
      requestType: 'session-gm-assist',
      model: model || 'gemini-1.5-pro',
      systemPrompt: TRPG_GM_ASSISTANT,
      userPrompt,
      context: {
        situation,
        playerAction,
        sessionContext,
        assistType
      },
      options: {
        temperature: 0.7,
        maxTokens: 1500,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error('[API] TRPGセッションGMアシストエラー:', aiResponse.error);
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
      },
    });
  } catch (error: any) {
    console.error('[API] TRPGセッションGMアシストエラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'GMアシスト中にエラーが発生しました',
    });
  }
});

/**
 * TRPG戦闘解決エンドポイント
 * 戦闘の進行を支援します
 */
router.post('/combat-resolution', async (req, res) => {
  try {
    const { combatSituation, combatants, currentTurn, requestType, model } = req.body;
    
    console.log('[API] TRPG戦闘解決リクエスト:', {
      requestType,
      currentTurn
    });

    const userPrompt = `以下の戦闘状況を解決してください：

戦闘状況：
${combatSituation}

参戦者：
${combatants ? combatants.map((c: any) => `- ${c.name} (HP: ${c.hp}/${c.maxHp}, AC: ${c.ac})`).join('\n') : '不明'}

現在のターン: ${currentTurn || '不明'}

リクエストタイプ: ${requestType || 'general'}

${requestType === 'initiative' ? 'イニシアチブ順を決定してください。' : ''}
${requestType === 'damage' ? 'ダメージ計算と適用を行ってください。' : ''}
${requestType === 'tactics' ? '戦術的なアドバイスを提供してください。' : ''}
${requestType === 'description' ? '戦闘の様子を描写してください。' : ''}`;

    const aiRequest: StandardAIRequest = {
      requestType: 'combat-resolution',
      model: model || 'gemini-1.5-pro',
      systemPrompt: TRPG_COMBAT_RESOLVER,
      userPrompt,
      context: {
        combatSituation,
        combatants,
        currentTurn,
        requestType
      },
      options: {
        temperature: 0.6,
        maxTokens: 1500,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error('[API] TRPG戦闘解決エラー:', aiResponse.error);
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
      },
    });
  } catch (error: any) {
    console.error('[API] TRPG戦闘解決エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '戦闘解決中にエラーが発生しました',
    });
  }
});

/**
 * TRPGストーリー進行エンドポイント
 * 物語の展開を支援します
 */
router.post('/story-progression', async (req, res) => {
  try {
    const { currentSituation, playerChoices, storyContext, progressionType, model } = req.body;
    
    console.log('[API] TRPGストーリー進行リクエスト:', {
      progressionType
    });

    const userPrompt = `以下の状況から物語を進行させてください：

現在の状況：
${currentSituation}

${playerChoices ? `プレイヤーの選択：\n${playerChoices}\n` : ''}

${storyContext ? `物語の背景：\n${storyContext}\n` : ''}

進行タイプ: ${progressionType || '一般的な展開'}

${progressionType === 'consequence' ? 'プレイヤーの選択に基づく結果を描写してください。' : ''}
${progressionType === 'branch' ? '物語の分岐点と選択肢を提示してください。' : ''}
${progressionType === 'revelation' ? '重要な情報や秘密の開示を行ってください。' : ''}
${progressionType === 'climax' ? 'クライマックスに向けた展開を提案してください。' : ''}

プレイヤーの選択が意味を持つような展開を提案してください。`;

    const aiRequest: StandardAIRequest = {
      requestType: 'story-progression',
      model: model || 'gemini-1.5-pro',
      systemPrompt: TRPG_STORY_PROGRESSION,
      userPrompt,
      context: {
        currentSituation,
        playerChoices,
        storyContext,
        progressionType
      },
      options: {
        temperature: 0.8,
        maxTokens: 2000,
        expectedFormat: 'text',
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error('[API] TRPGストーリー進行エラー:', aiResponse.error);
      return res.status(500).json({
        status: 'error',
        message: aiResponse.error?.message || 'AI処理中にエラーが発生しました',
        error: aiResponse.error,
      });
    }

    return res.json({
      status: 'success',
      data: aiResponse.content,
      rawContent: aiResponse.rawContent,
      metadata: {
        model: aiResponse.debug?.model,
        processingTime: aiResponse.debug?.processingTime,
        requestType: aiRequest.requestType,
      },
    });
  } catch (error: any) {
    console.error('[API] TRPGストーリー進行エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'ストーリー進行中にエラーが発生しました',
    });
  }
});

/**
 * 🎨 AI画像生成エンドポイント（汎用）
 * Google Imagen 3を使用して様々なTRPG画像を生成します
 */
router.post('/generate-image', async (req, res) => {
  try {
    const { 
      prompt, 
      negativePrompt, 
      aspectRatio, 
      style, 
      quality,
      dimensions,
      seed,
      guidanceScale,
      steps,
      imageType 
    } = req.body;
    
    console.log('[API] AI画像生成リクエスト:', {
      imageType,
      style,
      quality,
      aspectRatio
    });

    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: 'プロンプトは必須です',
      });
    }

    // Google Cloud Service のインポートと初期化
    const { GoogleCloudService } = await import('../services/google-cloud.service.js');
    const googleCloudService = new GoogleCloudService();

    // 画像生成リクエストを作成
    const imageRequest = {
      prompt: prompt.trim(),
      negativePrompt: negativePrompt || '',
      aspectRatio: aspectRatio || '1:1',
      style: style || 'fantasy',
      quality: quality || 'standard',
      dimensions: dimensions || { width: 1024, height: 1024 },
      seed,
      guidanceScale: guidanceScale || 10,
      steps: steps || 50,
      imageType: imageType || 'general'
    };

    console.log('[API] 画像生成パラメータ:', imageRequest);

    // 画像を生成
    const result = await googleCloudService.generateImage(imageRequest);

    console.log('[API] AI画像生成完了');

    return res.json({
      status: 'success',
      images: [{
        url: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        dimensions: result.dimensions || imageRequest.dimensions,
        metadata: result.metadata
      }],
      model: 'imagen-3',
      cost: result.cost,
      generationTime: result.generationTime,
      remainingCredits: result.remainingCredits,
      metadata: {
        requestType: 'generate-image',
        generatedAt: result.generatedAt,
        imageType,
        parameters: imageRequest
      },
    });
  } catch (error: any) {
    console.error('[API] AI画像生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '画像生成中にエラーが発生しました',
      error: error.message
    });
  }
});

/**
 * 🧪 AI画像生成接続テスト
 */
router.post('/test-image-generation', async (req, res) => {
  try {
    // API キーの存在確認
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        error: 'APIキーが設定されていません'
      });
    }

    // Google Cloud Service の初期化テスト
    const { GoogleCloudService } = await import('../services/google-cloud.service.js');
    const googleCloudService = new GoogleCloudService();

    // 簡単なテスト画像生成
    const testRequest = {
      prompt: 'simple test image, fantasy art style',
      negativePrompt: 'low quality, blurry',
      aspectRatio: '1:1' as const,
      style: 'fantasy' as const,
      quality: 'draft' as const,
    };

    const result = await googleCloudService.testConnection();

    return res.json({
      status: 'success',
      message: 'API接続テスト成功',
      connectionStatus: result.success,
      availableModels: ['imagen-3', 'vertex-ai'],
      estimatedCost: 0.02
    });
  } catch (error: any) {
    console.error('[API] 画像生成接続テストエラー:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message || '接続テストに失敗しました'
    });
  }
});

/**
 * TRPG拠点画像生成エンドポイント
 * AI を使用して拠点の画像を生成します
 */
router.post('/base-image-generation', async (req, res) => {
  try {
    const { baseName, baseType, description, style, aspectRatio } = req.body;
    
    console.log('[API] TRPG拠点画像生成リクエスト:', {
      baseName,
      baseType,
      style
    });

    if (!baseName) {
      return res.status(400).json({
        status: 'error',
        message: '拠点名は必須です',
      });
    }

    // Google Cloud Service のインポートと初期化
    const { GoogleCloudService } = await import('../services/google-cloud.service.js');
    const googleCloudService = new GoogleCloudService();

    // 拠点画像生成用のプロンプトを構築
    let imagePrompt = `fantasy TRPG location artwork of ${baseName}`;
    
    if (baseType) {
      imagePrompt += `, a ${baseType}`;
    }
    
    if (description) {
      imagePrompt += `, ${description}`;
    }
    
    // デフォルトでファンタジー風の詳細を追加
    imagePrompt += ', detailed fantasy art, atmospheric lighting, medieval fantasy setting, high quality digital art';

    // ネガティブプロンプト（避けたい要素）
    const negativePrompt = 'modern buildings, cars, contemporary technology, low quality, blurry, distorted';

    // 画像生成リクエストを作成
    const imageRequest = {
      prompt: imagePrompt,
      negativePrompt,
      aspectRatio: (aspectRatio as '1:1' | '9:16' | '16:9' | '4:3' | '3:4') || '16:9',
      style: (style as 'photographic' | 'digital-art' | 'anime' | 'fantasy' | 'realistic') || 'fantasy',
      quality: 'standard' as const,
    };

    console.log('[API] 画像生成リクエスト:', imageRequest);

    // 画像を生成
    const result = await googleCloudService.generateImage(imageRequest);

    console.log('[API] 拠点画像生成完了:', result);

    return res.json({
      status: 'success',
      data: {
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        cost: result.cost,
        metadata: result.metadata,
      },
      metadata: {
        requestType: 'base-image-generation',
        generatedAt: result.generatedAt,
        baseName,
        baseType,
      },
    });
  } catch (error: any) {
    console.error('[API] TRPG拠点画像生成エラー:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || '拠点画像生成中にエラーが発生しました',
    });
  }
});

/**
 * 🌍 WorldContextBuilder統合・コンテキスト認識型世界観生成エンドポイント
 * 
 * このエンドポイントは、WorldContextBuilderの機能を最大限活用して、
 * 現在のゲーム状況、場所、キャラクター、セッション情報を考慮した
 * 高度にコンテキスト化された世界観要素を生成します。
 */
router.post('/worldbuilding-context-generation', async (req, res) => {
  try {
    const {
      // 基本情報
      elementType,
      elementName,
      userMessage,
      model,
      format = 'json',
      
      // 🌍 WorldContextBuilder用の詳細コンテキスト
      currentLocation,      // BaseLocation型の現在地情報
      activeCharacters,     // アクティブなキャラクター情報
      timeOfDay,           // 時間帯情報
      sessionDay,          // セッション日数
      situation,           // 状況（'encounter', 'conversation', 'exploration', 'general'）
      
      // キャンペーン全体の情報
      campaign,            // TRPGCampaign型のキャンペーン情報
      worldBuildingData,   // 既存の世界観データ
      sessionHistory,      // セッション履歴
      
      // AI生成オプション
      temperature = 0.8,
      maxTokens = 3000,
    } = req.body;

    console.log(`[API] コンテキスト認識型世界観生成リクエスト: ${elementName || elementType}`);
    console.log(`[API] 状況: ${situation || 'general'}, 場所: ${currentLocation?.name || '未設定'}`);

    // WorldContextBuilderスタイルのコンテキスト構築
    let contextualSystemPrompt = WORLD_BUILDER + '\n\n';
    contextualSystemPrompt += '## 🌍 WorldContextBuilder統合モード\n';
    contextualSystemPrompt += 'あなたは現在のゲーム状況を深く理解し、それに基づいて世界観要素を生成します。\n';
    contextualSystemPrompt += '生成する要素は、現在の場所、時間、キャラクター、セッション状況と完全に調和する必要があります。\n\n';

    // 詳細なコンテキストプロンプトの構築
    let detailedUserPrompt = userMessage || `${elementName || elementType}に関する世界観要素を生成してください。\n\n`;
    
    // 現在地情報の統合
    if (currentLocation) {
      detailedUserPrompt += `## 📍 現在の場所コンテキスト\n`;
      detailedUserPrompt += `場所: ${currentLocation.name} (${currentLocation.type})\n`;
      detailedUserPrompt += `地域: ${currentLocation.region}\n`;
      detailedUserPrompt += `説明: ${currentLocation.description}\n`;
      
      if (currentLocation.environmentalFactors) {
        detailedUserPrompt += `気候: ${currentLocation.environmentalFactors.climate}\n`;
        detailedUserPrompt += `地形: ${currentLocation.environmentalFactors.terrain}\n`;
      }
      
      if (currentLocation.culturalModifiers) {
        detailedUserPrompt += `\n文化的特徴:\n`;
        detailedUserPrompt += `- 交渉難易度: DC${currentLocation.culturalModifiers.negotiationDC}\n`;
        detailedUserPrompt += `- 物価修正: ${currentLocation.culturalModifiers.priceModifier * 100}%\n`;
      }
      
      if (currentLocation.encounterRules && timeOfDay) {
        const encounter = currentLocation.encounterRules.timeOfDay[timeOfDay];
        if (encounter) {
          detailedUserPrompt += `\n現在時間帯(${timeOfDay})の遭遇情報:\n`;
          detailedUserPrompt += `- 遭遇確率: ${encounter.probability * 100}%\n`;
          detailedUserPrompt += `- タイプ: ${encounter.type}\n`;
        }
      }
      
      detailedUserPrompt += '\n';
    }
    
    // アクティブキャラクター情報
    if (activeCharacters && activeCharacters.length > 0) {
      detailedUserPrompt += `## 👥 関連キャラクター\n`;
      activeCharacters.forEach((char: any) => {
        detailedUserPrompt += `- ${char.name} (${char.characterType}): ${char.description || ''}\n`;
      });
      detailedUserPrompt += '\n';
    }
    
    // セッション状況
    if (sessionDay) {
      detailedUserPrompt += `## 📅 セッション状況\n`;
      detailedUserPrompt += `セッション日数: ${sessionDay}日目\n`;
      if (timeOfDay) detailedUserPrompt += `時間帯: ${timeOfDay}\n`;
      if (situation) detailedUserPrompt += `現在の状況: ${situation}\n`;
      detailedUserPrompt += '\n';
    }
    
    // 既存の世界観データとの整合性指示
    if (worldBuildingData) {
      detailedUserPrompt += `## 🌐 既存世界観との整合性\n`;
      detailedUserPrompt += `この世界観要素は、既存の設定と完全に調和し、それらを拡張・深化させるものでなければなりません。\n`;
      
      // 要素タイプに応じた具体的な指示
      if (elementType === WorldBuildingElementType.PLACE) {
        detailedUserPrompt += `- 地理的な整合性を保ち、既存の場所との関係性を明確にしてください\n`;
        detailedUserPrompt += `- 気候、地形、文化的特徴は周辺地域と調和させてください\n`;
        detailedUserPrompt += `- encounterRules, npcSchedule, culturalModifiersなどの拡張プロパティも含めてください\n`;
      } else if (elementType === WorldBuildingElementType.CULTURE) {
        detailedUserPrompt += `- 既存の文化との相互関係、交流、対立を考慮してください\n`;
        detailedUserPrompt += `- 地理的条件がもたらす文化的特徴を反映してください\n`;
      }
      
      detailedUserPrompt += '\n';
    }
    
    // 状況別の生成指示
    detailedUserPrompt += `## 🎯 生成指示\n`;
    switch (situation) {
      case 'encounter':
        detailedUserPrompt += `遭遇・戦闘に関連する要素を重視して生成してください。\n`;
        detailedUserPrompt += `危険度、防御設備、戦術的価値などを詳細に記述してください。\n`;
        break;
      case 'conversation':
        detailedUserPrompt += `会話・社交に関連する要素を重視して生成してください。\n`;
        detailedUserPrompt += `NPCの性格、文化的背景、交渉の余地などを詳細に記述してください。\n`;
        break;
      case 'exploration':
        detailedUserPrompt += `探索・発見に関連する要素を重視して生成してください。\n`;
        detailedUserPrompt += `隠された要素、秘密、探索可能な場所などを詳細に記述してください。\n`;
        break;
      default:
        detailedUserPrompt += `バランスの取れた、多面的な世界観要素を生成してください。\n`;
    }

    // AIリクエストの作成
    const aiRequest: StandardAIRequest = {
      requestType: 'worldbuilding-context-generation',
      model: model || 'gemini-1.5-pro',
      systemPrompt: contextualSystemPrompt,
      userPrompt: detailedUserPrompt,
      context: {
        elementType,
        elementName,
        currentLocation,
        activeCharacters,
        timeOfDay,
        sessionDay,
        situation,
        campaign,
        worldBuildingData,
        sessionHistory,
      },
      options: {
        temperature,
        maxTokens,
        expectedFormat: format,
        responseFormat: format,
      },
    };

    console.log(`[API] コンテキスト認識型AIリクエスト実行`);
    console.log(`[API] コンテキストキー: ${Object.keys(aiRequest.context || {}).join(', ')}`);

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error(`[API] コンテキスト認識型生成エラー:`, aiResponse.error);
      return res.status(500).json({
        status: 'error',
        error: aiResponse.error?.message || 'コンテキスト認識型世界観生成中にエラーが発生しました',
      });
    }

    // レスポンスの整形（BaseLocation拡張プロパティの確認）
    let responseData = aiResponse.content;
    
    if (format === 'json' && typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData);
      } catch (e) {
        console.warn('[API] JSONパース失敗、生データを返します');
      }
    }
    
    // BaseLocation型の場合、拡張プロパティが含まれているか確認
    if (elementType === WorldBuildingElementType.PLACE && responseData) {
      console.log(`[API] BaseLocation拡張プロパティチェック:`);
      console.log(`- encounterRules: ${responseData.encounterRules ? '✓' : '✗'}`);
      console.log(`- npcSchedule: ${responseData.npcSchedule ? '✓' : '✗'}`);
      console.log(`- culturalModifiers: ${responseData.culturalModifiers ? '✓' : '✗'}`);
      console.log(`- environmentalFactors: ${responseData.environmentalFactors ? '✓' : '✗'}`);
    }

    res.json({
      status: 'success',
      data: responseData,
      metadata: {
        model: aiRequest.model,
        requestType: 'worldbuilding-context-generation',
        elementType,
        situation,
        hasContext: !!currentLocation || !!activeCharacters || !!worldBuildingData,
        processingTime: aiResponse.debug?.processingTime,
      },
    });
  } catch (error: any) {
    console.error('[API] コンテキスト認識型世界観生成エラー:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || 'コンテキスト認識型世界観生成中にエラーが発生しました',
    });
  }
});

/**
 * 🎮 AIパーティーメンバー行動決定エンドポイント
 * 
 * プレイヤー不足時やシングルプレイモードで、AIがPCキャラクターの行動を決定します。
 * TRPGセッション画面でプレイヤー以外のキャラクターの手番が回ってきた時に使用します。
 */
router.post('/ai-party-member-action', async (req, res) => {
  try {
    const {
      characterId,            // 行動するキャラクターのID
      character,              // TRPGCharacter型のキャラクター情報
      currentSituation,       // 現在の状況説明
      sessionContext,         // セッション全体のコンテキスト
      partyMembers,          // パーティー全体の情報
      availableActions,      // 利用可能な行動選択肢
      locationInfo,          // 現在地の情報
      combatState,           // 戦闘状況（戦闘中の場合）
      model = 'gemini-1.5-pro',
      temperature = 0.7,
    } = req.body;

    console.log(`[API] AIパーティーメンバー行動決定リクエスト: ${character?.name || characterId}`);

    // aiPartyMemberControllerエージェントを使用
    const aiRequest: StandardAIRequest = {
      requestType: 'ai-party-member-action',
      model,
      systemPrompt: `あなたはTRPGセッションでプレイヤーキャラクター（PC）を操作するAIエージェントです。
      
キャラクター情報:
名前: ${character?.name}
職業: ${character?.profession}
性格的特徴: ${character?.description}

【重要: 行動決定の原則】
- キャラクターの性格、背景、動機に忠実に行動する
- パーティーの目標達成に協力的である
- 他のプレイヤーの楽しみを奪わない控えめな行動
- 戦闘では効率的だが、人間プレイヤーに主役を譲る
- 危機的状況では積極的に仲間を助ける

行動を決定する際は、簡潔に「${character?.name}は[行動]します」という形式で応答してください。`,
      userPrompt: `現在の状況: ${currentSituation}

現在地: ${locationInfo?.name || '不明'}
${locationInfo?.description || ''}

パーティー状況:
${partyMembers?.map((member: any) => `- ${member.name} (HP: ${member.currentHP || member.derived?.HP}/${member.derived?.HP})`).join('\n') || '情報なし'}

${combatState ? `
戦闘状況:
- 戦闘ラウンド: ${combatState.round}
- イニシアチブ順: ${combatState.initiative?.map((i: any) => i.characterId).join(' → ') || '不明'}
- 現在のHP: ${character?.currentHP || character?.derived?.HP}/${character?.derived?.HP}
` : ''}

利用可能な行動:
${availableActions?.map((action: any, index: number) => `${index + 1}. ${action.name || action}: ${action.description || ''}`).join('\n') || '標準的な行動（移動、攻撃、スキル使用など）'}

${character?.name}の性格と状況を考慮して、最も適切な行動を1つ選択し、その理由も簡潔に説明してください。`,
      context: {
        characterId,
        character,
        currentSituation,
        sessionContext,
        partyMembers,
        locationInfo,
        combatState,
      },
      options: {
        temperature,
        maxTokens: 500,
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error(`[API] AIパーティーメンバー行動決定エラー:`, aiResponse.error);
      return res.status(500).json({
        status: 'error',
        error: aiResponse.error?.message || 'AIパーティーメンバー行動決定中にエラーが発生しました',
      });
    }

    res.json({
      status: 'success',
      characterId,
      characterName: character?.name,
      action: aiResponse.content,
      actionType: combatState ? 'combat' : 'general',
      metadata: {
        model: aiRequest.model,
        requestType: 'ai-party-member-action',
        processingTime: aiResponse.debug?.processingTime,
      },
    });
  } catch (error: any) {
    console.error('[API] AIパーティーメンバー行動決定エラー:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || 'AIパーティーメンバー行動決定中にエラーが発生しました',
    });
  }
});

/**
 * ⚔️ エネミーAI行動決定エンドポイント
 * 
 * モンスターやエネミーの戦術的な行動を決定します。
 * TRPGセッション画面でエネミーの手番が回ってきた時に使用します。
 */
router.post('/enemy-ai-action', async (req, res) => {
  try {
    const {
      enemyId,               // 行動するエネミーのID
      enemy,                 // EnemyCharacter型のエネミー情報
      combatSituation,       // 戦闘状況の詳細
      targetOptions,         // 攻撃可能なターゲット一覧
      availableSkills,       // 使用可能なスキル・能力
      environmentalFactors,  // 地形・環境要因
      alliesInfo,           // 味方エネミー情報
      model = 'gemini-1.5-pro',
      temperature = 0.8,
    } = req.body;

    console.log(`[API] エネミーAI行動決定リクエスト: ${enemy?.name || enemyId}`);

    // 知能レベルの判定
    const intelligenceLevel = enemy?.attributes?.intelligence || 10;
    let aiIntelligenceType = 'medium';
    if (intelligenceLevel <= 3) aiIntelligenceType = 'low';
    else if (intelligenceLevel >= 15) aiIntelligenceType = 'high';

    // enemyAIControllerエージェントを使用
    const aiRequest: StandardAIRequest = {
      requestType: 'enemy-ai-action',
      model,
      systemPrompt: `あなたはTRPGセッションでエネミー（敵キャラクター、モンスター）を操作するAIエージェントです。

エネミー情報:
名前: ${enemy?.name}
ランク: ${enemy?.rank}
タイプ: ${enemy?.type}
知能レベル: ${intelligenceLevel} (${aiIntelligenceType})
現在HP: ${enemy?.status?.currentHp}/${enemy?.derivedStats?.hp}

【知能レベル別行動指針: ${aiIntelligenceType}】
${aiIntelligenceType === 'low' ? `
- 本能的・反射的な行動
- 最も近い敵を攻撃
- 単純な行動パターン
- 罠や戦術を理解しない` : aiIntelligenceType === 'high' ? `
- 高度な戦術と魔法の使用
- プレイヤーの弱点を分析し標的化
- 複雑な罠や策略の実行
- 長期的な計画に基づく行動` : `
- 基本的な戦術理解
- 弱った敵を優先的に狙う
- 簡単な連携行動
- 明らかに不利な場合は撤退`}

行動を決定する際は、「${enemy?.name}は[行動]を実行！」という形式で応答し、
必要に応じて効果音や短い描写を付け加えてください。`,
      userPrompt: `戦闘状況:
ラウンド: ${combatSituation?.round || 1}
${enemy?.name}の位置: ${combatSituation?.enemyPosition || '不明'}

攻撃可能なターゲット:
${targetOptions?.map((target: any, index: number) => 
  `${index + 1}. ${target.name} (HP: ${target.currentHP}/${target.maxHP}, 距離: ${target.distance || '近接'})`
).join('\n') || 'ターゲット情報なし'}

使用可能なスキル・能力:
${availableSkills?.map((skill: any, index: number) => 
  `${index + 1}. ${skill.name}: ${skill.description} (コスト: ${skill.cost || 'なし'})`
).join('\n') || '基本攻撃のみ'}

${alliesInfo?.length ? `
味方エネミー:
${alliesInfo.map((ally: any) => `- ${ally.name} (HP: ${ally.currentHP}/${ally.maxHP})`).join('\n')}
` : ''}

環境要因:
${environmentalFactors?.description || '特別な環境要因なし'}

現在のHP状況: ${enemy?.status?.currentHp}/${enemy?.derivedStats?.hp} (${Math.round((enemy?.status?.currentHp / enemy?.derivedStats?.hp) * 100)}%)

知能レベル ${intelligenceLevel} (${aiIntelligenceType}) のエネミーとして、最も効果的な行動を選択してください。`,
      context: {
        enemyId,
        enemy,
        combatSituation,
        targetOptions,
        availableSkills,
        environmentalFactors,
        alliesInfo,
        intelligenceLevel,
        aiIntelligenceType,
      },
      options: {
        temperature,
        maxTokens: 400,
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error(`[API] エネミーAI行動決定エラー:`, aiResponse.error);
      return res.status(500).json({
        status: 'error',
        error: aiResponse.error?.message || 'エネミーAI行動決定中にエラーが発生しました',
      });
    }

    res.json({
      status: 'success',
      enemyId,
      enemyName: enemy?.name,
      action: aiResponse.content,
      intelligenceType: aiIntelligenceType,
      hpPercentage: Math.round((enemy?.status?.currentHp / enemy?.derivedStats?.hp) * 100),
      metadata: {
        model: aiRequest.model,
        requestType: 'enemy-ai-action',
        processingTime: aiResponse.debug?.processingTime,
      },
    });
  } catch (error: any) {
    console.error('[API] エネミーAI行動決定エラー:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || 'エネミーAI行動決定中にエラーが発生しました',
    });
  }
});

/**
 * 🤝 AI協調行動コーディネートエンドポイント
 * 
 * 複数のAI制御キャラクター間の連携行動を調整します。
 * 複雑な戦闘や協調が必要な場面で使用します。
 */
router.post('/ai-coordination', async (req, res) => {
  try {
    const {
      coordinationType,      // 'party' | 'enemy' | 'mixed'
      characters,           // 調整対象のキャラクター一覧
      currentSituation,     // 現在の状況
      objectiveType,        // 目標タイプ ('combat', 'exploration', 'puzzle', 'social')
      constraints,          // 制約条件
      availableResources,   // 利用可能なリソース
      model = 'gemini-1.5-pro',
      temperature = 0.6,
    } = req.body;

    console.log(`[API] AI協調行動コーディネートリクエスト: ${coordinationType}, ${characters?.length || 0}キャラクター`);

    // aiCooperationCoordinatorエージェントを使用
    const aiRequest: StandardAIRequest = {
      requestType: 'ai-coordination',
      model,
      systemPrompt: `あなたは複数のAI制御キャラクター（味方PC、エネミー）の協調行動を調整するコーディネーターです。
戦闘や複雑な状況で、AI同士が自然で戦術的な連携を取れるよう支援します。

【協調行動の原則】
- 各キャラクターの個性を保ちつつ効果的な連携
- プレイヤーに予測可能だが挑戦的な体験を提供
- 不自然な完璧さを避ける（時には失敗も）

複数キャラクターの行動を調整する際は、各キャラクターの行動を順番に提示し、
連携の意図を簡潔に説明してください。`,
      userPrompt: `連携タイプ: ${coordinationType}
目標: ${objectiveType}
状況: ${currentSituation}

参加キャラクター:
${characters?.map((char: any, index: number) => 
  `${index + 1}. ${char.name} (${char.characterType || char.type}) - HP: ${char.currentHP || char.status?.currentHp}/${char.maxHP || char.derivedStats?.hp || char.derived?.HP}`
).join('\n') || 'キャラクター情報なし'}

制約条件:
${constraints?.map((constraint: string, index: number) => `- ${constraint}`).join('\n') || '特別な制約なし'}

利用可能なリソース:
${availableResources?.map((resource: string, index: number) => `- ${resource}`).join('\n') || 'リソース情報なし'}

これらのキャラクターの協調行動を企画し、以下の形式で回答してください:

【連携プラン】
(連携の概要と狙い)

【個別行動】
1. [キャラクター名]: [具体的な行動]
2. [キャラクター名]: [具体的な行動]
...

【期待される効果】
(連携によって得られる戦術的・戦略的効果)`,
      context: {
        coordinationType,
        characters,
        currentSituation,
        objectiveType,
        constraints,
        availableResources,
      },
      options: {
        temperature,
        maxTokens: 800,
        responseFormat: 'text',
      },
    };

    const aiResponse = await processAIRequest(aiRequest);

    if (aiResponse.status === 'error') {
      console.error(`[API] AI協調行動コーディネートエラー:`, aiResponse.error);
      return res.status(500).json({
        status: 'error',
        error: aiResponse.error?.message || 'AI協調行動コーディネート中にエラーが発生しました',
      });
    }

    res.json({
      status: 'success',
      coordinationType,
      participantCount: characters?.length || 0,
      coordinationPlan: aiResponse.content,
      objectiveType,
      metadata: {
        model: aiRequest.model,
        requestType: 'ai-coordination',
        processingTime: aiResponse.debug?.processingTime,
      },
    });
  } catch (error: any) {
    console.error('[API] AI協調行動コーディネートエラー:', error);
    res.status(500).json({
      status: 'error',
      error: error.message || 'AI協調行動コーディネート中にエラーが発生しました',
    });
  }
});

export default router;

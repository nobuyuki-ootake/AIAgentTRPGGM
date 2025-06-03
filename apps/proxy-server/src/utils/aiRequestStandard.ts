import type {
  AIModelType,
  AIDataFormat,
  StandardAIRequest,
  StandardAIResponse,
  AIError,
} from '@trpg-ai-gm/types';

/**
 * AI リクエスト・レスポンスの標準形式定義
 * このファイルはAIとの通信における標準形式を一元管理するためのものです。
 */

// ローカルの型定義をここから削除

/**
 * AIレスポンスのフォーマットを検証するユーティリティ関数
 * @param response AIからのレスポンス
 * @returns 検証結果（true: 有効、false: 無効）
 */
export function validateAIResponse(response: any): boolean {
  if (!response) {
    console.error('AIレスポンスが空です');
    return false;
  }

  if (typeof response !== 'object') {
    console.error('AIレスポンスがオブジェクト形式ではありません');
    return false;
  }

  // 最低限必要なプロパティを確認
  if (response.batchResponse === true) {
    // バッチレスポンスの検証
    if (
      !Array.isArray(response.elements) &&
      !Array.isArray(response.characters)
    ) {
      console.error('バッチレスポンスにelements/charactersが含まれていません');
      return false;
    }
    return true;
  } else {
    // 通常レスポンスの検証
    if (typeof response.response !== 'string') {
      console.error('AIレスポンスに有効なresponseが含まれていません');
      return false;
    }
    return true;
  }
}

/**
 * 標準システムプロンプトを構築する関数
 * @param requestType リクエストタイプ
 * @param context プロンプトに含めるコンテキスト
 * @returns 構築されたシステムプロンプト
 */
export function buildStandardSystemPrompt(
  requestType: string,
  context: Record<string, any> = {},
): string {
  // リクエストタイプに基づいてプロンプトを選択
  switch (requestType) {
    case 'worldbuilding':
      return buildWorldBuildingPrompt(context);
    case 'character':
      return buildCharacterPrompt(context);
    case 'plot':
      return buildPlotPrompt(context);
    case 'scene':
      return buildScenePrompt(context);
    default:
      return buildGenericPrompt();
  }
}

// 世界構築プロンプト
function buildWorldBuildingPrompt(context: Record<string, any>): string {
  const { elementName, elementType } = context;

  return `あなたはTRPGキャンペーンの世界構築エキスパートです。
質問された${elementType || '要素'}「${elementName || ''}」に関する詳細な情報を提供してください。
可能な限り具体的で、TRPGキャンペーンの一貫性を保つのに役立つ詳細を含めてください。
指示に従って、指定された形式（JSONまたはYAML）で回答してください。`;
}

// キャラクタープロンプト
function buildCharacterPrompt(context: Record<string, any>): string {
  const { characterName, characterRole } = context;

  return `あなたは経験豊富なTRPGキャラクター作成のエキスパートです。
「${characterName || ''}」という名前の「${characterRole || '役割'}」のキャラクターの詳細な情報を提供してください。
能力値、スキル、背景、動機、装備などを含め、魅力的で実用的なTRPGキャラクターを作成してください。
指示に従って、指定された形式（JSONまたはYAML）で回答してください。`;
}

// プロット構築プロンプト
function buildPlotPrompt(context: Record<string, any>): string {
  return `あなたは創造的なTRPGシナリオとクエスト設計のエキスパートです。
魅力的で一貫性のあるシナリオやクエスト要素を作成するのを手伝ってください。
起承転結を意識し、プレイヤーの選択と展開の論理性を確保してください。
指示に従って、指定された形式（JSONまたはYAML）で回答してください。`;
}

// シーン構築プロンプト
function buildScenePrompt(context: Record<string, any>): string {
  return `あなたはTRPGセッションのシーン作成のスペシャリストです。
指示に基づいて、魅力的で臨場感のあるセッションシーンを作成してください。
環境描写、NPCの行動、状況説明、プレイヤーの選択肢などを適切に含めてください。
指示に従って、指定された形式（JSONまたはYAML）で回答してください。`;
}

// 汎用プロンプト
function buildGenericPrompt(): string {
  return `あなたは創造的なTRPGキャンペーン管理のアシスタントです。
質問に対して、明確で詳細な回答を提供し、TRPGキャンペーン運営に役立つ情報を提供してください。
指示に従って、指定された形式（JSONまたはYAML）で回答してください。`;
}

/**
 * 標準化されたJSONレスポンスの形式を定義
 * AIにJSONフォーマットで回答を要求する場合のテンプレート
 */
export const jsonResponseTemplates = {
  charactersListTemplate: `
以下の厳密なJSONフォーマットで出力してください:

[
  {"name": "キャラクター名1", "role": "主人公/敵役/脇役", "brief": "簡単な説明"},
  {"name": "キャラクター名2", "role": "主人公/敵役/脇役", "brief": "簡単な説明"},
  {"name": "キャラクター名3", "role": "主人公/敵役/脇役", "brief": "簡単な説明"}
]

重要な注意:
- 上記の厳密なJSONフォーマットのみを返してください
- コードブロック(\`\`\`json)やその他のマークダウン記法は使わないでください
- 特殊なマーカー記号は使わないでください
- 説明文や前置き、後置きは一切不要です
- 純粋なJSON配列のみを返してください
`,
  // キャラクター詳細テンプレート
  characterDetail: (characterName: string, characterRole: string) => `
「${characterName}」というキャラクターの詳細情報を以下の形式で作成してください。

名前: ${characterName}
役割: ${characterRole}
性別: [性別]
年齢: [年齢]
説明: [短い説明]
背景: [背景情報]
動機: [動機]
特性: [特性1], [特性2], [特性3]
アイコン: [絵文字]

関係:
- [他キャラ名]: [関係タイプ] - [関係の説明]
- [他キャラ名]: [関係タイプ] - [関係の説明]
`,
};

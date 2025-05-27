import {
  WorldBuildingElementType,
  WorldBuildingElementData as SharedWorldBuildingElementData,
} from '@novel-ai-assistant/types';

/**
 * 世界観要素のスキーマと型定義
 * フロントエンドとバックエンドで共有する型定義
 */

/**
 * 各エレメントのスキーマ定義を修正
 */
export const WorldBuildingElementSchemas: Record<
  string,
  Record<string, unknown>
> = {
  [WorldBuildingElementType.WORLDMAP]: {},
  [WorldBuildingElementType.SETTING]: {},
  [WorldBuildingElementType.RULE]: {
    name: 'ルールや法則の名称',
    description: '詳細な説明',
    features: '特徴や適用方法',
    importance: '物語における重要性',
    impact: '世界や登場人物への影響',
    exceptions: '例外事項',
    origin: '起源や成立背景',
    relations: '他の要素との関係',
  },
  [WorldBuildingElementType.PLACE]: {
    name: '場所の名称',
    description: '詳細な説明',
    features: '特徴的な要素',
    importance: '物語における重要性',
    location: '地理的位置や周辺環境',
    population: '住民の数や特性',
    culturalFeatures: '文化的特徴',
    relations: '他の要素との関係',
  },
  [WorldBuildingElementType.CULTURE]: {
    name: '文化の名称',
    description: '詳細な説明',
    features: '特徴的な要素',
    importance: '物語における重要性',
    customText: '独自の習慣や儀式',
    beliefs: '信念や価値観',
    history: '文化の歴史',
    socialStructure: '社会構造',
    values: ['価値観1', '価値観2'],
    customsArray: ['習慣1', '習慣2'],
    relations: '他の要素との関係',
  },
  [WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT]: {},
  [WorldBuildingElementType.HISTORY_LEGEND]: {
    name: '歴史的事象の名称',
    description: '詳細な説明',
    features: '特徴的な要素',
    importance: '物語における重要性',
    period: '発生時期',
    significantEvents: '重要な出来事',
    consequences: '歴史的な影響',
    relations: '他の要素との関係',
  },
  [WorldBuildingElementType.MAGIC_TECHNOLOGY]: {
    name: '技術の名称',
    description: '詳細な説明',
    features: '特徴的な要素',
    importance: '物語における重要性',
    functionality: '機能や用途',
    development: '開発過程',
    impact: '社会への影響',
    relations: '他の要素との関係',
  },
  [WorldBuildingElementType.FREE_FIELD]: {
    name: '自由記述欄の名称',
    description: '詳細な説明',
    features: '特徴的な要素',
    importance: '物語における重要性',
    relations: '他の要素との関係',
  },
  [WorldBuildingElementType.STATE_DEFINITION]: {
    name: '状態定義の名称',
    description: '詳細な説明',
    features: '特徴的な要素',
    importance: '物語における重要性',
    relations: '他の要素との関係',
  },
};

/**
 * 世界観要素タイプに応じたプロンプトテンプレートを生成
 *
 * @param elementType 世界観要素の種類
 * @param elementName 要素の名前
 * @returns 指定した要素タイプに対応するプロンプト
 */
export function generateElementPrompt(
  elementType: string,
  elementName: string,
): string {
  // 日本語表示名への変換
  const displayType = WorldBuildingElementType[elementType] || elementType;

  // 基本プロンプトテンプレート
  const basePrompt = `
以下の厳密なJSONフォーマットに従って、「${elementName}」という${displayType}の詳細情報を作成してください。

重要な注意:
- 特殊なマーカー記号（**、##、-- など）は名前や説明に付けないでください
- 純粋なテキストのみを使用してください
- 装飾や強調のための記号は使わないでください
- マークダウン形式は使用しないでください
- JSONの厳密な形式に従って回答してください
`;

  // スキーマが存在する場合は、それを表示して期待する形式を明示
  const schema = WorldBuildingElementSchemas[elementType];
  if (schema) {
    const schemaExample = JSON.stringify(schema, null, 2);
    return `${basePrompt}

期待するJSONフォーマットの例:
${schemaExample}

上記の形式に合わせて、具体的な内容で詳細情報を作成してください。
`;
  }

  // スキーマがない場合は基本プロンプトのみ返す
  return basePrompt;
}

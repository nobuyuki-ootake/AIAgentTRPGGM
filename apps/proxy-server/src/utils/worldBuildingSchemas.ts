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
  // 要素タイプの正規化
  const normalizedType = elementType.toLowerCase();

  // 日本語表示名への変換
  const typeDisplayNames: Record<string, string> = {
    place: '場所',
    culture: '文化',
    rule: 'ルール・法則',
    setting: '設定',
    history_legend: '歴史・伝説',
    magic_technology: '魔法・技術',
    geography_environment: '地理・環境',
    free_field: '自由記述',
    state_definition: '状態定義',
    worldmap: '世界地図',
  };

  const displayType = typeDisplayNames[normalizedType] || elementType;

  // 基本プロンプトテンプレート
  const basePrompt = `
「${elementName}」という${displayType}の詳細情報を以下のJSONフォーマットで作成してください。

重要な指示:
1. 特殊なマーカー記号（**、##、-- など）は使用しないでください
2. 純粋なテキストのみを使用してください
3. 装飾や強調のための記号は使わないでください
4. マークダウン形式は使用しないでください
5. 以下のJSONフォーマットに厳密に従ってください
6. 各フィールドには具体的で詳細な内容を記述してください
7. プロジェクトの文脈（プロット、キャラクター情報）を考慮してください
`;

  // 要素タイプ別の詳細なJSONスキーマを生成
  let jsonSchema = '';

  switch (normalizedType) {
    case 'place':
      jsonSchema = `{
  "name": "${elementName}",
  "type": "place",
  "description": "この場所の詳細な説明（外観、雰囲気、歴史的背景など）",
  "features": "この場所の特徴的な要素（建築様式、自然環境、特殊な設備など）",
  "importance": "物語におけるこの場所の重要性と役割",
  "location": "地理的位置や周辺環境の説明",
  "population": "住民の数や特性、社会構成",
  "culturalFeatures": "この場所特有の文化的特徴や習慣",
  "relations": "他の場所や要素との関係性"
}`;
      break;

    case 'culture':
      jsonSchema = `{
  "name": "${elementName}",
  "type": "culture",
  "description": "この文化の詳細な説明（起源、発展、現在の状況など）",
  "features": "この文化の特徴的な要素（言語、芸術、技術など）",
  "importance": "物語におけるこの文化の重要性と影響",
  "customText": "独自の習慣や儀式の詳細",
  "beliefs": "この文化の信念や価値観",
  "history": "文化の歴史的発展",
  "socialStructure": "社会構造や階級制度",
  "relations": "他の文化や要素との関係性"
}`;
      break;

    case 'rule':
      jsonSchema = `{
  "name": "${elementName}",
  "type": "rule",
  "description": "このルールや法則の詳細な説明",
  "features": "ルールの特徴や適用方法",
  "importance": "物語におけるこのルールの重要性",
  "impact": "世界や登場人物への具体的な影響",
  "exceptions": "ルールの例外事項や制限",
  "origin": "ルールの起源や成立背景",
  "relations": "他のルールや要素との関係性"
}`;
      break;

    case 'magic_technology':
      jsonSchema = `{
  "name": "${elementName}",
  "type": "magic_technology",
  "description": "この技術や魔法の詳細な説明",
  "features": "技術の特徴的な要素や能力",
  "importance": "物語におけるこの技術の重要性",
  "functionality": "具体的な機能や用途",
  "development": "開発過程や発見の経緯",
  "impact": "社会や個人への影響",
  "relations": "他の技術や要素との関係性"
}`;
      break;

    default:
      jsonSchema = `{
  "name": "${elementName}",
  "type": "${normalizedType}",
  "description": "この要素の詳細な説明",
  "features": "この要素の特徴的な側面",
  "importance": "物語におけるこの要素の重要性",
  "relations": "他の要素との関係性"
}`;
  }

  return `${basePrompt}

期待するJSONフォーマット:
${jsonSchema}

上記のフォーマットに従って、プロジェクトの文脈に合った具体的で詳細な内容を作成してください。
各フィールドには実際の内容を記述し、テンプレート文字列をそのまま使用しないでください。
`;
}

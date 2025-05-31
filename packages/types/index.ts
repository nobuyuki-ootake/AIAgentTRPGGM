import type { Descendant } from "slate";

export interface NovelProject {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  synopsis: string;
  plot: PlotElement[];
  characters: Character[];
  worldBuilding: WorldBuilding;
  timeline: TimelineEvent[];
  chapters: Chapter[];
  feedback: Feedback[];
  definedCharacterStatuses?: CharacterStatus[];
  metadata?: ProjectMetadata;
  notes?: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
  }[];
}

// プロット要素の型定義
export interface PlotElement {
  id: string;
  title: string;
  description: string;
  order: number;
  status: "決定" | "検討中";
}

// キャラクターの特性（traits）の型定義
export interface CharacterTrait {
  id: string;
  name: string;
  value: string;
}

// キャラクター間の関係の型定義（UI用）
export interface Relationship {
  id: string;
  targetCharacterId: string;
  type: string;
  description: string;
}

// キャラクターの状態（ステータス）型
export interface CharacterStatus {
  id: string;
  name: string; // 例: 生存, 死亡, 毒, やけど, カスタム名
  type: "life" | "abnormal" | "custom";
  mobility: "normal" | "slow" | "impossible"; // 歩行可能/鈍足/不可
  description?: string;
}

// キャラクターの型定義
export interface Character {
  id: string;
  name: string;
  role: "protagonist" | "antagonist" | "supporting";
  gender?: string;
  birthDate?: string;
  age?: string;
  appearance?: string;
  personality?: string;
  description: string;
  background: string;
  motivation: string;
  traits: CharacterTrait[];
  relationships: Relationship[];
  imageUrl?: string;
  customFields?: CustomField[];
  statuses?: CharacterStatus[];
}

// キャラクターの役割の型エイリアス
export type CharacterRoleType = "protagonist" | "antagonist" | "supporting";

// バッチ処理結果の型定義
export interface BatchProcessResult {
  batchResponse?: boolean;
  elements?: Array<{
    response: string;
    agentUsed: string;
    steps: Array<unknown>;
    elementName?: string;
    elementType?: string;
  }>;
  totalElements?: number;
}

// 世界観設定の型定義
export interface WorldBuilding {
  id: string;
  setting: SettingElement[];
  worldmaps: WorldmapElement[];
  rules: RuleElement[];
  places: PlaceElement[];
  cultures: CultureElement[];
  geographyEnvironment: GeographyEnvironmentElement[];
  historyLegend: HistoryLegendElement[];
  magicTechnology: MagicTechnologyElement[];
  stateDefinition: StateDefinitionElement[];
  freeFields: FreeFieldElement[];
  timelineSettings?: {
    startDate: string;
  };
  worldMapImageUrl?: string;
  description?: string; // 後方互換性のため残すが、setting配列を優先
}

// ルール、文化、場所の型定義は worldBuilding 内の型を使用

// タイムラインイベントの型定義
export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  relatedCharacters: string[];
  relatedPlaces: string[];
  order: number;
  eventType?: string; // 例: "battle", "rest", "dialogue", "journey", "discovery", "turning_point", "info"
  postEventCharacterStatuses?: {
    [characterId: string]: CharacterStatus[];
  };
  relatedPlotIds?: string[]; // 関連するプロットのID配列
  placeId?: string; // タイムラインチャート表示用の主要な場所ID (オプショナル)
}

// AIが生成するイベントの「種」の型定義
export interface TimelineEventSeed {
  id: string; // 仮のID、またはAIが生成したユニークID
  eventName: string;
  relatedPlaceIds?: string[];
  characterIds?: string[];
  relatedPlotIds?: string[]; // 関連するプロットのID（またはタイトルなど、初期段階での識別子）
  estimatedTime?: string; // AIが提案するおおよその時期や期間 (例: "物語の序盤", "夏至の祭り前後")
  description?: string; // 簡単な説明やメモ
  relatedPlotTitles?: string[]; // 関連するプロットのタイトル配列
}

// 章の型定義
export interface Chapter {
  id: string;
  title: string;
  synopsis?: string;
  content: Descendant[];
  order: number;
  scenes: Scene[];
  relatedEvents?: string[]; // 章に関連するタイムラインイベントのID配列
  manuscriptPages?: string[]; // For vertical genko mode, array of HTML strings
  status?: ChapterStatus;
}

// シーンの型定義
export interface Scene {
  id: string;
  title: string;
  description: string;
  content: string;
  order: number;
  characters: string[];
  location: string;
  timeOfDay: string;
}

// フィードバックの型定義
export interface Feedback {
  id: string;
  type: "critique" | "suggestion" | "reaction";
  content: string;
  targetId?: string; // 章やシーンなどの対象ID
  targetType?: "chapter" | "scene" | "character" | "plot" | "entire";
  createdAt: Date;
}

// カスタムフィールドの型定義
export interface CustomField {
  id: string;
  name: string;
  value: string;
}

// タイムライングループの型定義
export interface TimelineGroup {
  id: string;
  name: string;
  color: string;
}

// タイムライン設定の型定義
export interface TimelineSettings {
  startDate: Date;
  endDate: Date;
  zoomLevel: number;
}

/**
 * プロジェクトの状態を表す型
 */
export type ProjectStatus = "active" | "archived" | "template";

/**
 * プロジェクトのメタデータ
 */
export interface ProjectMetadata {
  version: string;
  tags?: string[];
  genre?: string[];
  targetAudience?: string;
  wordCountGoal?: number;
  status: ProjectStatus;
  lastBackupDate?: string;
}

/**
 * タイムラインイベントの重要度 (project.ts オリジナル)
 */
export type EventImportance = 1 | 2 | 3 | 4 | 5;

/**
 * 章の状態 (project.ts オリジナル)
 */
export type ChapterStatus = "draft" | "inProgress" | "review" | "completed";

/**
 * セクション（章の中の小見出し） (project.ts オリジナル)
 */
export interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
}

/**
 * 世界観要素の基本型定義
 */
export interface BaseWorldBuildingElement {
  id: string;
  name: string;
  type: string;
  originalType: string;
  description: string;
  features: string;
  importance: string;
  relations: string;
}

/**
 * ワールドマップの型定義
 */
export interface WorldmapElement extends BaseWorldBuildingElement {
  img: string;
}

/**
 * 世界観設定の型定義
 */
export interface SettingElement {
  id: string;
  name: string;
  description: string;
  history: string;
}

/**
 * ルール要素の型定義
 */
export interface RuleElement extends BaseWorldBuildingElement {
  description: string;
  exceptions: string;
  origin: string;
  impact?: string;
  limitations?: string;
}

/**
 * 場所要素の型定義
 */
export interface PlaceElement extends BaseWorldBuildingElement {
  location: string;
  population: string;
  culturalFeatures: string;
}

/**
 * 社会・文化要素の型定義
 */
export interface CultureElement extends BaseWorldBuildingElement {
  customText: string;
  beliefs: string;
  history: string;
  socialStructure: string;
  values: string[];
  customs: string[];
  government?: string;
  religion?: string;
  language?: string;
  art?: string;
  technology?: string;
  notes?: string;
  economy?: string;
  traditions?: string;
  education?: string;
}

/**
 * 地理・環境要素の型定義
 */
export interface GeographyEnvironmentElement extends BaseWorldBuildingElement {
  name: string;
}

/**
 * 歴史・伝説要素の型定義
 */
export interface HistoryLegendElement extends BaseWorldBuildingElement {
  name: string;
  description: string;
  features: string;
  importance: string;
  period: string;
  significantEvents: string;
  consequences: string;
  relations: string;
}

/**
 * 魔法・技術要素の型定義
 */
export interface MagicTechnologyElement extends BaseWorldBuildingElement {
  name: string;
  description: string;
  features: string;
  importance: string;
  functionality: string;
  development: string;
  impact: string;
  relations: string;
}

/**
 * 自由記述要素の型定義
 */
export interface FreeFieldElement extends BaseWorldBuildingElement {
  name: string;
  description: string;
  features: string;
  importance: string;
  relations: string;
}

/**
 * 状態定義要素の型定義
 */
export interface StateDefinitionElement extends BaseWorldBuildingElement {
  name: string;
  description: string;
  features: string;
  importance: string;
  relations: string;
}

/**
 * 世界観構築要素のUnion型
 */
export type WorldBuildingElement =
  | WorldmapElement
  | SettingElement
  | RuleElement
  | PlaceElement
  | CultureElement
  | GeographyEnvironmentElement
  | HistoryLegendElement
  | MagicTechnologyElement
  | FreeFieldElement
  | StateDefinitionElement;

/**
 * 世界観構築要素のタイプのEnum（文字列リテラルユニオンの代替）
 */
export enum WorldBuildingElementType {
  WORLDMAP = "worldmap",
  SETTING = "setting",
  RULE = "rule",
  PLACE = "place",
  CULTURE = "culture",
  GEOGRAPHY_ENVIRONMENT = "geography_environment",
  HISTORY_LEGEND = "history_legend",
  MAGIC_TECHNOLOGY = "magic_technology",
  STATE_DEFINITION = "state_definition",
  FREE_FIELD = "free_field",
}

/**
 * @deprecated Use specific element types instead. This is a legacy type.
 * 世界観構築要素の共通プロパティ（古い定義の可能性あり、要レビュー）
 */
export interface WorldBuildingCommonProps {
  id: string;
  name: string;
  type: string; // 例: 'place', 'rule', 'culture'
  description: string;
  importance: string; // 例: 'High', 'Medium', 'Low'
  // fields can be either an array of CustomField or a nested structure
  fields: CustomField[] | { [key: string]: CustomField | CustomField[] };
  relations?: string; // 関連する他の要素のIDや説明
  img?: string; // 画像URL
}

// 世界観タブのカテゴリ定義
export interface WorldBuildingCategory {
  id: string;
  label: string;
  description?: string;
  iconName?: string; // Material UIのアイコン名など
  index: number;
}

export type WorldBuildingFreeField = {
  id: string;
  name: string;
  description: string;
  importance: string;
  relations: string;
  type: "freeField";
  img?: string;
  customFields?: Record<string, string>;
  title?: string;
  content?: string;
};

export type WorldBuildingRule = {
  id: string;
  name: string;
  description: string;
  category: string; // "魔法の法則", "物理法則", "社会規範" など
  details: string; // 詳細な説明や具体例
  type: "rule";
  img?: string; // 画像URL
};

export type WorldBuildingCustomElement = {
  id: string;
  name: string; // 要素名
  category: string; // カスタムカテゴリ名
  description: string; // 要素の説明
  fields: Record<string, string>; // 自由なキーと値のペア
  type: "custom";
  img?: string; // 画像URL
};

export const worldBuildingCategories: WorldBuildingCategory[] = [
  { id: "worldmap", label: "ワールドマップ", index: 0, iconName: "Map" },
  { id: "setting", label: "世界観設定", index: 1, iconName: "Public" },
  { id: "rule", label: "ルール", index: 2, iconName: "Gavel" },
  { id: "place", label: "地名", index: 3, iconName: "Place" },
  { id: "culture", label: "社会と文化", index: 4, iconName: "Diversity3" },
  {
    id: "geography_environment",
    label: "地理と環境",
    index: 5,
    iconName: "Terrain",
  },
  {
    id: "history_legend",
    label: "歴史と伝説",
    index: 6,
    iconName: "HistoryEdu",
  },
  {
    id: "magic_technology",
    label: "魔法と技術",
    index: 7,
    iconName: "Science",
  },
  {
    id: "state_definition",
    label: "状態定義",
    index: 8,
    iconName: "SettingsApplications",
  },
  {
    id: "free_field",
    label: "自由記述欄",
    index: 9,
    iconName: "Description",
  },
];

// カテゴリIDに基づいて順序付けされたカテゴリリストを取得するヘルパー関数
export const getOrderedCategories = (): WorldBuildingCategory[] => {
  return worldBuildingCategories.sort((a, b) => a.index - b.index);
};

// カテゴリIDからカテゴリ情報を取得するヘルパー関数
export const getCategoryById = (
  id: string
): WorldBuildingCategory | undefined => {
  return worldBuildingCategories.find((category) => category.id === id);
};

// カテゴリIDからタブのインデックスを取得するヘルパー関数
export const getCategoryTabIndex = (categoryId: string): number => {
  const category = getCategoryById(categoryId);
  return category ? category.index : -1; // 見つからない場合は -1 を返す
};

// 世界観要素のデータ型（AI生成やフォーム入力用）
export interface WorldBuildingElementData {
  id?: string;
  name: string;
  type?: string;
  originalType?: string;
  description?: string;
  features?: string;
  importance?: string;
  significance?: string; //重要性と類似しているが、より物語上の「意義」を強調する場合など
  location?: string;
  population?: string;
  culturalFeatures?: string;
  customText?: string; // 文字列型のcustoms
  beliefs?: string;
  history?: string;
  // rule
  impact?: string;
  exceptions?: string;
  origin?: string;
  // history_legend
  period?: string;
  significantEvents?: string;
  consequences?: string;
  moralLesson?: string;
  characters?: string; // 関連キャラクター
  // magic_technology
  functionality?: string;
  development?: string;
  // system?: string; // 体系や原理など
  limitations?: string;
  practitioners?: string; // 使用者や研究者
  // culture
  // beliefs?: string; //信仰や価値観
  // practices?: string; //習慣や儀式
  // socialStructure?: string; //社会構造
  deities?: string; // 神々や信仰対象
  practices?: string; // 習慣、儀式 (cultureのbeliefsと重複の可能性あり。整理が必要)
  occasion?: string; //出来事、行事
  participants?: string; //参加者
  // geography_environment
  terrain?: string; //地形
  resources?: string; //資源
  conditions?: string; //気候条件など
  seasons?: string; //季節
  // language (未使用だが将来的に検討)
  speakers?: string; //話者
  characteristics?: string; //言語的特徴
  writingSystem?: string; //書記体系
  // artifact (未使用だが将来的に検討)
  attributes?: string; //特性や能力
  socialStructure?: string; // valuesの重複。整理が必要
  values?: string[];
  customsArray?: string[]; // 配列型のcustoms
  // relationsはBaseWorldBuildingElementにあるが、より詳細な構造も許容するため再定義
  rawData?: WorldBuildingElement | Record<string, unknown> | undefined; // AIが生成した生データなど
  relations?: string | { name: string; description: string }[];
  img?: string;
}

/**
 * 指定されたタイプの型付き世界観構築要素オブジェクトを作成します。
 * AIからのレスポンスなど、型が曖昧なデータを安全に型付けするために使用できます。
 * @param type 要素のタイプ (WorldBuildingElementType)
 * @param data 要素のデータ (WorldBuildingElementData)
 * @returns 型付けされた世界観構築要素オブジェクト
 * @throws 無効なタイプが指定された場合にエラーをスロー
 */
export function createTypedWorldBuildingElement(
  type: string, // ここは WorldBuildingElementType の方がより厳密ですが、呼び出し元での柔軟性を考慮
  data: WorldBuildingElementData
): WorldBuildingElement {
  const baseElement: Omit<BaseWorldBuildingElement, "id" | "type"> = {
    name: data.name || "名称未設定",
    originalType: data.originalType || type,
    description: data.description || "",
    features: data.features || "",
    importance: data.importance || data.significance || "不明",
    relations: typeof data.relations === "string" ? data.relations : "", // TODO: relationsのオブジェクト型対応
  };

  const id = data.id!;

  switch (type) {
    case WorldBuildingElementType.WORLDMAP:
      return {
        ...baseElement,
        id,
        type: WorldBuildingElementType.WORLDMAP,
        img: data.img || "",
      } as WorldmapElement;
    case WorldBuildingElementType.SETTING:
      return {
        id,
        name: data.name || "設定名未設定",
        description: data.description || "",
        history: data.history || "",
      } as SettingElement;
    case WorldBuildingElementType.RULE:
      return {
        ...baseElement,
        id,
        type: WorldBuildingElementType.RULE,
        description: data.description || "", // RuleElementではdescriptionが必須なので上書き
        exceptions: data.exceptions || "",
        origin: data.origin || "",
      } as RuleElement;
    case WorldBuildingElementType.PLACE:
      return {
        ...baseElement,
        id,
        type: WorldBuildingElementType.PLACE,
        location: data.location || "",
        population: data.population || "",
        culturalFeatures: data.culturalFeatures || "",
      } as PlaceElement;
    case WorldBuildingElementType.CULTURE:
      return {
        ...baseElement,
        id,
        type: WorldBuildingElementType.CULTURE,
        customText: data.customText || "",
        beliefs: data.beliefs || "",
        history: data.history || "",
        socialStructure: data.socialStructure || "",
        values: Array.isArray(data.values) ? data.values : [],
        customs: Array.isArray(data.customsArray) ? data.customsArray : [],
      } as CultureElement;
    case WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT:
      return {
        ...baseElement,
        id,
        type: WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT,
        name: data.name || "地理環境名未設定", // GeographyEnvironmentElementではnameが必須なので上書き
      } as GeographyEnvironmentElement;
    case WorldBuildingElementType.HISTORY_LEGEND:
      return {
        ...baseElement,
        id,
        type: WorldBuildingElementType.HISTORY_LEGEND,
        period: data.period || "",
        significantEvents: data.significantEvents || "",
        consequences: data.consequences || "",
      } as HistoryLegendElement;
    case WorldBuildingElementType.MAGIC_TECHNOLOGY:
      return {
        ...baseElement,
        id,
        type: WorldBuildingElementType.MAGIC_TECHNOLOGY,
        functionality: data.functionality || "",
        development: data.development || "",
        impact: data.impact || data.description || "", // impactがない場合はdescriptionで代替
      } as MagicTechnologyElement;
    case WorldBuildingElementType.FREE_FIELD:
      return {
        ...baseElement,
        id,
        type: WorldBuildingElementType.FREE_FIELD,
      } as FreeFieldElement;
    case WorldBuildingElementType.STATE_DEFINITION: // 実際にはSTATE_DEFINITIONはBaseWorldBuildingElementと同じ構造なので特別なフィールドはない
      return {
        ...baseElement,
        id,
        type: WorldBuildingElementType.STATE_DEFINITION,
      } as StateDefinitionElement;
    default:
      // 未知のタイプや基本タイプで処理できない場合は、警告を出しつつ汎用的なオブジェクトを返すかエラーをスロー
      // console.warn(`Unsupported WorldBuildingElementType: ${type}`);
      // 安全策として、FreeFieldElementのような汎用的な型で返すか、エラーをスローするか検討
      // ここではエラーをスローする例
      throw new Error(`Unsupported WorldBuildingElementType: ${type}`);
  }
}

// AIリクエスト・レスポンスの標準形式定義
export type AIModelType =
  | "openai"
  | "anthropic"
  | "gemini"
  | "mistral"
  | "ollama";

export type AIDataFormat = "text" | "json" | "yaml";

// AIリクエストの標準インターフェース
export interface StandardAIRequest {
  requestId?: string;
  requestType?: string; // 例: "worldbuilding-list", "character-generation", "timeline-event-generation"
  userPrompt: string;
  systemPrompt?: string;
  model?: string; // 例: "gpt-4o", "claude-3-opus-20240229"
  context?: {
    // リクエストの文脈情報 (プロジェクトID、現在のキャラクターリストなど)
    projectId?: string;
    [key: string]: unknown; // 柔軟性のため any から unknown へ変更
  };
  options?: {
    temperature?: number;
    maxTokens?: number;
    responseFormat?: AIDataFormat; // "json", "yaml", "text"
    timeout?: number; // ミリ秒
    // その他モデル固有オプション
    [key: string]: unknown; // 柔軟性のため any から unknown へ変更
  };
}

// AIレスポンスの標準インターフェース
export interface StandardAIResponse {
  requestId: string;
  timestamp: string; // ISO 8601形式
  status: "success" | "error" | "partial"; // ステータス
  responseFormat: AIDataFormat; // レスポンス形式
  content: unknown | null; // パースされたレスポンスデータ (JSONオブジェクト、YAMLオブジェクト、テキストなど) any から unknown へ変更
  rawContent?: string; // AIからの生のレスポンス文字列
  error?: AIError | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  debug?: {
    model?: string;
    requestType?: string;
    processingTime?: number; // ミリ秒
    // その他デバッグ情報
    [key: string]: unknown; // 柔軟性のため any から unknown へ変更
  };
}

// AIエラーの型定義 (ユーザー指定のものをベースに作成)
export interface AIError {
  code: string; // 例: "VALIDATION_ERROR", "API_ERROR", "TIMEOUT"
  message: string;
  details?: unknown; // any から unknown へ変更
}

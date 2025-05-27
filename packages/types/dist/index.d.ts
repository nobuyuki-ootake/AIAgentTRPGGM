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
export interface PlotElement {
    id: string;
    title: string;
    description: string;
    order: number;
    status: "決定" | "検討中";
}
export interface CharacterTrait {
    id: string;
    name: string;
    value: string;
}
export interface Relationship {
    id: string;
    targetCharacterId: string;
    type: string;
    description: string;
}
export interface CharacterStatus {
    id: string;
    name: string;
    type: "life" | "abnormal" | "custom";
    mobility: "normal" | "slow" | "impossible";
    description?: string;
}
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
export type CharacterRoleType = "protagonist" | "antagonist" | "supporting";
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
export interface WorldBuilding {
    id: string;
    setting: string;
    worldmaps: WorldmapElement[];
    settings: SettingElement[];
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
    description?: string;
}
export interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    relatedCharacters: string[];
    relatedPlaces: string[];
    order: number;
    eventType?: string;
    postEventCharacterStatuses?: {
        [characterId: string]: CharacterStatus[];
    };
    relatedPlotIds?: string[];
    placeId?: string;
}
export interface TimelineEventSeed {
    id: string;
    eventName: string;
    relatedPlaceIds?: string[];
    characterIds?: string[];
    relatedPlotIds?: string[];
    estimatedTime?: string;
    description?: string;
    relatedPlotTitles?: string[];
}
export interface Chapter {
    id: string;
    title: string;
    synopsis?: string;
    content: Descendant[];
    order: number;
    scenes: Scene[];
    relatedEvents?: string[];
    manuscriptPages?: string[];
    status?: ChapterStatus;
}
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
export interface Feedback {
    id: string;
    type: "critique" | "suggestion" | "reaction";
    content: string;
    targetId?: string;
    targetType?: "chapter" | "scene" | "character" | "plot" | "entire";
    createdAt: Date;
}
export interface CustomField {
    id: string;
    name: string;
    value: string;
}
export interface TimelineGroup {
    id: string;
    name: string;
    color: string;
}
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
export interface SettingElement extends BaseWorldBuildingElement {
    img: string;
    category?: string;
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
export type WorldBuildingElement = WorldmapElement | SettingElement | RuleElement | PlaceElement | CultureElement | GeographyEnvironmentElement | HistoryLegendElement | MagicTechnologyElement | FreeFieldElement | StateDefinitionElement;
/**
 * 世界観構築要素のタイプのEnum（文字列リテラルユニオンの代替）
 */
export declare enum WorldBuildingElementType {
    WORLDMAP = "worldmap",
    SETTING = "setting",
    RULE = "rule",
    PLACE = "place",
    CULTURE = "culture",
    GEOGRAPHY_ENVIRONMENT = "geography_environment",
    HISTORY_LEGEND = "history_legend",
    MAGIC_TECHNOLOGY = "magic_technology",
    STATE_DEFINITION = "state_definition",
    FREE_FIELD = "free_field"
}
/**
 * @deprecated Use specific element types instead. This is a legacy type.
 * 世界観構築要素の共通プロパティ（古い定義の可能性あり、要レビュー）
 */
export interface WorldBuildingCommonProps {
    id: string;
    name: string;
    type: string;
    description: string;
    importance: string;
    fields: CustomField[] | {
        [key: string]: CustomField | CustomField[];
    };
    relations?: string;
    img?: string;
}
export interface WorldBuildingCategory {
    id: string;
    label: string;
    description?: string;
    iconName?: string;
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
    category: string;
    details: string;
    type: "rule";
    img?: string;
};
export type WorldBuildingCustomElement = {
    id: string;
    name: string;
    category: string;
    description: string;
    fields: Record<string, string>;
    type: "custom";
    img?: string;
};
export declare const worldBuildingCategories: WorldBuildingCategory[];
export declare const getOrderedCategories: () => WorldBuildingCategory[];
export declare const getCategoryById: (id: string) => WorldBuildingCategory | undefined;
export declare const getCategoryTabIndex: (categoryId: string) => number;
export interface WorldBuildingElementData {
    id?: string;
    name: string;
    type?: string;
    originalType?: string;
    description?: string;
    features?: string;
    importance?: string;
    significance?: string;
    location?: string;
    population?: string;
    culturalFeatures?: string;
    customText?: string;
    beliefs?: string;
    history?: string;
    impact?: string;
    exceptions?: string;
    origin?: string;
    period?: string;
    significantEvents?: string;
    consequences?: string;
    moralLesson?: string;
    characters?: string;
    functionality?: string;
    development?: string;
    limitations?: string;
    practitioners?: string;
    deities?: string;
    practices?: string;
    occasion?: string;
    participants?: string;
    terrain?: string;
    resources?: string;
    conditions?: string;
    seasons?: string;
    speakers?: string;
    characteristics?: string;
    writingSystem?: string;
    attributes?: string;
    socialStructure?: string;
    values?: string[];
    customsArray?: string[];
    rawData?: WorldBuildingElement | Record<string, unknown> | undefined;
    relations?: string | {
        name: string;
        description: string;
    }[];
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
export declare function createTypedWorldBuildingElement(type: string, // ここは WorldBuildingElementType の方がより厳密ですが、呼び出し元での柔軟性を考慮
data: WorldBuildingElementData): WorldBuildingElement;
export type AIModelType = "openai" | "anthropic" | "gemini" | "mistral" | "ollama";
export type AIDataFormat = "text" | "json" | "yaml";
export interface StandardAIRequest {
    requestId?: string;
    requestType?: string;
    userPrompt: string;
    systemPrompt?: string;
    model?: string;
    context?: {
        projectId?: string;
        [key: string]: unknown;
    };
    options?: {
        temperature?: number;
        maxTokens?: number;
        responseFormat?: AIDataFormat;
        timeout?: number;
        [key: string]: unknown;
    };
}
export interface StandardAIResponse {
    requestId: string;
    timestamp: string;
    status: "success" | "error" | "partial";
    responseFormat: AIDataFormat;
    content: unknown | null;
    rawContent?: string;
    error?: AIError | null;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    debug?: {
        model?: string;
        requestType?: string;
        processingTime?: number;
        [key: string]: unknown;
    };
}
export interface AIError {
    code: string;
    message: string;
    details?: unknown;
}
//# sourceMappingURL=index.d.ts.map
// イベントタイプ変換ヘルパー関数
export const convertEventType = {
    // 小説 → TRPG イベントタイプ変換
    novelToTRPG: (novelType) => {
        switch (novelType) {
            case 'battle': return 'combat';
            case 'dialogue': return 'roleplay';
            case 'journey': return 'exploration';
            case 'mystery': return 'puzzle';
            case 'discovery': return 'discovery';
            case 'rest': return 'rest';
            case 'turning_point': return 'social';
            case 'info': return 'social';
            case 'setup': return 'social';
            case 'celebration': return 'social';
            case 'other': return 'other';
            default: return 'social';
        }
    },
    // TRPG → 小説 イベントタイプ変換
    trpgToNovel: (trpgType) => {
        switch (trpgType) {
            case 'combat': return 'battle';
            case 'roleplay': return 'dialogue';
            case 'exploration': return 'journey';
            case 'puzzle': return 'mystery';
            case 'social': return 'info';
            case 'discovery': return 'discovery';
            case 'rest': return 'rest';
            default: return 'other';
        }
    }
};
// レガシーTimelineEventをUnifiedEventに変換
export const convertTimelineToUnified = (timeline) => {
    return {
        id: timeline.id,
        title: timeline.title,
        description: timeline.description,
        // 時間情報の変換
        date: timeline.date,
        dayNumber: timeline.dayNumber,
        sessionDay: timeline.sessionDay || 1,
        sessionTime: timeline.sessionTime || timeline.date,
        // 基本情報
        relatedCharacters: timeline.relatedCharacters || [],
        relatedPlaces: timeline.relatedPlaces || [],
        order: timeline.order || 0,
        // イベントタイプ変換
        eventType: timeline.eventType || 'other',
        // 結果・状態
        outcome: timeline.outcome,
        postEventCharacterStatuses: timeline.postEventCharacterStatuses,
        // 関連要素（plot → quest変換）
        relatedQuestIds: timeline.relatedQuestIds || timeline.relatedPlotIds || [],
        placeId: timeline.placeId,
        // 報酬・結果
        experienceAwarded: timeline.experienceAwarded,
        lootGained: timeline.lootGained,
        results: timeline.results,
        conditions: timeline.conditions,
    };
};
// レガシーSessionEventをUnifiedEventに変換
export const convertSessionToUnified = (session) => {
    return {
        id: session.id,
        title: session.title,
        description: session.description,
        // 時間情報の変換
        sessionDay: session.sessionDay || 1,
        sessionTime: session.sessionTime,
        date: session.date,
        dayNumber: session.dayNumber,
        // 基本情報
        relatedCharacters: session.relatedCharacters || [],
        relatedPlaces: session.relatedPlaces || [],
        order: session.order || 0,
        // イベントタイプ
        eventType: session.eventType || 'other',
        // 結果・状態
        outcome: session.outcome,
        postEventCharacterStatuses: session.postEventCharacterStatuses,
        // 関連要素
        relatedQuestIds: session.relatedQuestIds || [],
        placeId: session.placeId,
        // 報酬・結果
        experienceAwarded: session.experienceAwarded,
        lootGained: session.lootGained,
        results: session.results,
        conditions: session.conditions,
    };
};
/**
 * 世界観構築要素のタイプのEnum（文字列リテラルユニオンの代替）
 */
/**
 * @deprecated PlaceManagementCategoryを使用してください
 */
export var WorldBuildingElementType;
(function (WorldBuildingElementType) {
    WorldBuildingElementType["WORLDMAP"] = "worldmap";
    WorldBuildingElementType["SETTING"] = "setting";
    WorldBuildingElementType["RULE"] = "rule";
    WorldBuildingElementType["PLACE"] = "place";
    WorldBuildingElementType["CULTURE"] = "culture";
    WorldBuildingElementType["GEOGRAPHY_ENVIRONMENT"] = "geography_environment";
    WorldBuildingElementType["HISTORY_LEGEND"] = "history_legend";
    WorldBuildingElementType["MAGIC_TECHNOLOGY"] = "magic_technology";
    WorldBuildingElementType["STATE_DEFINITION"] = "state_definition";
    WorldBuildingElementType["FREE_FIELD"] = "free_field";
})(WorldBuildingElementType || (WorldBuildingElementType = {}));
export const worldBuildingCategories = [
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
export const getOrderedCategories = () => {
    return worldBuildingCategories.sort((a, b) => a.index - b.index);
};
// カテゴリIDからカテゴリ情報を取得するヘルパー関数
export const getCategoryById = (id) => {
    return worldBuildingCategories.find((category) => category.id === id);
};
// カテゴリIDからタブのインデックスを取得するヘルパー関数
export const getCategoryTabIndex = (categoryId) => {
    const category = getCategoryById(categoryId);
    return category ? category.index : -1; // 見つからない場合は -1 を返す
};
/**
 * 指定されたタイプの型付き世界観構築要素オブジェクトを作成します。
 * AIからのレスポンスなど、型が曖昧なデータを安全に型付けするために使用できます。
 * @param type 要素のタイプ (WorldBuildingElementType)
 * @param data 要素のデータ (WorldBuildingElementData)
 * @returns 型付けされた世界観構築要素オブジェクト
 * @throws 無効なタイプが指定された場合にエラーをスロー
 */
/**
 * @deprecated PlaceManagement系の関数を使用してください
 */
export function createTypedWorldBuildingElement(type, // ここは WorldBuildingElementType の方がより厳密ですが、呼び出し元での柔軟性を考慮
data) {
    const baseElement = {
        name: data.name || "名称未設定",
        originalType: data.originalType || type,
        description: data.description || "",
        features: data.features || "",
        importance: data.importance || data.significance || "不明",
        relations: typeof data.relations === "string" ? data.relations : "", // TODO: relationsのオブジェクト型対応
    };
    const id = data.id;
    switch (type) {
        case WorldBuildingElementType.WORLDMAP:
            return {
                ...baseElement,
                id,
                type: WorldBuildingElementType.WORLDMAP,
                img: data.img || "",
            };
        case WorldBuildingElementType.SETTING:
            return {
                id,
                name: data.name || "設定名未設定",
                description: data.description || "",
                history: data.history || "",
            };
        case WorldBuildingElementType.RULE:
            return {
                ...baseElement,
                id,
                type: WorldBuildingElementType.RULE,
                description: data.description || "", // RuleElementではdescriptionが必須なので上書き
                exceptions: data.exceptions || "",
                origin: data.origin || "",
            };
        case WorldBuildingElementType.PLACE:
            return {
                ...baseElement,
                id,
                type: WorldBuildingElementType.PLACE,
                location: data.location || "",
                population: data.population || "",
                culturalFeatures: data.culturalFeatures || "",
            };
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
            };
        case WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT:
            return {
                ...baseElement,
                id,
                type: WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT,
                name: data.name || "地理環境名未設定", // GeographyEnvironmentElementではnameが必須なので上書き
            };
        case WorldBuildingElementType.HISTORY_LEGEND:
            return {
                ...baseElement,
                id,
                type: WorldBuildingElementType.HISTORY_LEGEND,
                period: data.period || "",
                significantEvents: data.significantEvents || "",
                consequences: data.consequences || "",
            };
        case WorldBuildingElementType.MAGIC_TECHNOLOGY:
            return {
                ...baseElement,
                id,
                type: WorldBuildingElementType.MAGIC_TECHNOLOGY,
                functionality: data.functionality || "",
                development: data.development || "",
                impact: data.impact || data.description || "", // impactがない場合はdescriptionで代替
            };
        case WorldBuildingElementType.FREE_FIELD:
            return {
                ...baseElement,
                id,
                type: WorldBuildingElementType.FREE_FIELD,
            };
        case WorldBuildingElementType.STATE_DEFINITION: // 実際にはSTATE_DEFINITIONはBaseWorldBuildingElementと同じ構造なので特別なフィールドはない
            return {
                ...baseElement,
                id,
                type: WorldBuildingElementType.STATE_DEFINITION,
            };
        default:
            // 未知のタイプや基本タイプで処理できない場合は、警告を出しつつ汎用的なオブジェクトを返すかエラーをスロー
            // console.warn(`Unsupported WorldBuildingElementType: ${type}`);
            // 安全策として、FreeFieldElementのような汎用的な型で返すか、エラーをスローするか検討
            // ここではエラーをスローする例
            throw new Error(`Unsupported WorldBuildingElementType: ${type}`);
    }
}
//# sourceMappingURL=index.js.map
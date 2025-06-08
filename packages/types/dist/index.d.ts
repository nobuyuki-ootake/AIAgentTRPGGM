import type { Descendant } from "slate";
export interface TRPGCampaign {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    gameSystem: string;
    gamemaster: string;
    players: Player[];
    synopsis: string;
    plot: QuestElement[];
    characters: TRPGCharacter[];
    worldBuilding: WorldBuilding;
    timeline: SessionEvent[];
    sessions: GameSession[];
    enemies: EnemyCharacter[];
    npcs: NPCCharacter[];
    bases: BaseLocation[];
    rules: CampaignRule[];
    handouts: Handout[];
    feedback: Feedback[];
    definedCharacterStatuses?: CharacterStatus[];
    metadata?: CampaignMetadata;
    notes?: {
        id: string;
        title: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        tags?: string[];
    }[];
    imageUrl?: string;
    startingLocation?: StartingLocationInfo;
}
export interface Player {
    id: string;
    name: string;
    email?: string;
    characterIds: string[];
    isOnline?: boolean;
    lastSeen?: Date;
}
export interface QuestElement {
    id: string;
    title: string;
    description: string;
    order: number;
    status: "未開始" | "進行中" | "完了" | "失敗" | "保留";
    questType: "メイン" | "サブ" | "個人" | "隠し";
    difficulty: 1 | 2 | 3 | 4 | 5;
    rewards?: string[];
    prerequisites?: string[];
    sessionId?: string;
    relatedCharacterIds?: string[];
    relatedPlaceIds?: string[];
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
export interface CharacterStats {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    hitPoints: {
        current: number;
        max: number;
        temp: number;
    };
    manaPoints?: {
        current: number;
        max: number;
    };
    armorClass: number;
    speed: number;
    level: number;
    experience: number;
    proficiencyBonus?: number;
}
export interface Equipment {
    id: string;
    name: string;
    type: "weapon" | "armor" | "accessory" | "consumable" | "tool" | "misc";
    description?: string;
    quantity: number;
    weight?: number;
    value?: number;
    equipped?: boolean;
    enchantments?: string[];
}
export interface Skill {
    id: string;
    name: string;
    type: "skill" | "spell" | "ability";
    description: string;
    level?: number;
    cost?: string;
    damage?: string;
    range?: string;
    duration?: string;
    cooldown?: number;
}
export interface CharacterProgression {
    id: string;
    sessionId: string;
    date: Date;
    description: string;
    experienceGained: number;
    levelUp?: boolean;
    newSkills?: string[];
    statChanges?: Partial<CharacterStats>;
}
export interface TRPGCharacter {
    id: string;
    name: string;
    characterType: "PC" | "NPC";
    profession: string;
    gender: string;
    age: number;
    nation: string;
    religion: string;
    player: string;
    description: string;
    scars?: string;
    attributes: {
        STR: number;
        CON: number;
        SIZ: number;
        INT: number;
        POW: number;
        DEX: number;
        CHA: number;
    };
    derived: {
        HP: number;
        MP: number;
        SW: number;
        RES: number;
    };
    weapons: StormbringerWeapon[];
    armor: {
        head: number;
        body: number;
        leftArm: number;
        rightArm: number;
        leftLeg: number;
        rightLeg: number;
    };
    skills: {
        AgilitySkills: StormbringerSkill[];
        CommunicationSkills: StormbringerSkill[];
        KnowledgeSkills: StormbringerSkill[];
        ManipulationSkills: StormbringerSkill[];
        PerceptionSkills: StormbringerSkill[];
        StealthSkills: StormbringerSkill[];
        MagicSkills: StormbringerSkill[];
        WeaponSkills: StormbringerSkill[];
    };
    imageUrl?: string;
    campaignId?: string;
    created_at?: string;
    updated_at?: string;
}
export interface StormbringerWeapon {
    name: string;
    attack: number;
    damage: string;
    hit: number;
    parry: number;
    range: string;
}
export interface StormbringerSkill {
    name: string;
    value: number;
}
export interface PlayerCharacter extends TRPGCharacter {
    characterType: "PC";
    backstory: string;
    goals: string[];
    bonds: string[];
    flaws: string[];
    ideals: string[];
    currentHP?: number;
    currentMP?: number;
}
export interface NPCCharacter extends TRPGCharacter {
    characterType: "NPC";
    location?: string;
    occupation?: string;
    attitude: "friendly" | "neutral" | "hostile" | "unknown";
    knowledge?: string[];
    services?: string[];
    questIds?: string[];
    dialoguePatterns?: string[];
}
export interface EnemyCharacter {
    id: string;
    name: string;
    rank: "モブ" | "中ボス" | "ボス" | "EXボス";
    type: string;
    description: string;
    level: number;
    attributes: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
    };
    derivedStats: {
        hp: number;
        mp: number;
        attack: number;
        defense: number;
        magicAttack: number;
        magicDefense: number;
        accuracy: number;
        evasion: number;
        criticalRate: number;
        initiative: number;
    };
    skills: {
        basicAttack: string;
        specialSkills: SpecialSkill[];
        passives: string[];
    };
    behavior: {
        aiPattern: string;
        targeting: string;
    };
    drops: {
        exp: number;
        gold: number;
        items: string[];
        rareDrops: string[];
    };
    status: {
        currentHp: number;
        currentMp: number;
        statusEffects: string[];
        location: string;
    };
    imageUrl?: string;
    campaignId?: string;
    created_at?: string;
    updated_at?: string;
}
export interface SpecialSkill {
    name: string;
    effect: string;
    cooldown?: number;
    cost?: string;
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
}
export interface GameSession {
    id: string;
    campaignId: string;
    sessionNumber: number;
    title: string;
    date: Date;
    duration: number;
    attendees?: string[];
    gamemaster?: string;
    synopsis?: string;
    content?: Descendant[];
    events?: SessionEvent[];
    combats?: CombatEncounter[];
    questsAdvanced?: string[];
    questsCompleted?: string[];
    experienceAwarded?: number;
    status?: "planned" | "inProgress" | "completed" | "cancelled";
    notes?: string;
    currentState: SessionCurrentState;
    spatialTracking: SpatialTrackingSystem;
    encounterHistory: EncounterRecord[];
}
export interface SessionCurrentState {
    currentDay: number;
    currentTimeOfDay: TimeOfDay;
    actionCount: number;
    maxActionsPerDay: number;
    currentLocation: string;
    currentLocationId?: string;
    coordinates?: Coordinates;
    activeCharacter: string;
    partyLocation: PartyLocationState;
    partyStatus: PartyStatus;
    activeEvents: string[];
    completedEvents: string[];
    triggeredEvents: TriggeredEvent[];
}
export type TimeOfDay = "morning" | "noon" | "afternoon" | "evening" | "night" | "late_night";
export interface EncounterChance {
    probability: number;
    type: string;
    description?: string;
}
export interface WeatherModifier {
    condition: string;
    modifier: number;
    effects: string[];
}
export interface ConditionalEvent {
    condition: string;
    event: string;
    probability: number;
}
export type ClimateType = "temperate" | "tropical" | "arctic" | "desert" | "mountain" | "coastal" | "magical";
export type TerrainType = "plains" | "forest" | "mountain" | "desert" | "swamp" | "urban" | "ruins" | "underground" | "aerial";
export interface WeatherPattern {
    season: string;
    conditions: string[];
    temperature: {
        min: number;
        max: number;
    };
    precipitation: number;
}
export interface Coordinates {
    x: number;
    y: number;
    z?: number;
    region?: string;
}
export interface PartyLocationState {
    groupLocation: string;
    memberLocations: {
        [characterId: string]: {
            location: string;
            coordinates?: Coordinates;
            timeArrived: string;
            isWithGroup: boolean;
        };
    };
    movementHistory: MovementRecord[];
}
export type PartyStatus = "exploring" | "resting" | "combat" | "shopping" | "dialogue" | "traveling";
export interface MovementRecord {
    characterId: string;
    fromLocation: string;
    toLocation: string;
    timestamp: Date;
    dayNumber: number;
    timeOfDay: TimeOfDay;
}
export interface TriggeredEvent {
    eventId: string;
    triggeredAt: Date;
    dayNumber: number;
    timeOfDay: TimeOfDay;
    location: string;
    triggerType: "scheduled" | "encounter" | "manual" | "ai_initiated";
    participants: string[];
    result?: "success" | "failure" | "ongoing" | "cancelled";
}
export interface SpatialTrackingSystem {
    currentPositions: {
        players: {
            [characterId: string]: PositionInfo;
        };
        npcs: {
            [npcId: string]: PositionInfo;
        };
        enemies: {
            [enemyId: string]: PositionInfo;
        };
    };
    collisionDetection: CollisionDetectionConfig;
    definedAreas: GameArea[];
    encounterRules: EncounterRule[];
}
export interface PositionInfo {
    location: string;
    coordinates?: Coordinates;
    arrivalTime: Date;
    dayNumber: number;
    timeOfDay: TimeOfDay;
    isActive: boolean;
    visibilityRange?: number;
    movementSpeed?: number;
}
export interface CollisionDetectionConfig {
    enableSpatialCollision: boolean;
    enableTemporalCollision: boolean;
    collisionRadius: number;
    timeWindow: number;
    automaticEncounters: boolean;
    encounterProbability: {
        npc: number;
        enemy: number;
        event: number;
    };
}
export interface GameArea {
    id: string;
    name: string;
    type: "safe" | "dangerous" | "neutral" | "special";
    boundaries?: Coordinates[];
    encounterModifiers: {
        npcMultiplier: number;
        enemyMultiplier: number;
        eventMultiplier: number;
    };
    restrictions?: string[];
}
export interface EncounterRule {
    id: string;
    name: string;
    conditions: EncounterCondition[];
    actions: EncounterAction[];
    priority: number;
    isActive: boolean;
}
export interface EncounterCondition {
    type: "location" | "time" | "character" | "event" | "probability";
    operator: "equals" | "contains" | "greater_than" | "less_than" | "in_range";
    value: any;
    characterId?: string;
}
export interface EncounterAction {
    type: "spawn_enemy" | "trigger_event" | "spawn_npc" | "force_dialogue" | "require_dice_roll";
    parameters: Record<string, any>;
    description: string;
}
export interface EncounterRecord {
    id: string;
    timestamp: Date;
    dayNumber: number;
    timeOfDay: TimeOfDay;
    location: string;
    encounterType: "npc_dialogue" | "enemy_combat" | "event_trigger" | "location_discovery" | "trap_activation";
    participants: {
        players: string[];
        npcs?: string[];
        enemies?: string[];
    };
    result: {
        outcome: "success" | "failure" | "escape" | "negotiation" | "ongoing";
        damageDealt?: number;
        damageReceived?: number;
        itemsGained?: string[];
        experienceGained?: number;
        questProgress?: Record<string, any>;
    };
    aiDecisions: {
        wasAIInitiated: boolean;
        difficultyCalculated: number;
        surpriseRound?: boolean;
        tacticalAdvantage?: "player" | "enemy" | "neutral";
    };
    description: string;
    tags: string[];
}
export interface SessionEvent {
    id: string;
    title: string;
    description: string;
    sessionDay: number;
    sessionTime?: string;
    relatedCharacters: string[];
    relatedPlaces: string[];
    order: number;
    eventType: "combat" | "roleplay" | "exploration" | "puzzle" | "social" | "discovery" | "rest";
    outcome?: "success" | "failure" | "partial" | "ongoing";
    postEventCharacterStatuses?: {
        [characterId: string]: CharacterStatus[];
    };
    relatedQuestIds?: string[];
    placeId?: string;
    experienceAwarded?: number;
    lootGained?: Equipment[];
}
export interface CombatEncounter {
    id: string;
    name: string;
    sessionId: string;
    participants: CombatParticipant[];
    round: number;
    status: "planning" | "active" | "completed";
    initiative: InitiativeOrder[];
    battlemap?: string;
    conditions?: CombatCondition[];
    summary?: string;
    experienceAwarded?: number;
    lootDropped?: Equipment[];
}
export interface CombatParticipant {
    characterId: string;
    characterType: "PC" | "NPC" | "Enemy";
    initiative: number;
    currentHP: number;
    maxHP: number;
    conditions: string[];
    position?: {
        x: number;
        y: number;
    };
}
export interface InitiativeOrder {
    characterId: string;
    initiative: number;
    hasActed: boolean;
}
export interface CombatCondition {
    name: string;
    description: string;
    duration: number;
    effects: string[];
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
export interface CampaignRule {
    id: string;
    name: string;
    category: "house_rule" | "variant" | "custom" | "clarification";
    description: string;
    details: string;
    appliesTo?: string[];
    isActive: boolean;
}
export interface Handout {
    id: string;
    title: string;
    content: string;
    type: "info" | "map" | "image" | "rules" | "quest" | "letter" | "other";
    isPublic: boolean;
    recipientIds?: string[];
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CampaignMetadata {
    version: string;
    tags?: string[];
    genre?: string[];
    difficulty: "beginner" | "intermediate" | "advanced" | "expert";
    estimatedSessions?: number;
    targetPlayers: {
        min: number;
        max: number;
    };
    status: CampaignStatus;
    lastBackupDate?: string;
    totalPlayTime?: number;
}
export type CampaignStatus = "planning" | "active" | "paused" | "completed" | "archived";
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
export interface BaseLocation {
    id: string;
    name: string;
    type: string;
    region: string;
    description: string;
    rank: string;
    importance: "主要拠点" | "サブ拠点" | "隠し拠点";
    facilities: {
        inn?: Inn;
        shops?: Shop[];
        armory?: Armory;
        temple?: Temple;
        guild?: Guild;
        blacksmith?: Blacksmith;
        otherFacilities?: OtherFacility[];
    };
    npcs: LocationNPC[];
    features: {
        fastTravel: boolean;
        playerBase: boolean;
        questHub: boolean;
        defenseEvent: boolean;
    };
    threats: {
        dangerLevel: string;
        monsterAttackRate: number;
        playerReputation: number;
        currentEvents: string[];
        controllingFaction: string;
    };
    economy: {
        currency: string;
        priceModifier: number;
        localGoods: string[];
        tradeGoods: string[];
    };
    availableActions?: {
        id: string;
        name: string;
        description: string;
        category: "exploration" | "social" | "shopping" | "training" | "rest" | "quest" | "custom";
        requirements?: string[];
        effects?: string[];
    }[];
    encounterRules?: {
        timeOfDay: Record<TimeOfDay, EncounterChance>;
        weatherEffects?: WeatherModifier[];
        specialEvents?: ConditionalEvent[];
    };
    npcSchedule?: {
        [npcId: string]: {
            availability: TimeOfDay[];
            services: string[];
            questTriggers: string[];
        };
    };
    culturalModifiers?: {
        negotiationDC: number;
        priceModifier: number;
        reputationImpact: number;
    };
    environmentalFactors?: {
        climate: ClimateType;
        terrain: TerrainType;
        weatherPatterns: WeatherPattern[];
        naturalHazards?: string[];
    };
    coordinates?: {
        lat: number;
        lng: number;
    };
    meta: {
        locationId: string;
        unlocked: boolean;
        lastUpdated: string;
    };
    imageUrl?: string;
    campaignId?: string;
    created_at?: string;
    updated_at?: string;
}
export interface Inn {
    name: string;
    pricePerNight: number;
    description?: string;
    services?: string[];
}
export interface Shop {
    name: string;
    type: string;
    items: string[];
    priceModifier: number;
    description?: string;
}
export interface Armory {
    name: string;
    weaponTypes: string[];
    armorTypes: string[];
    specialItems?: string[];
    description?: string;
}
export interface Temple {
    name: string;
    deity: string;
    functions: string[];
    donation?: number;
    description?: string;
}
export interface Guild {
    name: string;
    type: string;
    services: string[];
    membershipRequired?: boolean;
    description?: string;
}
export interface Blacksmith {
    name: string;
    services: string[];
    specialties?: string[];
    description?: string;
}
export interface OtherFacility {
    name: string;
    type: string;
    description: string;
    functions?: string[];
}
export interface LocationNPC {
    id: string;
    name: string;
    role: string;
    function: string;
    description?: string;
    questIds?: string[];
}
export interface CharacterInteraction {
    id: string;
    sourceCharacterId: string;
    targetCharacterId: string;
    interactionType: "heal" | "damage" | "statusEffect" | "buff" | "debuff" | "custom";
    value?: number;
    statusEffect?: string;
    duration?: number;
    description: string;
    timestamp: Date;
    sessionId?: string;
}
export interface StartingLocationInfo {
    id: string;
    name: string;
    type: "base" | "location";
    description?: string;
    imageUrl?: string;
    setAt: Date;
    isActive: boolean;
}
//# sourceMappingURL=index.d.ts.map
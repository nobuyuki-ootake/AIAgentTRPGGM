import type { Descendant } from "slate";

// TRPGキャンペーンの基本型定義
export interface TRPGCampaign {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  gameSystem: string; // D&D 5e, Pathfinder, Stormbringer, オリジナルなど
  gamemaster: string;
  players: Player[];
  synopsis: string; // キャンペーンの背景・あらすじ
  quests: QuestElement[]; // クエスト管理
  characters: TRPGCharacter[];
  worldBuilding: WorldBuilding;
  timeline: SessionEvent[]; // タイムライン → セッションイベントに変更
  sessions: GameSession[]; // 章 → セッションに変更
  enemies: EnemyCharacter[];
  npcs: NPCCharacter[];
  bases: BaseLocation[]; // 拠点システム追加
  items: Item[]; // アイテム管理システム
  itemLocations: ItemLocation[]; // アイテム入手場所
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
  imageUrl?: string; // キャンペーン画像
  startingLocation?: StartingLocationInfo; // ゲーム開始時の場所設定
  clearConditions?: ClearCondition[]; // キャンペーンクリア条件
  partyGold?: number; // パーティ共通の所持金
  partyInventory?: PartyInventoryItem[]; // パーティ共通のインベントリ
  campaignFlags?: Record<string, any>; // キャンペーンフラグ（ストーリー進行、条件判定用）
  milestones?: CampaignMilestone[]; // マイルストーン管理
  randomEventPools?: RandomEventPool[]; // ランダムイベントプール管理
}

// プレイヤーの型定義
export interface Player {
  id: string;
  name: string;
  email?: string;
  characterIds: string[]; // 操作するキャラクターのID
  isOnline?: boolean;
  lastSeen?: Date;
}

// クエスト要素の型定義（拡張版 - EnhancedQuest機能を統合）
export interface QuestElement {
  id: string;
  title: string;
  description: string;
  order: number;
  status: "未開始" | "進行中" | "完了" | "失敗" | "保留";
  questType: "メイン" | "サブ" | "個人" | "隠し";
  difficulty: 1 | 2 | 3 | 4 | 5; // 1=簡単, 5=非常に困難
  rewards?: string[]; // 報酬の説明
  prerequisites?: string[]; // 前提条件
  sessionId?: string; // 関連するセッションID
  relatedCharacterIds?: string[]; // 関連キャラクター
  relatedPlaceIds?: string[]; // 関連場所

  // EnhancedQuest機能の統合
  objectives?: QuestObjective[]; // クエスト目標
  detailedRewards?: {
    experience: number;
    items: string[];
    gold: number;
    reputation?: string;
  };
  discoveryConditions?: {
    npcId?: string;
    location?: string;
    itemRequired?: string;
    questboardAvailable: boolean;
  };
  timeLimit?: {
    days: number;
    consequences?: string;
  };
  priority?: "low" | "medium" | "high";
  giver?: string; // クエスト提供者
  notes?: string; // GM用メモ

  // 探索行動システム連携
  explorationActions?: ExplorationAction[]; // このクエストに関連する探索行動
  unlockConditions?: {
    itemsRequired?: string[]; // クエスト発見に必要なアイテム
    locationsRequired?: string[]; // クエスト発見に必要な場所
    prerequisiteQuests?: string[]; // 前提クエスト
    characterLevelRequired?: number; // 必要キャラクターレベル
  };
}

// クエスト目標の型定義
export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  hidden: boolean; // プレイヤーに見えるかどうか
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

// TRPGキャラクター基本ステータス
export interface CharacterStats {
  // 基本能力値
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  // HP/MP関連
  hitPoints: { current: number; max: number; temp: number };
  manaPoints?: { current: number; max: number };
  // その他ステータス
  armorClass: number;
  speed: number;
  level: number;
  experience: number;
  proficiencyBonus?: number;
}

// 装備アイテム
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

// スキル・呪文
export interface Skill {
  id: string;
  name: string;
  type: "skill" | "spell" | "ability";
  description: string;
  level?: number;
  cost?: string; // MP消費、材料など
  damage?: string;
  range?: string;
  duration?: string;
  cooldown?: number; // ターン数
}

// キャラクター進歩記録
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

// TRPGキャラクター（Stormbringerベース）
export interface TRPGCharacter {
  id: string;
  name: string;
  characterType: "PC" | "NPC";

  // 基本情報（Stormbringerベース）
  profession: string; // 職業
  gender: string; // 性別
  age: number; // 年齢
  nation: string; // 国籍
  religion: string; // 宗教
  player: string; // プレイヤー名

  // 身体的特徴と記述
  description: string; // 外見や特徴の記述
  scars?: string; // 傷跡などの自由記述

  // 能力値（Stormbringer）
  attributes: {
    STR: number; // Strength（筋力）
    CON: number; // Constitution（耐久力）
    SIZ: number; // Size（体格）
    INT: number; // Intelligence（知性）
    POW: number; // Power（魔力・意志力）
    DEX: number; // Dexterity（器用さ）
    CHA: number; // Charisma（魅力）
  };

  // 派生値
  derived: {
    HP: number; // ヒットポイント
    MP: number; // マジックポイント
    SW: number; // Strike Rank（先制値）
    RES: number; // 抵抗値
  };

  // 武器
  weapons: StormbringerWeapon[];

  // 装甲
  armor: {
    head: number;
    body: number;
    leftArm: number;
    rightArm: number;
    leftLeg: number;
    rightLeg: number;
  };

  // スキル体系（Stormbringer）
  skills: {
    AgilitySkills: StormbringerSkill[]; // 敏捷系スキル
    CommunicationSkills: StormbringerSkill[]; // コミュニケーション系スキル
    KnowledgeSkills: StormbringerSkill[]; // 知識系スキル
    ManipulationSkills: StormbringerSkill[]; // 操作系スキル
    PerceptionSkills: StormbringerSkill[]; // 知覚系スキル
    StealthSkills: StormbringerSkill[]; // 隠密系スキル
    MagicSkills: StormbringerSkill[]; // 魔法系スキル
    WeaponSkills: StormbringerSkill[]; // 武器系スキル
  };

  // その他
  imageUrl?: string;
  campaignId?: string;
  created_at?: string;
  updated_at?: string;
}

// Stormbringer武器定義
export interface StormbringerWeapon {
  name: string;
  attack: number;
  damage: string;
  hit: number;
  parry: number;
  range: string;
}

// Stormbringerスキル定義
export interface StormbringerSkill {
  name: string;
  value: number; // パーセンテージベース
}

// PC専用追加情報
export interface PlayerCharacter extends TRPGCharacter {
  characterType: "PC";
  backstory: string; // 背景設定
  goals: string[]; // 目標
  bonds: string[]; // 絆
  flaws: string[]; // 欠点
  ideals: string[]; // 理想
  currentHP?: number; // 現在HP
  currentMP?: number; // 現在MP
}

// NPC専用情報
export interface NPCCharacter extends TRPGCharacter {
  characterType: "NPC";
  location?: string; // 主な居場所
  occupation?: string; // 職業
  attitude: "friendly" | "neutral" | "hostile" | "unknown";
  knowledge?: string[]; // 知っている情報
  services?: string[]; // 提供できるサービス
  questIds?: string[]; // 関連クエスト
  dialoguePatterns?: string[]; // 会話パターン
}

// 敵キャラクター詳細情報（エネミー.md仕様準拠）
export interface EnemyCharacter {
  id: string;
  name: string;
  rank: "モブ" | "中ボス" | "ボス" | "EXボス";
  type: string; // アンデッド、魔獣、機械など
  description: string;
  level: number;

  // 能力値（簡略化）
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
  };

  // 派生値
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

  // スキル・攻撃手段
  skills: {
    basicAttack: string;
    specialSkills: SpecialSkill[];
    passives: string[];
  };

  // AI行動パターン
  behavior: {
    aiPattern: string; // 例：HP50%以下で回復スキル使用
    targeting: string; // 例：最もHPが低いPCを狙う
  };

  // ドロップ情報
  drops: {
    exp: number;
    gold: number;
    items: string[];
    rareDrops: string[];
  };

  // 現在状態
  status: {
    currentHp: number;
    currentMp: number;
    statusEffects: string[];
    location: string;
  };

  // 探索・追跡システム
  trackingInfo?: {
    hasTrackableTraces: boolean; // 痕跡追跡可能か
    traceLocations?: string[]; // 痕跡が見つかる場所のID
    huntingDifficulty?: ExplorationDifficulty; // 討伐難易度
    requiredPartyLevel?: number; // 討伐に必要なパーティーレベル
    maxEncounterSize?: number; // 一度に遭遇する最大数
    spawnsInGroups?: boolean; // 群れで出現するか
  };

  // 探索行動システム連携
  explorationActions?: ExplorationAction[]; // このエネミーに関連する探索行動（痕跡探し等）

  // その他
  imageUrl?: string;
  campaignId?: string;
  created_at?: string;
  updated_at?: string;
}

// 特殊スキル定義
export interface SpecialSkill {
  name: string;
  effect: string;
  cooldown?: number;
  cost?: string;
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

// TRPG専用 世界観設定の型定義（完全簡素化版）
export interface WorldBuilding {
  id: string;
  // 基本設定（TRPG必須）
  setting: TRPGSettingElement[];
  // 拠点・場所管理（TRPG核心機能）
  places: TRPGPlaceElement[];
  // ワールドマップ（TRPG重要機能）
  worldmaps: TRPGWorldMapElement[];
  // ゲームルール（TRPG運用）
  rules: TRPGRuleElement[];
  // 世界地図画像
  worldMapImageUrl?: string;
}

// TRPG専用 基本設定要素
export interface TRPGSettingElement {
  id: string;
  name: string;
  description: string;
  gameSystem?: string; // D&D 5e, Stormbringer等
  theme?: string; // ファンタジー、SF等
  notes?: string;
}

// TRPG専用 場所要素（拠点・探索地点統合）
export interface TRPGPlaceElement {
  id: string;
  name: string;
  type: "town" | "dungeon" | "field" | "landmark" | "other";
  description: string;
  region?: string; // 地域名
  connections?: string[]; // 接続する場所のID
  dangerLevel?: "safe" | "low" | "medium" | "high" | "extreme";
  features?: string; // 特徴的な施設・地形
  npcs?: string[]; // この場所にいるNPCのID
  enemies?: string[]; // この場所に出現するエネミーのID
  treasures?: string[]; // この場所で入手可能なアイテム
  quests?: string[]; // この場所で発生するクエストのID
  imageUrl?: string;
  unlocked?: boolean; // プレイヤーが発見済みか
}

// 統合場所要素（WorldBuildingElement置き換え用）
export interface UnifiedLocationElement extends TRPGPlaceElement {
  // PlaceElementからの追加属性
  population?: string; // 人口情報
  culturalFeatures?: string; // 文化的特徴

  // AI生成・重要度情報
  importance?: "低" | "中" | "高" | "最重要"; // 重要度
  originalType?: string; // 元の型情報（migration用）

  // 基本的な施設・サービス情報
  facilities?: string[]; // 基本的な施設リスト
  availableServices?: string[]; // 提供サービス

  // 関係性情報
  relations?: string; // 他の場所との関係

  // メタ情報
  aiGenerated?: boolean; // AI生成フラグ
  lastUpdated?: string; // 最終更新日時
}

// TRPG専用 ワールドマップ要素
export interface TRPGWorldMapElement {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  places: TRPGMapPlaceReference[]; // マップ上の場所参照
}

// マップ上の場所参照
export interface TRPGMapPlaceReference {
  placeId: string;
  x: number; // マップ上のX座標（％）
  y: number; // マップ上のY座標（％）
  label?: string; // マップ上の表示名
}

// TRPG専用 ルール要素
export interface TRPGRuleElement {
  id: string;
  name: string;
  description: string;
  category: "combat" | "skill" | "magic" | "social" | "exploration" | "other";
  system?: string; // 対応ゲームシステム
}

// ルール、文化、場所の型定義は worldBuilding 内の型を使用

// ゲームセッション
export interface GameSession {
  id: string;
  campaignId: string;
  sessionNumber: number;
  title: string;
  date: Date;
  duration: number; // 分
  attendees?: string[]; // プレイヤーID
  gamemaster?: string;
  synopsis?: string;
  content?: Descendant[]; // セッションログ・ノート
  events?: SessionEvent[];
  combats?: CombatEncounter[];
  questsAdvanced?: string[]; // 進行したクエストID
  questsCompleted?: string[]; // 完了したクエストID
  experienceAwarded?: number;
  status?: "planned" | "inProgress" | "completed" | "cancelled";
  notes?: string;

  // 🎯 **タイムライン連動遭遇判定用の新規フィールド**
  currentState: SessionCurrentState;
  spatialTracking: SpatialTrackingSystem;
  encounterHistory: EncounterRecord[];
}

// 🎯 **現在のセッション状態（詳細管理）**
export interface SessionCurrentState {
  // 時間管理
  currentDay: number; // 現在の日付（1から開始）
  currentTimeOfDay: TimeOfDay; // 現在の時刻帯
  actionCount: number; // 本日の行動回数
  maxActionsPerDay: number; // 1日の最大行動回数

  // 空間管理
  currentLocation: string; // 現在の場所名
  currentLocationId?: string; // 場所ID（BaseLocationとの連携）
  coordinates?: Coordinates; // 詳細座標（オプション）

  // パーティー状態
  activeCharacter: string; // 現在操作中のキャラクターID
  partyLocation: PartyLocationState; // パーティー全体の位置情報
  partyStatus: PartyStatus; // パーティーの状態

  // イベント進行
  activeEvents: string[]; // 現在アクティブなイベントID
  completedEvents: string[]; // 完了したイベントID
  triggeredEvents: TriggeredEvent[]; // 発生済みイベント履歴
}

// 時刻帯定義
export type TimeOfDay =
  | "morning"
  | "noon"
  | "afternoon"
  | "evening"
  | "night"
  | "late_night";

// 🌍 世界観構築統合: 遭遇システム関連型定義
export interface EncounterChance {
  probability: number; // 0-1の確率
  type: string; // 遭遇タイプ（戦闘、イベント、発見など）
  description?: string;
}

export interface WeatherModifier {
  condition: string; // 天候条件
  modifier: number; // 修正値
  effects: string[]; // 効果の説明
}

export interface ConditionalEvent {
  condition: string; // 発生条件
  event: string; // イベント内容
  probability: number; // 発生確率
}

export type ClimateType =
  | "temperate"
  | "tropical"
  | "arctic"
  | "desert"
  | "mountain"
  | "coastal"
  | "magical";
export type TerrainType =
  | "plains"
  | "forest"
  | "mountain"
  | "desert"
  | "swamp"
  | "urban"
  | "ruins"
  | "underground"
  | "aerial";

export interface WeatherPattern {
  season: string;
  conditions: string[];
  temperature: { min: number; max: number };
  precipitation: number; // 降水量
}

// 座標系
export interface Coordinates {
  x: number;
  y: number;
  z?: number; // 高度（オプション）
  region?: string; // 地域名
}

// パーティー位置状態
export interface PartyLocationState {
  groupLocation: string; // グループ全体の場所
  memberLocations: {
    // 個別メンバーの位置
    [characterId: string]: {
      location: string;
      coordinates?: Coordinates;
      timeArrived: string; // 到着時刻
      isWithGroup: boolean; // グループと同行中か
    };
  };
  movementHistory: MovementRecord[]; // 移動履歴
}

// パーティー状態
export type PartyStatus =
  | "exploring"
  | "resting"
  | "combat"
  | "shopping"
  | "dialogue"
  | "traveling";

// 移動記録
export interface MovementRecord {
  characterId: string;
  fromLocation: string;
  toLocation: string;
  timestamp: Date;
  dayNumber: number;
  timeOfDay: TimeOfDay;
}

// 発生済みイベント
export interface TriggeredEvent {
  eventId: string;
  triggeredAt: Date;
  dayNumber: number;
  timeOfDay: TimeOfDay;
  location: string;
  triggerType: "scheduled" | "encounter" | "manual" | "ai_initiated";
  participants: string[]; // 参加キャラクターID
  result?: "success" | "failure" | "ongoing" | "cancelled";
}

// 🎯 **空間追跡システム（衝突判定用）**
export interface SpatialTrackingSystem {
  // 現在の位置情報
  currentPositions: {
    players: { [characterId: string]: PositionInfo };
    npcs: { [npcId: string]: PositionInfo };
    enemies: { [enemyId: string]: PositionInfo };
  };

  // 衝突判定設定
  collisionDetection: CollisionDetectionConfig;

  // エリア定義
  definedAreas: GameArea[];

  // 遭遇ルール
  encounterRules: EncounterRule[];
}

// 位置情報
export interface PositionInfo {
  location: string;
  coordinates?: Coordinates;
  arrivalTime: Date;
  dayNumber: number;
  timeOfDay: TimeOfDay;
  isActive: boolean; // アクティブ状態（戦闘可能等）
  visibilityRange?: number; // 検知範囲
  movementSpeed?: number; // 移動速度
}

// 衝突判定設定
export interface CollisionDetectionConfig {
  enableSpatialCollision: boolean; // 空間衝突判定を有効にするか
  enableTemporalCollision: boolean; // 時間衝突判定を有効にするか
  collisionRadius: number; // 衝突判定範囲（メートル等）
  timeWindow: number; // 時間窓（分）
  automaticEncounters: boolean; // 自動遭遇を有効にするか
  encounterProbability: {
    // 遭遇確率設定
    npc: number; // NPC遭遇確率 (0-1)
    enemy: number; // エネミー遭遇確率 (0-1)
    event: number; // イベント発生確率 (0-1)
  };
}

// ゲームエリア定義
export interface GameArea {
  id: string;
  name: string;
  type: "safe" | "dangerous" | "neutral" | "special";
  boundaries?: Coordinates[]; // エリア境界
  encounterModifiers: {
    // 遭遇修正
    npcMultiplier: number;
    enemyMultiplier: number;
    eventMultiplier: number;
  };
  restrictions?: string[]; // 制限事項
}

// 遭遇ルール
export interface EncounterRule {
  id: string;
  name: string;
  conditions: EncounterCondition[];
  actions: EncounterAction[];
  priority: number; // 優先度（高いほど先に処理）
  isActive: boolean;
}

// 遭遇条件
export interface EncounterCondition {
  type: "location" | "time" | "character" | "event" | "probability";
  operator: "equals" | "contains" | "greater_than" | "less_than" | "in_range";
  value: string | number | boolean | string[];
  characterId?: string;
}

// 遭遇アクション
export interface EncounterAction {
  type:
    | "spawn_enemy"
    | "trigger_event"
    | "spawn_npc"
    | "force_dialogue"
    | "require_dice_roll";
  parameters: Record<string, string | number | boolean | string[]>;
  description: string;
}

// 🎯 **遭遇記録（AI判定用）**
export interface EncounterRecord {
  id: string;
  timestamp: Date;
  dayNumber: number;
  timeOfDay: TimeOfDay;
  location: string;

  // 遭遇タイプ
  encounterType:
    | "npc_dialogue"
    | "enemy_combat"
    | "event_trigger"
    | "location_discovery"
    | "trap_activation";

  // 参加者
  participants: {
    players: string[]; // 参加プレイヤーキャラクターID
    npcs?: string[]; // 関与NPC ID
    enemies?: string[]; // 関与エネミーID
  };

  // 遭遇結果
  result: {
    outcome: "success" | "failure" | "escape" | "negotiation" | "ongoing";
    damageDealt?: number;
    damageReceived?: number;
    itemsGained?: string[];
    experienceGained?: number;
    questProgress?: Record<string, string | number | boolean>;
  };

  // AI判定データ
  aiDecisions: {
    wasAIInitiated: boolean; // AI主導で発生したか
    difficultyCalculated: number; // AI計算難易度
    surpriseRound?: boolean; // サプライズラウンドの有無
    tacticalAdvantage?: "player" | "enemy" | "neutral"; // 戦術的優位性
  };

  // メタデータ
  description: string;
  tags: string[];
}

// 統合イベント型（TRPG/小説両対応）
export interface UnifiedEvent {
  id: string;
  title: string;
  description: string;

  // 時間情報（両システム対応）
  sessionDay?: number; // TRPGセッション内の日数
  sessionTime?: string; // TRPGセッション内の時刻
  date?: string; // 小説用ISO date string
  dayNumber?: number; // 小説用日数（1日目、2日目など）

  // 基本情報
  relatedCharacters: string[];
  relatedPlaces: string[];
  order: number;

  // イベントタイプ（統合）
  eventType:
    | "combat"
    | "battle" // 戦闘
    | "roleplay"
    | "dialogue" // 会話・ロールプレイ
    | "exploration"
    | "journey" // 探索・移動
    | "puzzle"
    | "mystery" // 謎解き
    | "social" // 社交
    | "discovery" // 発見
    | "rest" // 休息
    | "turning_point" // 転換点（小説用）
    | "info" // 情報（小説用）
    | "setup" // 準備（小説用）
    | "celebration" // 祝祭（小説用）
    | "other"; // その他

  // 結果・状態
  outcome?: "success" | "failure" | "partial" | "ongoing";
  postEventCharacterStatuses?: {
    [characterId: string]: CharacterStatus[];
  };

  // 関連要素
  relatedQuestIds?: string[]; // 関連するクエストのID配列
  placeId?: string; // 主要な場所ID

  // 報酬・結果
  experienceAwarded?: number;
  lootGained?: Equipment[]; // TRPG用戦利品
  results?: EventResult[]; // イベントの結果（アイテム取得、フラグ設定など）
  conditions?: EventCondition[]; // イベントの発生条件

  // 探索行動システム連携
  explorationActions?: ExplorationAction[]; // このイベントに関連する探索行動
}

// SessionEvent: UnifiedEventの型エイリアス（後方互換性）
export type SessionEvent = UnifiedEvent;

// TimelineEvent: UnifiedEventの型エイリアス（後方互換性）
export type TimelineEvent = UnifiedEvent;

// イベントタイプ変換ヘルパー関数
export const convertEventType = {
  // 小説 → TRPG イベントタイプ変換
  novelToTRPG: (novelType: string): UnifiedEvent["eventType"] => {
    switch (novelType) {
      case "battle":
        return "combat";
      case "dialogue":
        return "roleplay";
      case "journey":
        return "exploration";
      case "mystery":
        return "puzzle";
      case "discovery":
        return "discovery";
      case "rest":
        return "rest";
      case "turning_point":
        return "social";
      case "info":
        return "social";
      case "setup":
        return "social";
      case "celebration":
        return "social";
      case "other":
        return "other";
      default:
        return "social";
    }
  },

  // TRPG → 小説 イベントタイプ変換
  trpgToNovel: (trpgType: string): UnifiedEvent["eventType"] => {
    switch (trpgType) {
      case "combat":
        return "battle";
      case "roleplay":
        return "dialogue";
      case "exploration":
        return "journey";
      case "puzzle":
        return "mystery";
      case "social":
        return "info";
      case "discovery":
        return "discovery";
      case "rest":
        return "rest";
      default:
        return "other";
    }
  },
};

// レガシーTimelineEventをUnifiedEventに変換
export const convertTimelineToUnified = (timeline: any): UnifiedEvent => {
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
    eventType: timeline.eventType || "other",
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
export const convertSessionToUnified = (session: any): UnifiedEvent => {
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
    eventType: session.eventType || "other",
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

// イベント結果の型定義
export interface EventResult {
  id: string;
  type:
    | "item_gained"
    | "item_lost"
    | "flag_set"
    | "flag_unset"
    | "condition_met"
    | "story_progress"
    | "character_change"
    | "hp_change"
    | "mp_change"
    | "gold_change"
    | "experience_change"
    | "status_effect_add"
    | "status_effect_remove"
    | "location_change";
  description: string;
  itemId?: string; // type が "item_gained" または "item_lost" の場合
  itemQuantity?: number; // アイテムの数量
  flagKey?: string; // type が "flag_set" または "flag_unset" の場合
  flagValue?: string | number | boolean; // フラグの値
  characterId?: string; // キャラクター関連の変更の場合
  value?: number; // HP/MP/Gold/Experience の変更値
  statusEffect?: string; // 状態異常名
  newLocation?: string; // 場所変更の場合
  metadata?: Record<string, string | number | boolean>; // その他の情報
}

// イベント発生条件の型定義
export interface EventCondition {
  id: string;
  type:
    | "item_required"
    | "flag_required"
    | "character_status"
    | "location_required"
    | "quest_completed"
    | "day_range"
    | "custom";
  description: string;
  itemId?: string; // type が "item_required" の場合
  itemQuantity?: number; // 必要なアイテム数量（デフォルト1）
  flagKey?: string; // type が "flag_required" の場合
  flagValue?: string | number | boolean; // 必要なフラグの値
  characterId?: string; // type が "character_status" の場合
  characterStatusId?: string; // 必要なキャラクター状態
  locationId?: string; // type が "location_required" の場合
  questId?: string; // type が "quest_completed" の場合
  dayMin?: number; // type が "day_range" の場合の最小日数
  dayMax?: number; // type が "day_range" の場合の最大日数
  customCondition?: string; // type が "custom" の場合の条件説明
  operator?: "AND" | "OR"; // 複数条件の組み合わせ方法
}

// キャンペーンクリア条件の型定義
export interface ClearCondition {
  id: string;
  title: string;
  description: string;
  type:
    | "item_collection"
    | "quest_completion"
    | "character_survival"
    | "location_reached"
    | "story_milestone"
    | "custom";
  requiredItems?: {
    itemId: string;
    itemName: string;
    quantity: number;
  }[];
  requiredQuests?: string[]; // 完了必須のクエストID配列
  requiredCharacters?: string[]; // 生存必須のキャラクターID配列
  requiredLocation?: string; // 到達必須の場所ID
  storyMilestone?: string; // ストーリー上の重要な節目
  customDescription?: string; // type が "custom" の場合の詳細説明
  priority: "primary" | "secondary" | "optional"; // クリア条件の重要度
  successDescription: string; // 条件達成時の説明
  failureDescription?: string; // 条件未達成時の説明
}

// アイテムの型定義
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  category: ItemCategory;
  rarity: ItemRarity;
  value?: number; // 価値（ゴールドなど）
  weight?: number; // 重量
  stackable: boolean; // スタック可能か（isStackableからstackableに統一）
  maxStack: number; // 最大スタック数
  usable: boolean; // 使用可能か
  consumable: boolean; // 消耗品か
  effects: ItemEffect[]; // アイテム効果
  attributes: ItemAttribute[]; // アイテム属性
  requirements: {
    level: number;
    stats: Record<string, number>;
    skills: string[];
    classes: string[];
  };
  equipmentSlot?: EquipmentSlot; // 装備スロット
  damage?: number; // 攻撃力（武器用）
  defense?: number; // 防御力（防具用）
  tags: string[]; // 検索・フィルター用タグ
  questRelated: boolean; // クエスト関連か
  tradable: boolean; // 取引可能か
  destroyable: boolean; // 破棄可能か
}

// アイテムタイプ
export type ItemType =
  | "consumable"
  | "equipment"
  | "key_item"
  | "material"
  | "quest_item"
  | "currency"
  | "other";

// アイテムカテゴリ
export type ItemCategory =
  | "general"
  | "weapon"
  | "armor"
  | "accessory"
  | "consumable"
  | "material"
  | "tool"
  | "book"
  | "food"
  | "magic"
  | "treasure"
  | "junk";

// アイテムのレアリティ
export type ItemRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "artifact";

// アイテム効果
export interface ItemEffect {
  id: string;
  type: "heal" | "damage" | "buff" | "debuff" | "special";
  magnitude: number;
  duration?: number;
  description: string;
}

// アイテム属性
export interface ItemAttribute {
  id: string;
  name: string;
  value: string | number | boolean;
  description?: string;
}

// 装備スロット
export type EquipmentSlot =
  | "head"
  | "body"
  | "hands"
  | "feet"
  | "weapon"
  | "shield"
  | "accessory"
  | "ring"
  | "necklace";

// アイテムの入手場所
export interface ItemLocation {
  id: string;
  itemId: string;
  locationType: "shop" | "event" | "loot" | "craft" | "reward";
  locationId: string; // 拠点ID、イベントID、クエストIDなど
  locationName: string; // 表示用の場所名
  availability: ItemAvailability;
  price?: number; // ショップでの価格
  currency?: string; // 通貨の種類
  requirements?: ItemRequirement[]; // 入手条件
  notes?: string; // 補足情報
}

// アイテムの入手可能性
export type ItemAvailability =
  | "always"
  | "limited"
  | "seasonal"
  | "quest_locked"
  | "level_locked"
  | "story_locked";

// アイテム入手条件
export interface ItemRequirement {
  type:
    | "level"
    | "quest_complete"
    | "item_owned"
    | "flag_set"
    | "location_discovered";
  value: string | number;
  description: string;
}

// 装備アイテム専用の拡張（削除）
// Equipment interfaceはItem型で統一する

// 装備タイプ
export type EquipmentType =
  | "main_weapon"
  | "off_weapon"
  | "two_handed_weapon"
  | "ranged_weapon"
  | "helmet"
  | "chest_armor"
  | "leg_armor"
  | "boots"
  | "gloves"
  | "ring"
  | "necklace"
  | "earring"
  | "bracelet"
  | "cloak";

// 装備ステータス
export interface EquipmentStats {
  attack?: number;
  defense?: number;
  magicAttack?: number;
  magicDefense?: number;
  speed?: number;
  accuracy?: number;
  evasion?: number;
  criticalRate?: number;
  hp?: number;
  mp?: number;
  [stat: string]: number | undefined; // その他のカスタムステータス
}

// エンチャント
export interface Enchantment {
  id: string;
  name: string;
  description: string;
  effect: string;
  magnitude: number;
  type: "buff" | "debuff" | "special";
}

// アイテムインベントリ
export interface ItemInventory {
  id: string;
  ownerId: string; // キャラクターIDまたは拠点ID
  ownerType: "character" | "base" | "party";
  items: InventoryItem[];
  capacity?: number; // 容量制限
  weightLimit?: number; // 重量制限
  updatedAt: Date;
}

// インベントリ内のアイテム
export interface InventoryItem {
  itemId: string;
  quantity: number;
  condition?: number; // 耐久度など（0-100）
  enchantments?: string[]; // エンチャントID配列
  notes?: string;
  acquiredAt: Date;
  acquiredFrom?: string; // どこで取得したか
}

// 戦闘エンカウンター
export interface CombatEncounter {
  id: string;
  name: string;
  sessionId: string;
  participants: CombatParticipant[];
  round: number;
  status: "planning" | "active" | "completed";
  initiative: InitiativeOrder[];
  battlemap?: string; // 画像URL
  conditions?: CombatCondition[];
  summary?: string;
  experienceAwarded?: number;
  lootDropped?: Equipment[];
}

// 戦闘参加者
export interface CombatParticipant {
  characterId: string;
  characterType: "PC" | "NPC" | "Enemy";
  initiative: number;
  currentHP: number;
  maxHP: number;
  conditions: string[]; // 状態異常など
  position?: { x: number; y: number }; // バトルマップ上の位置
}

// イニシアチブ順
export interface InitiativeOrder {
  characterId: string;
  initiative: number;
  hasActed: boolean;
}

// 戦闘状況
export interface CombatCondition {
  name: string;
  description: string;
  duration: number; // 残りターン数
  effects: string[];
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
  maxDays: number; // 最大日数
}

/**
 * プロジェクトの状態を表す型
 */
export type ProjectStatus = "active" | "archived" | "template";

// キャンペーンルール
export interface CampaignRule {
  id: string;
  name: string;
  category: "house_rule" | "variant" | "custom" | "clarification";
  description: string;
  details: string;
  appliesTo?: string[]; // 適用対象（キャラクター、スキル、戦闘など）
  isActive: boolean;
}

// ハンドアウト
export interface Handout {
  id: string;
  title: string;
  content: string;
  type: "info" | "map" | "image" | "rules" | "quest" | "letter" | "other";
  isPublic: boolean; // プレイヤーに公開済みか
  recipientIds?: string[]; // 特定プレイヤーのみの場合
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// キャンペーンメタデータ
export interface CampaignMetadata {
  version: string;
  tags?: string[];
  genre?: string[];
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  estimatedSessions?: number;
  targetPlayers: { min: number; max: number };
  status: CampaignStatus;
  lastBackupDate?: string;
  totalPlayTime?: number; // 分
}

// キャンペーンステータス
export type CampaignStatus =
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "archived";

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
 * @deprecated PlaceManagementElementを使用してください
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
/**
 * @deprecated PlaceManagementElementを使用してください
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
/**
 * @deprecated PlaceManagementCategoryを使用してください
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
  id: string,
): WorldBuildingCategory | undefined => {
  return worldBuildingCategories.find((category) => category.id === id);
};

// カテゴリIDからタブのインデックスを取得するヘルパー関数
export const getCategoryTabIndex = (categoryId: string): number => {
  const category = getCategoryById(categoryId);
  return category ? category.index : -1; // 見つからない場合は -1 を返す
};

// 世界観要素のデータ型（AI生成やフォーム入力用）
/**
 * @deprecated PlaceManagementElementを使用してください
 */
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
/**
 * @deprecated PlaceManagement系の関数を使用してください
 */
export function createTypedWorldBuildingElement(
  type: string, // ここは WorldBuildingElementType の方がより厳密ですが、呼び出し元での柔軟性を考慮
  data: WorldBuildingElementData,
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

// 拠点詳細情報（拠点.md仕様準拠）
export interface BaseLocation {
  id: string;
  name: string;
  type: string; // 村、町、都市、砦、城、神殿、浮遊島など
  region: string; // 所在地・地域
  description: string;
  rank: string; // 小村、中規模都市、大都市、要塞都市
  importance: "主要拠点" | "サブ拠点" | "隠し拠点";

  // 施設情報
  facilities: {
    inn?: Inn;
    shops?: Shop[];
    armory?: Armory;
    temple?: Temple;
    guild?: Guild;
    blacksmith?: Blacksmith;
    otherFacilities?: OtherFacility[];
  };

  // 人物・NPC
  npcs: LocationNPC[];

  // 機能・用途
  features: {
    fastTravel: boolean; // ファストトラベル可能か
    playerBase: boolean; // プレイヤー拠点として使えるか
    questHub: boolean; // クエスト発生ポイントか
    defenseEvent: boolean; // 拠点防衛イベントの有無
  };

  // 危険・影響要素
  threats: {
    dangerLevel: string; // 低、中、高
    monsterAttackRate: number; // モンスター襲撃率
    playerReputation: number; // プレイヤーの評判
    currentEvents: string[]; // 現在の情勢
    controllingFaction: string; // 支配勢力
  };

  // 経済・流通
  economy: {
    currency: string; // 通貨単位
    priceModifier: number; // 物価指数
    localGoods: string[]; // 特産品
    tradeGoods: string[]; // 交易品
  };

  // TRPGセッション用: 行動可能リスト
  availableActions?: {
    id: string;
    name: string;
    description: string;
    category:
      | "exploration"
      | "social"
      | "shopping"
      | "training"
      | "rest"
      | "quest"
      | "custom";
    requirements?: string[]; // 前提条件
    effects?: string[]; // 効果・結果
  }[];

  // 🌍 世界観構築統合: 遭遇ルール
  encounterRules?: {
    timeOfDay: Record<TimeOfDay, EncounterChance>;
    weatherEffects?: WeatherModifier[];
    specialEvents?: ConditionalEvent[];
  };

  // 🌍 世界観構築統合: NPCスケジュール
  npcSchedule?: {
    [npcId: string]: {
      availability: TimeOfDay[];
      services: string[];
      questTriggers: string[];
    };
  };

  // 🌍 世界観構築統合: 文化的修正値
  culturalModifiers?: {
    negotiationDC: number;
    priceModifier: number;
    reputationImpact: number;
  };

  // 🌍 世界観構築統合: 環境要因
  environmentalFactors?: {
    climate: ClimateType;
    terrain: TerrainType;
    weatherPatterns: WeatherPattern[];
    naturalHazards?: string[];
  };

  // 🗺️ マップ座標
  coordinates?: {
    lat: number;
    lng: number;
  };

  // メタ情報
  meta: {
    locationId: string;
    unlocked: boolean;
    lastUpdated: string;
  };

  // その他
  imageUrl?: string;
  campaignId?: string;
  created_at?: string;
  updated_at?: string;
}

// 宿屋情報
export interface Inn {
  name: string;
  pricePerNight: number;
  description?: string;
  services?: string[]; // 回復、情報収集など
}

// 店舗情報
export interface Shop {
  name: string;
  type: string; // 一般商店、武具屋、魔法店など
  items: string[];
  priceModifier: number;
  description?: string;
}

// 武具屋情報
export interface Armory {
  name: string;
  weaponTypes: string[];
  armorTypes: string[];
  specialItems?: string[];
  description?: string;
}

// 神殿・僧院情報
export interface Temple {
  name: string;
  deity: string; // 祭られている神
  functions: string[]; // 蘇生、状態異常回復など
  donation?: number; // 寄付金額
  description?: string;
}

// ギルド情報
export interface Guild {
  name: string;
  type: string; // 冒険者ギルド、商人ギルド、盗賊ギルドなど
  services: string[];
  membershipRequired?: boolean;
  description?: string;
}

// 鍛冶屋情報
export interface Blacksmith {
  name: string;
  services: string[]; // 修理、強化、作成など
  specialties?: string[];
  description?: string;
}

// その他施設
export interface OtherFacility {
  name: string;
  type: string; // 図書館、牢獄、闘技場、闇市場、温泉など
  description: string;
  functions?: string[];
}

// 拠点NPC情報
export interface LocationNPC {
  id: string;
  name: string;
  role: string; // 村長、店主、ギルドマスターなど
  function: string; // メインクエスト提供者、サブクエスト提供者、情報提供者など
  description?: string;
  questIds?: string[]; // 提供するクエストID
}

// キャラクター相互作用システム
export interface CharacterInteraction {
  id: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  interactionType:
    | "heal"
    | "damage"
    | "statusEffect"
    | "buff"
    | "debuff"
    | "custom";
  value?: number; // HP変動値など
  statusEffect?: string; // 付与する状態異常名
  duration?: number; // 効果持続時間（ターン数）
  description: string;
  timestamp: Date;
  sessionId?: string;
}

// ゲーム開始場所の情報
export interface StartingLocationInfo {
  id: string; // 場所のID
  name: string; // 場所の名前
  type: "base" | "location"; // 拠点かフィールドかを区別
  description?: string; // 場所の説明（表示用）
  imageUrl?: string; // 場所の画像URL
  setAt: Date; // 設定された日時
  isActive: boolean; // 現在アクティブな開始場所か
}

// =============================================================================
// GMチートシート機能の型定義（既存データ連携型）
// =============================================================================

// GMによるキーアイテム指定（既存Itemに対するGM情報追加）
export interface GMKeyItemInfo {
  id: string;
  itemId: string; // 既存のItem IDへの参照
  importance: "critical" | "high" | "medium" | "low"; // GM評価の重要度
  isKeyItem: boolean; // キーアイテムとして指定するか
  obtainStatus: "not_obtained" | "partially_obtained" | "obtained"; // GM把握の取得状況
  gmHints?: string[]; // GMからプレイヤーへのヒント
  secretInfo?: string; // プレイヤーに知らせない秘密情報
  plotRelevance?: string; // ストーリー上の重要性
  gmNotes?: string; // GM用メモ
  createdAt: Date;
  updatedAt: Date;
}

// GMによるクリア条件補強（既存ClearConditionへのGM情報追加）
export interface GMClearConditionInfo {
  id: string;
  clearConditionId: string; // 既存のClearCondition IDへの参照
  gmPriority: "critical" | "high" | "medium" | "low"; // GM評価の優先度
  progressStatus:
    | "not_started"
    | "hinted"
    | "in_progress"
    | "near_completion"
    | "completed"; // GM把握の進行状況
  playerAwareness: "unaware" | "partially_aware" | "fully_aware"; // プレイヤーの認知度
  gmHints?: string[]; // GMからプレイヤーへのヒント案
  secretRequirements?: string[]; // プレイヤーに隠している要求事項
  alternativeSolutions?: string[]; // 代替解決策
  failureConsequences?: string[]; // 失敗時のGMガイド
  triggersAndTimings?: string[]; // 発動条件とタイミング
  gmNotes?: string; // GM用メモ
  createdAt: Date;
  updatedAt: Date;
}

// GMによるエネミー戦術情報（既存EnemyCharacterへのGM情報追加）
export interface GMEnemyTacticsInfo {
  id: string;
  enemyId: string; // 既存のEnemyCharacter IDへの参照
  threatAssessment: "minor" | "major" | "boss" | "campaign_ending"; // GM評価の脅威度
  recommendedPartyLevel?: number; // 推奨パーティーレベル
  tacticalAdvice?: string[]; // GM向け戦術アドバイス
  weaknessHints?: string[]; // プレイヤーへのヒント案
  battleEnvironment?: string; // 推奨戦闘環境
  plotSignificance?: string; // ストーリー上の意味
  defeatAlternatives?: string[]; // 撃破以外の解決策
  escapeScenarios?: string[]; // 逃走シナリオ
  allianceOpportunities?: string[]; // 同盟の可能性
  lootNotes?: string; // ドロップ品についてのGMメモ
  gmNotes?: string; // GM用メモ
  createdAt: Date;
  updatedAt: Date;
}

// GM専用重要情報（完全新規）
export interface GMSecretInfo {
  id: string;
  title: string; // 情報のタイトル
  category:
    | "plot_twist"
    | "npc_secret"
    | "world_lore"
    | "puzzle_solution"
    | "hidden_connection"
    | "future_event"
    | "other"; // カテゴリ
  content: string; // 秘密情報の内容
  importance: "critical" | "high" | "medium" | "low"; // 重要度
  revealTiming?:
    | "early_game"
    | "mid_game"
    | "late_game"
    | "climax"
    | "flexible"; // 明かすタイミング
  revealConditions?: string[]; // 公開条件
  playerClues?: string[]; // プレイヤーが気づけるヒント
  relatedCharacters?: string[]; // 関連キャラクター
  relatedLocations?: string[]; // 関連場所
  relatedQuests?: string[]; // 関連クエスト
  consequences?: string[]; // この情報が明かされた場合の影響
  gmReminders?: string[]; // GMへのリマインダー
  notes?: string; // GM用メモ
  createdAt: Date;
  updatedAt: Date;
}

// GMセッション進行メモ
export interface GMSessionNotes {
  id: string;
  sessionDate?: Date; // セッション日
  sessionNumber?: number; // セッション回数
  attendees?: string[]; // 参加者
  majorEvents?: string[]; // 主要な出来事
  playerDecisions?: string[]; // プレイヤーの重要な判断
  unexpectedDevelopments?: string[]; // 予想外の展開
  nextSessionPrep?: string[]; // 次回セッションへの準備事項
  reminders?: string[]; // GM用リマインダー
  notes?: string; // 自由記述メモ
  createdAt: Date;
  updatedAt: Date;
}

// GMチートシート全体（既存データ統合型）
export interface GMCheatSheet {
  id: string;
  campaignId: string;

  // 既存データへのGM追加情報
  keyItemsInfo: GMKeyItemInfo[]; // 既存アイテムへのGM情報
  clearConditionsInfo: GMClearConditionInfo[]; // 既存クリア条件へのGM情報
  enemyTacticsInfo: GMEnemyTacticsInfo[]; // 既存エネミーへのGM情報

  // GM専用情報
  secretInfo: GMSecretInfo[]; // 完全にGM専用の秘密情報
  sessionNotes: GMSessionNotes[]; // セッション進行メモ

  // クイックリファレンス
  quickReference?: string; // クイックリファレンス
  currentSessionReminders?: string[]; // 今回セッション用リマインダー

  updatedAt: Date;
}

// =============================================================================
// TRPGアクション結果処理システム（AI GM構造化レスポンス用）
// =============================================================================

// AI GMからのアクション結果レスポンス
export interface TRPGActionResult {
  // プレイヤー向けナラティブテキスト
  narrative: string;

  // ゲーム状態への影響（EventResultの配列として表現）
  gameEffects: EventResult[];

  // 新しく利用可能になった行動選択肢
  newOpportunities?: {
    actionName: string;
    description: string;
    category:
      | "exploration"
      | "social"
      | "shopping"
      | "training"
      | "rest"
      | "quest"
      | "custom";
    requirements?: string[];
  }[];

  // 次回セッションへの影響
  futureConsequences?: string[];

  // GM用メタ情報
  gmNotes?: {
    importantFlags?: string[];
    plotAdvancement?: string;
    playerChoiceImpact?: string;
  };
}

// アクション処理リクエスト（AI GM向け）
export interface TRPGActionRequest {
  // 基本情報
  actionText: string;
  characterId: string;
  location: string;
  dayNumber: number;
  timeOfDay: TimeOfDay;

  // コンテキスト情報
  partyMembers: {
    id: string;
    name: string;
    currentHP: number;
    maxHP: number;
    currentMP?: number;
    maxMP?: number;
    level: number;
    gold?: number;
  }[];

  // 現在の状況
  availableFacilities?: string[];
  activeQuests?: string[];
  campaignFlags?: Record<string, any>;
  partyInventory?: { itemId: string; itemName: string; quantity: number }[];

  // 追加の行動コンテキスト
  previousActions?: string[];
  locationDescription?: string;
  currentEvents?: string[];
}

// ===============================
// パーティインベントリシステム型定義
// ===============================

export interface PartyInventoryItem {
  itemId: string; // 既存のItemのIDを参照
  quantity: number;
}

// =============================================================================
// 探索行動システム型定義
// =============================================================================

// 探索行動の種類
export type ExplorationActionType =
  | "investigate" // 調査・探索
  | "search" // 捜索・発見
  | "interact" // 交流・会話
  | "combat" // 戦闘・討伐
  | "collect" // 収集・取得
  | "travel" // 移動・探検
  | "rest" // 休息・準備
  | "other"; // その他

// 探索行動の難易度
export type ExplorationDifficulty = "easy" | "normal" | "hard" | "extreme";

// 探索行動の分類（ランダムイベントシステム用）
export type ExplorationActionCategory =
  | "milestone" // マイルストーン達成必須（固定表示）
  | "beneficial" // 有益なサブイベント（経験値・アイテム等）
  | "hazard" // ハズレ・トラブル系イベント（時間消費・リスク）
  | "flavor" // 世界観・キャラクター系イベント（ストーリー深化）
  | "random"; // その他のランダムイベント

// 探索行動の基本定義
export interface ExplorationAction {
  id: string;
  title: string;
  description: string;
  actionType: ExplorationActionType;
  difficulty: ExplorationDifficulty;

  // 実行条件
  prerequisites?: {
    requiredItems?: string[]; // 必要アイテム
    requiredSkills?: string[]; // 必要スキル
    requiredLocation?: string; // 必要場所
    requiredPartySize?: number; // 必要パーティサイズ
    timeRequired?: number; // 所要時間（分）
  };

  // 成功時の結果
  successOutcomes?: {
    experience?: number; // 獲得経験値
    items?: string[]; // 獲得アイテム
    information?: string[]; // 獲得情報
    flagChanges?: Record<string, any>; // フラグ変更
    nextActions?: string[]; // 解放される次の行動
  };

  // 失敗時の結果
  failureOutcomes?: {
    consequences?: string[]; // 失敗の結果
    retryable?: boolean; // 再挑戦可能か
    penaltyDays?: number; // ペナルティ日数
  };

  // 関連要素
  relatedQuestId?: string; // 関連クエスト
  relatedEventId?: string; // 関連イベント
  relatedEnemyId?: string; // 関連エネミー

  // 表示制御
  isVisible?: boolean; // 探索タブに表示するか
  priority?: number; // 表示優先度

  // ランダムイベントシステム用分類
  category?: ExplorationActionCategory; // イベントの分類
}

// 探索行動グループ（マイルストーン別）
export interface ExplorationActionGroup {
  milestoneId: string;
  milestoneTitle: string;
  actions: ExplorationAction[];
  estimatedDays: number; // 推定完了日数
  priority: "low" | "medium" | "high" | "critical";
}

// ランダムイベントプール管理
export interface RandomEventPool {
  id: string;
  name: string; // プール名（例：「リバーベント街周辺」）
  description?: string;

  // 分類別イベントプール
  beneficialEvents: ExplorationAction[]; // 有益なサブイベント
  hazardEvents: ExplorationAction[]; // ハズレ・トラブル系
  flavorEvents: ExplorationAction[]; // 世界観・キャラクター系

  // ランダム選択設定
  selectionRules?: {
    beneficialWeight: number; // 有益イベントの重み
    hazardWeight: number; // ハズレイベントの重み
    flavorWeight: number; // フレーバーイベントの重み
    maxEventsPerDay: number; // 1日の最大ランダムイベント数
    minEventsPerDay: number; // 1日の最小ランダムイベント数
  };

  // 適用条件
  applicableLocations?: string[]; // 適用される場所ID
  applicableDayRange?: {
    // 適用される日数範囲
    start: number;
    end: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// マイルストーン管理システム型定義
// =============================================================================

// マイルストーン達成条件の型定義
export interface MilestoneRequirement {
  type: "events" | "quests" | "items" | "enemies";

  // イベント達成条件
  eventIds?: string[]; // 必要なイベントID配列

  // クエスト達成条件
  questIds?: string[]; // 必要なクエストID配列

  // アイテム取得条件
  itemRequirements?: {
    itemId: string;
    quantity: number;
  }[];

  // エネミー討伐条件
  enemyRequirements?: {
    enemyId: string;
    count: number; // 討伐必要数
  }[];

  // 達成に必要な数（部分達成の場合）
  requiredCount?: number; // 指定した場合、この数だけ達成すれば条件クリア
  description: string; // 条件の説明
}

// キャンペーンマイルストーン
export interface CampaignMilestone {
  id: string;
  title: string;
  description: string;

  // 期限設定
  targetDay: number; // 目標達成日
  deadline: boolean; // デッドライン設定（true=必須期限, false=推奨期限）

  // 達成条件（複数の条件を組み合わせ可能）
  requirements: MilestoneRequirement[];

  // 全条件達成が必要か、部分達成でも可とするか
  completionMode: "all" | "partial"; // all=全条件達成, partial=requirements内のrequiredCount使用

  // 達成状態
  status: "pending" | "active" | "completed" | "failed" | "overdue";
  achievedDay?: number; // 実際の達成日

  // GM向けガイダンス
  gmGuidance: {
    onTimeHints: string[]; // 期限内達成時のGMアナウンス案
    delayedHints: string[]; // 遅延時のGMアナウンス案（deadline=false時）
    failureMessage?: string; // ゲームオーバー時メッセージ（deadline=true時）
  };

  // 優先度
  priority: "critical" | "important" | "optional";

  // メタ情報
  createdAt: Date;
  updatedAt: Date;
}

// マイルストーン進捗情報
export interface MilestoneProgress {
  milestoneId: string;
  requirements: {
    [requirementIndex: number]: {
      type: MilestoneRequirement["type"];
      completed: boolean;
      progress: number; // 0-100の進捗率
      details: string; // 詳細状況
    };
  };
  overallProgress: number; // 全体進捗率
  estimatedCompletionDay?: number; // 完了予想日
}

// マイルストーン判定結果
export interface MilestoneCheckResult {
  milestoneId: string;
  wasCompleted: boolean;
  wasOverdue: boolean;
  shouldGameOver: boolean; // deadline=trueかつ遅延の場合true
  gmAction?: {
    type: "announce" | "gameover" | "continue";
    message: string;
    suggestedActions?: string[]; // GMが提示すべき行動案
  };
}

// =============================================================================
// 場所管理システム型定義（WorldBuilding → PlaceManagement移行）
// =============================================================================

// 場所管理要素の基本型（UnifiedLocationElementベース）
export interface PlaceManagementElement extends UnifiedLocationElement {
  // 場所管理固有のメタデータ
  managementInfo: {
    createdBy: "gm" | "ai" | "player"; // 作成者
    lastVisited?: Date; // 最後に訪問した日時
    visitCount: number; // 訪問回数
    isPlayerDiscovered: boolean; // プレイヤーが発見済みか
    isActiveLocation: boolean; // 現在アクティブな場所か
  };

  // 場所管理カテゴリ
  placeCategory: PlaceManagementCategory;

  // 関連する拠点情報（BaseLocationとの連携）
  relatedBaseId?: string;

  // 場所固有の探索情報
  explorationInfo?: {
    explorationDifficulty: "easy" | "medium" | "hard" | "extreme";
    requiredLevel?: number;
    timeToExplore?: number; // 探索に必要な時間（分）
    maxPartySize?: number; // 最大パーティーサイズ
    seasonalAvailability?: string[]; // 季節限定の場合
  };
}

// 場所管理カテゴリ（TRPGに特化）
export type PlaceManagementCategory =
  | "settlement" // 集落・街
  | "dungeon" // ダンジョン
  | "wilderness" // 野外・自然環境
  | "landmark" // ランドマーク・重要地点
  | "base" // プレイヤー拠点
  | "hidden" // 隠し場所
  | "travel_route" // 移動ルート
  | "event_location"; // イベント専用場所

// 場所管理アクション（TRPGセッション用）
export interface PlaceManagementAction {
  id: string;
  name: string;
  description: string;
  category:
    | "exploration"
    | "interaction"
    | "rest"
    | "shopping"
    | "quest"
    | "travel"
    | "special";
  requirements?: {
    minLevel?: number;
    requiredItems?: string[];
    requiredQuests?: string[];
    timeOfDay?: TimeOfDay[];
    weather?: string[];
  };
  effects?: {
    timeRequired: number; // 必要時間（分）
    staminaCost?: number; // スタミナコスト
    riskLevel: "none" | "low" | "medium" | "high" | "extreme";
    potentialRewards?: string[];
  };
  isAvailable: boolean; // 現在利用可能か
  cooldownUntil?: Date; // クールダウン終了時刻
}

// 場所管理コンテキスト（ReactContext用）
export interface PlaceManagementContextType {
  // 基本状態
  places: PlaceManagementElement[];
  currentPlace?: PlaceManagementElement;
  selectedPlaceId?: string;

  // 場所操作
  addPlace: (place: Omit<PlaceManagementElement, "id">) => Promise<string>; // 新しい場所のIDを返す
  updatePlace: (
    placeId: string,
    updates: Partial<PlaceManagementElement>,
  ) => Promise<boolean>;
  deletePlace: (placeId: string) => Promise<boolean>;

  // 場所発見・アクセス管理
  discoverPlace: (placeId: string) => Promise<boolean>;
  visitPlace: (placeId: string) => Promise<boolean>;
  getCurrentAccessiblePlaces: () => PlaceManagementElement[];

  // アクション管理
  getAvailableActions: (placeId: string) => PlaceManagementAction[];
  executeAction: (
    placeId: string,
    actionId: string,
  ) => Promise<TRPGActionResult>;

  // フィルタリング・検索
  filterPlacesByCategory: (
    category: PlaceManagementCategory,
  ) => PlaceManagementElement[];
  searchPlaces: (query: string) => PlaceManagementElement[];

  // AI生成支援
  generatePlaceByAI: (
    prompt: string,
    category: PlaceManagementCategory,
  ) => Promise<PlaceManagementElement>;
  enhancePlaceWithAI: (placeId: string, prompt: string) => Promise<boolean>;

  // 状態管理
  isLoading: boolean;
  error?: string;
  hasUnsavedChanges: boolean;
  saveChanges: () => Promise<boolean>;
}

// 場所管理設定
export interface PlaceManagementSettings {
  // 表示設定
  defaultCategory: PlaceManagementCategory;
  showHiddenPlaces: boolean;
  groupByCategory: boolean;
  sortBy: "name" | "visitCount" | "lastVisited" | "createdAt";

  // 探索設定
  autoDiscovery: boolean; // 近くの場所を自動発見
  discoveryRadius: number; // 発見範囲（km）
  requireExplorationActions: boolean; // 探索アクションを必須にするか

  // AI設定
  enableAIGeneration: boolean;
  aiGenerationModel: string;
  autoEnhancement: boolean; // AI自動改善機能

  // セッション連携
  trackVisitHistory: boolean;
  enableLocationEvents: boolean; // 場所でのイベント発生
  syncWithSessionState: boolean; // セッション状態との同期
}

// 場所管理統計情報
export interface PlaceManagementStats {
  totalPlaces: number;
  discoveredPlaces: number;
  visitedPlaces: number;
  categoriesUsed: PlaceManagementCategory[];
  mostVisitedPlace?: {
    placeId: string;
    name: string;
    visitCount: number;
  };
  recentlyAdded: {
    placeId: string;
    name: string;
    createdAt: Date;
  }[];
  explorationProgress: {
    totalExplorable: number;
    fullyExplored: number;
    partiallyExplored: number;
    unexplored: number;
  };
}

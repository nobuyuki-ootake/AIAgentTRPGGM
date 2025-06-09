import { TRPGCampaign, BaseLocation } from "@trpg-ai-gm/types";

/**
 * 空のキャンペーンデータのデフォルト値を生成
 */
export const createEmptyCampaign = (name: string = "新しいキャンペーン"): TRPGCampaign => {
  return {
    id: crypto.randomUUID(),
    name,
    description: "",
    
    // キャラクター関連
    characters: [],
    npcs: [],
    enemies: [],
    
    // 世界観関連
    worldBuilding: {
      places: [],
      cultures: [],
      bases: [],
      freeFields: [],
      geography: {
        environment: "",
        climate: "",
        terrain: [],
        naturalResources: []
      },
      history: {
        timeline: [],
        legends: [],
        importantEvents: []
      },
      magicTechnology: {
        magicSystem: "",
        technologyLevel: "",
        commonSpells: [],
        magicalItems: []
      }
    },
    
    // ストーリー関連
    synopsis: "",
    plot: [],
    
    // タイムライン関連
    timeline: [],
    
    // セッション関連
    sessions: [],
    
    // 画像・アセット
    imageUrl: "",
    
    // その他のメタデータ
    createdAt: new Date(),
    updatedAt: new Date(),
    
    // 書籍データ（空）
    chapters: [],
    
    // 拠点（アクセス用）
    bases: [],
  };
};

/**
 * 基本的な拠点データのテンプレート
 */
export const createDefaultBase = (name: string = "開始地点"): BaseLocation => {
  return {
    id: crypto.randomUUID(),
    name,
    description: "冒険の始まりの場所",
    type: "town",
    region: "初期地域",
    rank: "中規模都市",
    importance: "主要拠点" as const,
    facilities: {
      inn: {
        id: crypto.randomUUID(),
        name: "旅人の宿",
        roomTypes: ["シングル", "ダブル"],
        pricePerNight: { シングル: 5, ダブル: 8 },
        amenities: ["食事", "風呂"],
        availability: true
      },
      shops: [
        {
          id: crypto.randomUUID(),
          name: "武器屋",
          shopType: "武器防具店",
          inventory: ["剣", "盾", "革鎧"],
          specialties: ["近接武器"],
          prices: { 剣: 15, 盾: 10, 革鎧: 25 },
          availability: true
        }
      ]
    },
    npcs: [],
    features: {
      fastTravel: true,
      playerBase: true,
      questHub: true,
      defenseEvent: false
    }
  };
};

/**
 * 最小限のキャンペーンセットアップ
 * （TRPGセッション画面を表示するのに必要な最低限のデータ）
 */
export const createMinimalCampaign = (name: string = "新しいキャンペーン"): TRPGCampaign => {
  const campaign = createEmptyCampaign(name);
  const defaultBase = createDefaultBase("初期の街");
  
  // 最低限必要な拠点を追加
  campaign.bases = [defaultBase];
  
  return campaign;
};

/**
 * 完全に空のキャンペーン
 * （ユーザーが新規でプロジェクトを作る時用）
 */
export const createTrulyEmptyCampaign = (name: string = "新しいキャンペーン"): TRPGCampaign => {
  return createEmptyCampaign(name);
};
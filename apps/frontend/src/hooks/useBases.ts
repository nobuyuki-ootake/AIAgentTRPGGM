import { useState, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentCampaignState } from "../store/atoms";
import { BaseLocation, Inn, Shop, Armory, Temple, Guild, Blacksmith, LocationNPC } from "@novel-ai-assistant/types";
import { v4 as uuidv4 } from "uuid";

export const useBases = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 拠点一覧を取得
  const bases = currentCampaign?.bases || [];

  // 新しい拠点を作成
  const createBase = useCallback(async (baseData: Omit<BaseLocation, "id" | "created_at" | "updated_at">) => {
    if (!currentCampaign) {
      setError("キャンペーンが選択されていません");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newBase: BaseLocation = {
        ...baseData,
        id: uuidv4(),
        campaignId: currentCampaign.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedCampaign = {
        ...currentCampaign,
        bases: [...bases, newBase],
      };

      setCurrentCampaign(updatedCampaign);
      return newBase;
    } catch (err) {
      setError(err instanceof Error ? err.message : "拠点の作成に失敗しました");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign, bases, setCurrentCampaign]);

  // 拠点を更新
  const updateBase = useCallback(async (baseId: string, updates: Partial<BaseLocation>) => {
    if (!currentCampaign) {
      setError("キャンペーンが選択されていません");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedBases = bases.map(base =>
        base.id === baseId
          ? { ...base, ...updates, updated_at: new Date().toISOString() }
          : base
      );

      const updatedCampaign = {
        ...currentCampaign,
        bases: updatedBases,
      };

      setCurrentCampaign(updatedCampaign);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "拠点の更新に失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign, bases, setCurrentCampaign]);

  // 拠点を削除
  const deleteBase = useCallback(async (baseId: string) => {
    if (!currentCampaign) {
      setError("キャンペーンが選択されていません");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedBases = bases.filter(base => base.id !== baseId);

      const updatedCampaign = {
        ...currentCampaign,
        bases: updatedBases,
      };

      setCurrentCampaign(updatedCampaign);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "拠点の削除に失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign, bases, setCurrentCampaign]);

  // 特定の拠点を取得
  const getBaseById = useCallback((baseId: string): BaseLocation | undefined => {
    return bases.find(base => base.id === baseId);
  }, [bases]);

  // タイプ別の拠点取得
  const getBasesByType = useCallback((type: string): BaseLocation[] => {
    return bases.filter(base => base.type === type);
  }, [bases]);

  // 地域別の拠点取得
  const getBasesByRegion = useCallback((region: string): BaseLocation[] => {
    return bases.filter(base => base.region === region);
  }, [bases]);

  // 重要度別の拠点取得
  const getBasesByImportance = useCallback((importance: BaseLocation["importance"]): BaseLocation[] => {
    return bases.filter(base => base.importance === importance);
  }, [bases]);

  // アンロック済み拠点取得
  const getUnlockedBases = useCallback((): BaseLocation[] => {
    return bases.filter(base => base.meta.unlocked);
  }, [bases]);

  // 拠点をアンロック
  const unlockBase = useCallback(async (baseId: string) => {
    return updateBase(baseId, {
      meta: {
        ...getBaseById(baseId)?.meta,
        unlocked: true,
        lastUpdated: new Date().toISOString(),
      } as BaseLocation["meta"],
    });
  }, [updateBase, getBaseById]);

  // 特定施設を持つ拠点取得
  const getBasesWithFacility = useCallback((facilityType: keyof BaseLocation["facilities"]): BaseLocation[] => {
    return bases.filter(base => base.facilities[facilityType]);
  }, [bases]);

  // 特定サービスを提供する拠点取得
  const getBasesWithService = useCallback((service: string): BaseLocation[] => {
    return bases.filter(base => {
      const { inn, shops, armory, temple, guild, blacksmith } = base.facilities;
      
      // 各施設でサービスをチェック
      if (inn?.services?.includes(service)) return true;
      if (shops?.some(shop => shop.items.includes(service))) return true;
      if (armory && (armory.weaponTypes.includes(service) || armory.armorTypes.includes(service))) return true;
      if (temple?.functions?.includes(service)) return true;
      if (guild?.services?.includes(service)) return true;
      if (blacksmith?.services?.includes(service)) return true;
      
      return false;
    });
  }, [bases]);

  // プレイヤー拠点として使用可能な拠点取得
  const getPlayerBases = useCallback((): BaseLocation[] => {
    return bases.filter(base => base.features.playerBase);
  }, [bases]);

  // ファストトラベル可能な拠点取得
  const getFastTravelBases = useCallback((): BaseLocation[] => {
    return bases.filter(base => base.features.fastTravel && base.meta.unlocked);
  }, [bases]);

  // 拠点の基本テンプレート生成
  const createBaseTemplate = useCallback((type: string): Omit<BaseLocation, "id" | "created_at" | "updated_at"> => {
    const baseTemplate: Omit<BaseLocation, "id" | "created_at" | "updated_at"> = {
      name: "",
      type,
      region: "",
      description: "",
      rank: "小村",
      importance: "サブ拠点",
      facilities: {},
      npcs: [],
      features: {
        fastTravel: false,
        playerBase: false,
        questHub: false,
        defenseEvent: false,
      },
      threats: {
        dangerLevel: "低",
        monsterAttackRate: 0,
        playerReputation: 0,
        currentEvents: [],
        controllingFaction: "独立",
      },
      economy: {
        currency: "ゴールド",
        priceModifier: 1.0,
        localGoods: [],
        tradeGoods: [],
      },
      meta: {
        locationId: uuidv4(),
        unlocked: true,
        lastUpdated: new Date().toISOString(),
      },
    };

    // タイプに応じた調整
    switch (type) {
      case "村":
        return {
          ...baseTemplate,
          rank: "小村",
          facilities: {
            inn: {
              name: "村の宿屋",
              pricePerNight: 2,
              services: ["休息", "食事"],
            },
            shops: [{
              name: "雑貨店",
              type: "一般商店",
              items: ["基本的な生活用品", "食料", "簡単な道具"],
              priceModifier: 1.0,
            }],
          },
          npcs: [{
            id: uuidv4(),
            name: "村長",
            role: "村の指導者",
            function: "情報提供者",
          }],
          threats: {
            ...baseTemplate.threats,
            dangerLevel: "低",
            monsterAttackRate: 10,
          },
        };

      case "町":
        return {
          ...baseTemplate,
          rank: "中規模都市",
          importance: "主要拠点",
          facilities: {
            inn: {
              name: "旅人の宿",
              pricePerNight: 5,
              services: ["休息", "食事", "情報収集"],
            },
            shops: [
              {
                name: "武具店",
                type: "武具屋",
                items: ["基本的な武器", "軽装鎧", "盾"],
                priceModifier: 1.0,
              },
              {
                name: "道具屋",
                type: "一般商店",
                items: ["冒険用品", "ロープ", "たいまつ", "薬草"],
                priceModifier: 1.0,
              },
            ],
            temple: {
              name: "聖堂",
              deity: "光の神",
              functions: ["回復", "状態異常治療", "祝福"],
            },
          },
          features: {
            ...baseTemplate.features,
            fastTravel: true,
            questHub: true,
          },
          threats: {
            ...baseTemplate.threats,
            dangerLevel: "中",
            monsterAttackRate: 5,
          },
        };

      case "都市":
        return {
          ...baseTemplate,
          rank: "大都市",
          importance: "主要拠点",
          facilities: {
            inn: {
              name: "高級宿",
              pricePerNight: 10,
              services: ["休息", "食事", "情報収集", "護衛手配"],
            },
            shops: [
              {
                name: "武器商会",
                type: "武具屋",
                items: ["高品質武器", "魔法武器", "重装鎧"],
                priceModifier: 1.2,
              },
              {
                name: "魔法用品店",
                type: "魔法店",
                items: ["魔法薬", "巻物", "魔法の杖"],
                priceModifier: 1.5,
              },
            ],
            guild: {
              name: "冒険者ギルド",
              type: "冒険者ギルド",
              services: ["クエスト斡旋", "情報提供", "仲間募集"],
            },
            temple: {
              name: "大聖堂",
              deity: "諸神",
              functions: ["高位回復", "蘇生", "呪い解除"],
            },
            blacksmith: {
              name: "名工の鍛冶場",
              services: ["武器強化", "特注製作", "魔法付与"],
            },
          },
          features: {
            ...baseTemplate.features,
            fastTravel: true,
            questHub: true,
            playerBase: true,
          },
          threats: {
            ...baseTemplate.threats,
            dangerLevel: "低",
            monsterAttackRate: 1,
          },
          economy: {
            ...baseTemplate.economy,
            priceModifier: 1.1,
            localGoods: ["高級品", "芸術品"],
            tradeGoods: ["香辛料", "宝石", "魔法素材"],
          },
        };

      case "城":
        return {
          ...baseTemplate,
          rank: "要塞都市",
          importance: "主要拠点",
          facilities: {
            armory: {
              name: "城の武器庫",
              weaponTypes: ["騎士剣", "戦槌", "弩"],
              armorTypes: ["板金鎧", "騎士甲冑"],
              specialItems: ["王家の紋章入り装備"],
            },
            temple: {
              name: "城内礼拝堂",
              deity: "王家の守護神",
              functions: ["祝福", "誓約"],
            },
          },
          features: {
            ...baseTemplate.features,
            defenseEvent: true,
          },
          threats: {
            ...baseTemplate.threats,
            dangerLevel: "極低",
            monsterAttackRate: 0,
            controllingFaction: "王国",
          },
        };

      default:
        return baseTemplate;
    }
  }, []);

  return {
    bases,
    isLoading,
    error,
    createBase,
    updateBase,
    deleteBase,
    getBaseById,
    getBasesByType,
    getBasesByRegion,
    getBasesByImportance,
    getUnlockedBases,
    unlockBase,
    getBasesWithFacility,
    getBasesWithService,
    getPlayerBases,
    getFastTravelBases,
    createBaseTemplate,
  };
};
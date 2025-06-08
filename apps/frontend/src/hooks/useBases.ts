import { useState, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentCampaignState } from "../store/atoms";
import { BaseLocation, Inn, Shop, Armory, Temple, Guild, Blacksmith, LocationNPC } from "@trpg-ai-gm/types";
import { v4 as uuidv4 } from "uuid";
import { useWorldBuildingContext } from "../contexts/WorldBuildingContext";
import { TRPGLocalStorageManager } from "../utils/trpgLocalStorage";

export const useBases = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setHasUnsavedChanges } = useWorldBuildingContext();

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
      
      // localStorageに保存
      TRPGLocalStorageManager.saveCampaign(updatedCampaign);
      
      setHasUnsavedChanges?.(true);
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
      
      // localStorageに保存
      TRPGLocalStorageManager.saveCampaign(updatedCampaign);
      
      setHasUnsavedChanges?.(true);
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
      
      // localStorageに保存
      TRPGLocalStorageManager.saveCampaign(updatedCampaign);
      
      setHasUnsavedChanges?.(true);
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
      availableActions: [],
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
          availableActions: [
            {
              id: "village-rest",
              name: "宿屋で休憩する",
              description: "村の宿屋で体力を回復し、地元の情報を収集できます",
              category: "rest",
            },
            {
              id: "village-shop",
              name: "雑貨店で買い物をする",
              description: "基本的な生活用品や食料を購入できます",
              category: "shopping",
            },
            {
              id: "village-talk",
              name: "村人と話す",
              description: "村長や住民から地域の情報を聞くことができます",
              category: "social",
            },
          ],
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
          availableActions: [
            {
              id: "town-inn",
              name: "旅人の宿で休憩する",
              description: "より良い設備で休息し、旅人から有用な情報を得られます",
              category: "rest",
            },
            {
              id: "town-weapons",
              name: "武具店で装備を購入する",
              description: "基本的な武器や防具を購入して装備を強化できます",
              category: "shopping",
            },
            {
              id: "town-tools",
              name: "道具屋で冒険用品を購入する",
              description: "冒険に必要な道具や消耗品を補充できます",
              category: "shopping",
            },
            {
              id: "town-temple",
              name: "聖堂で祈りを捧げる",
              description: "回復や状態異常の治療、祝福を受けることができます",
              category: "rest",
            },
            {
              id: "town-info",
              name: "街で情報収集をする",
              description: "商人や冒険者から周辺地域の情報を収集できます",
              category: "social",
            },
          ],
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
          availableActions: [
            {
              id: "city-luxury-inn",
              name: "高級宿で休憩する",
              description: "最高級の設備で休息し、貴族や商人から重要な情報を得られます",
              category: "rest",
            },
            {
              id: "city-weapon-shop",
              name: "武器商会で高級装備を購入する",
              description: "高品質で魔法武器を含む強力な装備を購入できます",
              category: "shopping",
            },
            {
              id: "city-magic-shop",
              name: "魔法用品店で魔法アイテムを購入する",
              description: "魔法薬、巻物、魔法の杖など特殊なアイテムを購入できます",
              category: "shopping",
            },
            {
              id: "city-guild",
              name: "冒険者ギルドでクエストを受ける",
              description: "高難易度のクエストを受注し、仲間を募集できます",
              category: "quest",
            },
            {
              id: "city-cathedral",
              name: "大聖堂で高位の祈りを捧げる",
              description: "高位回復、蘇生、呪い解除などの強力な神聖魔法を受けられます",
              category: "rest",
            },
            {
              id: "city-blacksmith",
              name: "名工の鍛冶場で装備を強化する",
              description: "武器強化や特注製作、魔法付与を依頼できます",
              category: "custom",
            },
            {
              id: "city-training",
              name: "都市で特殊訓練を受ける",
              description: "高級な訓練施設でスキルアップや新技能の習得ができます",
              category: "training",
            },
          ],
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
          availableActions: [
            {
              id: "castle-audience",
              name: "領主に謁見する",
              description: "城主や貴族に会い、重要な任務や情報を得ることができます",
              category: "social",
            },
            {
              id: "castle-armory",
              name: "城の武器庫を利用する",
              description: "王家の紋章入り装備など、特別な武器や防具を入手できます",
              category: "shopping",
            },
            {
              id: "castle-chapel",
              name: "城内礼拝堂で祈りを捧げる",
              description: "王家の守護神に祈り、特別な祝福や誓約を受けることができます",
              category: "rest",
            },
            {
              id: "castle-training",
              name: "騎士団と訓練をする",
              description: "熟練の騎士から戦闘技術を学び、武術を向上させることができます",
              category: "training",
            },
            {
              id: "castle-library",
              name: "城の図書館で調査する",
              description: "古文書や歴史書から貴重な知識や情報を得ることができます",
              category: "social",
            },
          ],
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
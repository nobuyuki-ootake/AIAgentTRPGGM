import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from "react";
import { useBases } from "../hooks/useBases";
import { useHome } from "../hooks/useHome";
import {
  PlaceManagementContextType,
  PlaceManagementElement,
  PlaceManagementCategory,
  PlaceManagementAction,
  PlaceManagementSettings,
  PlaceManagementStats,
  TRPGActionResult,
  BaseLocation,
  TRPGPlaceElement,
  TRPGCampaign,
} from "@trpg-ai-gm/types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// Contextの作成
const PlaceManagementContext = createContext<
  PlaceManagementContextType | undefined
>(undefined);

// Providerコンポーネント
export const PlaceManagementProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // 拠点管理
  const {
    bases,
    isLoading: basesLoading,
    error: basesError,
    createBase,
    updateBase,
    deleteBase,
    getBaseById: _getBaseById,
    getBasesByType: _getBasesByType,
    getBasesByImportance: _getBasesByImportance,
    unlockBase: _unlockBase,
  } = useBases();

  // キャンペーン管理
  const { 
    currentCampaign: campaign, 
    updateAndSaveCurrentCampaign 
  } = useHome();

  // ローカル状態
  const [selectedPlaceId, _setSelectedPlaceId] = useState<string | undefined>();
  const [trpgPlaces, setTrpgPlaces] = useState<TRPGPlaceElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 設定（将来的に永続化）
  const [settings] = useState<PlaceManagementSettings>({
    defaultCategory: "settlement",
    showHiddenPlaces: false,
    groupByCategory: true,
    sortBy: "name",
    autoDiscovery: false,
    discoveryRadius: 10,
    requireExplorationActions: false,
    enableAIGeneration: true,
    aiGenerationModel: "gemini-1.5-pro",
    autoEnhancement: false,
    trackVisitHistory: true,
    enableLocationEvents: true,
    syncWithSessionState: true,
  });

  // 統合された場所リスト
  const places: PlaceManagementElement[] = React.useMemo(() => {
    const baseElements: PlaceManagementElement[] = bases.map((base) => ({
      ...base,
      // TRPGPlaceElementベースの属性を追加
      type: base.type || "town",
      region: base.region || "",
      connections: [],
      dangerLevel: "safe" as const,
      features: "",
      npcs: base.npcs?.map(npc => npc.id) || [],
      enemies: [],
      treasures: [],
      quests: [],
      unlocked: base.meta?.unlocked || false,
      
      // PlaceManagementElement固有の属性
      managementInfo: {
        createdBy: "gm" as const,
        lastVisited: new Date(),
        visitCount: 0,
        isPlayerDiscovered: base.meta?.unlocked || false,
        isActiveLocation: false,
      },
      placeCategory: "base" as PlaceManagementCategory,
      relatedBaseId: base.id,
      explorationInfo: {
        explorationDifficulty: "easy" as const,
        requiredLevel: 1,
        timeToExplore: 30,
        maxPartySize: 6,
      },
    }));

    const trpgElements: PlaceManagementElement[] = trpgPlaces.map((place) => ({
      ...place,
      // BaseLocationベースの属性を追加（必要なもののみ）
      region: place.region || "",
      rank: "未設定",
      importance: "サブ拠点" as const,
      facilities: {},
      npcs: [],
      features: {
        fastTravel: false,
        playerBase: false,
        questHub: false,
        defenseEvent: false,
      },
      threats: {
        dangerLevel: place.dangerLevel || "low",
        monsterAttackRate: 5,
        playerReputation: 0,
        currentEvents: [],
        controllingFaction: "中立",
      },
      economy: {
        currency: "ゴールド",
        priceModifier: 1.0,
        localGoods: [],
        tradeGoods: [],
      },
      meta: {
        locationId: place.id,
        unlocked: place.unlocked || false,
        lastUpdated: new Date().toISOString(),
      },
      
      // PlaceManagementElement固有の属性
      managementInfo: {
        createdBy: "ai" as const,
        lastVisited: new Date(),
        visitCount: 0,
        isPlayerDiscovered: place.unlocked || false,
        isActiveLocation: false,
      },
      placeCategory: getPlaceCategoryFromType(place.type),
      explorationInfo: {
        explorationDifficulty: place.dangerLevel === "safe" ? "easy" : 
                              place.dangerLevel === "low" ? "medium" :
                              place.dangerLevel === "medium" ? "hard" : "extreme",
        requiredLevel: 1,
        timeToExplore: 60,
        maxPartySize: 4,
      },
    }));

    return [...baseElements, ...trpgElements];
  }, [bases, trpgPlaces]);

  // ヘルパー関数
  const getPlaceCategoryFromType = (type: string): PlaceManagementCategory => {
    switch (type) {
      case "town":
      case "village": 
        return "settlement";
      case "dungeon": 
        return "dungeon";
      case "field":
      case "forest":
      case "mountain": 
        return "wilderness";
      case "landmark": 
        return "landmark";
      default: 
        return "settlement";
    }
  };

  // 現在の場所
  const currentPlace = selectedPlaceId 
    ? places.find(p => p.id === selectedPlaceId)
    : undefined;

  // 場所操作
  const addPlace = useCallback(async (place: Omit<PlaceManagementElement, "id">): Promise<string> => {
    const newId = uuidv4();
    const newPlace: PlaceManagementElement = {
      ...place,
      id: newId,
    };

    if (place.placeCategory === "base") {
      // BaseLocationとして追加
      const baseData: Omit<BaseLocation, "id" | "created_at" | "updated_at"> = {
        name: place.name,
        type: place.type,
        region: place.region || "",
        description: place.description,
        rank: place.rank || "小村",
        importance: place.importance || "サブ拠点",
        facilities: place.facilities || {},
        npcs: [],
        features: place.features || {
          fastTravel: false,
          playerBase: false,
          questHub: false,
          defenseEvent: false,
        },
        threats: place.threats || {
          dangerLevel: "低",
          monsterAttackRate: 0,
          playerReputation: 0,
          currentEvents: [],
          controllingFaction: "中立",
        },
        economy: place.economy || {
          currency: "ゴールド",
          priceModifier: 1.0,
          localGoods: [],
          tradeGoods: [],
        },
        meta: {
          locationId: newId,
          unlocked: true,
          lastUpdated: new Date().toISOString(),
        },
      };
      
      const base = await createBase(baseData);
      if (base) {
        setHasUnsavedChanges(true);
        toast.success("拠点が追加されました");
        return base.id;
      } else {
        throw new Error("拠点の作成に失敗しました");
      }
    } else {
      // TRPGPlaceElementとして追加
      const updatedPlaces = [...trpgPlaces, newPlace as TRPGPlaceElement];
      setTrpgPlaces(updatedPlaces);
      setHasUnsavedChanges(true);
      toast.success("場所が追加されました");
      return newId;
    }
  }, [createBase, trpgPlaces]);

  const updatePlace = useCallback(async (placeId: string, updates: Partial<PlaceManagementElement>): Promise<boolean> => {
    const place = places.find(p => p.id === placeId);
    if (!place) return false;

    if (place.placeCategory === "base" && place.relatedBaseId) {
      // BaseLocationを更新
      const success = await updateBase(place.relatedBaseId, updates as Partial<BaseLocation>);
      if (success) {
        setHasUnsavedChanges(true);
        toast.success("拠点が更新されました");
      }
      return success;
    } else {
      // TRPGPlaceElementを更新
      const updatedPlaces = trpgPlaces.map(p =>
        p.id === placeId ? { ...p, ...updates } : p
      );
      setTrpgPlaces(updatedPlaces);
      setHasUnsavedChanges(true);
      toast.success("場所が更新されました");
      return true;
    }
  }, [places, updateBase, trpgPlaces]);

  const deletePlace = useCallback(async (placeId: string): Promise<boolean> => {
    const place = places.find(p => p.id === placeId);
    if (!place) return false;

    if (place.placeCategory === "base" && place.relatedBaseId) {
      // BaseLocationを削除
      const success = await deleteBase(place.relatedBaseId);
      if (success) {
        setHasUnsavedChanges(true);
        toast.success("拠点が削除されました");
      }
      return success;
    } else {
      // TRPGPlaceElementを削除
      const updatedPlaces = trpgPlaces.filter(p => p.id !== placeId);
      setTrpgPlaces(updatedPlaces);
      setHasUnsavedChanges(true);
      toast.success("場所が削除されました");
      return true;
    }
  }, [places, deleteBase, trpgPlaces]);

  // 場所発見・アクセス管理
  const discoverPlace = useCallback(async (placeId: string): Promise<boolean> => {
    const place = places.find(p => p.id === placeId);
    if (!place || !place.managementInfo) {
      return false;
    }
    
    return await updatePlace(placeId, {
      managementInfo: {
        ...place.managementInfo,
        isPlayerDiscovered: true,
      },
      unlocked: true,
    });
  }, [updatePlace, places]);

  const visitPlace = useCallback(async (placeId: string): Promise<boolean> => {
    const place = places.find(p => p.id === placeId);
    if (!place) return false;

    return await updatePlace(placeId, {
      managementInfo: {
        ...place.managementInfo,
        lastVisited: new Date(),
        visitCount: place.managementInfo.visitCount + 1,
        isActiveLocation: true,
      },
    });
  }, [updatePlace, places]);

  const getCurrentAccessiblePlaces = useCallback((): PlaceManagementElement[] => {
    return places.filter(place => 
      place.managementInfo.isPlayerDiscovered || 
      place.unlocked ||
      !settings.showHiddenPlaces
    );
  }, [places, settings.showHiddenPlaces]);

  // アクション管理
  const getAvailableActions = useCallback((placeId: string): PlaceManagementAction[] => {
    const place = places.find(p => p.id === placeId);
    if (!place) return [];

    // 基本的なアクションを場所タイプに応じて生成
    const baseActions: PlaceManagementAction[] = [];

    if (place.placeCategory === "base") {
      baseActions.push({
        id: "rest",
        name: "休息する",
        description: "体力を回復し、時間を進めます",
        category: "rest",
        effects: {
          timeRequired: 480, // 8時間
          riskLevel: "none",
        },
        isAvailable: true,
      });

      if (place.facilities?.inn) {
        baseActions.push({
          id: "stay_inn",
          name: "宿屋に泊まる",
          description: "安全に休息し、完全回復できます",
          category: "rest",
          effects: {
            timeRequired: 480,
            riskLevel: "none",
            potentialRewards: ["完全回復"],
          },
          isAvailable: true,
        });
      }

      if (place.facilities?.shops && place.facilities.shops.length > 0) {
        baseActions.push({
          id: "shopping",
          name: "買い物をする",
          description: "アイテムを購入できます",
          category: "shopping",
          effects: {
            timeRequired: 30,
            riskLevel: "none",
          },
          isAvailable: true,
        });
      }
    }

    if (place.placeCategory === "dungeon" || place.placeCategory === "wilderness") {
      baseActions.push({
        id: "explore",
        name: "探索する",
        description: "この場所を詳しく調べます",
        category: "exploration",
        effects: {
          timeRequired: place.explorationInfo?.timeToExplore || 60,
          riskLevel: place.explorationInfo?.explorationDifficulty === "easy" ? "low" : 
                   place.explorationInfo?.explorationDifficulty === "medium" ? "medium" : "high",
          potentialRewards: ["経験値", "アイテム", "情報"],
        },
        isAvailable: true,
      });
    }

    return baseActions;
  }, [places]);

  const executeAction = useCallback(async (placeId: string, actionId: string): Promise<TRPGActionResult> => {
    const place = places.find(p => p.id === placeId);
    const action = getAvailableActions(placeId).find(a => a.id === actionId);
    
    if (!place || !action) {
      throw new Error("場所またはアクションが見つかりません");
    }

    // 基本的なアクション実行結果を生成
    const result: TRPGActionResult = {
      narrative: `${place.name}で「${action.name}」を実行しました。`,
      gameEffects: [],
      futureConsequences: [],
      gmNotes: {
        importantFlags: [],
        plotAdvancement: `${place.name}での活動`,
        playerChoiceImpact: "軽微",
      },
    };

    // アクションタイプに応じた効果を追加
    switch (action.id) {
      case "rest":
      case "stay_inn":
        result.gameEffects.push({
          id: uuidv4(),
          type: "hp_change",
          description: "体力が完全回復しました",
          value: 999, // 完全回復を示す大きな値
        });
        break;
      case "explore":
        result.gameEffects.push({
          id: uuidv4(),
          type: "experience_change",
          description: "探索により経験値を獲得しました",
          value: 50,
        });
        break;
    }

    // 訪問記録を更新
    await visitPlace(placeId);

    return result;
  }, [places, getAvailableActions, visitPlace]);

  // フィルタリング・検索
  const filterPlacesByCategory = useCallback((category: PlaceManagementCategory): PlaceManagementElement[] => {
    return places.filter(place => place.placeCategory === category);
  }, [places]);

  const searchPlaces = useCallback((query: string): PlaceManagementElement[] => {
    const lowerQuery = query.toLowerCase();
    return places.filter(place =>
      place.name.toLowerCase().includes(lowerQuery) ||
      place.description.toLowerCase().includes(lowerQuery) ||
      (place.region && place.region.toLowerCase().includes(lowerQuery))
    );
  }, [places]);

  // AI生成支援（スタブ実装）
  const generatePlaceByAI = useCallback(async (prompt: string, category: PlaceManagementCategory): Promise<PlaceManagementElement> => {
    // TODO: 実際のAI生成APIを実装
    setIsLoading(true);
    setError(undefined);
    
    try {
      // 模擬的な生成処理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPlace: PlaceManagementElement = {
        id: uuidv4(),
        name: `AI生成場所_${Date.now()}`,
        type: category === "settlement" ? "town" : "dungeon",
        description: `AIにより生成された${category}です。${prompt}`,
        region: "AI生成地域",
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
          controllingFaction: "中立",
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
        managementInfo: {
          createdBy: "ai",
          lastVisited: new Date(),
          visitCount: 0,
          isPlayerDiscovered: true,
          isActiveLocation: false,
        },
        placeCategory: category,
        explorationInfo: {
          explorationDifficulty: "medium",
          requiredLevel: 1,
          timeToExplore: 60,
          maxPartySize: 4,
        },
      };
      
      return newPlace;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "AI生成エラー";
      setError(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enhancePlaceWithAI = useCallback(async (placeId: string, prompt: string): Promise<boolean> => {
    // TODO: 実際のAI強化APIを実装
    setIsLoading(true);
    setError(undefined);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const enhancedDescription = `${places.find(p => p.id === placeId)?.description || ""}\n\nAI強化: ${prompt}`;
      await updatePlace(placeId, { description: enhancedDescription });
      
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "AI強化エラー";
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [places, updatePlace]);

  // 状態管理
  const saveChanges = useCallback(async (): Promise<boolean> => {
    try {
      if (campaign) {
        // TRPGPlaceElementsをキャンペーンに保存
        const updatedCampaign: TRPGCampaign = {
          ...campaign,
          worldBuilding: {
            ...campaign.worldBuilding,
            places: trpgPlaces,
          },
          updatedAt: new Date(),
        };
        
        updateAndSaveCurrentCampaign(updatedCampaign);
        setHasUnsavedChanges(false);
        toast.success("場所データが保存されました");
        return true;
      }
      return false;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "保存エラー";
      setError(errorMsg);
      toast.error(`保存に失敗しました: ${errorMsg}`);
      return false;
    }
  }, [campaign, trpgPlaces, updateAndSaveCurrentCampaign]);

  // 統計情報の計算
  const _getStats = useCallback((): PlaceManagementStats => {
    const categoriesUsed = Array.from(new Set(places.map(p => p.placeCategory)));
    const discoveredPlaces = places.filter(p => p.managementInfo.isPlayerDiscovered);
    const visitedPlaces = places.filter(p => p.managementInfo.visitCount > 0);
    
    const mostVisitedPlace = places.reduce((prev, current) => 
      (current.managementInfo.visitCount > (prev?.managementInfo.visitCount || 0)) ? current : prev
    , places[0]);

    return {
      totalPlaces: places.length,
      discoveredPlaces: discoveredPlaces.length,
      visitedPlaces: visitedPlaces.length,
      categoriesUsed,
      mostVisitedPlace: mostVisitedPlace ? {
        placeId: mostVisitedPlace.id,
        name: mostVisitedPlace.name,
        visitCount: mostVisitedPlace.managementInfo.visitCount,
      } : undefined,
      recentlyAdded: places
        .sort((a, b) => new Date(b.meta?.lastUpdated || 0).getTime() - new Date(a.meta?.lastUpdated || 0).getTime())
        .slice(0, 5)
        .map(p => ({
          placeId: p.id,
          name: p.name,
          createdAt: new Date(p.meta?.lastUpdated || Date.now()),
        })),
      explorationProgress: {
        totalExplorable: places.filter(p => p.placeCategory !== "base").length,
        fullyExplored: places.filter(p => p.managementInfo.visitCount >= 3).length,
        partiallyExplored: places.filter(p => p.managementInfo.visitCount > 0 && p.managementInfo.visitCount < 3).length,
        unexplored: places.filter(p => p.managementInfo.visitCount === 0).length,
      },
    };
  }, [places]);

  const contextValue: PlaceManagementContextType = {
    // 基本状態
    places,
    currentPlace,
    selectedPlaceId,
    
    // 場所操作
    addPlace,
    updatePlace,
    deletePlace,
    
    // 場所発見・アクセス管理
    discoverPlace,
    visitPlace,
    getCurrentAccessiblePlaces,
    
    // アクション管理
    getAvailableActions,
    executeAction,
    
    // フィルタリング・検索
    filterPlacesByCategory,
    searchPlaces,
    
    // AI生成支援
    generatePlaceByAI,
    enhancePlaceWithAI,
    
    // 状態管理
    isLoading: isLoading || basesLoading,
    error: error || basesError,
    hasUnsavedChanges,
    saveChanges,
  };

  return (
    <PlaceManagementContext.Provider value={contextValue}>
      {children}
    </PlaceManagementContext.Provider>
  );
};

// Contextを使用するためのカスタムフック
export const usePlaceManagementContext = () => {
  const context = useContext(PlaceManagementContext);
  if (context === undefined) {
    throw new Error(
      "usePlaceManagementContext must be used within a PlaceManagementProvider"
    );
  }
  return context;
};
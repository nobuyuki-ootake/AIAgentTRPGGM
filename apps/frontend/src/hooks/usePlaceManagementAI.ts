import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  PlaceManagementElement,
  PlaceManagementCategory,
  TRPGPlaceElement,
  BaseLocation,
  QuestElement,
  TRPGCharacter,
  TRPGCampaign,
} from "@trpg-ai-gm/types";
import { aiAgentApi } from "../api/aiAgent";
import { toast } from "sonner";

export interface PlaceManagementAIHook {
  // AI生成状態
  isGenerating: boolean;
  generationProgress: number;
  currentGeneratingPlace: string;
  totalPlacesToGenerate: number;
  
  // AI生成機能
  generatePlacesByAI: (
    prompt: string,
    categories: PlaceManagementCategory[],
    campaign: TRPGCampaign,
    count?: number
  ) => Promise<PlaceManagementElement[]>;
  
  generateSinglePlace: (
    name: string,
    category: PlaceManagementCategory,
    prompt: string,
    campaign: TRPGCampaign
  ) => Promise<PlaceManagementElement>;
  
  enhancePlaceDescription: (
    place: PlaceManagementElement,
    enhancementPrompt: string
  ) => Promise<string>;
  
  generatePlaceActions: (
    place: PlaceManagementElement,
    campaign: TRPGCampaign
  ) => Promise<{ id: string; name: string; description: string; category: string }[]>;
  
  // バッチ生成
  generateBalancedPlaceSet: (
    campaign: TRPGCampaign,
    requirements?: {
      settlements?: number;
      dungeons?: number;
      wilderness?: number;
      landmarks?: number;
    }
  ) => Promise<PlaceManagementElement[]>;
  
  // AI分析
  analyzePlaceBalance: (
    places: PlaceManagementElement[],
    campaign: TRPGCampaign
  ) => Promise<{
    balance: "良好" | "偏り有り" | "不足";
    suggestions: string[];
    missingCategories: PlaceManagementCategory[];
  }>;
  
  // エラーハンドリング
  error?: string;
  clearError: () => void;
}

/**
 * 場所管理のAI支援機能を管理するカスタムフック
 */
export const usePlaceManagementAI = (): PlaceManagementAIHook => {
  // 生成状態
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneratingPlace, setCurrentGeneratingPlace] = useState("");
  const [totalPlacesToGenerate, setTotalPlacesToGenerate] = useState(0);
  const [error, setError] = useState<string>();

  // エラークリア
  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  // カテゴリから場所タイプへの変換
  const getCategoryBasePlaceType = (category: PlaceManagementCategory): string => {
    switch (category) {
      case "settlement": return "town";
      case "dungeon": return "dungeon";
      case "wilderness": return "field";
      case "landmark": return "landmark";
      case "base": return "town";
      case "hidden": return "other";
      case "travel_route": return "other";
      case "event_location": return "other";
      default: return "other";
    }
  };

  // キャンペーンコンテキストの構築
  const buildCampaignContext = (campaign: TRPGCampaign): string => {
    return `
**キャンペーン情報:**
タイトル: ${campaign.title}
ゲームシステム: ${campaign.gameSystem}
あらすじ: ${campaign.synopsis}

**既存のクエスト:**
${campaign.quests?.map(q => `- ${q.title}: ${q.description}`).join('\n') || '（なし）'}

**キャラクター:**
${campaign.characters?.map(c => `- ${c.name}: ${c.description}`).join('\n') || '（なし）'}

**既存の拠点:**
${campaign.bases?.map(b => `- ${b.name}: ${b.description}`).join('\n') || '（なし）'}
`;
  };

  // 単一場所生成
  const generateSinglePlace = useCallback(async (
    name: string,
    category: PlaceManagementCategory,
    prompt: string,
    campaign: TRPGCampaign
  ): Promise<PlaceManagementElement> => {
    setIsGenerating(true);
    setError(undefined);
    setCurrentGeneratingPlace(name);
    setGenerationProgress(0);
    
    try {
      const contextualPrompt = `
${buildCampaignContext(campaign)}

**生成指示:**
場所名: ${name}
カテゴリ: ${category}
要求: ${prompt}

この情報を基に、TRPG用の場所データを生成してください。
場所の説明、特徴、利用可能な施設、NPC、アクション等を含めてください。`;

      setGenerationProgress(30);

      // AI APIを呼び出して場所を生成
      const response = await aiAgentApi.generatePlaceDetail(
        name,
        getCategoryBasePlaceType(category),
        contextualPrompt,
        campaign.quests || [],
        campaign.characters || [],
        "json"
      );

      setGenerationProgress(70);

      if (response.status !== "success" || !response.data) {
        throw new Error("場所の生成に失敗しました");
      }

      // AIレスポンスをPlaceManagementElementに変換
      const aiData = response.data;
      const newPlace: PlaceManagementElement = {
        id: uuidv4(),
        name: aiData.name || name,
        type: getCategoryBasePlaceType(category),
        description: aiData.description || "AI生成された場所です。",
        region: aiData.region || "未指定地域",
        
        // BaseLocation互換フィールド
        rank: category === "settlement" ? "中規模都市" : "未設定",
        importance: category === "base" ? "主要拠点" : "サブ拠点",
        facilities: {},
        npcs: [],
        features: {
          fastTravel: category === "settlement" || category === "base",
          playerBase: category === "base",
          questHub: category === "settlement",
          defenseEvent: false,
        },
        threats: {
          dangerLevel: category === "dungeon" ? "高" : "低",
          monsterAttackRate: category === "dungeon" ? 30 : 5,
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
        
        // TRPGPlaceElement互換フィールド
        connections: [],
        dangerLevel: category === "dungeon" ? "high" : 
                    category === "wilderness" ? "medium" : "safe",
        features: aiData.features || "",
        npcs: [],
        enemies: [],
        treasures: [],
        quests: [],
        unlocked: true,
        
        // PlaceManagementElement固有フィールド
        managementInfo: {
          createdBy: "ai",
          lastVisited: new Date(),
          visitCount: 0,
          isPlayerDiscovered: true,
          isActiveLocation: false,
        },
        placeCategory: category,
        explorationInfo: {
          explorationDifficulty: category === "dungeon" ? "hard" : 
                                category === "wilderness" ? "medium" : "easy",
          requiredLevel: category === "dungeon" ? 3 : 1,
          timeToExplore: category === "dungeon" ? 120 : 60,
          maxPartySize: 6,
        },
      };

      setGenerationProgress(100);
      toast.success(`${name}の生成が完了しました`);
      
      return newPlace;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "場所生成エラー";
      setError(errorMsg);
      toast.error(`場所生成エラー: ${errorMsg}`);
      throw error;
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingPlace("");
      setGenerationProgress(0);
    }
  }, []);

  // 複数場所生成
  const generatePlacesByAI = useCallback(async (
    prompt: string,
    categories: PlaceManagementCategory[],
    campaign: TRPGCampaign,
    count: number = 5
  ): Promise<PlaceManagementElement[]> => {
    setIsGenerating(true);
    setError(undefined);
    setTotalPlacesToGenerate(count);
    setGenerationProgress(0);
    
    try {
      const contextualPrompt = `
${buildCampaignContext(campaign)}

**生成指示:**
${prompt}

以下のカテゴリの場所を${count}箇所生成してください:
${categories.map(cat => `- ${cat}`).join('\n')}

各場所には以下を含めてください:
- 名前と説明
- 特徴的な施設やNPC
- プレイヤーが実行可能なアクション
- ゲームバランスを考慮した配置
`;

      setGenerationProgress(20);

      // 場所名リスト生成
      const listResponse = await aiAgentApi.generatePlaceList(
        contextualPrompt,
        campaign.quests || [],
        campaign.characters || [],
        "gemini-1.5-pro",
        "json",
        "place-management-list"
      );

      if (listResponse.status !== "success" || !listResponse.data) {
        throw new Error("場所リストの生成に失敗しました");
      }

      setGenerationProgress(40);

      // 生成された場所リストを解析
      let placeList: Array<{ name: string; type: string; category?: PlaceManagementCategory }> = [];
      
      try {
        if (typeof listResponse.data === "string") {
          placeList = JSON.parse(listResponse.data);
        } else if (Array.isArray(listResponse.data)) {
          placeList = listResponse.data;
        }
      } catch (parseError) {
        console.error("場所リスト解析エラー:", parseError);
        throw new Error("生成された場所リストの解析に失敗しました");
      }

      const places: PlaceManagementElement[] = [];
      const progressPerPlace = 50 / placeList.length;

      // 各場所の詳細生成
      for (let i = 0; i < placeList.length; i++) {
        const placeInfo = placeList[i];
        setCurrentGeneratingPlace(placeInfo.name);
        
        try {
          const category = placeInfo.category || 
                          categories[i % categories.length] || 
                          "settlement";
          
          const place = await generateSinglePlace(
            placeInfo.name,
            category,
            `タイプ: ${placeInfo.type}`,
            campaign
          );
          
          places.push(place);
          
          const currentProgress = 40 + (i + 1) * progressPerPlace;
          setGenerationProgress(currentProgress);
          
          // API制限回避のための待機
          if (i < placeList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`場所 ${placeInfo.name} の生成失敗:`, error);
          // 個別の場所生成失敗は継続
        }
      }

      setGenerationProgress(100);
      toast.success(`${places.length}箇所の場所生成が完了しました`);
      
      return places;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "場所生成エラー";
      setError(errorMsg);
      toast.error(`場所生成エラー: ${errorMsg}`);
      throw error;
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingPlace("");
      setTotalPlacesToGenerate(0);
      setGenerationProgress(0);
    }
  }, [generateSinglePlace]);

  // バランス取れた場所セット生成
  const generateBalancedPlaceSet = useCallback(async (
    campaign: TRPGCampaign,
    requirements = {
      settlements: 2,
      dungeons: 2,
      wilderness: 2,
      landmarks: 1,
    }
  ): Promise<PlaceManagementElement[]> => {
    const categories: PlaceManagementCategory[] = [];
    
    // 要求に応じてカテゴリリストを構築
    for (let i = 0; i < requirements.settlements; i++) categories.push("settlement");
    for (let i = 0; i < requirements.dungeons; i++) categories.push("dungeon");
    for (let i = 0; i < requirements.wilderness; i++) categories.push("wilderness");
    for (let i = 0; i < requirements.landmarks; i++) categories.push("landmark");
    
    const total = categories.length;
    const prompt = `
TRPGキャンペーン用のバランス取れた場所セットを生成してください。

要求:
- 拠点・街: ${requirements.settlements}箇所（休息、買い物、情報収集）
- ダンジョン: ${requirements.dungeons}箇所（戦闘、探索、宝探し）
- 野外・自然: ${requirements.wilderness}箇所（移動、遭遇、資源採集）
- ランドマーク: ${requirements.landmarks}箇所（ストーリー重要地点）

各場所はプレイヤーの冒険を支援し、ゲーム進行に寄与するように設計してください。
`;
    
    return await generatePlacesByAI(prompt, categories, campaign, total);
  }, [generatePlacesByAI]);

  // 場所説明強化
  const enhancePlaceDescription = useCallback(async (
    place: PlaceManagementElement,
    enhancementPrompt: string
  ): Promise<string> => {
    setIsGenerating(true);
    setError(undefined);
    
    try {
      const contextualPrompt = `
既存の場所情報:
名前: ${place.name}
現在の説明: ${place.description}
カテゴリ: ${place.placeCategory}

強化要求: ${enhancementPrompt}

上記の情報を基に、より詳細で魅力的な場所の説明を生成してください。
既存の情報との一貫性を保ち、TRPG用途に適した内容にしてください。
`;

      const response = await aiAgentApi.generateSynopsis(
        contextualPrompt,
        { place },
        "gemini-1.5-pro",
        "text"
      );

      if (response.status !== "success" || !response.data) {
        throw new Error("説明の強化に失敗しました");
      }

      const enhancedDescription = typeof response.data === "string" 
        ? response.data 
        : place.description;

      toast.success("場所の説明が強化されました");
      return enhancedDescription;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "説明強化エラー";
      setError(errorMsg);
      toast.error(`説明強化エラー: ${errorMsg}`);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 場所アクション生成
  const generatePlaceActions = useCallback(async (
    place: PlaceManagementElement,
    campaign: TRPGCampaign
  ): Promise<{ id: string; name: string; description: string; category: string }[]> => {
    setIsGenerating(true);
    setError(undefined);
    
    try {
      const contextualPrompt = `
${buildCampaignContext(campaign)}

場所情報:
名前: ${place.name}
カテゴリ: ${place.placeCategory}
説明: ${place.description}

この場所でプレイヤーが実行できるアクションを5-8個生成してください。
各アクションには以下を含めてください:
- アクション名
- 説明
- カテゴリ（exploration, social, shopping, rest, quest, special）
- 効果や結果

TRPGセッションで実際に使用できる、具体的で実行可能なアクションを生成してください。
`;

      const response = await aiAgentApi.generateSynopsis(
        contextualPrompt,
        { place, campaign },
        "gemini-1.5-pro",
        "json"
      );

      if (response.status !== "success" || !response.data) {
        throw new Error("アクションの生成に失敗しました");
      }

      let actions: any[] = [];
      try {
        if (typeof response.data === "string") {
          actions = JSON.parse(response.data);
        } else if (Array.isArray(response.data)) {
          actions = response.data;
        }
      } catch (parseError) {
        console.error("アクション解析エラー:", parseError);
        throw new Error("生成されたアクションの解析に失敗しました");
      }

      const formattedActions = actions.map(action => ({
        id: uuidv4(),
        name: action.name || "不明なアクション",
        description: action.description || "",
        category: action.category || "special",
      }));

      toast.success(`${formattedActions.length}個のアクションが生成されました`);
      return formattedActions;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "アクション生成エラー";
      setError(errorMsg);
      toast.error(`アクション生成エラー: ${errorMsg}`);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // 場所バランス分析
  const analyzePlaceBalance = useCallback(async (
    places: PlaceManagementElement[],
    campaign: TRPGCampaign
  ): Promise<{
    balance: "良好" | "偏り有り" | "不足";
    suggestions: string[];
    missingCategories: PlaceManagementCategory[];
  }> => {
    setIsGenerating(true);
    setError(undefined);
    
    try {
      const categoryCount = places.reduce((acc, place) => {
        acc[place.placeCategory] = (acc[place.placeCategory] || 0) + 1;
        return acc;
      }, {} as Record<PlaceManagementCategory, number>);

      const allCategories: PlaceManagementCategory[] = [
        "settlement", "dungeon", "wilderness", "landmark", "base"
      ];
      
      const missingCategories = allCategories.filter(cat => !categoryCount[cat]);
      
      const contextualPrompt = `
${buildCampaignContext(campaign)}

現在の場所分布:
${allCategories.map(cat => `${cat}: ${categoryCount[cat] || 0}箇所`).join('\n')}

合計場所数: ${places.length}

このTRPGキャンペーンに必要な場所バランスを分析し、改善提案をしてください。
- 不足している場所タイプ
- 推奨する追加場所
- ゲームバランス向上のための提案
`;

      const response = await aiAgentApi.generateSynopsis(
        contextualPrompt,
        { places, campaign },
        "gemini-1.5-pro",
        "json"
      );

      if (response.status !== "success" || !response.data) {
        throw new Error("バランス分析に失敗しました");
      }

      let analysisResult: any = {};
      try {
        if (typeof response.data === "string") {
          analysisResult = JSON.parse(response.data);
        } else {
          analysisResult = response.data;
        }
      } catch (parseError) {
        console.error("分析結果解析エラー:", parseError);
        throw new Error("分析結果の解析に失敗しました");
      }

      // 簡易バランス判定
      const minRequiredByCategory = { settlement: 1, dungeon: 1, wilderness: 1 };
      const hasMinimum = Object.entries(minRequiredByCategory).every(
        ([cat, min]) => (categoryCount[cat as PlaceManagementCategory] || 0) >= min
      );

      const balance: "良好" | "偏り有り" | "不足" = 
        places.length < 3 ? "不足" :
        !hasMinimum ? "偏り有り" : "良好";

      return {
        balance,
        suggestions: analysisResult.suggestions || [],
        missingCategories,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "バランス分析エラー";
      setError(errorMsg);
      toast.error(`バランス分析エラー: ${errorMsg}`);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    // AI生成状態
    isGenerating,
    generationProgress,
    currentGeneratingPlace,
    totalPlacesToGenerate,
    
    // AI生成機能
    generatePlacesByAI,
    generateSinglePlace,
    enhancePlaceDescription,
    generatePlaceActions,
    
    // バッチ生成
    generateBalancedPlaceSet,
    
    // AI分析
    analyzePlaceBalance,
    
    // エラーハンドリング
    error,
    clearError,
  };
};
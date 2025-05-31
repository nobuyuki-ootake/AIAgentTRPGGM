import { useState, useCallback } from "react";
import { useElementAccumulator } from "./useElementAccumulator";
import { v4 as uuidv4 } from "uuid";
import {
  PlaceElement,
  CultureElement,
  RuleElement,
  WorldmapElement,
  SettingElement,
  GeographyEnvironmentElement,
  MagicTechnologyElement,
  HistoryLegendElement,
  WorldBuildingElementType,
  WorldBuildingElement,
  FreeFieldElement,
  PlotElement,
  Character,
  BaseWorldBuildingElement,
} from "@novel-ai-assistant/types";
import { WorldBuildingApiResponse } from "../types/apiResponse";

/**
 * 世界観構築のAI支援機能を管理するカスタムフック
 */
export const useWorldBuildingAI = () => {
  // 生成進捗の表示
  const [aiGenerationProgress, setAiGenerationProgress] = useState(0);
  const [currentElement, setCurrentElement] = useState("");
  const [totalElements, setTotalElements] = useState(0);

  // 通知関連
  const [notificationOpen, setNotificationOpen] = useState(false);

  // 要素累積機能を使用
  const {
    addPendingRule,
    addPendingCulture,
    addPendingPlace,
    addPendingWorldmap,
    addPendingSetting,
    addPendingHistory,
    addPendingGeography,
    addPendingTechnology,
    addPendingFreeField,
  } = useElementAccumulator();

  // 再レンダリング制御
  const [triggerRerender] = useState(0);

  // データを安全に文字列に変換するヘルパー関数
  const safeStringConversion = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return "[オブジェクト]";
      }
    }
    return String(value);
  };

  // 世界観要素の処理
  const handleProcessWorldBuildingElement = useCallback(
    (inputEelementData: WorldBuildingElement) => {
      if (!inputEelementData) return;

      const elementType = (inputEelementData as BaseWorldBuildingElement)
        .originalType;

      console.log(
        `[DEBUG] handleProcessWorldBuildingElement: ${elementType}`,
        inputEelementData
      );

      switch (elementType) {
        case WorldBuildingElementType.PLACE: {
          const elementData = inputEelementData as PlaceElement;
          const placeElement: PlaceElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            features: elementData.features || "",
            importance: elementData.importance || "",
            relations: elementData.relations || "",
            type: ("type" in elementData && elementData.type) || "place",
            originalType:
              ("originalType" in elementData && elementData.originalType) ||
              "place",
            location: elementData.location || "",
            population: elementData.population || "",
            culturalFeatures: elementData.culturalFeatures || "",
          };
          addPendingPlace(placeElement);
          break;
        }

        case WorldBuildingElementType.CULTURE: {
          const elementData = inputEelementData as CultureElement;
          const cultureElement: CultureElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            features: elementData.features || "",
            importance: elementData.importance || "",
            relations: elementData.relations || "",
            type: ("type" in elementData && elementData.type) || "culture",
            originalType:
              ("originalType" in elementData && elementData.originalType) ||
              "culture",
            customText: elementData.customText || "",
            beliefs: elementData.beliefs || "",
            history: elementData.history || "",
            socialStructure: elementData.socialStructure || "",
            values: elementData.values || [],
            customs: elementData.customs || [],
            government: elementData.government,
            religion: elementData.religion,
            language: elementData.language,
            art: elementData.art,
            technology: elementData.technology,
            notes: elementData.notes,
            traditions: elementData.traditions,
            education: elementData.education,
          };
          addPendingCulture(cultureElement);
          break;
        }

        case WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT: {
          const elementData = inputEelementData as GeographyEnvironmentElement;
          const geographyElement: GeographyEnvironmentElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            features: elementData.features || "",
            importance: elementData.importance || "",
            relations: elementData.relations || "",
            type:
              ("type" in elementData && elementData.type) ||
              "geography_environment",
            originalType:
              ("originalType" in elementData && elementData.originalType) ||
              "geography_environment",
          };
          addPendingGeography(geographyElement);
          break;
        }

        case WorldBuildingElementType.HISTORY_LEGEND: {
          const elementData = inputEelementData as HistoryLegendElement;
          const historyElement: HistoryLegendElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            features: elementData.features || "",
            importance: elementData.importance || "",
            relations: elementData.relations || "",
            type:
              ("type" in elementData && elementData.type) || "history_legend",
            originalType:
              ("originalType" in elementData && elementData.originalType) ||
              "history_legend",
            period: elementData.period || "",
            significantEvents: elementData.significantEvents || "",
            consequences: elementData.consequences || "",
          };
          addPendingHistory(historyElement);
          break;
        }

        case WorldBuildingElementType.MAGIC_TECHNOLOGY: {
          const elementData = inputEelementData as MagicTechnologyElement;
          const technologyElement: MagicTechnologyElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            features: elementData.features || "",
            importance: elementData.importance || "",
            relations: elementData.relations || "",
            type:
              ("type" in elementData && elementData.type) || "magic_technology",
            originalType:
              ("originalType" in elementData && elementData.originalType) ||
              "magic_technology",
            functionality: elementData.functionality || "",
            development: elementData.development || "",
            impact: elementData.impact || "",
          };
          addPendingTechnology(technologyElement);
          break;
        }

        case WorldBuildingElementType.SETTING: {
          const elementData = inputEelementData as SettingElement;
          const settingElement: SettingElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            history: elementData.history || "",
          };
          addPendingSetting(settingElement);
          break;
        }

        case WorldBuildingElementType.WORLDMAP: {
          const elementData = inputEelementData as WorldmapElement;
          const worldmapElement: WorldmapElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            features: elementData.features || "",
            importance: elementData.importance || "",
            relations: elementData.relations || "",
            type: ("type" in elementData && elementData.type) || "worldmap",
            originalType:
              ("originalType" in elementData && elementData.originalType) ||
              "worldmap",
            img: elementData.img || "",
          };
          addPendingWorldmap(worldmapElement);
          break;
        }

        case WorldBuildingElementType.RULE: {
          const elementData = inputEelementData as RuleElement;
          const ruleElement: RuleElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            features: elementData.features || "",
            importance: elementData.importance || "",
            relations: elementData.relations || "",
            type: ("type" in elementData && elementData.type) || "rule",
            originalType:
              ("originalType" in elementData && elementData.originalType) ||
              "rule",
            exceptions: elementData.exceptions || "",
            origin: elementData.origin || "",
            impact: elementData.impact || "",
            limitations: elementData.limitations || "",
          };
          addPendingRule(ruleElement);
          break;
        }

        case WorldBuildingElementType.FREE_FIELD: {
          const elementData = inputEelementData as FreeFieldElement;
          const freeField: FreeFieldElement = {
            id: uuidv4(),
            name: safeStringConversion(elementData.name),
            description: safeStringConversion(elementData.description),
            features: safeStringConversion(elementData.features),
            importance: safeStringConversion(elementData.importance),
            relations: safeStringConversion(elementData.relations),
            type: ("type" in elementData && elementData.type) || "free_field",
            originalType:
              ("originalType" in elementData && elementData.originalType) ||
              "free_field",
          };
          addPendingFreeField(freeField);
          break;
        }

        default: {
          console.warn("[WARN] 未対応の要素タイプ:", elementType);
          const elementData = inputEelementData as FreeFieldElement;
          // 不明な要素タイプは自由フィールドに追加
          const unknownElement: FreeFieldElement = {
            id: uuidv4(),
            name: safeStringConversion(elementData.name),
            description: safeStringConversion(elementData.description),
            features: safeStringConversion(elementData.features),
            importance: safeStringConversion(elementData.importance),
            relations: safeStringConversion(elementData.relations),
            type: ("type" in elementData && elementData.type) || "free_field",
            originalType:
              ("originalType" in elementData && elementData.originalType) ||
              "free_field",
          };
          addPendingFreeField(unknownElement);
          break;
        }
      }
    },
    [
      addPendingPlace,
      addPendingCulture,
      addPendingRule,
      addPendingFreeField,
      addPendingGeography,
      addPendingHistory,
      addPendingTechnology,
      addPendingSetting,
      addPendingWorldmap,
    ]
  );

  // AIアシスト機能を使用（削除済み）
  // const { generateWorldBuildingBatch } = useAIAssist({
  //   onWorldBuildingElementGenerated: (result) => {
  //     // 削除済み
  //   },
  //   onWorldBuildingBatchSuccess: (result) => {
  //     // 削除済み
  //   },
  //   onError: (error) => {
  //     // 削除済み
  //   },
  // });

  // generateWorldBuildingBatchの実装
  const generateWorldBuildingBatch = useCallback(
    async (
      message: string,
      plotElements: unknown[],
      existingElements: unknown[]
    ) => {
      console.log("世界観バッチ生成開始:", {
        message,
        plotElements,
        existingElements,
      });

      try {
        setAiGenerationProgress(0);
        setCurrentElement("世界観要素リストを生成中...");
        setTotalElements(0);

        // AI APIを動的インポート
        const { aiAgentApi } = await import("../api/aiAgent");

        // プロジェクト情報を含めたコンテキストメッセージを構築
        const plotElementsTyped = plotElements as PlotElement[];
        const charactersElementsTyped = existingElements as Character[];

        // プロジェクトの文脈を含めたメッセージを作成
        const contextualMessage = `${message}

重要な要求事項：
- 場所（place）要素を最低3件生成してください
- プロット要素との整合性を保ってください
- キャラクター設定との矛盾がないようにしてください
- 物語の雰囲気に合った世界観要素を生成してください

プロット情報:
${plotElementsTyped
  .map((plot) => `- ${plot.title}: ${plot.description}`)
  .join("\n")}

キャラクター情報:
${charactersElementsTyped
  .map((char) => `- ${char.name}: ${char.description}`)
  .join("\n")}`;

        // 1. 世界観要素リストを生成
        setAiGenerationProgress(10);
        setCurrentElement("世界観要素リストを生成中...");

        const listResponse = await aiAgentApi.generateWorldBuildingList(
          contextualMessage,
          plotElementsTyped,
          charactersElementsTyped,
          "gemini-1.5-pro",
          "json",
          "world-building-list-generic"
        );

        if (listResponse.status !== "success" || !listResponse.data) {
          throw new Error("世界観要素リストの生成に失敗しました");
        }

        // 生成された要素リストを解析
        let elementsList: Array<{ name: string; type: string }> = [];

        try {
          if (typeof listResponse.data === "string") {
            elementsList = JSON.parse(listResponse.data);
          } else if (Array.isArray(listResponse.data)) {
            elementsList = listResponse.data;
          } else {
            console.warn("予期しないデータ形式:", listResponse.data);
            elementsList = [];
          }
        } catch (parseError) {
          console.error("要素リスト解析エラー:", parseError);
          throw new Error("生成された要素リストの解析に失敗しました");
        }

        if (elementsList.length === 0) {
          throw new Error("生成された要素リストが空でした");
        }

        // 場所要素の数をチェック
        const placeElements = elementsList.filter(
          (element) => element.type === "place" || element.type === "places"
        );

        console.log(
          `生成された要素: ${elementsList.length}件 (場所: ${placeElements.length}件)`
        );

        if (placeElements.length < 3) {
          console.warn(
            `場所要素が${placeElements.length}件しかありません。最低3件必要です。`
          );
        }

        setTotalElements(elementsList.length);
        setAiGenerationProgress(20);

        // 2. 各要素の詳細を生成
        const detailResults: (WorldBuildingApiResponse | null)[] = [];

        for (let index = 0; index < elementsList.length; index++) {
          const element = elementsList[index];
          const progressPercent = 20 + ((index + 1) / elementsList.length) * 70;
          setAiGenerationProgress(progressPercent);
          setCurrentElement(`${element.name} (${element.type}) を生成中...`);

          console.log(
            `要素 ${index + 1}/${elementsList.length} 生成中: ${
              element.name
            } (${element.type})`
          );

          try {
            // プロジェクトの文脈を含めた詳細生成メッセージ
            const detailMessage = `「${element.name}」という${element.type}の詳細情報を生成してください。

プロジェクトの文脈:
${contextualMessage}

この要素は物語の世界観の一部として、プロットやキャラクターと整合性を保つ必要があります。`;

            const detailResponse = await aiAgentApi.generateWorldBuildingDetail(
              element.name,
              element.type,
              detailMessage,
              plotElementsTyped,
              charactersElementsTyped,
              "json"
            );

            if (detailResponse.status === "success" && detailResponse.data) {
              // 生成された要素を処理
              handleProcessWorldBuildingElement(detailResponse.data);
              console.log(`要素 ${element.name} 生成完了`);
              detailResults.push(detailResponse);
            } else {
              console.error(`要素 ${element.name} 生成失敗:`, detailResponse);
              detailResults.push(null);
            }
          } catch (error) {
            console.error(`要素 ${element.name} 生成エラー:`, error);
            detailResults.push(null);
          }

          // API制限を回避するため少し待機
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const successfulResults = detailResults.filter(
          (result) => result !== null
        );

        setAiGenerationProgress(100);
        setCurrentElement("生成完了");

        console.log(
          `${successfulResults.length}個の世界観要素の詳細生成が完了しました`
        );

        // 通知を表示
        setNotificationOpen(true);

        return Promise.resolve();
      } catch (error) {
        console.error("世界観バッチ生成エラー:", error);
        setCurrentElement("生成エラー");
        throw error;
      }
    },
    [handleProcessWorldBuildingElement, setNotificationOpen]
  );

  // initiateWorldBuildingAIGeneration のダミー実装
  const initiateWorldBuildingAIGeneration = useCallback(
    async (
      elementsToGenerate: Array<{
        elementType: string;
        count: number;
        customPrompt?: string;
      }>,
      apiKey: string,
      model: string
    ) => {
      console.warn(
        "initiateWorldBuildingAIGeneration is not implemented in useWorldBuildingAI",
        { elementsToGenerate, apiKey, model }
      );
      return Promise.resolve();
    },
    []
  );

  // cancelAIGeneration のダミー実装
  const cancelAIGeneration = useCallback(() => {
    console.warn("cancelAIGeneration is not implemented in useWorldBuildingAI");
  }, []);

  // 進捗状況を更新するコールバック
  const handleProgressUpdate = useCallback(
    (progress: number, current: string, total: number) => {
      setAiGenerationProgress(progress);
      setCurrentElement(current);
      setTotalElements(total);
    },
    []
  );

  return {
    aiGenerationProgress,
    generateWorldBuildingBatch,
    notificationOpen,
    setNotificationOpen,
    currentElement,
    totalElements,
    triggerRerender,
    handleProgressUpdate,
    initiateWorldBuildingAIGeneration,
    cancelAIGeneration,
    handleProcessWorldBuildingElement,
  };
};

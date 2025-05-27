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
} from "@novel-ai-assistant/types";

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

  // 世界観要素の処理
  const handleProcessWorldBuildingElement = useCallback(
    (inputEelementData: WorldBuildingElement) => {
      if (!inputEelementData) return;

      console.log("[DEBUG] 処理する要素タイプ:", inputEelementData.type);

      // 要素タイプに応じて処理
      switch (inputEelementData.type) {
        case WorldBuildingElementType.WORLDMAP: {
          const elementData = inputEelementData as WorldmapElement;
          const worldmapElement: WorldmapElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            importance: elementData.importance || "",
            originalType: elementData.originalType || "worldmap",
            type: "worldmap",
            features: elementData.features || "",
            relations: elementData.relations || "",
            img: elementData.img || "",
          };
          addPendingWorldmap(worldmapElement);
          break;
        }

        case WorldBuildingElementType.SETTING: {
          const elementData = inputEelementData as SettingElement;
          const settingElement: SettingElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            importance: elementData.importance || "",
            originalType: elementData.originalType || "setting",
            type: "setting",
            features: elementData.features || "",
            relations: elementData.relations || "",
            img: elementData.img || "",
          };
          addPendingSetting(settingElement);
          break;
        }

        case WorldBuildingElementType.PLACE: {
          const elementData = inputEelementData as PlaceElement;
          console.log("[DEBUG] 処理中の要素:", elementData);
          const placeElement: PlaceElement = {
            ...inputEelementData,
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            importance: elementData.importance || "",
            originalType: elementData.originalType || "place",
            type: "place",
            features: elementData.features || "",
            relations: elementData.relations || "",
            location: elementData.location || "",
            population: elementData.population || "",
            culturalFeatures: elementData.culturalFeatures || "",
          };
          addPendingPlace(placeElement);
          console.log("[DEBUG] 処理完了した要素:", placeElement);
          break;
        }

        case WorldBuildingElementType.HISTORY_LEGEND: {
          const elementData = inputEelementData as HistoryLegendElement;
          const historyLegendElement: HistoryLegendElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            importance: elementData.importance || "",
            originalType: elementData.originalType || "history_legend",
            type: "history_legend",
            features: elementData.features || "",
            relations: elementData.relations || "",
            period: elementData.period || "",
            significantEvents: elementData.significantEvents || "",
            consequences: elementData.consequences || "",
          };
          addPendingHistory(historyLegendElement);
          break;
        }

        case WorldBuildingElementType.MAGIC_TECHNOLOGY: {
          const elementData = inputEelementData as MagicTechnologyElement;
          const magicTechnologyElement: MagicTechnologyElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            importance: elementData.importance || "",
            originalType: elementData.originalType || "magic_technology",
            type: "magic_technology",
            features: elementData.features || "",
            relations: elementData.relations || "",
            functionality: elementData.functionality || "",
            development: elementData.development || "",
            impact: elementData.impact || "",
          };
          addPendingTechnology(magicTechnologyElement);
          break;
        }

        case WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT: {
          const elementData = inputEelementData as GeographyEnvironmentElement;
          const geographyEnvironmentElement: GeographyEnvironmentElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            importance: elementData.importance || "",
            originalType: elementData.originalType || "geography_environment",
            type: "geography_environment",
            features: elementData.features || "",
            relations: elementData.relations || "",
          };
          addPendingGeography(geographyEnvironmentElement);
          break;
        }

        case WorldBuildingElementType.CULTURE: {
          const elementData = inputEelementData as CultureElement;
          const cultureElement: CultureElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            importance: elementData.importance || "",
            originalType: elementData.originalType || "culture",
            type: "culture",
            features: elementData.features || "",
            relations: elementData.relations || "",
            customText: elementData.customText || "",
            beliefs: elementData.beliefs || "",
            history: elementData.history || "",
            socialStructure: elementData.socialStructure || "",
            values: elementData.values || [],
            customs: elementData.customs || [],
            government: elementData.government || "",
            religion: elementData.religion || "",
            language: elementData.language || "",
            art: elementData.art || "",
            technology: elementData.technology || "",
            notes: elementData.notes || "",
          };
          addPendingCulture(cultureElement);
          break;
        }

        case WorldBuildingElementType.RULE: {
          const elementData = inputEelementData as RuleElement;
          const ruleElement: RuleElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            importance: elementData.importance || "",
            originalType: elementData.originalType || "rule",
            type: "rule",
            features: elementData.features || "",
            relations: elementData.relations || "",
            impact: elementData.impact || "",
            exceptions: elementData.exceptions || "",
            origin: elementData.origin || "",
          };
          addPendingRule(ruleElement);
          break;
        }

        case WorldBuildingElementType.FREE_FIELD: {
          const elementData = inputEelementData as FreeFieldElement;
          const freeField: FreeFieldElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            features: elementData.features || "",
            importance: elementData.importance || "",
            relations: elementData.relations || "",
            type: elementData.type || "free_field",
            originalType: elementData.originalType || "free_field",
          };
          addPendingFreeField(freeField);
          break;
        }

        default: {
          console.warn("[WARN] 未対応の要素タイプ:", inputEelementData.type);
          const elementData = inputEelementData as FreeFieldElement;
          // 不明な要素タイプは自由フィールドに追加
          const unknownElement: FreeFieldElement = {
            id: uuidv4(),
            name: elementData.name || "",
            description: elementData.description || "",
            features: elementData.features || "",
            importance: elementData.importance || "",
            relations: elementData.relations || "",
            type: elementData.type || "free_field",
            originalType: elementData.originalType || "free_field",
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

  // generateWorldBuildingBatchのダミー実装
  const generateWorldBuildingBatch = useCallback(
    async (
      message: string,
      plotElements: unknown[],
      existingElements: unknown[]
    ) => {
      console.warn(
        "generateWorldBuildingBatch is not implemented in useWorldBuildingAI",
        { message, plotElements, existingElements }
      );
      return Promise.resolve();
    },
    []
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

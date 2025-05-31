import React, { useState, useEffect, useCallback } from "react";
import { useRecoilState } from "recoil";
import {
  WorldBuilding,
  NovelProject,
  CultureElement,
} from "@novel-ai-assistant/types";
import { currentProjectState } from "../store/atoms";
import { v4 as uuidv4 } from "uuid";
import { useWorldBuildingContext } from "../contexts/WorldBuildingContext";

// デフォルトのCultureElementを生成するヘルパー関数
const createDefaultCultureElement = (): CultureElement => ({
  id: uuidv4(),
  name: "Default Culture",
  type: "culture",
  originalType: "culture",
  description: "Default culture description",
  features: "Default features",
  importance: "Medium",
  relations: "None",
  customText: "",
  beliefs: "",
  history: "",
  socialStructure: "",
  values: [],
  customs: [],
  government: undefined,
  religion: undefined,
  language: undefined,
  art: undefined,
  technology: undefined,
  notes: undefined,
  traditions: undefined,
  education: undefined,
});

export const useWorldBuilding = () => {
  const [project, setProject] = useRecoilState(currentProjectState);
  const context = useWorldBuildingContext();
  const setHasUnsavedChanges = context
    ? context.setHasUnsavedChanges
    : () => {};

  const [tabValue, setTabValue] = useState(0);
  const handleTabChange = useCallback(
    (event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    },
    []
  );

  const [worldBuilding, setWorldBuildingState] = useState<WorldBuilding>(() => {
    let initialWB = project?.worldBuilding;
    if (initialWB) {
      if (!initialWB.cultures || initialWB.cultures.length === 0) {
        initialWB = {
          ...initialWB,
          cultures: [createDefaultCultureElement()],
        };
      }
      // 古い形式のsettingを新しい形式に変換
      if (
        typeof (initialWB as unknown as { setting: string }).setting ===
        "string"
      ) {
        initialWB = {
          ...initialWB,
          setting: {
            description: (initialWB as unknown as { setting: string }).setting,
            history: "",
          },
        } as unknown as WorldBuilding;
      }
      return initialWB;
    }
    return {
      id: uuidv4(),
      setting: {
        description: "",
        history: "",
      },
      worldmaps: [],
      settings: [],
      rules: [],
      places: [],
      cultures: [createDefaultCultureElement()],
      geographyEnvironment: [],
      historyLegend: [],
      magicTechnology: [],
      stateDefinition: [],
      freeFields: [],
    } as unknown as WorldBuilding;
  });

  useEffect(() => {
    if (project && project.worldBuilding) {
      let currentWB = project.worldBuilding;
      if (!currentWB.cultures || currentWB.cultures.length === 0) {
        currentWB = {
          ...currentWB,
          cultures: [createDefaultCultureElement()],
        };
      }
      // 古い形式のsettingを新しい形式に変換
      if (
        typeof (currentWB as unknown as { setting: string }).setting ===
        "string"
      ) {
        currentWB = {
          ...currentWB,
          setting: {
            description: (currentWB as unknown as { setting: string }).setting,
            history: "",
          },
        } as unknown as WorldBuilding;
      }
      setWorldBuildingState(currentWB);
    } else {
      setWorldBuildingState({
        id: uuidv4(),
        setting: {
          description: "",
          history: "",
        },
        worldmaps: [],
        settings: [],
        rules: [],
        places: [],
        cultures: [createDefaultCultureElement()],
        geographyEnvironment: [],
        historyLegend: [],
        magicTechnology: [],
        stateDefinition: [],
        freeFields: [],
      } as unknown as WorldBuilding);
    }
  }, [project]);

  const updateWorldBuilding = useCallback(
    (newWorldBuilding: WorldBuilding) => {
      setWorldBuildingState(newWorldBuilding);
      if (project) {
        const updatedProject: NovelProject = {
          ...project,
          worldBuilding: newWorldBuilding,
        };
        setProject(updatedProject);
        setHasUnsavedChanges(true);
      }
    },
    [project, setProject, setHasUnsavedChanges]
  );

  const handleMapImageUpload = useCallback(
    (url: string) => {
      updateWorldBuilding({
        ...worldBuilding,
        worldMapImageUrl: url,
      });
    },
    [worldBuilding, updateWorldBuilding]
  );

  const handleSettingChange = useCallback(
    (description: string) => {
      const currentSetting = worldBuilding.setting as unknown as {
        description: string;
        history: string;
      };
      updateWorldBuilding({
        ...worldBuilding,
        setting: {
          ...currentSetting,
          description: description,
        },
      } as unknown as WorldBuilding);
    },
    [worldBuilding, updateWorldBuilding]
  );

  const handleHistoryChange = useCallback(
    (historyValue: string) => {
      const currentSetting = worldBuilding.setting as unknown as {
        description: string;
        history: string;
      };
      updateWorldBuilding({
        ...worldBuilding,
        setting: {
          ...currentSetting,
          history: historyValue,
        },
      } as unknown as WorldBuilding);
    },
    [worldBuilding, updateWorldBuilding]
  );

  return {
    worldBuilding,
    updateWorldBuilding,
    tabValue,
    handleTabChange,
    handleMapImageUpload,
    handleSettingChange,
    handleHistoryChange,
  };
};

export default useWorldBuilding;

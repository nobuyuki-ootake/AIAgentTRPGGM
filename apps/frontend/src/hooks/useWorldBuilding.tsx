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
      return initialWB;
    }
    return {
      id: uuidv4(),
      setting: "",
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
    };
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
      setWorldBuildingState(currentWB);
    } else {
      setWorldBuildingState({
        id: uuidv4(),
        setting: "",
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
      });
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
      updateWorldBuilding({
        ...worldBuilding,
        description: description,
      });
    },
    [worldBuilding, updateWorldBuilding]
  );

  const handleHistoryChange = useCallback(
    (historyValue: string) => {
      updateWorldBuilding({
        ...worldBuilding,
        description:
          (worldBuilding.description || "") + " History: " + historyValue,
      });
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

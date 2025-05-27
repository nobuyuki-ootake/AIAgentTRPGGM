import { useCallback, useEffect, useState } from "react";
import { useRecoilState, useRecoilCallback } from "recoil";
import {
  currentProjectState,
  worldBuildingUpdatedTabsState,
  worldBuildingForceUpdateCounterState,
} from "../store/atoms";
// toast は使用されていないためコメントアウト
// import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  NovelProject,
  PlaceElement,
  CultureElement,
  RuleElement,
  WorldmapElement,
  SettingElement,
  GeographyEnvironmentElement,
  MagicTechnologyElement,
  HistoryLegendElement,
  WorldBuildingElementType,
  getCategoryTabIndex,
  StateDefinitionElement,
  FreeFieldElement,
} from "@novel-ai-assistant/types";

export interface ElementAccumulatorHook {
  updatedTabs: { [key: number]: boolean };
  markTabAsUpdated: (index: number) => void;
  forceMarkTabAsUpdated: (index: number) => void;
  forceUpdateCounter: number;
  addPendingRule: (rule: RuleElement) => void;
  addPendingCulture: (culture: CultureElement) => void;
  addPendingPlace: (place: PlaceElement) => void;
  addPendingWorldmap: (worldmap: WorldmapElement) => void;
  addPendingSetting: (setting: SettingElement) => void;
  addPendingHistory: (history: HistoryLegendElement) => void;
  addPendingTechnology: (technology: MagicTechnologyElement) => void;
  addPendingGeography: (geography: GeographyEnvironmentElement) => void;
  addPendingFreeField: (freeField: FreeFieldElement) => void;
  addPendingStateDefinition: (stateDefinition: StateDefinitionElement) => void;
  saveAllPendingElements: () => void;
  clearPendingElements: () => void;
  resetWorldBuildingElements: (elements?: {
    places?: PlaceElement[];
    rules?: RuleElement[];
    stateDefinition?: StateDefinitionElement[];
    cultures?: CultureElement[];
    worldmaps?: WorldmapElement[];
    settings?: SettingElement[];
    historyLegend?: HistoryLegendElement[];
    magicTechnology?: MagicTechnologyElement[];
    geographyEnvironment?: GeographyEnvironmentElement[];
    freeFields?: FreeFieldElement[];
  }) => void;
  getCurrentProjectState: () => NovelProject;
  updateProjectState: (updatedProject: NovelProject) => void;
  validateWorldBuildingData: () => boolean;
  pendingPlaces: PlaceElement[];
  pendingRules: RuleElement[];
  pendingStateDefinitions: StateDefinitionElement[];
  pendingCultures: CultureElement[];
  pendingWorldmaps: WorldmapElement[];
  pendingSettings: SettingElement[];
  pendingHistoryLegends: HistoryLegendElement[];
  pendingMagicTechnologies: MagicTechnologyElement[];
  pendingGeographyEnvironments: GeographyEnvironmentElement[];
  pendingFreeFields: FreeFieldElement[];
}

console.log("useElementAccumulator.ts LOADING");

export const useElementAccumulator = (): ElementAccumulatorHook => {
  const [pendingPlaces, setPendingPlaces] = useState<PlaceElement[]>([]);
  const [pendingRules, setPendingRules] = useState<RuleElement[]>([]);
  const [pendingStateDefinitions, setPendingStateDefinitions] = useState<
    StateDefinitionElement[]
  >([]);
  const [pendingCultures, setPendingCultures] = useState<CultureElement[]>([]);
  const [pendingWorldmaps, setPendingWorldmaps] = useState<WorldmapElement[]>(
    []
  );
  const [pendingSettings, setPendingSettings] = useState<SettingElement[]>([]);
  const [pendingHistoryLegends, setPendingHistoryLegends] = useState<
    HistoryLegendElement[]
  >([]);
  const [pendingMagicTechnologies, setPendingMagicTechnologies] = useState<
    MagicTechnologyElement[]
  >([]);
  const [pendingGeographyEnvironments, setPendingGeographyEnvironments] =
    useState<GeographyEnvironmentElement[]>([]);
  const [pendingFreeFields, setPendingFreeFields] = useState<
    FreeFieldElement[]
  >([]);

  useEffect(() => {
    console.log("useElementAccumulator MOUNTED");
    return () => {
      console.log("useElementAccumulator UNMOUNTED");
    };
  }, []);

  // プロジェクト状態
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  // タブの更新状態を追跡
  const [updatedTabs, setUpdatedTabs] = useRecoilState<{
    [key: number]: boolean;
  }>(worldBuildingUpdatedTabsState);
  const [forceUpdateCounter, setForceUpdateCounter] = useRecoilState(
    worldBuildingForceUpdateCounterState
  );

  const markTabAsUpdated = useCallback(
    (index: number) => {
      console.log("[DEBUG] markTabAsUpdated CALLED WITH INDEX:", index);
      setUpdatedTabs((prev) => ({
        ...prev,
        [index]: true,
      }));
    },
    [setUpdatedTabs]
  );

  const forceMarkTabAsUpdated = useCallback(
    (index: number) => {
      markTabAsUpdated(index);
      setForceUpdateCounter((prev) => prev + 1);
    },
    [markTabAsUpdated, setForceUpdateCounter]
  );

  const addPendingRule = useCallback(
    (rule: RuleElement) => {
      if (!currentProject) return;
      const newRule = { ...rule, id: rule.id || uuidv4() };
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return prevProject;
        const updatedWorldBuilding = {
          ...prevProject.worldBuilding,
          rules: [...(prevProject.worldBuilding?.rules || []), newRule],
        };
        return { ...prevProject, worldBuilding: updatedWorldBuilding };
      });
      markTabAsUpdated(getCategoryTabIndex(WorldBuildingElementType.RULE));
      setPendingRules((prev) => [...prev, newRule]);
    },
    [currentProject, setCurrentProject, markTabAsUpdated]
  );

  const addPendingCulture = useCallback(
    (culture: CultureElement) => {
      if (!currentProject) return;
      const newCulture = { ...culture, id: culture.id || uuidv4() };
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return prevProject;
        const updatedWorldBuilding = {
          ...prevProject.worldBuilding,
          cultures: [
            ...(prevProject.worldBuilding?.cultures || []),
            newCulture,
          ],
        };
        return { ...prevProject, worldBuilding: updatedWorldBuilding };
      });
      markTabAsUpdated(getCategoryTabIndex(WorldBuildingElementType.CULTURE));
    },
    [currentProject, setCurrentProject, markTabAsUpdated]
  );

  const addPendingPlace = useCallback(
    (place: PlaceElement) => {
      console.log(
        "[DEBUG] addPendingPlace called with:",
        JSON.stringify(place)
      );
      if (!currentProject) {
        console.error("[DEBUG] addPendingPlace: currentProject is null!");
        return;
      }
      const newPlace = { ...place, id: place.id || uuidv4() };
      console.log("[DEBUG] newPlace to add:", JSON.stringify(newPlace));

      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return prevProject; // Should not happen if initial check passed
        console.log(
          "[DEBUG] prevProject.worldBuilding.places before adding:",
          JSON.stringify(prevProject.worldBuilding?.places)
        );
        const updatedPlaces = [
          ...(prevProject.worldBuilding?.places || []),
          newPlace,
        ];
        console.log(
          "[DEBUG] updatedPlaces after adding:",
          JSON.stringify(updatedPlaces)
        );
        const updatedWorldBuilding = {
          ...prevProject.worldBuilding,
          places: updatedPlaces,
        };
        return { ...prevProject, worldBuilding: updatedWorldBuilding };
      });
      markTabAsUpdated(getCategoryTabIndex(WorldBuildingElementType.PLACE));
      console.log(
        `[DEBUG] markTabAsUpdated(${getCategoryTabIndex(
          WorldBuildingElementType.PLACE
        )}) called after setCurrentProject`
      );
      setPendingPlaces((prev) => [...prev, newPlace]);
    },
    [currentProject, setCurrentProject, markTabAsUpdated]
  );

  const addPendingWorldmap = useCallback(
    (worldmap: WorldmapElement) => {
      if (!currentProject) return;
      const newWorldmap = { ...worldmap, id: worldmap.id || uuidv4() };
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return prevProject;
        const updatedWorldBuilding = {
          ...prevProject.worldBuilding,
          worldmaps: [
            ...(prevProject.worldBuilding?.worldmaps || []),
            newWorldmap,
          ],
        };
        return { ...prevProject, worldBuilding: updatedWorldBuilding };
      });
      markTabAsUpdated(getCategoryTabIndex(WorldBuildingElementType.WORLDMAP));
    },
    [currentProject, setCurrentProject, markTabAsUpdated]
  );

  const addPendingSetting = useCallback(
    (setting: SettingElement) => {
      if (!currentProject) return;
      const newSetting = { ...setting, id: setting.id || uuidv4() };
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return prevProject;
        const updatedWorldBuilding = {
          ...prevProject.worldBuilding,
          settings: [
            ...(prevProject.worldBuilding?.settings || []),
            newSetting,
          ],
        };
        return { ...prevProject, worldBuilding: updatedWorldBuilding };
      });
      markTabAsUpdated(getCategoryTabIndex(WorldBuildingElementType.SETTING));
    },
    [currentProject, setCurrentProject, markTabAsUpdated]
  );

  const addPendingHistory = useCallback(
    (history: HistoryLegendElement) => {
      if (!currentProject) return;
      const newHistory = { ...history, id: history.id || uuidv4() };
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return prevProject;
        const updatedWorldBuilding = {
          ...prevProject.worldBuilding,
          historyLegend: [
            ...(prevProject.worldBuilding?.historyLegend || []),
            newHistory,
          ],
        };
        return { ...prevProject, worldBuilding: updatedWorldBuilding };
      });
      markTabAsUpdated(
        getCategoryTabIndex(WorldBuildingElementType.HISTORY_LEGEND)
      );
    },
    [currentProject, setCurrentProject, markTabAsUpdated]
  );

  const addPendingTechnology = useCallback(
    (technology: MagicTechnologyElement) => {
      if (!currentProject) return;
      const newTechnology = { ...technology, id: technology.id || uuidv4() };
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return prevProject;
        const updatedWorldBuilding = {
          ...prevProject.worldBuilding,
          magicTechnology: [
            ...(prevProject.worldBuilding?.magicTechnology || []),
            newTechnology,
          ],
        };
        return { ...prevProject, worldBuilding: updatedWorldBuilding };
      });
      markTabAsUpdated(
        getCategoryTabIndex(WorldBuildingElementType.MAGIC_TECHNOLOGY)
      );
    },
    [currentProject, setCurrentProject, markTabAsUpdated]
  );

  const addPendingGeography = useCallback(
    (geography: GeographyEnvironmentElement) => {
      if (!currentProject) return;
      const newGeography = { ...geography, id: geography.id || uuidv4() };
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return prevProject;
        const updatedWorldBuilding = {
          ...prevProject.worldBuilding,
          geographyEnvironment: [
            ...(prevProject.worldBuilding?.geographyEnvironment || []),
            newGeography,
          ],
        };
        return { ...prevProject, worldBuilding: updatedWorldBuilding };
      });
      markTabAsUpdated(
        getCategoryTabIndex(WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT)
      );
    },
    [currentProject, setCurrentProject, markTabAsUpdated]
  );

  const addPendingFreeField = useCallback(
    (freeField: FreeFieldElement) => {
      if (!currentProject) return;
      const newFreeField = { ...freeField, id: freeField.id || uuidv4() };
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return prevProject;
        const updatedWorldBuilding = {
          ...prevProject.worldBuilding,
          freeFields: [
            ...(prevProject.worldBuilding?.freeFields || []),
            newFreeField,
          ],
        };
        return { ...prevProject, worldBuilding: updatedWorldBuilding };
      });
      markTabAsUpdated(
        getCategoryTabIndex(WorldBuildingElementType.FREE_FIELD)
      );
    },
    [currentProject, setCurrentProject, markTabAsUpdated]
  );

  const addPendingStateDefinition = useCallback(
    (stateDefinition: StateDefinitionElement) => {
      console.warn(
        "addPendingStateDefinition is not implemented in useElementAccumulator",
        stateDefinition
      );
      setPendingStateDefinitions((prev) => [...prev, stateDefinition]);
    },
    []
  );

  const clearPendingElements = useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        console.log("[DEBUG] clearPendingElements CALLED");
        const currentProj = await snapshot.getPromise(currentProjectState);
        if (currentProj && currentProj.worldBuilding) {
          const newWorldBuilding = { ...currentProj.worldBuilding };
          newWorldBuilding.places = [];
          newWorldBuilding.rules = [];
          newWorldBuilding.cultures = [];
          newWorldBuilding.worldmaps = [];
          newWorldBuilding.settings = [];
          newWorldBuilding.historyLegend = [];
          newWorldBuilding.magicTechnology = [];
          newWorldBuilding.geographyEnvironment = [];
          newWorldBuilding.freeFields = [];
          newWorldBuilding.stateDefinition = [];

          set(currentProjectState, {
            ...currentProj,
            worldBuilding: newWorldBuilding,
          });
          console.log(
            "[DEBUG] All pending elements cleared from currentProject state"
          );
        }
        setPendingPlaces([]);
        setPendingRules([]);
        setPendingStateDefinitions([]);
        setPendingCultures([]);
        setPendingWorldmaps([]);
        setPendingSettings([]);
        setPendingHistoryLegends([]);
        setPendingMagicTechnologies([]);
        setPendingGeographyEnvironments([]);
        setPendingFreeFields([]);
      },
    []
  );

  const resetWorldBuildingElements = useRecoilCallback(
    ({ set, snapshot }) =>
      async (elements?: {
        places?: PlaceElement[];
        rules?: RuleElement[];
        stateDefinition?: StateDefinitionElement[];
        cultures?: CultureElement[];
        worldmaps?: WorldmapElement[];
        settings?: SettingElement[];
        historyLegend?: HistoryLegendElement[];
        magicTechnology?: MagicTechnologyElement[];
        geographyEnvironment?: GeographyEnvironmentElement[];
        freeFields?: FreeFieldElement[];
      }) => {
        console.log(
          "[DEBUG] resetWorldBuildingElements CALLED with:",
          elements
        );
        const currentProj = await snapshot.getPromise(currentProjectState);
        if (currentProj) {
          const newWorldBuildingData = {
            ...currentProj.worldBuilding,
            places: elements?.places || [],
            rules: elements?.rules || [],
            stateDefinition: elements?.stateDefinition || [],
            cultures: elements?.cultures || [],
            worldmaps: elements?.worldmaps || [],
            settings: elements?.settings || [],
            historyLegend: elements?.historyLegend || [],
            magicTechnology: elements?.magicTechnology || [],
            geographyEnvironment: elements?.geographyEnvironment || [],
            freeFields: elements?.freeFields || [],
          };

          set(currentProjectState, {
            ...currentProj,
            worldBuilding: newWorldBuildingData,
          });

          // ローカルのペンディングステートもリセット
          setPendingPlaces(elements?.places || []);
          setPendingRules(elements?.rules || []);
          setPendingStateDefinitions(elements?.stateDefinition || []);
          setPendingCultures(elements?.cultures || []);
          setPendingWorldmaps(elements?.worldmaps || []);
          setPendingSettings(elements?.settings || []);
          setPendingHistoryLegends(elements?.historyLegend || []);
          setPendingMagicTechnologies(elements?.magicTechnology || []);
          setPendingGeographyEnvironments(elements?.geographyEnvironment || []);
          setPendingFreeFields(elements?.freeFields || []);

          // Clear updated tabs and force update
          setUpdatedTabs({});
          setForceUpdateCounter((prev) => prev + 1);
          console.log(
            "[DEBUG] World building elements reset and updated tabs cleared"
          );
        }
      },
    [setUpdatedTabs, setForceUpdateCounter]
  );

  const saveAllPendingElements = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const project = await snapshot.getPromise(currentProjectState);
        if (project) {
          // ここでプロジェクトデータを永続化する処理を呼び出す
          // 例: await saveProjectToBackend(project);
          console.log(
            "[DEBUG] AIバッチ処理完了。要素は currentProject に直接保存済み (from snapshot):",
            project.title // project全体をログすると長すぎるのでタイトルだけ
          );
          // プロジェクト内の各要素の数をログに出力
          console.log(
            "[DEBUG] 保存後のプロジェクトの場所の数 (from snapshot):",
            project.worldBuilding?.places?.length || 0
          );
          console.log(
            "[DEBUG] 保存後のプロジェクトのルールの数 (from snapshot):",
            project.worldBuilding?.rules?.length || 0
          );
          console.log(
            "[DEBUG] 保存後のプロジェクトの文化の数 (from snapshot):",
            project.worldBuilding?.cultures?.length || 0
          );
          // 他の要素タイプについても同様にログ出力
          // clearPendingElements(); // 保存が完了したので保留リストをクリア... しない。currentProjectに直接入っているため
        } else {
          console.warn(
            "[DEBUG] saveAllPendingElements: currentProject is null, skipping save."
          );
        }
      },
    [
      /*clearPendingElements*/
    ] // clearPendingElements は依存配列から削除
  );

  const getCurrentProjectState = useRecoilCallback(
    ({ snapshot }) =>
      () => {
        return snapshot.getLoadable(currentProjectState).contents;
      },
    []
  );

  // 世界観データのバリデーション関数
  const validateWorldBuildingData = useCallback(() => {
    if (!currentProject || !currentProject.worldBuilding) {
      console.warn("プロジェクトまたは世界観データが存在しません。");
      return false;
    }
    // ここに各要素のバリデーションロジックを追加
    // 例: currentProject.worldBuilding.places の各要素が適切な名前と説明を持っているか等
    return true; // 仮実装
  }, [currentProject]);

  const updateProjectState = useCallback(
    (updatedProject: NovelProject) => {
      setCurrentProject(updatedProject);
    },
    [setCurrentProject]
  );

  return {
    updatedTabs,
    markTabAsUpdated,
    forceMarkTabAsUpdated,
    forceUpdateCounter,
    addPendingRule,
    addPendingCulture,
    addPendingPlace,
    addPendingWorldmap,
    addPendingSetting,
    addPendingHistory,
    addPendingTechnology,
    addPendingGeography,
    addPendingFreeField,
    addPendingStateDefinition,
    saveAllPendingElements,
    clearPendingElements,
    resetWorldBuildingElements,
    getCurrentProjectState,
    updateProjectState,
    validateWorldBuildingData,
    pendingPlaces,
    pendingRules,
    pendingStateDefinitions,
    pendingCultures,
    pendingWorldmaps,
    pendingSettings,
    pendingHistoryLegends,
    pendingMagicTechnologies,
    pendingGeographyEnvironments,
    pendingFreeFields,
  };
};

import { useState } from "react";
import { BaseLocation } from "@trpg-ai-gm/types";

export function useWorldBuilding() {
  const [tabValue, setTabValue] = useState(0);
  const [updatedTabs, setUpdatedTabs] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [bases, setBases] = useState<BaseLocation[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // const [snackbarOpen, setSnackbarOpen] = useState(false);
  // const [snackbarMessage, setSnackbarMessage] = useState("");

  // markTabAsUpdated関数を先に定義
  const markTabAsUpdated = (index: number) => {
    setUpdatedTabs((prev) => ({
      ...prev,
      [index]: true,
    }));
  };

  return {
    currentProject: null,
    tabValue,
    updatedTabs,
    mapImageUrl: "",
    description: "",
    history: "",
    rules: [],
    places: [],
    freeFields: [],
    bases,
    setBases: (newBases: BaseLocation[]) => {
      setBases(newBases);
      setHasUnsavedChanges(true);
      markTabAsUpdated(10); // 拠点タブのindex
    },
    handleTabChange: (_: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    },
    markTabAsUpdated,
    handleMapImageUpload: (url: string) => {
      console.log("Map image uploaded:", url);
    },
    handleSettingChange: (value: string) => {
      console.log("Setting changed:", value);
      setHasUnsavedChanges(true);
    },
    handleHistoryChange: (value: string) => {
      console.log("History changed:", value);
      setHasUnsavedChanges(true);
    },
    handleSaveWorldBuilding: () => {
      setHasUnsavedChanges(false);
      // 実際の保存処理は呼び出し側で実装
    },
    hasUnsavedChanges,
    handleFieldChange: () => {
      setHasUnsavedChanges(true);
    },
    getCurrentProjectState: () => null,
    updateProjectState: () => {},
  };
}

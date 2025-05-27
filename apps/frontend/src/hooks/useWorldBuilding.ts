import { useState } from "react";

export function useWorldBuilding() {
  const [tabValue, setTabValue] = useState(0);
  const [updatedTabs, setUpdatedTabs] = useState<{ [key: number]: boolean }>(
    {}
  );
  // const [snackbarOpen, setSnackbarOpen] = useState(false);
  // const [snackbarMessage, setSnackbarMessage] = useState("");

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
    handleTabChange: (_: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    },
    markTabAsUpdated: (index: number) => {
      setUpdatedTabs((prev) => ({
        ...prev,
        [index]: true,
      }));
    },
    handleMapImageUpload: (url: string) => {
      console.log("Map image uploaded:", url);
    },
    handleSettingChange: (value: string) => {
      console.log("Setting changed:", value);
    },
    handleHistoryChange: (value: string) => {
      console.log("History changed:", value);
    },
    handleSaveWorldBuilding: () => {},
    hasUnsavedChanges: false,
    getCurrentProjectState: () => null,
    updateProjectState: () => {},
  };
}

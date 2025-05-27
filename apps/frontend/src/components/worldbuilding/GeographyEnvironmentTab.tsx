import React from "react";
import { Box, TextField, Typography } from "@mui/material";
import { useWorldBuildingContext } from "../../contexts/WorldBuildingContext";
import {
  getCategoryTabIndex,
  WorldBuildingElementType,
  NovelProject,
  GeographyEnvironmentElement,
} from "@novel-ai-assistant/types";

const GeographyEnvironmentTab: React.FC = () => {
  const { getCurrentProjectState, updateProjectState, markTabAsUpdated } =
    useWorldBuildingContext();

  const currentProject = getCurrentProjectState();

  // geographyEnvironment 配列の最初の要素を編集対象とする (存在しない場合は undefined)
  const targetGeographyElement = currentProject?.worldBuilding
    ?.geographyEnvironment?.[0] as GeographyEnvironmentElement | undefined;

  const handleFieldChange =
    (
      fieldName: keyof Omit<
        GeographyEnvironmentElement,
        "id" | "type" | "originalType"
      >
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const currentPrj = getCurrentProjectState();
      if (!currentPrj || !currentPrj.worldBuilding) return;

      // 既存の要素を取得、または新しい要素を作成
      const baseGeographyElement = currentPrj.worldBuilding
        .geographyEnvironment?.[0] || {
        id: `geography_${Date.now()}`,
        name: "",
        type: WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT,
        originalType: WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT,
        description: "",
        features: "",
        importance: "",
        relations: "",
      };

      const updatedGeographyElement: GeographyEnvironmentElement = {
        ...baseGeographyElement,
        [fieldName]: e.target.value,
      };

      // geographyEnvironment 配列を更新
      const updatedGeographyEnvironment = [
        updatedGeographyElement,
        ...(currentPrj.worldBuilding.geographyEnvironment?.slice(1) || []),
      ];

      const updatedWorldBuilding: NovelProject["worldBuilding"] = {
        ...currentPrj.worldBuilding,
        geographyEnvironment: updatedGeographyEnvironment,
      };

      const updatedProject: NovelProject = {
        ...currentPrj,
        worldBuilding: updatedWorldBuilding,
      };

      updateProjectState(updatedProject);

      markTabAsUpdated(
        getCategoryTabIndex(WorldBuildingElementType.GEOGRAPHY_ENVIRONMENT)
      );
    };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        地理と環境 (GeographyEnvironmentElement ベース)
      </Typography>

      <TextField
        fullWidth
        label="名前 (Name)"
        placeholder="地理的特徴や環境の名前を入力してください"
        value={targetGeographyElement?.name || ""}
        onChange={handleFieldChange("name")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="説明 (Description)"
        placeholder="この地理的特徴や環境の基本的な説明を記述してください"
        value={targetGeographyElement?.description || ""}
        onChange={handleFieldChange("description")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="特徴 (Features)"
        placeholder="地形、気候、自然現象、生態系などの特徴を記述してください"
        value={targetGeographyElement?.features || ""}
        onChange={handleFieldChange("features")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        label="重要性 (Importance)"
        placeholder="物語における重要度（高・中・低など）"
        value={targetGeographyElement?.importance || ""}
        onChange={handleFieldChange("importance")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="関連 (Relations)"
        placeholder="他の地域、キャラクター、イベントとの関連性を記述してください"
        value={targetGeographyElement?.relations || ""}
        onChange={handleFieldChange("relations")}
        variant="outlined"
        margin="normal"
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, textAlign: "center" }}
      >
        地理と環境は物語の舞台設定と雰囲気を決定する重要な要素です。
      </Typography>
    </Box>
  );
};

export default GeographyEnvironmentTab;

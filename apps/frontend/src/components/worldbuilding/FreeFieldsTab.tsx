import React from "react";
import { Box, TextField, Typography } from "@mui/material";
import { useWorldBuildingContext } from "../../contexts/WorldBuildingContext";
import {
  getCategoryTabIndex,
  WorldBuildingElementType,
  NovelProject,
  FreeFieldElement,
} from "@novel-ai-assistant/types";

const FreeFieldsTab: React.FC = () => {
  const { getCurrentProjectState, updateProjectState, markTabAsUpdated } =
    useWorldBuildingContext();

  const currentProject = getCurrentProjectState();

  // freeFields 配列の最初の要素を編集対象とする (存在しない場合は undefined)
  const targetFreeFieldElement = currentProject?.worldBuilding
    ?.freeFields?.[0] as FreeFieldElement | undefined;

  const handleFieldChange =
    (fieldName: keyof Omit<FreeFieldElement, "id" | "type" | "originalType">) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const currentPrj = getCurrentProjectState();
      if (!currentPrj || !currentPrj.worldBuilding) return;

      // 既存の要素を取得、または新しい要素を作成
      const baseFreeFieldElement = currentPrj.worldBuilding.freeFields?.[0] || {
        id: `freefield_${Date.now()}`,
        name: "",
        type: WorldBuildingElementType.FREE_FIELD,
        originalType: WorldBuildingElementType.FREE_FIELD,
        description: "",
        features: "",
        importance: "",
        relations: "",
      };

      const updatedFreeFieldElement: FreeFieldElement = {
        ...baseFreeFieldElement,
        [fieldName]: e.target.value,
      };

      // freeFields 配列を更新
      const updatedFreeFields = [
        updatedFreeFieldElement,
        ...(currentPrj.worldBuilding.freeFields?.slice(1) || []),
      ];

      const updatedWorldBuilding: NovelProject["worldBuilding"] = {
        ...currentPrj.worldBuilding,
        freeFields: updatedFreeFields,
      };

      const updatedProject: NovelProject = {
        ...currentPrj,
        worldBuilding: updatedWorldBuilding,
      };

      updateProjectState(updatedProject);

      markTabAsUpdated(
        getCategoryTabIndex(WorldBuildingElementType.FREE_FIELD)
      );
    };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        自由記述欄 (FreeFieldElement ベース)
      </Typography>
      <Typography paragraph sx={{ mb: 3 }}>
        世界観設定の他カテゴリに当てはまらない追加情報をここに記述できます。独自のカテゴリを作成して自由に内容を入力してください。
      </Typography>

      <TextField
        fullWidth
        label="名前 (Name)"
        placeholder="自由記述項目の名前を入力してください"
        value={targetFreeFieldElement?.name || ""}
        onChange={handleFieldChange("name")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={4}
        label="説明 (Description)"
        placeholder="この項目の詳細な説明を記述してください"
        value={targetFreeFieldElement?.description || ""}
        onChange={handleFieldChange("description")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="特徴 (Features)"
        placeholder="この項目の特徴的な要素を記述してください"
        value={targetFreeFieldElement?.features || ""}
        onChange={handleFieldChange("features")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        label="重要性 (Importance)"
        placeholder="物語における重要度（高・中・低など）"
        value={targetFreeFieldElement?.importance || ""}
        onChange={handleFieldChange("importance")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="関連 (Relations)"
        placeholder="他の世界観要素、キャラクター、イベントとの関連性を記述してください"
        value={targetFreeFieldElement?.relations || ""}
        onChange={handleFieldChange("relations")}
        variant="outlined"
        margin="normal"
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, textAlign: "center" }}
      >
        自由記述欄では、他のカテゴリに分類されない独自の世界観要素を自由に記述できます。
      </Typography>
    </Box>
  );
};

export default FreeFieldsTab;

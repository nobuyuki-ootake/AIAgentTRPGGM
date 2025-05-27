import React from "react";
import { Box, TextField, Typography, Divider } from "@mui/material";
import { useWorldBuildingContext } from "../../contexts/WorldBuildingContext";
import {
  getCategoryTabIndex,
  WorldBuildingElementType,
  NovelProject,
  HistoryLegendElement,
} from "@novel-ai-assistant/types";

const HistoryLegendTab: React.FC = () => {
  const { getCurrentProjectState, updateProjectState, markTabAsUpdated } =
    useWorldBuildingContext();

  const currentProject = getCurrentProjectState();

  // historyLegend 配列の最初の要素を編集対象とする (存在しない場合は undefined)
  const targetHistoryElement = currentProject?.worldBuilding
    ?.historyLegend?.[0] as HistoryLegendElement | undefined;

  const handleFieldChange =
    (
      fieldName: keyof Omit<
        HistoryLegendElement,
        "id" | "type" | "originalType"
      >
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const currentPrj = getCurrentProjectState();
      if (!currentPrj || !currentPrj.worldBuilding) return;

      // 既存の要素を取得、または新しい要素を作成
      const baseHistoryElement = currentPrj.worldBuilding
        .historyLegend?.[0] || {
        id: `history_${Date.now()}`,
        name: "",
        type: WorldBuildingElementType.HISTORY_LEGEND,
        originalType: WorldBuildingElementType.HISTORY_LEGEND,
        description: "",
        features: "",
        importance: "",
        period: "",
        significantEvents: "",
        consequences: "",
        relations: "",
      };

      const updatedHistoryElement: HistoryLegendElement = {
        ...baseHistoryElement,
        [fieldName]: e.target.value,
      };

      // historyLegend 配列を更新
      const updatedHistoryLegend = [
        updatedHistoryElement,
        ...(currentPrj.worldBuilding.historyLegend?.slice(1) || []),
      ];

      const updatedWorldBuilding: NovelProject["worldBuilding"] = {
        ...currentPrj.worldBuilding,
        historyLegend: updatedHistoryLegend,
      };

      const updatedProject: NovelProject = {
        ...currentPrj,
        worldBuilding: updatedWorldBuilding,
      };

      updateProjectState(updatedProject);

      markTabAsUpdated(
        getCategoryTabIndex(WorldBuildingElementType.HISTORY_LEGEND)
      );
    };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        歴史と伝説 (HistoryLegendElement ベース)
      </Typography>

      <TextField
        fullWidth
        label="名前 (Name)"
        placeholder="歴史的出来事や伝説の名前を入力してください"
        value={targetHistoryElement?.name || ""}
        onChange={handleFieldChange("name")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="説明 (Description)"
        placeholder="この歴史的出来事や伝説の基本的な説明を記述してください"
        value={targetHistoryElement?.description || ""}
        onChange={handleFieldChange("description")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="特徴 (Features)"
        placeholder="この出来事や伝説の特徴的な要素を記述してください"
        value={targetHistoryElement?.features || ""}
        onChange={handleFieldChange("features")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        label="重要性 (Importance)"
        placeholder="物語における重要度（高・中・低など）"
        value={targetHistoryElement?.importance || ""}
        onChange={handleFieldChange("importance")}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        label="時代・期間 (Period)"
        placeholder="いつ起こったか、どの時代の出来事かを記述してください"
        value={targetHistoryElement?.period || ""}
        onChange={handleFieldChange("period")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={4}
        label="重要な出来事 (Significant Events)"
        placeholder="この歴史や伝説における重要な出来事の詳細を記述してください"
        value={targetHistoryElement?.significantEvents || ""}
        onChange={handleFieldChange("significantEvents")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="結果・影響 (Consequences)"
        placeholder="この出来事が世界や社会に与えた影響や結果を記述してください"
        value={targetHistoryElement?.consequences || ""}
        onChange={handleFieldChange("consequences")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="関連 (Relations)"
        placeholder="他の歴史的出来事、人物、場所との関連性を記述してください"
        value={targetHistoryElement?.relations || ""}
        onChange={handleFieldChange("relations")}
        variant="outlined"
        margin="normal"
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, textAlign: "center" }}
      >
        歴史と伝説は世界の深みと背景を提供し、現在の状況に説得力を与える重要な要素です。
      </Typography>
    </Box>
  );
};

export default HistoryLegendTab;

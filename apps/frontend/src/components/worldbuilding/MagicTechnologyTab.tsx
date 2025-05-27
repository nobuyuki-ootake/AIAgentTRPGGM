import React from "react";
import { Box, TextField, Typography, Divider } from "@mui/material";
import { useWorldBuildingContext } from "../../contexts/WorldBuildingContext";
import {
  getCategoryTabIndex,
  WorldBuildingElementType,
  NovelProject,
  MagicTechnologyElement,
} from "@novel-ai-assistant/types";

const MagicTechnologyTab: React.FC = () => {
  const { getCurrentProjectState, updateProjectState, markTabAsUpdated } =
    useWorldBuildingContext();

  const currentProject = getCurrentProjectState();

  // magicTechnology 配列の最初の要素を編集対象とする (存在しない場合は undefined)
  const targetMagicTechElement = currentProject?.worldBuilding
    ?.magicTechnology?.[0] as MagicTechnologyElement | undefined;

  const handleFieldChange =
    (
      fieldName: keyof Omit<
        MagicTechnologyElement,
        "id" | "type" | "originalType"
      >
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const currentPrj = getCurrentProjectState();
      if (!currentPrj || !currentPrj.worldBuilding) return;

      // 既存の要素を取得、または新しい要素を作成
      const baseMagicTechElement = currentPrj.worldBuilding
        .magicTechnology?.[0] || {
        id: `magictech_${Date.now()}`,
        name: "",
        type: WorldBuildingElementType.MAGIC_TECHNOLOGY,
        originalType: WorldBuildingElementType.MAGIC_TECHNOLOGY,
        description: "",
        features: "",
        importance: "",
        functionality: "",
        development: "",
        impact: "",
        relations: "",
      };

      const updatedMagicTechElement: MagicTechnologyElement = {
        ...baseMagicTechElement,
        [fieldName]: e.target.value,
      };

      // magicTechnology 配列を更新
      const updatedMagicTechnology = [
        updatedMagicTechElement,
        ...(currentPrj.worldBuilding.magicTechnology?.slice(1) || []),
      ];

      const updatedWorldBuilding: NovelProject["worldBuilding"] = {
        ...currentPrj.worldBuilding,
        magicTechnology: updatedMagicTechnology,
      };

      const updatedProject: NovelProject = {
        ...currentPrj,
        worldBuilding: updatedWorldBuilding,
      };

      updateProjectState(updatedProject);

      markTabAsUpdated(
        getCategoryTabIndex(WorldBuildingElementType.MAGIC_TECHNOLOGY)
      );
    };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        魔法と技術 (MagicTechnologyElement ベース)
      </Typography>

      <TextField
        fullWidth
        label="名前 (Name)"
        placeholder="魔法システムや技術の名前を入力してください"
        value={targetMagicTechElement?.name || ""}
        onChange={handleFieldChange("name")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="説明 (Description)"
        placeholder="この魔法システムや技術の基本的な説明を記述してください"
        value={targetMagicTechElement?.description || ""}
        onChange={handleFieldChange("description")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="特徴 (Features)"
        placeholder="この魔法や技術の特徴的な要素を記述してください"
        value={targetMagicTechElement?.features || ""}
        onChange={handleFieldChange("features")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        label="重要性 (Importance)"
        placeholder="物語における重要度（高・中・低など）"
        value={targetMagicTechElement?.importance || ""}
        onChange={handleFieldChange("importance")}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={4}
        label="機能・仕組み (Functionality)"
        placeholder="この魔法や技術がどのように機能するか、その仕組みを詳しく記述してください"
        value={targetMagicTechElement?.functionality || ""}
        onChange={handleFieldChange("functionality")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="発展・歴史 (Development)"
        placeholder="この魔法や技術がどのように発展してきたか、その歴史を記述してください"
        value={targetMagicTechElement?.development || ""}
        onChange={handleFieldChange("development")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="影響・効果 (Impact)"
        placeholder="この魔法や技術が社会や世界に与える影響を記述してください"
        value={targetMagicTechElement?.impact || ""}
        onChange={handleFieldChange("impact")}
        variant="outlined"
        margin="normal"
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="関連 (Relations)"
        placeholder="他の魔法システム、技術、人物、組織との関連性を記述してください"
        value={targetMagicTechElement?.relations || ""}
        onChange={handleFieldChange("relations")}
        variant="outlined"
        margin="normal"
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, textAlign: "center" }}
      >
        魔法と技術は世界の可能性と制約を定義し、物語の展開に大きな影響を与える重要な要素です。
      </Typography>
    </Box>
  );
};

export default MagicTechnologyTab;

import React from "react";
import { Box, TextField, Typography, Divider } from "@mui/material";
import { useWorldBuildingContext } from "../../contexts/WorldBuildingContext";
import {
  getCategoryTabIndex,
  WorldBuildingElementType,
  NovelProject,
  CultureElement,
} from "@novel-ai-assistant/types";

const SocietyCultureTab: React.FC = () => {
  const { getCurrentProjectState, updateProjectState, markTabAsUpdated } =
    useWorldBuildingContext();

  const currentProject = getCurrentProjectState();

  // cultures 配列の最初の要素を編集対象とする (存在しない場合は undefined)
  const targetCultureElement = currentProject?.worldBuilding?.cultures?.[0] as
    | CultureElement
    | undefined;

  const handleFieldChange =
    (
      fieldName: keyof Omit<
        CultureElement,
        "id" | "type" | "originalType" | "values" | "customs"
      >
    ) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const currentPrj = getCurrentProjectState();
      if (
        !currentPrj ||
        !currentPrj.worldBuilding ||
        !currentPrj.worldBuilding.cultures || // cultures を確認
        !currentPrj.worldBuilding.cultures[0] // cultures[0] が存在するか確認
      )
        return;

      // 更新対象の CultureElement を取得
      const baseCultureElement = currentPrj.worldBuilding.cultures[0];

      const updatedCultureElement: CultureElement = {
        ...baseCultureElement,
        [fieldName]: e.target.value,
      };

      // cultures 配列を更新
      const updatedCultures = [
        updatedCultureElement,
        ...(currentPrj.worldBuilding.cultures.slice(1) || []),
      ];

      const updatedWorldBuilding: NovelProject["worldBuilding"] = {
        ...currentPrj.worldBuilding,
        cultures: updatedCultures, // societyCulture の代わりに cultures を更新
      };

      const updatedProject: NovelProject = {
        ...currentPrj,
        worldBuilding: updatedWorldBuilding,
      };

      updateProjectState(updatedProject);

      markTabAsUpdated(getCategoryTabIndex(WorldBuildingElementType.CULTURE));
    };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        社会と文化 (CultureElement ベース)
      </Typography>

      <TextField
        fullWidth
        label="名前 (Name)"
        value={targetCultureElement?.name || ""}
        onChange={handleFieldChange("name")}
        variant="outlined"
        margin="normal"
      />
      <TextField
        fullWidth
        multiline
        rows={3}
        label="説明 (Description)"
        value={targetCultureElement?.description || ""}
        onChange={handleFieldChange("description")}
        variant="outlined"
        margin="normal"
      />
      <TextField
        fullWidth
        multiline
        rows={3}
        label="特徴 (Features)"
        value={targetCultureElement?.features || ""}
        onChange={handleFieldChange("features")}
        variant="outlined"
        margin="normal"
      />
      <TextField
        fullWidth
        label="重要性 (Importance)"
        value={targetCultureElement?.importance || ""}
        onChange={handleFieldChange("importance")}
        variant="outlined"
        margin="normal"
      />
      <TextField
        fullWidth
        multiline
        rows={3}
        label="関連 (Relations)"
        value={targetCultureElement?.relations || ""}
        onChange={handleFieldChange("relations")}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="社会構造 (Social Structure)"
        placeholder="階級制度、家族構成、コミュニティの組織など、社会の構造について記述してください"
        value={targetCultureElement?.socialStructure || ""}
        onChange={handleFieldChange("socialStructure")}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="政治と統治 (Government)"
        placeholder="統治形態、権力構造、法律、政治組織について記述してください"
        value={targetCultureElement?.government || ""}
        onChange={handleFieldChange("government")}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="宗教と信仰 (Religion)"
        placeholder="信仰体系、神話、儀式、宗教組織について記述してください"
        value={targetCultureElement?.religion || ""}
        onChange={handleFieldChange("religion")}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="言語 (Language)"
        placeholder="話されている言語、方言、特殊な言語的特徴について記述してください"
        value={targetCultureElement?.language || ""}
        onChange={handleFieldChange("language")}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="芸術と娯楽 (Art)"
        placeholder="芸術形式、音楽、文学、娯楽活動について記述してください"
        value={targetCultureElement?.art || ""}
        onChange={handleFieldChange("art")}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="技術と発明 (Technology)"
        placeholder="技術レベル、重要な発明、科学的理解について記述してください"
        value={targetCultureElement?.technology || ""}
        onChange={handleFieldChange("technology")}
        variant="outlined"
        margin="normal"
      />

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="カスタムテキスト (Custom Text)"
        value={targetCultureElement?.customText || ""}
        onChange={handleFieldChange("customText")}
        variant="outlined"
        margin="normal"
      />
      <TextField
        fullWidth
        multiline
        rows={3}
        label="信仰・信念 (Beliefs)"
        value={targetCultureElement?.beliefs || ""}
        onChange={handleFieldChange("beliefs")}
        variant="outlined"
        margin="normal"
      />
      <TextField
        fullWidth
        multiline
        rows={3}
        label="歴史 (History)"
        value={targetCultureElement?.history || ""}
        onChange={handleFieldChange("history")}
        variant="outlined"
        margin="normal"
      />
      <TextField
        fullWidth
        multiline
        rows={3}
        label="メモ (Notes)"
        value={targetCultureElement?.notes || ""}
        onChange={handleFieldChange("notes")}
        variant="outlined"
        margin="normal"
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, textAlign: "center" }}
      >
        社会と文化は登場人物の世界観、価値観、行動の動機を形成する重要な要素です。
      </Typography>
    </Box>
  );
};

export default SocietyCultureTab;

import React from "react";
import { Box, Typography, TextField } from "@mui/material";
import { HistoryLegendElement } from "@novel-ai-assistant/types";
// import { useState, useEffect, useCallback } from "react"; // Unused
// import { useWorldBuildingContext } from "../../contexts/WorldBuildingContext"; // Unused

interface SettingTabProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  history: HistoryLegendElement[];
  onHistoryChange: (value: string) => void;
}

const SettingTab: React.FC<SettingTabProps> = ({
  description,
  onDescriptionChange,
  history,
  onHistoryChange,
}) => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          世界観設定
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          この物語の世界はどのような場所ですか？時代、技術レベル、魔法の有無、文明の特徴などを記述してください。
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={5}
          maxRows={15}
          label="世界観の基本設定"
          placeholder="例: この世界は魔法と科学技術が共存する近未来の地球が舞台です。人類は1000年前の大災害から回復し、新しい文明を築きました。..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          variant="outlined"
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          歴史
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          この世界の歴史的背景について説明してください。重要な出来事、戦争、大きな変化などを含めます。
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={5}
          maxRows={15}
          label="世界の歴史"
          placeholder="例: 1000年前、世界は「大崩壊」という名の災害に見舞われました。古代の超科学文明は一夜にして滅び、生き残った人々は技術を失いながらも徐々に社会を再建していきました..."
          value={history}
          onChange={(e) => onHistoryChange(e.target.value)}
          variant="outlined"
        />
      </Box>
    </Box>
  );
};

export default SettingTab;

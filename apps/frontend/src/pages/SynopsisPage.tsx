// @ts-nocheck
import React from "react";
import { Typography, Box, Paper, Card, Tabs, Tab } from "@mui/material";
import { useSynopsis } from "../hooks/useSynopsis";
import { SynopsisEditor } from "../components/synopsis/SynopsisEditor";
import { SynopsisTips } from "../components/synopsis/SynopsisTips";
import { UnsavedChangesDialog } from "../components/synopsis/UnsavedChangesDialog";
import TabPanel from "../components/ui/TabPanel";

const SynopsisPage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);
  const {
    currentProject,
    synopsis,
    isEditing,
    showAlertDialog,
    handleStartEditing,
    handleSynopsisChange,
    handleSave,
    handleCancel,
    handleDialogCancel,
    handleDialogContinue,
  } = useSynopsis();

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>キャンペーンが選択されていません。</Typography>
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {currentProject.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          キャンペーン設定・AIゲームマスター設定
        </Typography>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="TRPG設定タブ">
          <Tab label="キャンペーン概要" />
          <Tab label="AIゲームマスター設定" />
          <Tab label="ルールセット" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <SynopsisEditor
            synopsis={synopsis}
            isEditing={isEditing}
            onEdit={handleStartEditing}
            onCancel={handleCancel}
            onSave={handleSave}
            onChange={handleSynopsisChange}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              AIゲームマスターのシステムプロンプト
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              AIがゲームマスターとして振る舞う際の基本的な設定やルールを定義します。
              この設定はセッション中のAIの応答に影響します。
            </Typography>
            <SynopsisEditor
              synopsis={synopsis}
              isEditing={isEditing}
              onEdit={handleStartEditing}
              onCancel={handleCancel}
              onSave={handleSave}
              onChange={handleSynopsisChange}
              placeholder="例: あなたはファンタジー世界のゲームマスターです。プレイヤーの選択を尊重し、公平で楽しいゲーム体験を提供してください。戦闘はD&D5版のルールに従い、ロールプレイを重視します。"
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              ゲームルール設定
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              使用するTRPGシステムのルールや、ハウスルールを定義します。
            </Typography>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1">基本ルール:</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • ダイスロール: 1d20 + 能力値修正
                <br />
                • 難易度クラス (DC): 簡単=10, 普通=15, 困難=20
                <br />
                • イニシアチブ: 1d20 + DEX修正
                <br />
                • クリティカル: 自然20でクリティカルヒット
              </Typography>
            </Card>
          </Box>
        </TabPanel>
      </Card>

      <Card>
        <SynopsisTips />
      </Card>

      <UnsavedChangesDialog
        open={showAlertDialog}
        onCancel={handleDialogCancel}
        onContinue={handleDialogContinue}
      />
    </Box>
  );
};

export default SynopsisPage;

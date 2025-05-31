import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRecoilState } from "recoil";
import { currentProjectState } from "../../store/atoms";
import { v4 as uuidv4 } from "uuid";
import { HistoryLegendElement, NovelProject } from "@novel-ai-assistant/types";

const HistoryLegendTab: React.FC = () => {
  // Recoilからデータを取得
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  // 歴史・伝説データを取得
  const historyLegends = currentProject?.worldBuilding?.historyLegend || [];

  // 状態管理
  const [currentHistory, setCurrentHistory] =
    useState<HistoryLegendElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 新規歴史・伝説作成ダイアログを開く
  const handleOpenNewDialog = () => {
    setCurrentHistory({
      id: uuidv4(),
      name: "",
      type: "history_legend",
      originalType: "history_legend",
      description: "",
      features: "",
      importance: "",
      relations: "",
      period: "",
      significantEvents: "",
      consequences: "",
    } as HistoryLegendElement);
    setIsEditing(false);
    setDialogOpen(true);
  };

  // 歴史・伝説編集ダイアログを開く
  const handleEdit = (history: HistoryLegendElement) => {
    setCurrentHistory({ ...history });
    setIsEditing(true);
    setDialogOpen(true);
  };

  // 歴史・伝説を削除
  const handleDelete = (id: string) => {
    if (!currentProject) return;

    const updatedHistoryLegends = historyLegends.filter(
      (history: HistoryLegendElement) => history.id !== id
    );

    setCurrentProject((prevProject: NovelProject | null) => {
      if (!prevProject) return null;
      return {
        ...prevProject,
        worldBuilding: {
          ...prevProject.worldBuilding,
          historyLegend: updatedHistoryLegends,
        },
      } as NovelProject;
    });
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentHistory(null);
  };

  // 歴史・伝説の保存
  const handleSaveHistory = () => {
    if (!currentHistory || !currentProject) return;

    if (isEditing) {
      const updatedHistoryLegends = historyLegends.map(
        (history: HistoryLegendElement) =>
          history.id === currentHistory.id ? currentHistory : history
      );
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          worldBuilding: {
            ...prevProject.worldBuilding,
            historyLegend: updatedHistoryLegends,
          },
        } as NovelProject;
      });
    } else {
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          worldBuilding: {
            ...prevProject.worldBuilding,
            historyLegend: [
              ...(prevProject.worldBuilding?.historyLegend || []),
              currentHistory,
            ],
          },
        } as NovelProject;
      });
    }
    handleCloseDialog();
  };

  // 入力フィールドの変更を処理
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!currentHistory) return;
    setCurrentHistory({
      ...currentHistory,
      [e.target.name]: e.target.value,
    });
  };

  // 値を安全に文字列として表示するヘルパー関数
  const safeStringDisplay = (value: unknown): string => {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return "[オブジェクト]";
      }
    }
    return String(value);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">歴史と伝説</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewDialog}
        >
          新しい歴史・伝説を追加
        </Button>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        物語世界の歴史的出来事、伝説、神話などを定義します。世界の背景と深みを提供し、現在の状況に説得力を与える重要な要素です。
      </Typography>

      {historyLegends.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            まだ歴史・伝説が追加されていません。「新しい歴史・伝説を追加」ボタンから追加できます。
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: "100%" }}>
          {historyLegends.map(
            (history: HistoryLegendElement, index: number) => (
              <Paper
                key={history.id || index}
                elevation={1}
                sx={{
                  mb: 2,
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <ListItem
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    p: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {safeStringDisplay(history.name) || "名称未設定"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        時代: {safeStringDisplay(history.period) || "未設定"} |
                        重要性:{" "}
                        {safeStringDisplay(history.importance) || "未設定"}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        onClick={() => handleEdit(history)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(history.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {history.description && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        説明
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(history.description)}
                      </Typography>
                    </Box>
                  )}

                  {history.significantEvents && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        重要な出来事
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(history.significantEvents)}
                      </Typography>
                    </Box>
                  )}

                  {history.consequences && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        結果・影響
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(history.consequences)}
                      </Typography>
                    </Box>
                  )}

                  {history.relations && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        関連要素
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(history.relations)}
                      </Typography>
                    </Box>
                  )}
                </ListItem>
              </Paper>
            )
          )}
        </List>
      )}

      {/* 編集・新規作成ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEditing ? "歴史・伝説を編集" : "新しい歴史・伝説を追加"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="名前"
            name="name"
            placeholder="歴史的出来事や伝説の名前"
            value={safeStringDisplay(currentHistory?.name) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="説明"
            name="description"
            placeholder="この歴史的出来事や伝説の基本的な説明"
            value={safeStringDisplay(currentHistory?.description) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="特徴"
            name="features"
            placeholder="この出来事や伝説の特徴的な要素"
            value={safeStringDisplay(currentHistory?.features) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            label="重要性"
            name="importance"
            placeholder="物語における重要度（高・中・低など）"
            value={safeStringDisplay(currentHistory?.importance) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            label="時代・期間"
            name="period"
            placeholder="いつ起こったか、どの時代の出来事か"
            value={safeStringDisplay(currentHistory?.period) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="重要な出来事"
            name="significantEvents"
            placeholder="この歴史や伝説における重要な出来事の詳細"
            value={safeStringDisplay(currentHistory?.significantEvents) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="結果・影響"
            name="consequences"
            placeholder="この出来事が世界や社会に与えた影響や結果"
            value={safeStringDisplay(currentHistory?.consequences) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="関連要素"
            name="relations"
            placeholder="他の歴史的出来事、人物、場所との関連性"
            value={safeStringDisplay(currentHistory?.relations) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveHistory} variant="contained">
            {isEditing ? "更新" : "追加"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HistoryLegendTab;

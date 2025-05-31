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
import {
  GeographyEnvironmentElement,
  NovelProject,
} from "@novel-ai-assistant/types";

const GeographyEnvironmentTab: React.FC = () => {
  // Recoilからデータを取得
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  // 地理・環境データを取得
  const geographyEnvironments =
    currentProject?.worldBuilding?.geographyEnvironment || [];

  // 状態管理
  const [currentGeography, setCurrentGeography] =
    useState<GeographyEnvironmentElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 新規地理・環境作成ダイアログを開く
  const handleOpenNewDialog = () => {
    setCurrentGeography({
      id: uuidv4(),
      name: "",
      type: "geography_environment",
      originalType: "geography_environment",
      description: "",
      features: "",
      importance: "",
      relations: "",
    } as GeographyEnvironmentElement);
    setIsEditing(false);
    setDialogOpen(true);
  };

  // 地理・環境編集ダイアログを開く
  const handleEdit = (geography: GeographyEnvironmentElement) => {
    setCurrentGeography({ ...geography });
    setIsEditing(true);
    setDialogOpen(true);
  };

  // 地理・環境を削除
  const handleDelete = (id: string) => {
    if (!currentProject) return;

    const updatedGeographyEnvironments = geographyEnvironments.filter(
      (geography: GeographyEnvironmentElement) => geography.id !== id
    );

    setCurrentProject((prevProject: NovelProject | null) => {
      if (!prevProject) return null;
      return {
        ...prevProject,
        worldBuilding: {
          ...prevProject.worldBuilding,
          geographyEnvironment: updatedGeographyEnvironments,
        },
      } as NovelProject;
    });
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentGeography(null);
  };

  // 地理・環境の保存
  const handleSaveGeography = () => {
    if (!currentGeography || !currentProject) return;

    if (isEditing) {
      const updatedGeographyEnvironments = geographyEnvironments.map(
        (geography: GeographyEnvironmentElement) =>
          geography.id === currentGeography.id ? currentGeography : geography
      );
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          worldBuilding: {
            ...prevProject.worldBuilding,
            geographyEnvironment: updatedGeographyEnvironments,
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
            geographyEnvironment: [
              ...(prevProject.worldBuilding?.geographyEnvironment || []),
              currentGeography,
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
    if (!currentGeography) return;
    setCurrentGeography({
      ...currentGeography,
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
        <Typography variant="h5">地理と環境</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewDialog}
        >
          新しい地理・環境を追加
        </Button>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        物語世界の地理的特徴、気候、自然環境などを定義します。地形、生態系、自然現象など、物語の舞台設定と雰囲気を決定する重要な要素です。
      </Typography>

      {geographyEnvironments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            まだ地理・環境が追加されていません。「新しい地理・環境を追加」ボタンから追加できます。
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: "100%" }}>
          {geographyEnvironments.map(
            (geography: GeographyEnvironmentElement, index: number) => (
              <Paper
                key={geography.id || index}
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
                        {safeStringDisplay(geography.name) || "名称未設定"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        重要性:{" "}
                        {safeStringDisplay(geography.importance) || "未設定"}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        onClick={() => handleEdit(geography)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(geography.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {geography.description && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        説明
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(geography.description)}
                      </Typography>
                    </Box>
                  )}

                  {geography.features && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        特徴
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(geography.features)}
                      </Typography>
                    </Box>
                  )}

                  {geography.relations && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        関連要素
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(geography.relations)}
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
          {isEditing ? "地理・環境を編集" : "新しい地理・環境を追加"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="名前"
            name="name"
            placeholder="地理的特徴や環境の名前"
            value={safeStringDisplay(currentGeography?.name) || ""}
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
            placeholder="この地理的特徴や環境の基本的な説明"
            value={safeStringDisplay(currentGeography?.description) || ""}
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
            placeholder="地形、気候、自然現象、生態系などの特徴"
            value={safeStringDisplay(currentGeography?.features) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            label="重要性"
            name="importance"
            placeholder="物語における重要度（高・中・低など）"
            value={safeStringDisplay(currentGeography?.importance) || ""}
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
            placeholder="他の地域、キャラクター、イベントとの関連性"
            value={safeStringDisplay(currentGeography?.relations) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveGeography} variant="contained">
            {isEditing ? "更新" : "追加"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GeographyEnvironmentTab;

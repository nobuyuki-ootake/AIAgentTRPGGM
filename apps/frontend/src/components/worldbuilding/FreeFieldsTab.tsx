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
import { FreeFieldElement, NovelProject } from "@novel-ai-assistant/types";

const FreeFieldsTab: React.FC = () => {
  // Recoilからデータを取得
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  // 自由記述データを取得
  const freeFields = currentProject?.worldBuilding?.freeFields || [];

  // 状態管理
  const [currentFreeField, setCurrentFreeField] =
    useState<FreeFieldElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 新規自由記述作成ダイアログを開く
  const handleOpenNewDialog = () => {
    setCurrentFreeField({
      id: uuidv4(),
      name: "",
      type: "free_field",
      originalType: "free_field",
      description: "",
      features: "",
      importance: "",
      relations: "",
    } as FreeFieldElement);
    setIsEditing(false);
    setDialogOpen(true);
  };

  // 自由記述編集ダイアログを開く
  const handleEdit = (freeField: FreeFieldElement) => {
    setCurrentFreeField({ ...freeField });
    setIsEditing(true);
    setDialogOpen(true);
  };

  // 自由記述を削除
  const handleDelete = (id: string) => {
    if (!currentProject) return;

    const updatedFreeFields = freeFields.filter(
      (freeField: FreeFieldElement) => freeField.id !== id
    );

    setCurrentProject((prevProject: NovelProject | null) => {
      if (!prevProject) return null;
      return {
        ...prevProject,
        worldBuilding: {
          ...prevProject.worldBuilding,
          freeFields: updatedFreeFields,
        },
      } as NovelProject;
    });
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentFreeField(null);
  };

  // 自由記述の保存
  const handleSaveFreeField = () => {
    if (!currentFreeField || !currentProject) return;

    if (isEditing) {
      const updatedFreeFields = freeFields.map((freeField: FreeFieldElement) =>
        freeField.id === currentFreeField.id ? currentFreeField : freeField
      );
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          worldBuilding: {
            ...prevProject.worldBuilding,
            freeFields: updatedFreeFields,
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
            freeFields: [
              ...(prevProject.worldBuilding?.freeFields || []),
              currentFreeField,
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
    if (!currentFreeField) return;
    setCurrentFreeField({
      ...currentFreeField,
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
        <Typography variant="h5">自由記述欄</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewDialog}
        >
          新しい項目を追加
        </Button>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        世界観設定の他カテゴリに当てはまらない追加情報を記述できます。独自のカテゴリを作成して自由に内容を入力してください。
      </Typography>

      {freeFields.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            まだ自由記述項目が追加されていません。「新しい項目を追加」ボタンから追加できます。
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: "100%" }}>
          {freeFields.map((freeField: FreeFieldElement, index: number) => (
            <Paper
              key={freeField.id || index}
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
                      {safeStringDisplay(freeField.name) || "名称未設定"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      重要性:{" "}
                      {safeStringDisplay(freeField.importance) || "未設定"}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      onClick={() => handleEdit(freeField)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(freeField.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {freeField.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      説明
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {safeStringDisplay(freeField.description)}
                    </Typography>
                  </Box>
                )}

                {freeField.features && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      特徴
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {safeStringDisplay(freeField.features)}
                    </Typography>
                  </Box>
                )}

                {freeField.relations && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      関連要素
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {safeStringDisplay(freeField.relations)}
                    </Typography>
                  </Box>
                )}
              </ListItem>
            </Paper>
          ))}
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
          {isEditing ? "自由記述項目を編集" : "新しい自由記述項目を追加"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="名前"
            name="name"
            placeholder="自由記述項目の名前"
            value={safeStringDisplay(currentFreeField?.name) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="説明"
            name="description"
            placeholder="この項目の詳細な説明"
            value={safeStringDisplay(currentFreeField?.description) || ""}
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
            placeholder="この項目の特徴的な要素"
            value={safeStringDisplay(currentFreeField?.features) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            label="重要性"
            name="importance"
            placeholder="物語における重要度（高・中・低など）"
            value={safeStringDisplay(currentFreeField?.importance) || ""}
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
            placeholder="他の世界観要素、キャラクター、イベントとの関連性"
            value={safeStringDisplay(currentFreeField?.relations) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveFreeField} variant="contained">
            {isEditing ? "更新" : "追加"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FreeFieldsTab;

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
  MagicTechnologyElement,
  NovelProject,
} from "@novel-ai-assistant/types";

const MagicTechnologyTab: React.FC = () => {
  // Recoilからデータを取得
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  // 魔法・技術データを取得
  const magicTechnologies =
    currentProject?.worldBuilding?.magicTechnology || [];

  // 状態管理
  const [currentMagicTech, setCurrentMagicTech] =
    useState<MagicTechnologyElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 新規魔法・技術作成ダイアログを開く
  const handleOpenNewDialog = () => {
    setCurrentMagicTech({
      id: uuidv4(),
      name: "",
      type: "magic_technology",
      originalType: "magic_technology",
      description: "",
      features: "",
      importance: "",
      relations: "",
      functionality: "",
      development: "",
      impact: "",
    } as MagicTechnologyElement);
    setIsEditing(false);
    setDialogOpen(true);
  };

  // 魔法・技術編集ダイアログを開く
  const handleEdit = (magicTech: MagicTechnologyElement) => {
    setCurrentMagicTech({ ...magicTech });
    setIsEditing(true);
    setDialogOpen(true);
  };

  // 魔法・技術を削除
  const handleDelete = (id: string) => {
    if (!currentProject) return;

    const updatedMagicTechnologies = magicTechnologies.filter(
      (magicTech: MagicTechnologyElement) => magicTech.id !== id
    );

    setCurrentProject((prevProject: NovelProject | null) => {
      if (!prevProject) return null;
      return {
        ...prevProject,
        worldBuilding: {
          ...prevProject.worldBuilding,
          magicTechnology: updatedMagicTechnologies,
        },
      } as NovelProject;
    });
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentMagicTech(null);
  };

  // 魔法・技術の保存
  const handleSaveMagicTech = () => {
    if (!currentMagicTech || !currentProject) return;

    if (isEditing) {
      const updatedMagicTechnologies = magicTechnologies.map(
        (magicTech: MagicTechnologyElement) =>
          magicTech.id === currentMagicTech.id ? currentMagicTech : magicTech
      );
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          worldBuilding: {
            ...prevProject.worldBuilding,
            magicTechnology: updatedMagicTechnologies,
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
            magicTechnology: [
              ...(prevProject.worldBuilding?.magicTechnology || []),
              currentMagicTech,
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
    if (!currentMagicTech) return;
    setCurrentMagicTech({
      ...currentMagicTech,
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
        <Typography variant="h5">魔法と技術</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewDialog}
        >
          新しい魔法・技術を追加
        </Button>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        物語世界の魔法システム、技術、科学などを定義します。世界の可能性と制約を決定し、物語の展開に大きな影響を与える重要な要素です。
      </Typography>

      {magicTechnologies.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            まだ魔法・技術が追加されていません。「新しい魔法・技術を追加」ボタンから追加できます。
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: "100%" }}>
          {magicTechnologies.map(
            (magicTech: MagicTechnologyElement, index: number) => (
              <Paper
                key={magicTech.id || index}
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
                        {safeStringDisplay(magicTech.name) || "名称未設定"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        重要性:{" "}
                        {safeStringDisplay(magicTech.importance) || "未設定"}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton
                        onClick={() => handleEdit(magicTech)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(magicTech.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {magicTech.description && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        説明
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(magicTech.description)}
                      </Typography>
                    </Box>
                  )}

                  {magicTech.functionality && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        機能・仕組み
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(magicTech.functionality)}
                      </Typography>
                    </Box>
                  )}

                  {magicTech.impact && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        影響・効果
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(magicTech.impact)}
                      </Typography>
                    </Box>
                  )}

                  {magicTech.relations && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        関連要素
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {safeStringDisplay(magicTech.relations)}
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
          {isEditing ? "魔法・技術を編集" : "新しい魔法・技術を追加"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="名前"
            name="name"
            placeholder="魔法システムや技術の名前"
            value={safeStringDisplay(currentMagicTech?.name) || ""}
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
            placeholder="この魔法システムや技術の基本的な説明"
            value={safeStringDisplay(currentMagicTech?.description) || ""}
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
            placeholder="この魔法や技術の特徴的な要素"
            value={safeStringDisplay(currentMagicTech?.features) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            label="重要性"
            name="importance"
            placeholder="物語における重要度（高・中・低など）"
            value={safeStringDisplay(currentMagicTech?.importance) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="機能・仕組み"
            name="functionality"
            placeholder="この魔法や技術がどのように機能するか、その仕組み"
            value={safeStringDisplay(currentMagicTech?.functionality) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="発展・歴史"
            name="development"
            placeholder="この魔法や技術がどのように発展してきたか、その歴史"
            value={safeStringDisplay(currentMagicTech?.development) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="影響・効果"
            name="impact"
            placeholder="この魔法や技術が社会や世界に与える影響"
            value={safeStringDisplay(currentMagicTech?.impact) || ""}
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
            placeholder="他の魔法システム、技術、人物、組織との関連性"
            value={safeStringDisplay(currentMagicTech?.relations) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveMagicTech} variant="contained">
            {isEditing ? "更新" : "追加"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MagicTechnologyTab;

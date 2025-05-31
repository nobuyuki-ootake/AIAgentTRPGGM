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
import { CultureElement, NovelProject } from "@novel-ai-assistant/types";

const SocietyCultureTab: React.FC = () => {
  // Recoilからデータを取得
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  // 文化データを取得
  const cultures = currentProject?.worldBuilding?.cultures || [];

  // 状態管理
  const [currentCulture, setCurrentCulture] = useState<CultureElement | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 新規文化作成ダイアログを開く
  const handleOpenNewDialog = () => {
    setCurrentCulture({
      id: uuidv4(),
      name: "",
      type: "culture",
      originalType: "culture",
      description: "",
      features: "",
      importance: "",
      relations: "",
      customText: "",
      beliefs: "",
      history: "",
      socialStructure: "",
      values: [],
      customs: [],
      government: "",
      religion: "",
      language: "",
      art: "",
      technology: "",
      notes: "",
      traditions: "",
      education: "",
    } as CultureElement);
    setIsEditing(false);
    setDialogOpen(true);
  };

  // 文化編集ダイアログを開く
  const handleEdit = (culture: CultureElement) => {
    setCurrentCulture({ ...culture });
    setIsEditing(true);
    setDialogOpen(true);
  };

  // 文化を削除
  const handleDelete = (id: string) => {
    if (!currentProject) return;

    const updatedCultures = cultures.filter(
      (culture: CultureElement) => culture.id !== id
    );

    setCurrentProject((prevProject: NovelProject | null) => {
      if (!prevProject) return null;
      return {
        ...prevProject,
        worldBuilding: {
          ...prevProject.worldBuilding,
          cultures: updatedCultures,
        },
      } as NovelProject;
    });
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentCulture(null);
  };

  // 文化の保存
  const handleSaveCulture = () => {
    if (!currentCulture || !currentProject) return;

    if (isEditing) {
      const updatedCultures = cultures.map((culture: CultureElement) =>
        culture.id === currentCulture.id ? currentCulture : culture
      );
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          worldBuilding: {
            ...prevProject.worldBuilding,
            cultures: updatedCultures,
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
            cultures: [
              ...(prevProject.worldBuilding?.cultures || []),
              currentCulture,
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
    if (!currentCulture) return;
    setCurrentCulture({
      ...currentCulture,
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
        <Typography variant="h5">社会と文化</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewDialog}
        >
          新しい文化を追加
        </Button>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        物語世界の社会構造、文化、習慣、信仰体系などを定義します。異なる地域や民族の文化的特徴を詳細に記述できます。
      </Typography>

      {cultures.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            まだ文化が追加されていません。「新しい文化を追加」ボタンから追加できます。
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: "100%" }}>
          {cultures.map((culture: CultureElement, index: number) => (
            <Paper
              key={culture.id || index}
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
                      {safeStringDisplay(culture.name) || "名称未設定"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      重要性:{" "}
                      {safeStringDisplay(culture.importance) || "未設定"}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      onClick={() => handleEdit(culture)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(culture.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {culture.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      説明
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {safeStringDisplay(culture.description)}
                    </Typography>
                  </Box>
                )}

                {culture.socialStructure && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      社会構造
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {safeStringDisplay(culture.socialStructure)}
                    </Typography>
                  </Box>
                )}

                {culture.religion && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      宗教・信仰
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {safeStringDisplay(culture.religion)}
                    </Typography>
                  </Box>
                )}

                {culture.relations && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      関連要素
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {safeStringDisplay(culture.relations)}
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
          {isEditing ? "文化を編集" : "新しい文化を追加"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="名前"
            name="name"
            value={safeStringDisplay(currentCulture?.name) || ""}
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
            value={safeStringDisplay(currentCulture?.description) || ""}
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
            value={safeStringDisplay(currentCulture?.features) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            label="重要性"
            name="importance"
            value={safeStringDisplay(currentCulture?.importance) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="社会構造"
            name="socialStructure"
            placeholder="階級制度、家族構成、コミュニティの組織など"
            value={safeStringDisplay(currentCulture?.socialStructure) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="政治と統治"
            name="government"
            placeholder="統治形態、権力構造、法律、政治組織について"
            value={safeStringDisplay(currentCulture?.government) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="宗教と信仰"
            name="religion"
            placeholder="信仰体系、神話、儀式、宗教組織について"
            value={safeStringDisplay(currentCulture?.religion) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="言語"
            name="language"
            placeholder="話されている言語、方言、特殊な言語的特徴について"
            value={safeStringDisplay(currentCulture?.language) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="芸術と娯楽"
            name="art"
            placeholder="芸術形式、音楽、文学、娯楽活動について"
            value={safeStringDisplay(currentCulture?.art) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="技術"
            name="technology"
            placeholder="技術レベル、重要な発明、科学的理解について"
            value={safeStringDisplay(currentCulture?.technology) || ""}
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
            value={safeStringDisplay(currentCulture?.relations) || ""}
            onChange={handleInputChange}
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveCulture} variant="contained">
            {isEditing ? "更新" : "追加"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocietyCultureTab;

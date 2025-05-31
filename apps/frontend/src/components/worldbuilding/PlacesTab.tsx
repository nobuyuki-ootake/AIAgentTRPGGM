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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  List,
  ListItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRecoilState } from "recoil";
import { currentProjectState } from "../../store/atoms";
import { v4 as uuidv4 } from "uuid";
import { PlaceElement, NovelProject } from "@novel-ai-assistant/types";

// 場所タイプの定義
const PLACE_TYPES = [
  { value: "city", label: "都市" },
  { value: "town", label: "町" },
  { value: "village", label: "村" },
  { value: "castle", label: "城" },
  { value: "temple", label: "寺院" },
  { value: "forest", label: "森林" },
  { value: "mountain", label: "山脈" },
  { value: "lake", label: "湖" },
  { value: "river", label: "川" },
  { value: "ocean", label: "海" },
  { value: "island", label: "島" },
  { value: "desert", label: "砂漠" },
  { value: "cave", label: "洞窟" },
  { value: "ruin", label: "遺跡" },
  { value: "other", label: "その他" },
];

const PlacesTab: React.FC = () => {
  // Recoilからデータを取得
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  // 場所データを取得
  const places = currentProject?.worldBuilding?.places || [];

  // 状態管理
  const [currentPlace, setCurrentPlace] = useState<PlaceElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 新規場所作成ダイアログを開く
  const handleOpenNewDialog = () => {
    setCurrentPlace({
      id: uuidv4(),
      name: "",
      type: "place",
      originalType: "place",
      description: "",
      features: "",
      importance: "",
      relations: "",
      location: "",
      population: "",
      culturalFeatures: "",
    } as PlaceElement);
    setIsEditing(false);
    setDialogOpen(true);
  };

  // 場所編集ダイアログを開く
  const handleEdit = (place: PlaceElement) => {
    setCurrentPlace({ ...place });
    setIsEditing(true);
    setDialogOpen(true);
  };

  // 場所を削除
  const handleDelete = (id: string) => {
    if (!currentProject) return;

    const updatedPlaces = places.filter(
      (place: PlaceElement) => place.id !== id
    );

    setCurrentProject((prevProject: NovelProject | null) => {
      if (!prevProject) return null;
      return {
        ...prevProject,
        worldBuilding: {
          ...prevProject.worldBuilding,
          places: updatedPlaces,
        },
      } as NovelProject;
    });
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentPlace(null);
  };

  // 場所の保存
  const handleSavePlace = () => {
    if (!currentPlace || !currentProject) return;

    if (isEditing) {
      const updatedPlaces = places.map((place: PlaceElement) =>
        place.id === currentPlace.id ? currentPlace : place
      );
      setCurrentProject((prevProject: NovelProject | null) => {
        if (!prevProject) return null;
        return {
          ...prevProject,
          worldBuilding: {
            ...prevProject.worldBuilding,
            places: updatedPlaces,
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
            places: [
              ...(prevProject.worldBuilding?.places || []),
              currentPlace,
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
    if (!currentPlace) return;
    setCurrentPlace({
      ...currentPlace,
      [e.target.name]: e.target.value,
    });
  };

  // セレクトフィールドの変更を処理
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    if (!currentPlace) return;
    setCurrentPlace({
      ...currentPlace,
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
        <Typography variant="h5">場所と地理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewDialog}
        >
          新しい場所を追加
        </Button>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        物語の舞台となる場所や地理的特徴を定義します。重要な都市、森林、山脈など、ストーリーに関わる場所について詳細を記述できます。
      </Typography>

      {places.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            まだ場所が追加されていません。「新しい場所を追加」ボタンから追加できます。
          </Typography>
        </Paper>
      ) : (
        <List sx={{ width: "100%" }}>
          {places.map((place: PlaceElement, index: number) => (
            <Paper
              key={place.id || index}
              elevation={1}
              sx={{
                mb: 2,
                p: 2,
                "&:hover": {
                  boxShadow: 3,
                },
              }}
            >
              <ListItem
                disablePadding
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ flexGrow: 1, pr: 2 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    component="div"
                    sx={{ mb: 1 }}
                  >
                    {safeStringDisplay(place.name) || "名称未設定の場所"}
                  </Typography>

                  <Typography
                    component="div"
                    variant="body2"
                    sx={{ color: "text.secondary", mb: 0.5 }}
                  >
                    <strong>種類:</strong>{" "}
                    {safeStringDisplay(place.type) || "未指定"}
                  </Typography>

                  <Typography
                    component="div"
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", mb: 0.5 }}
                  >
                    {safeStringDisplay(place.description) || "説明がありません"}
                  </Typography>

                  <Typography component="div" variant="body2" sx={{ mb: 0.5 }}>
                    <strong>重要度:</strong>{" "}
                    {safeStringDisplay(place.importance) || "未指定"}
                  </Typography>

                  <Typography component="div" variant="body2" sx={{ mb: 0.5 }}>
                    <strong>関連:</strong>{" "}
                    {safeStringDisplay(place.relations) || "未指定"}
                  </Typography>

                  {place.location && (
                    <Typography
                      component="div"
                      variant="body2"
                      sx={{ mb: 0.5 }}
                    >
                      <strong>位置:</strong> {safeStringDisplay(place.location)}
                    </Typography>
                  )}

                  {place.population && (
                    <Typography
                      component="div"
                      variant="body2"
                      sx={{ mb: 0.5 }}
                    >
                      <strong>人口:</strong>{" "}
                      {safeStringDisplay(place.population)}
                    </Typography>
                  )}

                  {place.culturalFeatures && (
                    <Typography
                      component="div"
                      variant="body2"
                      sx={{ mb: 0.5 }}
                    >
                      <strong>文化的特徴:</strong>{" "}
                      {safeStringDisplay(place.culturalFeatures)}
                    </Typography>
                  )}

                  {place.features && (
                    <Typography component="div" variant="body2">
                      <strong>地理的特徴:</strong>{" "}
                      {safeStringDisplay(place.features)}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(place)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(place.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}

      {/* 場所編集/追加ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="place-dialog-title"
        fullWidth
        maxWidth="md"
      >
        <DialogTitle id="place-dialog-title">
          {isEditing ? "場所を編集" : "新しい場所を追加"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              autoFocus
              fullWidth
              name="name"
              label="場所の名前"
              type="text"
              variant="outlined"
              value={safeStringDisplay(currentPlace?.name) || ""}
              onChange={handleInputChange}
            />

            <FormControl fullWidth>
              <InputLabel id="place-type-label">場所の種類</InputLabel>
              <Select
                labelId="place-type-label"
                id="type"
                name="type"
                value={safeStringDisplay(currentPlace?.type) || "place"}
                label="場所の種類"
                onChange={handleSelectChange}
              >
                {PLACE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              name="description"
              label="場所の説明"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={safeStringDisplay(currentPlace?.description) || ""}
              onChange={handleInputChange}
            />

            <TextField
              name="importance"
              label="重要度"
              type="text"
              fullWidth
              variant="outlined"
              value={safeStringDisplay(currentPlace?.importance) || ""}
              onChange={handleInputChange}
            />

            <TextField
              name="location"
              label="位置情報"
              type="text"
              fullWidth
              variant="outlined"
              value={safeStringDisplay(currentPlace?.location) || ""}
              onChange={handleInputChange}
            />

            <TextField
              name="population"
              label="人口"
              type="text"
              fullWidth
              variant="outlined"
              value={safeStringDisplay(currentPlace?.population) || ""}
              onChange={handleInputChange}
            />

            <TextField
              name="features"
              label="特徴"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={safeStringDisplay(currentPlace?.features) || ""}
              onChange={handleInputChange}
            />

            <TextField
              name="culturalFeatures"
              label="文化的特徴"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={safeStringDisplay(currentPlace?.culturalFeatures) || ""}
              onChange={handleInputChange}
            />

            <TextField
              name="relations"
              label="関連性"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={2}
              value={safeStringDisplay(currentPlace?.relations) || ""}
              onChange={handleInputChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button
            onClick={handleSavePlace}
            variant="contained"
            color="primary"
            disabled={!currentPlace?.name}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlacesTab;

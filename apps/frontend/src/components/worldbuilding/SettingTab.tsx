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
import { SettingElement, NovelProject } from "@novel-ai-assistant/types";

interface SettingTabProps {
  settings: SettingElement[];
}

const SettingTab: React.FC<SettingTabProps> = ({ settings }) => {
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<SettingElement | null>(
    null
  );
  const [formData, setFormData] = useState<SettingElement>({
    id: "",
    name: "",
    description: "",
    history: "",
  });

  const handleOpenDialog = (element?: SettingElement) => {
    if (element) {
      setEditingElement(element);
      setFormData(element);
    } else {
      setEditingElement(null);
      setFormData({
        id: "",
        name: "",
        description: "",
        history: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingElement(null);
    setFormData({
      id: "",
      name: "",
      description: "",
      history: "",
    });
  };

  const handleSave = () => {
    if (!currentProject) return;

    setCurrentProject((prevProject: NovelProject | null) => {
      if (!prevProject) return prevProject;

      let updatedSettings: SettingElement[];
      if (editingElement) {
        // 編集の場合
        updatedSettings = prevProject.worldBuilding.setting.map((item) =>
          item === editingElement ? formData : item
        );
      } else {
        // 新規追加の場合 - IDを生成
        const newSetting: SettingElement = {
          ...formData,
          id: `setting-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          name:
            formData.name ||
            `世界観設定 ${prevProject.worldBuilding.setting.length + 1}`,
        };
        updatedSettings = [...prevProject.worldBuilding.setting, newSetting];
      }

      return {
        ...prevProject,
        worldBuilding: {
          ...prevProject.worldBuilding,
          setting: updatedSettings,
        },
      };
    });

    handleCloseDialog();
  };

  const handleDelete = (elementToDelete: SettingElement) => {
    if (!currentProject) return;

    setCurrentProject((prevProject: NovelProject | null) => {
      if (!prevProject) return prevProject;

      const updatedSettings = prevProject.worldBuilding.setting.filter(
        (item) => item !== elementToDelete
      );

      return {
        ...prevProject,
        worldBuilding: {
          ...prevProject.worldBuilding,
          setting: updatedSettings,
        },
      };
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5">世界観設定</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新しい設定を追加
        </Button>
      </Box>

      {settings.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
          <Typography variant="body1" color="text.secondary">
            まだ世界観設定が登録されていません。
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            「新しい設定を追加」ボタンから設定を追加してください。
          </Typography>
        </Paper>
      ) : (
        <List>
          {settings.map((setting, index) => (
            <ListItem key={index} sx={{ mb: 2 }}>
              <Paper sx={{ p: 2, width: "100%" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {setting.name || `世界観設定 ${index + 1}`}
                    </Typography>
                    {setting.description && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          gutterBottom
                        >
                          基本設定
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {setting.description}
                        </Typography>
                      </Box>
                    )}
                    {setting.history && (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          color="primary"
                          gutterBottom
                        >
                          歴史
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ whiteSpace: "pre-wrap" }}
                        >
                          {setting.history}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(setting)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(setting)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingElement ? "世界観設定を編集" : "新しい世界観設定を追加"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="設定名"
              placeholder="この世界観設定の名前を入力してください"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              maxRows={10}
              label="基本設定"
              placeholder="この物語の世界はどのような場所ですか？時代、技術レベル、魔法の有無、文明の特徴などを記述してください。"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              maxRows={10}
              label="歴史"
              placeholder="この世界の歴史的背景について説明してください。重要な出来事、戦争、大きな変化などを含めます。"
              value={formData.history || ""}
              onChange={(e) =>
                setFormData({ ...formData, history: e.target.value })
              }
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingTab;

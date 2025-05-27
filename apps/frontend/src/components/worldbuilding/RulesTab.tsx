import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  RuleElement as Rule,
  WorldBuildingElementType,
  getCategoryTabIndex,
} from "@novel-ai-assistant/types";
import { useElementAccumulator } from "../../hooks/useElementAccumulator";
import { v4 as uuidv4 } from "uuid";

const RulesTab: React.FC = () => {
  const {
    getCurrentProjectState,
    updateProjectState,
    addPendingRule,
    pendingRules,
    saveAllPendingElements,
    markTabAsUpdated,
  } = useElementAccumulator();

  const [displayedRules, setDisplayedRules] = useState<Rule[]>([]);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const project = getCurrentProjectState();
    let loadedRules = project?.worldBuilding?.rules || [];

    if (pendingRules.length > 0) {
      const allRulesMap = new Map<string, Rule>();
      loadedRules.forEach((rule) => allRulesMap.set(rule.id, rule));
      pendingRules.forEach((pendingRule) =>
        allRulesMap.set(pendingRule.id, pendingRule)
      );
      loadedRules = Array.from(allRulesMap.values());
    }
    setDisplayedRules(loadedRules);
  }, [getCurrentProjectState, pendingRules]);

  const handleOpenNewDialog = () => {
    setCurrentRule({
      id: uuidv4(),
      name: "",
      type: "rule",
      originalType: "rule",
      description: "",
      features: "",
      importance: "",
      relations: "",
      exceptions: "",
      origin: "",
      impact: "",
      limitations: "",
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedRules = displayedRules.filter((rule) => rule.id !== id);
    setDisplayedRules(updatedRules);

    const currentProject = getCurrentProjectState();
    if (currentProject && currentProject.worldBuilding) {
      const updatedProject = {
        ...currentProject,
        worldBuilding: {
          ...currentProject.worldBuilding,
          rules: updatedRules,
        },
      };
      updateProjectState(updatedProject);
    }

    markTabAsUpdated(getCategoryTabIndex(WorldBuildingElementType.RULE));
    if (currentRule && currentRule.id === id) {
      setCurrentRule(updatedRules.length > 0 ? updatedRules[0] : null);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSaveRule = () => {
    if (!currentRule) return;
    const currentProject = getCurrentProjectState();

    if (isEditing) {
      const updatedRules = displayedRules.map((rule) =>
        rule.id === currentRule.id ? currentRule : rule
      );
      setDisplayedRules(updatedRules);
      if (currentProject && currentProject.worldBuilding) {
        const updatedProject = {
          ...currentProject,
          worldBuilding: {
            ...currentProject.worldBuilding,
            rules: updatedRules,
          },
        };
        updateProjectState(updatedProject);
      }
    } else {
      addPendingRule(currentRule);
      setDisplayedRules((prev) => [...prev, currentRule]);
      saveAllPendingElements();
    }

    markTabAsUpdated(getCategoryTabIndex(WorldBuildingElementType.RULE));
    handleCloseDialog();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!currentRule) return;
    setCurrentRule({
      ...currentRule,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">ルールと法則</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewDialog}
        >
          新しいルールを追加
        </Button>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        この世界の物理法則、魔法のルール、特殊能力の制限などを定義します。ルールは物語の整合性を保ち、キャラクターの行動に制約を与えます。
      </Typography>

      {displayedRules && displayedRules.length > 0 ? (
        <List sx={{ width: "100%" }}>
          {displayedRules.map((rule) => (
            <Paper
              key={rule.id}
              elevation={1}
              sx={{
                mb: 2,
                p: 2,
                "&:hover": {
                  boxShadow: 3,
                },
                cursor: "pointer",
              }}
              onClick={() => {
                setCurrentRule(rule);
                setIsEditing(true);
                setDialogOpen(true);
              }}
            >
              <ListItem
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(rule.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
                disablePadding
                sx={{ pt: 1 }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="medium">
                      {rule.name || "名称未設定のルール"}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: "block", mt: 1 }}>
                      <Typography
                        variant="body2"
                        component="span"
                        display="block"
                      >
                        概要: {rule.description || "-"}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        display="block"
                      >
                        例外: {rule.exceptions || "-"}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        display="block"
                      >
                        起源: {rule.origin || "-"}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        display="block"
                      >
                        影響: {rule.impact || "-"}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        display="block"
                      >
                        制限: {rule.limitations || "-"}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      ) : (
        <Box
          sx={{
            p: 3,
            border: "1px dashed #ccc",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography color="text.secondary">
            まだルールが作成されていません。「新しいルールを追加」ボタンから新しい項目を作成できます。
          </Typography>
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEditing ? "ルールの編集" : "新しいルール"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="ルール名"
            type="text"
            fullWidth
            variant="outlined"
            value={currentRule?.name || ""}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="概要"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={currentRule?.description || ""}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="exceptions"
            label="例外"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={currentRule?.exceptions || ""}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="origin"
            label="起源・根拠"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={currentRule?.origin || ""}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="impact"
            label="影響範囲・結果"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={currentRule?.impact || ""}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="limitations"
            label="制限事項"
            type="text"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={currentRule?.limitations || ""}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions sx={{ p: "16px 24px" }}>
          <Button onClick={handleCloseDialog} color="inherit">
            キャンセル
          </Button>
          <Button onClick={handleSaveRule} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RulesTab;

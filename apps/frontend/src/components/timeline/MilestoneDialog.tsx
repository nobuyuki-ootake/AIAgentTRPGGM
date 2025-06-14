import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";
import { 
  CampaignMilestone, 
  MilestoneRequirement,
  EnemyCharacter,
  QuestElement,
  Item,
  ExplorationAction,
  UnifiedEvent 
} from "@trpg-ai-gm/types";
import { v4 as uuidv4 } from "uuid";

interface MilestoneDialogProps {
  open: boolean;
  milestone?: CampaignMilestone;
  onClose: () => void;
  onSave: (milestone: CampaignMilestone) => void;
  availableQuests?: QuestElement[];
  availableEnemies?: EnemyCharacter[];
  availableItems?: Item[];
  timelineEvents?: UnifiedEvent[];
}

const MilestoneDialog: React.FC<MilestoneDialogProps> = ({
  open,
  milestone,
  onClose,
  onSave,
  availableQuests = [],
  availableEnemies = [],
  availableItems = [],
  timelineEvents = [],
}) => {
  const [formData, setFormData] = useState<CampaignMilestone>(() => ({
    id: uuidv4(),
    title: "",
    description: "",
    targetDay: 1,
    deadline: false,
    completionMode: "all",
    requirements: [],
    status: "pending",
    gmGuidance: {
      onTimeHints: [""],
      delayedHints: [""],
    },
    priority: "important",
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  useEffect(() => {
    if (milestone) {
      setFormData(milestone);
    } else {
      // 新規作成時の初期化
      setFormData({
        id: uuidv4(),
        title: "",
        description: "",
        targetDay: 1,
        deadline: false,
        completionMode: "all",
        requirements: [],
        status: "pending",
        gmGuidance: {
          onTimeHints: [""],
          delayedHints: [""],
        },
        priority: "important",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [milestone, open]);

  const handleSave = () => {
    const updatedMilestone = {
      ...formData,
      updatedAt: new Date(),
    };
    onSave(updatedMilestone);
    onClose();
  };

  const addRequirement = (type: MilestoneRequirement["type"]) => {
    const newRequirement: MilestoneRequirement = {
      type,
      description: "",
    };

    switch (type) {
      case "events":
        newRequirement.eventIds = [];
        break;
      case "quests":
        newRequirement.questIds = [];
        break;
      case "items":
        newRequirement.itemRequirements = [];
        break;
      case "enemies":
        newRequirement.enemyRequirements = [];
        break;
    }

    setFormData({
      ...formData,
      requirements: [...formData.requirements, newRequirement],
    });
  };

  const removeRequirement = (index: number) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      requirements: newRequirements,
    });
  };

  const updateRequirement = (index: number, updates: Partial<MilestoneRequirement>) => {
    const newRequirements = formData.requirements.map((req, i) =>
      i === index ? { ...req, ...updates } : req
    );
    setFormData({
      ...formData,
      requirements: newRequirements,
    });
  };

  const addGuidanceHint = (type: "onTimeHints" | "delayedHints") => {
    setFormData({
      ...formData,
      gmGuidance: {
        ...formData.gmGuidance,
        [type]: [...formData.gmGuidance[type], ""],
      },
    });
  };

  const updateGuidanceHint = (type: "onTimeHints" | "delayedHints", index: number, value: string) => {
    const newHints = formData.gmGuidance[type].map((hint, i) =>
      i === index ? value : hint
    );
    setFormData({
      ...formData,
      gmGuidance: {
        ...formData.gmGuidance,
        [type]: newHints,
      },
    });
  };

  const removeGuidanceHint = (type: "onTimeHints" | "delayedHints", index: number) => {
    const newHints = formData.gmGuidance[type].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      gmGuidance: {
        ...formData.gmGuidance,
        [type]: newHints,
      },
    });
  };

  // 探索行動プレビューを生成
  // TODO: この関数は将来的に探索行動プレビュー機能で使用予定
  const generateExplorationPreview = (): ExplorationAction[] => {
    const explorationActions: ExplorationAction[] = [];
    
    formData.requirements.forEach((requirement) => {
      switch (requirement.type) {
        case "events":
          requirement.eventIds?.forEach(eventId => {
            const event = timelineEvents?.find(e => e.id === eventId);
            if (event?.explorationActions) {
              explorationActions.push(...event.explorationActions);
            }
          });
          break;
          
        case "quests":
          requirement.questIds?.forEach(questId => {
            const quest = availableQuests?.find(q => q.id === questId);
            if (quest?.explorationActions) {
              explorationActions.push(...quest.explorationActions);
            }
          });
          break;
          
        case "enemies":
          requirement.enemyRequirements?.forEach(enemyReq => {
            const enemy = availableEnemies?.find(e => e.id === enemyReq.enemyId);
            if (enemy?.explorationActions) {
              explorationActions.push(...enemy.explorationActions);
            }
          });
          break;
      }
    });
    
    // 重複を除去してユニークな探索行動のみ返す
    return explorationActions.filter((action, index, self) => 
      self.findIndex(a => a.id === action.id) === index
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: "70vh" }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FlagIcon />
          {milestone ? "マイルストーン編集" : "マイルストーン作成"}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* 基本情報 */}
          <Box>
            <Typography variant="h6" gutterBottom>基本情報</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="タイトル"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
                required
              />
              
              <TextField
                label="説明"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="目標達成日"
                  type="number"
                  value={formData.targetDay}
                  onChange={(e) => setFormData({ ...formData, targetDay: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1 }}
                  sx={{ width: 150 }}
                />
                
                <FormControl sx={{ width: 150 }}>
                  <InputLabel>優先度</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <MenuItem value="optional">任意</MenuItem>
                    <MenuItem value="important">重要</MenuItem>
                    <MenuItem value="critical">最重要</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl sx={{ width: 150 }}>
                  <InputLabel>完了モード</InputLabel>
                  <Select
                    value={formData.completionMode}
                    onChange={(e) => setFormData({ ...formData, completionMode: e.target.value as any })}
                  >
                    <MenuItem value="all">全条件達成</MenuItem>
                    <MenuItem value="partial">部分達成</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      必須期限
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ONにすると遅延時にゲームオーバーになります
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>

          {/* 達成条件 */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6">達成条件</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addRequirement("quests")}
                >
                  クエスト
                </Button>
                <Button
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={() => addRequirement("enemies")}
                >
                  エネミー
                </Button>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addRequirement("items")}
                >
                  アイテム
                </Button>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addRequirement("events")}
                >
                  イベント
                </Button>
              </Box>
            </Box>
            
            {formData.requirements.length === 0 && (
              <Alert severity="info">
                達成条件を追加してください。上のボタンから条件タイプを選択できます。
              </Alert>
            )}
            
            <List>
              {formData.requirements.map((requirement, index) => (
                <ListItem key={index} sx={{ flexDirection: "column", alignItems: "stretch" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <Chip 
                      label={requirement.type} 
                      size="small" 
                      color="primary" 
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeRequirement(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <TextField
                    label="条件の説明"
                    value={requirement.description}
                    onChange={(e) => updateRequirement(index, { description: e.target.value })}
                    fullWidth
                    size="small"
                    sx={{ mt: 1 }}
                  />
                  {/* TODO: 各タイプ別の詳細設定UI */}
                  <Divider sx={{ mt: 2 }} />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* 探索行動プレビュー */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">探索行動プレビュー</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {formData.requirements.length > 0 ? (
                  <>
                    <Alert severity="info">
                      このマイルストーンに関連する探索行動の概要です。TRPGセッション画面の探索タブで実際の行動を選択できます。
                    </Alert>
                    
                    {/* プレビュー統計 */}
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Chip 
                        label={`総行動数: ${formData.requirements.length}件関連`} 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label="推定完了: 設定後計算" 
                        color="secondary" 
                        variant="outlined" 
                      />
                    </Box>
                    
                    {/* 要件別の行動例 */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        想定される探索行動:
                      </Typography>
                      <List dense>
                        {formData.requirements.map((req, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Chip 
                                    label={req.type} 
                                    size="small" 
                                    color="primary" 
                                  />
                                  {req.description || `${req.type}の達成が必要`}
                                </Box>
                              }
                              secondary="関連する探索行動が自動的に表示されます"
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </>
                ) : (
                  <Alert severity="warning">
                    達成条件を設定すると、関連する探索行動のプレビューが表示されます。
                  </Alert>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* GM向けガイダンス */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">GM向けガイダンス</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* 期限内達成時のヒント */}
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2">期限内達成時のヒント</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => addGuidanceHint("onTimeHints")}
                    >
                      追加
                    </Button>
                  </Box>
                  {formData.gmGuidance.onTimeHints.map((hint, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <TextField
                        value={hint}
                        onChange={(e) => updateGuidanceHint("onTimeHints", index, e.target.value)}
                        placeholder="期限内に達成した場合のGMアナウンス案"
                        fullWidth
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeGuidanceHint("onTimeHints", index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                {/* 遅延時のヒント */}
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle2">遅延時のヒント</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => addGuidanceHint("delayedHints")}
                    >
                      追加
                    </Button>
                  </Box>
                  {formData.gmGuidance.delayedHints.map((hint, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <TextField
                        value={hint}
                        onChange={(e) => updateGuidanceHint("delayedHints", index, e.target.value)}
                        placeholder="遅延した場合のGMアナウンス案"
                        fullWidth
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeGuidanceHint("delayedHints", index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>

                {/* 失敗時メッセージ（必須期限の場合のみ） */}
                {formData.deadline && (
                  <TextField
                    label="ゲームオーバー時メッセージ"
                    value={formData.gmGuidance.failureMessage || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      gmGuidance: {
                        ...formData.gmGuidance,
                        failureMessage: e.target.value,
                      },
                    })}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="必須期限を過ぎた場合のゲームオーバーメッセージ"
                  />
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={!formData.title.trim()}
        >
          {milestone ? "更新" : "作成"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MilestoneDialog;
// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore,
  CheckCircle,
  RadioButtonUnchecked,
  Star,
  Flag,
} from "@mui/icons-material";
import { useRecoilState } from "recoil";
import { currentCampaignState } from "../store/atoms";
import { TRPGCampaign, Quest, QuestStatus, NPCCharacter } from "@trpg-ai-gm/types";

interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  hidden: boolean; // プレイヤーに見えるかどうか
}

interface EnhancedQuest extends Quest {
  prerequisites: string[]; // 前提クエスト
  rewards: {
    experience: number;
    items: string[];
    gold: number;
    reputation?: string;
  };
  objectives: QuestObjective[];
  discoveryConditions: {
    npcId?: string;
    location?: string;
    itemRequired?: string;
    questboardAvailable: boolean;
  };
  timeLimit?: {
    days: number;
    consequences?: string;
  };
  difficulty: "easy" | "medium" | "hard" | "legendary";
}

const QuestPage: React.FC = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [quests, setQuests] = useState<EnhancedQuest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<EnhancedQuest | null>(null);
  const [questFilter, setQuestFilter] = useState<"all" | "available" | "active" | "completed">("all");

  // 新規クエストフォームデータ
  const [formData, setFormData] = useState<Partial<EnhancedQuest>>({
    title: "",
    description: "",
    status: "hidden",
    priority: "medium",
    giver: "",
    objectives: [],
    rewards: { experience: 0, items: [], gold: 0 },
    discoveryConditions: { questboardAvailable: false },
    difficulty: "medium",
  });

  // クエストの読み込み
  useEffect(() => {
    if (currentCampaign?.quests) {
      const enhancedQuests: EnhancedQuest[] = currentCampaign.quests.map(quest => ({
        ...quest,
        prerequisites: [],
        rewards: { experience: 100, items: [], gold: 50 },
        objectives: [],
        discoveryConditions: { questboardAvailable: true },
        difficulty: "medium" as const,
      }));
      setQuests(enhancedQuests);
    }
  }, [currentCampaign]);

  // クエストの保存
  const saveQuests = (updatedQuests: EnhancedQuest[]) => {
    if (!currentCampaign) return;

    const updatedCampaign: TRPGCampaign = {
      ...currentCampaign,
      quests: updatedQuests.map(quest => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        status: quest.status,
        priority: quest.priority,
        giver: quest.giver,
        rewards: quest.rewards,
        objectives: quest.objectives.map(obj => obj.description),
        notes: quest.notes || "",
      })),
      updatedAt: new Date(),
    };

    setCurrentCampaign(updatedCampaign);
    setQuests(updatedQuests);
  };

  // 新規クエスト作成
  const handleCreateQuest = () => {
    if (!formData.title || !formData.description) return;

    const newQuest: EnhancedQuest = {
      id: `quest-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      status: formData.status || "hidden",
      priority: formData.priority || "medium",
      giver: formData.giver || "",
      rewards: formData.rewards || { experience: 100, items: [], gold: 50 },
      objectives: formData.objectives || [],
      notes: "",
      prerequisites: [],
      discoveryConditions: formData.discoveryConditions || { questboardAvailable: true },
      difficulty: formData.difficulty || "medium",
    };

    const updatedQuests = [...quests, newQuest];
    saveQuests(updatedQuests);
    setDialogOpen(false);
    resetForm();
  };

  // クエスト更新
  const handleUpdateQuest = () => {
    if (!editingQuest || !formData.title || !formData.description) return;

    const updatedQuest: EnhancedQuest = {
      ...editingQuest,
      ...formData,
    } as EnhancedQuest;

    const updatedQuests = quests.map(q => q.id === editingQuest.id ? updatedQuest : q);
    saveQuests(updatedQuests);
    setDialogOpen(false);
    setEditingQuest(null);
    resetForm();
  };

  // クエスト削除
  const handleDeleteQuest = (questId: string) => {
    const updatedQuests = quests.filter(q => q.id !== questId);
    saveQuests(updatedQuests);
  };

  // クエスト状態変更
  const handleStatusChange = (questId: string, status: QuestStatus) => {
    const updatedQuests = quests.map(q =>
      q.id === questId ? { ...q, status } : q
    );
    saveQuests(updatedQuests);
  };

  // 目標の完了/未完了切り替え
  const toggleObjective = (questId: string, objectiveId: string) => {
    const updatedQuests = quests.map(q => {
      if (q.id === questId) {
        const updatedObjectives = q.objectives.map(obj =>
          obj.id === objectiveId ? { ...obj, completed: !obj.completed } : obj
        );
        return { ...q, objectives: updatedObjectives };
      }
      return q;
    });
    saveQuests(updatedQuests);
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "hidden",
      priority: "medium",
      giver: "",
      objectives: [],
      rewards: { experience: 100, items: [], gold: 50 },
      discoveryConditions: { questboardAvailable: false },
      difficulty: "medium",
    });
  };

  // 編集ダイアログを開く
  const openEditDialog = (quest: EnhancedQuest) => {
    setEditingQuest(quest);
    setFormData(quest);
    setDialogOpen(true);
  };

  // フィルター済みクエスト
  const filteredQuests = quests.filter(quest => {
    if (questFilter === "all") return true;
    if (questFilter === "available") return quest.status === "available" || quest.status === "hidden";
    if (questFilter === "active") return quest.status === "active";
    if (questFilter === "completed") return quest.status === "completed";
    return true;
  });

  // ステータス色の取得
  const getStatusColor = (status: QuestStatus) => {
    switch (status) {
      case "hidden": return "default";
      case "available": return "primary";
      case "active": return "warning";
      case "completed": return "success";
      default: return "default";
    }
  };

  // 難易度色の取得
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "success";
      case "medium": return "warning";
      case "hard": return "error";
      case "legendary": return "secondary";
      default: return "default";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          クエスト管理
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          TRPGキャンペーンのクエストを作成・管理できます。NPCとの対話やクエストボードでの発見条件も設定できます。
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetForm();
              setEditingQuest(null);
              setDialogOpen(true);
            }}
          >
            新規クエスト作成
          </Button>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>フィルター</InputLabel>
            <Select
              value={questFilter}
              label="フィルター"
              onChange={(e) => setQuestFilter(e.target.value as any)}
            >
              <MenuItem value="all">すべて</MenuItem>
              <MenuItem value="available">利用可能</MenuItem>
              <MenuItem value="active">進行中</MenuItem>
              <MenuItem value="completed">完了</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* クエスト一覧 */}
      <Grid container spacing={3}>
        {filteredQuests.map((quest) => (
          <Grid size={{ xs: 12, md: 6 }} key={quest.id}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {quest.title}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Chip
                      label={quest.status}
                      size="small"
                      color={getStatusColor(quest.status)}
                    />
                    <Chip
                      label={quest.difficulty}
                      size="small"
                      color={getDifficultyColor(quest.difficulty)}
                      variant="outlined"
                    />
                    {quest.priority === "high" && (
                      <Chip icon={<Flag />} label="高優先度" size="small" color="error" />
                    )}
                  </Stack>
                </Box>
                <Box>
                  <IconButton size="small" onClick={() => openEditDialog(quest)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteQuest(quest.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {quest.description}
              </Typography>

              {quest.giver && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>クエスト発行者:</strong> {quest.giver}
                </Typography>
              )}

              {/* 報酬表示 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>報酬:</strong>
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={`EXP: ${quest.rewards.experience}`} size="small" />
                  <Chip label={`ゴールド: ${quest.rewards.gold}`} size="small" />
                  {quest.rewards.items.length > 0 && (
                    <Chip label={`アイテム: ${quest.rewards.items.length}個`} size="small" />
                  )}
                </Stack>
              </Box>

              {/* 目標一覧 */}
              {quest.objectives.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="body2">
                      目標 ({quest.objectives.filter(obj => obj.completed).length}/{quest.objectives.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {quest.objectives.map((objective) => (
                        <ListItem key={objective.id} sx={{ pl: 0 }}>
                          <IconButton
                            size="small"
                            onClick={() => toggleObjective(quest.id, objective.id)}
                          >
                            {objective.completed ? (
                              <CheckCircle color="success" />
                            ) : (
                              <RadioButtonUnchecked />
                            )}
                          </IconButton>
                          <ListItemText
                            primary={objective.description}
                            sx={{
                              textDecoration: objective.completed ? "line-through" : "none",
                              opacity: objective.completed ? 0.7 : 1,
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* ステータス変更ボタン */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  ステータス変更:
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant={quest.status === "available" ? "contained" : "outlined"}
                    onClick={() => handleStatusChange(quest.id, "available")}
                  >
                    利用可能
                  </Button>
                  <Button
                    size="small"
                    variant={quest.status === "active" ? "contained" : "outlined"}
                    onClick={() => handleStatusChange(quest.id, "active")}
                  >
                    進行中
                  </Button>
                  <Button
                    size="small"
                    variant={quest.status === "completed" ? "contained" : "outlined"}
                    onClick={() => handleStatusChange(quest.id, "completed")}
                  >
                    完了
                  </Button>
                </Stack>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {filteredQuests.length === 0 && (
        <Alert severity="info" sx={{ mt: 4 }}>
          {questFilter === "all" 
            ? "まだクエストが作成されていません。新規作成ボタンからクエストを追加してください。"
            : `${questFilter === "available" ? "利用可能な" : questFilter === "active" ? "進行中の" : "完了した"}クエストがありません。`
          }
        </Alert>
      )}

      {/* クエスト作成/編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuest ? "クエスト編集" : "新規クエスト作成"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="クエストタイトル"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="クエスト説明"
              multiline
              rows={3}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>初期ステータス</InputLabel>
                  <Select
                    value={formData.status || "hidden"}
                    label="初期ステータス"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as QuestStatus })}
                  >
                    <MenuItem value="hidden">非表示</MenuItem>
                    <MenuItem value="available">利用可能</MenuItem>
                    <MenuItem value="active">進行中</MenuItem>
                    <MenuItem value="completed">完了</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>難易度</InputLabel>
                  <Select
                    value={formData.difficulty || "medium"}
                    label="難易度"
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                  >
                    <MenuItem value="easy">簡単</MenuItem>
                    <MenuItem value="medium">普通</MenuItem>
                    <MenuItem value="hard">困難</MenuItem>
                    <MenuItem value="legendary">伝説</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="クエスト発行者 (NPC名)"
              value={formData.giver || ""}
              onChange={(e) => setFormData({ ...formData, giver: e.target.value })}
              helperText="このクエストを提供するNPCの名前"
            />

            {/* 報酬設定 */}
            <Typography variant="h6">報酬設定</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  label="経験値"
                  type="number"
                  value={formData.rewards?.experience || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    rewards: { ...formData.rewards!, experience: parseInt(e.target.value) || 0 }
                  })}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  label="ゴールド"
                  type="number"
                  value={formData.rewards?.gold || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    rewards: { ...formData.rewards!, gold: parseInt(e.target.value) || 0 }
                  })}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  label="アイテム (カンマ区切り)"
                  value={formData.rewards?.items?.join(", ") || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    rewards: { 
                      ...formData.rewards!, 
                      items: e.target.value.split(",").map(item => item.trim()).filter(item => item)
                    }
                  })}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>キャンセル</Button>
          <Button 
            variant="contained" 
            onClick={editingQuest ? handleUpdateQuest : handleCreateQuest}
            disabled={!formData.title || !formData.description}
          >
            {editingQuest ? "更新" : "作成"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuestPage;
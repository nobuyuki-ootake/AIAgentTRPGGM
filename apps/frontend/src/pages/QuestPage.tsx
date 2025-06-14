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
import { TRPGCampaign, QuestElement, QuestObjective, NPCCharacter } from "@trpg-ai-gm/types";

// QuestObjective型は既にpackages/types/index.tsで定義済み
// EnhancedQuest型は削除 - QuestElementを直接使用

const QuestPage: React.FC = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [quests, setQuests] = useState<QuestElement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestElement | null>(null);
  const [questFilter, setQuestFilter] = useState<"all" | "available" | "active" | "completed">("all");

  // 新規クエストフォームデータ
  const [formData, setFormData] = useState<Partial<QuestElement>>({
    title: "",
    description: "",
    status: "未開始",
    questType: "サブ",
    difficulty: 2, // 1=簡単, 5=非常に困難
    order: 0,
    priority: "medium",
    giver: "",
    notes: "",
    objectives: [],
    detailedRewards: { experience: 0, items: [], gold: 0 },
    discoveryConditions: { questboardAvailable: false },
    prerequisites: [],
  });

  // クエストの読み込み
  useEffect(() => {
    if (currentCampaign?.quests) {
      // QuestElementのオプション属性にデフォルト値を設定
      const questsWithDefaults: QuestElement[] = currentCampaign.quests.map((quest: QuestElement) => ({
        ...quest,
        prerequisites: quest.prerequisites || [],
        objectives: quest.objectives || [],
        detailedRewards: quest.detailedRewards || { 
          experience: 100, 
          items: [], 
          gold: 50
        },
        discoveryConditions: quest.discoveryConditions || { 
          questboardAvailable: true
        },
        priority: quest.priority || "medium",
        giver: quest.giver || "",
        notes: quest.notes || "",
      }));
      setQuests(questsWithDefaults);
    }
  }, [currentCampaign]);

  // クエストの保存
  const saveQuests = (updatedQuests: QuestElement[]) => {
    if (!currentCampaign) return;

    const updatedCampaign: TRPGCampaign = {
      ...currentCampaign,
      quests: updatedQuests, // QuestElementをそのまま保存
      updatedAt: new Date(),
    };

    setCurrentCampaign(updatedCampaign);
    setQuests(updatedQuests);
  };

  // 新規クエスト作成
  const handleCreateQuest = () => {
    if (!formData.title || !formData.description) return;

    const newQuest: QuestElement = {
      id: `quest-${Date.now()}`,
      title: formData.title || "",
      description: formData.description || "",
      order: quests.length,
      status: formData.status || "未開始",
      questType: formData.questType || "サブ",
      difficulty: formData.difficulty || 2,
      rewards: [],
      prerequisites: formData.prerequisites || [],
      sessionId: undefined,
      relatedCharacterIds: [],
      relatedPlaceIds: [],
      // QuestElement拡張プロパティ
      objectives: formData.objectives || [],
      detailedRewards: formData.detailedRewards || { experience: 100, items: [], gold: 50 },
      discoveryConditions: formData.discoveryConditions || { questboardAvailable: true },
      priority: formData.priority || "medium",
      giver: formData.giver || "",
      notes: formData.notes || "",
    };

    const updatedQuests = [...quests, newQuest];
    saveQuests(updatedQuests);
    setDialogOpen(false);
    resetForm();
  };

  // クエスト更新
  const handleUpdateQuest = () => {
    if (!editingQuest || !formData.title || !formData.description) return;

    const updatedQuest: QuestElement = {
      ...editingQuest,
      ...formData,
    } as QuestElement;

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
  const handleStatusChange = (questId: string, status: QuestElement['status']) => {
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
      status: "未開始",
      questType: "サブ",
      difficulty: 2,
      order: 0,
      priority: "medium",
      giver: "",
      notes: "",
      objectives: [],
      detailedRewards: { experience: 100, items: [], gold: 50 },
      discoveryConditions: { questboardAvailable: false },
      prerequisites: [],
    });
  };

  // 編集ダイアログを開く
  const openEditDialog = (quest: QuestElement) => {
    setEditingQuest(quest);
    setFormData(quest);
    setDialogOpen(true);
  };

  // フィルター済みクエスト
  const filteredQuests = quests.filter(quest => {
    if (questFilter === "all") return true;
    if (questFilter === "available") return quest.status === "未開始";
    if (questFilter === "active") return quest.status === "進行中";
    if (questFilter === "completed") return quest.status === "完了";
    return true;
  });

  // ステータス色の取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case "未開始": return "default";
      case "進行中": return "warning";
      case "完了": return "success";
      case "失敗": return "error";
      case "保留": return "info";
      default: return "default";
    }
  };

  // 難易度色の取得
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return "success"; // 簡単
      case 2: return "info";    // 普通
      case 3: return "warning"; // 中程度
      case 4: return "error";   // 困難
      case 5: return "secondary"; // 非常に困難
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
                  <Chip label={`EXP: ${quest.detailedRewards.experience}`} size="small" />
                  <Chip label={`ゴールド: ${quest.detailedRewards.gold}`} size="small" />
                  {quest.detailedRewards.items.length > 0 && (
                    <Chip label={`アイテム: ${quest.detailedRewards.items.length}個`} size="small" />
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
                    variant={quest.status === "未開始" ? "contained" : "outlined"}
                    onClick={() => handleStatusChange(quest.id, "未開始")}
                  >
                    利用可能
                  </Button>
                  <Button
                    size="small"
                    variant={quest.status === "進行中" ? "contained" : "outlined"}
                    onClick={() => handleStatusChange(quest.id, "進行中")}
                  >
                    進行中
                  </Button>
                  <Button
                    size="small"
                    variant={quest.status === "完了" ? "contained" : "outlined"}
                    onClick={() => handleStatusChange(quest.id, "完了")}
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
                    value={formData.status || "未開始"}
                    label="初期ステータス"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <MenuItem value="未開始">未開始</MenuItem>
                    <MenuItem value="進行中">進行中</MenuItem>
                    <MenuItem value="完了">完了</MenuItem>
                    <MenuItem value="失敗">失敗</MenuItem>
                    <MenuItem value="保留">保留</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>難易度</InputLabel>
                  <Select
                    value={formData.difficulty || 2}
                    label="難易度"
                    onChange={(e) => setFormData({ ...formData, difficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                  >
                    <MenuItem value={1}>簡単 (1)</MenuItem>
                    <MenuItem value={2}>普通 (2)</MenuItem>
                    <MenuItem value={3}>中程度 (3)</MenuItem>
                    <MenuItem value={4}>困難 (4)</MenuItem>
                    <MenuItem value={5}>非常に困難 (5)</MenuItem>
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
                  value={formData.detailedRewards?.experience || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    detailedRewards: { ...formData.detailedRewards!, experience: parseInt(e.target.value) || 0 }
                  })}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  label="ゴールド"
                  type="number"
                  value={formData.detailedRewards?.gold || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    detailedRewards: { ...formData.detailedRewards!, gold: parseInt(e.target.value) || 0 }
                  })}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <TextField
                  fullWidth
                  label="アイテム (カンマ区切り)"
                  value={formData.detailedRewards?.items?.join(", ") || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    detailedRewards: { 
                      ...formData.detailedRewards!, 
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
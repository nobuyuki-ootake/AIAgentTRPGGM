import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Collapse,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
} from "@mui/material";
import {
  Assignment as QuestIcon,
  CheckCircle,
  RadioButtonUnchecked,
  ExpandMore,
  ExpandLess,
  Visibility,
  Star,
  Timer,
  Flag,
  Info,
} from "@mui/icons-material";
import { EnhancedQuest } from "../../pages/QuestPage";

interface QuestTrackerUIProps {
  activeQuests: EnhancedQuest[];
  onQuestComplete: (questId: string) => void;
  onObjectiveToggle: (questId: string, objectiveId: string) => void;
  onQuestAbandon: (questId: string) => void;
  compact?: boolean;
}

const QuestTrackerUI: React.FC<QuestTrackerUIProps> = ({
  activeQuests,
  onQuestComplete,
  onObjectiveToggle,
  onQuestAbandon,
  compact = false,
}) => {
  const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());
  const [selectedQuest, setSelectedQuest] = useState<EnhancedQuest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // クエスト展開/折りたたみ
  const toggleQuestExpansion = (questId: string) => {
    const newExpanded = new Set(expandedQuests);
    if (newExpanded.has(questId)) {
      newExpanded.delete(questId);
    } else {
      newExpanded.add(questId);
    }
    setExpandedQuests(newExpanded);
  };

  // クエスト詳細表示
  const showQuestDetail = (quest: EnhancedQuest) => {
    setSelectedQuest(quest);
    setDetailDialogOpen(true);
  };

  // クエスト進行度計算
  const getQuestProgress = (quest: EnhancedQuest) => {
    if (quest.objectives.length === 0) return 0;
    const completedCount = quest.objectives.filter(obj => obj.completed).length;
    return (completedCount / quest.objectives.length) * 100;
  };

  // 優先度アイコン
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <Flag color="error" fontSize="small" />;
      case "medium":
        return <Star color="warning" fontSize="small" />;
      default:
        return null;
    }
  };

  // ステータス色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "warning";
      case "completed": return "success";
      case "available": return "primary";
      default: return "default";
    }
  };

  // 時間制限警告
  const getTimeWarning = (quest: EnhancedQuest) => {
    if (!quest.timeLimit) return null;
    
    // 簡単な例: 残り時間が少ない場合の警告
    // 実際のゲームでは現在時刻とクエスト開始時刻を比較
    const remainingDays = quest.timeLimit.days;
    if (remainingDays <= 1) {
      return "error";
    } else if (remainingDays <= 3) {
      return "warning";
    }
    return null;
  };

  if (activeQuests.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          進行中のクエストはありません
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        進行中のクエスト ({activeQuests.length})
      </Typography>

      <List>
        {activeQuests.map((quest) => {
          const progress = getQuestProgress(quest);
          const timeWarning = getTimeWarning(quest);
          const isExpanded = expandedQuests.has(quest.id);

          return (
            <Paper key={quest.id} sx={{ mb: 2, overflow: "hidden" }}>
              <ListItem
                sx={{
                  flexDirection: "column",
                  alignItems: "stretch",
                  pb: 1,
                }}
              >
                {/* クエストヘッダー */}
                <Box sx={{ display: "flex", alignItems: "center", width: "100%", mb: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <QuestIcon color="primary" />
                  </ListItemIcon>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {quest.title}
                      </Typography>
                      {getPriorityIcon(quest.priority)}
                      {timeWarning && (
                        <Timer color={timeWarning as any} fontSize="small" />
                      )}
                    </Box>
                    
                    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <Chip
                        label={quest.status}
                        size="small"
                        color={getStatusColor(quest.status)}
                      />
                      <Chip
                        label={quest.difficulty}
                        size="small"
                        variant="outlined"
                      />
                      {quest.giver && (
                        <Chip
                          label={`依頼者: ${quest.giver}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => showQuestDetail(quest)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => toggleQuestExpansion(quest.id)}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                </Box>

                {/* 進行度バー */}
                {quest.objectives.length > 0 && (
                  <Box sx={{ width: "100%", mb: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2">
                        進行度: {quest.objectives.filter(obj => obj.completed).length}/{quest.objectives.length}
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={progress === 100 ? "success" : "primary"}
                    />
                  </Box>
                )}

                {/* 時間制限警告 */}
                {quest.timeLimit && timeWarning && (
                  <Alert severity={timeWarning as any} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      残り時間: {quest.timeLimit.days}日
                      {quest.timeLimit.consequences && (
                        <>
                          <br />
                          失敗時: {quest.timeLimit.consequences}
                        </>
                      )}
                    </Typography>
                  </Alert>
                )}

                {/* 展開可能な詳細情報 */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {quest.description}
                    </Typography>

                    {/* 目標一覧 */}
                    {quest.objectives.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          目標:
                        </Typography>
                        <List dense>
                          {quest.objectives.map((objective) => (
                            <ListItem
                              key={objective.id}
                              sx={{ py: 0.25 }}
                              secondaryAction={
                                <IconButton
                                  size="small"
                                  onClick={() => onObjectiveToggle(quest.id, objective.id)}
                                >
                                  {objective.completed ? (
                                    <CheckCircle color="success" />
                                  ) : (
                                    <RadioButtonUnchecked />
                                  )}
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={objective.description}
                                primaryTypographyProps={{
                                  variant: "body2",
                                  sx: {
                                    textDecoration: objective.completed ? "line-through" : "none",
                                    opacity: objective.completed ? 0.7 : 1,
                                  },
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* アクションボタン */}
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                      {progress === 100 && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          onClick={() => onQuestComplete(quest.id)}
                        >
                          完了する
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => onQuestAbandon(quest.id)}
                      >
                        破棄
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </ListItem>
            </Paper>
          );
        })}
      </List>

      {/* クエスト詳細ダイアログ */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedQuest && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <QuestIcon />
                <Typography variant="h6">{selectedQuest.title}</Typography>
                {getPriorityIcon(selectedQuest.priority)}
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedQuest.description}
              </Typography>

              <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
                <Chip label={selectedQuest.difficulty} color="primary" />
                <Chip label={`経験値: ${selectedQuest.rewards.experience}`} variant="outlined" />
                <Chip label={`ゴールド: ${selectedQuest.rewards.gold}`} variant="outlined" />
              </Box>

              {selectedQuest.giver && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>依頼者:</strong> {selectedQuest.giver}
                </Typography>
              )}

              {selectedQuest.rewards.items.length > 0 && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>報酬アイテム:</strong> {selectedQuest.rewards.items.join(", ")}
                </Typography>
              )}

              {selectedQuest.prerequisites.length > 0 && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>前提条件:</strong> {selectedQuest.prerequisites.join(", ")}
                </Typography>
              )}

              {selectedQuest.timeLimit && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>制限時間:</strong> {selectedQuest.timeLimit.days}日
                    {selectedQuest.timeLimit.consequences && (
                      <>
                        <br />
                        <strong>失敗時:</strong> {selectedQuest.timeLimit.consequences}
                      </>
                    )}
                  </Typography>
                </Alert>
              )}

              {selectedQuest.objectives.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    目標一覧
                  </Typography>
                  <List>
                    {selectedQuest.objectives.map((objective) => (
                      <ListItem key={objective.id}>
                        <ListItemIcon>
                          {objective.completed ? (
                            <CheckCircle color="success" />
                          ) : (
                            <RadioButtonUnchecked />
                          )}
                        </ListItemIcon>
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
                </>
              )}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                閉じる
              </Button>
              {getQuestProgress(selectedQuest) === 100 && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    onQuestComplete(selectedQuest.id);
                    setDetailDialogOpen(false);
                  }}
                >
                  完了する
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default QuestTrackerUI;
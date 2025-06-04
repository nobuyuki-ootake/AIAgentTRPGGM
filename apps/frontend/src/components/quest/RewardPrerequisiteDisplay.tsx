import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";
import {
  EmojiEvents as RewardIcon,
  Assignment as QuestIcon,
  Person as CharacterIcon,
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
  Star as ExperienceIcon,
  MonetizationOn as GoldIcon,
  Inventory as ItemIcon,
  TrendingUp as ReputationIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as UncompletedIcon,
  Warning as WarningIcon,
  Lock as LockedIcon,
  LockOpen as UnlockedIcon,
  ExpandMore,
  Info as InfoIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

interface QuestReward {
  type: "experience" | "gold" | "item" | "reputation" | "skill_point" | "special";
  name: string;
  amount?: number;
  description?: string;
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  icon?: React.ReactElement;
}

interface QuestPrerequisite {
  type: "level" | "quest" | "item" | "skill" | "reputation" | "location" | "character" | "time";
  name: string;
  requirement: string | number;
  description?: string;
  completed: boolean;
  optional?: boolean;
  icon?: React.ReactElement;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: "main" | "side" | "daily" | "hidden";
  difficulty: "easy" | "normal" | "hard" | "extreme";
  estimatedTime: string;
  prerequisites: QuestPrerequisite[];
  rewards: QuestReward[];
  status: "available" | "locked" | "in_progress" | "completed" | "failed";
  completionRate?: number;
}

interface RewardPrerequisiteDisplayProps {
  quest: Quest;
  showDetailed?: boolean;
  compact?: boolean;
  onPrerequisiteClick?: (prerequisite: QuestPrerequisite) => void;
  onRewardClick?: (reward: QuestReward) => void;
}

const RewardPrerequisiteDisplay: React.FC<RewardPrerequisiteDisplayProps> = ({
  quest,
  showDetailed = true,
  compact = false,
  onPrerequisiteClick,
  onRewardClick,
}) => {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: "reward" | "prerequisite";
    item: QuestReward | QuestPrerequisite;
  } | null>(null);

  // 前提条件の充足率計算
  const prerequisiteProgress = () => {
    const total = quest.prerequisites.length;
    const completed = quest.prerequisites.filter(p => p.completed).length;
    return total > 0 ? (completed / total) * 100 : 100;
  };

  // 必須前提条件の充足率
  const requiredPrerequisiteProgress = () => {
    const required = quest.prerequisites.filter(p => !p.optional);
    const total = required.length;
    const completed = required.filter(p => p.completed).length;
    return total > 0 ? (completed / total) * 100 : 100;
  };

  // レアリティの色
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case "common": return "default";
      case "uncommon": return "success";
      case "rare": return "info";
      case "epic": return "secondary";
      case "legendary": return "warning";
      default: return "default";
    }
  };

  // 難易度の色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "success";
      case "normal": return "info";
      case "hard": return "warning";
      case "extreme": return "error";
      default: return "default";
    }
  };

  // 前提条件アイコンの取得
  const getPrerequisiteIcon = (type: string) => {
    switch (type) {
      case "level": return <TrendingUp />;
      case "quest": return <QuestIcon />;
      case "item": return <ItemIcon />;
      case "skill": return <Star />;
      case "reputation": return <ReputationIcon />;
      case "location": return <LocationIcon />;
      case "character": return <CharacterIcon />;
      case "time": return <TimeIcon />;
      default: return <InfoIcon />;
    }
  };

  // 報酬アイコンの取得
  const getRewardIcon = (type: string) => {
    switch (type) {
      case "experience": return <ExperienceIcon />;
      case "gold": return <GoldIcon />;
      case "item": return <ItemIcon />;
      case "reputation": return <ReputationIcon />;
      case "skill_point": return <Star />;
      case "special": return <RewardIcon />;
      default: return <RewardIcon />;
    }
  };

  // 詳細表示のクリック処理
  const handleItemClick = (type: "reward" | "prerequisite", item: QuestReward | QuestPrerequisite) => {
    setSelectedItem({ type, item });
    setDetailDialogOpen(true);
  };

  if (compact) {
    return (
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        {/* 簡易前提条件表示 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {quest.status === "locked" ? <LockedIcon color="error" /> : <UnlockedIcon color="success" />}
          <Typography variant="body2" color="text.secondary">
            前提条件: {quest.prerequisites.filter(p => p.completed).length}/{quest.prerequisites.length}
          </Typography>
        </Box>

        {/* 簡易報酬表示 */}
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {quest.rewards.slice(0, 3).map((reward, index) => (
            <Chip
              key={index}
              icon={getRewardIcon(reward.type)}
              label={reward.amount ? `${reward.amount}` : reward.name}
              size="small"
              variant="outlined"
              color={getRarityColor(reward.rarity)}
            />
          ))}
          {quest.rewards.length > 3 && (
            <Chip label={`+${quest.rewards.length - 3}`} size="small" variant="outlined" />
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* クエスト基本情報 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {quest.title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
              <Chip label={quest.type} size="small" />
              <Chip 
                label={quest.difficulty} 
                size="small" 
                color={getDifficultyColor(quest.difficulty)} 
              />
              <Chip label={quest.estimatedTime} size="small" variant="outlined" />
            </Box>
          </Box>
          <Chip
            icon={quest.status === "locked" ? <LockedIcon /> : 
                  quest.status === "completed" ? <CompletedIcon /> : 
                  quest.status === "available" ? <UnlockedIcon /> : <InfoIcon />}
            label={quest.status === "locked" ? "条件未達成" :
                   quest.status === "completed" ? "完了" :
                   quest.status === "available" ? "受注可能" :
                   quest.status === "in_progress" ? "進行中" : "失敗"}
            color={quest.status === "locked" ? "error" :
                   quest.status === "completed" ? "success" :
                   quest.status === "available" ? "info" : "warning"}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {quest.description}
        </Typography>

        {quest.status === "in_progress" && quest.completionRate !== undefined && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              進行状況: {quest.completionRate}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={quest.completionRate}
              color="info"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </Paper>

      <Grid container spacing={2}>
        {/* 前提条件セクション */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "fit-content" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <WarningIcon sx={{ mr: 1 }} />
              <Typography variant="h6">前提条件</Typography>
              {quest.status === "locked" && (
                <Chip label="未達成" color="error" size="small" sx={{ ml: 1 }} />
              )}
            </Box>

            {quest.prerequisites.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  必須条件達成率: {Math.round(requiredPrerequisiteProgress())}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={requiredPrerequisiteProgress()}
                  color={requiredPrerequisiteProgress() === 100 ? "success" : "warning"}
                  sx={{ height: 6, borderRadius: 3, mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  全体: {Math.round(prerequisiteProgress())}% 
                  ({quest.prerequisites.filter(p => p.completed).length}/{quest.prerequisites.length})
                </Typography>
              </Box>
            )}

            <List dense>
              {quest.prerequisites.map((prerequisite, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    cursor: onPrerequisiteClick ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (onPrerequisiteClick) onPrerequisiteClick(prerequisite);
                    if (showDetailed) handleItemClick("prerequisite", prerequisite);
                  }}
                >
                  <ListItemIcon>
                    {prerequisite.completed ? (
                      <CompletedIcon color="success" />
                    ) : (
                      <UncompletedIcon color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getPrerequisiteIcon(prerequisite.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2">
                          {prerequisite.name}
                        </Typography>
                        {prerequisite.optional && (
                          <Chip label="任意" size="small" variant="outlined" color="info" />
                        )}
                      </Box>
                    }
                    secondary={prerequisite.description || `要求: ${prerequisite.requirement}`}
                  />
                  {showDetailed && (
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  )}
                </ListItem>
              ))}
            </List>

            {quest.prerequisites.length === 0 && (
              <Alert severity="success">
                前提条件はありません。すぐに開始できます。
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* 報酬セクション */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "fit-content" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <RewardIcon sx={{ mr: 1 }} />
              <Typography variant="h6">報酬</Typography>
            </Box>

            <List dense>
              {quest.rewards.map((reward, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    cursor: onRewardClick ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (onRewardClick) onRewardClick(reward);
                    if (showDetailed) handleItemClick("reward", reward);
                  }}
                >
                  <ListItemIcon>
                    {getRewardIcon(reward.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2">
                          {reward.name}
                        </Typography>
                        {reward.amount && (
                          <Chip 
                            label={reward.amount.toLocaleString()} 
                            size="small" 
                            color="primary" 
                          />
                        )}
                        {reward.rarity && reward.rarity !== "common" && (
                          <Chip
                            label={reward.rarity}
                            size="small"
                            color={getRarityColor(reward.rarity)}
                          />
                        )}
                      </Box>
                    }
                    secondary={reward.description}
                  />
                  {showDetailed && (
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  )}
                </ListItem>
              ))}
            </List>

            {quest.rewards.length === 0 && (
              <Alert severity="info">
                特別な報酬はありません。
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 詳細ダイアログ */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        {selectedItem && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {selectedItem.type === "reward" 
                  ? getRewardIcon((selectedItem.item as QuestReward).type)
                  : getPrerequisiteIcon((selectedItem.item as QuestPrerequisite).type)
                }
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {selectedItem.item.name}
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              {selectedItem.type === "reward" ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedItem.item.description || "この報酬の詳細説明はありません。"}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">種類</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(selectedItem.item as QuestReward).type}
                      </Typography>
                    </Grid>
                    
                    {(selectedItem.item as QuestReward).amount && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">数量</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(selectedItem.item as QuestReward).amount?.toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                    
                    {(selectedItem.item as QuestReward).rarity && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">レアリティ</Typography>
                        <Chip
                          label={(selectedItem.item as QuestReward).rarity}
                          size="small"
                          color={getRarityColor((selectedItem.item as QuestReward).rarity)}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedItem.item.description || "この前提条件の詳細説明はありません。"}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">種類</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(selectedItem.item as QuestPrerequisite).type}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">要求内容</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(selectedItem.item as QuestPrerequisite).requirement}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">状態</Typography>
                      <Chip
                        icon={(selectedItem.item as QuestPrerequisite).completed 
                          ? <CompletedIcon /> 
                          : <UncompletedIcon />
                        }
                        label={(selectedItem.item as QuestPrerequisite).completed ? "達成済み" : "未達成"}
                        color={(selectedItem.item as QuestPrerequisite).completed ? "success" : "error"}
                        size="small"
                      />
                    </Grid>
                    
                    {(selectedItem.item as QuestPrerequisite).optional && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2">重要度</Typography>
                        <Chip label="任意条件" color="info" size="small" />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                閉じる
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RewardPrerequisiteDisplay;
import React, { useState } from "react";
import {
  Box,
  Tooltip,
  IconButton,
  Popover,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Button,
} from "@mui/material";
import {
  Flag,
  FlagCircle,
  Edit,
  CheckCircle,
  Warning,
  AccessTime,
  OutlinedFlag,
} from "@mui/icons-material";
import { CampaignMilestone, MilestoneProgress } from "@trpg-ai-gm/types";

interface MilestoneIndicatorProps {
  milestone: CampaignMilestone;
  day: number;
  currentDay: number;
  progress?: MilestoneProgress;
  onEdit?: (milestone: CampaignMilestone) => void;
  size?: "small" | "medium" | "large";
}

// マイルストーンの色を決定
const getMilestoneColor = (milestone: CampaignMilestone, currentDay: number) => {
  if (milestone.status === "completed") return "#4CAF50"; // 緑
  if (milestone.status === "failed") return "#F44336";    // 赤
  if (milestone.status === "overdue") return "#FF5722";   // 深いオレンジ
  
  // 期限が近い場合の警告色
  const daysUntilTarget = milestone.targetDay - currentDay;
  if (daysUntilTarget <= 0 && milestone.deadline) return "#D32F2F"; // 濃い赤
  if (daysUntilTarget <= 1) return "#FF9800"; // オレンジ
  
  // 優先度による色
  switch (milestone.priority) {
    case "critical": return "#E91E63"; // ピンク
    case "important": return "#2196F3"; // 青
    case "optional": return "#9E9E9E";  // グレー
    default: return "#2196F3";
  }
};

// アイコンの決定（旗印ベース）
const getMilestoneIcon = (milestone: CampaignMilestone, currentDay: number) => {
  if (milestone.status === "completed") return CheckCircle;
  if (milestone.status === "failed" || milestone.status === "overdue") return Warning;
  if (currentDay >= milestone.targetDay && milestone.deadline) return Warning;
  // 基本的に旗印を使用
  return Flag;
};

// サイズの決定
const getIndicatorSize = (size?: string, isTarget?: boolean) => {
  const baseSize = size === "large" ? 32 : size === "medium" ? 24 : 16;
  return isTarget ? baseSize + 8 : baseSize; // targetDayは少し大きく
};

export const MilestoneIndicator: React.FC<MilestoneIndicatorProps> = ({
  milestone,
  day,
  currentDay,
  progress,
  onEdit,
  size = "medium",
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isTarget = day === milestone.targetDay;
  const color = getMilestoneColor(milestone, currentDay);
  const IconComponent = getMilestoneIcon(milestone, currentDay);
  const indicatorSize = getIndicatorSize(size, isTarget);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(milestone);
    }
    handleClose();
  };

  const open = Boolean(anchorEl);

  // ツールチップの内容
  const tooltipTitle = (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
        {milestone.title}
      </Typography>
      <Typography variant="caption" display="block">
        {isTarget ? "目標日" : `目標: ${milestone.targetDay}日目`}
      </Typography>
      {milestone.deadline && (
        <Typography variant="caption" color="warning.main" display="block">
          ⚠️ 必須期限
        </Typography>
      )}
    </Box>
  );

  return (
    <>
      <Tooltip title={tooltipTitle} arrow placement="top">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            width: indicatorSize,
            height: indicatorSize,
            color: color,
            backgroundColor: milestone.status === "completed" ? `${color}20` : `${color}10`,
            border: `2px solid ${color}`,
            borderStyle: milestone.deadline ? "solid" : "dashed",
            borderRadius: isTarget ? "8px" : "50%", // targetDayは角丸四角、その他は丸
            "&:hover": {
              backgroundColor: `${color}30`,
              transform: "scale(1.15)",
              boxShadow: `0 4px 8px ${color}40`,
            },
            transition: "all 0.2s ease-in-out",
            // 旗印用の追加スタイル
            position: "relative",
            "&::before": isTarget ? {
              content: '""',
              position: "absolute",
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              backgroundColor: color,
              borderRadius: "50%",
            } : {},
          }}
        >
          <IconComponent sx={{ 
            fontSize: indicatorSize * 0.8,
            filter: `drop-shadow(1px 1px 2px ${color}40)`,
          }} />
        </IconButton>
      </Tooltip>

      {/* 詳細ポップオーバー */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Paper sx={{ p: 2, minWidth: 300, maxWidth: 400 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Flag sx={{ color: color, mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {milestone.title}
            </Typography>
            <Chip
              label={milestone.priority}
              size="small"
              color={milestone.priority === "critical" ? "error" : 
                     milestone.priority === "important" ? "warning" : "default"}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            {milestone.description}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              目標日: {milestone.targetDay}日目
              {milestone.deadline && (
                <Chip label="必須期限" size="small" color="error" sx={{ ml: 1 }} />
              )}
            </Typography>
            
            {progress && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" display="block">
                  進捗: {progress.overallProgress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.overallProgress} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            達成条件:
          </Typography>
          <List dense>
            {milestone.requirements.map((req, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: progress?.requirements[index]?.completed ? "success.main" : "grey.400",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={req.description}
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            ))}
          </List>

          {onEdit && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
              <Button startIcon={<Edit />} onClick={handleEdit} size="small">
                編集
              </Button>
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default MilestoneIndicator;
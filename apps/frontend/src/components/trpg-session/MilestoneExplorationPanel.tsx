import React from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  Card,
  CardContent,
  CardActionArea,
  Alert,
  Tooltip,
} from "@mui/material";

import { Flag as FlagIcon, AccessTime, Warning } from "@mui/icons-material";
import { useMilestoneExploration } from "../../hooks/useMilestoneExploration";

interface MilestoneExplorationPanelProps {
  onExecuteAction?: (actionId: string) => void;
  actionCount: number;
  maxActionsPerDay: number;
}

const MilestoneExplorationPanel: React.FC<MilestoneExplorationPanelProps> = ({
  onExecuteAction,
  actionCount,
  maxActionsPerDay,
}) => {
  const { currentMilestone, explorationActionChoices, currentDay } =
    useMilestoneExploration();

  const handleActionClick = (actionId: string) => {
    if (onExecuteAction) {
      onExecuteAction(actionId);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "success";
      case "normal":
        return "info";
      case "hard":
        return "warning";
      case "extreme":
        return "error";
      default:
        return "default";
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      investigate: "調査・探索",
      search: "捜索・発見",
      interact: "交流・会話",
      combat: "戦闘・討伐",
      collect: "収集・取得",
      travel: "移動・探検",
      rest: "休息・準備",
      other: "その他",
    };
    return labels[actionType] || actionType;
  };

  const daysRemaining = currentMilestone
    ? currentMilestone.targetDay - currentDay
    : 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isDeadlineApproaching =
    currentMilestone && daysRemaining <= 2 && currentMilestone.deadline;

  // デバッグログ出力（開発者向け）- 初回レンダリング時のみ
  React.useEffect(() => {
    if (currentMilestone) {
      console.log("🎯 [GM Debug] アクティブマイルストーン:", {
        title: currentMilestone.title,
        targetDay: currentMilestone.targetDay,
        daysRemaining,
        priority: currentMilestone.priority,
        explorationActionsCount: explorationActionChoices.length,
      });
    }
  }, [
    currentMilestone?.id,
    explorationActionChoices.length,
    currentMilestone,
    daysRemaining,
  ]);

  if (!currentMilestone) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          この場所では特別な探索行動は利用できません。
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          別の場所に移動するか、ゲームマスターの指示を待ってください。
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* プレイヤーには自然な探索選択肢として表示 */}
      {explorationActionChoices.length > 0 ? (
        <>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            🗺️ 探索行動
            <Chip
              label={`${explorationActionChoices.length}件の選択肢`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Typography>

          <Grid container spacing={2}>
            {explorationActionChoices
              .sort((a, b) => (b.priority || 0) - (a.priority || 0))
              .map((action) => (
                <Grid item xs={12} key={action.id}>
                  <Tooltip
                    title={
                      actionCount >= maxActionsPerDay
                        ? "今日の行動回数が上限に達しています"
                        : "クリックして実行"
                    }
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        transition: "all 0.2s",
                        opacity: actionCount >= maxActionsPerDay ? 0.6 : 1,
                        "&:hover": {
                          boxShadow: actionCount >= maxActionsPerDay ? 0 : 2,
                          borderColor:
                            actionCount >= maxActionsPerDay
                              ? "grey.400"
                              : "primary.main",
                          cursor:
                            actionCount >= maxActionsPerDay
                              ? "not-allowed"
                              : "pointer",
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() =>
                          actionCount < maxActionsPerDay &&
                          handleActionClick(action.id)
                        }
                        disabled={actionCount >= maxActionsPerDay}
                      >
                        <CardContent sx={{ py: 1.5, px: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                {action.explorationAction?.actionType && (
                                  <span style={{ marginRight: 8 }}>
                                    {action.icon}
                                  </span>
                                )}
                                {action.label}
                              </Typography>
                              {action.explorationAction && (
                                <Chip
                                  label={`難易度: ${action.explorationAction.difficulty}`}
                                  size="small"
                                  color={
                                    getDifficultyColor(
                                      action.explorationAction.difficulty,
                                    ) as any
                                  }
                                />
                              )}
                            </Box>

                            {action.explorationAction && (
                              <Chip
                                label={getActionTypeLabel(
                                  action.explorationAction.actionType,
                                )}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            )}
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 0 }}
                          >
                            {action.description}
                          </Typography>

                          {action.explorationAction?.prerequisites
                            ?.timeRequired && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              所要時間:{" "}
                              {
                                action.explorationAction.prerequisites
                                  .timeRequired
                              }
                              分
                            </Typography>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Tooltip>
                </Grid>
              ))}
          </Grid>
        </>
      ) : (
        <Alert severity="info">
          <Typography variant="body2">
            この場所では特別な探索行動は利用できません。
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            別の場所に移動するか、基本的な行動を選択してください。
          </Typography>
        </Alert>
      )}

      {actionCount >= maxActionsPerDay && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          今日の行動回数が上限({maxActionsPerDay}
          回)に達しています。明日まで待つか、「次の日へ」ボタンで日を進めてください。
        </Alert>
      )}
    </Box>
  );
};

export default MilestoneExplorationPanel;

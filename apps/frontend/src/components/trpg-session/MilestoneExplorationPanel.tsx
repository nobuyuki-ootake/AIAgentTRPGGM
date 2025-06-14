import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Card,
  CardContent,
  Alert,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Flag as FlagIcon,
  AccessTime,
  Warning,
} from '@mui/icons-material';
import { useMilestoneExploration } from '../../hooks/useMilestoneExploration';

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
  const { currentMilestone, explorationActionChoices, currentDay } = useMilestoneExploration();

  const handleActionClick = (actionId: string) => {
    if (onExecuteAction) {
      onExecuteAction(actionId);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'normal': return 'info';
      case 'hard': return 'warning';
      case 'extreme': return 'error';
      default: return 'default';
    }
  };

  const getActionTypeLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      investigate: '調査・探索',
      search: '捜索・発見',
      interact: '交流・会話',
      combat: '戦闘・討伐',
      collect: '収集・取得',
      travel: '移動・探検',
      rest: '休息・準備',
      other: 'その他'
    };
    return labels[actionType] || actionType;
  };

  if (!currentMilestone) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          現在アクティブなマイルストーンがありません。
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          タイムライン管理画面でマイルストーンを設定すると、関連する探索行動が表示されます。
        </Typography>
      </Alert>
    );
  }

  const daysRemaining = currentMilestone.targetDay - currentDay;
  const isDeadlineApproaching = daysRemaining <= 2 && currentMilestone.deadline;

  return (
    <Box>
      {/* 現在のマイルストーン情報 */}
      <Card sx={{ mb: 3, border: isDeadlineApproaching ? '2px solid' : '1px solid', borderColor: isDeadlineApproaching ? 'error.main' : 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FlagIcon color={isDeadlineApproaching ? 'error' : 'primary'} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {currentMilestone.title}
            </Typography>
            <Chip 
              label={currentMilestone.priority} 
              size="small" 
              color={currentMilestone.priority === 'critical' ? 'error' : currentMilestone.priority === 'important' ? 'warning' : 'default'}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {currentMilestone.description}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime fontSize="small" color={isDeadlineApproaching ? 'error' : 'action'} />
              <Typography variant="caption">
                目標: {currentMilestone.targetDay}日目 (残り{daysRemaining}日)
              </Typography>
            </Box>
            
            {currentMilestone.deadline && (
              <Chip 
                label="必須期限" 
                size="small" 
                color="error" 
                icon={<Warning />}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* 探索行動一覧 */}
      {explorationActionChoices.length > 0 ? (
        <>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🗺️ マイルストーン関連の探索行動
            <Chip label={`${explorationActionChoices.length}件`} size="small" color="primary" variant="outlined" />
          </Typography>
          
          <Grid container spacing={2}>
            {explorationActionChoices
              .sort((a, b) => (b.priority || 0) - (a.priority || 0))
              .map((action) => (
                <Grid item xs={12} key={action.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main',
                      }
                    }}
                  >
                    <CardContent sx={{ pb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {action.explorationAction?.actionType && (
                            <span style={{ marginRight: 8 }}>
                              {action.icon}
                            </span>
                          )}
                          {action.label}
                        </Typography>
                        
                        {action.explorationAction && (
                          <Chip 
                            label={getActionTypeLabel(action.explorationAction.actionType)}
                            size="small" 
                            variant="outlined"
                            color="primary"
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {action.description}
                      </Typography>
                      
                      {action.explorationAction && (
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip 
                            label={`難易度: ${action.explorationAction.difficulty}`}
                            size="small"
                            color={getDifficultyColor(action.explorationAction.difficulty) as any}
                          />
                          
                          {action.explorationAction.prerequisites?.timeRequired && (
                            <Chip 
                              label={`所要時間: ${action.explorationAction.prerequisites.timeRequired}分`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}
                      
                      <Tooltip title={actionCount >= maxActionsPerDay ? "今日の行動回数が上限に達しています" : ""}>
                        <span>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleActionClick(action.id)}
                            disabled={actionCount >= maxActionsPerDay}
                            sx={{ mt: 1 }}
                          >
                            実行する
                          </Button>
                        </span>
                      </Tooltip>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </>
      ) : (
        <Alert severity="info">
          <Typography variant="body2">
            このマイルストーンに関連する探索行動はまだ設定されていません。
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            クエスト、イベント、エネミーに探索行動を設定すると、ここに表示されます。
          </Typography>
        </Alert>
      )}
      
      {actionCount >= maxActionsPerDay && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          今日の行動回数が上限({maxActionsPerDay}回)に達しています。明日まで待つか、「次の日へ」ボタンで日を進めてください。
        </Alert>
      )}
    </Box>
  );
};

export default MilestoneExplorationPanel;
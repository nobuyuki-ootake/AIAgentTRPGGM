import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  LinearProgress,
  Tooltip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Campaign,
  Favorite,
  Shield,
  Speed,
  Bolt,
  ArrowBack,
  Security,
  Warning,
  CheckCircle,
  LocalHospital,
  SentimentVeryDissatisfied,
  SentimentSatisfied,
} from '@mui/icons-material';
import { EnemyCharacter } from '@trpg-ai-gm/types';

interface EnemySelectionPanelProps {
  enemies: EnemyCharacter[];
  selectedEnemies: string[];
  onEnemySelect: (enemy: EnemyCharacter) => void;
  onEnemyToggle: (enemyId: string) => void;
  onConfirmAttack: (selectedEnemies: string[]) => void;
  onCancel: () => void;
  attackingCharacter?: string;
}

const EnemySelectionPanel: React.FC<EnemySelectionPanelProps> = ({
  enemies,
  selectedEnemies,
  onEnemySelect,
  onEnemyToggle,
  onConfirmAttack,
  onCancel,
  attackingCharacter,
}) => {
  
  // 安全にHPの値を取得
  const getHPValue = (hp: any): number => {
    if (typeof hp === 'number') return hp;
    if (typeof hp === 'object' && hp !== null) {
      return hp.current || hp.value || 0;
    }
    return 0;
  };

  const getMaxHPValue = (maxHp: any): number => {
    if (typeof maxHp === 'number') return maxHp;
    if (typeof maxHp === 'object' && maxHp !== null) {
      return maxHp.max || maxHp.value || 100;
    }
    return 100;
  };

  // HPの色を取得
  const getHPColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 75) return "success";
    if (percentage > 50) return "warning";
    if (percentage > 25) return "error";
    return "error";
  };

  // 敵の状態を判定
  const getEnemyStatus = (enemy: EnemyCharacter) => {
    const hp = enemy.status?.currentHp || 0;
    const maxHp = enemy.derivedStats?.hp || 0;
    const percentage = maxHp > 0 ? (hp / maxHp) * 100 : 0;
    
    if (hp <= 0) return { status: 'dead', icon: SentimentVeryDissatisfied, color: 'error', label: '撃破' };
    if (percentage <= 25) return { status: 'critical', icon: Warning, color: 'error', label: '重傷' };
    if (percentage <= 50) return { status: 'wounded', icon: LocalHospital, color: 'warning', label: '負傷' };
    if (percentage <= 75) return { status: 'injured', icon: SentimentSatisfied, color: 'warning', label: '軽傷' };
    return { status: 'healthy', icon: CheckCircle, color: 'success', label: '健康' };
  };

  // 敵カードコンポーネント
  const EnemyCard: React.FC<{ enemy: EnemyCharacter }> = ({ enemy }) => {
    const isSelected = selectedEnemies.includes(enemy.id);
    const status = getEnemyStatus(enemy);
    const hp = enemy.status?.currentHp || 0;
    const maxHp = enemy.derivedStats?.hp || 0;
    const isDead = hp <= 0;
    
    return (
      <Card 
        sx={{ 
          mb: 1, 
          cursor: isDead ? 'not-allowed' : 'pointer',
          bgcolor: isSelected ? 'error.light' : (isDead ? 'grey.100' : 'background.paper'),
          border: isSelected ? '2px solid' : '1px solid',
          borderColor: isSelected ? 'error.main' : 'divider',
          opacity: isDead ? 0.5 : 1,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: isDead ? 'grey.100' : (isSelected ? 'error.light' : 'action.hover'),
          }
        }}
        onClick={() => !isDead && onEnemyToggle(enemy.id)}
      >
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: isDead ? 'grey.500' : 'error.main',
                filter: isDead ? 'grayscale(1)' : 'none',
              }}
            >
              {enemy.name[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {enemy.name}
                {isSelected && <Security sx={{ ml: 1, fontSize: 16, color: 'error.main' }} />}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {enemy.type} ({enemy.rank})
              </Typography>
            </Box>
            <Tooltip title={status.label}>
              <status.icon 
                sx={{ 
                  fontSize: 16, 
                  color: `${status.color}.main`,
                  animation: status.status === 'critical' ? 'pulse 1.5s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 },
                  }
                }} 
              />
            </Tooltip>
          </Box>

          {/* ステータス表示 */}
          {enemy.stats && (
            <Stack spacing={0.5}>
              {/* HP */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Favorite 
                  fontSize="small" 
                  color={getHPColor(hp, maxHp)}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="caption"
                    sx={{ 
                      fontWeight: status.status === 'critical' ? 'bold' : 'normal',
                      color: isDead ? 'error.main' : 'text.primary'
                    }}
                  >
                    HP: {hp}/{maxHp}
                    {isDead && ' (撃破済み)'}
                    {status.status === 'critical' && !isDead && ' (危険)'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(hp / maxHp) * 100}
                    color={getHPColor(hp, maxHp)}
                    sx={{ 
                      height: 4, 
                      borderRadius: 2,
                    }}
                  />
                </Box>
              </Box>

              {/* その他のステータス */}
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                <Chip
                  icon={<Shield />}
                  label={`防御:${enemy.derivedStats?.defense || 10}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Speed />}
                  label={`回避:${enemy.derivedStats?.evasion || 0}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Bolt />}
                  label={`Lv:${enemy.level}`}
                  size="small"
                  variant="outlined"
                  color="error"
                />
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Paper elevation={3} sx={{ p: 2, maxHeight: '500px', overflow: 'auto' }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={onCancel} size="small">
          <ArrowBack />
        </IconButton>
        <Campaign color="error" />
        <Typography variant="h6" color="error">
          攻撃対象を選択
        </Typography>
      </Box>

      {attackingCharacter && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2" color="info.dark">
            <strong>{attackingCharacter}</strong> が攻撃を行います
          </Typography>
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* 敵リスト */}
      <Box sx={{ mb: 2 }}>
        {enemies.length > 0 ? (
          enemies.map((enemy) => (
            <EnemyCard key={enemy.id} enemy={enemy} />
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              攻撃可能な敵がいません
            </Typography>
          </Box>
        )}
      </Box>

      {/* 選択状況と確認ボタン */}
      {enemies.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              選択中: {selectedEnemies.length}体
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={onCancel}
                size="small"
              >
                キャンセル
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => onConfirmAttack(selectedEnemies)}
                disabled={selectedEnemies.length === 0}
                startIcon={<Security />}
                size="small"
              >
                攻撃実行
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default EnemySelectionPanel;
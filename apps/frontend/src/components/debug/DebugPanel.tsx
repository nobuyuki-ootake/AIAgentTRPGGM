// @ts-nocheck
import React from 'react';
import {
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  IconButton,
} from '@mui/material';
import {
  Close,
  Refresh,
  BugReport,
  Print,
  PlayArrow,
  Warning,
  CheckCircle,
  Bolt,
} from '@mui/icons-material';
import { DiceD20Icon } from '../icons/TRPGIcons';
import { TRPGCharacter, TRPGCampaign, TRPGNPC, TRPGEnemy } from '@trpg-ai-gm/types';

interface DebugPanelProps {
  // 表示用データ
  currentCampaign: TRPGCampaign | null;
  playerCharacters: TRPGCharacter[];
  npcs: TRPGNPC[];
  enemies: TRPGEnemy[];
  selectedCharacter: TRPGCharacter | null;
  currentLocation: string;
  currentDay: number;
  actionCount: number;
  maxActionsPerDay: number;
  isSessionStarted: boolean;
  
  // アクション
  onCheckEncounters: () => void;
  onSimulateEnemyMovement: () => void;
  onReloadTestData: () => void;
  onLoadEmptyCampaign: () => void;
  onExportDebugLog: () => void;
  onClose: () => void;
  
  // ダイス関連
  onOpenDiceDialog?: () => void;
  onOpenSkillCheckDialog?: () => void;
  onOpenPowerCheckDialog?: () => void;
  lastDiceResult?: {
    result: number;
    notation: string;
    details: string;
  } | null;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  currentCampaign,
  playerCharacters,
  npcs,
  enemies,
  selectedCharacter,
  currentLocation,
  currentDay,
  actionCount,
  maxActionsPerDay,
  isSessionStarted,
  onCheckEncounters,
  onSimulateEnemyMovement,
  onReloadTestData,
  onLoadEmptyCampaign,
  onExportDebugLog,
  onClose,
  onOpenDiceDialog,
  onOpenSkillCheckDialog,
  onOpenPowerCheckDialog,
  lastDiceResult,
}) => {
  return (
    <Paper
      data-testid="debug-panel"
      sx={{
        position: 'fixed',
        top: 10,
        right: 10,
        p: 2,
        maxWidth: 350,
        fontSize: '0.8rem',
        bgcolor: 'rgba(255,255,255,0.95)',
        zIndex: 1000,
        maxHeight: '80vh',
        overflow: 'auto',
        border: '2px solid #4CAF50',
      }}
    >
      {/* ヘッダー */}
      <Box display="flex" alignItems="center" justifyContent="between" mb={1}>
        <Box display="flex" alignItems="center">
          <BugReport color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ ml: 1, fontSize: '1rem' }}>
            🐛 デバッグパネル
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 1. 現在の状況 */}
      <Box mb={2}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          📍 現在の状況
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2">
            🏠 現在地: <strong>{currentLocation || '未設定'}</strong>
          </Typography>
          <Typography variant="body2">
            📅 日数: <strong>{currentDay}日目</strong>
          </Typography>
          <Typography variant="body2">
            ⚡ 行動回数: <strong>{actionCount}/{maxActionsPerDay}</strong>
          </Typography>
          <Typography variant="body2">
            🎮 セッション: {isSessionStarted ? (
              <Chip label="進行中" color="success" size="small" />
            ) : (
              <Chip label="未開始" color="default" size="small" />
            )}
          </Typography>
          {selectedCharacter && (
            <Typography variant="body2">
              👤 選択中: <strong style={{ color: '#4CAF50' }}>{selectedCharacter.name}</strong>
            </Typography>
          )}
        </Stack>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 2. キャラクター登録状況 */}
      <Box mb={2}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          👥 PCキャラクター ({playerCharacters.length}人)
        </Typography>
        <List dense sx={{ py: 0 }}>
          {playerCharacters.map((char) => (
            <ListItem
              key={char.id}
              sx={{
                py: 0.25,
                px: 1,
                bgcolor: selectedCharacter?.id === char.id ? '#E8F5E8' : 'transparent',
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2">
                    {char.name} (Lv.{char.level || 1})
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {char.characterClass || '未設定'}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 3. 本日のイベント */}
      <Box mb={2}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          📋 本日のイベント
        </Typography>
        {currentCampaign?.timeline && currentCampaign.timeline.length > 0 ? (
          <List dense sx={{ py: 0 }}>
            {currentCampaign.timeline
              .filter(event => event.dayNumber === currentDay)
              .slice(0, 3)
              .map((event) => (
                <ListItem key={event.id} sx={{ py: 0.25, px: 1 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {event.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        📍 {event.location || '場所未設定'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            本日のイベントはありません
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 4. NPC/エネミー配置状況 */}
      <Box mb={2}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          🤖 NPC/エネミー配置
        </Typography>
        
        {/* NPC一覧 */}
        <Typography variant="caption" color="text.secondary">
          NPC ({npcs.length}体):
        </Typography>
        <List dense sx={{ py: 0 }}>
          {npcs.slice(0, 3).map((npc) => (
            <ListItem
              key={npc.id}
              sx={{
                py: 0.25,
                px: 1,
                bgcolor: npc.location === currentLocation ? '#FFF3E0' : 'transparent',
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2">
                    {npc.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    📍 {npc.location || '場所未設定'} | {npc.npcType || 'NPC'}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        {/* エネミー一覧 */}
        <Typography variant="caption" color="text.secondary">
          エネミー ({enemies.length}体):
        </Typography>
        <List dense sx={{ py: 0 }}>
          {enemies.slice(0, 3).map((enemy) => (
            <ListItem
              key={enemy.id}
              sx={{
                py: 0.25,
                px: 1,
                bgcolor: enemy.location === currentLocation ? '#FFEBEE' : 'transparent',
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <ListItemText
                primary={
                  <Typography variant="body2">
                    {enemy.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    📍 {enemy.location || '場所未設定'} | 危険度: {enemy.challengeRating || 1}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 5. デバッグアクション */}
      <Box>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          🔧 デバッグアクション
        </Typography>
        <Stack spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onCheckEncounters}
            fullWidth
          >
            🔄 遭遇チェック
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayArrow />}
            onClick={onSimulateEnemyMovement}
            fullWidth
          >
            🗡️ エネミー移動
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            startIcon={<Print />}
            onClick={onExportDebugLog}
            fullWidth
          >
            🖨️ ログ出力
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={() => {
              if (window.confirm('新しい空のキャンペーンを作成しますか？')) {
                onLoadEmptyCampaign();
              }
            }}
            fullWidth
          >
            🆕 空のキャンペーン作成
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Warning />}
            onClick={() => {
              if (window.confirm('テストデータをJSONファイルからリロードしますか？')) {
                onReloadTestData();
              }
            }}
            fullWidth
            data-testid="reload-test-data-button"
          >
            🔄 JSONから再ロード
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 6. ダイス機能 */}
      <Box>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          🎲 ダイス機能
        </Typography>
        <Stack spacing={1}>
          {onOpenDiceDialog && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DiceD20Icon />}
              onClick={onOpenDiceDialog}
              fullWidth
            >
              基本ダイス
            </Button>
          )}
          
          {onOpenSkillCheckDialog && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={onOpenSkillCheckDialog}
              fullWidth
            >
              技能判定
            </Button>
          )}
          
          {onOpenPowerCheckDialog && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Bolt />}
              onClick={onOpenPowerCheckDialog}
              fullWidth
            >
              能力判定
            </Button>
          )}
          
          {lastDiceResult && (
            <Paper sx={{ p: 1, mt: 1, bgcolor: 'grey.100' }}>
              <Typography variant="caption" color="text.secondary">
                最後のロール:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {lastDiceResult.notation} = {lastDiceResult.result}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {lastDiceResult.details}
              </Typography>
            </Paper>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

export default DebugPanel;
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
  
  // GM情報
  checkClearConditions?: () => {
    condition: any;
    isCompleted: boolean;
    progress: string;
  }[];
  
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
  
  // デバッグアイテム追加
  onDebugAddItem?: (itemId: string, itemName: string, quantity: number) => void;
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
  checkClearConditions,
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

      {/* 5. GM専用情報 */}
      {checkClearConditions && (
        <>
          <Box mb={2}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              🏆 クリア条件進捗 (GM専用)
            </Typography>
            {checkClearConditions().length > 0 ? (
              <List dense sx={{ py: 0 }}>
                {checkClearConditions().map((conditionStatus, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      py: 0.25,
                      px: 1,
                      bgcolor: conditionStatus.isCompleted ? '#E8F5E8' : '#FFF3E0',
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          {conditionStatus.isCompleted ? "✅" : "⭕"} {conditionStatus.condition.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {conditionStatus.progress}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                クリア条件が設定されていません
              </Typography>
            )}
          </Box>
          
          {/* クリア条件達成ガイド */}
          <Box mb={2}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              📋 クリア条件達成ガイド (GM専用)
            </Typography>
            {currentCampaign?.clearConditions && currentCampaign.clearConditions.length > 0 ? (
              <List dense sx={{ py: 0 }}>
                {currentCampaign.clearConditions.map((condition, _index) => {
                  const getConditionIcon = (type: string) => {
                    switch (type) {
                      case 'item_collection': return '🔑';
                      case 'story_milestone': return '👥';
                      case 'quest_completion': return '🐉';
                      default: return '📋';
                    }
                  };
                  
                  const getConditionGuide = (condition: any) => {
                    switch (condition.type) {
                      case 'item_collection': {
                        // キャンペーンデータからアイテムの入手場所を取得
                        const firstItem = condition.requiredItems?.[0];
                        if (!firstItem) return 'アイテム情報不明';
                        
                        const itemLocation = currentCampaign?.itemLocations?.find(
                          location => location.itemId === firstItem.itemId
                        );
                        
                        if (itemLocation) {
                          const locationText = itemLocation.locationName || itemLocation.locationId;
                          const methodText = itemLocation.locationType === 'event' ? 'イベント完了' :
                                          itemLocation.locationType === 'shop' ? '購入' :
                                          itemLocation.locationType === 'loot' ? '戦利品取得' :
                                          itemLocation.locationType === 'reward' ? 'クエスト報酬' : '取得';
                          
                          let requirementText = '';
                          if (itemLocation.requirements && itemLocation.requirements.length > 0) {
                            requirementText = ` (${itemLocation.requirements[0].description})`;
                          }
                          
                          return `📍 ${locationText}で${methodText}${requirementText}`;
                        }
                        
                        return `アイテム「${firstItem.itemName}」を入手 (数量: ${firstItem.quantity})`;
                      }
                        
                      case 'story_milestone': {
                        // ストーリーマイルストーンの達成方法
                        const milestone = condition.storyMilestone || condition.description;
                        
                        // キャンペーンのクエストから関連するものを検索
                        const relatedQuest = currentCampaign?.plot?.find(
                          quest => quest.description?.includes('村') || quest.title?.includes('村')
                        );
                        
                        if (relatedQuest) {
                          return `クエスト「${relatedQuest.title}」を完了 (${relatedQuest.description})`;
                        }
                        
                        return `マイルストーン「${milestone}」を達成`;
                      }
                        
                      case 'quest_completion': {
                        // クエスト完了の詳細情報
                        const questId = condition.requiredQuests?.[0];
                        if (!questId) return 'クエスト情報不明';
                        
                        const quest = currentCampaign?.plot?.find(q => q.id === questId);
                        if (quest) {
                          const locationText = quest.relatedPlaceIds?.length > 0 
                            ? ` (場所: ${quest.relatedPlaceIds.join(', ')})`
                            : '';
                          return `クエスト「${quest.title}」を完了${locationText}`;
                        }
                        
                        return `クエスト「${questId}」を完了`;
                      }
                        
                      default:
                        return condition.description || '詳細不明';
                    }
                  };
                  
                  const getBgColor = (type: string) => {
                    switch (type) {
                      case 'item_collection': return '#F3E5F5';
                      case 'story_milestone': return '#E8F5E8';
                      case 'quest_completion': return '#FFEBEE';
                      default: return '#F5F5F5';
                    }
                  };
                  
                  return (
                    <ListItem 
                      key={condition.id} 
                      sx={{ py: 0.25, px: 1, bgcolor: getBgColor(condition.type), borderRadius: 1, mb: 0.5 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="bold">
                            {getConditionIcon(condition.type)} {condition.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {getConditionGuide(condition)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                クリア条件が設定されていません
              </Typography>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />
        </>
      )}

      {/* 6. デバッグアクション */}
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
          
          {/* クリア条件テスト用のボタンを動的生成 */}
          {currentCampaign?.clearConditions?.filter(c => c.type === 'item_collection').map(condition => (
            condition.requiredItems?.map(item => (
              <Button
                key={`test-${condition.id}-${item.itemId}`}
                size="small"
                variant="outlined"
                color="success"
                onClick={() => {
                  if (window.confirm(`テスト用：${item.itemName}をインベントリに追加しますか？（クリア条件テスト用）`)) {
                    // テスト用にアイテム追加のイベントを送信
                    const testEvent = new CustomEvent('debug-add-item', { 
                      detail: { itemId: item.itemId, quantity: item.quantity } 
                    });
                    window.dispatchEvent(testEvent);
                  }
                }}
                fullWidth
                sx={{ mb: 1 }}
              >
                🔑 {item.itemName}を取得(テスト)
              </Button>
            ))
          )).flat()}
        </Stack>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 7. ダイス機能 */}
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
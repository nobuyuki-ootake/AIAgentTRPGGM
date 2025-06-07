import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CardMedia,
  Tab,
  Tabs,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  NavigateNext,
  CheckCircle,
  Place,
} from '@mui/icons-material';
import {
  DungeonIcon,
  BaseIcon,
  QuestScrollIcon,
} from '../icons/TRPGIcons';
import FacilityInteractionPanel from '../worldbuilding/FacilityInteractionPanel';
import EnemySelectionPanel from './EnemySelectionPanel';
import { EnemyCharacter, TRPGCharacter, BaseLocation } from '@trpg-ai-gm/types';

// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`main-content-tabpanel-${index}`}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</Box>}
    </div>
  );
}

// 行動選択の型定義
interface ActionChoice {
  id: string;
  type: "move" | "shop" | "talk" | "interact" | "skill" | "custom" | "attack";
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresTarget?: boolean;
  targetType?: "location" | "npc" | "character" | "item" | "enemy";
}

interface MainContentPanelProps {
  currentLocation?: string;
  currentBaseImage?: string;
  availableActions: ActionChoice[];
  actionCount: number;
  maxActionsPerDay: number;
  currentBase?: any;
  enemies?: EnemyCharacter[];
  selectedCharacter?: TRPGCharacter;
  bases?: BaseLocation[];
  onExecuteAction: (action: ActionChoice) => void;
  onAdvanceDay: () => void;
  onFacilityInteract: (facility: any) => void;
  onAttackEnemies?: (selectedEnemies: string[]) => void;
  onLocationChange?: (locationName: string) => void;
}

const MainContentPanel: React.FC<MainContentPanelProps> = ({
  currentLocation,
  currentBaseImage,
  availableActions,
  actionCount,
  maxActionsPerDay,
  currentBase,
  enemies = [],
  selectedCharacter,
  bases = [],
  onExecuteAction,
  onAdvanceDay,
  onFacilityInteract,
  onAttackEnemies,
  onLocationChange,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [showEnemySelection, setShowEnemySelection] = useState(false);
  const [selectedEnemies, setSelectedEnemies] = useState<string[]>([]);

  // 行動選択の処理
  const handleActionClick = (action: ActionChoice) => {
    if (action.type === 'attack') {
      // 攻撃アクションの場合は敵選択UIを表示
      setShowEnemySelection(true);
      setSelectedEnemies([]);
    } else {
      // その他のアクションは通常通り実行
      onExecuteAction(action);
    }
  };

  // 敵選択の処理
  const handleEnemyToggle = (enemyId: string) => {
    setSelectedEnemies(prev => 
      prev.includes(enemyId) 
        ? prev.filter(id => id !== enemyId)
        : [...prev, enemyId]
    );
  };

  // 攻撃確認の処理
  const handleConfirmAttack = (selectedEnemyIds: string[]) => {
    if (onAttackEnemies) {
      onAttackEnemies(selectedEnemyIds);
    }
    setShowEnemySelection(false);
    setSelectedEnemies([]);
  };

  // 攻撃キャンセルの処理
  const handleCancelAttack = () => {
    setShowEnemySelection(false);
    setSelectedEnemies([]);
  };

  // 場所変更の処理
  const handleLocationChange = (event: any) => {
    const newLocation = event.target.value;
    if (onLocationChange && newLocation !== currentLocation) {
      onLocationChange(newLocation);
    }
  };

  return (
    <Paper elevation={2} sx={{ 
      height: '100%',
      maxHeight: '100%', // 親の高さを超えないよう明示的に制限
      display: 'flex', 
      flexDirection: 'column',
      width: '100%',
      minHeight: 0, // flexbox子要素として適切に動作
      overflow: 'hidden'
    }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="探索" icon={<DungeonIcon />} />
          <Tab label="拠点" icon={<BaseIcon />} />
          <Tab label="ステータス" icon={<CheckCircle />} />
          <Tab label="クエスト" icon={<QuestScrollIcon />} />
        </Tabs>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          {/* 探索タブ */}
          <Box sx={{ 
            height: '100%',
            overflow: 'auto',
            scrollbarWidth: "thin",
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '3px',
              '&:hover': {
                background: '#a8a8a8',
              },
            },
          }}>
          {showEnemySelection ? (
            // 敵選択UI表示
            <EnemySelectionPanel
              enemies={enemies}
              selectedEnemies={selectedEnemies}
              onEnemySelect={(enemy) => console.log('Selected enemy:', enemy)}
              onEnemyToggle={handleEnemyToggle}
              onConfirmAttack={handleConfirmAttack}
              onCancel={handleCancelAttack}
              attackingCharacter={selectedCharacter?.name}
            />
          ) : !currentLocation ? (
            // 場所が設定されていない場合
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                📍 場所の情報がありません
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                冒険を始めるには、まず場所を登録してください
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // TODO: 世界観構築画面への遷移または場所登録ダイアログの表示
                  alert('世界観構築画面で場所を登録してください');
                }}
                sx={{ mb: 2 }}
              >
                場所を登録する
              </Button>
              <Typography variant="caption" display="block" color="text.secondary">
                世界観構築 → 拠点タブから場所を追加できます
              </Typography>
            </Box>
          ) : (
            // 場所が設定されている場合の通常表示
            <>
              {/* 場所選択ドロップダウン */}
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="location-select-label">移動先を選択</InputLabel>
                  <Select
                    labelId="location-select-label"
                    value={currentLocation || ''}
                    label="移動先を選択"
                    onChange={handleLocationChange}
                    startAdornment={<Place sx={{ mr: 1 }} />}
                  >
                    {bases.filter(base => base.meta.unlocked).map((base) => (
                      <MenuItem key={base.id} value={base.name}>
                        {base.type === '都市' ? '🏛️' : base.type === '森' ? '🌲' : base.type === '遺跡' ? '🏛️' : '📍'} {base.name}
                        {base.threats.dangerLevel === '高' && ' ⚠️'}
                        {base.threats.dangerLevel === '中' && ' ⚡'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Typography variant="h6" gutterBottom>
                現在地: {currentLocation}
              </Typography>
              
              {currentBaseImage && (
                <CardMedia
                  component="img"
                  height="200"
                  image={currentBaseImage}
                  alt={currentLocation}
                  sx={{ borderRadius: 1, mb: 2 }}
                />
              )}
              
              <Grid container spacing={1} data-testid="available-actions">
                {availableActions.map((action) => (
                  <Grid item xs={12} key={action.id}>
                    <Tooltip title={action.description || action.label} placement="right">
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={action.icon}
                        onClick={() => handleActionClick(action)}
                        disabled={actionCount >= maxActionsPerDay}
                        sx={{ p: 1, textAlign: 'left' }}
                        data-testid="action-button"
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {action.label}
                          </Typography>
                        </Box>
                      </Button>
                    </Tooltip>
                  </Grid>
                ))}
              </Grid>
              
              {actionCount >= maxActionsPerDay && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onAdvanceDay}
                    startIcon={<NavigateNext />}
                  >
                    翌日に進む
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {/* 拠点タブ */}
        <Box sx={{ 
          height: '100%',
          overflow: 'auto',
          scrollbarWidth: "thin",
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '3px',
            '&:hover': {
              background: '#a8a8a8',
            },
          },
        }}>
          <FacilityInteractionPanel
            base={currentBase}
            onInteract={onFacilityInteract}
          />
        </Box>
      </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* ステータスタブ */}
          <Box sx={{ 
            height: '100%',
            overflow: 'auto',
            scrollbarWidth: "thin",
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '3px',
              '&:hover': {
                background: '#a8a8a8',
              },
            },
          }}>
            {selectedCharacter ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedCharacter.name} のステータス
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    基本情報
                  </Typography>
                  <Typography variant="body2">
                    種族: {selectedCharacter.nation || '未設定'}
                  </Typography>
                  <Typography variant="body2">
                    職業: {selectedCharacter.profession || '未設定'}
                  </Typography>
                  <Typography variant="body2">
                    年齢: {selectedCharacter.age || '不明'}
                  </Typography>
                  <Typography variant="body2">
                    性別: {selectedCharacter.gender || '不明'}
                  </Typography>
                  <Typography variant="body2">
                    宗教: {selectedCharacter.religion || '未設定'}
                  </Typography>
                </Box>
                
                {selectedCharacter.attributes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      能力値
                    </Typography>
                    <Typography variant="body2">STR: {selectedCharacter.attributes.STR}</Typography>
                    <Typography variant="body2">CON: {selectedCharacter.attributes.CON}</Typography>
                    <Typography variant="body2">SIZ: {selectedCharacter.attributes.SIZ}</Typography>
                    <Typography variant="body2">INT: {selectedCharacter.attributes.INT}</Typography>
                    <Typography variant="body2">POW: {selectedCharacter.attributes.POW}</Typography>
                    <Typography variant="body2">DEX: {selectedCharacter.attributes.DEX}</Typography>
                    <Typography variant="body2">CHA: {selectedCharacter.attributes.CHA}</Typography>
                  </Box>
                )}
                
                {selectedCharacter.derived && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      派生値
                    </Typography>
                    <Typography variant="body2">HP: {selectedCharacter.derived.HP}</Typography>
                    <Typography variant="body2">MP: {selectedCharacter.derived.MP}</Typography>
                    <Typography variant="body2">SW (先制値): {selectedCharacter.derived.SW}</Typography>
                    <Typography variant="body2">RES (抵抗値): {selectedCharacter.derived.RES}</Typography>
                  </Box>
                )}
                
                {selectedCharacter.weapons && selectedCharacter.weapons.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      武器
                    </Typography>
                    {selectedCharacter.weapons.map((weapon, index) => (
                      <Typography key={index} variant="body2">
                        • {weapon.name} (攻撃: {weapon.attack}, ダメージ: {weapon.damage})
                      </Typography>
                    ))}
                  </Box>
                )}
                
                {selectedCharacter.armor && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      装甲
                    </Typography>
                    <Typography variant="body2">頭部: {selectedCharacter.armor.head}</Typography>
                    <Typography variant="body2">胴体: {selectedCharacter.armor.body}</Typography>
                    <Typography variant="body2">左腕: {selectedCharacter.armor.leftArm}</Typography>
                    <Typography variant="body2">右腕: {selectedCharacter.armor.rightArm}</Typography>
                    <Typography variant="body2">左脚: {selectedCharacter.armor.leftLeg}</Typography>
                    <Typography variant="body2">右脚: {selectedCharacter.armor.rightLeg}</Typography>
                  </Box>
                )}
                
                {selectedCharacter.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      外見・特徴
                    </Typography>
                    <Typography variant="body2">
                      {selectedCharacter.description}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  📊 キャラクター未選択
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  左のパーティパネルからキャラクターを選択してください
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* クエストタブ */}
          <Box sx={{ 
            height: '100%',
            overflow: 'auto',
            scrollbarWidth: "thin",
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '3px',
              '&:hover': {
                background: '#a8a8a8',
              },
            },
          }}>
            <Typography variant="h6">進行中のクエスト</Typography>
            <Typography variant="body2" color="text.secondary">
              クエスト機能は開発中です
            </Typography>
          </Box>
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default MainContentPanel;
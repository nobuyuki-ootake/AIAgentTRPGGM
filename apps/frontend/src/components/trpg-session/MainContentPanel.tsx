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
} from '@mui/material';
import {
  NavigateNext,
  Security,
} from '@mui/icons-material';
import {
  DungeonIcon,
  BaseIcon,
  QuestScrollIcon,
} from '../icons/TRPGIcons';
import FacilityInteractionPanel from '../worldbuilding/FacilityInteractionPanel';
import EnemySelectionPanel from './EnemySelectionPanel';
import { EnemyCharacter } from '@trpg-ai-gm/types';

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
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
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
  selectedCharacter?: { name: string };
  onExecuteAction: (action: ActionChoice) => void;
  onAdvanceDay: () => void;
  onFacilityInteract: (facility: any) => void;
  onAttackEnemies?: (selectedEnemies: string[]) => void;
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
  onExecuteAction,
  onAdvanceDay,
  onFacilityInteract,
  onAttackEnemies,
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

  return (
    <Paper elevation={2} sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="探索" icon={<DungeonIcon />} />
          <Tab label="拠点" icon={<BaseIcon />} />
          <Tab label="クエスト" icon={<QuestScrollIcon />} />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        {/* 探索タブ */}
        <Box sx={{ height: '500px', overflow: 'auto' }}>
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
              
              <Grid container spacing={1}>
                {availableActions.map((action) => (
                  <Grid item xs={6} key={action.id}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={action.icon}
                      onClick={() => handleActionClick(action)}
                      disabled={actionCount >= maxActionsPerDay}
                      sx={{ p: 1, textAlign: 'left' }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {action.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {action.description}
                        </Typography>
                      </Box>
                    </Button>
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
        <FacilityInteractionPanel
          base={currentBase}
          onInteract={onFacilityInteract}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {/* クエストタブ */}
        <Typography variant="h6">進行中のクエスト</Typography>
        <Typography variant="body2" color="text.secondary">
          クエスト機能は開発中です
        </Typography>
      </TabPanel>
    </Paper>
  );
};

export default MainContentPanel;
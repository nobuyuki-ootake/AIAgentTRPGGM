import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  Tab,
  Tabs,
  Badge,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  IconButton,
  Fade,
} from "@mui/material";
import {
  PersonOutline,
  Groups,
  Campaign,
  Favorite,
  Shield,
  Speed,
  Bolt,
  Edit,
  Warning,
  CheckCircle,
  LocalHospital,
  SentimentVeryDissatisfied,
  SentimentSatisfied,
  Whatshot,
  AcUnit,
  WbSunny,
} from "@mui/icons-material";
import { TRPGCharacter, NPCCharacter, EnemyCharacter } from "@trpg-ai-gm/types";

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
      id={`character-tabpanel-${index}`}
      aria-labelledby={`character-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

interface CharacterDisplayProps {
  playerCharacters: TRPGCharacter[];
  npcs: NPCCharacter[];
  enemies: EnemyCharacter[];
  selectedCharacter: TRPGCharacter | NPCCharacter | EnemyCharacter | null;
  selectedEnemies: string[];
  tabValue: number;
  combatMode: boolean;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onCharacterSelect: (character: TRPGCharacter | NPCCharacter | EnemyCharacter) => void;
  onEnemyToggle: (enemyId: string) => void;
  onStartCombat: () => void;
  onEditCharacter?: (character: TRPGCharacter | NPCCharacter | EnemyCharacter) => void;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
  playerCharacters,
  npcs,
  enemies,
  selectedCharacter,
  selectedEnemies,
  tabValue,
  combatMode,
  onTabChange,
  onCharacterSelect,
  onEnemyToggle,
  onStartCombat,
  onEditCharacter,
}) => {
  
  // HPの色を取得
  const getHPColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 75) return "success";
    if (percentage > 50) return "warning";
    if (percentage > 25) return "error";
    return "error";
  };

  // 安全にHPの値を取得（TRPGCharacter用）
  const getCharacterHP = (character: TRPGCharacter | NPCCharacter | EnemyCharacter): { current: number; max: number } => {
    // TRPGCharacterの場合はderived.HPを使用
    if ('derived' in character && character.derived) {
      const currentHP = (character as any).currentHP ?? character.derived.HP;
      const maxHP = character.derived.HP;
      return { current: currentHP, max: maxHP };
    }
    
    // EnemyCharacterの場合はderiviedStats.hpとstatus.currentHpを使用
    if ('derivedStats' in character && character.derivedStats) {
      const enemy = character as EnemyCharacter;
      const currentHP = enemy.status?.currentHp ?? enemy.derivedStats.hp;
      const maxHP = enemy.derivedStats.hp;
      return { current: currentHP, max: maxHP };
    }
    
    // フォールバック
    return { current: 0, max: 100 };
  };

  // キャラクターの状態を判定
  const getCharacterStatus = (character: TRPGCharacter | NPCCharacter | EnemyCharacter) => {
    const { current: hp, max: maxHp } = getCharacterHP(character);
    const percentage = maxHp > 0 ? (hp / maxHp) * 100 : 0;
    
    if (hp <= 0) return { status: 'dead', icon: SentimentVeryDissatisfied, color: 'error', label: '死亡' };
    if (percentage <= 25) return { status: 'critical', icon: Warning, color: 'error', label: '重傷' };
    if (percentage <= 50) return { status: 'wounded', icon: LocalHospital, color: 'warning', label: '負傷' };
    if (percentage <= 75) return { status: 'injured', icon: SentimentSatisfied, color: 'warning', label: '軽傷' };
    return { status: 'healthy', icon: CheckCircle, color: 'success', label: '健康' };
  };

  // 状態異常の視覚的表現
  const getStatusEffects = (character: TRPGCharacter | NPCCharacter | EnemyCharacter) => {
    const effects: Array<{ icon: any; color: string; label: string }> = [];
    
    // キャラクターのstatusEffectsがある場合
    if ('statusEffects' in character && character.statusEffects && Array.isArray(character.statusEffects)) {
      character.statusEffects.forEach((effect: any) => {
        switch (effect.type) {
          case 'poison':
            effects.push({ icon: Whatshot, color: 'success', label: '毒' });
            break;
          case 'fire':
            effects.push({ icon: Whatshot, color: 'error', label: '炎上' });
            break;
          case 'ice':
            effects.push({ icon: AcUnit, color: 'info', label: '氷結' });
            break;
          case 'blessing':
            effects.push({ icon: WbSunny, color: 'warning', label: '祝福' });
            break;
          default:
            effects.push({ icon: CheckCircle, color: 'primary', label: effect.name });
        }
      });
    }
    
    return effects;
  };

  // キャラクターカードの共通部分
  const CharacterCard: React.FC<{ character: TRPGCharacter | NPCCharacter | EnemyCharacter }> = ({ character }) => {
    // 戦闘モードでは選択を無効化
    const isSelectionDisabled = combatMode || !onCharacterSelect;
    const status = getCharacterStatus(character);
    const statusEffects = getStatusEffects(character);
    
    // HP情報を取得
    const { current: currentHp, max: maxCurrentHp } = getCharacterHP(character);
    
    return (
      <Card 
        sx={{ 
          mb: 1, 
          cursor: !isSelectionDisabled ? "pointer" : "default",
          bgcolor: selectedCharacter?.id === character.id ? "action.selected" : "background.paper",
          opacity: isSelectionDisabled ? 0.7 : 1,
        }}
        onClick={() => !isSelectionDisabled && onCharacterSelect && onCharacterSelect(character)}
      >
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: status.status === 'dead' ? 'grey.500' : 'primary.main',
                filter: status.status === 'dead' ? 'grayscale(1)' : 'none',
              }}
            >
              {character.name[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {character.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                HP: {currentHp}/{maxCurrentHp}
              </Typography>
            </Box>
            {onEditCharacter && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCharacter(character);
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            )}
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={maxCurrentHp > 0 ? (currentHp / maxCurrentHp) * 100 : 0}
            color={getHPColor(currentHp, maxCurrentHp)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Tabs value={tabValue} onChange={onTabChange} variant="fullWidth">
        <Tab 
          icon={<PersonOutline />} 
          label={
            <Badge badgeContent={playerCharacters.length} color="primary">
              PC
            </Badge>
          } 
        />
        <Tab 
          icon={<Groups />} 
          label={
            <Badge badgeContent={npcs.length} color="secondary">
              NPC
            </Badge>
          } 
        />
        <Tab 
          icon={<Campaign />} 
          label={
            <Badge badgeContent={enemies.length} color="error">
              敵
            </Badge>
          } 
        />
      </Tabs>

      <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
        <TabPanel value={tabValue} index={0}>
          {playerCharacters.length > 0 ? (
            playerCharacters.map((pc) => (
              <CharacterCard key={pc.id} character={pc} />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              プレイヤーキャラクターがいません
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {npcs.length > 0 ? (
            npcs.map((npc) => (
              <CharacterCard key={npc.id} character={npc} />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              NPCがいません
            </Typography>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {enemies.length > 0 ? (
            <>
              {enemies.map((enemy) => (
                <Box
                  key={enemy.id}
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    border: selectedEnemies.includes(enemy.id) ? 2 : 0,
                    borderColor: selectedEnemies.includes(enemy.id) ? "error.main" : "transparent",
                    borderStyle: "solid",
                    borderRadius: 1,
                    mb: 1,
                  }}
                  onClick={() => onEnemyToggle(enemy.id)}
                >
                  <CharacterCard character={enemy} />
                </Box>
              ))}
              
              {selectedEnemies.length > 0 && !combatMode && (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Chip
                    icon={<Campaign />}
                    label={`${selectedEnemies.length}体選択中`}
                    color="error"
                    sx={{ mb: 1 }}
                  />
                  <br />
                  <IconButton
                    color="error"
                    onClick={onStartCombat}
                    sx={{ 
                      bgcolor: "error.main", 
                      color: "white",
                      "&:hover": { bgcolor: "error.dark" }
                    }}
                  >
                    <Bolt />
                  </IconButton>
                  <Typography variant="caption" display="block">
                    戦闘開始
                  </Typography>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
              エネミーがいません
            </Typography>
          )}
        </TabPanel>
      </Box>

      {/* 選択中のキャラクター詳細 */}
      {selectedCharacter && (
        <Box sx={{ 
          borderTop: 1, 
          borderColor: "divider", 
          p: 2, 
          bgcolor: "background.default",
          maxHeight: "30%",
          overflow: "auto"
        }}>
          <Typography variant="subtitle2" gutterBottom>
            選択中: {selectedCharacter.name}
          </Typography>
          {"personality" in selectedCharacter && (selectedCharacter as any).personality && (
            <Typography variant="body2" color="text.secondary">
              {String((selectedCharacter as any).personality)}
            </Typography>
          )}
          {"notes" in selectedCharacter && (selectedCharacter as any).notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              備考: {String((selectedCharacter as any).notes)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CharacterDisplay;
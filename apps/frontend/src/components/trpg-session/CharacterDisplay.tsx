import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
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
  Divider,
} from "@mui/material";
import {
  PersonOutline,
  Groups,
  Campaign,
  Favorite,
  Shield,
  Speed,
  Bolt,
  Visibility,
  Edit,
  Warning,
  CheckCircle,
  LocalHospital,
  SentimentVeryDissatisfied,
  SentimentSatisfied,
  SentimentVerySatisfied,
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

  // キャラクターの状態を判定
  const getCharacterStatus = (character: TRPGCharacter | NPCCharacter | EnemyCharacter) => {
    // TRPGCharacterはattributes、その他はstatsを使用
    const stats = 'attributes' in character ? character.attributes : ('stats' in character ? character.stats : null);
    const hp = getHPValue(stats?.hitPoints);
    const maxHp = getMaxHPValue(stats?.maxHitPoints);
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
    // TRPGCharacterはattributes、その他はstatsを使用
    const stats = 'attributes' in character ? character.attributes : ('stats' in character ? character.stats : null);
    const hp = getHPValue(stats?.hitPoints);
    const maxHp = getMaxHPValue(stats?.maxHitPoints);
    
    return (
      <Card 
        sx={{ 
          mb: 1, 
          cursor: !isSelectionDisabled && onCharacterSelect ? "pointer" : "default",
          bgcolor: selectedCharacter?.id === character.id ? "action.selected" : "background.paper",
          opacity: isSelectionDisabled ? 0.7 : 1,
          border: status.status === 'critical' || status.status === 'dead' ? '2px solid' : '1px solid',
          borderColor: status.status === 'critical' || status.status === 'dead' ? 'error.main' : 'divider',
        }}
        onClick={() => !isSelectionDisabled && onCharacterSelect?.(character)}
      >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Badge
            badgeContent={
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
            }
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
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
          </Badge>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {character.name}
            </Typography>
            {"class" in character && character.class && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {"race" in character ? String(character.race || "") : ""} {String(character.class || "")}
              </Typography>
            )}
            {"role" in character && character.role && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {String(character.role)}
              </Typography>
            )}
            {"enemyType" in character && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {String(character.enemyType)} (CR {"challengeRating" in character ? character.challengeRating : 0})
              </Typography>
            )}
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

        {/* ステータス表示 */}
        {(() => {
          const statsObj = 'attributes' in character ? character.attributes : ('stats' in character ? character.stats : null);
          return statsObj && typeof statsObj === 'object';
        })() && (
          <Stack spacing={0.5}>
            {/* HP */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Favorite 
                fontSize="small" 
                color={getHPColor(hp, maxHp)}
                sx={{
                  animation: status.status === 'critical' ? 'heartbeat 1.5s infinite' : 'none',
                  '@keyframes heartbeat': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                  }
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="caption"
                  sx={{ 
                    fontWeight: status.status === 'critical' ? 'bold' : 'normal',
                    color: status.status === 'dead' ? 'error.main' : 'text.primary'
                  }}
                >
                  HP: {hp}/{maxHp}
                  {status.status === 'dead' && ' (死亡)'}
                  {status.status === 'critical' && ' (危険)'}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(hp / maxHp) * 100}
                  color={getHPColor(hp, maxHp)}
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    transition: 'all 0.3s ease-in-out',
                    '& .MuiLinearProgress-bar': {
                      transition: 'transform 0.5s ease-in-out',
                      animation: status.status === 'critical' ? 'pulse 2s infinite' : 'none',
                    }
                  }}
                />
              </Box>
            </Box>

            {/* 状態異常表示 */}
            {statusEffects.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  状態異常:
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {statusEffects.map((effect, index) => (
                    <Fade in key={index}>
                      <Tooltip title={effect.label}>
                        <Chip
                          icon={<effect.icon />}
                          label={effect.label}
                          size="small"
                          color={effect.color as any}
                          variant="filled"
                          sx={{ 
                            fontSize: '0.6rem',
                            height: 20,
                            animation: 'fadeIn 0.5s ease-in-out',
                            '@keyframes fadeIn': {
                              '0%': { opacity: 0, transform: 'scale(0.8)' },
                              '100%': { opacity: 1, transform: 'scale(1)' },
                            }
                          }}
                        />
                      </Tooltip>
                    </Fade>
                  ))}
                </Stack>
              </Box>
            )}

            {/* その他のステータス */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Tooltip title="アーマークラス">
                <Chip
                  icon={<Shield />}
                  label={`AC:${(() => {
                    const statsObj = 'attributes' in character ? character.attributes : ('stats' in character ? character.stats : null);
                    return statsObj?.armorClass || 10;
                  })()}`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
              <Tooltip title="移動速度">
                <Chip
                  icon={<Speed />}
                  label={`速度:${(() => {
                    const statsObj = 'attributes' in character ? character.attributes : ('stats' in character ? character.stats : null);
                    return statsObj?.speed || 30;
                  })()}`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
              <Tooltip title="レベル">
                <Chip
                  icon={<Bolt />}
                  label={`Lv.${(() => {
                    const statsObj = 'attributes' in character ? character.attributes : ('stats' in character ? character.stats : null);
                    return statsObj?.level || 1;
                  })()}`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            </Stack>
          </Stack>
        )}

        {/* 状態異常表示 */}
        {"statuses" in character && character.statuses && Array.isArray(character.statuses) && character.statuses.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
            {character.statuses.map((status: any, index: number) => (
              <Chip
                key={index}
                label={String(status)}
                size="small"
                color="warning"
              />
            ))}
          </Stack>
        )}
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
          {"personality" in selectedCharacter && selectedCharacter.personality && (
            <Typography variant="body2" color="text.secondary">
              {String(selectedCharacter.personality)}
            </Typography>
          )}
          {"notes" in selectedCharacter && selectedCharacter.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              備考: {String(selectedCharacter.notes)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CharacterDisplay;
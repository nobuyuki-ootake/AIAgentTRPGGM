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
} from "@mui/icons-material";
import { TRPGCharacter, NPCCharacter, EnemyCharacter } from "@novel-ai-assistant/types";

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

  // キャラクターカードの共通部分
  const CharacterCard: React.FC<{ character: TRPGCharacter | NPCCharacter | EnemyCharacter }> = ({ character }) => (
    <Card 
      sx={{ 
        mb: 1, 
        cursor: "pointer",
        bgcolor: selectedCharacter?.id === character.id ? "action.selected" : "background.paper"
      }}
      onClick={() => onCharacterSelect(character)}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {character.name[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {character.name}
            </Typography>
            {"class" in character && character.class && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {character.race} {character.class}
              </Typography>
            )}
            {"role" in character && character.role && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {character.role}
              </Typography>
            )}
            {"enemyType" in character && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {character.enemyType} (CR {character.challengeRating})
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
        {character.stats && (
          <Stack spacing={0.5}>
            {/* HP */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Favorite fontSize="small" color={getHPColor(character.stats.hitPoints.current, character.stats.hitPoints.max)} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption">
                  HP: {character.stats.hitPoints.current}/{character.stats.hitPoints.max}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(character.stats.hitPoints.current / character.stats.hitPoints.max) * 100}
                  color={getHPColor(character.stats.hitPoints.current, character.stats.hitPoints.max)}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            </Box>

            {/* その他のステータス */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Tooltip title="アーマークラス">
                <Chip
                  icon={<Shield />}
                  label={`AC:${character.stats.armorClass}`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
              <Tooltip title="移動速度">
                <Chip
                  icon={<Speed />}
                  label={`速度:${character.stats.speed}`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
              <Tooltip title="レベル">
                <Chip
                  icon={<Bolt />}
                  label={`Lv.${character.stats.level}`}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
            </Stack>
          </Stack>
        )}

        {/* 状態異常表示 */}
        {"statuses" in character && character.statuses && character.statuses.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
            {character.statuses.map((status, index) => (
              <Chip
                key={index}
                label={status}
                size="small"
                color="warning"
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );

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
                <Card 
                  key={enemy.id}
                  sx={{ 
                    mb: 1, 
                    cursor: "pointer",
                    bgcolor: selectedEnemies.includes(enemy.id) ? "error.light" : "background.paper",
                    borderColor: selectedEnemies.includes(enemy.id) ? "error.main" : "divider",
                    borderWidth: selectedEnemies.includes(enemy.id) ? 2 : 1,
                  }}
                  onClick={() => onEnemyToggle(enemy.id)}
                >
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <CharacterCard character={enemy} />
                  </CardContent>
                </Card>
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
          {selectedCharacter.personality && (
            <Typography variant="body2" color="text.secondary">
              {selectedCharacter.personality}
            </Typography>
          )}
          {selectedCharacter.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              備考: {selectedCharacter.notes}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CharacterDisplay;
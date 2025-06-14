import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
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
  Male,
  Female,
  QuestionMark,
} from "@mui/icons-material";
import { TRPGCharacter, NPCCharacter } from "@trpg-ai-gm/types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function _TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`party-tabpanel-${index}`}
      aria-labelledby={`party-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

interface PartyCharacterDisplayProps {
  playerCharacters: TRPGCharacter[];
  npcs: NPCCharacter[];
  selectedCharacter: TRPGCharacter | NPCCharacter | null;
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onCharacterSelect: (character: TRPGCharacter | NPCCharacter) => void;
  onEditCharacter?: (character: TRPGCharacter | NPCCharacter) => void;
  isSessionStarted?: boolean;
}

const PartyCharacterDisplay: React.FC<PartyCharacterDisplayProps> = ({
  playerCharacters,
  npcs: _npcs,
  selectedCharacter,
  tabValue: _tabValue,
  onTabChange: _onTabChange,
  onCharacterSelect,
  onEditCharacter,
  isSessionStarted = false,
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
  const getCharacterHP = (
    character: TRPGCharacter | NPCCharacter,
  ): { current: number; max: number } => {
    // TRPGCharacterとNPCCharacterの場合はderived.HPを使用
    if ("derived" in character && character.derived) {
      const currentHP = (character as any).currentHP ?? character.derived.HP;
      const maxHP = character.derived.HP;
      return { current: currentHP, max: maxHP };
    }

    // フォールバック
    return { current: 0, max: 100 };
  };

  // キャラクターの状態を判定
  const getCharacterStatus = (character: TRPGCharacter | NPCCharacter) => {
    const { current: hp, max: maxHp } = getCharacterHP(character);
    const percentage = maxHp > 0 ? (hp / maxHp) * 100 : 0;

    if (hp <= 0)
      return {
        status: "dead",
        icon: SentimentVeryDissatisfied,
        color: "error",
        label: "死亡",
      };
    if (percentage <= 25)
      return {
        status: "critical",
        icon: Warning,
        color: "error",
        label: "重傷",
      };
    if (percentage <= 50)
      return {
        status: "wounded",
        icon: LocalHospital,
        color: "warning",
        label: "負傷",
      };
    if (percentage <= 75)
      return {
        status: "injured",
        icon: SentimentSatisfied,
        color: "warning",
        label: "軽傷",
      };
    return {
      status: "healthy",
      icon: CheckCircle,
      color: "success",
      label: "健康",
    };
  };

  // 性別に応じた色とアイコンを取得
  const getGenderInfo = (character: TRPGCharacter | NPCCharacter) => {
    const gender = character.gender || '不明';
    
    switch (gender) {
      case '男性':
        return {
          color: '#2196F3', // 水色
          icon: Male,
          label: '男性',
          chipColor: 'info' as const
        };
      case '女性':
        return {
          color: '#E91E63', // ピンク
          icon: Female,
          label: '女性',
          chipColor: 'secondary' as const
        };
      default:
        return {
          color: '#9E9E9E', // グレー
          icon: QuestionMark,
          label: '不明',
          chipColor: 'default' as const
        };
    }
  };

  // 状態異常の視覚的表現
  const getStatusEffects = (
    character: TRPGCharacter | NPCCharacter,
  ): Array<{ icon: any; color: string; label: string }> => {
    const effects: Array<{ icon: any; color: string; label: string }> = [];

    // キャラクターのstatusEffectsがある場合
    if (
      "statusEffects" in character &&
      character.statusEffects &&
      Array.isArray(character.statusEffects)
    ) {
      character.statusEffects.forEach((effect: any) => {
        switch (effect.type) {
          case "poison":
            effects.push({ icon: Whatshot, color: "success", label: "毒" });
            break;
          case "fire":
            effects.push({ icon: Whatshot, color: "error", label: "炎上" });
            break;
          case "ice":
            effects.push({ icon: AcUnit, color: "info", label: "氷結" });
            break;
          case "blessing":
            effects.push({ icon: WbSunny, color: "warning", label: "祝福" });
            break;
          default:
            effects.push({
              icon: CheckCircle,
              color: "primary",
              label: effect.name,
            });
        }
      });
    }

    return effects;
  };

  // キャラクターカードの共通部分（パーティメンバー専用）
  const PartyCharacterCard: React.FC<{
    character: TRPGCharacter | NPCCharacter;
  }> = ({ character }) => {
    const status = getCharacterStatus(character);
    const statusEffects = getStatusEffects(character);
    const { current: hp, max: maxHp } = getCharacterHP(character);
    const genderInfo = getGenderInfo(character);

    return (
      <Card
        sx={{
          mb: 1,
          cursor: isSessionStarted ? "default" : "pointer",
          bgcolor:
            selectedCharacter?.id === character.id
              ? "action.selected"
              : "background.paper",
          border:
            status.status === "critical" || status.status === "dead"
              ? "2px solid"
              : "1px solid",
          borderColor:
            status.status === "critical" || status.status === "dead"
              ? "error.main"
              : "divider",
          opacity:
            isSessionStarted && selectedCharacter?.id !== character.id
              ? 0.7
              : 1,
        }}
        onClick={() =>
          !isSessionStarted && onCharacterSelect && onCharacterSelect(character)
        }
        data-testid={`character-card-${character.name.replace(/\s+/g, "-").toLowerCase()}`}
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
                      animation:
                        status.status === "critical"
                          ? "pulse 1.5s infinite"
                          : "none",
                      "@keyframes pulse": {
                        "0%": { opacity: 1 },
                        "50%": { opacity: 0.5 },
                        "100%": { opacity: 1 },
                      },
                    }}
                  />
                </Tooltip>
              }
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor:
                    status.status === "dead" ? "grey.500" : genderInfo.color,
                  filter: status.status === "dead" ? "grayscale(1)" : "none",
                }}
              >
                {character.name[0]}
              </Avatar>
            </Badge>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {character.name}
              </Typography>
              
              {/* 性別・基本情報表示 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Chip
                  icon={<genderInfo.icon sx={{ fontSize: 14 }} />}
                  label={genderInfo.label}
                  size="small"
                  color={genderInfo.chipColor}
                  variant="outlined"
                  sx={{ 
                    height: 20, 
                    fontSize: '0.65rem',
                    '& .MuiChip-label': { px: 0.5 },
                    '& .MuiChip-icon': { mr: 0.5, ml: 0.5 }
                  }}
                />
              </Box>

              {/* 職業・種族・年齢表示 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mb: 0.5 }}>
                {character.profession && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    職業: {character.profession}
                  </Typography>
                )}
                {character.nation && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    種族: {character.nation}
                  </Typography>
                )}
                {character.age && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    年齢: {character.age}歳
                  </Typography>
                )}
              </Box>
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
            return (
              <Stack spacing={0.5}>
                {/* HP */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Favorite
                    fontSize="small"
                    color={getHPColor(hp, maxHp)}
                    sx={{
                      animation:
                        status.status === "critical"
                          ? "heartbeat 1.5s infinite"
                          : "none",
                      "@keyframes heartbeat": {
                        "0%": { transform: "scale(1)" },
                        "50%": { transform: "scale(1.2)" },
                        "100%": { transform: "scale(1)" },
                      },
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight:
                          status.status === "critical" ? "bold" : "normal",
                        color:
                          status.status === "dead"
                            ? "error.main"
                            : "text.primary",
                      }}
                    >
                      HP: {hp}/{maxHp}
                      {status.status === "dead" && " (死亡)"}
                      {status.status === "critical" && " (危険)"}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(hp / maxHp) * 100}
                      color={getHPColor(hp, maxHp)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        transition: "all 0.3s ease-in-out",
                        "& .MuiLinearProgress-bar": {
                          transition: "transform 0.5s ease-in-out",
                          animation:
                            status.status === "critical"
                              ? "pulse 2s infinite"
                              : "none",
                        },
                      }}
                    />
                  </Box>
                </Box>

                {/* 状態異常表示 */}
                {statusEffects.length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      gutterBottom
                    >
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
                                fontSize: "0.6rem",
                                height: 20,
                                animation: "fadeIn 0.5s ease-in-out",
                                "@keyframes fadeIn": {
                                  "0%": { opacity: 0, transform: "scale(0.8)" },
                                  "100%": { opacity: 1, transform: "scale(1)" },
                                },
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
                        // TRPGCharacterの場合はarmorからACを計算、または固定値10
                        if ("armor" in character && character.armor) {
                          // 簡易AC計算（胴体装甲値 + 10）
                          return character.armor.body + 10;
                        }
                        return 10;
                      })()}`}
                      size="small"
                      variant="outlined"
                    />
                  </Tooltip>
                  <Tooltip title="移動速度">
                    <Chip
                      icon={<Speed />}
                      label={`速度:${(() => {
                        // TRPGCharacterの場合
                        if ("derived" in character && character.derived) {
                          return character.derived.SW || 30; // Strike Rankを移動速度として使用
                        }
                        return 30;
                      })()}`}
                      size="small"
                      variant="outlined"
                    />
                  </Tooltip>
                  <Tooltip title="レベル">
                    <Chip
                      icon={<Bolt />}
                      label={`Lv.1`}
                      size="small"
                      variant="outlined"
                    />
                  </Tooltip>
                </Stack>
              </Stack>
            );
          })()}

          {/* 状態異常表示 */}
          {"statuses" in character &&
            character.statuses &&
            Array.isArray(character.statuses) &&
            character.statuses.length > 0 && (
              <Stack
                direction="row"
                spacing={0.5}
                flexWrap="wrap"
                sx={{ mt: 1 }}
              >
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
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* NPCタブを削除 - PCのみ表示 */}
      <Box sx={{ p: 1, borderBottom: 1, borderColor: "divider" }}>
        <Typography
          variant="subtitle2"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <PersonOutline />
          プレイヤーキャラクター
          <Badge badgeContent={playerCharacters.length} color="primary" />
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
        {playerCharacters.length > 0 ? (
          playerCharacters.map((pc) => (
            <PartyCharacterCard key={pc.id} character={pc} />
          ))
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ py: 4 }}
          >
            プレイヤーキャラクターがいません
          </Typography>
        )}
      </Box>

      {/* 選択中のキャラクター詳細 */}
      {selectedCharacter && (
        <Box
          sx={{
            borderTop: 1,
            borderColor: "divider",
            p: 2,
            bgcolor: "background.default",
            maxHeight: "30%",
            overflow: "auto",
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            選択中: {selectedCharacter.name}
          </Typography>
          {"personality" in selectedCharacter &&
            (selectedCharacter as any).personality && (
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

export default PartyCharacterDisplay;

import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  Badge,
  Tooltip,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import {
  PersonOutline,
  Edit,
  Warning,
  CheckCircle,
  LocalHospital,
  SentimentVeryDissatisfied,
  SentimentSatisfied,
  Male,
  Female,
  QuestionMark,
} from "@mui/icons-material";
import { TRPGCharacter, NPCCharacter } from "@trpg-ai-gm/types";

// キャラクター状態の型定義
interface CharacterStatus {
  status: "dead" | "critical" | "wounded" | "injured" | "healthy";
  icon: React.ComponentType<any>;
  color: "error" | "warning" | "success";
  label: string;
}

// 性別情報の型定義
interface GenderInfo {
  color: string;
  icon: React.ComponentType<any>;
  label: string;
  chipColor: "info" | "secondary" | "default";
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

const PartyCharacterDisplay: React.FC<PartyCharacterDisplayProps> = React.memo(({
  playerCharacters,
  npcs: _npcs,
  selectedCharacter,
  tabValue: _tabValue,
  onTabChange: _onTabChange,
  onCharacterSelect,
  onEditCharacter,
  isSessionStarted = false,
}) => {

  // 安全にHPの値を取得（TRPGCharacter用）
  const getCharacterHP = (
    character: TRPGCharacter | NPCCharacter,
  ): { current: number; max: number } => {
    // TRPGCharacterとNPCCharacterの場合はderived.HPを使用
    if ("derived" in character && character.derived) {
      // 型安全にcurrentHPを取得
      const characterWithCurrentHP = character as TRPGCharacter & { currentHP?: number };
      const currentHP = characterWithCurrentHP.currentHP ?? character.derived.HP;
      const maxHP = character.derived.HP;
      return { current: currentHP, max: maxHP };
    }

    // フォールバック
    return { current: 0, max: 100 };
  };

  // キャラクターの状態を判定
  const getCharacterStatus = (character: TRPGCharacter | NPCCharacter): CharacterStatus => {
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
  const getGenderInfo = (character: TRPGCharacter | NPCCharacter): GenderInfo => {
    const gender = character.gender || "不明";

    switch (gender) {
      case "男性":
        return {
          color: "#2196F3", // 水色
          icon: Male,
          label: "男性",
          chipColor: "info" as const,
        };
      case "女性":
        return {
          color: "#E91E63", // ピンク
          icon: Female,
          label: "女性",
          chipColor: "secondary" as const,
        };
      default:
        return {
          color: "#9E9E9E", // グレー
          icon: QuestionMark,
          label: "不明",
          chipColor: "default" as const,
        };
    }
  };


  // キャラクターカードの共通部分（パーティメンバー専用）
  const PartyCharacterCard: React.FC<{
    character: TRPGCharacter | NPCCharacter;
  }> = ({ character }) => {
    const status = getCharacterStatus(character);
    const { current: hp, max: maxHp } = getCharacterHP(character);
    const genderInfo = getGenderInfo(character);

    return (
      <Card
        sx={{
          mb: 1,
          cursor: "pointer",
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
        onClick={() => {
          if (onCharacterSelect) {
            onCharacterSelect(character);
          }
        }}
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.5,
                }}
              >
                <Chip
                  icon={<genderInfo.icon sx={{ fontSize: 14 }} />}
                  label={genderInfo.label}
                  size="small"
                  color={genderInfo.chipColor}
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    "& .MuiChip-label": { px: 0.5 },
                    "& .MuiChip-icon": { mr: 0.5, ml: 0.5 },
                  }}
                />
              </Box>

              {/* 職業・種族・年齢表示 */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.25,
                  mb: 0.5,
                }}
              >
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

          {/* ステータス表示 - 一時的に簡素化 */}
          <Box>
            <Typography variant="caption">
              HP: {hp}/{maxHp}
            </Typography>
          </Box>

          {/* 状態異常表示 */}
          {("statuses" in character &&
            character.statuses &&
            Array.isArray(character.statuses) &&
            character.statuses.length > 0) ? (
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
            ) : null}
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
          パーティのキャラクター
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
}, (prevProps, nextProps) => {
  // 基本的なpropsの比較で再レンダリングを制御
  return (
    prevProps.playerCharacters === nextProps.playerCharacters &&
    prevProps.selectedCharacter === nextProps.selectedCharacter &&
    prevProps.onCharacterSelect === nextProps.onCharacterSelect &&
    prevProps.isSessionStarted === nextProps.isSessionStarted
  );
});

export default PartyCharacterDisplay;

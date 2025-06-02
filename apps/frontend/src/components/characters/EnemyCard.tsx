import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import { EnemyCharacter } from "@novel-ai-assistant/types";
import { 
  Button, 
  Box, 
  Chip, 
  Avatar, 
  Divider, 
  Grid,
  LinearProgress,
  Stack 
} from "@mui/material";
import { 
  Dangerous, 
  Shield, 
  Visibility,
  Star,
  LocalFireDepartment,
  Psychology,
  FlashOn
} from "@mui/icons-material";

interface EnemyCardProps {
  enemy: EnemyCharacter;
  onEdit: () => void;
  onDelete: () => void;
}

const EnemyCard: React.FC<EnemyCardProps> = ({
  enemy,
  onEdit,
  onDelete,
}) => {
  // ランクに応じた色とアイコンを取得
  const getRankInfo = (rank: EnemyCharacter["rank"]) => {
    switch (rank) {
      case "モブ":
        return { color: "default" as const, icon: <Visibility /> };
      case "中ボス":
        return { color: "warning" as const, icon: <Shield /> };
      case "ボス":
        return { color: "error" as const, icon: <LocalFireDepartment /> };
      case "EXボス":
        return { color: "secondary" as const, icon: <Star /> };
      default:
        return { color: "default" as const, icon: <Dangerous /> };
    }
  };

  const rankInfo = getRankInfo(enemy.rank);

  // HP の割合を計算
  const hpPercentage = enemy.status ? 
    (enemy.status.currentHp / enemy.derivedStats.hp) * 100 : 100;

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ mr: 1, bgcolor: "error.main" }}>
            <Dangerous />
          </Avatar>
          <Typography variant="h6" component="h2">
            {enemy.name}
          </Typography>
        </Box>

        {/* ランクとタイプ */}
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip
            icon={rankInfo.icon}
            label={enemy.rank}
            size="small"
            color={rankInfo.color}
          />
          <Chip
            label={enemy.type}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Lv.${enemy.level}`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>

        {/* 基本ステータス */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              HP: {enemy.status?.currentHp || enemy.derivedStats.hp}/{enemy.derivedStats.hp}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={hpPercentage} 
              color={hpPercentage > 60 ? "success" : hpPercentage > 30 ? "warning" : "error"}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              MP: {enemy.status?.currentMp || enemy.derivedStats.mp}/{enemy.derivedStats.mp}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              攻撃力: {enemy.derivedStats.attack}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              防御力: {enemy.derivedStats.defense}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 1 }} />

        {/* 特殊スキル（一部表示） */}
        {enemy.skills?.specialSkills && enemy.skills.specialSkills.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              特殊スキル:
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              {enemy.skills.specialSkills.slice(0, 3).map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  sx={{ fontSize: '0.7rem', height: '18px' }}
                />
              ))}
              {enemy.skills.specialSkills.length > 3 && (
                <Chip
                  label={`+${enemy.skills.specialSkills.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '18px' }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* 状態異常 */}
        {enemy.status?.statusEffects && enemy.status.statusEffects.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              状態:
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              {enemy.status.statusEffects.map((effect, index) => (
                <Chip
                  key={index}
                  label={effect}
                  size="small"
                  color="warning"
                  sx={{ fontSize: '0.7rem', height: '18px' }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* 説明 */}
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {enemy.description?.substring(0, 80) || "説明なし"}
          {enemy.description && enemy.description.length > 80 ? "..." : ""}
        </Typography>

        {/* 現在位置 */}
        {enemy.status?.location && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            場所: {enemy.status.location}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button size="small" onClick={onEdit} startIcon={<Psychology />}>
          詳細編集
        </Button>
        <Button size="small" color="error" onClick={onDelete}>
          削除
        </Button>
      </CardActions>
    </Card>
  );
};

export default EnemyCard;
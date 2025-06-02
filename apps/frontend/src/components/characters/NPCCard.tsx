import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
import { NPCCharacter } from "@novel-ai-assistant/types";
import { 
  Button, 
  Box, 
  Chip, 
  Avatar, 
  Divider, 
  Grid,
  Stack 
} from "@mui/material";
import { 
  SmartToy, 
  Work,
  LocationOn,
  QuestionAnswer,
  Build,
  Star,
  SentimentVeryDissatisfied,
  SentimentNeutral,
  SentimentVerySatisfied,
  ReportProblem
} from "@mui/icons-material";

interface NPCCardProps {
  npc: NPCCharacter;
  onEdit: () => void;
  onDelete: () => void;
}

const NPCCard: React.FC<NPCCardProps> = ({
  npc,
  onEdit,
  onDelete,
}) => {
  // 態度に応じたアイコンと色を取得
  const getAttitudeInfo = (attitude: NPCCharacter["attitude"]) => {
    switch (attitude) {
      case "friendly":
        return { 
          color: "success" as const, 
          icon: <SentimentVerySatisfied />, 
          label: "友好的" 
        };
      case "neutral":
        return { 
          color: "default" as const, 
          icon: <SentimentNeutral />, 
          label: "中立" 
        };
      case "hostile":
        return { 
          color: "error" as const, 
          icon: <SentimentVeryDissatisfied />, 
          label: "敵対的" 
        };
      case "unknown":
        return { 
          color: "warning" as const, 
          icon: <ReportProblem />, 
          label: "不明" 
        };
      default:
        return { 
          color: "default" as const, 
          icon: <SentimentNeutral />, 
          label: "中立" 
        };
    }
  };

  const attitudeInfo = getAttitudeInfo(npc.attitude);

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ mr: 1, bgcolor: "primary.main" }}>
            <SmartToy />
          </Avatar>
          <Typography variant="h6" component="h2">
            {npc.name}
          </Typography>
        </Box>

        {/* タイプと職業 */}
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip
            icon={<SmartToy />}
            label="NPC"
            size="small"
            color="primary"
          />
          {npc.occupation && (
            <Chip
              icon={<Work />}
              label={npc.occupation}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>

        {/* 態度 */}
        <Box sx={{ mb: 1 }}>
          <Chip
            icon={attitudeInfo.icon}
            label={attitudeInfo.label}
            size="small"
            color={attitudeInfo.color}
          />
        </Box>

        {/* 基本情報 */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          {npc.location && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" />
                場所: {npc.location}
              </Typography>
            </Grid>
          )}
          {npc.profession && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                職業: {npc.profession}
              </Typography>
            </Grid>
          )}
          {npc.gender && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                性別: {npc.gender}
              </Typography>
            </Grid>
          )}
          {npc.age && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                年齢: {npc.age}歳
              </Typography>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ my: 1 }} />

        {/* サービス */}
        {npc.services && npc.services.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Build fontSize="small" />
              サービス:
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              {npc.services.slice(0, 3).map((service, index) => (
                <Chip
                  key={index}
                  label={service}
                  size="small"
                  variant="outlined"
                  color="secondary"
                  sx={{ fontSize: '0.7rem', height: '18px' }}
                />
              ))}
              {npc.services.length > 3 && (
                <Chip
                  label={`+${npc.services.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '18px' }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* クエスト関連 */}
        {npc.questIds && npc.questIds.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star fontSize="small" />
              関連クエスト: {npc.questIds.length}件
            </Typography>
          </Box>
        )}

        {/* 知識 */}
        {npc.knowledge && npc.knowledge.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <QuestionAnswer fontSize="small" />
              知識:
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              {npc.knowledge.slice(0, 2).map((knowledge, index) => (
                <Chip
                  key={index}
                  label={knowledge}
                  size="small"
                  variant="outlined"
                  color="info"
                  sx={{ fontSize: '0.7rem', height: '18px' }}
                />
              ))}
              {npc.knowledge.length > 2 && (
                <Chip
                  label={`+${npc.knowledge.length - 2}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '18px' }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* 説明 */}
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {npc.description?.substring(0, 80) || "説明なし"}
          {npc.description && npc.description.length > 80 ? "..." : ""}
        </Typography>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button size="small" onClick={onEdit} startIcon={<SmartToy />}>
          編集
        </Button>
        <Button size="small" color="error" onClick={onDelete}>
          削除
        </Button>
      </CardActions>
    </Card>
  );
};

export default NPCCard;
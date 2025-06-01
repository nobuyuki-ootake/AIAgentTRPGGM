import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
// import IconButton from "@mui/material/IconButton"; // Unused
// import EditIcon from "@mui/icons-material/Edit"; // Unused
// import DeleteIcon from "@mui/icons-material/Delete"; // Unused
import { TRPGCharacter } from "@novel-ai-assistant/types";
import { Button, Box, Chip, Avatar, Divider, Grid } from "@mui/material";
import { Person, SmartToy, Dangerous, Star } from "@mui/icons-material";

interface CharacterCardProps {
  character: TRPGCharacter;
  onEdit: () => void;
  onDelete: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
}) => {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ mr: 1, bgcolor: "primary.main" }}>
            {character.name.charAt(0)}
          </Avatar>
          <Typography variant="h6" component="h2">
            {character.name}
          </Typography>
        </Box>
        <Chip
          icon={
            character.characterType === "PC" ? (
              <Person />
            ) : character.characterType === "NPC" ? (
              <SmartToy />
            ) : (
              <Dangerous />
            )
          }
          label={
            character.characterType === "PC"
              ? "PC"
              : character.characterType === "NPC"
              ? "NPC"
              : "エネミー"
          }
          size="small"
          color={
            character.characterType === "PC"
              ? "primary"
              : character.characterType === "Enemy"
              ? "error"
              : "default"
          }
          sx={{ mb: 1 }}
        />
        {/* TRPGキャラクター情報表示 */}
        {character.race && (
          <Typography variant="body2" color="text.secondary">
            <strong>種族:</strong> {character.race}
          </Typography>
        )}
        {character.class && (
          <Typography variant="body2" color="text.secondary">
            <strong>クラス:</strong> {character.class}
          </Typography>
        )}
        {character.playerName && (
          <Typography variant="body2" color="text.secondary">
            <strong>プレイヤー:</strong> {character.playerName}
          </Typography>
        )}
        
        <Divider sx={{ my: 1 }} />
        
        {/* 基本ステータス */}
        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              レベル: {character.stats?.level || 1}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              HP: {character.stats?.hitPoints?.current || 0}/{character.stats?.hitPoints?.max || 0}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              AC: {character.stats?.armorClass || 10}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              速度: {character.stats?.speed || 30}
            </Typography>
          </Grid>
        </Grid>
        
        {/* 簡易説明 */}
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          {character.appearance?.substring(0, 80) || character.personality?.substring(0, 80) || "詳細なし"}
          {((character.appearance && character.appearance.length > 80) || 
            (character.personality && character.personality.length > 80)) ? "..." : ""}
        </Typography>
      </CardContent>
      <CardActions sx={{ pt: 0 }}>
        <Button size="small" onClick={onEdit}>
          シート編集
        </Button>
        <Button size="small" color="error" onClick={onDelete}>
          削除
        </Button>
      </CardActions>
    </Card>
  );
};

export default CharacterCard;

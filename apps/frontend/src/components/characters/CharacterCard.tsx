import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActions from "@mui/material/CardActions";
// import IconButton from "@mui/material/IconButton"; // Unused
// import EditIcon from "@mui/icons-material/Edit"; // Unused
// import DeleteIcon from "@mui/icons-material/Delete"; // Unused
import { Character } from "@novel-ai-assistant/types";
import { Button, Box, Chip, Avatar } from "@mui/material";

interface CharacterCardProps {
  character: Character;
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
          label={
            character.role === "protagonist"
              ? "主人公"
              : character.role === "antagonist"
              ? "敵役"
              : "脇役"
          }
          size="small"
          color={
            character.role === "protagonist"
              ? "primary"
              : character.role === "antagonist"
              ? "error"
              : "default"
          }
          sx={{ mb: 1 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {character.description?.substring(0, 100)}
          {character.description && character.description.length > 100
            ? "..."
            : ""}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={onEdit}>
          編集
        </Button>
        <Button size="small" color="error" onClick={onDelete}>
          削除
        </Button>
      </CardActions>
    </Card>
  );
};

export default CharacterCard;

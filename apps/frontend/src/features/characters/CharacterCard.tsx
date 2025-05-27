import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Chip,
  Button,
  IconButton,
  Box,
  Avatar,
} from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { Character } from "@novel-ai-assistant/types";
import { characterIcons } from "./characterUtils";
// import { useCharactersContext } from "../../contexts/CharactersContext"; // 未使用のためコメントアウト

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
}

/**
 * キャラクターカードコンポーネント
 * グリッド表示で使用される個別のキャラクターカード
 */
const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
}) => {
  // カード上のアバター表示
  const getCharacterAvatar = () => {
    if (character.imageUrl) {
      if (character.imageUrl.startsWith("data:text/plain")) {
        // 絵文字の場合
        const emoji = decodeURIComponent(character.imageUrl.split(",")[1]);
        const iconConfig =
          characterIcons[character.role as keyof typeof characterIcons] ||
          characterIcons.default;
        return (
          <Avatar
            sx={{
              width: "100%",
              height: 200,
              fontSize: "5rem",
              bgcolor: iconConfig.color,
              borderRadius: 0,
            }}
          >
            {emoji}
          </Avatar>
        );
      } else {
        // 通常の画像の場合
        return (
          <CardMedia
            component="img"
            height="200"
            image={character.imageUrl}
            alt={character.name}
            sx={{ objectFit: "cover" }}
          />
        );
      }
    } else {
      // 画像がない場合は役割に応じたデフォルトアイコン
      const iconConfig =
        characterIcons[character.role as keyof typeof characterIcons] ||
        characterIcons.default;
      return (
        <Avatar
          sx={{
            width: "100%",
            height: 200,
            fontSize: "5rem",
            bgcolor: iconConfig.color,
            borderRadius: 0,
          }}
        >
          {iconConfig.emoji}
        </Avatar>
      );
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "0.3s",
        "&:hover": {
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
    >
      {getCharacterAvatar()}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h5" component="div" gutterBottom>
          {character.name}
        </Typography>
        <Chip
          label={
            {
              protagonist: "主人公",
              antagonist: "敵役",
              supporting: "脇役",
            }[character.role]
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
        {character.gender && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            性別: {character.gender}
          </Typography>
        )}
        {character.birthDate && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            生年月日: {character.birthDate}
          </Typography>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            display: "-webkit-box",
          }}
        >
          {character.description || "説明がありません"}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onEdit(character)}>
          詳細
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          size="small"
          color="primary"
          onClick={() => onEdit(character)}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(character.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default CharacterCard;

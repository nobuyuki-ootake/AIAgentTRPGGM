import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Chip,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { Character } from "@novel-ai-assistant/types";
import CharacterCard from "./CharacterCard";
// import { useCharactersContext } from "../../contexts/CharactersContext"; // 未使用のためコメントアウト

interface CharacterListProps {
  characters: Character[];
  viewMode: "list" | "grid";
  onAddCharacter: () => void;
  onEditCharacter: (character: Character) => void;
  onDeleteCharacter: (id: string) => void;
}

/**
 * キャラクター一覧コンポーネント
 */
const CharacterList: React.FC<CharacterListProps> = ({
  characters,
  viewMode,
  onAddCharacter,
  onEditCharacter,
  onDeleteCharacter,
}) => {
  // キャラクターが存在しない場合に表示する空の状態コンポーネント
  const EmptyState = () => (
    <Paper
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        まだキャラクターがありません
      </Typography>
      <Button
        variant="outlined"
        startIcon={<PersonAddIcon />}
        onClick={onAddCharacter}
      >
        キャラクターを作成する
      </Button>
    </Paper>
  );

  // グリッド表示のコンポーネント
  const GridView = () => (
    <Box>
      {characters.length === 0 ? (
        <EmptyState />
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {characters.map((character) => (
            <Box
              key={character.id}
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc(50% - 12px)",
                  md: "calc(33.333% - 16px)",
                  lg: "calc(25% - 18px)",
                },
              }}
            >
              <CharacterCard
                character={character}
                onEdit={onEditCharacter}
                onDelete={onDeleteCharacter}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  // リスト表示のコンポーネント
  const ListView = () => (
    <Paper elevation={1}>
      {characters.length === 0 ? (
        <EmptyState />
      ) : (
        <List>
          {characters.map((character, index) => (
            <React.Fragment key={character.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => onEditCharacter(character)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => onDeleteCharacter(character.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    src={character.imageUrl}
                    alt={character.name}
                    sx={{ width: 56, height: 56, mr: 1 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="h6">{character.name}</Typography>
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
                      />
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography variant="body2" component="span">
                        {character.gender && `性別: ${character.gender}`}
                        {character.gender && character.birthDate && " | "}
                        {character.birthDate &&
                          `生年月日: ${character.birthDate}`}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          display: "-webkit-box",
                        }}
                      >
                        {character.description || "説明がありません"}
                      </Typography>
                    </React.Fragment>
                  }
                  sx={{ ml: 1 }}
                />
              </ListItem>
              {index < characters.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );

  return viewMode === "grid" ? <GridView /> : <ListView />;
};

export default CharacterList;

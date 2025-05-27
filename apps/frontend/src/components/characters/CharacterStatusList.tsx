import React from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Chip,
  Stack,
} from "@mui/material";
import { CharacterStatus } from "@novel-ai-assistant/types";
import EditIcon from "@mui/icons-material/Edit";
import { Delete as DeleteIcon } from "@mui/icons-material";

interface CharacterStatusListProps {
  statuses: CharacterStatus[];
  onEdit: (status: CharacterStatus) => void;
  onDelete: (statusId: string) => void;
}

const CharacterStatusList: React.FC<CharacterStatusListProps> = ({
  statuses,
  onEdit,
  onDelete,
}) => {
  if (!statuses || statuses.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        現在設定されている状態はありません。
      </Typography>
    );
  }

  return (
    <List dense sx={{ width: "100%" }}>
      {statuses.map((status) => (
        <ListItem
          key={status.id}
          secondaryAction={
            <Stack direction="row" spacing={1}>
              <Tooltip title="編集">
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => onEdit(status)}
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="削除">
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => onDelete(status.id)}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          }
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            "&:last-child": {
              borderBottom: "none",
            },
            py: 1.5,
          }}
        >
          <ListItemText
            primary={status.name}
            secondaryTypographyProps={{ component: "div" }}
            secondary={
              <>
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {status.description || "説明なし"}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 0.5 }}
                  alignItems="center"
                >
                  <Chip label={status.type} size="small" variant="outlined" />
                  <Chip
                    label={status.mobility}
                    size="small"
                    variant="outlined"
                    color={
                      status.mobility === "normal"
                        ? "success"
                        : status.mobility === "slow"
                        ? "warning"
                        : status.mobility === "impossible"
                        ? "error"
                        : "default"
                    }
                  />
                </Stack>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default CharacterStatusList;

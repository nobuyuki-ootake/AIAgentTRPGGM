import React from "react";
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button,
  SelectChangeEvent,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from "@mui/icons-material";
import { PlotElement } from "@trpg-ai-gm/types";
import { CalendarMonth, EmojiEvents, CheckCircle } from "@mui/icons-material";

interface PlotItemProps {
  item: PlotElement;
  onStatusChange: (
    id: string,
    event: SelectChangeEvent<"決定" | "検討中">
  ) => void;
  onDelete: (id: string) => void;
  onEdit: (item: PlotElement) => void;
}

const PlotItem: React.FC<PlotItemProps> = ({
  item,
  onStatusChange,
  onDelete,
  onEdit,
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 2,
        display: "flex",
        alignItems: "flex-start",
        borderLeft: `6px solid ${
          item.status === "決定" ? "success.main" : "warning.main"
        }`,
        backgroundColor: item.status === "決定" ? "success.light" : "transparent",
        opacity: item.status === "決定" ? 0.9 : 1,
      }}
    >
      <Box sx={{ mr: 1, color: "grey.500" }}>
        <DragIcon />
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1, gap: 1 }}>
            {item.status === "決定" ? (
              <CheckCircle color="success" fontSize="small" />
            ) : (
              <EmojiEvents color="warning" fontSize="small" />
            )}
            <Typography variant="h6">
              {item.title}
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 100, mr: 1 }}>
            <InputLabel id={`status-label-${item.id}`}>ステータス</InputLabel>
            <Select
              labelId={`status-label-${item.id}`}
              value={item.status}
              label="ステータス"
              onChange={(e) =>
                onStatusChange(
                  item.id,
                  e as SelectChangeEvent<"決定" | "検討中">
                )
              }
            >
              <MenuItem value="決定">完了</MenuItem>
              <MenuItem value="検討中">未実施</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={() => onDelete(item.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
          {item.description || "クエスト詳細が設定されていません"}
        </Typography>
        <Button size="small" onClick={() => onEdit(item)} sx={{ mt: 1 }}>
          編集
        </Button>
      </Box>
    </Paper>
  );
};

export default PlotItem;

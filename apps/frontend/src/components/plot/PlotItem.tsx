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
import { PlotElement } from "@novel-ai-assistant/types";

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
          item.status === "決定" ? "primary.main" : "grey.400"
        }`,
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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {item.title}
          </Typography>
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
              <MenuItem value="決定">決定</MenuItem>
              <MenuItem value="検討中">検討中</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={() => onDelete(item.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {item.description || "詳細なし"}
        </Typography>
        <Button size="small" onClick={() => onEdit(item)} sx={{ mt: 1 }}>
          編集
        </Button>
      </Box>
    </Paper>
  );
};

export default PlotItem;

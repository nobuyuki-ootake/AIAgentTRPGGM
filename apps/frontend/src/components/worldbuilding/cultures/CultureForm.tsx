import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Typography,
  Box,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { CultureElement } from "@novel-ai-assistant/types";

interface CultureFormProps {
  open: boolean;
  culture: CultureElement | null;
  isEditing: boolean;
  newValue: string;
  newCustom: string;
  onClose: () => void;
  onSave: () => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onAddValue: () => void;
  onRemoveValue: (index: number) => void;
  onAddCustom: () => void;
  onRemoveCustom: (index: number) => void;
  setNewValue: (value: string) => void;
  setNewCustom: (value: string) => void;
}

export const CultureForm: React.FC<CultureFormProps> = ({
  open,
  culture,
  isEditing,
  newValue,
  newCustom,
  onClose,
  onSave,
  onInputChange,
  onAddValue,
  onRemoveValue,
  onAddCustom,
  onRemoveCustom,
  setNewValue,
  setNewCustom,
}) => {
  if (!culture) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? "文化を編集" : "新しい文化を追加"}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <Box>
            <TextField
              margin="dense"
              name="name"
              label="名前"
              type="text"
              fullWidth
              value={culture.name}
              onChange={onInputChange}
            />
          </Box>

          <Box>
            <TextField
              margin="dense"
              name="description"
              label="説明"
              type="text"
              fullWidth
              multiline
              rows={2}
              value={culture.description}
              onChange={onInputChange}
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              価値観
            </Typography>

            <Box sx={{ display: "flex", mb: 1 }}>
              <TextField
                margin="dense"
                label="新しい価値観を追加"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddValue();
                  }
                }}
                fullWidth
              />
              <IconButton
                sx={{ ml: 1, alignSelf: "center" }}
                onClick={onAddValue}
                color="primary"
                disabled={!newValue.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {culture.values.map((value: string, index: number) => (
                <Chip
                  key={`value-form-${index}`}
                  label={value}
                  onDelete={() => onRemoveValue(index)}
                />
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              習慣
            </Typography>

            <Box sx={{ display: "flex", mb: 1 }}>
              <TextField
                margin="dense"
                label="新しい習慣を追加"
                value={newCustom}
                onChange={(e) => setNewCustom(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddCustom();
                  }
                }}
                fullWidth
              />
              <IconButton
                sx={{ ml: 1, alignSelf: "center" }}
                onClick={onAddCustom}
                color="primary"
                disabled={!newCustom.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {culture.customs.map((custom: string, index: number) => (
                <Chip
                  key={`custom-form-${index}`}
                  label={custom}
                  onDelete={() => onRemoveCustom(index)}
                />
              ))}
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              詳細情報
            </Typography>

            <Stack spacing={2}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  margin="dense"
                  name="socialStructure"
                  label="社会構造"
                  type="text"
                  fullWidth
                  value={culture.socialStructure || ""}
                  onChange={onInputChange}
                />

                <TextField
                  margin="dense"
                  name="government"
                  label="統治形態"
                  type="text"
                  fullWidth
                  value={culture.government || ""}
                  onChange={onInputChange}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  margin="dense"
                  name="religion"
                  label="宗教"
                  type="text"
                  fullWidth
                  value={culture.religion || ""}
                  onChange={onInputChange}
                />

                <TextField
                  margin="dense"
                  name="language"
                  label="言語"
                  type="text"
                  fullWidth
                  value={culture.language || ""}
                  onChange={onInputChange}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  margin="dense"
                  name="art"
                  label="芸術"
                  type="text"
                  fullWidth
                  value={culture.art || ""}
                  onChange={onInputChange}
                />

                <TextField
                  margin="dense"
                  name="technology"
                  label="技術"
                  type="text"
                  fullWidth
                  value={culture.technology || ""}
                  onChange={onInputChange}
                />
              </Box>

              <TextField
                margin="dense"
                name="notes"
                label="メモ"
                type="text"
                fullWidth
                multiline
                rows={2}
                value={culture.notes || ""}
                onChange={onInputChange}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={onSave}
          color="primary"
          disabled={!culture.name.trim()}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

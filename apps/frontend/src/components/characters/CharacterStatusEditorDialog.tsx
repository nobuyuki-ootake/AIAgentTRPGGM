import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
} from "@mui/material";
import { CharacterStatus } from "@novel-ai-assistant/types";
import { v4 as uuidv4 } from "uuid";

interface CharacterStatusEditorDialogProps {
  open: boolean;
  editingStatus?: CharacterStatus | null;
  onClose: () => void;
  onSave: (status: CharacterStatus) => void;
}

const CharacterStatusEditorDialog: React.FC<
  CharacterStatusEditorDialogProps
> = ({ open, editingStatus, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"life" | "abnormal" | "custom">("custom");
  const [mobility, setMobility] = useState<"normal" | "slow" | "impossible">(
    "normal"
  );
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && editingStatus) {
      setName(editingStatus.name);
      setType(editingStatus.type);
      setMobility(editingStatus.mobility);
      setDescription(editingStatus.description || "");
      setErrors({});
    } else if (open) {
      // 新規作成モードの初期化
      setName("");
      setType("custom");
      setMobility("normal");
      setDescription("");
      setErrors({});
    }
  }, [open, editingStatus]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "状態名は必須です。";
    }
    // 他にもバリデーションルールがあればここに追加
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }
    const statusToSave: CharacterStatus = {
      id: editingStatus?.id || uuidv4(),
      name: name.trim(),
      type,
      mobility,
      description: description.trim(),
    };
    onSave(statusToSave);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingStatus ? "状態を編集" : "新しい状態を作成"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <TextField
            label="状態名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            autoFocus
          />
          <FormControl fullWidth error={!!errors.type}>
            <InputLabel id="status-type-label">タイプ</InputLabel>
            <Select
              labelId="status-type-label"
              value={type}
              label="タイプ"
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <MenuItem value="life">生死</MenuItem>
              <MenuItem value="abnormal">異常</MenuItem>
              <MenuItem value="custom">カスタム</MenuItem>
            </Select>
            {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
          </FormControl>
          <FormControl fullWidth error={!!errors.mobility}>
            <InputLabel id="status-mobility-label">移動制限</InputLabel>
            <Select
              labelId="status-mobility-label"
              value={mobility}
              label="移動制限"
              onChange={(e) => setMobility(e.target.value as typeof mobility)}
            >
              <MenuItem value="normal">歩行可能</MenuItem>
              <MenuItem value="slow">鈍足で歩行可能</MenuItem>
              <MenuItem value="impossible">歩行不可</MenuItem>
            </Select>
            {errors.mobility && (
              <FormHelperText>{errors.mobility}</FormHelperText>
            )}
          </FormControl>
          <TextField
            label="説明（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained">
          {editingStatus ? "更新" : "作成"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CharacterStatusEditorDialog;

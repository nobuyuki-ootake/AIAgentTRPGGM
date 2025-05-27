import React from "react";
import {
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { TimelineSettings } from "../../hooks/useTimeline";

interface TimelineSettingsDialogProps {
  open: boolean;
  timelineSettings: TimelineSettings;
  onClose: () => void;
  onSave: () => void;
  onSettingsChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const TimelineSettingsDialog: React.FC<TimelineSettingsDialogProps> = ({
  open,
  timelineSettings,
  onClose,
  onSave,
  onSettingsChange,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>タイムライン設定</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            name="startDate"
            label="開始日"
            type="date"
            fullWidth
            value={timelineSettings.startDate}
            onChange={onSettingsChange}
            InputLabelProps={{ shrink: true }}
            helperText="タイムラインの開始日（デフォルトは今日）"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={onSave} color="primary" variant="contained">
          設定を保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimelineSettingsDialog;

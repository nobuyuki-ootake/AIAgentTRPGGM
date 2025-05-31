import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  SmartToy as SmartToyIcon,
  RestartAlt as RestartAltIcon,
} from "@mui/icons-material";
import TimelineEventCard from "./TimelineEventCard";
import { TimelineItem } from "../../hooks/useTimeline";
import { TimelineEvent } from "@novel-ai-assistant/types";

interface TimelineEventListProps {
  timelineItems: TimelineItem[];
  onAddEvent: () => void;
  onAIAssist: () => void;
  onEditEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onResetTimeline: () => void;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  getCharacterNameById?: (id: string) => string;
  getPlaceNameById?: (id: string) => string;
}

const TimelineEventList: React.FC<TimelineEventListProps> = ({
  timelineItems,
  onAddEvent,
  onAIAssist,
  onEditEvent,
  onDeleteEvent,
  onResetTimeline,
  hasUnsavedChanges,
  onSave,
  getCharacterNameById,
  getPlaceNameById,
}) => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleResetClick = () => {
    setResetDialogOpen(true);
  };

  const handleResetConfirm = () => {
    onResetTimeline();
    setResetDialogOpen(false);
  };

  const handleResetCancel = () => {
    setResetDialogOpen(false);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">タイムラインイベント一覧</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddEvent}
            size="medium"
          >
            イベント追加
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SmartToyIcon />}
            onClick={onAIAssist}
            size="medium"
          >
            AIでイベント生成
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<RestartAltIcon />}
            onClick={handleResetClick}
            size="medium"
            disabled={timelineItems.length === 0}
          >
            タイムラインリセット
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            size="medium"
          >
            保存
          </Button>
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: "background.paper",
          minHeight: "100px",
        }}
      >
        {timelineItems.length === 0 ? (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            イベントはまだありません。「イベント追加」ボタンをクリックして最初のイベントを追加してください。
          </Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            {timelineItems.map((item, index) => {
              const eventForCard: TimelineEvent = {
                id: item.id,
                title: item.title,
                description: item.description || "",
                date: item.date,
                relatedCharacters: item.relatedCharacters || [],
                relatedPlaces: [],
                placeId: item.placeId,
                order: index,
                eventType: item.eventType,
              };
              const placeNameForCard =
                item.placeId && getPlaceNameById
                  ? getPlaceNameById(item.placeId)
                  : item.placeName || "場所不明";
              return (
                <TimelineEventCard
                  key={item.id}
                  event={eventForCard}
                  onEdit={onEditEvent}
                  onDelete={onDeleteEvent}
                  placeName={placeNameForCard}
                  getCharacterNameById={getCharacterNameById}
                  dndContextType="list"
                />
              );
            })}
          </Box>
        )}
      </Paper>

      {/* リセット確認ダイアログ */}
      <Dialog
        open={resetDialogOpen}
        onClose={handleResetCancel}
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
      >
        <DialogTitle id="reset-dialog-title">
          タイムラインリセットの確認
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="reset-dialog-description">
            すべてのタイムラインイベントが削除されます。この操作は元に戻すことができません。
            本当にタイムラインをリセットしますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetCancel} color="primary">
            キャンセル
          </Button>
          <Button
            onClick={handleResetConfirm}
            color="warning"
            variant="contained"
          >
            リセット
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TimelineEventList;

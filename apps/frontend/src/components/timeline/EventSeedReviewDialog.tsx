import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  List,
  Typography,
} from "@mui/material";
import { TimelineEventSeed } from "@novel-ai-assistant/types";
import DraggableEventSeedItem from "./DraggableEventSeedItem";

export interface EventSeedReviewDialogProps {
  open: boolean;
  onClose: () => void;
  eventSeeds: TimelineEventSeed[];
  onConfirm: (selectedSeeds: TimelineEventSeed[]) => void;
  // 将来的にキャラクター名や場所名を表示するために必要になる可能性があります
  // getCharacterName?: (id: string) => string;
  // getPlaceName?: (id: string) => string;
}

const EventSeedReviewDialog: React.FC<EventSeedReviewDialogProps> = ({
  open,
  onClose,
  eventSeeds,
  onConfirm,
}) => {
  const [selectedSeeds, setSelectedSeeds] = useState<TimelineEventSeed[]>([]);

  useEffect(() => {
    // ダイアログが開くたびに選択状態をリセット
    if (open) {
      setSelectedSeeds([]);
    }
  }, [open]);

  const handleToggle = (seed: TimelineEventSeed) => () => {
    const currentIndex = selectedSeeds.findIndex((s) => s.id === seed.id);
    const newSelectedSeeds = [...selectedSeeds];

    if (currentIndex === -1) {
      newSelectedSeeds.push(seed);
    } else {
      newSelectedSeeds.splice(currentIndex, 1);
    }
    setSelectedSeeds(newSelectedSeeds);
  };

  const handleConfirm = () => {
    onConfirm(selectedSeeds);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>AIが生成したイベント候補</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" gutterBottom>
          以下のイベント候補からタイムラインに追加したいものを選択してください。
        </Typography>
        {eventSeeds.length === 0 ? (
          <Typography
            sx={{ textAlign: "center", color: "text.secondary", mt: 2 }}
          >
            表示できるイベント候補はありません。
          </Typography>
        ) : (
          <List sx={{ maxHeight: "60vh", overflow: "auto" }}>
            {eventSeeds.map((seed) => (
              <DraggableEventSeedItem
                key={seed.id}
                seed={seed}
                isSelected={selectedSeeds.some((s) => s.id === seed.id)}
                onToggle={handleToggle(seed)}
              />
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedSeeds.length === 0}
        >
          選択した {selectedSeeds.length} 件をタイムラインに追加
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventSeedReviewDialog;

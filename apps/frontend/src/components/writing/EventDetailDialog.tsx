import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import {
  Event as EventIcon,
  Person as PersonIcon,
  Place as PlaceIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { TimelineEvent } from "@novel-ai-assistant/types";

interface EventDetailDialogProps {
  open: boolean;
  event: TimelineEvent | null;
  onClose: () => void;
  onAddToChapter?: () => void;
  isAlreadyInChapter: boolean;
  getCharacterName: (characterId: string) => string;
  getPlaceName: (placeId: string) => string;
}

const EventDetailDialog: React.FC<EventDetailDialogProps> = ({
  open,
  event,
  onClose,
  onAddToChapter,
  isAlreadyInChapter,
  getCharacterName,
  getPlaceName,
}) => {
  if (!event) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <EventIcon color="primary" />
          <Typography variant="h6">{event.title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            {event.description}
          </Typography>
        </Box>

        {event.date && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              日付
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {event.date}
            </Typography>
          </Box>
        )}

        {event.relatedCharacters && event.relatedCharacters.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <PersonIcon fontSize="small" />
              関連キャラクター
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {event.relatedCharacters.map((characterId) => (
                <Chip
                  key={characterId}
                  label={getCharacterName(characterId)}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}

        {event.relatedPlaces && event.relatedPlaces.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <PlaceIcon fontSize="small" />
              関連場所
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {event.relatedPlaces.map((placeId) => (
                <Chip
                  key={placeId}
                  label={getPlaceName(placeId)}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              ))}
            </Box>
          </Box>
        )}

        {event.placeId && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              発生場所
            </Typography>
            <Chip
              label={getPlaceName(event.placeId)}
              size="small"
              variant="filled"
              color="secondary"
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            イベントID: {event.id}
          </Typography>
          {isAlreadyInChapter && (
            <Chip
              label="この章に割り当て済み"
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
        {onAddToChapter && !isAlreadyInChapter && (
          <Button
            onClick={onAddToChapter}
            variant="contained"
            startIcon={<AddIcon />}
          >
            この章に追加
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EventDetailDialog;

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
} from "@mui/material";
import { Search as SearchIcon, Event as EventIcon } from "@mui/icons-material";
import {
  TimelineEvent,
  Character,
  PlaceElement,
  PlotElement,
} from "@novel-ai-assistant/types";

interface AssignEventsDialogProps {
  open: boolean;
  events: TimelineEvent[];
  selectedEvents: string[];
  characters: Character[];
  places: PlaceElement[];
  allPlots: PlotElement[];
  onClose: () => void;
  onToggle: (eventId: string) => void;
  onSave: () => void;
  onViewEventDetails: (eventId: string) => void;
  onAddNewEvent: (event: TimelineEvent) => void;
  getCharacterName: (characterId: string) => string;
  getPlaceName: (placeId: string) => string;
}

const AssignEventsDialog: React.FC<AssignEventsDialogProps> = ({
  open,
  events,
  selectedEvents,
  onClose,
  onToggle,
  onSave,
  onViewEventDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">イベントの割り当て</Typography>
          <Chip
            label={`${selectedEvents.length}個選択中`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="イベントを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {filteredEvents.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm
                ? "検索条件に一致するイベントがありません"
                : "イベントがありません"}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: "400px", overflow: "auto" }}>
            {filteredEvents.map((event) => {
              const isSelected = selectedEvents.includes(event.id);
              return (
                <ListItem key={event.id} disablePadding>
                  <ListItemButton
                    onClick={() => onToggle(event.id)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      border: 1,
                      borderColor: isSelected ? "primary.main" : "divider",
                      backgroundColor: isSelected
                        ? "primary.light"
                        : "transparent",
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggle(event.id)}
                        color="primary"
                      />
                    </ListItemIcon>
                    <ListItemIcon>
                      <EventIcon color={isSelected ? "primary" : "action"} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle2"
                          fontWeight={isSelected ? "bold" : "normal"}
                        >
                          {event.title}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {event.description}
                        </Typography>
                      }
                    />
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewEventDetails(event.id);
                      }}
                    >
                      詳細
                    </Button>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained">
          保存 ({selectedEvents.length}個のイベント)
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignEventsDialog;

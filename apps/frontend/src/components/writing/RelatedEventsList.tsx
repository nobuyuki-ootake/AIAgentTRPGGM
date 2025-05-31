import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper,
  Button,
  IconButton,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { TimelineEvent } from "@novel-ai-assistant/types";
// import { useWritingContext } from "../../contexts/WritingContext"; // 未使用のためコメントアウト

interface RelatedEventsListProps {
  events: TimelineEvent[];
  relatedEventIds: string[];
  onViewEvent: (eventId: string) => void;
  onAssignEvents: () => void;
}

const RelatedEventsList: React.FC<RelatedEventsListProps> = ({
  events,
  relatedEventIds,
  onViewEvent,
  onAssignEvents,
}) => {
  // 選択された章に関連するイベントだけをフィルタリング
  const relatedEvents = events.filter((event) =>
    relatedEventIds.includes(event.id)
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">関連イベント</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AssignmentIcon />}
          onClick={onAssignEvents}
        >
          割り当て
        </Button>
      </Box>

      {relatedEvents.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            関連イベントが設定されていません
          </Typography>
          <Button
            variant="text"
            size="small"
            onClick={onAssignEvents}
            sx={{ mt: 1 }}
          >
            イベントを割り当てる
          </Button>
        </Box>
      ) : (
        <List sx={{ maxHeight: "400px", overflow: "auto" }}>
          {relatedEvents.map((event) => (
            <ListItem key={event.id} disablePadding>
              <ListItemButton
                onClick={() => onViewEvent(event.id)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: "background.default",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                  transition: "background-color 0.2s ease",
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {event.title}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="caption"
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
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewEvent(event.id);
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RelatedEventsList;

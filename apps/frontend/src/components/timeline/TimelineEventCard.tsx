import React from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Tooltip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { TimelineEvent } from "@novel-ai-assistant/types";
import moment from "moment";
import { getEventTypeIconComponent } from "./TimelineUtils";
import { useDraggable } from "@dnd-kit/core";

interface TimelineEventCardProps {
  event: TimelineEvent;
  placeName?: string;
  plotName?: string;
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
  getCharacterNameById?: (id: string) => string;
  dndContextType: "list" | "chart" | "overlay";
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  placeName,
  plotName,
  onEdit,
  onDelete,
  getCharacterNameById,
  dndContextType,
}) => {
  const EventTypeIcon = getEventTypeIconComponent(event.eventType);

  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: `${dndContextType}-event-${event.id}`,
      data: {
        type: `${dndContextType}-timeline-event`,
        eventData: event,
        originalEventId: event.id,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1300,
      }
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      elevation={isDragging ? 8 : 2}
      sx={{
        mb: 2,
        position: "relative",
        opacity: isDragging ? 0.8 : 1,
        transition: "box-shadow 0.2s ease-in-out, opacity 0.2s ease-in-out",
        "&:hover": {
          boxShadow: isDragging ? 8 : 4,
        },
        width: "fit-content",
        minWidth: 280,
        ...style,
      }}
    >
      <Accordion
        sx={{ "&.MuiAccordion-root:before": { display: "none" } }}
        defaultExpanded={false}
      >
        <AccordionSummary
          {...attributes}
          {...listeners}
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel-${event.id}-content`}
          id={`panel-${event.id}-header`}
          sx={{
            cursor: "grab",
            "& .MuiAccordionSummary-content": {
              alignItems: "center",
              justifyContent: "space-between",
            },
            "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
              transform: "rotate(180deg)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              overflow: "hidden",
              mr: 1,
            }}
          >
            {event.eventType && (
              <Tooltip title={event.eventType}>
                <EventTypeIcon
                  sx={{ mr: 1, color: "action.active", flexShrink: 0 }}
                  fontSize="small"
                />
              </Tooltip>
            )}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                flexGrow: 1,
              }}
            >
              <Typography variant="subtitle1" component="div" noWrap>
                {event.title}
              </Typography>
              {plotName && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ mt: 0.25 }}
                >
                  関連プロット: {plotName}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mr: 1, whiteSpace: "nowrap" }}
            >
              {moment(event.date).format("YYYY/MM/DD")}
            </Typography>
            <Tooltip title="編集">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(event.id);
                }}
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, pb: 1, px: 2 }}>
          {placeName && (
            <Box
              sx={{ display: "flex", alignItems: "center", mb: 1, gap: 0.5 }}
            >
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {placeName}
              </Typography>
            </Box>
          )}

          {event.description && (
            <Typography variant="body2" paragraph sx={{ mt: 1, mb: 1 }}>
              {event.description}
            </Typography>
          )}

          {event.relatedCharacters && event.relatedCharacters.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                mt: 1,
                mb: onDelete ? 1 : 0,
              }}
            >
              <PersonIcon fontSize="small" color="action" />
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {event.relatedCharacters.map((charId) => (
                  <Chip
                    key={charId}
                    label={
                      getCharacterNameById
                        ? getCharacterNameById(charId)
                        : charId
                    }
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                ))}
              </Box>
            </Box>
          )}
          {onDelete && (
            <Box
              sx={{
                textAlign: "right",
                mt: 1,
                pt: 1,
                borderTop: 1,
                borderColor: "divider",
              }}
            >
              <Tooltip title="削除">
                <IconButton
                  size="small"
                  onClick={() => onDelete(event.id)}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default TimelineEventCard;

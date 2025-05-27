import React from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Paper,
  ListItem,
  ListItemIcon,
  Checkbox,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { TimelineEventSeed } from "@novel-ai-assistant/types";

interface DraggableEventSeedItemProps {
  seed: TimelineEventSeed;
  isSelected: boolean;
  onToggle: () => void;
}

const DraggableEventSeedItem: React.FC<DraggableEventSeedItemProps> = ({
  seed,
  isSelected,
  onToggle,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `draggable-seed-${seed.id}`, // ドラッグ可能な要素の一意なID
      data: { type: "event-seed", seed }, // ドラッグされるデータ
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 9999 : undefined, // ドラッグ中は最前面に
        opacity: isDragging ? 0.8 : undefined,
      }
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 4 : 1}
      sx={{ mb: 2, cursor: isDragging ? "grabbing" : "grab" }}
      {...listeners}
      {...attributes}
    >
      <ListItem
        role={undefined}
        dense
        onClick={onToggle} // チェックボックスのトグルは維持
        sx={{ alignItems: "flex-start" }} // cursor:grab はPaperに移動
      >
        <ListItemIcon sx={{ mt: 1 }}>
          <Checkbox
            edge="start"
            checked={isSelected}
            tabIndex={-1}
            disableRipple
            inputProps={{
              "aria-labelledby": `checkbox-list-label-${seed.id}`,
            }}
          />
        </ListItemIcon>
        <Box>
          <Typography
            variant="h6"
            component="div"
            id={`checkbox-list-label-${seed.id}`}
          >
            {seed.eventName}
          </Typography>
          {/* 他の情報の表示は変更なし */}
          {seed.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              説明: {seed.description}
            </Typography>
          )}
          {seed.estimatedTime && (
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              時期(目安): {seed.estimatedTime}
            </Typography>
          )}
          {seed.characterIds && seed.characterIds.length > 0 && (
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              関連キャラ: {seed.characterIds.join(", ")}
            </Typography>
          )}
          {seed.relatedPlaceIds && seed.relatedPlaceIds.length > 0 && (
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              関連場所: {seed.relatedPlaceIds.join(", ")}
            </Typography>
          )}
          {(seed.relatedPlotTitles && seed.relatedPlotTitles.length > 0) ||
          (seed.relatedPlotIds && seed.relatedPlotIds.length > 0) ? (
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
            >
              関連プロット:{" "}
              {(seed.relatedPlotTitles && seed.relatedPlotTitles.length > 0
                ? seed.relatedPlotTitles
                : seed.relatedPlotIds!
              ).join(", ")}
            </Typography>
          ) : null}
        </Box>
      </ListItem>
      <Divider />
    </Paper>
  );
};

export default DraggableEventSeedItem;

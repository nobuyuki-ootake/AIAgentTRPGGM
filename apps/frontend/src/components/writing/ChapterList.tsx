import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Chip,
} from "@mui/material";
import { Chapter } from "@novel-ai-assistant/types";
// import { useWritingContext } from "../../contexts/WritingContext"; // 未使用のためコメントアウト

interface ChapterListProps {
  chapters: Chapter[];
  currentChapterId: string | null;
  onSelectChapter: (chapterId: string) => void;
}

const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  currentChapterId,
  onSelectChapter,
}) => {
  if (chapters.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          章が作成されていません
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        章一覧
      </Typography>
      <List sx={{ maxHeight: "400px", overflow: "auto" }}>
        {[...chapters]
          .sort((a, b) => a.order - b.order)
          .map((chapter) => (
            <ListItem key={chapter.id} disablePadding>
              <ListItemButton
                selected={currentChapterId === chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.light",
                    color: "primary.contrastText",
                    "&:hover": {
                      backgroundColor: "primary.main",
                    },
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={chapter.order}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="subtitle2" noWrap>
                        {chapter.title}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    chapter.synopsis && (
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
                        {chapter.synopsis}
                      </Typography>
                    )
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Paper>
  );
};

export default ChapterList;

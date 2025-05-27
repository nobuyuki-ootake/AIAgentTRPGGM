import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import { Delete as DeleteIcon, Book as BookIcon } from "@mui/icons-material";
import { NovelProject } from "@novel-ai-assistant/types";

interface ProjectCardProps {
  project: NovelProject;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isSelected,
  onSelect,
  onDelete,
}) => {
  // 日付をフォーマット
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "0.3s",
        border: isSelected ? "2px solid" : "none",
        borderColor: "primary.main",
        "&:hover": {
          boxShadow: (theme) => theme.shadows[8],
        },
      }}
      onClick={onSelect}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <BookIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
            {project.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          作成日: {formatDate(project.createdAt)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          更新日: {formatDate(project.updatedAt)}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end" }}>
        <IconButton
          size="small"
          color="error"
          onClick={onDelete}
          aria-label="プロジェクトを削除"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default ProjectCard;

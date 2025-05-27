import { useState, FormEvent } from "react";
import { useCreateProject } from "../hooks/useCreateProject";
import { useNavigate } from "react-router-dom";

// Material-UIのimport
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Stack,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export interface NewProjectFormProps {
  onSuccess?: (projectId: string) => void;
}

export const NewProjectForm = ({ onSuccess }: NewProjectFormProps) => {
  const navigate = useNavigate();
  const { createProject, isCreating, error } = useCreateProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return; // 名前が必須
    }

    const newProject = await createProject({
      name: name.trim(),
      description: description.trim(),
      genre,
      tags,
    });

    if (newProject) {
      if (onSuccess) {
        onSuccess(newProject.id);
      } else {
        navigate(`/projects/${newProject.id}`);
      }
    }
  };

  const handleAddGenre = () => {
    if (genreInput.trim() && !genre.includes(genreInput.trim())) {
      setGenre([...genre, genreInput.trim()]);
      setGenreInput("");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveGenre = (genreToRemove: string) => {
    setGenre(genre.filter((g) => g !== genreToRemove));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto", my: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        新しいプロジェクト
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          label="プロジェクト名"
          fullWidth
          margin="normal"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isCreating}
        />

        <TextField
          label="プロジェクトの説明"
          fullWidth
          margin="normal"
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isCreating}
        />

        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            ジャンル
          </Typography>

          <Box sx={{ display: "flex", mb: 1 }}>
            <TextField
              size="small"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              disabled={isCreating}
              placeholder="ジャンルを追加"
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={handleAddGenre}
              disabled={!genreInput.trim() || isCreating}
            >
              <AddIcon />
            </Button>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {genre.map((g) => (
              <Chip
                key={g}
                label={g}
                onDelete={() => handleRemoveGenre(g)}
                disabled={isCreating}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            タグ
          </Typography>

          <Box sx={{ display: "flex", mb: 1 }}>
            <TextField
              size="small"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              disabled={isCreating}
              placeholder="タグを追加"
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={handleAddTag}
              disabled={!tagInput.trim() || isCreating}
            >
              <AddIcon />
            </Button>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {tags.map((t) => (
              <Chip
                key={t}
                label={t}
                onDelete={() => handleRemoveTag(t)}
                disabled={isCreating}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outlined"
            sx={{ mr: 2 }}
            disabled={isCreating}
            onClick={() => navigate("/")}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!name.trim() || isCreating}
            startIcon={
              isCreating ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {isCreating ? "作成中..." : "作成"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

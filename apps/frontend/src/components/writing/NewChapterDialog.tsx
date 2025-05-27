import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";

interface NewChapterDialogProps {
  open: boolean;
  title: string;
  synopsis: string;
  onClose: () => void;
  onTitleChange: (title: string) => void;
  onSynopsisChange: (synopsis: string) => void;
  onCreateChapter: () => void;
}

const NewChapterDialog: React.FC<NewChapterDialogProps> = ({
  open,
  title,
  synopsis,
  onClose,
  onTitleChange,
  onSynopsisChange,
  onCreateChapter,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateChapter();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>新規章作成</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            autoFocus
            required
            label="章のタイトル"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="例: 第一章 出会い"
          />
          <TextField
            label="章のあらすじ（任意）"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={synopsis}
            onChange={(e) => onSynopsisChange(e.target.value)}
            placeholder="この章で起こる出来事の概要を入力してください..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button type="submit" variant="contained" disabled={!title.trim()}>
          作成
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewChapterDialog;

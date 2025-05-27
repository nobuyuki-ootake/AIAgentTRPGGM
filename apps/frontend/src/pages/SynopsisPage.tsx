import React from "react";
import { Typography, Box, Paper, Card } from "@mui/material";
import { useSynopsis } from "../hooks/useSynopsis";
import { SynopsisEditor } from "../components/synopsis/SynopsisEditor";
import { SynopsisTips } from "../components/synopsis/SynopsisTips";
import { UnsavedChangesDialog } from "../components/synopsis/UnsavedChangesDialog";

const SynopsisPage: React.FC = () => {
  const {
    currentProject,
    synopsis,
    isEditing,
    showAlertDialog,
    handleStartEditing,
    handleSynopsisChange,
    handleSave,
    handleCancel,
    handleDialogCancel,
    handleDialogContinue,
  } = useSynopsis();

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>プロジェクトが選択されていません。</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {currentProject.title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          あらすじ
        </Typography>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <SynopsisEditor
          synopsis={synopsis}
          isEditing={isEditing}
          onEdit={handleStartEditing}
          onCancel={handleCancel}
          onSave={handleSave}
          onChange={handleSynopsisChange}
        />
      </Card>

      <Card>
        <SynopsisTips />
      </Card>

      <UnsavedChangesDialog
        open={showAlertDialog}
        onCancel={handleDialogCancel}
        onContinue={handleDialogContinue}
      />
    </Box>
  );
};

export default SynopsisPage;

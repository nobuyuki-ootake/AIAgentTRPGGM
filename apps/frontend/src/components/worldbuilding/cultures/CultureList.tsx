import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { CultureElement } from "@novel-ai-assistant/types";
import { CultureItem } from "./CultureItem";

interface CultureListProps {
  cultures: CultureElement[];
  onOpenNewDialog: () => void;
  onEdit: (culture: CultureElement) => void;
  onDelete: (id: string) => void;
}

export const CultureList: React.FC<CultureListProps> = ({
  cultures,
  onOpenNewDialog,
  onEdit,
  onDelete,
}) => {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h2">
          文化
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<AddIcon />}
          onClick={onOpenNewDialog}
        >
          新しい文化を追加
        </Button>
      </Box>

      {cultures.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            文化がまだ登録されていません。「新しい文化を追加」ボタンをクリックして作成してください。
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mt: 2 }}>
          {cultures.map((culture) => (
            <CultureItem
              key={culture.id}
              culture={culture}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

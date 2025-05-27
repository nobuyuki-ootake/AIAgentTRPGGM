import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from "@mui/material";

interface UnsavedChangesDialogProps {
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  open,
  onCancel,
  onContinue,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        変更が保存されていません
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          あらすじに加えた変更が保存されていません。保存せずに移動すると、変更内容は失われます。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          キャンセル
        </Button>
        <Button onClick={onContinue} color="error" autoFocus>
          保存せずに続行
        </Button>
      </DialogActions>
    </Dialog>
  );
};

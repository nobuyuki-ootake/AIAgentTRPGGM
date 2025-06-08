import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Alert,
  AlertTitle,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface UnsavedChangesDialogProps {
  open: boolean;
  onClose: () => void;
  onSaveAndContinue: () => void;
  onContinueWithoutSaving: () => void;
  title?: string;
  message?: string;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  open,
  onClose,
  onSaveAndContinue,
  onContinueWithoutSaving,
  title = '未保存の変更があります',
  message = '編集中のデータが保存されていません。続行する前に保存しますか？',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="unsaved-changes-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="unsaved-changes-dialog-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Warning color="warning" />
          {title}
        </div>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>データの保存について</AlertTitle>
          {message}
        </Alert>
        <DialogContentText>
          • <strong>保存して続行</strong>: 現在の変更を保存してから移動します
        </DialogContentText>
        <DialogContentText>
          • <strong>保存せずに続行</strong>: 変更内容は失われます
        </DialogContentText>
        <DialogContentText>
          • <strong>キャンセル</strong>: このページに留まります
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="primary">
          キャンセル
        </Button>
        <Button 
          onClick={onContinueWithoutSaving} 
          color="warning"
          variant="outlined"
        >
          保存せずに続行
        </Button>
        <Button 
          onClick={onSaveAndContinue} 
          color="primary" 
          variant="contained"
          autoFocus
        >
          保存して続行
        </Button>
      </DialogActions>
    </Dialog>
  );
};
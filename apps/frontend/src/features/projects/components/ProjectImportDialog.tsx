import { useState, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectImport } from "../hooks/useProjectImport";
import { ValidationError } from "../../../utils/importUtil";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Switch,
  FormControlLabel,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface ProjectImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export const ProjectImportDialog = ({
  open,
  onClose,
  onSuccess,
}: ProjectImportDialogProps) => {
  const navigate = useNavigate();
  const { importProject, isImporting, validationErrors } = useProjectImport();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択ハンドラ
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // ファイル選択ボタンクリックハンドラ
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // 上書き設定変更ハンドラ
  const handleOverwriteChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOverwriteExisting(event.target.checked);
  };

  // インポート実行ハンドラ
  const handleImportClick = async () => {
    if (!selectedFile) return;

    const result = await importProject(selectedFile, true, overwriteExisting);

    if (result.success && result.projectId) {
      // インポート成功時の処理
      if (onSuccess) {
        onSuccess(result.projectId);
      } else {
        navigate(`/projects/${result.projectId}`);
      }
      handleClose();
    }
    // エラーの場合は自動的にvalidationErrorsが更新される
  };

  // ダイアログを閉じる
  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  // バリデーションエラーを表示
  const renderValidationErrors = (errors: ValidationError[]) => {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error" icon={<ErrorOutlineIcon />}>
          インポートできません。以下のエラーを修正してください。
        </Alert>
        <List dense sx={{ mt: 1, bgcolor: "background.paper" }}>
          {errors.map((error, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={error.message}
                secondary={
                  error.field !== "file" && error.field !== "import"
                    ? `フィールド: ${error.field}`
                    : undefined
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>プロジェクトをインポート</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          以前にエクスポートしたJSONファイルからプロジェクトをインポートできます。
        </Typography>

        <Box sx={{ mt: 2, mb: 2 }}>
          <input
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isImporting}
          />
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={handleSelectFileClick}
            disabled={isImporting}
          >
            JSONファイルを選択
          </Button>
          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              選択ファイル: {selectedFile.name} (
              {(selectedFile.size / 1024).toFixed(1)} KB)
            </Typography>
          )}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={overwriteExisting}
              onChange={handleOverwriteChange}
              disabled={isImporting}
            />
          }
          label="同じIDのプロジェクトが存在する場合は上書きする"
        />

        {validationErrors.length > 0 &&
          renderValidationErrors(validationErrors)}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={isImporting}>
          キャンセル
        </Button>
        <Button
          onClick={handleImportClick}
          color="primary"
          variant="contained"
          disabled={!selectedFile || isImporting}
          startIcon={isImporting ? <CircularProgress size={20} /> : null}
        >
          {isImporting ? "インポート中..." : "インポート"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

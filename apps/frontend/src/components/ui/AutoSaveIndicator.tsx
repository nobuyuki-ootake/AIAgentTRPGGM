import React, { useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  LinearProgress,
  Fade,
} from "@mui/material";
import {
  Save as SaveIcon,
  CloudDone as SavedIcon,
  CloudSync as SavingIcon,
  CloudOff as ErrorIcon,
  Pause as PausedIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Refresh as RetryIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  saveCount: number;
  errorCount: number;
  lastError: Error | null;
}

interface AutoSaveIndicatorProps {
  saveState: AutoSaveState;
  hasUnsavedChanges: boolean;
  isPaused?: boolean;
  onSaveNow?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  interval?: number;
  compact?: boolean;
  showInToolbar?: boolean;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  saveState,
  hasUnsavedChanges,
  isPaused = false,
  onSaveNow,
  onPause,
  onResume,
  onRetry,
  interval = 3000,
  compact = false,
  showInToolbar = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const { isSaving, lastSaved, saveCount, errorCount, lastError } = saveState;

  // 状態の判定
  const getStatus = () => {
    if (isPaused) return "paused";
    if (isSaving) return "saving";
    if (lastError) return "error";
    if (hasUnsavedChanges) return "unsaved";
    if (lastSaved) return "saved";
    return "initial";
  };

  const status = getStatus();

  // 状態に応じた表示設定
  const getStatusConfig = () => {
    switch (status) {
      case "saving":
        return {
          icon: <SavingIcon />,
          color: "info" as const,
          label: "保存中...",
          tooltip: "データを保存しています",
        };
      case "saved":
        return {
          icon: <SavedIcon />,
          color: "success" as const,
          label: "保存済み",
          tooltip: lastSaved ? `最終保存: ${formatTime(lastSaved)}` : "保存済み",
        };
      case "unsaved":
        return {
          icon: <SaveIcon />,
          color: "warning" as const,
          label: "未保存",
          tooltip: "変更が保存されていません",
        };
      case "error":
        return {
          icon: <ErrorIcon />,
          color: "error" as const,
          label: "保存失敗",
          tooltip: lastError?.message || "保存に失敗しました",
        };
      case "paused":
        return {
          icon: <PausedIcon />,
          color: "default" as const,
          label: "一時停止",
          tooltip: "自動保存が一時停止されています",
        };
      default:
        return {
          icon: <SaveIcon />,
          color: "default" as const,
          label: "自動保存",
          tooltip: "自動保存が有効です",
        };
    }
  };

  const statusConfig = getStatusConfig();

  // 時間フォーマット
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 相対時間フォーマット
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    return `${Math.floor(diff / 86400)}日前`;
  };

  // ポップオーバーの開閉
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // 保存実行時のプログレス表示
  React.useEffect(() => {
    if (isSaving) {
      setShowProgress(true);
      const timer = setTimeout(() => setShowProgress(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving]);

  // コンパクト表示
  if (compact) {
    return (
      <Tooltip title={statusConfig.tooltip}>
        <Chip
          icon={statusConfig.icon}
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          onClick={handleClick}
          variant={status === "saved" ? "filled" : "outlined"}
        />
      </Tooltip>
    );
  }

  // ツールバー表示
  if (showInToolbar) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title={statusConfig.tooltip}>
          <IconButton size="small" onClick={handleClick} color={statusConfig.color}>
            {statusConfig.icon}
          </IconButton>
        </Tooltip>
        
        <Fade in={showProgress}>
          <Box sx={{ width: 60 }}>
            <LinearProgress size={2} />
          </Box>
        </Fade>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Box sx={{ p: 2, minWidth: 250 }}>
            <AutoSaveDetails
              saveState={saveState}
              hasUnsavedChanges={hasUnsavedChanges}
              isPaused={isPaused}
              onSaveNow={onSaveNow}
              onPause={onPause}
              onResume={onResume}
              onRetry={onRetry}
              interval={interval}
            />
          </Box>
        </Popover>
      </Box>
    );
  }

  // フル表示
  return (
    <Box>
      <Chip
        icon={statusConfig.icon}
        label={statusConfig.label}
        color={statusConfig.color}
        onClick={handleClick}
        variant={status === "saved" ? "filled" : "outlined"}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <AutoSaveDetails
            saveState={saveState}
            hasUnsavedChanges={hasUnsavedChanges}
            isPaused={isPaused}
            onSaveNow={onSaveNow}
            onPause={onPause}
            onResume={onResume}
            onRetry={onRetry}
            interval={interval}
          />
        </Box>
      </Popover>
    </Box>
  );
};

// 詳細表示コンポーネント
const AutoSaveDetails: React.FC<{
  saveState: AutoSaveState;
  hasUnsavedChanges: boolean;
  isPaused: boolean;
  onSaveNow?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  interval: number;
}> = ({
  saveState,
  hasUnsavedChanges,
  isPaused,
  onSaveNow,
  onPause,
  onResume,
  onRetry,
  interval,
}) => {
  const { isSaving, lastSaved, saveCount, errorCount, lastError } = saveState;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    return `${Math.floor(diff / 86400)}日前`;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        自動保存ステータス
      </Typography>

      {/* 現在の状態 */}
      <List dense>
        <ListItem>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText
            primary="状態"
            secondary={
              isSaving ? "保存中" :
              isPaused ? "一時停止" :
              hasUnsavedChanges ? "未保存の変更あり" :
              "最新"
            }
          />
        </ListItem>

        {lastSaved && (
          <ListItem>
            <ListItemIcon>
              <SavedIcon />
            </ListItemIcon>
            <ListItemText
              primary="最終保存"
              secondary={`${formatTime(lastSaved)} (${getRelativeTime(lastSaved)})`}
            />
          </ListItem>
        )}

        <ListItem>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText
            primary="保存間隔"
            secondary={`${interval / 1000}秒`}
          />
        </ListItem>
      </List>

      {/* 統計情報 */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          統計
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip label={`保存回数: ${saveCount}`} size="small" />
          {errorCount > 0 && (
            <Chip label={`エラー: ${errorCount}`} size="small" color="error" />
          )}
        </Box>
      </Box>

      {/* エラー表示 */}
      {lastError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {lastError.message}
          </Typography>
        </Alert>
      )}

      {/* 進行状況表示 */}
      {isSaving && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            保存中...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* 操作ボタン */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        {lastError && onRetry && (
          <Button
            size="small"
            startIcon={<RetryIcon />}
            onClick={onRetry}
            color="error"
          >
            再試行
          </Button>
        )}
        
        {onSaveNow && (
          <Button
            size="small"
            startIcon={<SaveIcon />}
            onClick={onSaveNow}
            disabled={isSaving || !hasUnsavedChanges}
          >
            今すぐ保存
          </Button>
        )}

        {isPaused ? (
          onResume && (
            <Button
              size="small"
              startIcon={<SaveIcon />}
              onClick={onResume}
              color="primary"
            >
              再開
            </Button>
          )
        ) : (
          onPause && (
            <Button
              size="small"
              startIcon={<PausedIcon />}
              onClick={onPause}
              color="warning"
            >
              一時停止
            </Button>
          )
        )}
      </Box>
    </Box>
  );
};

export default AutoSaveIndicator;
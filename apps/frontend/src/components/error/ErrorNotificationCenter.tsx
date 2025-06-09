import React from "react";
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Button,
  Collapse,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Badge,
  Fab,
  Chip,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Notifications as NotificationsIcon,
  ClearAll as ClearAllIcon,
} from "@mui/icons-material";
import { useErrorState, ErrorState } from "./ErrorStateManager";

interface ErrorNotificationCenterProps {
  maxVisible?: number;
  autoHideDuration?: number;
  showDrawer?: boolean;
}

export const ErrorNotificationCenter: React.FC<ErrorNotificationCenterProps> = ({
  maxVisible = 3,
  autoHideDuration = 6000,
  showDrawer = true,
}) => {
  const {
    errors,
    dismissError,
    retryError,
    clearErrors,
    getActiveErrors,
  } = useErrorState();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [expandedErrors, setExpandedErrors] = React.useState<Set<string>>(new Set());

  const activeErrors = getActiveErrors();
  const visibleErrors = activeErrors.slice(-maxVisible);
  const hasMoreErrors = activeErrors.length > maxVisible;

  const toggleErrorExpansion = (errorId: string) => {
    const newExpanded = new Set(expandedErrors);
    if (newExpanded.has(errorId)) {
      newExpanded.delete(errorId);
    } else {
      newExpanded.add(errorId);
    }
    setExpandedErrors(newExpanded);
  };

  const getErrorIcon = (severity: ErrorState['severity']) => {
    switch (severity) {
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <ErrorIcon />;
    }
  };

  const getErrorColor = (severity: ErrorState['severity']) => {
    switch (severity) {
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'error';
    }
  };

  const formatErrorTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getErrorTypeLabel = (type: ErrorState['type']) => {
    switch (type) {
      case 'network':
        return 'ネットワーク';
      case 'api':
        return 'API';
      case 'validation':
        return '入力検証';
      case 'data':
        return 'データ';
      case 'ai':
        return 'AI';
      case 'dice':
        return 'ダイス';
      case 'session':
        return 'セッション';
      default:
        return 'システム';
    }
  };

  return (
    <>
      {/* Floating Error Notifications */}
      <Box sx={{ position: 'fixed', top: 80, right: 16, zIndex: 1400, maxWidth: 400 }}>
        {visibleErrors.map((error, index) => (
          <Snackbar
            key={error.id}
            open={true}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{
              position: 'static',
              mb: 1,
              transform: 'none !important',
            }}
            autoHideDuration={error.severity === 'error' ? null : autoHideDuration}
            onClose={() => dismissError(error.id)}
          >
            <Alert
              severity={getErrorColor(error.severity)}
              onClose={() => dismissError(error.id)}
              action={
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {error.retryable && error.retryCount < error.maxRetries && (
                    <IconButton
                      size="small"
                      onClick={() => retryError(error.id)}
                      color="inherit"
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => toggleErrorExpansion(error.id)}
                    color="inherit"
                  >
                    {expandedErrors.has(error.id) ? 
                      <ExpandLessIcon fontSize="small" /> : 
                      <ExpandMoreIcon fontSize="small" />
                    }
                  </IconButton>
                </Box>
              }
              sx={{ width: '100%' }}
            >
              <AlertTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2">{error.message}</Typography>
                  <Chip
                    label={getErrorTypeLabel(error.type)}
                    size="small"
                    variant="outlined"
                    color={getErrorColor(error.severity)}
                  />
                </Box>
              </AlertTitle>
              
              <Collapse in={expandedErrors.has(error.id)}>
                <Box sx={{ mt: 1 }}>
                  {error.details && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {error.details}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    発生時刻: {formatErrorTime(error.timestamp)}
                    {error.context && ` | コンテキスト: ${error.context}`}
                    {error.retryCount > 0 && ` | 再試行: ${error.retryCount}/${error.maxRetries}`}
                  </Typography>
                </Box>
              </Collapse>
            </Alert>
          </Snackbar>
        ))}
      </Box>

      {/* Error Center FAB */}
      {showDrawer && activeErrors.length > 0 && (
        <Fab
          color="error"
          size="medium"
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1300,
          }}
        >
          <Badge badgeContent={activeErrors.length} color="secondary">
            <NotificationsIcon />
          </Badge>
        </Fab>
      )}

      {/* Error History Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            maxWidth: '90vw',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">エラー履歴</Typography>
            <Box>
              <IconButton onClick={clearErrors} size="small">
                <ClearAllIcon />
              </IconButton>
              <IconButton onClick={() => setDrawerOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto' }}>
          {errors.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="エラーはありません"
                secondary="システムは正常に動作しています"
              />
            </ListItem>
          ) : (
            errors
              .slice()
              .reverse()
              .map((error) => (
                <ListItem
                  key={error.id}
                  sx={{
                    borderLeft: 4,
                    borderColor: `${getErrorColor(error.severity)}.main`,
                    opacity: error.dismissed ? 0.6 : 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    {getErrorIcon(error.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{error.message}</Typography>
                        <Chip
                          label={getErrorTypeLabel(error.type)}
                          size="small"
                          variant="outlined"
                          color={getErrorColor(error.severity)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        {error.details && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {error.details}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatErrorTime(error.timestamp)}
                          {error.context && ` | ${error.context}`}
                          {error.retryCount > 0 && ` | 再試行: ${error.retryCount}`}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {error.retryable && !error.dismissed && error.retryCount < error.maxRetries && (
                        <IconButton
                          size="small"
                          onClick={() => retryError(error.id)}
                          color="primary"
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      )}
                      {!error.dismissed && (
                        <IconButton
                          size="small"
                          onClick={() => dismissError(error.id)}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
          )}
        </List>

        {activeErrors.length > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearErrors}
              startIcon={<ClearAllIcon />}
            >
              すべてのエラーをクリア
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  );
};

export default ErrorNotificationCenter;
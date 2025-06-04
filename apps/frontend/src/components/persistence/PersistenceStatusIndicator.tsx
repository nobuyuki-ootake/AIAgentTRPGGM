/**
 * Persistence Status Indicator Component
 * Shows real-time status of data persistence, sync, and integrity
 */

import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Sync as SyncIcon,
  SyncProblem as SyncProblemIcon,
  Storage as StorageIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Backup as BackupIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
} from '@mui/icons-material';

import { usePersistenceContext } from './DataPersistenceProvider';

interface PersistenceStatusIndicatorProps {
  showDetailedView?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size?: 'small' | 'medium' | 'large';
}

const PersistenceStatusIndicator: React.FC<PersistenceStatusIndicatorProps> = ({
  showDetailedView = false,
  position = 'top-right',
  size = 'medium',
}) => {
  const {
    healthStatus,
    syncStatus,
    conflicts,
    isInitialized,
    runIntegrityCheck,
    optimizeStorage,
    createBackup,
    exportDiagnostics,
  } = usePersistenceContext();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Update timestamp periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate overall status
  const getOverallStatus = () => {
    if (!isInitialized) return 'initializing';
    
    if (healthStatus.overall === 'critical' || 
        syncStatus.failedItems > 0 || 
        conflicts.length > 0) {
      return 'error';
    }
    
    if (healthStatus.overall === 'warning' || 
        syncStatus.pendingItems > 10) {
      return 'warning';
    }
    
    if (syncStatus.isSyncing) {
      return 'syncing';
    }
    
    if (!syncStatus.isOnline) {
      return 'offline';
    }
    
    return 'healthy';
  };

  // Get status icon and color
  const getStatusIcon = () => {
    const status = getOverallStatus();
    const iconProps = { fontSize: size };

    switch (status) {
      case 'initializing':
        return <SyncIcon {...iconProps} className="animate-spin" />;
      case 'error':
        return <ErrorIcon {...iconProps} color="error" />;
      case 'warning':
        return <WarningIcon {...iconProps} color="warning" />;
      case 'syncing':
        return <SyncIcon {...iconProps} color="primary" className="animate-spin" />;
      case 'offline':
        return <CloudOffIcon {...iconProps} color="disabled" />;
      case 'healthy':
        return <CheckCircleIcon {...iconProps} color="success" />;
      default:
        return <CloudIcon {...iconProps} />;
    }
  };

  // Get status badge count
  const getBadgeCount = () => {
    const issues = (healthStatus.overall === 'critical' ? 1 : 0) +
                  syncStatus.failedItems +
                  conflicts.length;
    return issues > 0 ? issues : undefined;
  };

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return '未実行';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`;
    return `${Math.floor(diffInMinutes / 1440)}日前`;
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = async (action: string) => {
    setAnchorEl(null);
    
    try {
      switch (action) {
        case 'integrity-check':
          await runIntegrityCheck();
          break;
        case 'optimize':
          await optimizeStorage();
          break;
        case 'backup':
          await createBackup('Manual backup from status indicator');
          break;
        case 'export-diagnostics':
          const diagnostics = await exportDiagnostics();
          const blob = new Blob([JSON.stringify(diagnostics, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `trpg-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          break;
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  // Position styles
  const positionStyles = {
    'top-right': { position: 'fixed', top: 16, right: 16, zIndex: 1300 },
    'top-left': { position: 'fixed', top: 16, left: 16, zIndex: 1300 },
    'bottom-right': { position: 'fixed', bottom: 16, right: 16, zIndex: 1300 },
    'bottom-left': { position: 'fixed', bottom: 16, left: 16, zIndex: 1300 },
  };

  const status = getOverallStatus();

  if (showDetailedView) {
    return (
      <Card sx={{ maxWidth: 400 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            {getStatusIcon()}
            <Typography variant="h6" sx={{ ml: 1 }}>
              データ永続化ステータス
            </Typography>
          </Box>

          {/* Overall Health */}
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              システム状態
            </Typography>
            <Chip
              icon={getStatusIcon()}
              label={status === 'healthy' ? '正常' : 
                     status === 'warning' ? '警告' : 
                     status === 'error' ? 'エラー' : 
                     status === 'offline' ? 'オフライン' : 
                     status === 'syncing' ? '同期中' : '初期化中'}
              color={status === 'healthy' ? 'success' : 
                     status === 'warning' ? 'warning' : 
                     status === 'error' ? 'error' : 'default'}
              size="small"
            />
          </Box>

          {/* Sync Status */}
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              同期状態
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {syncStatus.isOnline ? (
                <CloudIcon color="success" fontSize="small" />
              ) : (
                <CloudOffIcon color="disabled" fontSize="small" />
              )}
              <Typography variant="body2">
                {syncStatus.isOnline ? 'オンライン' : 'オフライン'}
              </Typography>
            </Box>
            
            {syncStatus.isSyncing && (
              <Box mt={1}>
                <LinearProgress 
                  variant="determinate" 
                  value={syncStatus.syncProgress.percentage} 
                />
                <Typography variant="caption" color="text.secondary">
                  {syncStatus.syncProgress.completed} / {syncStatus.syncProgress.total}
                </Typography>
              </Box>
            )}

            {syncStatus.pendingItems > 0 && (
              <Typography variant="caption" color="text.secondary">
                {syncStatus.pendingItems}件の同期待ちアイテム
              </Typography>
            )}

            {syncStatus.lastSync && (
              <Typography variant="caption" color="text.secondary">
                最終同期: {formatRelativeTime(syncStatus.lastSync)}
              </Typography>
            )}
          </Box>

          {/* Storage Usage */}
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              ストレージ使用量
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <StorageIcon fontSize="small" color="primary" />
              <Typography variant="body2">
                {formatBytes(healthStatus.storageHealth.localStorage === 'healthy' ? 1024 * 1024 : 0)}
              </Typography>
            </Box>
            
            {healthStatus.performanceMetrics.averageAccessTime > 0 && (
              <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                <SpeedIcon fontSize="small" color="primary" />
                <Typography variant="caption" color="text.secondary">
                  平均アクセス時間: {healthStatus.performanceMetrics.averageAccessTime.toFixed(1)}ms
                </Typography>
              </Box>
            )}
          </Box>

          {/* Issues */}
          {(conflicts.length > 0 || syncStatus.failedItems > 0) && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom color="error">
                問題
              </Typography>
              {conflicts.length > 0 && (
                <Typography variant="body2" color="error">
                  • {conflicts.length}件の同期競合
                </Typography>
              )}
              {syncStatus.failedItems > 0 && (
                <Typography variant="body2" color="error">
                  • {syncStatus.failedItems}件の同期失敗
                </Typography>
              )}
            </Box>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleAction('integrity-check')}
              startIcon={<CheckCircleIcon />}
            >
              整合性チェック
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleAction('backup')}
              startIcon={<BackupIcon />}
            >
              バックアップ
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleAction('optimize')}
              startIcon={<MemoryIcon />}
            >
              最適化
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            最終更新: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={positionStyles[position]}>
      <Tooltip 
        title={`データ永続化: ${status === 'healthy' ? '正常' : 
                                 status === 'warning' ? '警告あり' : 
                                 status === 'error' ? 'エラーあり' : 
                                 status === 'offline' ? 'オフライン' : 
                                 status === 'syncing' ? '同期中' : '初期化中'}`}
      >
        <Badge badgeContent={getBadgeCount()} color="error">
          <IconButton
            onClick={handleClick}
            size={size}
            sx={{
              backgroundColor: 'background.paper',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
              },
            }}
            data-testid="persistence-status-indicator"
          >
            {getStatusIcon()}
          </IconButton>
        </Badge>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 280 } }}
      >
        {/* Status Header */}
        <Box sx={{ px: 2, py: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon()}
            <Typography variant="subtitle1" fontWeight="bold">
              データ永続化
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            最終更新: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>

        <Divider />

        {/* Quick Status */}
        <MenuItem disabled>
          <ListItemIcon>
            {syncStatus.isOnline ? <CloudIcon color="success" /> : <CloudOffIcon color="disabled" />}
          </ListItemIcon>
          <ListItemText
            primary={syncStatus.isOnline ? 'オンライン' : 'オフライン'}
            secondary={syncStatus.lastSync ? `最終同期: ${formatRelativeTime(syncStatus.lastSync)}` : '未同期'}
          />
        </MenuItem>

        {syncStatus.pendingItems > 0 && (
          <MenuItem disabled>
            <ListItemIcon>
              <SyncIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={`${syncStatus.pendingItems}件の同期待ち`}
              secondary={syncStatus.isSyncing ? '同期中...' : '待機中'}
            />
          </MenuItem>
        )}

        {conflicts.length > 0 && (
          <MenuItem disabled>
            <ListItemIcon>
              <SyncProblemIcon color="warning" />
            </ListItemIcon>
            <ListItemText
              primary={`${conflicts.length}件の競合`}
              secondary="手動解決が必要"
            />
          </MenuItem>
        )}

        <Divider />

        {/* Actions */}
        <MenuItem onClick={() => handleAction('integrity-check')}>
          <ListItemIcon>
            <CheckCircleIcon />
          </ListItemIcon>
          <ListItemText primary="整合性チェック実行" />
        </MenuItem>

        <MenuItem onClick={() => handleAction('backup')}>
          <ListItemIcon>
            <BackupIcon />
          </ListItemIcon>
          <ListItemText primary="手動バックアップ作成" />
        </MenuItem>

        <MenuItem onClick={() => handleAction('optimize')}>
          <ListItemIcon>
            <MemoryIcon />
          </ListItemIcon>
          <ListItemText primary="ストレージ最適化" />
        </MenuItem>

        <Divider />

        <MenuItem onClick={() => handleAction('export-diagnostics')}>
          <ListItemIcon>
            <InfoIcon />
          </ListItemIcon>
          <ListItemText primary="診断情報エクスポート" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PersistenceStatusIndicator;
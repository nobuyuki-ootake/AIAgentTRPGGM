/**
 * Data Persistence Provider Component
 * Provides comprehensive data persistence context for the TRPG application
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, LinearProgress, Typography, Box } from '@mui/material';

import DataPersistenceManager, { BackupData, PersistenceConfig } from '../../utils/persistence/DataPersistenceManager';
import SessionStorageManager, { TRPGSessionStorageManager } from '../../utils/persistence/SessionStorageManager';
import IndexedDBManager, { IndexedDBConfig } from '../../utils/persistence/IndexedDBManager';
import SyncManager, { SyncConfig, SyncStatus, ConflictItem } from '../../utils/persistence/SyncManager';
import DataMigrationManager, { MigrationResult, ValidationResult, BackupMetadata } from '../../utils/persistence/DataMigrationManager';

import usePersistence from '../../hooks/usePersistence';
import useDataIntegrity, { DataHealthStatus, IntegrityCheckResult } from '../../hooks/useDataIntegrity';

// Context interfaces
export interface PersistenceContextValue {
  // Core managers
  persistenceManager: DataPersistenceManager;
  sessionManager: TRPGSessionStorageManager;
  indexedDBManager: IndexedDBManager;
  syncManager: SyncManager;
  migrationManager: DataMigrationManager;

  // Status and health
  isInitialized: boolean;
  healthStatus: DataHealthStatus;
  syncStatus: SyncStatus;
  
  // Operations
  createBackup: (description?: string) => Promise<BackupMetadata>;
  restoreBackup: (backupId: string) => Promise<void>;
  runIntegrityCheck: () => Promise<IntegrityCheckResult>;
  runMigration: (fromVersion: string, toVersion?: string) => Promise<MigrationResult>;
  validateData: (data: any) => Promise<ValidationResult>;
  optimizeStorage: () => Promise<void>;
  
  // Conflict resolution
  conflicts: ConflictItem[];
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: any) => Promise<void>;
  
  // Settings
  updateConfig: (config: Partial<PersistenceConfig & SyncConfig>) => void;
  exportDiagnostics: () => Promise<any>;
}

const PersistenceContext = createContext<PersistenceContextValue | null>(null);

export const usePersistenceContext = (): PersistenceContextValue => {
  const context = useContext(PersistenceContext);
  if (!context) {
    throw new Error('usePersistenceContext must be used within a DataPersistenceProvider');
  }
  return context;
};

// Provider component props
interface DataPersistenceProviderProps {
  children: ReactNode;
  config?: {
    persistence?: Partial<PersistenceConfig>;
    indexedDB?: Partial<IndexedDBConfig>;
    sync?: Partial<SyncConfig>;
    enableOfflineMode?: boolean;
    enableAutoMigration?: boolean;
    showNotifications?: boolean;
  };
}

// Notification state
interface NotificationState {
  open: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  action?: React.ReactNode;
}

// Dialog state
interface DialogState {
  type: 'migration' | 'conflict' | 'backup' | 'integrity' | null;
  open: boolean;
  data?: any;
}

export const DataPersistenceProvider: React.FC<DataPersistenceProviderProps> = ({
  children,
  config = {},
}) => {
  const {
    persistence: persistenceConfig = {},
    indexedDB: indexedDBConfig = {},
    sync: syncConfig = {},
    enableOfflineMode = true,
    enableAutoMigration = true,
    showNotifications = true,
  } = config;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [managers, setManagers] = useState<{
    persistenceManager: DataPersistenceManager;
    sessionManager: TRPGSessionStorageManager;
    indexedDBManager: IndexedDBManager;
    syncManager: SyncManager;
    migrationManager: DataMigrationManager;
  } | null>(null);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingItems: 0,
    failedItems: 0,
    conflicts: 0,
    syncProgress: { total: 0, completed: 0, percentage: 0 },
    errors: [],
  });

  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [dialog, setDialog] = useState<DialogState>({ type: null, open: false });

  // Initialize data integrity hook
  const {
    healthStatus,
    runIntegrityCheck: checkIntegrity,
    repairData,
    optimizeStorage: optimizeStorageInternal,
    exportDiagnostics: exportDiagnosticsInternal,
  } = useDataIntegrity({
    enableAutomaticChecks: true,
    enableRealTimeValidation: true,
    onIntegrityIssue: (result) => {
      if (showNotifications && result.criticalIssues > 0) {
        showNotification(
          `データ整合性の問題が${result.criticalIssues}件検出されました`,
          'error',
          <Button onClick={() => setDialog({ type: 'integrity', open: true, data: result })}>詳細</Button>
        );
      }
    },
    onDataCorruption: (details) => {
      if (showNotifications) {
        showNotification(
          'データの破損が検出されました。バックアップからの復元を検討してください。',
          'error'
        );
      }
    },
  });

  /**
   * Initialize all persistence managers
   */
  const initializeManagers = useCallback(async () => {
    try {
      // Initialize IndexedDB manager
      const indexedDB = new IndexedDBManager({
        dbName: 'TRPGDataDB',
        version: 1,
        stores: [
          {
            name: 'campaigns',
            keyPath: 'id',
            indexes: [
              { name: 'title', keyPath: 'title' },
              { name: 'updatedAt', keyPath: 'updatedAt' },
            ],
          },
          {
            name: 'characters',
            keyPath: 'id',
            indexes: [
              { name: 'campaignId', keyPath: 'campaignId' },
              { name: 'characterType', keyPath: 'characterType' },
            ],
          },
          {
            name: 'sessions',
            keyPath: 'id',
            indexes: [
              { name: 'campaignId', keyPath: 'campaignId' },
              { name: 'timestamp', keyPath: 'timestamp' },
            ],
          },
          {
            name: 'ai_cache',
            keyPath: 'id',
            indexes: [
              { name: 'timestamp', keyPath: 'timestamp' },
              { name: 'type', keyPath: 'type' },
            ],
          },
          {
            name: 'sync_queue',
            keyPath: 'id',
          },
          {
            name: 'sync_conflicts',
            keyPath: 'id',
          },
          {
            name: 'version_history',
            keyPath: 'id',
            indexes: [
              { name: 'entityId', keyPath: 'entityId' },
              { name: 'timestamp', keyPath: 'timestamp' },
            ],
          },
          {
            name: 'backups',
            keyPath: 'id',
          },
          {
            name: 'backup_metadata',
            keyPath: 'id',
          },
        ],
        ...indexedDBConfig,
      });

      await indexedDB.initialize();

      // Initialize persistence manager
      const persistence = new DataPersistenceManager({
        primaryStorage: 'indexedDB',
        fallbackStorage: 'localStorage',
        enableOfflineMode,
        ...persistenceConfig,
      });

      // Initialize session storage manager
      const sessionStorage = new TRPGSessionStorageManager({
        enableEncryption: false,
        expirationMinutes: 480, // 8 hours
      });

      // Initialize migration manager
      const migration = new DataMigrationManager(persistence, '1.0.0');

      // Initialize sync manager
      const sync = new SyncManager(
        {
          enableAutoSync: true,
          enableOfflineQueue: enableOfflineMode,
          ...syncConfig,
        },
        persistence,
        sessionStorage,
        indexedDB
      );

      // Setup sync callbacks
      sync.setCallbacks({
        onStatusChange: setSyncStatus,
        onConflictDetected: (conflict) => {
          setConflicts(prev => [...prev, conflict]);
          if (showNotifications) {
            showNotification(
              `同期競合が検出されました: ${conflict.entityType}`,
              'warning',
              <Button onClick={() => setDialog({ type: 'conflict', open: true, data: conflict })}>解決</Button>
            );
          }
        },
        onSyncComplete: (result) => {
          if (showNotifications && result.conflicts.length > 0) {
            showNotification(
              `同期完了: ${result.syncedItems}件成功, ${result.conflicts.length}件競合`,
              'info'
            );
          }
        },
        onError: (error) => {
          if (showNotifications) {
            showNotification(`同期エラー: ${error.message}`, 'error');
          }
        },
      });

      setManagers({
        persistenceManager: persistence,
        sessionManager: sessionStorage,
        indexedDBManager: indexedDB,
        syncManager: sync,
        migrationManager: migration,
      });

      setIsInitialized(true);

      if (showNotifications) {
        showNotification('データ永続化システムが初期化されました', 'success');
      }

    } catch (error) {
      console.error('Failed to initialize persistence managers:', error);
      if (showNotifications) {
        showNotification(`初期化エラー: ${error}`, 'error');
      }
    }
  }, [persistenceConfig, indexedDBConfig, syncConfig, enableOfflineMode, showNotifications]);

  /**
   * Show notification
   */
  const showNotification = (message: string, severity: NotificationState['severity'], action?: React.ReactNode) => {
    setNotification({ open: true, message, severity, action });
  };

  /**
   * Create backup
   */
  const createBackup = useCallback(async (description = 'Manual backup'): Promise<BackupMetadata> => {
    if (!managers) throw new Error('Managers not initialized');

    try {
      const backup = await managers.migrationManager.createBackup({}, description);
      if (showNotifications) {
        showNotification('バックアップが作成されました', 'success');
      }
      return backup;
    } catch (error) {
      if (showNotifications) {
        showNotification(`バックアップ作成エラー: ${error}`, 'error');
      }
      throw error;
    }
  }, [managers, showNotifications]);

  /**
   * Restore backup
   */
  const restoreBackup = useCallback(async (backupId: string): Promise<void> => {
    if (!managers) throw new Error('Managers not initialized');

    try {
      const backupData = await managers.migrationManager.restoreBackup(backupId);
      await managers.persistenceManager.restoreFromBackup(backupData);
      if (showNotifications) {
        showNotification('バックアップから復元されました', 'success');
      }
    } catch (error) {
      if (showNotifications) {
        showNotification(`復元エラー: ${error}`, 'error');
      }
      throw error;
    }
  }, [managers, showNotifications]);

  /**
   * Run data migration
   */
  const runMigration = useCallback(async (fromVersion: string, toVersion?: string): Promise<MigrationResult> => {
    if (!managers) throw new Error('Managers not initialized');

    try {
      // This would load the data that needs migration
      const data = {}; // Load from storage
      const result = await managers.migrationManager.migrate(data, fromVersion, toVersion);
      
      if (result.success && showNotifications) {
        showNotification('データマイグレーションが完了しました', 'success');
      } else if (!result.success && showNotifications) {
        showNotification(`マイグレーションエラー: ${result.errors.join(', ')}`, 'error');
      }

      return result;
    } catch (error) {
      if (showNotifications) {
        showNotification(`マイグレーションエラー: ${error}`, 'error');
      }
      throw error;
    }
  }, [managers, showNotifications]);

  /**
   * Validate data
   */
  const validateData = useCallback(async (data: any): Promise<ValidationResult> => {
    if (!managers) throw new Error('Managers not initialized');
    return await managers.migrationManager.validateData(data);
  }, [managers]);

  /**
   * Optimize storage
   */
  const optimizeStorage = useCallback(async (): Promise<void> => {
    if (!managers) throw new Error('Managers not initialized');

    try {
      await optimizeStorageInternal();
      if (showNotifications) {
        showNotification('ストレージの最適化が完了しました', 'success');
      }
    } catch (error) {
      if (showNotifications) {
        showNotification(`最適化エラー: ${error}`, 'error');
      }
      throw error;
    }
  }, [managers, optimizeStorageInternal, showNotifications]);

  /**
   * Resolve conflict
   */
  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'local' | 'remote' | 'merged', 
    mergedData?: any
  ): Promise<void> => {
    if (!managers) throw new Error('Managers not initialized');

    try {
      await managers.syncManager.resolveConflict(conflictId, resolution, mergedData);
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      if (showNotifications) {
        showNotification('競合が解決されました', 'success');
      }
    } catch (error) {
      if (showNotifications) {
        showNotification(`競合解決エラー: ${error}`, 'error');
      }
      throw error;
    }
  }, [managers, showNotifications]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<PersistenceConfig & SyncConfig>) => {
    // This would update the configuration and restart necessary services
    console.log('Configuration update requested:', newConfig);
  }, []);

  /**
   * Export diagnostics
   */
  const exportDiagnostics = useCallback(async () => {
    if (!managers) throw new Error('Managers not initialized');
    return await exportDiagnosticsInternal();
  }, [managers, exportDiagnosticsInternal]);

  // Initialize on mount
  useEffect(() => {
    initializeManagers();
  }, [initializeManagers]);

  // Auto-migration check
  useEffect(() => {
    if (!isInitialized || !managers || !enableAutoMigration) return;

    const checkMigration = async () => {
      try {
        // Check if migration is needed
        const currentVersion = '1.0.0'; // This would come from app config
        const dataVersion = localStorage.getItem('trpg_data_version') || '1.0.0';
        
        if (managers.migrationManager.needsMigration(dataVersion)) {
          setDialog({
            type: 'migration',
            open: true,
            data: { fromVersion: dataVersion, toVersion: currentVersion },
          });
        }
      } catch (error) {
        console.error('Migration check failed:', error);
      }
    };

    checkMigration();
  }, [isInitialized, managers, enableAutoMigration]);

  // Context value
  const contextValue: PersistenceContextValue = {
    persistenceManager: managers?.persistenceManager!,
    sessionManager: managers?.sessionManager!,
    indexedDBManager: managers?.indexedDBManager!,
    syncManager: managers?.syncManager!,
    migrationManager: managers?.migrationManager!,
    isInitialized,
    healthStatus,
    syncStatus,
    createBackup,
    restoreBackup,
    runIntegrityCheck: checkIntegrity,
    runMigration,
    validateData,
    optimizeStorage,
    conflicts,
    resolveConflict,
    updateConfig,
    exportDiagnostics,
  };

  if (!isInitialized) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
        <LinearProgress sx={{ width: '50%', mb: 2 }} />
        <Typography variant="h6">データシステムを初期化中...</Typography>
      </Box>
    );
  }

  return (
    <PersistenceContext.Provider value={contextValue}>
      {children}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          action={notification.action}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Migration Dialog */}
      <Dialog
        open={dialog.type === 'migration' && dialog.open}
        onClose={() => setDialog({ type: null, open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>データマイグレーション</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            アプリケーションのデータ形式が更新されました。
            データを新しい形式に移行する必要があります。
          </Typography>
          <Typography variant="body2" color="text.secondary">
            移行前のバックアップが自動的に作成されます。
          </Typography>
          {dialog.data && (
            <Box mt={2}>
              <Typography variant="caption">
                {dialog.data.fromVersion} → {dialog.data.toVersion}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialog({ type: null, open: false })}
            color="secondary"
          >
            後で
          </Button>
          <Button
            onClick={async () => {
              if (dialog.data) {
                await runMigration(dialog.data.fromVersion, dialog.data.toVersion);
                setDialog({ type: null, open: false });
              }
            }}
            variant="contained"
            color="primary"
          >
            マイグレーション実行
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conflict Resolution Dialog */}
      <Dialog
        open={dialog.type === 'conflict' && dialog.open}
        onClose={() => setDialog({ type: null, open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>同期競合の解決</DialogTitle>
        <DialogContent>
          {dialog.data && (
            <>
              <Typography variant="body1" gutterBottom>
                {dialog.data.entityType}で競合が検出されました。
              </Typography>
              <Box display="flex" gap={2} mt={2}>
                <Box flex={1}>
                  <Typography variant="subtitle2">ローカル版</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dialog.data.localTimestamp}
                  </Typography>
                  <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(dialog.data.localData, null, 2)}
                  </pre>
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle2">サーバー版</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dialog.data.remoteTimestamp}
                  </Typography>
                  <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
                    {JSON.stringify(dialog.data.remoteData, null, 2)}
                  </pre>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialog({ type: null, open: false })}
            color="secondary"
          >
            キャンセル
          </Button>
          <Button
            onClick={async () => {
              if (dialog.data) {
                await resolveConflict(dialog.data.id, 'local');
                setDialog({ type: null, open: false });
              }
            }}
            color="primary"
          >
            ローカル版を使用
          </Button>
          <Button
            onClick={async () => {
              if (dialog.data) {
                await resolveConflict(dialog.data.id, 'remote');
                setDialog({ type: null, open: false });
              }
            }}
            color="primary"
          >
            サーバー版を使用
          </Button>
        </DialogActions>
      </Dialog>

      {/* Integrity Check Dialog */}
      <Dialog
        open={dialog.type === 'integrity' && dialog.open}
        onClose={() => setDialog({ type: null, open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>データ整合性チェック結果</DialogTitle>
        <DialogContent>
          {dialog.data && (
            <>
              <Typography variant="body1" gutterBottom>
                {dialog.data.criticalIssues}件の重要な問題と{dialog.data.warnings}件の警告が見つかりました。
              </Typography>
              <Box mt={2}>
                {dialog.data.details.map((detail: any, index: number) => (
                  <Box key={index} mb={1}>
                    <Typography
                      variant="body2"
                      color={detail.severity === 'critical' ? 'error' : 'warning'}
                    >
                      {detail.entityType} ({detail.entityId}): {detail.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {dialog.data.repairSuggestions.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2">修復提案:</Typography>
                  {dialog.data.repairSuggestions.map((suggestion: string, index: number) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      • {suggestion}
                    </Typography>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDialog({ type: null, open: false })}
            color="secondary"
          >
            閉じる
          </Button>
          <Button
            onClick={async () => {
              await repairData({ autoRepair: true });
              setDialog({ type: null, open: false });
            }}
            variant="contained"
            color="primary"
          >
            自動修復実行
          </Button>
        </DialogActions>
      </Dialog>
    </PersistenceContext.Provider>
  );
};

export default DataPersistenceProvider;
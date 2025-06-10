/**
 * React Hook for Data Persistence in TRPG Application
 * Provides comprehensive data persistence with auto-save, versioning, and offline support
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import DataPersistenceManager, { PersistenceConfig, BackupData, SyncQueueItem } from '../utils/persistence/DataPersistenceManager';
import { TRPGCampaign, TRPGCharacter, TimelineEvent } from '@trpg-ai-gm/types';

export interface PersistenceHookOptions {
  entityType: 'campaign' | 'character' | 'session' | 'timeline_event' | 'ai_cache' | 'form_draft';
  entityId: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  enableVersioning?: boolean;
  enableOfflineMode?: boolean;
  onSaveSuccess?: (data: any) => void;
  onSaveError?: (error: Error) => void;
  onOfflineStateChange?: (isOffline: boolean) => void;
  onDataRestore?: (data: any) => void;
}

export interface PersistenceState {
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  isOffline: boolean;
  syncQueueCount: number;
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  lastError: Error | null;
}

export interface PersistenceActions {
  save: (data: any, options?: { force?: boolean }) => Promise<void>;
  load: () => Promise<any>;
  delete: () => Promise<void>;
  createBackup: () => Promise<BackupData>;
  restoreFromBackup: (backup: BackupData) => Promise<void>;
  getVersionHistory: () => Promise<Array<{ timestamp: string; version: string; size: number }>>;
  restoreFromHistory: (timestamp: string) => Promise<any>;
  clearData: () => Promise<void>;
  forceSyncNow: () => Promise<void>;
  optimizeStorage: () => Promise<void>;
  validateIntegrity: () => Promise<{ isValid: boolean; errors: string[]; warnings: string[] }>;
}

export interface UsePersistenceReturn {
  state: PersistenceState;
  actions: PersistenceActions;
  manager: DataPersistenceManager;
}

const defaultPersistenceConfig: Partial<PersistenceConfig> = {
  primaryStorage: 'indexedDB',
  fallbackStorage: 'localStorage',
  version: '1.0.0',
  autoSaveInterval: 5000,
  debounceTime: 1000,
  maxVersionHistory: 20,
  enableOfflineMode: true,
  enableCompression: true,
};

let globalManager: DataPersistenceManager | null = null;

const getOrCreateManager = (config?: Partial<PersistenceConfig>): DataPersistenceManager => {
  if (!globalManager) {
    globalManager = new DataPersistenceManager({ ...defaultPersistenceConfig, ...config });
  }
  return globalManager;
};

export const usePersistence = (options: PersistenceHookOptions): UsePersistenceReturn => {
  const {
    entityType,
    entityId,
    autoSave = true,
    autoSaveInterval = 5000,
    enableVersioning = true,
    enableOfflineMode = true,
    onSaveSuccess,
    onSaveError,
    onOfflineStateChange,
    onDataRestore,
  } = options;

  const manager = getOrCreateManager();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<any>(null);
  const pendingSaveRef = useRef<Promise<void> | null>(null);

  const [state, setState] = useState<PersistenceState>({
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    isOffline: !navigator.onLine,
    syncQueueCount: 0,
    storageUsage: {
      used: 0,
      available: 0,
      percentage: 0,
    },
    lastError: null,
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      onOfflineStateChange?.(false);
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
      onOfflineStateChange?.(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onOfflineStateChange]);

  // Update storage usage periodically
  useEffect(() => {
    const updateStorageUsage = async () => {
      try {
        const stats = await manager.getStorageStats();
        const totalUsed = stats.total.used;
        const totalAvailable = stats.total.available;
        const percentage = totalAvailable > 0 ? (totalUsed / (totalUsed + totalAvailable)) * 100 : 0;

        setState(prev => ({
          ...prev,
          storageUsage: {
            used: totalUsed,
            available: totalAvailable,
            percentage: Math.round(percentage * 100) / 100,
          },
        }));
      } catch (error) {
        console.warn('Failed to update storage usage:', error);
      }
    };

    updateStorageUsage();
    const interval = setInterval(updateStorageUsage, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [manager]);

  // Update sync queue count
  useEffect(() => {
    const updateSyncQueueCount = () => {
      const queueStatus = manager.getSyncQueueStatus();
      setState(prev => ({ ...prev, syncQueueCount: queueStatus.pending }));
    };

    updateSyncQueueCount();
    const interval = setInterval(updateSyncQueueCount, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [manager]);

  // Save data with auto-save and debouncing
  const save = useCallback(async (data: any, options: { force?: boolean } = {}): Promise<void> => {
    const { force = false } = options;

    // Check if data has actually changed
    if (!force && JSON.stringify(data) === JSON.stringify(lastDataRef.current)) {
      return;
    }

    // Wait for any pending save to complete
    if (pendingSaveRef.current) {
      await pendingSaveRef.current;
    }

    setState(prev => ({ ...prev, isSaving: true, lastError: null }));

    try {
      const savePromise = manager.save(entityType, entityId, data, {
        useVersioning: enableVersioning,
        skipOfflineQueue: !enableOfflineMode,
      });

      pendingSaveRef.current = savePromise;
      await savePromise;

      lastDataRef.current = data;
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
      }));

      onSaveSuccess?.(data);
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Save failed');
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastError: saveError,
      }));

      onSaveError?.(saveError);
      throw saveError;
    } finally {
      pendingSaveRef.current = null;
    }
  }, [entityType, entityId, enableVersioning, enableOfflineMode, manager, onSaveSuccess, onSaveError]);

  // Load data
  const load = useCallback(async (): Promise<any> => {
    setState(prev => ({ ...prev, isLoading: true, lastError: null }));

    try {
      const data = await manager.load(entityType, entityId);
      
      if (data) {
        lastDataRef.current = data;
        onDataRestore?.(data);
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return data;
    } catch (error) {
      const loadError = error instanceof Error ? error : new Error('Load failed');
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastError: loadError,
      }));

      throw loadError;
    }
  }, [entityType, entityId, manager, onDataRestore]);

  // Delete data
  const deleteData = useCallback(async (): Promise<void> => {
    try {
      // For deletion, we need to implement a delete method in the manager
      // For now, we'll save null data which effectively removes it
      await manager.save(entityType, entityId, null, { useVersioning: false });
      
      lastDataRef.current = null;
      setState(prev => ({
        ...prev,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
      }));
    } catch (error) {
      const deleteError = error instanceof Error ? error : new Error('Delete failed');
      setState(prev => ({ ...prev, lastError: deleteError }));
      throw deleteError;
    }
  }, [entityType, entityId, manager]);

  // Create backup
  const createBackup = useCallback(async (): Promise<BackupData> => {
    try {
      return await manager.createBackup();
    } catch (error) {
      const backupError = error instanceof Error ? error : new Error('Backup creation failed');
      setState(prev => ({ ...prev, lastError: backupError }));
      throw backupError;
    }
  }, [manager]);

  // Restore from backup
  const restoreFromBackup = useCallback(async (backup: BackupData): Promise<void> => {
    try {
      await manager.restoreFromBackup(backup);
      setState(prev => ({ ...prev, lastSaved: new Date() }));
    } catch (error) {
      const restoreError = error instanceof Error ? error : new Error('Backup restore failed');
      setState(prev => ({ ...prev, lastError: restoreError }));
      throw restoreError;
    }
  }, [manager]);

  // Get version history
  const getVersionHistory = useCallback(async () => {
    try {
      return await manager.getVersionHistory(entityId);
    } catch (error) {
      console.error('Failed to get version history:', error);
      return [];
    }
  }, [manager, entityId]);

  // Restore from history
  const restoreFromHistory = useCallback(async (timestamp: string): Promise<any> => {
    try {
      const data = await manager.restoreFromHistory(entityId, timestamp);
      if (data) {
        lastDataRef.current = data;
        setState(prev => ({ ...prev, hasUnsavedChanges: true }));
        onDataRestore?.(data);
      }
      return data;
    } catch (error) {
      const restoreError = error instanceof Error ? error : new Error('History restore failed');
      setState(prev => ({ ...prev, lastError: restoreError }));
      throw restoreError;
    }
  }, [manager, entityId, onDataRestore]);

  // Clear all data
  const clearData = useCallback(async (): Promise<void> => {
    try {
      await manager.clearAllData();
      lastDataRef.current = null;
      setState(prev => ({
        ...prev,
        lastSaved: null,
        hasUnsavedChanges: false,
      }));
    } catch (error) {
      const clearError = error instanceof Error ? error : new Error('Clear data failed');
      setState(prev => ({ ...prev, lastError: clearError }));
      throw clearError;
    }
  }, [manager]);

  // Force sync now
  const forceSyncNow = useCallback(async (): Promise<void> => {
    try {
      await manager.processSyncQueue();
      const queueStatus = manager.getSyncQueueStatus();
      setState(prev => ({ ...prev, syncQueueCount: queueStatus.pending }));
    } catch (error) {
      const syncError = error instanceof Error ? error : new Error('Sync failed');
      setState(prev => ({ ...prev, lastError: syncError }));
      throw syncError;
    }
  }, [manager]);

  // Optimize storage
  const optimizeStorage = useCallback(async (): Promise<void> => {
    try {
      await manager.optimizeStorage();
    } catch (error) {
      const optimizeError = error instanceof Error ? error : new Error('Storage optimization failed');
      setState(prev => ({ ...prev, lastError: optimizeError }));
      throw optimizeError;
    }
  }, [manager]);

  // Validate data integrity
  const validateIntegrity = useCallback(async () => {
    try {
      return await manager.validateDataIntegrity();
    } catch (error) {
      const validationError = error instanceof Error ? error : new Error('Integrity validation failed');
      setState(prev => ({ ...prev, lastError: validationError }));
      throw validationError;
    }
  }, [manager]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave) return;

    const scheduleAutoSave = (data: any) => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        save(data);
      }, autoSaveInterval);
    };

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSave, autoSaveInterval, save]);

  // Mark unsaved changes when data changes externally
  const markUnsavedChanges = useCallback((data: any) => {
    if (JSON.stringify(data) !== JSON.stringify(lastDataRef.current)) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    actions: {
      save,
      load,
      delete: deleteData,
      createBackup,
      restoreFromBackup,
      getVersionHistory,
      restoreFromHistory,
      clearData,
      forceSyncNow,
      optimizeStorage,
      validateIntegrity,
    },
    manager,
  };
};

// Specialized hooks for different entity types
export const useCampaignPersistence = (campaignId: string, options?: Partial<PersistenceHookOptions>) => {
  return usePersistence({
    entityType: 'campaign',
    entityId: campaignId,
    ...options,
  });
};

export const useCharacterPersistence = (characterId: string, options?: Partial<PersistenceHookOptions>) => {
  return usePersistence({
    entityType: 'character',
    entityId: characterId,
    ...options,
  });
};

export const useSessionPersistence = (sessionId: string, options?: Partial<PersistenceHookOptions>) => {
  return usePersistence({
    entityType: 'session',
    entityId: sessionId,
    ...options,
  });
};

export const useTimelineEventPersistence = (eventId: string, options?: Partial<PersistenceHookOptions>) => {
  return usePersistence({
    entityType: 'timeline_event',
    entityId: eventId,
    ...options,
  });
};

export const useFormDraftPersistence = (formId: string, options?: Partial<PersistenceHookOptions>) => {
  return usePersistence({
    entityType: 'form_draft',
    entityId: formId,
    autoSave: true,
    autoSaveInterval: 2000, // More frequent saving for forms
    enableVersioning: false, // Forms don't need versioning
    ...options,
  });
};

export const useAICachePersistence = (cacheKey: string, options?: Partial<PersistenceHookOptions>) => {
  return usePersistence({
    entityType: 'ai_cache',
    entityId: cacheKey,
    autoSave: true,
    autoSaveInterval: 1000, // Immediate caching
    enableVersioning: false, // Cache doesn't need versioning
    enableOfflineMode: false, // Cache is not synced
    ...options,
  });
};

export default usePersistence;
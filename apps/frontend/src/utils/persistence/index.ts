/**
 * Data Persistence Utilities - Main Export File
 * Centralized exports for all persistence-related utilities and components
 */

// Core managers
export { default as DataPersistenceManager } from './DataPersistenceManager';
export type { 
  PersistenceConfig, 
  StorageItem, 
  SyncQueueItem, 
  BackupData 
} from './DataPersistenceManager';

export { default as SessionStorageManager, TRPGSessionStorageManager } from './SessionStorageManager';
export type { 
  SessionData, 
  SessionStorageOptions 
} from './SessionStorageManager';

export { default as IndexedDBManager } from './IndexedDBManager';
export type { 
  IndexedDBConfig, 
  StoreConfig, 
  IndexConfig, 
  QueryOptions 
} from './IndexedDBManager';

export { default as SyncManager } from './SyncManager';
export type { 
  SyncConfig, 
  SyncItem, 
  ConflictItem, 
  SyncStatus, 
  SyncResult 
} from './SyncManager';

export { default as DataMigrationManager } from './DataMigrationManager';
export type { 
  MigrationConfig, 
  MigrationResult, 
  ValidationResult, 
  BackupMetadata 
} from './DataMigrationManager';

// React hooks
export { default as usePersistence } from '../hooks/usePersistence';
export type { 
  PersistenceHookOptions, 
  PersistenceState, 
  PersistenceActions, 
  UsePersistenceReturn 
} from '../hooks/usePersistence';

export { 
  useCampaignPersistence, 
  useCharacterPersistence, 
  useSessionPersistence, 
  useTimelineEventPersistence, 
  useFormDraftPersistence, 
  useAICachePersistence 
} from '../hooks/usePersistence';

export { default as useDataIntegrity } from '../hooks/useDataIntegrity';
export type { 
  IntegrityCheckResult, 
  DataHealthStatus, 
  RepairOptions, 
  UseDataIntegrityOptions, 
  UseDataIntegrityReturn 
} from '../hooks/useDataIntegrity';

// React components
export { default as DataPersistenceProvider, usePersistenceContext } from '../components/persistence/DataPersistenceProvider';
export type { PersistenceContextValue } from '../components/persistence/DataPersistenceProvider';

export { default as PersistenceStatusIndicator } from '../components/persistence/PersistenceStatusIndicator';

// Utility functions for common persistence operations
export const PersistenceUtils = {
  /**
   * Create a complete backup of all TRPG data
   */
  async createFullBackup(persistenceManager: DataPersistenceManager): Promise<BackupData> {
    return await persistenceManager.createBackup();
  },

  /**
   * Validate TRPG entity data structure
   */
  validateTRPGEntity(entityType: string, data: any): boolean {
    if (!data || typeof data !== 'object' || !data.id) {
      return false;
    }

    switch (entityType) {
      case 'campaign':
        return !!(data.title && data.createdAt && data.updatedAt);
      case 'character':
        return !!(data.name && data.characterType && ['PC', 'NPC', 'Enemy'].includes(data.characterType));
      case 'session':
        return !!(data.campaignId && data.timestamp);
      default:
        return true;
    }
  },

  /**
   * Calculate storage usage across all storage types
   */
  async calculateStorageUsage(): Promise<{
    localStorage: number;
    sessionStorage: number;
    indexedDB: number;
    total: number;
  }> {
    const usage = {
      localStorage: 0,
      sessionStorage: 0,
      indexedDB: 0,
      total: 0,
    };

    // Calculate localStorage usage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('trpg_')) {
        const value = localStorage.getItem(key) || '';
        usage.localStorage += (key.length + value.length) * 2; // UTF-16
      }
    }

    // Calculate sessionStorage usage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('trpg_session_')) {
        const value = sessionStorage.getItem(key) || '';
        usage.sessionStorage += (key.length + value.length) * 2; // UTF-16
      }
    }

    // Estimate IndexedDB usage (requires storage API)
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        usage.indexedDB = estimate.usage || 0;
      } catch (error) {
        console.warn('Could not estimate IndexedDB usage:', error);
      }
    }

    usage.total = usage.localStorage + usage.sessionStorage + usage.indexedDB;
    return usage;
  },

  /**
   * Generate unique ID for entities
   */
  generateEntityId(prefix: string = 'entity'): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomPart}`;
  },

  /**
   * Serialize data with compression if beneficial
   */
  async serializeData(data: any, enableCompression: boolean = true): Promise<{
    serialized: string;
    compressed: boolean;
    originalSize: number;
    compressedSize: number;
  }> {
    const serialized = JSON.stringify(data);
    const originalSize = serialized.length;
    
    if (!enableCompression || originalSize < 1024) {
      return {
        serialized,
        compressed: false,
        originalSize,
        compressedSize: originalSize,
      };
    }

    try {
      // Simple compression using built-in compression API if available
      if (typeof CompressionStream !== 'undefined') {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();

        writer.write(new TextEncoder().encode(serialized));
        writer.close();

        const chunks: Uint8Array[] = [];
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }

        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }

        const compressedString = btoa(String.fromCharCode(...compressed));
        
        // Only use compressed if it's actually smaller
        if (compressedString.length < serialized.length) {
          return {
            serialized: compressedString,
            compressed: true,
            originalSize,
            compressedSize: compressedString.length,
          };
        }
      }
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
    }

    return {
      serialized,
      compressed: false,
      originalSize,
      compressedSize: originalSize,
    };
  },

  /**
   * Deep clone object safely
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  },

  /**
   * Check if two objects are deeply equal
   */
  deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (obj1 == null || obj2 == null) {
      return obj1 === obj2;
    }

    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }

      if (!this.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  },

  /**
   * Debounce function for auto-save operations
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function for performance-critical operations
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        func(...args);
      }
    };
  },

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Generate checksum for data integrity
   */
  async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Retry function with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxAttempts) {
          throw lastError;
        }

        const delay = initialDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },
};

// Constants for persistence configuration
export const PERSISTENCE_CONSTANTS = {
  STORAGE_KEYS: {
    CAMPAIGN_PREFIX: 'trpg_campaign_',
    CAMPAIGN_LIST: 'trpg_campaign_list',
    CURRENT_CAMPAIGN: 'currentCampaignId',
    SESSION_PREFIX: 'trpg_session_',
    BACKUP_PREFIX: 'trpg_backup_',
    MIGRATION_VERSION: 'trpg_data_version',
  },
  
  TIMEOUTS: {
    AUTO_SAVE: 5000,
    SYNC_INTERVAL: 30000,
    INTEGRITY_CHECK: 1800000, // 30 minutes
    SESSION_CLEANUP: 3600000, // 1 hour
  },
  
  LIMITS: {
    LOCAL_STORAGE_MAX: 5 * 1024 * 1024, // 5MB
    SESSION_STORAGE_MAX: 5 * 1024 * 1024, // 5MB
    INDEXED_DB_MAX: 50 * 1024 * 1024, // 50MB
    VERSION_HISTORY_MAX: 20,
    BACKUP_RETENTION_DAYS: 30,
  },
  
  ERROR_CODES: {
    STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
    DATA_CORRUPTION: 'DATA_CORRUPTION',
    SYNC_CONFLICT: 'SYNC_CONFLICT',
    MIGRATION_FAILED: 'MIGRATION_FAILED',
    INTEGRITY_CHECK_FAILED: 'INTEGRITY_CHECK_FAILED',
  },
};

// Default configurations
export const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
  primaryStorage: 'indexedDB',
  fallbackStorage: 'localStorage',
  version: '1.0.0',
  autoSaveInterval: PERSISTENCE_CONSTANTS.TIMEOUTS.AUTO_SAVE,
  debounceTime: 1000,
  maxVersionHistory: PERSISTENCE_CONSTANTS.LIMITS.VERSION_HISTORY_MAX,
  enableOfflineMode: true,
  offlineStorageLimit: PERSISTENCE_CONSTANTS.LIMITS.INDEXED_DB_MAX,
  syncRetries: 3,
  enableCompression: true,
  compressionThreshold: 1024,
};

export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  syncInterval: PERSISTENCE_CONSTANTS.TIMEOUTS.SYNC_INTERVAL,
  maxRetries: 3,
  batchSize: 50,
  conflictResolution: 'timestamp',
  enableAutoSync: true,
  enableOfflineQueue: true,
  compressionThreshold: 1024,
};

export const DEFAULT_INDEXEDDB_CONFIG: IndexedDBConfig = {
  dbName: 'TRPGDataDB',
  version: 1,
  stores: [],
  enableTransactions: true,
  enableCaching: true,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
};

// Type guards
export const TypeGuards = {
  isTRPGCampaign(obj: any): obj is any {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.id === 'string' && 
           typeof obj.title === 'string' &&
           Array.isArray(obj.characters);
  },

  isTRPGCharacter(obj: any): obj is any {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.id === 'string' && 
           typeof obj.name === 'string' &&
           ['PC', 'NPC', 'Enemy'].includes(obj.characterType);
  },

  isTRPGSession(obj: any): obj is any {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.id === 'string' && 
           typeof obj.campaignId === 'string' &&
           typeof obj.timestamp === 'string';
  },

  isStorageItem(obj: any): obj is StorageItem {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.id === 'string' && 
           typeof obj.timestamp === 'string' &&
           typeof obj.version === 'string' &&
           obj.data !== undefined;
  },
};

export default {
  DataPersistenceManager,
  SessionStorageManager,
  TRPGSessionStorageManager,
  IndexedDBManager,
  SyncManager,
  DataMigrationManager,
  usePersistence,
  useDataIntegrity,
  DataPersistenceProvider,
  usePersistenceContext,
  PersistenceStatusIndicator,
  PersistenceUtils,
  PERSISTENCE_CONSTANTS,
  DEFAULT_PERSISTENCE_CONFIG,
  DEFAULT_SYNC_CONFIG,
  DEFAULT_INDEXEDDB_CONFIG,
  TypeGuards,
};
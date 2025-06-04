/**
 * Comprehensive Data Persistence Manager for TRPG Application
 * Handles LocalStorage, SessionStorage, IndexedDB, and offline sync
 */

import { TRPGCampaign, TRPGCharacter, TRPGSession, TimelineEvent } from '@trpg-ai-gm/types';

export interface PersistenceConfig {
  // Storage type preferences
  primaryStorage: 'localStorage' | 'indexedDB' | 'sessionStorage';
  fallbackStorage: 'localStorage' | 'indexedDB' | 'sessionStorage';
  
  // Data versioning
  version: string;
  migrationCallbacks?: Record<string, (data: any) => any>;
  
  // Auto-save settings
  autoSaveInterval: number; // milliseconds
  debounceTime: number; // milliseconds
  maxVersionHistory: number;
  
  // Offline support
  enableOfflineMode: boolean;
  offlineStorageLimit: number; // bytes
  syncRetries: number;
  
  // Compression
  enableCompression: boolean;
  compressionThreshold: number; // bytes
}

export interface StorageItem<T = any> {
  id: string;
  data: T;
  timestamp: string;
  version: string;
  size: number;
  isCompressed: boolean;
  isOffline: boolean;
  checksum?: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

export interface BackupData {
  campaigns: TRPGCampaign[];
  preferences: Record<string, any>;
  aiSettings: Record<string, any>;
  sessionData: Record<string, any>;
  metadata: {
    version: string;
    timestamp: string;
    appVersion: string;
    size: number;
  };
}

class DataPersistenceManager {
  private config: PersistenceConfig;
  private dbName = 'TRPGDataDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline = navigator.onLine;
  private compressionSupported = false;

  // Default configuration
  private defaultConfig: PersistenceConfig = {
    primaryStorage: 'indexedDB',
    fallbackStorage: 'localStorage',
    version: '1.0.0',
    autoSaveInterval: 5000,
    debounceTime: 1000,
    maxVersionHistory: 20,
    enableOfflineMode: true,
    offlineStorageLimit: 50 * 1024 * 1024, // 50MB
    syncRetries: 3,
    enableCompression: true,
    compressionThreshold: 1024, // 1KB
  };

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
    this.initializeCompression();
    this.setupOnlineDetection();
    this.initializeIndexedDB();
    this.loadSyncQueue();
  }

  /**
   * Initialize compression support detection
   */
  private initializeCompression(): void {
    try {
      // Check if compression is supported
      if (typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined') {
        this.compressionSupported = true;
      }
    } catch (error) {
      console.warn('Compression not supported:', error);
      this.compressionSupported = false;
    }
  }

  /**
   * Setup online/offline detection
   */
  private setupOnlineDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('campaigns')) {
          const campaignStore = db.createObjectStore('campaigns', { keyPath: 'id' });
          campaignStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          campaignStore.createIndex('title', 'title', { unique: false });
        }

        if (!db.objectStoreNames.contains('characters')) {
          const characterStore = db.createObjectStore('characters', { keyPath: 'id' });
          characterStore.createIndex('campaignId', 'campaignId', { unique: false });
          characterStore.createIndex('characterType', 'characterType', { unique: false });
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('campaignId', 'campaignId', { unique: false });
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('timeline_events')) {
          const timelineStore = db.createObjectStore('timeline_events', { keyPath: 'id' });
          timelineStore.createIndex('campaignId', 'campaignId', { unique: false });
          timelineStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('ai_cache')) {
          const aiCacheStore = db.createObjectStore('ai_cache', { keyPath: 'id' });
          aiCacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          aiCacheStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('form_drafts')) {
          const draftsStore = db.createObjectStore('form_drafts', { keyPath: 'id' });
          draftsStore.createIndex('formType', 'formType', { unique: false });
          draftsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('version_history')) {
          const historyStore = db.createObjectStore('version_history', { keyPath: 'id' });
          historyStore.createIndex('entityId', 'entityId', { unique: false });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Compress data if supported and beneficial
   */
  private async compressData(data: string): Promise<string> {
    if (!this.compressionSupported || !this.config.enableCompression || 
        data.length < this.config.compressionThreshold) {
      return data;
    }

    try {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new TextEncoder().encode(data));
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

      return btoa(String.fromCharCode(...compressed));
    } catch (error) {
      console.warn('Compression failed, storing uncompressed:', error);
      return data;
    }
  }

  /**
   * Decompress data if needed
   */
  private async decompressData(data: string, isCompressed: boolean): Promise<string> {
    if (!isCompressed || !this.compressionSupported) {
      return data;
    }

    try {
      const compressed = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(compressed);
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      }

      return new TextDecoder().decode(decompressed);
    } catch (error) {
      console.error('Decompression failed:', error);
      throw error;
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Save data to IndexedDB
   */
  private async saveToIndexedDB<T>(storeName: string, item: StorageItem<T>): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load data from IndexedDB
   */
  private async loadFromIndexedDB<T>(storeName: string, id: string): Promise<StorageItem<T> | null> {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save data to localStorage with fallback
   */
  private saveToLocalStorage<T>(key: string, item: StorageItem<T>): void {
    try {
      const serialized = JSON.stringify(item);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  }

  /**
   * Load data from localStorage
   */
  private loadFromLocalStorage<T>(key: string): StorageItem<T> | null {
    try {
      const serialized = localStorage.getItem(key);
      if (!serialized) return null;
      return JSON.parse(serialized);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  /**
   * Generic save method with storage strategy
   */
  async save<T>(
    storeName: string,
    id: string,
    data: T,
    options: {
      useVersioning?: boolean;
      skipOfflineQueue?: boolean;
      forceStorage?: 'localStorage' | 'indexedDB';
    } = {}
  ): Promise<void> {
    const { useVersioning = true, skipOfflineQueue = false, forceStorage } = options;

    const serializedData = JSON.stringify(data);
    const compressedData = await this.compressData(serializedData);
    const checksum = await this.calculateChecksum(serializedData);

    const item: StorageItem<T> = {
      id,
      data,
      timestamp: new Date().toISOString(),
      version: this.config.version,
      size: serializedData.length,
      isCompressed: compressedData !== serializedData,
      isOffline: !this.isOnline,
      checksum,
    };

    const storageType = forceStorage || this.config.primaryStorage;

    try {
      if (storageType === 'indexedDB' && this.db) {
        await this.saveToIndexedDB(storeName, item);
      } else {
        this.saveToLocalStorage(`${storeName}_${id}`, item);
      }

      // Version history management
      if (useVersioning) {
        await this.saveVersionHistory(storeName, id, item);
      }

      // Add to sync queue if offline and not explicitly skipped
      if (!this.isOnline && !skipOfflineQueue) {
        await this.addToSyncQueue(id, 'update', data);
      }

    } catch (primaryError) {
      console.warn(`Failed to save to ${storageType}, trying fallback:`, primaryError);
      
      // Fallback storage
      const fallbackType = this.config.fallbackStorage;
      if (fallbackType === 'localStorage') {
        this.saveToLocalStorage(`${storeName}_${id}`, item);
      } else if (fallbackType === 'indexedDB' && this.db) {
        await this.saveToIndexedDB(storeName, item);
      } else {
        throw new Error(`Both primary and fallback storage failed: ${primaryError}`);
      }
    }
  }

  /**
   * Generic load method with storage strategy
   */
  async load<T>(
    storeName: string,
    id: string,
    options: {
      forceStorage?: 'localStorage' | 'indexedDB';
      validateChecksum?: boolean;
    } = {}
  ): Promise<T | null> {
    const { forceStorage, validateChecksum = true } = options;
    const storageType = forceStorage || this.config.primaryStorage;

    let item: StorageItem<T> | null = null;

    try {
      if (storageType === 'indexedDB' && this.db) {
        item = await this.loadFromIndexedDB<T>(storeName, id);
      } else {
        item = this.loadFromLocalStorage<T>(`${storeName}_${id}`);
      }
    } catch (primaryError) {
      console.warn(`Failed to load from ${storageType}, trying fallback:`, primaryError);
      
      // Fallback storage
      const fallbackType = this.config.fallbackStorage;
      if (fallbackType === 'localStorage') {
        item = this.loadFromLocalStorage<T>(`${storeName}_${id}`);
      } else if (fallbackType === 'indexedDB' && this.db) {
        item = await this.loadFromIndexedDB<T>(storeName, id);
      }
    }

    if (!item) return null;

    // Validate checksum if requested
    if (validateChecksum && item.checksum) {
      const serializedData = JSON.stringify(item.data);
      const calculatedChecksum = await this.calculateChecksum(serializedData);
      if (calculatedChecksum !== item.checksum) {
        console.warn('Data integrity check failed for:', id);
        // Could implement data recovery logic here
      }
    }

    return item.data;
  }

  /**
   * Save version history for undo/redo functionality
   */
  private async saveVersionHistory<T>(storeName: string, entityId: string, item: StorageItem<T>): Promise<void> {
    const historyItem = {
      id: `${entityId}_${Date.now()}`,
      entityId,
      storeName,
      item,
      timestamp: new Date().toISOString(),
    };

    try {
      if (this.db) {
        await this.saveToIndexedDB('version_history', historyItem);
      } else {
        const existingHistory = this.loadFromLocalStorage(`version_history_${entityId}`) || [];
        existingHistory.push(historyItem);
        
        // Limit history size
        if (existingHistory.length > this.config.maxVersionHistory) {
          existingHistory.splice(0, existingHistory.length - this.config.maxVersionHistory);
        }
        
        this.saveToLocalStorage(`version_history_${entityId}`, existingHistory);
      }
    } catch (error) {
      console.warn('Failed to save version history:', error);
    }
  }

  /**
   * Get version history for an entity
   */
  async getVersionHistory(entityId: string): Promise<Array<{ timestamp: string; version: string; size: number }>> {
    try {
      if (this.db) {
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction(['version_history'], 'readonly');
          const store = transaction.objectStore('version_history');
          const index = store.index('entityId');
          const request = index.getAll(entityId);

          request.onsuccess = () => {
            const results = request.result.map((item: any) => ({
              timestamp: item.timestamp,
              version: item.item.version,
              size: item.item.size,
            }));
            resolve(results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        const history = this.loadFromLocalStorage(`version_history_${entityId}`) || [];
        return history.map((item: any) => ({
          timestamp: item.timestamp,
          version: item.item.version,
          size: item.item.size,
        }));
      }
    } catch (error) {
      console.error('Failed to get version history:', error);
      return [];
    }
  }

  /**
   * Restore from version history
   */
  async restoreFromHistory<T>(entityId: string, timestamp: string): Promise<T | null> {
    try {
      if (this.db) {
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction(['version_history'], 'readonly');
          const store = transaction.objectStore('version_history');
          const index = store.index('entityId');
          const request = index.getAll(entityId);

          request.onsuccess = () => {
            const historyItem = request.result.find((item: any) => item.timestamp === timestamp);
            resolve(historyItem ? historyItem.item.data : null);
          };
          request.onerror = () => reject(request.error);
        });
      } else {
        const history = this.loadFromLocalStorage(`version_history_${entityId}`) || [];
        const historyItem = history.find((item: any) => item.timestamp === timestamp);
        return historyItem ? historyItem.item.data : null;
      }
    } catch (error) {
      console.error('Failed to restore from history:', error);
      return null;
    }
  }

  /**
   * Add item to sync queue for offline synchronization
   */
  private async addToSyncQueue(id: string, action: 'create' | 'update' | 'delete', data: any): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: `${action}_${id}_${Date.now()}`,
      action,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);

    try {
      await this.save('sync_queue', queueItem.id, queueItem, { useVersioning: false, skipOfflineQueue: true });
    } catch (error) {
      console.warn('Failed to persist sync queue item:', error);
    }
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      if (this.db) {
        const transaction = this.db.transaction(['sync_queue'], 'readonly');
        const store = transaction.objectStore('sync_queue');
        const request = store.getAll();

        request.onsuccess = () => {
          this.syncQueue = request.result.map((item: any) => item.data || item);
        };
      } else {
        // For localStorage, we'd need to enumerate all sync_queue keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sync_queue_')) {
            const item = this.loadFromLocalStorage(key);
            if (item) {
              this.syncQueue.push(item.data);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load sync queue:', error);
    }
  }

  /**
   * Process sync queue when online
   */
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const itemsToProcess = [...this.syncQueue];
    
    for (const item of itemsToProcess) {
      try {
        // Here you would implement the actual sync logic with your backend
        // For now, we'll just simulate successful sync
        await this.simulateServerSync(item);
        
        // Remove from queue after successful sync
        this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
        
        // Remove from storage
        if (this.db) {
          const transaction = this.db.transaction(['sync_queue'], 'readwrite');
          const store = transaction.objectStore('sync_queue');
          store.delete(item.id);
        } else {
          localStorage.removeItem(`sync_queue_${item.id}`);
        }
        
      } catch (error) {
        console.error('Failed to sync item:', item.id, error);
        item.retryCount++;
        item.lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // Remove items that have exceeded retry limit
        if (item.retryCount >= this.config.syncRetries) {
          this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
          console.warn('Sync item exceeded retry limit and was removed:', item.id);
        }
      }
    }
  }

  /**
   * Simulate server synchronization (replace with actual implementation)
   */
  private async simulateServerSync(item: SyncQueueItem): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Simulated sync failure');
    }
  }

  /**
   * Create complete backup of all data
   */
  async createBackup(): Promise<BackupData> {
    const backup: BackupData = {
      campaigns: [],
      preferences: {},
      aiSettings: {},
      sessionData: {},
      metadata: {
        version: this.config.version,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.0', // Should come from app config
        size: 0,
      },
    };

    try {
      // Backup campaigns
      if (this.db) {
        const campaigns = await this.getAllFromIndexedDB<TRPGCampaign>('campaigns');
        backup.campaigns = campaigns.map(item => item.data);
      } else {
        // Backup from localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('campaigns_')) {
            const item = this.loadFromLocalStorage<TRPGCampaign>(key);
            if (item) {
              backup.campaigns.push(item.data);
            }
          }
        }
      }

      // Backup preferences and settings
      backup.preferences = this.loadFromLocalStorage('app_preferences')?.data || {};
      backup.aiSettings = this.loadFromLocalStorage('ai_settings')?.data || {};

      // Calculate total size
      backup.metadata.size = JSON.stringify(backup).length;

    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }

    return backup;
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backup: BackupData): Promise<void> {
    try {
      // Validate backup
      if (!backup.metadata || !backup.campaigns) {
        throw new Error('Invalid backup format');
      }

      // Clear existing data
      await this.clearAllData();

      // Restore campaigns
      for (const campaign of backup.campaigns) {
        await this.save('campaigns', campaign.id, campaign);
      }

      // Restore preferences and settings
      if (backup.preferences) {
        await this.save('app_preferences', 'main', backup.preferences);
      }
      
      if (backup.aiSettings) {
        await this.save('ai_settings', 'main', backup.aiSettings);
      }

      console.log('Backup restored successfully');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * Get all items from IndexedDB store
   */
  private async getAllFromIndexedDB<T>(storeName: string): Promise<StorageItem<T>[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all data (use with caution)
   */
  async clearAllData(): Promise<void> {
    try {
      if (this.db) {
        const storeNames = ['campaigns', 'characters', 'sessions', 'timeline_events', 'ai_cache', 'form_drafts'];
        for (const storeName of storeNames) {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          await new Promise<void>((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }

      // Clear localStorage items
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.match(/^(campaigns_|characters_|sessions_|timeline_events_|ai_cache_|form_drafts_)/)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    localStorage: { used: number; available: number };
    indexedDB: { used: number; available: number };
    total: { used: number; available: number };
  }> {
    const stats = {
      localStorage: { used: 0, available: 0 },
      indexedDB: { used: 0, available: 0 },
      total: { used: 0, available: 0 },
    };

    try {
      // Calculate localStorage usage
      let localStorageUsed = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          localStorageUsed += key.length + value.length;
        }
      }
      stats.localStorage.used = localStorageUsed * 2; // UTF-16 encoding
      stats.localStorage.available = 5 * 1024 * 1024 - stats.localStorage.used; // Assume 5MB limit

      // Calculate IndexedDB usage (approximate)
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        stats.indexedDB.used = estimate.usage || 0;
        stats.indexedDB.available = (estimate.quota || 0) - stats.indexedDB.used;
      }

      stats.total.used = stats.localStorage.used + stats.indexedDB.used;
      stats.total.available = stats.localStorage.available + stats.indexedDB.available;

    } catch (error) {
      console.warn('Failed to calculate storage stats:', error);
    }

    return stats;
  }

  /**
   * Cleanup old data and optimize storage
   */
  async optimizeStorage(): Promise<void> {
    try {
      // Clean up version history beyond limit
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days of history

      if (this.db) {
        const transaction = this.db.transaction(['version_history'], 'readwrite');
        const store = transaction.objectStore('version_history');
        const index = store.index('timestamp');
        const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate.toISOString()));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      }

      // Clean up AI cache older than 7 days
      const aiCacheCutoff = new Date();
      aiCacheCutoff.setDate(aiCacheCutoff.getDate() - 7);

      if (this.db) {
        const transaction = this.db.transaction(['ai_cache'], 'readwrite');
        const store = transaction.objectStore('ai_cache');
        const index = store.index('timestamp');
        const request = index.openCursor(IDBKeyRange.upperBound(aiCacheCutoff.toISOString()));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      }

      console.log('Storage optimization completed');
    } catch (error) {
      console.error('Storage optimization failed:', error);
    }
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus(): {
    pending: number;
    failed: number;
    lastSync: string | null;
  } {
    const failed = this.syncQueue.filter(item => item.retryCount > 0).length;
    const lastSyncItem = this.syncQueue
      .filter(item => item.retryCount === 0)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return {
      pending: this.syncQueue.length,
      failed,
      lastSync: lastSyncItem ? lastSyncItem.timestamp : null,
    };
  }

  /**
   * Check data integrity across all storage types
   */
  async validateDataIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    try {
      // Check campaigns
      const campaigns = await this.getAllFromIndexedDB<TRPGCampaign>('campaigns');
      for (const campaign of campaigns) {
        if (!campaign.data.id || !campaign.data.title) {
          result.errors.push(`Invalid campaign data: ${campaign.id}`);
          result.isValid = false;
        }

        if (campaign.checksum) {
          const calculatedChecksum = await this.calculateChecksum(JSON.stringify(campaign.data));
          if (calculatedChecksum !== campaign.checksum) {
            result.errors.push(`Checksum mismatch for campaign: ${campaign.id}`);
            result.isValid = false;
          }
        }
      }

      // Check for orphaned data
      // This would involve checking relationships between campaigns, characters, etc.

    } catch (error) {
      result.errors.push(`Integrity check failed: ${error}`);
      result.isValid = false;
    }

    return result;
  }
}

export default DataPersistenceManager;
/**
 * Synchronization Manager for TRPG Application
 * Handles data synchronization between different storage types and remote servers
 */

import DataPersistenceManager from './DataPersistenceManager';
import SessionStorageManager from './SessionStorageManager';
import IndexedDBManager from './IndexedDBManager';

export interface SyncConfig {
  remoteEndpoint?: string;
  apiKey?: string;
  syncInterval: number; // milliseconds
  maxRetries: number;
  batchSize: number;
  conflictResolution: 'client' | 'server' | 'manual' | 'timestamp';
  enableAutoSync: boolean;
  enableOfflineQueue: boolean;
  compressionThreshold: number; // bytes
}

export interface SyncItem {
  id: string;
  entityType: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  version: string;
  checksum: string;
  retryCount: number;
  lastError?: string;
  priority: 'low' | 'normal' | 'high';
}

export interface ConflictItem {
  id: string;
  entityType: string;
  localData: any;
  remoteData: any;
  localTimestamp: string;
  remoteTimestamp: string;
  conflictType: 'update_conflict' | 'delete_conflict' | 'create_conflict';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  pendingItems: number;
  failedItems: number;
  conflicts: number;
  syncProgress: {
    total: number;
    completed: number;
    percentage: number;
  };
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  conflicts: ConflictItem[];
  errors: string[];
  duration: number;
}

class SyncManager {
  private config: SyncConfig;
  private persistenceManager: DataPersistenceManager;
  private sessionManager: SessionStorageManager;
  private indexedDBManager: IndexedDBManager;
  
  private syncQueue: SyncItem[] = [];
  private conflictQueue: ConflictItem[] = [];
  private status: SyncStatus;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline = navigator.onLine;
  private isSyncing = false;

  // Event callbacks
  private onStatusChange?: (status: SyncStatus) => void;
  private onConflictDetected?: (conflict: ConflictItem) => void;
  private onSyncComplete?: (result: SyncResult) => void;
  private onError?: (error: Error) => void;

  constructor(
    config: Partial<SyncConfig>,
    persistenceManager: DataPersistenceManager,
    sessionManager: SessionStorageManager,
    indexedDBManager: IndexedDBManager
  ) {
    this.config = {
      syncInterval: 30000, // 30 seconds
      maxRetries: 3,
      batchSize: 50,
      conflictResolution: 'timestamp',
      enableAutoSync: true,
      enableOfflineQueue: true,
      compressionThreshold: 1024,
      ...config,
    };

    this.persistenceManager = persistenceManager;
    this.sessionManager = sessionManager;
    this.indexedDBManager = indexedDBManager;

    this.status = {
      isOnline: this.isOnline,
      isSyncing: false,
      lastSync: null,
      pendingItems: 0,
      failedItems: 0,
      conflicts: 0,
      syncProgress: { total: 0, completed: 0, percentage: 0 },
      errors: [],
    };

    this.setupNetworkListeners();
    this.loadSyncQueue();
    
    if (this.config.enableAutoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Setup event callbacks
   */
  setCallbacks(callbacks: {
    onStatusChange?: (status: SyncStatus) => void;
    onConflictDetected?: (conflict: ConflictItem) => void;
    onSyncComplete?: (result: SyncResult) => void;
    onError?: (error: Error) => void;
  }): void {
    this.onStatusChange = callbacks.onStatusChange;
    this.onConflictDetected = callbacks.onConflictDetected;
    this.onSyncComplete = callbacks.onSyncComplete;
    this.onError = callbacks.onError;
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateStatus({ isOnline: true });
      
      if (this.config.enableAutoSync && this.syncQueue.length > 0) {
        this.sync();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateStatus({ isOnline: false });
    });
  }

  /**
   * Update sync status and notify listeners
   */
  private updateStatus(update: Partial<SyncStatus>): void {
    this.status = { ...this.status, ...update };
    this.onStatusChange?.(this.status);
  }

  /**
   * Load sync queue from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await this.indexedDBManager.getAll<SyncItem>('sync_queue');
      this.syncQueue = queueData || [];
      
      const conflictData = await this.indexedDBManager.getAll<ConflictItem>('sync_conflicts');
      this.conflictQueue = conflictData || [];

      this.updateStatus({
        pendingItems: this.syncQueue.length,
        conflicts: this.conflictQueue.length,
      });
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      // Clear existing queue items
      await this.indexedDBManager.clear('sync_queue');
      
      // Save current queue
      const operations = this.syncQueue.map(item => ({
        store: 'sync_queue',
        operation: 'put' as const,
        data: item,
      }));

      if (operations.length > 0) {
        await this.indexedDBManager.transaction(operations);
      }
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Add item to sync queue
   */
  async addToQueue(
    entityType: string,
    entityId: string,
    action: 'create' | 'update' | 'delete',
    data: any,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<void> {
    const checksum = await this.calculateChecksum(JSON.stringify(data));
    
    const syncItem: SyncItem = {
      id: `${action}_${entityType}_${entityId}_${Date.now()}`,
      entityType,
      action,
      data,
      timestamp: new Date().toISOString(),
      version: '1.0.0', // Should come from app config
      checksum,
      retryCount: 0,
      priority,
    };

    // Remove any existing items for the same entity to avoid duplicates
    this.syncQueue = this.syncQueue.filter(
      item => !(item.entityType === entityType && 
                (item.data?.id === entityId || item.data?.id === data?.id))
    );

    this.syncQueue.push(syncItem);
    
    // Sort by priority and timestamp
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    await this.saveSyncQueue();
    this.updateStatus({ pendingItems: this.syncQueue.length });

    // Trigger immediate sync if online and not already syncing
    if (this.isOnline && !this.isSyncing && priority === 'high') {
      this.sync();
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
   * Start automatic synchronization
   */
  startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        this.sync();
      }
    }, this.config.syncInterval);
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform synchronization
   */
  async sync(force = false): Promise<SyncResult> {
    if (!this.isOnline && !force) {
      throw new Error('Cannot sync while offline');
    }

    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    const startTime = Date.now();
    
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      conflicts: [],
      errors: [],
      duration: 0,
    };

    this.updateStatus({
      isSyncing: true,
      syncProgress: { total: this.syncQueue.length, completed: 0, percentage: 0 },
      errors: [],
    });

    try {
      // Process items in batches
      const totalItems = this.syncQueue.length;
      let processedItems = 0;

      while (this.syncQueue.length > 0) {
        const batch = this.syncQueue.splice(0, this.config.batchSize);
        
        for (const item of batch) {
          try {
            await this.syncItem(item);
            result.syncedItems++;
            processedItems++;
          } catch (error) {
            console.error('Failed to sync item:', item.id, error);
            
            item.retryCount++;
            item.lastError = error instanceof Error ? error.message : 'Unknown error';
            
            if (item.retryCount < this.config.maxRetries) {
              // Re-add to queue for retry
              this.syncQueue.push(item);
            } else {
              result.failedItems++;
              result.errors.push(`Failed to sync ${item.id}: ${item.lastError}`);
            }
          }

          // Update progress
          const percentage = totalItems > 0 ? (processedItems / totalItems) * 100 : 100;
          this.updateStatus({
            syncProgress: { total: totalItems, completed: processedItems, percentage },
          });
        }

        // Small delay between batches to avoid overwhelming the server
        if (this.syncQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Process conflicts
      await this.resolveConflicts();
      result.conflicts = [...this.conflictQueue];

      // Update final status
      result.duration = Date.now() - startTime;
      result.success = result.failedItems === 0;

      this.updateStatus({
        lastSync: new Date().toISOString(),
        pendingItems: this.syncQueue.length,
        failedItems: result.failedItems,
        conflicts: this.conflictQueue.length,
      });

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      this.onError?.(error instanceof Error ? error : new Error('Sync failed'));
    } finally {
      this.isSyncing = false;
      this.updateStatus({
        isSyncing: false,
        syncProgress: { total: 0, completed: 0, percentage: 0 },
      });

      await this.saveSyncQueue();
      this.onSyncComplete?.(result);
    }

    return result;
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncItem): Promise<void> {
    if (!this.config.remoteEndpoint) {
      // Simulate successful sync for demo purposes
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      // Simulate occasional failures
      if (Math.random() < 0.05) {
        throw new Error('Simulated sync failure');
      }
      
      return;
    }

    // Real implementation would make HTTP requests here
    const url = `${this.config.remoteEndpoint}/${item.entityType}/${item.data?.id || ''}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    let response: Response;

    switch (item.action) {
      case 'create':
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(item.data),
        });
        break;

      case 'update':
        response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(item.data),
        });
        break;

      case 'delete':
        response = await fetch(url, {
          method: 'DELETE',
          headers,
        });
        break;
    }

    if (!response.ok) {
      if (response.status === 409) {
        // Conflict detected
        const remoteData = await response.json();
        await this.handleConflict(item, remoteData);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflict(localItem: SyncItem, remoteData: any): Promise<void> {
    const conflict: ConflictItem = {
      id: `conflict_${localItem.id}_${Date.now()}`,
      entityType: localItem.entityType,
      localData: localItem.data,
      remoteData,
      localTimestamp: localItem.timestamp,
      remoteTimestamp: remoteData.updatedAt || remoteData.timestamp || new Date().toISOString(),
      conflictType: localItem.action === 'delete' ? 'delete_conflict' : 
                   localItem.action === 'create' ? 'create_conflict' : 'update_conflict',
    };

    this.conflictQueue.push(conflict);
    this.onConflictDetected?.(conflict);

    // Save conflict for later resolution
    await this.indexedDBManager.put('sync_conflicts', conflict);
  }

  /**
   * Resolve conflicts based on configured strategy
   */
  private async resolveConflicts(): Promise<void> {
    if (this.config.conflictResolution === 'manual') {
      // Manual resolution requires user intervention
      return;
    }

    const resolvedConflicts: string[] = [];

    for (const conflict of this.conflictQueue) {
      try {
        let resolvedData: any;

        switch (this.config.conflictResolution) {
          case 'client':
            resolvedData = conflict.localData;
            break;

          case 'server':
            resolvedData = conflict.remoteData;
            break;

          case 'timestamp':
            const localTime = new Date(conflict.localTimestamp).getTime();
            const remoteTime = new Date(conflict.remoteTimestamp).getTime();
            resolvedData = localTime > remoteTime ? conflict.localData : conflict.remoteData;
            break;
        }

        // Apply resolved data
        if (resolvedData) {
          await this.persistenceManager.save(
            conflict.entityType,
            resolvedData.id,
            resolvedData,
            { useVersioning: true, skipOfflineQueue: true }
          );
        }

        resolvedConflicts.push(conflict.id);
      } catch (error) {
        console.error('Failed to resolve conflict:', conflict.id, error);
      }
    }

    // Remove resolved conflicts
    this.conflictQueue = this.conflictQueue.filter(
      conflict => !resolvedConflicts.includes(conflict.id)
    );

    // Update storage
    for (const conflictId of resolvedConflicts) {
      await this.indexedDBManager.delete('sync_conflicts', conflictId);
    }
  }

  /**
   * Manually resolve a specific conflict
   */
  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: any): Promise<void> {
    const conflictIndex = this.conflictQueue.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) {
      throw new Error('Conflict not found');
    }

    const conflict = this.conflictQueue[conflictIndex];
    let resolvedData: any;

    switch (resolution) {
      case 'local':
        resolvedData = conflict.localData;
        break;
      case 'remote':
        resolvedData = conflict.remoteData;
        break;
      case 'merged':
        if (!mergedData) {
          throw new Error('Merged data required for merged resolution');
        }
        resolvedData = mergedData;
        break;
    }

    // Apply resolved data
    await this.persistenceManager.save(
      conflict.entityType,
      resolvedData.id,
      resolvedData,
      { useVersioning: true, skipOfflineQueue: true }
    );

    // Remove from conflict queue
    this.conflictQueue.splice(conflictIndex, 1);
    await this.indexedDBManager.delete('sync_conflicts', conflictId);

    this.updateStatus({ conflicts: this.conflictQueue.length });
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Get pending sync items
   */
  getPendingItems(): SyncItem[] {
    return [...this.syncQueue];
  }

  /**
   * Get conflict items
   */
  getConflicts(): ConflictItem[] {
    return [...this.conflictQueue];
  }

  /**
   * Clear all sync data
   */
  async clearSyncData(): Promise<void> {
    this.syncQueue = [];
    this.conflictQueue = [];
    
    await this.indexedDBManager.clear('sync_queue');
    await this.indexedDBManager.clear('sync_conflicts');
    
    this.updateStatus({
      pendingItems: 0,
      conflicts: 0,
      failedItems: 0,
    });
  }

  /**
   * Force sync of specific entity
   */
  async forceSyncEntity(entityType: string, entityId: string): Promise<void> {
    // Load entity data
    const data = await this.persistenceManager.load(entityType, entityId);
    if (!data) {
      throw new Error('Entity not found');
    }

    // Add to queue with high priority
    await this.addToQueue(entityType, entityId, 'update', data, 'high');
    
    // Trigger immediate sync
    if (this.isOnline) {
      await this.sync();
    }
  }

  /**
   * Export sync configuration and data
   */
  async exportSyncData(): Promise<{
    config: SyncConfig;
    queue: SyncItem[];
    conflicts: ConflictItem[];
    status: SyncStatus;
  }> {
    return {
      config: this.config,
      queue: [...this.syncQueue],
      conflicts: [...this.conflictQueue],
      status: { ...this.status },
    };
  }

  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    this.stopAutoSync();
    this.syncQueue = [];
    this.conflictQueue = [];
  }
}

export default SyncManager;
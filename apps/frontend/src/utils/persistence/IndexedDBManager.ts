/**
 * Advanced IndexedDB Manager for TRPG Application
 * Handles large data storage with indexing, querying, and advanced features
 */

export interface IndexedDBConfig {
  dbName: string;
  version: number;
  stores: StoreConfig[];
  enableTransactions?: boolean;
  enableCaching?: boolean;
  maxCacheSize?: number;
}

export interface StoreConfig {
  name: string;
  keyPath: string | string[];
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

export interface IndexConfig {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
  multiEntry?: boolean;
}

export interface QueryOptions {
  index?: string;
  range?: IDBKeyRange;
  direction?: IDBCursorDirection;
  limit?: number;
  offset?: number;
}

export interface Transaction {
  stores: string[];
  mode: IDBTransactionMode;
  operations: Array<() => Promise<any>>;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  hits: number;
  size: number;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private config: IndexedDBConfig;
  private cache = new Map<string, CacheEntry>();
  private cacheSize = 0;
  private initPromise: Promise<void> | null = null;

  constructor(config: IndexedDBConfig) {
    this.config = {
      enableTransactions: true,
      enableCaching: true,
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      ...config,
    };
  }

  /**
   * Initialize the database
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported'));
        return;
      }

      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.setupErrorHandlers();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.handleUpgrade(db, event.oldVersion, event.newVersion || this.config.version);
      };
    });
  }

  /**
   * Handle database schema upgrades
   */
  private handleUpgrade(db: IDBDatabase, oldVersion: number, newVersion: number): void {
    console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

    // Remove obsolete stores
    const existingStores = Array.from(db.objectStoreNames);
    const configuredStores = this.config.stores.map(store => store.name);
    
    for (const storeName of existingStores) {
      if (!configuredStores.includes(storeName)) {
        db.deleteObjectStore(storeName);
        console.log(`Deleted obsolete store: ${storeName}`);
      }
    }

    // Create or update stores
    for (const storeConfig of this.config.stores) {
      let store: IDBObjectStore;

      if (db.objectStoreNames.contains(storeConfig.name)) {
        // Store exists, but we can't modify it during upgrade without recreating
        // For now, we'll just ensure indexes are correct
        continue;
      } else {
        // Create new store
        store = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement || false,
        });
      }

      // Create indexes
      if (storeConfig.indexes) {
        for (const indexConfig of storeConfig.indexes) {
          if (!store.indexNames.contains(indexConfig.name)) {
            store.createIndex(indexConfig.name, indexConfig.keyPath, {
              unique: indexConfig.unique || false,
              multiEntry: indexConfig.multiEntry || false,
            });
          }
        }
      }

      console.log(`Created/updated store: ${storeConfig.name}`);
    }
  }

  /**
   * Setup error handlers
   */
  private setupErrorHandlers(): void {
    if (!this.db) return;

    this.db.onerror = (event) => {
      console.error('Database error:', event);
    };

    this.db.onversionchange = () => {
      console.warn('Database version change detected. Closing connection.');
      this.db?.close();
      this.db = null;
    };
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(storeName: string, key: any): string {
    return `${storeName}:${JSON.stringify(key)}`;
  }

  /**
   * Add to cache
   */
  private addToCache<T>(cacheKey: string, data: T): void {
    if (!this.config.enableCaching) return;

    const dataSize = JSON.stringify(data).length * 2; // Rough UTF-16 size
    
    // Check if we need to evict items
    if (this.cacheSize + dataSize > this.config.maxCacheSize!) {
      this.evictCache(dataSize);
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      hits: 1,
      size: dataSize,
    });

    this.cacheSize += dataSize;
  }

  /**
   * Get from cache
   */
  private getFromCache<T>(cacheKey: string): T | null {
    if (!this.config.enableCaching) return null;

    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    // Update hit count and timestamp
    entry.hits++;
    entry.timestamp = Date.now();

    return entry.data as T;
  }

  /**
   * Remove from cache
   */
  private removeFromCache(cacheKey: string): void {
    const entry = this.cache.get(cacheKey);
    if (entry) {
      this.cache.delete(cacheKey);
      this.cacheSize -= entry.size;
    }
  }

  /**
   * Evict cache entries to make space
   */
  private evictCache(spaceNeeded: number): void {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, ...entry }))
      .sort((a, b) => {
        // Sort by LRU with hit count consideration
        const scoreA = a.hits / (Date.now() - a.timestamp);
        const scoreB = b.hits / (Date.now() - b.timestamp);
        return scoreA - scoreB;
      });

    let freedSpace = 0;
    for (const entry of entries) {
      this.cache.delete(entry.key);
      this.cacheSize -= entry.size;
      freedSpace += entry.size;

      if (freedSpace >= spaceNeeded) break;
    }
  }

  /**
   * Store data
   */
  async put<T>(storeName: string, data: T, key?: any): Promise<any> {
    await this.ensureInitialized();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = key !== undefined ? store.put(data, key) : store.put(data);

      request.onsuccess = () => {
        const resultKey = request.result;
        
        // Update cache
        const cacheKey = this.getCacheKey(storeName, key || resultKey);
        this.addToCache(cacheKey, data);
        
        resolve(resultKey);
      };

      request.onerror = () => {
        reject(new Error(`Failed to store data: ${request.error?.message}`));
      };

      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };
    });
  }

  /**
   * Get data by key
   */
  async get<T>(storeName: string, key: any): Promise<T | null> {
    const cacheKey = this.getCacheKey(storeName, key);
    
    // Check cache first
    const cached = this.getFromCache<T>(cacheKey);
    if (cached) return cached;

    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result || null;
        
        if (result) {
          this.addToCache(cacheKey, result);
        }
        
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get data: ${request.error?.message}`));
      };
    });
  }

  /**
   * Delete data by key
   */
  async delete(storeName: string, key: any): Promise<void> {
    await this.ensureInitialized();

    // Remove from cache
    const cacheKey = this.getCacheKey(storeName, key);
    this.removeFromCache(cacheKey);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new Error(`Failed to delete data: ${request.error?.message}`));
      };
    });
  }

  /**
   * Query data with options
   */
  async query<T>(storeName: string, options: QueryOptions = {}): Promise<T[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let source: IDBObjectStore | IDBIndex = store;
      if (options.index) {
        source = store.index(options.index);
      }

      const results: T[] = [];
      let count = 0;
      const request = source.openCursor(options.range, options.direction);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        
        if (cursor) {
          // Handle offset
          if (options.offset && count < options.offset) {
            count++;
            cursor.continue();
            return;
          }

          // Handle limit
          if (options.limit && results.length >= options.limit) {
            resolve(results);
            return;
          }

          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        reject(new Error(`Query failed: ${request.error?.message}`));
      };
    });
  }

  /**
   * Count records
   */
  async count(storeName: string, options: { index?: string; range?: IDBKeyRange } = {}): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      let source: IDBObjectStore | IDBIndex = store;
      if (options.index) {
        source = store.index(options.index);
      }

      const request = source.count(options.range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        reject(new Error(`Count failed: ${request.error?.message}`));
      };
    });
  }

  /**
   * Get all data from a store
   */
  async getAll<T>(storeName: string, options: QueryOptions = {}): Promise<T[]> {
    return this.query<T>(storeName, options);
  }

  /**
   * Clear all data from a store
   */
  async clear(storeName: string): Promise<void> {
    await this.ensureInitialized();

    // Clear cache for this store
    for (const [cacheKey] of this.cache.entries()) {
      if (cacheKey.startsWith(`${storeName}:`)) {
        this.removeFromCache(cacheKey);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(new Error(`Clear failed: ${request.error?.message}`));
      };
    });
  }

  /**
   * Execute multiple operations in a transaction
   */
  async transaction(operations: Array<{
    store: string;
    operation: 'put' | 'get' | 'delete';
    data?: any;
    key?: any;
  }>): Promise<any[]> {
    await this.ensureInitialized();

    const storeNames = [...new Set(operations.map(op => op.store))];
    const hasWrites = operations.some(op => op.operation === 'put' || op.operation === 'delete');
    const mode: IDBTransactionMode = hasWrites ? 'readwrite' : 'readonly';

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeNames, mode);
      const results: any[] = [];
      let completed = 0;

      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => {
        reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      };

      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const store = transaction.objectStore(op.store);
        let request: IDBRequest;

        switch (op.operation) {
          case 'put':
            request = op.key !== undefined ? store.put(op.data, op.key) : store.put(op.data);
            break;
          case 'get':
            request = store.get(op.key);
            break;
          case 'delete':
            request = store.delete(op.key);
            break;
          default:
            reject(new Error(`Unknown operation: ${(op as any).operation}`));
            return;
        }

        request.onsuccess = () => {
          results[i] = request.result;
          completed++;

          // Update cache for successful operations
          if (op.operation === 'put') {
            const cacheKey = this.getCacheKey(op.store, op.key || request.result);
            this.addToCache(cacheKey, op.data);
          } else if (op.operation === 'delete') {
            const cacheKey = this.getCacheKey(op.store, op.key);
            this.removeFromCache(cacheKey);
          } else if (op.operation === 'get' && request.result) {
            const cacheKey = this.getCacheKey(op.store, op.key);
            this.addToCache(cacheKey, request.result);
          }
        };

        request.onerror = () => {
          reject(new Error(`Operation ${op.operation} failed: ${request.error?.message}`));
        };
      }
    });
  }

  /**
   * Create key ranges for queries
   */
  static createRange = {
    only: (value: any) => IDBKeyRange.only(value),
    lowerBound: (lower: any, open = false) => IDBKeyRange.lowerBound(lower, open),
    upperBound: (upper: any, open = false) => IDBKeyRange.upperBound(upper, open),
    bound: (lower: any, upper: any, lowerOpen = false, upperOpen = false) => 
      IDBKeyRange.bound(lower, upper, lowerOpen, upperOpen),
  };

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    entries: number;
    size: number;
    hitRate: number;
    topEntries: Array<{ key: string; hits: number; size: number }>;
  } {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, ...entry }));

    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const hitRate = totalHits > 0 ? entries.length / totalHits : 0;

    const topEntries = entries
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10)
      .map(entry => ({ key: entry.key, hits: entry.hits, size: entry.size }));

    return {
      entries: this.cache.size,
      size: this.cacheSize,
      hitRate,
      topEntries,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheSize = 0;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.clearCache();
  }

  /**
   * Export data from specific stores
   */
  async exportData(storeNames?: string[]): Promise<Record<string, any[]>> {
    await this.ensureInitialized();
    
    const stores = storeNames || this.config.stores.map(s => s.name);
    const exportData: Record<string, any[]> = {};

    for (const storeName of stores) {
      try {
        exportData[storeName] = await this.getAll(storeName);
      } catch (error) {
        console.error(`Failed to export ${storeName}:`, error);
        exportData[storeName] = [];
      }
    }

    return exportData;
  }

  /**
   * Import data to specific stores
   */
  async importData(data: Record<string, any[]>, options: { 
    clearFirst?: boolean;
    skipExisting?: boolean;
  } = {}): Promise<void> {
    await this.ensureInitialized();
    
    const { clearFirst = false, skipExisting = false } = options;

    for (const [storeName, items] of Object.entries(data)) {
      if (clearFirst) {
        await this.clear(storeName);
      }

      // Import in batches to avoid overwhelming the browser
      const batchSize = 100;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const operations = batch.map(item => ({
          store: storeName,
          operation: 'put' as const,
          data: item,
        }));

        try {
          await this.transaction(operations);
        } catch (error) {
          console.error(`Failed to import batch for ${storeName}:`, error);
          if (!skipExisting) throw error;
        }
      }
    }
  }
}

export default IndexedDBManager;
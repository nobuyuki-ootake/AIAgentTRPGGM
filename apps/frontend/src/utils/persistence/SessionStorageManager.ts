/**
 * Session Storage Manager for TRPG Application
 * Handles temporary data that should persist only during the browser session
 */

export interface SessionData<T = any> {
  data: T;
  timestamp: string;
  expiresAt?: string;
  version: string;
}

export interface SessionStorageOptions {
  expirationMinutes?: number;
  enableEncryption?: boolean;
  maxSize?: number; // in bytes
  onEviction?: (key: string, data: any) => void;
}

class SessionStorageManager {
  private readonly PREFIX = 'trpg_session_';
  private readonly VERSION = '1.0.0';
  private encryptionKey: CryptoKey | null = null;

  constructor(private options: SessionStorageOptions = {}) {
    this.initializeEncryption();
    this.cleanupExpiredItems();
    
    // Setup periodic cleanup
    setInterval(() => this.cleanupExpiredItems(), 60000); // Every minute
  }

  /**
   * Initialize encryption key if enabled
   */
  private async initializeEncryption(): Promise<void> {
    if (!this.options.enableEncryption) return;

    try {
      // Generate a key for AES-GCM encryption
      this.encryptionKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.warn('Failed to initialize encryption:', error);
      this.options.enableEncryption = false;
    }
  }

  /**
   * Encrypt data if encryption is enabled
   */
  private async encryptData(data: string): Promise<string> {
    if (!this.options.enableEncryption || !this.encryptionKey) {
      return data;
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return data; // Fall back to unencrypted
    }
  }

  /**
   * Decrypt data if encryption is enabled
   */
  private async decryptData(encryptedData: string): Promise<string> {
    if (!this.options.enableEncryption || !this.encryptionKey) {
      return encryptedData;
    }

    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Fall back to treating as unencrypted
    }
  }

  /**
   * Store data in session storage
   */
  async set<T>(key: string, data: T, options: { expirationMinutes?: number } = {}): Promise<void> {
    try {
      const expirationMinutes = options.expirationMinutes || this.options.expirationMinutes;
      const expiresAt = expirationMinutes 
        ? new Date(Date.now() + expirationMinutes * 60000).toISOString()
        : undefined;

      const sessionData: SessionData<T> = {
        data,
        timestamp: new Date().toISOString(),
        expiresAt,
        version: this.VERSION,
      };

      let serialized = JSON.stringify(sessionData);
      
      // Check size limit
      if (this.options.maxSize && serialized.length > this.options.maxSize) {
        throw new Error(`Data too large: ${serialized.length} bytes exceeds limit of ${this.options.maxSize} bytes`);
      }

      // Encrypt if enabled
      serialized = await this.encryptData(serialized);

      const storageKey = this.PREFIX + key;
      sessionStorage.setItem(storageKey, serialized);

      console.debug(`Session data stored: ${key} (${serialized.length} bytes)`);
    } catch (error) {
      console.error('Failed to store session data:', error);
      throw error;
    }
  }

  /**
   * Retrieve data from session storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const storageKey = this.PREFIX + key;
      const serialized = sessionStorage.getItem(storageKey);
      
      if (!serialized) return null;

      // Decrypt if needed
      const decrypted = await this.decryptData(serialized);
      const sessionData: SessionData<T> = JSON.parse(decrypted);

      // Check expiration
      if (sessionData.expiresAt && new Date() > new Date(sessionData.expiresAt)) {
        await this.remove(key);
        return null;
      }

      return sessionData.data;
    } catch (error) {
      console.error('Failed to retrieve session data:', error);
      return null;
    }
  }

  /**
   * Remove data from session storage
   */
  async remove(key: string): Promise<void> {
    try {
      const storageKey = this.PREFIX + key;
      const data = await this.get(key);
      
      sessionStorage.removeItem(storageKey);
      
      // Call eviction callback if provided
      if (data && this.options.onEviction) {
        this.options.onEviction(key, data);
      }
    } catch (error) {
      console.error('Failed to remove session data:', error);
    }
  }

  /**
   * Check if key exists and is not expired
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Get all keys managed by this manager
   */
  getKeys(): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.PREFIX)) {
        keys.push(key.substring(this.PREFIX.length));
      }
    }
    
    return keys;
  }

  /**
   * Clear all data managed by this manager
   */
  async clear(): Promise<void> {
    const keys = this.getKeys();
    
    for (const key of keys) {
      await this.remove(key);
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    totalKeys: number;
    totalSize: number;
    available: number;
    usage: Array<{ key: string; size: number; timestamp: string }>;
  } {
    const keys = this.getKeys();
    let totalSize = 0;
    const usage: Array<{ key: string; size: number; timestamp: string }> = [];

    for (const key of keys) {
      const storageKey = this.PREFIX + key;
      const data = sessionStorage.getItem(storageKey);
      if (data) {
        const size = data.length * 2; // UTF-16 encoding
        totalSize += size;
        
        try {
          const sessionData = JSON.parse(data);
          usage.push({
            key,
            size,
            timestamp: sessionData.timestamp || 'unknown',
          });
        } catch {
          usage.push({
            key,
            size,
            timestamp: 'unknown',
          });
        }
      }
    }

    // Estimate available space (sessionStorage limit is typically 5-10MB)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    const available = Math.max(0, estimatedLimit - totalSize);

    return {
      totalKeys: keys.length,
      totalSize,
      available,
      usage: usage.sort((a, b) => b.size - a.size), // Sort by size descending
    };
  }

  /**
   * Clean up expired items
   */
  private async cleanupExpiredItems(): Promise<void> {
    const keys = this.getKeys();
    const now = new Date();

    for (const key of keys) {
      try {
        const storageKey = this.PREFIX + key;
        const serialized = sessionStorage.getItem(storageKey);
        
        if (serialized) {
          const decrypted = await this.decryptData(serialized);
          const sessionData: SessionData = JSON.parse(decrypted);
          
          if (sessionData.expiresAt && now > new Date(sessionData.expiresAt)) {
            await this.remove(key);
            console.debug(`Cleaned up expired session data: ${key}`);
          }
        }
      } catch (error) {
        console.warn(`Failed to check expiration for ${key}:`, error);
        // Remove corrupted data
        await this.remove(key);
      }
    }
  }

  /**
   * Export all session data for debugging or migration
   */
  async exportData(): Promise<Record<string, any>> {
    const exported: Record<string, any> = {};
    const keys = this.getKeys();

    for (const key of keys) {
      const data = await this.get(key);
      if (data !== null) {
        exported[key] = data;
      }
    }

    return exported;
  }

  /**
   * Import session data
   */
  async importData(data: Record<string, any>, options: { overwrite?: boolean } = {}): Promise<void> {
    const { overwrite = false } = options;

    for (const [key, value] of Object.entries(data)) {
      if (overwrite || !(await this.has(key))) {
        await this.set(key, value);
      }
    }
  }

  /**
   * Create a scoped manager for a specific namespace
   */
  createScope(scope: string): ScopedSessionStorage {
    return new ScopedSessionStorage(this, scope);
  }
}

/**
 * Scoped session storage for organizing data by namespace
 */
class ScopedSessionStorage {
  constructor(
    private manager: SessionStorageManager,
    private scope: string
  ) {}

  private getScopedKey(key: string): string {
    return `${this.scope}:${key}`;
  }

  async set<T>(key: string, data: T, options?: { expirationMinutes?: number }): Promise<void> {
    return this.manager.set(this.getScopedKey(key), data, options);
  }

  async get<T>(key: string): Promise<T | null> {
    return this.manager.get<T>(this.getScopedKey(key));
  }

  async remove(key: string): Promise<void> {
    return this.manager.remove(this.getScopedKey(key));
  }

  async has(key: string): Promise<boolean> {
    return this.manager.has(this.getScopedKey(key));
  }

  getKeys(): string[] {
    return this.manager.getKeys()
      .filter(key => key.startsWith(`${this.scope}:`))
      .map(key => key.substring(this.scope.length + 1));
  }

  async clear(): Promise<void> {
    const keys = this.getKeys();
    for (const key of keys) {
      await this.remove(key);
    }
  }
}

// TRPG-specific session storage managers
export class TRPGSessionStorageManager {
  private manager: SessionStorageManager;
  
  // Scoped managers for different data types
  public readonly formDrafts: ScopedSessionStorage;
  public readonly aiContext: ScopedSessionStorage;
  public readonly sessionState: ScopedSessionStorage;
  public readonly userPreferences: ScopedSessionStorage;
  public readonly temporaryData: ScopedSessionStorage;

  constructor(options: SessionStorageOptions = {}) {
    this.manager = new SessionStorageManager({
      expirationMinutes: 60, // Default 1 hour expiration
      enableEncryption: false, // Session data is temporary
      maxSize: 100 * 1024, // 100KB per item
      ...options,
    });

    // Create scoped storage areas
    this.formDrafts = this.manager.createScope('form_drafts');
    this.aiContext = this.manager.createScope('ai_context');
    this.sessionState = this.manager.createScope('session_state');
    this.userPreferences = this.manager.createScope('user_prefs');
    this.temporaryData = this.manager.createScope('temp');
  }

  /**
   * Save form draft with auto-recovery
   */
  async saveFormDraft(formId: string, formData: any, metadata?: { 
    formType?: string; 
    campaignId?: string; 
    lastModified?: string;
  }): Promise<void> {
    const draftData = {
      formData,
      metadata: {
        formType: 'unknown',
        lastModified: new Date().toISOString(),
        ...metadata,
      },
    };

    await this.formDrafts.set(formId, draftData, { expirationMinutes: 480 }); // 8 hours
  }

  /**
   * Restore form draft
   */
  async restoreFormDraft(formId: string): Promise<{ 
    formData: any; 
    metadata: any 
  } | null> {
    return await this.formDrafts.get(formId);
  }

  /**
   * Save AI conversation context
   */
  async saveAIContext(contextId: string, context: {
    messages: Array<{ role: string; content: string; timestamp: string }>;
    selectedElements?: string[];
    currentTopic?: string;
    sessionId?: string;
  }): Promise<void> {
    await this.aiContext.set(contextId, context, { expirationMinutes: 120 }); // 2 hours
  }

  /**
   * Get AI conversation context
   */
  async getAIContext(contextId: string): Promise<any> {
    return await this.aiContext.get(contextId);
  }

  /**
   * Save current session state
   */
  async saveSessionState(sessionId: string, state: {
    currentCampaignId?: string;
    activeCharacters?: string[];
    currentScene?: string;
    diceRolls?: Array<{ result: number; timestamp: string; character?: string }>;
    chatHistory?: Array<{ message: string; author: string; timestamp: string }>;
  }): Promise<void> {
    await this.sessionState.set(sessionId, state, { expirationMinutes: 480 }); // 8 hours
  }

  /**
   * Get session state
   */
  async getSessionState(sessionId: string): Promise<any> {
    return await this.sessionState.get(sessionId);
  }

  /**
   * Save user preferences for the session
   */
  async saveUserPreferences(preferences: {
    theme?: 'light' | 'dark';
    aiProvider?: string;
    autoSaveInterval?: number;
    developerMode?: boolean;
    notifications?: boolean;
  }): Promise<void> {
    await this.userPreferences.set('current', preferences);
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<any> {
    return await this.userPreferences.get('current');
  }

  /**
   * Store temporary data with short expiration
   */
  async setTemporary(key: string, data: any, expirationMinutes = 15): Promise<void> {
    await this.temporaryData.set(key, data, { expirationMinutes });
  }

  /**
   * Get temporary data
   */
  async getTemporary(key: string): Promise<any> {
    return await this.temporaryData.get(key);
  }

  /**
   * Get comprehensive storage statistics
   */
  getStats(): {
    overall: ReturnType<SessionStorageManager['getStorageStats']>;
    byScope: Record<string, number>;
  } {
    const overall = this.manager.getStorageStats();
    const byScope: Record<string, number> = {};

    for (const usage of overall.usage) {
      const [scope] = usage.key.split(':');
      byScope[scope] = (byScope[scope] || 0) + usage.size;
    }

    return { overall, byScope };
  }

  /**
   * Clean up all data
   */
  async cleanup(): Promise<void> {
    await this.manager.clear();
  }

  /**
   * Export all session data for debugging
   */
  async exportAll(): Promise<Record<string, any>> {
    return await this.manager.exportData();
  }
}

export default SessionStorageManager;
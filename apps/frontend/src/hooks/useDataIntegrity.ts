/**
 * Data Integrity Hook for TRPG Application
 * Provides data validation, corruption detection, and repair capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TRPGCampaign, TRPGCharacter } from '@trpg-ai-gm/types';
import DataPersistenceManager from '../utils/persistence/DataPersistenceManager';
import DataMigrationManager, { ValidationResult } from '../utils/persistence/DataMigrationManager';

export interface IntegrityCheckResult {
  isValid: boolean;
  timestamp: string;
  entitiesChecked: number;
  issuesFound: number;
  criticalIssues: number;
  warnings: number;
  details: Array<{
    entityType: string;
    entityId: string;
    issueType: 'corruption' | 'missing_field' | 'invalid_value' | 'orphaned_reference' | 'checksum_mismatch';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    autoRepairable: boolean;
  }>;
  repairSuggestions: string[];
}

export interface DataHealthStatus {
  overall: 'healthy' | 'warning' | 'critical' | 'unknown' | 'error';
  lastCheck: string | null;
  nextScheduledCheck: string | null;
  storageHealth: {
    localStorage: 'healthy' | 'warning' | 'error';
    sessionStorage: 'healthy' | 'warning' | 'error';
    indexedDB: 'healthy' | 'warning' | 'error';
  };
  dataConsistency: {
    campaigns: number;
    characters: number;
    sessions: number;
    orphanedData: number;
  };
  performanceMetrics: {
    averageAccessTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
}

export interface RepairOptions {
  autoRepair: boolean;
  createBackup: boolean;
  confirmCriticalRepairs: boolean;
  preserveUserData: boolean;
}

export interface UseDataIntegrityOptions {
  enableAutomaticChecks: boolean;
  checkInterval: number; // milliseconds
  enableRealTimeValidation: boolean;
  onIntegrityIssue?: (result: IntegrityCheckResult) => void;
  onDataCorruption?: (details: any) => void;
  onRepairComplete?: (result: { success: boolean; repaired: number; failed: number }) => void;
}

export interface UseDataIntegrityReturn {
  healthStatus: DataHealthStatus;
  isChecking: boolean;
  runIntegrityCheck: () => Promise<IntegrityCheckResult>;
  repairData: (options?: Partial<RepairOptions>) => Promise<{ success: boolean; repaired: number; failed: number }>;
  validateEntity: (entityType: string, entityId: string, data: any) => Promise<boolean>;
  getStorageStats: () => Promise<any>;
  optimizeStorage: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  exportDiagnostics: () => Promise<any>;
}

const defaultHealthStatus: DataHealthStatus = {
  overall: 'unknown',
  lastCheck: null,
  nextScheduledCheck: null,
  storageHealth: {
    localStorage: 'unknown' as any,
    sessionStorage: 'unknown' as any,
    indexedDB: 'unknown' as any,
  },
  dataConsistency: {
    campaigns: 0,
    characters: 0,
    sessions: 0,
    orphanedData: 0,
  },
  performanceMetrics: {
    averageAccessTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
  },
};

let globalPersistenceManager: DataPersistenceManager | null = null;
let globalMigrationManager: DataMigrationManager | null = null;

const getOrCreateManagers = () => {
  if (!globalPersistenceManager) {
    globalPersistenceManager = new DataPersistenceManager();
  }
  if (!globalMigrationManager) {
    globalMigrationManager = new DataMigrationManager(globalPersistenceManager, '1.0.0');
  }
  return { persistenceManager: globalPersistenceManager, migrationManager: globalMigrationManager };
};

export const useDataIntegrity = (options: Partial<UseDataIntegrityOptions> = {}): UseDataIntegrityReturn => {
  const {
    enableAutomaticChecks = true,
    checkInterval = 30 * 60 * 1000, // 30 minutes
    enableRealTimeValidation = true,
    onIntegrityIssue,
    onDataCorruption,
    onRepairComplete,
  } = options;

  const [healthStatus, setHealthStatus] = useState<DataHealthStatus>(defaultHealthStatus);
  const [isChecking, setIsChecking] = useState(false);
  
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const lastCheckRef = useRef<number>(0);
  const performanceMetricsRef = useRef({
    accessTimes: [] as number[],
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    totalOperations: 0,
  });

  const { persistenceManager, migrationManager } = getOrCreateManagers();

  /**
   * Calculate checksum for data integrity verification
   */
  const calculateChecksum = useCallback(async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  /**
   * Check storage availability and health
   */
  const checkStorageHealth = useCallback(async (): Promise<DataHealthStatus['storageHealth']> => {
    const health: {
      localStorage: 'healthy' | 'warning' | 'error';
      sessionStorage: 'healthy' | 'warning' | 'error';
      indexedDB: 'healthy' | 'warning' | 'error';
    } = {
      localStorage: 'healthy',
      sessionStorage: 'healthy',
      indexedDB: 'healthy',
    };

    // Test localStorage
    try {
      const testKey = 'integrity_test_local';
      const testValue = 'test_value_' + Date.now();
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      if (retrieved !== testValue) {
        health.localStorage = 'error';
      }
      localStorage.removeItem(testKey);
    } catch (error) {
      health.localStorage = 'error';
    }

    // Test sessionStorage
    try {
      const testKey = 'integrity_test_session';
      const testValue = 'test_value_' + Date.now();
      sessionStorage.setItem(testKey, testValue);
      const retrieved = sessionStorage.getItem(testKey);
      if (retrieved !== testValue) {
        health.sessionStorage = 'error';
      }
      sessionStorage.removeItem(testKey);
    } catch (error) {
      health.sessionStorage = 'error';
    }

    // Test IndexedDB
    try {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open('IntegrityTestDB', 1);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('test')) {
            db.createObjectStore('test', { keyPath: 'id' });
          }
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['test'], 'readwrite');
          const store = transaction.objectStore('test');
          
          const testData = { id: 'integrity_test', value: Date.now() };
          const putRequest = store.put(testData);
          
          putRequest.onsuccess = () => {
            const getRequest = store.get('integrity_test');
            getRequest.onsuccess = () => {
              if (getRequest.result && getRequest.result.value === testData.value) {
                resolve(true);
              } else {
                health.indexedDB = 'error';
                resolve(false);
              }
            };
            getRequest.onerror = () => {
              health.indexedDB = 'error';
              resolve(false);
            };
          };
          
          putRequest.onerror = () => {
            health.indexedDB = 'error';
            resolve(false);
          };
          
          db.close();
        };

        request.onerror = () => {
          health.indexedDB = 'error';
          resolve(false);
        };

        // Cleanup
        setTimeout(() => {
          indexedDB.deleteDatabase('IntegrityTestDB');
        }, 1000);
      });
    } catch (error) {
      health.indexedDB = 'error';
    }

    return health;
  }, []);

  /**
   * Validate individual entity structure and data
   */
  const validateEntity = useCallback(async (entityType: string, entityId: string, data: any): Promise<boolean> => {
    const startTime = performance.now();
    try {
      
      // Basic validation
      if (!data || typeof data !== 'object') {
        return false;
      }

      if (!data.id || data.id !== entityId) {
        return false;
      }

      // Entity-specific validation
      switch (entityType) {
        case 'campaign':
          return validateCampaign(data);
        case 'character':
          return validateCharacter(data);
        case 'session':
          return validateSession(data);
        default:
          return true; // Unknown entity types are considered valid
      }
    } catch (error) {
      performanceMetricsRef.current.errors++;
      return false;
    } finally {
      const endTime = performance.now();
      performanceMetricsRef.current.accessTimes.push(endTime - startTime);
      performanceMetricsRef.current.totalOperations++;
    }
  }, []);

  /**
   * Validate campaign data structure
   */
  const validateCampaign = (campaign: any): boolean => {
    const required = ['id', 'title', 'createdAt', 'updatedAt'];
    
    for (const field of required) {
      if (!campaign[field]) return false;
    }

    if (typeof campaign.title !== 'string' || campaign.title.trim().length === 0) {
      return false;
    }

    // Validate arrays if present
    const arrays = ['characters', 'npcs', 'enemies', 'sessions', 'quests'];
    for (const arrayField of arrays) {
      if (campaign[arrayField] && !Array.isArray(campaign[arrayField])) {
        return false;
      }
    }

    return true;
  };

  /**
   * Validate character data structure
   */
  const validateCharacter = (character: any): boolean => {
    const required = ['id', 'name', 'characterType'];
    
    for (const field of required) {
      if (!character[field]) return false;
    }

    if (!['PC', 'NPC', 'Enemy'].includes(character.characterType)) {
      return false;
    }

    // Validate stats if present
    if (character.stats) {
      const statFields = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      for (const stat of statFields) {
        if (character.stats[stat] !== undefined && 
            (typeof character.stats[stat] !== 'number' || character.stats[stat] < 1 || character.stats[stat] > 30)) {
          return false;
        }
      }

      if (character.stats.hitPoints) {
        const hp = character.stats.hitPoints;
        if (typeof hp.current !== 'number' || typeof hp.max !== 'number' || hp.current > hp.max) {
          return false;
        }
      }
    }

    return true;
  };

  /**
   * Validate session data structure
   */
  const validateSession = (session: any): boolean => {
    const required = ['id', 'campaignId', 'timestamp'];
    
    for (const field of required) {
      if (!session[field]) return false;
    }

    // Validate timestamp
    if (isNaN(Date.parse(session.timestamp))) {
      return false;
    }

    return true;
  };

  /**
   * Run comprehensive integrity check
   */
  const runIntegrityCheck = useCallback(async (): Promise<IntegrityCheckResult> => {
    setIsChecking(true);
    lastCheckRef.current = Date.now();

    const result: IntegrityCheckResult = {
      isValid: true,
      timestamp: new Date().toISOString(),
      entitiesChecked: 0,
      issuesFound: 0,
      criticalIssues: 0,
      warnings: 0,
      details: [],
      repairSuggestions: [],
    };

    try {
      // Check storage health
      const storageHealth = await checkStorageHealth();
      
      // Load and validate all campaigns
      const campaignList = JSON.parse(localStorage.getItem('trpg_campaign_list') || '[]');
      
      for (const campaignMeta of campaignList) {
        try {
          const campaign = await persistenceManager.load('campaigns', campaignMeta.id);
          result.entitiesChecked++;

          if (!campaign) {
            result.details.push({
              entityType: 'campaign',
              entityId: campaignMeta.id,
              issueType: 'corruption',
              severity: 'critical',
              message: 'Campaign metadata exists but data is missing',
              autoRepairable: false,
            });
            result.criticalIssues++;
            continue;
          }

          const isValid = await validateEntity('campaigns', campaignMeta.id, campaign);
          if (!isValid) {
            result.details.push({
              entityType: 'campaign',
              entityId: campaignMeta.id,
              issueType: 'invalid_value',
              severity: 'warning',
              message: 'Campaign data validation failed',
              autoRepairable: true,
            });
            result.warnings++;
          }

          // Validate campaign characters
          if ((campaign as any).characters) {
            for (const character of (campaign as any).characters) {
              result.entitiesChecked++;
              const characterValid = await validateEntity('character', character.id, character);
              if (!characterValid) {
                result.details.push({
                  entityType: 'character',
                  entityId: character.id,
                  issueType: 'invalid_value',
                  severity: 'warning',
                  message: 'Character data validation failed',
                  autoRepairable: true,
                });
                result.warnings++;
              }
            }
          }

          // Check for orphaned references
          // This would involve checking if referenced entities exist

        } catch (error) {
          result.details.push({
            entityType: 'campaign',
            entityId: campaignMeta.id,
            issueType: 'corruption',
            severity: 'critical',
            message: `Failed to load campaign: ${error}`,
            autoRepairable: false,
          });
          result.criticalIssues++;
        }
      }

      // Check for data consistency
      await checkDataConsistency(result);

      // Calculate results
      result.issuesFound = result.criticalIssues + result.warnings;
      result.isValid = result.criticalIssues === 0;

      // Generate repair suggestions
      generateRepairSuggestions(result);

      // Update health status
      setHealthStatus(prev => ({
        ...prev,
        overall: result.criticalIssues > 0 ? 'critical' : result.warnings > 0 ? 'warning' : 'healthy',
        lastCheck: result.timestamp,
        storageHealth,
        dataConsistency: {
          campaigns: campaignList.length,
          characters: 0, // Would calculate from actual data
          sessions: 0,
          orphanedData: result.details.filter(d => d.issueType === 'orphaned_reference').length,
        },
      }));

      if (result.issuesFound > 0 && onIntegrityIssue) {
        onIntegrityIssue(result);
      }

      if (result.criticalIssues > 0 && onDataCorruption) {
        onDataCorruption(result.details.filter(d => d.severity === 'critical'));
      }

    } catch (error) {
      result.isValid = false;
      result.details.push({
        entityType: 'system',
        entityId: 'integrity_check',
        issueType: 'corruption',
        severity: 'critical',
        message: `Integrity check failed: ${error}`,
        autoRepairable: false,
      });
      result.criticalIssues++;
    } finally {
      setIsChecking(false);
    }

    return result;
  }, [persistenceManager, validateEntity, onIntegrityIssue, onDataCorruption, checkStorageHealth]);

  /**
   * Check data consistency across entities
   */
  const checkDataConsistency = async (result: IntegrityCheckResult): Promise<void> => {
    // This would implement cross-reference validation
    // For example, ensuring all character references in campaigns exist
    // and all session references point to valid campaigns
  };

  /**
   * Generate repair suggestions based on found issues
   */
  const generateRepairSuggestions = (result: IntegrityCheckResult): void => {
    const suggestions: string[] = [];

    if (result.details.some(d => d.issueType === 'corruption')) {
      suggestions.push('バックアップからのデータ復元を検討してください');
    }

    if (result.details.some(d => d.issueType === 'invalid_value')) {
      suggestions.push('データ検証エラーの自動修復を実行できます');
    }

    if (result.details.some(d => d.issueType === 'orphaned_reference')) {
      suggestions.push('孤立した参照の削除を推奨します');
    }

    if (result.details.some(d => d.issueType === 'missing_field')) {
      suggestions.push('データマイグレーションの実行が必要です');
    }

    result.repairSuggestions = suggestions;
  };

  /**
   * Repair data based on integrity check results
   */
  const repairData = useCallback(async (options: Partial<RepairOptions> = {}): Promise<{
    success: boolean;
    repaired: number;
    failed: number;
  }> => {
    const {
      autoRepair = true,
      createBackup = true,
      confirmCriticalRepairs = true,
      preserveUserData = true,
    } = options;

    let repaired = 0;
    let failed = 0;

    try {
      // Create backup before repairs if requested
      if (createBackup) {
        await migrationManager.createBackup({}, 'Pre-repair backup');
      }

      // Run integrity check to get current issues
      const checkResult = await runIntegrityCheck();

      for (const issue of checkResult.details) {
        if (!issue.autoRepairable) {
          failed++;
          continue;
        }

        if (issue.severity === 'critical' && confirmCriticalRepairs) {
          // Would show confirmation dialog in real implementation
          console.warn('Critical repair requires confirmation:', issue.message);
          failed++;
          continue;
        }

        try {
          switch (issue.issueType) {
            case 'invalid_value':
              await repairInvalidValue(issue);
              repaired++;
              break;

            case 'missing_field':
              await repairMissingField(issue);
              repaired++;
              break;

            case 'orphaned_reference':
              await repairOrphanedReference(issue);
              repaired++;
              break;

            default:
              failed++;
              break;
          }
        } catch (repairError) {
          console.error('Repair failed for issue:', issue, repairError);
          failed++;
        }
      }

      const result = {
        success: failed === 0 || repaired > failed,
        repaired,
        failed,
      };

      if (onRepairComplete) {
        onRepairComplete(result);
      }

      return result;

    } catch (error) {
      console.error('Data repair failed:', error);
      return { success: false, repaired, failed: failed + 1 };
    }
  }, [runIntegrityCheck, migrationManager, onRepairComplete]);

  /**
   * Repair invalid field values
   */
  const repairInvalidValue = async (issue: IntegrityCheckResult['details'][0]): Promise<void> => {
    const data = await persistenceManager.load(issue.entityType, issue.entityId);
    if (!data) return;

    // Apply specific repairs based on entity type and validation rules
    switch (issue.entityType) {
      case 'character':
        repairCharacterData(data);
        break;
      case 'campaign':
        repairCampaignData(data);
        break;
    }

    await persistenceManager.save(issue.entityType, issue.entityId, data);
  };

  /**
   * Repair missing required fields
   */
  const repairMissingField = async (issue: IntegrityCheckResult['details'][0]): Promise<void> => {
    const data = await persistenceManager.load(issue.entityType, issue.entityId);
    if (!data) return;

    // Add missing fields with sensible defaults
    if (!(data as any).createdAt) {
      (data as any).createdAt = new Date().toISOString();
    }
    if (!(data as any).updatedAt) {
      (data as any).updatedAt = new Date().toISOString();
    }

    await persistenceManager.save(issue.entityType, issue.entityId, data);
  };

  /**
   * Remove orphaned references
   */
  const repairOrphanedReference = async (issue: IntegrityCheckResult['details'][0]): Promise<void> => {
    // Would implement logic to remove orphaned references
    console.log('Removing orphaned reference:', issue);
  };

  /**
   * Repair character-specific data issues
   */
  const repairCharacterData = (character: any): void => {
    // Ensure required fields exist
    if (!character.characterType || !['PC', 'NPC', 'Enemy'].includes(character.characterType)) {
      character.characterType = 'PC';
    }

    // Fix stat ranges
    if (character.stats) {
      const statFields = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      for (const stat of statFields) {
        if (typeof character.stats[stat] === 'number') {
          character.stats[stat] = Math.max(1, Math.min(30, character.stats[stat]));
        }
      }

      // Fix hit points
      if (character.stats.hitPoints) {
        const hp = character.stats.hitPoints;
        if (hp.current > hp.max) {
          hp.current = hp.max;
        }
        if (hp.current < 0) {
          hp.current = 0;
        }
      }
    }

    // Ensure arrays exist
    character.skills = character.skills || [];
    character.equipment = character.equipment || [];
    character.traits = character.traits || [];
    character.relationships = character.relationships || [];
    character.statuses = character.statuses || [];
    character.customFields = character.customFields || [];
  };

  /**
   * Repair campaign-specific data issues
   */
  const repairCampaignData = (campaign: any): void => {
    // Ensure required fields
    if (!campaign.title || campaign.title.trim().length === 0) {
      campaign.title = 'Untitled Campaign';
    }

    // Ensure arrays exist
    campaign.characters = campaign.characters || [];
    campaign.npcs = campaign.npcs || [];
    campaign.enemies = campaign.enemies || [];
    campaign.sessions = campaign.sessions || [];
    campaign.quests = campaign.quests || [];

    // Ensure worldBuilding structure
    if (!campaign.worldBuilding) {
      campaign.worldBuilding = {
        bases: [],
        setting: [],
        rules: [],
        places: [],
        cultures: [],
        geographyEnvironment: [],
        historyLegend: [],
        magicTechnology: [],
        freeFields: [],
        worldMapImageUrl: '',
      };
    }
  };

  /**
   * Get storage statistics
   */
  const getStorageStats = useCallback(async () => {
    return await persistenceManager.getStorageStats();
  }, [persistenceManager]);

  /**
   * Optimize storage by cleaning up old data
   */
  const optimizeStorage = useCallback(async (): Promise<void> => {
    await persistenceManager.optimizeStorage();
    
    // Update performance metrics
    const metrics = performanceMetricsRef.current;
    const avgAccessTime = metrics.accessTimes.length > 0 
      ? metrics.accessTimes.reduce((sum, time) => sum + time, 0) / metrics.accessTimes.length
      : 0;
    
    const cacheHitRate = metrics.totalOperations > 0 
      ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100
      : 0;
    
    const errorRate = metrics.totalOperations > 0 
      ? (metrics.errors / metrics.totalOperations) * 100
      : 0;

    setHealthStatus(prev => ({
      ...prev,
      performanceMetrics: {
        averageAccessTime: avgAccessTime,
        cacheHitRate,
        errorRate,
      },
    }));
  }, [persistenceManager]);

  /**
   * Start monitoring data integrity
   */
  const startMonitoring = useCallback((): void => {
    if (enableAutomaticChecks && !checkIntervalRef.current) {
      // Run initial check
      runIntegrityCheck();

      // Schedule periodic checks
      checkIntervalRef.current = setInterval(() => {
        runIntegrityCheck();
      }, checkInterval);

      setHealthStatus(prev => ({
        ...prev,
        nextScheduledCheck: new Date(Date.now() + checkInterval).toISOString(),
      }));
    }
  }, [enableAutomaticChecks, checkInterval, runIntegrityCheck]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback((): void => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = undefined;

      setHealthStatus(prev => ({
        ...prev,
        nextScheduledCheck: null,
      }));
    }
  }, []);

  /**
   * Export comprehensive diagnostics
   */
  const exportDiagnostics = useCallback(async () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      healthStatus,
      storageStats: await getStorageStats(),
      performanceMetrics: performanceMetricsRef.current,
      integrityCheckResult: await runIntegrityCheck(),
      browserInfo: {
        userAgent: navigator.userAgent,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        storageSupport: {
          localStorage: typeof Storage !== 'undefined',
          sessionStorage: typeof Storage !== 'undefined',
          indexedDB: typeof indexedDB !== 'undefined',
        },
      },
    };

    return diagnostics;
  }, [healthStatus, getStorageStats, runIntegrityCheck]);

  // Start monitoring on mount
  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Real-time validation setup
  useEffect(() => {
    if (!enableRealTimeValidation) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.startsWith('trpg_')) {
        // Validate changed data
        setTimeout(() => runIntegrityCheck(), 1000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [enableRealTimeValidation, runIntegrityCheck]);

  return {
    healthStatus,
    isChecking,
    runIntegrityCheck,
    repairData,
    validateEntity,
    getStorageStats,
    optimizeStorage,
    startMonitoring,
    stopMonitoring,
    exportDiagnostics,
  };
};

export default useDataIntegrity;
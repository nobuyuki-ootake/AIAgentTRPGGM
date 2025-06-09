// @ts-nocheck
/**
 * Data Migration and Backup Manager for TRPG Application
 * Handles version migrations, data validation, and backup/restore operations
 */

import { TRPGCampaign, TRPGCharacter, TRPGSession } from '@trpg-ai-gm/types';
import DataPersistenceManager, { BackupData } from './DataPersistenceManager';

export interface MigrationConfig {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrationFunction: (data: any) => any;
  validationFunction?: (data: any) => boolean;
  rollbackFunction?: (data: any) => any;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migratedItems: number;
  errors: string[];
  warnings: string[];
  duration: number;
  backupId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ type: string; message: string; entityId?: string; severity: 'error' | 'warning' }>;
  summary: {
    totalEntities: number;
    validEntities: number;
    errorsCount: number;
    warningsCount: number;
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  version: string;
  description: string;
  size: number;
  entityCounts: Record<string, number>;
  checksum: string;
  compressed: boolean;
}

class DataMigrationManager {
  private persistenceManager: DataPersistenceManager;
  private migrations: Map<string, MigrationConfig> = new Map();
  private currentVersion: string;

  constructor(persistenceManager: DataPersistenceManager, currentVersion: string) {
    this.persistenceManager = persistenceManager;
    this.currentVersion = currentVersion;
    this.setupDefaultMigrations();
  }

  /**
   * Setup default migration configurations
   */
  private setupDefaultMigrations(): void {
    // Migration from 1.0.0 to 1.1.0 - Add new character fields
    this.addMigration({
      fromVersion: '1.0.0',
      toVersion: '1.1.0',
      description: 'Add character status and relationship tracking',
      migrationFunction: (data: any) => {
        if (data.characters) {
          data.characters = data.characters.map((character: any) => ({
            ...character,
            statuses: character.statuses || [],
            relationships: character.relationships || [],
            customFields: character.customFields || [],
          }));
        }
        if (data.npcs) {
          data.npcs = data.npcs.map((npc: any) => ({
            ...npc,
            disposition: npc.disposition || 50,
            faction: npc.faction || '',
            voiceDescription: npc.voiceDescription || '',
            mannerisms: npc.mannerisms || '',
          }));
        }
        return data;
      },
      validationFunction: (data: any) => {
        return data.characters?.every((char: any) => 
          Array.isArray(char.statuses) && Array.isArray(char.relationships)
        ) ?? true;
      },
    });

    // Migration from 1.1.0 to 1.2.0 - Add timeline event system
    this.addMigration({
      fromVersion: '1.1.0',
      toVersion: '1.2.0',
      description: 'Add timeline event system and world building enhancements',
      migrationFunction: (data: any) => {
        if (!data.timeline) {
          data.timeline = {
            events: [],
            settings: {
              timeScale: 'day',
              autoSave: true,
              showRelations: true,
            },
          };
        }
        
        if (data.worldBuilding) {
          data.worldBuilding.interactiveMap = data.worldBuilding.interactiveMap || {
            enabled: false,
            mapUrl: '',
            markers: [],
          };
        }
        
        return data;
      },
      validationFunction: (data: any) => {
        return !!data.timeline && Array.isArray(data.timeline.events);
      },
    });

    // Migration from 1.2.0 to 1.3.0 - Enhanced AI integration
    this.addMigration({
      fromVersion: '1.2.0',
      toVersion: '1.3.0',
      description: 'Enhanced AI integration with context management',
      migrationFunction: (data: any) => {
        if (!data.aiContext) {
          data.aiContext = {
            selectedElements: [],
            conversationHistory: [],
            preferences: {
              provider: 'openai',
              model: 'gpt-4',
              temperature: 0.7,
            },
          };
        }
        
        // Add AI generation history to characters
        if (data.characters) {
          data.characters = data.characters.map((character: any) => ({
            ...character,
            aiGenerationHistory: character.aiGenerationHistory || [],
          }));
        }
        
        return data;
      },
    });
  }

  /**
   * Add a migration configuration
   */
  addMigration(config: MigrationConfig): void {
    const key = `${config.fromVersion}->${config.toVersion}`;
    this.migrations.set(key, config);
  }

  /**
   * Get migration path from one version to another
   */
  private getMigrationPath(fromVersion: string, toVersion: string): MigrationConfig[] {
    const path: MigrationConfig[] = [];
    let currentVersion = fromVersion;

    while (currentVersion !== toVersion) {
      let found = false;
      
      for (const [key, migration] of this.migrations.entries()) {
        if (migration.fromVersion === currentVersion) {
          path.push(migration);
          currentVersion = migration.toVersion;
          found = true;
          break;
        }
      }
      
      if (!found) {
        throw new Error(`No migration path found from ${currentVersion} to ${toVersion}`);
      }
    }

    return path;
  }

  /**
   * Check if migration is needed
   */
  needsMigration(dataVersion: string): boolean {
    return dataVersion !== this.currentVersion;
  }

  /**
   * Perform migration
   */
  async migrate(data: any, fromVersion: string, toVersion?: string): Promise<MigrationResult> {
    const targetVersion = toVersion || this.currentVersion;
    const startTime = Date.now();
    
    const result: MigrationResult = {
      success: true,
      fromVersion,
      toVersion: targetVersion,
      migratedItems: 0,
      errors: [],
      warnings: [],
      duration: 0,
    };

    try {
      // Create backup before migration
      const backup = await this.createBackup(data, `Pre-migration backup from ${fromVersion} to ${targetVersion}`);
      result.backupId = backup.id;

      // Get migration path
      const migrationPath = this.getMigrationPath(fromVersion, targetVersion);
      
      let currentData = data;
      
      for (const migration of migrationPath) {
        console.log(`Applying migration: ${migration.description}`);
        
        try {
          // Apply migration
          currentData = migration.migrationFunction(currentData);
          
          // Validate migration result
          if (migration.validationFunction && !migration.validationFunction(currentData)) {
            throw new Error(`Migration validation failed: ${migration.description}`);
          }
          
          result.migratedItems++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
          result.errors.push(`Migration ${migration.fromVersion}->${migration.toVersion}: ${errorMessage}`);
          result.success = false;
          
          // Attempt rollback if available
          if (migration.rollbackFunction) {
            try {
              currentData = migration.rollbackFunction(currentData);
              result.warnings.push(`Rolled back migration ${migration.fromVersion}->${migration.toVersion}`);
            } catch (rollbackError) {
              result.errors.push(`Rollback failed: ${rollbackError}`);
            }
          }
          
          break;
        }
      }

      // Update version in data
      if (result.success) {
        currentData.version = targetVersion;
        currentData.migrationTimestamp = new Date().toISOString();
      }

      result.duration = Date.now() - startTime;
      return result;

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Validate data integrity
   */
  async validateData(data: any): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      summary: {
        totalEntities: 0,
        validEntities: 0,
        errorsCount: 0,
        warningsCount: 0,
      },
    };

    try {
      // Validate campaign structure
      if (data.campaigns) {
        for (const campaign of data.campaigns) {
          result.summary.totalEntities++;
          
          const campaignErrors = this.validateCampaign(campaign);
          if (campaignErrors.length === 0) {
            result.summary.validEntities++;
          } else {
            result.errors.push(...campaignErrors);
          }
        }
      }

      // Validate characters
      if (data.characters) {
        for (const character of data.characters) {
          result.summary.totalEntities++;
          
          const characterErrors = this.validateCharacter(character);
          if (characterErrors.length === 0) {
            result.summary.validEntities++;
          } else {
            result.errors.push(...characterErrors);
          }
        }
      }

      // Validate sessions
      if (data.sessions) {
        for (const session of data.sessions) {
          result.summary.totalEntities++;
          
          const sessionErrors = this.validateSession(session);
          if (sessionErrors.length === 0) {
            result.summary.validEntities++;
          } else {
            result.errors.push(...sessionErrors);
          }
        }
      }

      // Calculate summary
      result.summary.errorsCount = result.errors.filter(e => e.severity === 'error').length;
      result.summary.warningsCount = result.errors.filter(e => e.severity === 'warning').length;
      result.isValid = result.summary.errorsCount === 0;

    } catch (error) {
      result.isValid = false;
      result.errors.push({
        type: 'validation_error',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        severity: 'error',
      });
    }

    return result;
  }

  /**
   * Validate individual campaign
   */
  private validateCampaign(campaign: any): Array<{ type: string; message: string; entityId?: string; severity: 'error' | 'warning' }> {
    const errors: Array<{ type: string; message: string; entityId?: string; severity: 'error' | 'warning' }> = [];

    if (!campaign.id) {
      errors.push({
        type: 'missing_id',
        message: 'Campaign missing required ID field',
        entityId: campaign.id,
        severity: 'error',
      });
    }

    if (!campaign.title || campaign.title.trim().length === 0) {
      errors.push({
        type: 'missing_title',
        message: 'Campaign missing or empty title',
        entityId: campaign.id,
        severity: 'error',
      });
    }

    if (!campaign.createdAt) {
      errors.push({
        type: 'missing_timestamp',
        message: 'Campaign missing createdAt timestamp',
        entityId: campaign.id,
        severity: 'warning',
      });
    }

    // Validate character references
    if (campaign.characters) {
      for (const character of campaign.characters) {
        if (!character.id || !character.name) {
          errors.push({
            type: 'invalid_character',
            message: 'Character missing required fields (id or name)',
            entityId: campaign.id,
            severity: 'error',
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate individual character
   */
  private validateCharacter(character: any): Array<{ type: string; message: string; entityId?: string; severity: 'error' | 'warning' }> {
    const errors: Array<{ type: string; message: string; entityId?: string; severity: 'error' | 'warning' }> = [];

    if (!character.id) {
      errors.push({
        type: 'missing_id',
        message: 'Character missing required ID field',
        entityId: character.id,
        severity: 'error',
      });
    }

    if (!character.name || character.name.trim().length === 0) {
      errors.push({
        type: 'missing_name',
        message: 'Character missing or empty name',
        entityId: character.id,
        severity: 'error',
      });
    }

    if (!character.characterType || !['PC', 'NPC', 'Enemy'].includes(character.characterType)) {
      errors.push({
        type: 'invalid_character_type',
        message: 'Character has invalid or missing characterType',
        entityId: character.id,
        severity: 'error',
      });
    }

    // Validate stats if present
    if (character.stats) {
      const requiredStats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      for (const stat of requiredStats) {
        if (typeof character.stats[stat] !== 'number') {
          errors.push({
            type: 'invalid_stat',
            message: `Character stat '${stat}' is not a number`,
            entityId: character.id,
            severity: 'warning',
          });
        }
      }
    }

    return errors;
  }

  /**
   * Validate individual session
   */
  private validateSession(session: any): Array<{ type: string; message: string; entityId?: string; severity: 'error' | 'warning' }> {
    const errors: Array<{ type: string; message: string; entityId?: string; severity: 'error' | 'warning' }> = [];

    if (!session.id) {
      errors.push({
        type: 'missing_id',
        message: 'Session missing required ID field',
        entityId: session.id,
        severity: 'error',
      });
    }

    if (!session.campaignId) {
      errors.push({
        type: 'missing_campaign_id',
        message: 'Session missing campaignId reference',
        entityId: session.id,
        severity: 'error',
      });
    }

    if (!session.timestamp) {
      errors.push({
        type: 'missing_timestamp',
        message: 'Session missing timestamp',
        entityId: session.id,
        severity: 'warning',
      });
    }

    return errors;
  }

  /**
   * Create backup with metadata
   */
  async createBackup(data: any, description: string): Promise<BackupMetadata> {
    const timestamp = new Date().toISOString();
    const backupId = `backup_${Date.now()}`;
    
    // Calculate entity counts
    const entityCounts: Record<string, number> = {
      campaigns: data.campaigns?.length || 0,
      characters: data.characters?.length || 0,
      sessions: data.sessions?.length || 0,
      npcs: data.npcs?.length || 0,
      enemies: data.enemies?.length || 0,
    };

    // Create backup data
    const backupData: BackupData = {
      campaigns: data.campaigns || [],
      preferences: data.preferences || {},
      aiSettings: data.aiSettings || {},
      sessionData: data.sessionData || {},
      metadata: {
        version: data.version || '1.0.0',
        timestamp,
        appVersion: this.currentVersion,
        size: 0,
      },
    };

    // Calculate size and checksum
    const serialized = JSON.stringify(backupData);
    backupData.metadata.size = serialized.length;
    
    const checksum = await this.calculateChecksum(serialized);

    // Save backup
    await this.persistenceManager.save('backups', backupId, backupData, {
      useVersioning: false,
      skipOfflineQueue: true,
    });

    const metadata: BackupMetadata = {
      id: backupId,
      timestamp,
      version: data.version || '1.0.0',
      description,
      size: backupData.metadata.size,
      entityCounts,
      checksum,
      compressed: false,
    };

    // Save backup metadata
    await this.persistenceManager.save('backup_metadata', backupId, metadata, {
      useVersioning: false,
      skipOfflineQueue: true,
    });

    return metadata;
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      // This would need to be implemented in the persistence manager
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreBackup(backupId: string): Promise<any> {
    try {
      const backupData = await this.persistenceManager.load('backups', backupId);
      if (!backupData) {
        throw new Error('Backup not found');
      }

      // Verify checksum
      const metadata = await this.persistenceManager.load('backup_metadata', backupId);
      if (metadata) {
        const serialized = JSON.stringify(backupData);
        const calculatedChecksum = await this.calculateChecksum(serialized);
        
        if (calculatedChecksum !== metadata.checksum) {
          throw new Error('Backup data integrity check failed');
        }
      }

      return backupData;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      await this.persistenceManager.save('backups', backupId, null, { useVersioning: false });
      await this.persistenceManager.save('backup_metadata', backupId, null, { useVersioning: false });
    } catch (error) {
      console.error('Failed to delete backup:', error);
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
   * Repair data based on validation results
   */
  async repairData(data: any, validationResult: ValidationResult): Promise<any> {
    const repairedData = JSON.parse(JSON.stringify(data)); // Deep clone

    for (const error of validationResult.errors) {
      if (error.severity === 'error') {
        // Attempt automatic repairs for common issues
        switch (error.type) {
          case 'missing_id':
            // Generate new ID for entities missing one
            if (error.entityId === undefined) {
              // This would need more context to properly repair
              console.warn('Cannot auto-repair missing ID without entity context');
            }
            break;

          case 'missing_timestamp':
            // Add current timestamp for missing timestamps
            if (repairedData.campaigns) {
              repairedData.campaigns.forEach((campaign: any) => {
                if (!campaign.createdAt) {
                  campaign.createdAt = new Date().toISOString();
                }
                if (!campaign.updatedAt) {
                  campaign.updatedAt = new Date().toISOString();
                }
              });
            }
            break;

          case 'invalid_character_type':
            // Set default character type
            if (repairedData.characters) {
              repairedData.characters.forEach((character: any) => {
                if (!character.characterType || !['PC', 'NPC', 'Enemy'].includes(character.characterType)) {
                  character.characterType = 'PC'; // Default to PC
                }
              });
            }
            break;
        }
      }
    }

    return repairedData;
  }

  /**
   * Export migration and backup statistics
   */
  async getStatistics(): Promise<{
    availableMigrations: Array<{ from: string; to: string; description: string }>;
    backupCount: number;
    totalBackupSize: number;
    lastBackup: string | null;
    dataIntegrityStatus: 'good' | 'warning' | 'error';
  }> {
    const availableMigrations = Array.from(this.migrations.values()).map(m => ({
      from: m.fromVersion,
      to: m.toVersion,
      description: m.description,
    }));

    const backups = await this.listBackups();
    const backupCount = backups.length;
    const totalBackupSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    const lastBackup = backups.length > 0 
      ? backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
      : null;

    return {
      availableMigrations,
      backupCount,
      totalBackupSize,
      lastBackup,
      dataIntegrityStatus: 'good', // This would be calculated based on recent validation results
    };
  }
}

export default DataMigrationManager;
# TRPG Data Persistence System

A comprehensive data persistence solution for the TRPG application, providing robust data storage, synchronization, migration, and integrity management capabilities.

## Overview

The persistence system is designed to handle all aspects of data storage for a TRPG application, including:

- **Multiple Storage Types**: LocalStorage, SessionStorage, and IndexedDB
- **Offline Support**: Queue operations for later synchronization
- **Data Versioning**: Track changes and enable undo/redo functionality
- **Migration Support**: Handle data format changes between versions
- **Integrity Checking**: Validate and repair corrupted data
- **Backup & Restore**: Create and restore complete data backups
- **Real-time Sync**: Synchronize data across multiple tabs/windows

## Architecture

### Core Components

#### 1. DataPersistenceManager
The main persistence manager that coordinates storage operations across different storage types.

```typescript
import { DataPersistenceManager } from './utils/persistence/DataPersistenceManager';

const manager = new DataPersistenceManager({
  primaryStorage: 'indexedDB',
  fallbackStorage: 'localStorage',
  enableOfflineMode: true,
  enableCompression: true,
});

// Save data
await manager.save('campaigns', campaignId, campaignData);

// Load data
const campaign = await manager.load('campaigns', campaignId);
```

#### 2. SessionStorageManager
Manages temporary session data with encryption and expiration support.

```typescript
import { TRPGSessionStorageManager } from './utils/persistence/SessionStorageManager';

const sessionManager = new TRPGSessionStorageManager();

// Save form draft
await sessionManager.saveFormDraft('character-form', formData, {
  formType: 'character',
  campaignId: 'campaign-123',
});

// Restore form draft
const draft = await sessionManager.restoreFormDraft('character-form');
```

#### 3. IndexedDBManager
Advanced IndexedDB operations with caching, querying, and transaction support.

```typescript
import IndexedDBManager from './utils/persistence/IndexedDBManager';

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
  ],
});

// Query with advanced options
const campaigns = await indexedDB.query('campaigns', {
  index: 'updatedAt',
  direction: 'prev',
  limit: 10,
});
```

#### 4. SyncManager
Handles data synchronization with conflict resolution and offline queuing.

```typescript
import SyncManager from './utils/persistence/SyncManager';

const syncManager = new SyncManager(config, persistenceManager, sessionManager, indexedDB);

syncManager.setCallbacks({
  onConflictDetected: (conflict) => {
    // Handle sync conflicts
    console.log('Conflict detected:', conflict);
  },
  onSyncComplete: (result) => {
    console.log('Sync completed:', result);
  },
});
```

#### 5. DataMigrationManager
Manages data migrations, validation, and backup operations.

```typescript
import DataMigrationManager from './utils/persistence/DataMigrationManager';

const migrationManager = new DataMigrationManager(persistenceManager, '1.0.0');

// Run migration
const result = await migrationManager.migrate(data, '1.0.0', '1.1.0');

// Validate data
const validation = await migrationManager.validateData(data);
```

## React Integration

### Hooks

#### usePersistence
Main hook for data persistence operations.

```typescript
import { useCampaignPersistence } from './hooks/usePersistence';

function CampaignComponent({ campaignId }) {
  const { state, actions } = useCampaignPersistence(campaignId, {
    autoSave: true,
    enableVersioning: true,
  });

  const saveCampaign = async (data) => {
    await actions.save(data);
  };

  return (
    <div>
      {state.isSaving && <div>Saving...</div>}
      {state.hasUnsavedChanges && <div>Unsaved changes</div>}
      {/* Campaign form */}
    </div>
  );
}
```

#### useDataIntegrity
Hook for data integrity monitoring and repair.

```typescript
import useDataIntegrity from './hooks/useDataIntegrity';

function IntegrityMonitor() {
  const {
    healthStatus,
    runIntegrityCheck,
    repairData,
    optimizeStorage,
  } = useDataIntegrity({
    enableAutomaticChecks: true,
    onIntegrityIssue: (result) => {
      console.warn('Integrity issues found:', result);
    },
  });

  return (
    <div>
      <div>Health: {healthStatus.overall}</div>
      <button onClick={runIntegrityCheck}>Check Integrity</button>
      <button onClick={() => repairData({ autoRepair: true })}>Auto Repair</button>
      <button onClick={optimizeStorage}>Optimize Storage</button>
    </div>
  );
}
```

### Components

#### DataPersistenceProvider
Context provider that initializes and manages the persistence system.

```typescript
import { DataPersistenceProvider } from './components/persistence/DataPersistenceProvider';

function App() {
  return (
    <DataPersistenceProvider
      config={{
        enableOfflineMode: true,
        enableAutoMigration: true,
        showNotifications: true,
      }}
    >
      <YourAppComponents />
    </DataPersistenceProvider>
  );
}
```

#### PersistenceStatusIndicator
Visual indicator showing persistence system status.

```typescript
import PersistenceStatusIndicator from './components/persistence/PersistenceStatusIndicator';

function Layout() {
  return (
    <div>
      <YourContent />
      <PersistenceStatusIndicator 
        position="top-right"
        size="medium"
      />
    </div>
  );
}
```

## Configuration

### Default Configuration

```typescript
const DEFAULT_PERSISTENCE_CONFIG = {
  primaryStorage: 'indexedDB',
  fallbackStorage: 'localStorage',
  version: '1.0.0',
  autoSaveInterval: 5000,
  debounceTime: 1000,
  maxVersionHistory: 20,
  enableOfflineMode: true,
  enableCompression: true,
  compressionThreshold: 1024,
};
```

### Customization

```typescript
const customConfig = {
  primaryStorage: 'localStorage', // Use localStorage as primary
  autoSaveInterval: 10000, // Save every 10 seconds
  maxVersionHistory: 50, // Keep 50 versions
  sync: {
    remoteEndpoint: 'https://api.example.com',
    apiKey: 'your-api-key',
    conflictResolution: 'manual',
  },
};
```

## Storage Types and Use Cases

### LocalStorage
- **Use for**: Small, frequently accessed data
- **Capacity**: ~5-10MB
- **Persistence**: Until manually cleared
- **Examples**: User preferences, campaign list, current selection

### SessionStorage
- **Use for**: Temporary data that expires
- **Capacity**: ~5-10MB
- **Persistence**: Until tab closes
- **Examples**: Form drafts, AI conversation context, temporary state

### IndexedDB
- **Use for**: Large, structured data
- **Capacity**: ~50MB+ (quota-based)
- **Persistence**: Long-term, survives browser restarts
- **Examples**: Full campaign data, character details, session logs

## Data Flow

```
User Action
    ↓
Component State Change
    ↓
usePersistence Hook
    ↓
DataPersistenceManager
    ↓
Storage Selection (IndexedDB → LocalStorage)
    ↓
Data Serialization & Compression
    ↓
Storage Operation
    ↓
Version History (if enabled)
    ↓
Sync Queue (if offline)
```

## Migration System

### Adding Migrations

```typescript
migrationManager.addMigration({
  fromVersion: '1.0.0',
  toVersion: '1.1.0',
  description: 'Add character status tracking',
  migrationFunction: (data) => {
    if (data.characters) {
      data.characters = data.characters.map(character => ({
        ...character,
        statuses: character.statuses || [],
        relationships: character.relationships || [],
      }));
    }
    return data;
  },
  validationFunction: (data) => {
    return data.characters?.every(char => 
      Array.isArray(char.statuses) && Array.isArray(char.relationships)
    ) ?? true;
  },
});
```

### Automatic Migration

The system automatically detects version mismatches and prompts for migration:

1. Compare stored data version with current app version
2. Show migration dialog if needed
3. Create backup before migration
4. Apply migration functions in sequence
5. Validate migrated data
6. Update version information

## Offline Support

### Offline Queue
When offline, all changes are queued for later synchronization:

```typescript
// Operations are automatically queued when offline
await manager.save('campaigns', campaignId, data); // → Goes to sync queue

// When back online, sync queue is processed
await syncManager.processSyncQueue();
```

### Conflict Resolution
When conflicts occur during sync:

1. **Timestamp-based**: Use the most recent version
2. **Client-first**: Always prefer local changes
3. **Server-first**: Always prefer remote changes
4. **Manual**: Prompt user to resolve conflicts

## Testing

### E2E Tests
Comprehensive E2E tests cover:

- Data persistence across browser sessions
- Offline/online transitions
- Data migration scenarios
- Conflict resolution workflows
- Performance under load
- Data integrity validation

### Running Tests

```bash
# Run all persistence tests
npm run test:e2e -- --grep "persistence"

# Run specific test file
npm run test:e2e e2e/pages/data-persistence-comprehensive.spec.ts

# Run integration tests
npm run test:e2e e2e/pages/persistence-integration-test.spec.ts
```

## Performance Considerations

### Storage Optimization
- **Compression**: Automatic compression for data >1KB
- **Caching**: In-memory cache for frequently accessed data
- **Cleanup**: Automatic cleanup of old versions and expired data
- **Batch Operations**: Group multiple operations for efficiency

### Monitoring
- **Storage Usage**: Track usage across all storage types
- **Access Times**: Monitor performance metrics
- **Error Rates**: Track and log persistence errors
- **Cache Hit Rates**: Optimize caching strategies

## Troubleshooting

### Common Issues

#### Storage Quota Exceeded
```typescript
try {
  await manager.save(entityType, entityId, data);
} catch (error) {
  if (error.code === 'STORAGE_QUOTA_EXCEEDED') {
    await manager.optimizeStorage();
    // Retry or show user guidance
  }
}
```

#### Data Corruption
```typescript
const integrity = await useDataIntegrity();
const result = await integrity.runIntegrityCheck();

if (!result.isValid) {
  // Show repair options to user
  await integrity.repairData({ autoRepair: true });
}
```

#### Sync Conflicts
```typescript
syncManager.setCallbacks({
  onConflictDetected: async (conflict) => {
    // Show conflict resolution UI
    const resolution = await showConflictDialog(conflict);
    await syncManager.resolveConflict(conflict.id, resolution);
  },
});
```

### Debug Mode
Enable debug logging:

```typescript
const manager = new DataPersistenceManager({
  debug: true, // Enable debug logging
  // ... other config
});
```

## Security Considerations

### Data Encryption
- SessionStorage supports optional encryption for sensitive data
- IndexedDB data is not encrypted by default (browser-level security)
- Backup data can be encrypted before storage

### Access Control
- Data is scoped to the current origin (browser security)
- Session data expires automatically
- Backup access requires explicit user action

## Future Enhancements

- **Cloud Sync**: Integration with cloud storage providers
- **Collaborative Editing**: Real-time collaboration support
- **Advanced Compression**: More efficient compression algorithms
- **Incremental Sync**: Sync only changed data
- **Encryption**: End-to-end encryption for sensitive data
- **Performance Analytics**: Detailed performance monitoring

## API Reference

For detailed API documentation, see the individual component files:

- [DataPersistenceManager.ts](./DataPersistenceManager.ts)
- [SessionStorageManager.ts](./SessionStorageManager.ts)
- [IndexedDBManager.ts](./IndexedDBManager.ts)
- [SyncManager.ts](./SyncManager.ts)
- [DataMigrationManager.ts](./DataMigrationManager.ts)
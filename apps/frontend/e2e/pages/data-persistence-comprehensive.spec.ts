/**
 * Comprehensive Data Persistence E2E Tests for TRPG Application
 * Tests all aspects of data persistence including storage, sync, migration, and recovery
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test data for TRPG entities
const testCampaign = {
  id: 'test-campaign-persistence',
  title: 'Persistence Test Campaign',
  summary: 'A campaign used for testing data persistence features',
  characters: [],
  npcs: [],
  enemies: [],
  worldBuilding: {
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
  },
  sessions: [],
  quests: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const testCharacter = {
  id: 'test-character-persistence',
  name: 'Test Warrior',
  characterType: 'PC',
  race: 'Human',
  class: 'Fighter',
  background: 'Soldier',
  alignment: 'Lawful Good',
  gender: 'Male',
  age: '30',
  appearance: 'A sturdy warrior with battle scars',
  personality: 'Brave and loyal',
  motivation: 'Protect the innocent',
  stats: {
    strength: 16,
    dexterity: 14,
    constitution: 15,
    intelligence: 12,
    wisdom: 13,
    charisma: 11,
    hitPoints: { current: 50, max: 50, temp: 0 },
    armorClass: 18,
    speed: 30,
    level: 5,
    experience: 6500,
    proficiencyBonus: 3,
  },
  skills: ['Athletics', 'Intimidation', 'Survival'],
  equipment: ['Longsword', 'Shield', 'Chain Mail'],
  progression: [],
  traits: ['Second Wind', 'Action Surge'],
  relationships: [],
  imageUrl: '',
  customFields: [],
  statuses: [],
  notes: 'A test character for persistence testing',
};

// Helper functions
async function clearAllStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    if ('indexedDB' in window) {
      // Clear IndexedDB
      const databases = ['TRPGDataDB'];
      databases.forEach(dbName => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => console.log(`Cleared ${dbName}`);
      });
    }
  });
}

async function simulateNetworkOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
}

async function simulateNetworkOnline(page: Page): Promise<void> {
  await page.context().setOffline(false);
}

async function simulateBrowserCrash(context: BrowserContext): Promise<Page> {
  // Close all pages to simulate crash
  const pages = context.pages();
  for (const page of pages) {
    await page.close();
  }
  
  // Create new page to simulate restart
  return await context.newPage();
}

async function waitForPersistenceReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    return window.localStorage && 
           window.sessionStorage && 
           window.indexedDB !== undefined;
  });
}

test.describe('Data Persistence System', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
    await waitForPersistenceReady(page);
  });

  test.describe('Local Storage Persistence', () => {
    test('should save and restore campaign data', async ({ page }) => {
      // Navigate to home page
      await page.goto('/');
      
      // Create a new campaign
      await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
      await page.fill('input[name="title"]', testCampaign.title);
      await page.fill('textarea[name="summary"]', testCampaign.summary);
      await page.getByRole('button', { name: /作成/ }).click();

      // Wait for campaign to be saved
      await page.waitForSelector('[data-testid="campaign-created"]', { timeout: 5000 });

      // Verify data is in localStorage
      const savedData = await page.evaluate(() => {
        const campaigns = localStorage.getItem('trpg_campaign_list');
        return campaigns ? JSON.parse(campaigns) : null;
      });

      expect(savedData).toBeTruthy();
      expect(savedData).toContainEqual(
        expect.objectContaining({
          title: testCampaign.title,
        })
      );

      // Refresh page and verify data persists
      await page.reload();
      await page.waitForSelector('[data-testid="campaign-list"]');
      
      const campaignTitle = await page.textContent(`[data-testid="campaign-title"]`);
      expect(campaignTitle).toContain(testCampaign.title);
    });

    test('should handle storage quota exceeded gracefully', async ({ page }) => {
      // Fill localStorage to near capacity
      await page.evaluate(() => {
        const largeData = 'x'.repeat(1024 * 1024); // 1MB string
        for (let i = 0; i < 4; i++) {
          try {
            localStorage.setItem(`large_data_${i}`, largeData);
          } catch (e) {
            console.log('Storage quota reached');
            break;
          }
        }
      });

      // Try to save campaign
      await page.goto('/');
      await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
      await page.fill('input[name="title"]', 'Storage Test Campaign');
      await page.fill('textarea[name="summary"]', 'Testing storage limits');
      await page.getByRole('button', { name: /作成/ }).click();

      // Should show appropriate error or fallback behavior
      await expect(page.locator('[data-testid="storage-warning"]')).toBeVisible({ timeout: 5000 });
    });

    test('should auto-save form data', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
      
      // Start typing in form
      await page.fill('input[name="title"]', 'Auto-save Test');
      await page.fill('textarea[name="summary"]', 'Testing auto-save functionality');

      // Wait for auto-save to trigger
      await page.waitForTimeout(3000);

      // Verify draft is saved in sessionStorage
      const draftData = await page.evaluate(() => {
        const draft = sessionStorage.getItem('trpg_session_form_drafts:campaign_create');
        return draft ? JSON.parse(draft) : null;
      });

      expect(draftData).toBeTruthy();
      expect(draftData.data.formData.title).toBe('Auto-save Test');
    });
  });

  test.describe('IndexedDB Persistence', () => {
    test('should store large campaign data in IndexedDB', async ({ page }) => {
      // Create campaign with large amount of data
      const largeCampaign = {
        ...testCampaign,
        characters: Array(100).fill(0).map((_, i) => ({
          ...testCharacter,
          id: `character-${i}`,
          name: `Character ${i}`,
        })),
      };

      await page.evaluate((campaign) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('TRPGDataDB', 1);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('campaigns')) {
              db.createObjectStore('campaigns', { keyPath: 'id' });
            }
          };
          request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['campaigns'], 'readwrite');
            const store = transaction.objectStore('campaigns');
            store.put(campaign);
            transaction.oncomplete = () => resolve(true);
          };
        });
      }, largeCampaign);

      // Verify data can be retrieved
      const retrievedData = await page.evaluate((campaignId) => {
        return new Promise((resolve) => {
          const request = indexedDB.open('TRPGDataDB', 1);
          request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['campaigns'], 'readonly');
            const store = transaction.objectStore('campaigns');
            const getRequest = store.get(campaignId);
            getRequest.onsuccess = () => resolve(getRequest.result);
          };
        });
      }, largeCampaign.id);

      expect(retrievedData).toBeTruthy();
      expect(retrievedData.characters).toHaveLength(100);
    });

    test('should handle IndexedDB version upgrades', async ({ page }) => {
      // Simulate old database version
      await page.evaluate(() => {
        return new Promise((resolve) => {
          const request = indexedDB.open('TRPGDataDB', 1);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('old_campaigns', { keyPath: 'id' });
          };
          request.onsuccess = () => resolve(true);
        });
      });

      // Trigger database upgrade by opening with higher version
      const upgradeResult = await page.evaluate(() => {
        return new Promise((resolve) => {
          const request = indexedDB.open('TRPGDataDB', 2);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('campaigns')) {
              db.createObjectStore('campaigns', { keyPath: 'id' });
            }
            if (db.objectStoreNames.contains('old_campaigns')) {
              db.deleteObjectStore('old_campaigns');
            }
            resolve('upgraded');
          };
          request.onsuccess = () => resolve('success');
        });
      });

      expect(upgradeResult).toBe('upgraded');
    });
  });

  test.describe('Offline Persistence', () => {
    test('should save data while offline', async ({ page }) => {
      await page.goto('/');
      
      // Go offline
      await simulateNetworkOffline(page);

      // Create campaign while offline
      await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
      await page.fill('input[name="title"]', 'Offline Campaign');
      await page.fill('textarea[name="summary"]', 'Created while offline');
      await page.getByRole('button', { name: /作成/ }).click();

      // Verify offline indicator is shown
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

      // Verify data is saved locally
      const offlineData = await page.evaluate(() => {
        return localStorage.getItem('trpg_campaign_list');
      });

      expect(JSON.parse(offlineData)).toContainEqual(
        expect.objectContaining({
          title: 'Offline Campaign',
        })
      );

      // Go back online
      await simulateNetworkOnline(page);

      // Verify sync indicator appears
      await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible({ timeout: 10000 });
    });

    test('should handle offline-online transitions', async ({ page }) => {
      await page.goto('/');

      // Create initial data while online
      await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
      await page.fill('input[name="title"]', 'Online Campaign');
      await page.getByRole('button', { name: /作成/ }).click();
      await page.waitForSelector('[data-testid="campaign-created"]');

      // Go offline and modify data
      await simulateNetworkOffline(page);
      await page.click('[data-testid="edit-campaign"]');
      await page.fill('textarea[name="summary"]', 'Modified while offline');
      await page.getByRole('button', { name: /保存/ }).click();

      // Go back online
      await simulateNetworkOnline(page);

      // Verify conflict resolution or successful sync
      await page.waitForSelector('[data-testid="sync-status"]', { timeout: 15000 });
      const syncStatus = await page.textContent('[data-testid="sync-status"]');
      expect(syncStatus).toMatch(/(同期完了|競合解決)/);
    });

    test('should queue changes for sync when offline', async ({ page }) => {
      await page.goto('/');
      await simulateNetworkOffline(page);

      // Make multiple changes while offline
      const changes = [
        { title: 'Offline Campaign 1', summary: 'First offline campaign' },
        { title: 'Offline Campaign 2', summary: 'Second offline campaign' },
        { title: 'Offline Campaign 3', summary: 'Third offline campaign' },
      ];

      for (const change of changes) {
        await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
        await page.fill('input[name="title"]', change.title);
        await page.fill('textarea[name="summary"]', change.summary);
        await page.getByRole('button', { name: /作成/ }).click();
        await page.waitForTimeout(1000);
      }

      // Verify sync queue count
      const queueCount = await page.evaluate(() => {
        const queue = sessionStorage.getItem('trpg_session_sync_queue');
        return queue ? JSON.parse(queue).length : 0;
      });

      expect(queueCount).toBeGreaterThan(0);

      // Go online and verify sync
      await simulateNetworkOnline(page);
      await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 20000 });
    });
  });

  test.describe('Data Recovery and Integrity', () => {
    test('should recover from browser crash', async ({ context, page }) => {
      await page.goto('/');
      
      // Create campaign data
      await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
      await page.fill('input[name="title"]', 'Crash Test Campaign');
      await page.fill('textarea[name="summary"]', 'Testing crash recovery');
      await page.getByRole('button', { name: /作成/ }).click();
      await page.waitForSelector('[data-testid="campaign-created"]');

      // Simulate browser crash and restart
      const newPage = await simulateBrowserCrash(context);
      await newPage.goto('/');
      await waitForPersistenceReady(newPage);

      // Verify data is recovered
      await newPage.waitForSelector('[data-testid="campaign-list"]');
      const campaignTitle = await newPage.textContent('[data-testid="campaign-title"]');
      expect(campaignTitle).toContain('Crash Test Campaign');
    });

    test('should validate data integrity', async ({ page }) => {
      await page.goto('/');

      // Inject corrupted data
      await page.evaluate(() => {
        const corruptedData = JSON.stringify({
          id: 'corrupted-campaign',
          title: '', // Invalid: empty title
          characters: [
            { id: '', name: 'Invalid Character' }, // Invalid: empty id
          ],
        });
        localStorage.setItem('trpg_campaign_corrupted-campaign', corruptedData);
      });

      // Trigger data validation
      await page.evaluate(() => {
        // This would trigger the validation system
        window.dispatchEvent(new CustomEvent('validate-data'));
      });

      // Verify validation errors are shown
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible({ timeout: 5000 });
    });

    test('should create and restore backups', async ({ page }) => {
      await page.goto('/');

      // Create campaign data
      await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
      await page.fill('input[name="title"]', 'Backup Test Campaign');
      await page.getByRole('button', { name: /作成/ }).click();
      await page.waitForSelector('[data-testid="campaign-created"]');

      // Create backup
      await page.click('[data-testid="settings-menu"]');
      await page.click('[data-testid="create-backup"]');
      await page.waitForSelector('[data-testid="backup-created"]');

      // Clear current data
      await clearAllStorage(page);

      // Restore from backup
      await page.click('[data-testid="settings-menu"]');
      await page.click('[data-testid="restore-backup"]');
      await page.waitForSelector('[data-testid="backup-restored"]');

      // Verify data is restored
      await page.reload();
      await page.waitForSelector('[data-testid="campaign-list"]');
      const campaignTitle = await page.textContent('[data-testid="campaign-title"]');
      expect(campaignTitle).toContain('Backup Test Campaign');
    });
  });

  test.describe('Auto-Save and Version History', () => {
    test('should auto-save character sheet changes', async ({ page }) => {
      await page.goto('/characters');

      // Create character
      await page.getByRole('button', { name: /新しいキャラクター/ }).click();
      await page.fill('input[name="name"]', testCharacter.name);
      await page.selectOption('select[name="characterType"]', 'PC');
      await page.getByRole('button', { name: /作成/ }).click();

      // Edit character stats
      await page.fill('input[name="strength"]', '18');
      await page.fill('input[name="hitPoints.current"]', '45');

      // Wait for auto-save
      await page.waitForSelector('[data-testid="auto-save-indicator"]', { timeout: 6000 });
      await expect(page.locator('[data-testid="auto-save-indicator"]')).toContainText('保存済み');

      // Verify changes are saved
      await page.reload();
      await page.waitForSelector('input[name="strength"]');
      const strengthValue = await page.inputValue('input[name="strength"]');
      expect(strengthValue).toBe('18');
    });

    test('should maintain version history', async ({ page }) => {
      await page.goto('/characters');

      // Create and modify character multiple times
      await page.getByRole('button', { name: /新しいキャラクター/ }).click();
      await page.fill('input[name="name"]', 'Version Test Character');
      await page.getByRole('button', { name: /作成/ }).click();

      // Make several changes
      const changes = [
        { field: 'strength', value: '14' },
        { field: 'strength', value: '16' },
        { field: 'strength', value: '18' },
      ];

      for (const change of changes) {
        await page.fill(`input[name="${change.field}"]`, change.value);
        await page.waitForSelector('[data-testid="auto-save-indicator"]', { timeout: 6000 });
        await page.waitForTimeout(1000); // Ensure separate versions
      }

      // Open version history
      await page.click('[data-testid="version-history"]');
      await page.waitForSelector('[data-testid="version-list"]');

      // Verify multiple versions exist
      const versionCount = await page.locator('[data-testid="version-item"]').count();
      expect(versionCount).toBeGreaterThan(1);

      // Restore previous version
      await page.click('[data-testid="version-item"]').first();
      await page.click('[data-testid="restore-version"]');
      await page.waitForSelector('[data-testid="version-restored"]');

      // Verify restoration
      const restoredValue = await page.inputValue('input[name="strength"]');
      expect(restoredValue).not.toBe('18');
    });

    test('should handle concurrent editing conflicts', async ({ context }) => {
      // Open same campaign in two tabs
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.goto('/characters');
      await page2.goto('/characters');

      // Create character in first tab
      await page1.getByRole('button', { name: /新しいキャラクター/ }).click();
      await page1.fill('input[name="name"]', 'Conflict Test Character');
      await page1.getByRole('button', { name: /作成/ }).click();
      await page1.waitForSelector('[data-testid="character-created"]');

      // Edit in both tabs simultaneously
      await page1.fill('input[name="strength"]', '16');
      await page2.fill('input[name="strength"]', '18');

      // Both should auto-save
      await page1.waitForSelector('[data-testid="auto-save-indicator"]');
      await page2.waitForSelector('[data-testid="auto-save-indicator"]');

      // One should show conflict resolution
      const conflictShown = await Promise.race([
        page1.waitForSelector('[data-testid="conflict-resolution"]', { timeout: 5000 }).then(() => true),
        page2.waitForSelector('[data-testid="conflict-resolution"]', { timeout: 5000 }).then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), 6000)),
      ]);

      if (conflictShown) {
        // Verify conflict resolution UI appears
        const conflictDialog = page1.locator('[data-testid="conflict-resolution"]');
        if (await conflictDialog.isVisible()) {
          await expect(conflictDialog).toContainText('競合が検出されました');
        }
      }
    });
  });

  test.describe('Storage Migration', () => {
    test('should migrate data between versions', async ({ page }) => {
      // Set up old version data
      await page.evaluate(() => {
        const oldVersionData = {
          version: '1.0.0',
          campaigns: [{
            id: 'migration-test',
            title: 'Migration Test Campaign',
            characters: [{
              id: 'char-1',
              name: 'Old Character',
              // Missing new fields that should be added in migration
            }],
          }],
        };
        localStorage.setItem('trpg_migration_data', JSON.stringify(oldVersionData));
      });

      await page.goto('/');

      // Trigger migration check
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('check-migration'));
      });

      // Verify migration prompt appears
      await expect(page.locator('[data-testid="migration-prompt"]')).toBeVisible({ timeout: 5000 });

      // Accept migration
      await page.click('[data-testid="accept-migration"]');
      await page.waitForSelector('[data-testid="migration-complete"]');

      // Verify migrated data has new fields
      const migratedData = await page.evaluate(() => {
        const data = localStorage.getItem('trpg_migration_data');
        return data ? JSON.parse(data) : null;
      });

      expect(migratedData.version).toBe('1.1.0'); // Or current version
      expect(migratedData.campaigns[0].characters[0]).toHaveProperty('statuses');
      expect(migratedData.campaigns[0].characters[0]).toHaveProperty('relationships');
    });

    test('should create backup before migration', async ({ page }) => {
      // Set up old version data
      await page.evaluate(() => {
        const oldData = {
          version: '1.0.0',
          campaigns: [{ id: 'backup-test', title: 'Pre-migration Campaign' }],
        };
        localStorage.setItem('trpg_pre_migration_data', JSON.stringify(oldData));
      });

      await page.goto('/');
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('check-migration'));
      });

      await page.click('[data-testid="accept-migration"]');
      await page.waitForSelector('[data-testid="migration-complete"]');

      // Verify backup was created
      const backupExists = await page.evaluate(() => {
        return localStorage.getItem('trpg_backup_pre_migration') !== null;
      });

      expect(backupExists).toBe(true);
    });
  });

  test.describe('Performance and Optimization', () => {
    test('should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/');

      // Create large dataset
      const largeDataset = {
        campaigns: Array(50).fill(0).map((_, i) => ({
          id: `campaign-${i}`,
          title: `Campaign ${i}`,
          characters: Array(20).fill(0).map((_, j) => ({
            id: `char-${i}-${j}`,
            name: `Character ${j}`,
            ...testCharacter,
          })),
        })),
      };

      const startTime = Date.now();

      await page.evaluate((dataset) => {
        // Simulate saving large dataset
        return new Promise((resolve) => {
          const operations = dataset.campaigns.map(campaign => {
            return new Promise((resolveOp) => {
              localStorage.setItem(`trpg_campaign_${campaign.id}`, JSON.stringify(campaign));
              resolveOp(true);
            });
          });
          Promise.all(operations).then(resolve);
        });
      }, largeDataset);

      const saveTime = Date.now() - startTime;

      // Verify performance is acceptable (under 5 seconds for large dataset)
      expect(saveTime).toBeLessThan(5000);

      // Test retrieval performance
      const retrievalStartTime = Date.now();
      
      const retrievedCount = await page.evaluate(() => {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('trpg_campaign_')) {
            const data = localStorage.getItem(key);
            if (data) {
              JSON.parse(data);
              count++;
            }
          }
        }
        return count;
      });

      const retrievalTime = Date.now() - retrievalStartTime;

      expect(retrievedCount).toBe(50);
      expect(retrievalTime).toBeLessThan(2000); // Under 2 seconds for retrieval
    });

    test('should optimize storage usage', async ({ page }) => {
      await page.goto('/');

      // Fill storage with data
      await page.evaluate(() => {
        for (let i = 0; i < 100; i++) {
          const data = {
            id: `optimization-test-${i}`,
            data: 'x'.repeat(1000), // 1KB per item
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem(`test_data_${i}`, JSON.stringify(data));
        }
      });

      // Trigger storage optimization
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('optimize-storage'));
      });

      await page.waitForTimeout(2000); // Wait for optimization

      // Verify optimization occurred
      const optimizationResult = await page.evaluate(() => {
        // Count remaining items
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('test_data_')) {
            count++;
          }
        }
        return count;
      });

      // Should have cleaned up some old data
      expect(optimizationResult).toBeLessThan(100);
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work consistently across storage types', async ({ page }) => {
      await page.goto('/');

      const testData = {
        localStorage: 'localStorage test data',
        sessionStorage: 'sessionStorage test data',
        indexedDB: 'indexedDB test data',
      };

      // Test all storage types
      await page.evaluate((data) => {
        // localStorage test
        localStorage.setItem('cross_browser_test_local', data.localStorage);

        // sessionStorage test
        sessionStorage.setItem('cross_browser_test_session', data.sessionStorage);

        // IndexedDB test
        return new Promise((resolve) => {
          const request = indexedDB.open('CrossBrowserTest', 1);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const store = db.createObjectStore('test', { keyPath: 'id' });
          };
          request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['test'], 'readwrite');
            const store = transaction.objectStore('test');
            store.put({ id: 'cross_browser_test', data: data.indexedDB });
            transaction.oncomplete = () => resolve(true);
          };
        });
      }, testData);

      // Verify all data is accessible
      const retrievedData = await page.evaluate(() => {
        return new Promise((resolve) => {
          const result = {
            localStorage: localStorage.getItem('cross_browser_test_local'),
            sessionStorage: sessionStorage.getItem('cross_browser_test_session'),
            indexedDB: null,
          };

          const request = indexedDB.open('CrossBrowserTest', 1);
          request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['test'], 'readonly');
            const store = transaction.objectStore('test');
            const getRequest = store.get('cross_browser_test');
            getRequest.onsuccess = () => {
              result.indexedDB = getRequest.result ? getRequest.result.data : null;
              resolve(result);
            };
          };
        });
      });

      expect(retrievedData.localStorage).toBe(testData.localStorage);
      expect(retrievedData.sessionStorage).toBe(testData.sessionStorage);
      expect(retrievedData.indexedDB).toBe(testData.indexedDB);
    });
  });
});

test.describe('AI Response Caching', () => {
  test('should cache and retrieve AI responses', async ({ page }) => {
    await page.goto('/');

    // Mock AI API response
    await page.route('**/api/ai-agent/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          content: 'Cached AI response for testing',
          timestamp: new Date().toISOString(),
        }),
      });
    });

    // Trigger AI request
    await page.click('[data-testid="ai-assist-button"]');
    await page.fill('[data-testid="ai-prompt"]', 'Test AI request for caching');
    await page.click('[data-testid="send-ai-request"]');

    // Wait for response
    await page.waitForSelector('[data-testid="ai-response"]');

    // Verify response is cached
    const cacheData = await page.evaluate(() => {
      return sessionStorage.getItem('trpg_session_ai_cache:test_request');
    });

    expect(cacheData).toBeTruthy();

    // Make same request again - should use cache
    await page.fill('[data-testid="ai-prompt"]', 'Test AI request for caching');
    await page.click('[data-testid="send-ai-request"]');

    // Response should be immediate (from cache)
    await page.waitForSelector('[data-testid="ai-response"]');
    const responseText = await page.textContent('[data-testid="ai-response"]');
    expect(responseText).toContain('Cached AI response for testing');
  });
});

test.describe('Form Draft Recovery', () => {
  test('should recover unsaved form data after page refresh', async ({ page }) => {
    await page.goto('/characters');

    // Start creating character
    await page.getByRole('button', { name: /新しいキャラクター/ }).click();
    await page.fill('input[name="name"]', 'Draft Recovery Test');
    await page.fill('input[name="race"]', 'Elf');
    await page.fill('textarea[name="background"]', 'A character for testing draft recovery');

    // Wait for auto-save
    await page.waitForTimeout(3000);

    // Refresh page without saving
    await page.reload();

    // Should prompt for draft recovery
    await expect(page.locator('[data-testid="draft-recovery-prompt"]')).toBeVisible({ timeout: 5000 });

    // Accept recovery
    await page.click('[data-testid="recover-draft"]');

    // Verify form data is restored
    const nameValue = await page.inputValue('input[name="name"]');
    const raceValue = await page.inputValue('input[name="race"]');
    const backgroundValue = await page.inputValue('textarea[name="background"]');

    expect(nameValue).toBe('Draft Recovery Test');
    expect(raceValue).toBe('Elf');
    expect(backgroundValue).toBe('A character for testing draft recovery');
  });
});
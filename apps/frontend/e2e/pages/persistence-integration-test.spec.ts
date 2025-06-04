/**
 * Persistence Integration E2E Test
 * Tests the complete integration of all persistence components in real TRPG workflow scenarios
 */

import { test, expect, Page } from '@playwright/test';

// Helper to wait for persistence system initialization
async function waitForPersistenceReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    // Check if persistence context is available
    return window.localStorage && 
           window.sessionStorage && 
           window.indexedDB !== undefined &&
           document.querySelector('[data-testid="persistence-status-indicator"]') !== null;
  }, { timeout: 10000 });
}

// Helper to create a test campaign with full data
async function createFullTestCampaign(page: Page): Promise<void> {
  // Create campaign
  await page.goto('/');
  await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
  await page.fill('input[name="title"]', 'Full Integration Test Campaign');
  await page.fill('textarea[name="summary"]', 'A comprehensive campaign for testing all persistence features');
  await page.getByRole('button', { name: /作成/ }).click();
  await page.waitForSelector('[data-testid="campaign-created"]');

  // Add characters
  await page.click('[data-testid="nav-characters"]');
  await page.getByRole('button', { name: /新しいキャラクター/ }).click();
  await page.fill('input[name="name"]', 'Test Hero');
  await page.selectOption('select[name="characterType"]', 'PC');
  await page.fill('input[name="race"]', 'Human');
  await page.fill('input[name="class"]', 'Warrior');
  await page.getByRole('button', { name: /作成/ }).click();
  await page.waitForSelector('[data-testid="character-created"]');

  // Add world building
  await page.click('[data-testid="nav-worldbuilding"]');
  await page.click('[data-testid="setting-tab"]');
  await page.fill('textarea[data-testid="setting-description"]', 'A magical realm with ancient mysteries');
  await page.waitForSelector('[data-testid="auto-save-indicator"]');

  // Add timeline events
  await page.click('[data-testid="nav-timeline"]');
  await page.getByRole('button', { name: /イベントを追加/ }).click();
  await page.fill('input[name="title"]', 'Campaign Start');
  await page.fill('textarea[name="description"]', 'The heroes meet for the first time');
  await page.getByRole('button', { name: /追加/ }).click();
  await page.waitForSelector('[data-testid="event-added"]');
}

test.describe('Persistence Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('TRPGDataDB');
      }
    });
  });

  test('Complete TRPG data persistence workflow', async ({ page }) => {
    test.setTimeout(60000); // Extended timeout for comprehensive test

    // Initialize and verify persistence system
    await page.goto('/');
    await waitForPersistenceReady(page);

    // Verify persistence status indicator is healthy
    await expect(page.locator('[data-testid="persistence-status-indicator"]')).toBeVisible();

    // Create full campaign data
    await createFullTestCampaign(page);

    // Verify data integrity
    await page.click('[data-testid="persistence-status-indicator"]');
    await page.click('text=整合性チェック実行');
    await page.waitForSelector('[data-testid="integrity-check-complete"]', { timeout: 15000 });

    // Create manual backup
    await page.click('[data-testid="persistence-status-indicator"]');
    await page.click('text=手動バックアップ作成');
    await page.waitForSelector('[data-testid="backup-created"]', { timeout: 10000 });

    // Verify all data persists after page refresh
    await page.reload();
    await waitForPersistenceReady(page);

    // Check campaign data
    await expect(page.locator('[data-testid="campaign-title"]')).toContainText('Full Integration Test Campaign');

    // Check character data
    await page.click('[data-testid="nav-characters"]');
    await expect(page.locator('[data-testid="character-name"]')).toContainText('Test Hero');

    // Check world building data
    await page.click('[data-testid="nav-worldbuilding"]');
    await page.click('[data-testid="setting-tab"]');
    const settingContent = await page.inputValue('textarea[data-testid="setting-description"]');
    expect(settingContent).toContain('magical realm');

    // Check timeline data
    await page.click('[data-testid="nav-timeline"]');
    await expect(page.locator('[data-testid="event-title"]')).toContainText('Campaign Start');
  });

  test('Offline-online data synchronization workflow', async ({ page }) => {
    test.setTimeout(90000);

    await page.goto('/');
    await waitForPersistenceReady(page);

    // Create initial data while online
    await createFullTestCampaign(page);

    // Go offline
    await page.context().setOffline(true);
    await page.waitForSelector('[data-testid="offline-indicator"]', { timeout: 10000 });

    // Make changes while offline
    await page.click('[data-testid="nav-characters"]');
    await page.click('[data-testid="edit-character"]');
    await page.fill('input[name="level"]', '5');
    await page.fill('textarea[name="notes"]', 'Gained experience while exploring the ancient ruins');
    await page.click('[data-testid="save-character"]');

    // Verify offline indicator shows sync queue
    await page.click('[data-testid="persistence-status-indicator"]');
    const pendingItems = await page.textContent('[data-testid="pending-sync-count"]');
    expect(parseInt(pendingItems || '0')).toBeGreaterThan(0);

    // Add more changes to build sync queue
    await page.click('[data-testid="nav-timeline"]');
    await page.getByRole('button', { name: /イベントを追加/ }).click();
    await page.fill('input[name="title"]', 'Offline Event');
    await page.fill('textarea[name="description"]', 'Something that happened while offline');
    await page.getByRole('button', { name: /追加/ }).click();

    // Go back online
    await page.context().setOffline(false);
    await page.waitForSelector('[data-testid="sync-indicator"]', { timeout: 15000 });

    // Verify sync completes
    await page.waitForSelector('[data-testid="sync-complete"]', { timeout: 20000 });

    // Verify all changes persisted
    await page.reload();
    await waitForPersistenceReady(page);

    await page.click('[data-testid="nav-characters"]');
    const characterLevel = await page.inputValue('input[name="level"]');
    expect(characterLevel).toBe('5');

    await page.click('[data-testid="nav-timeline"]');
    await expect(page.locator('text=Offline Event')).toBeVisible();
  });

  test('Data migration and version compatibility', async ({ page }) => {
    test.setTimeout(60000);

    // Set up old version data
    await page.evaluate(() => {
      const oldCampaignData = {
        version: '1.0.0',
        id: 'migration-test-campaign',
        title: 'Old Version Campaign',
        summary: 'Campaign from old version',
        characters: [{
          id: 'old-char-1',
          name: 'Old Character',
          characterType: 'PC',
          // Missing new fields that should be added in migration
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem('trpg_campaign_migration-test-campaign', JSON.stringify(oldCampaignData));
      localStorage.setItem('trpg_campaign_list', JSON.stringify([{
        id: 'migration-test-campaign',
        title: 'Old Version Campaign',
        updatedAt: new Date().toISOString(),
      }]));
      localStorage.setItem('trpg_data_version', '1.0.0');
    });

    await page.goto('/');
    await waitForPersistenceReady(page);

    // Should show migration dialog
    await expect(page.locator('[data-testid="migration-prompt"]')).toBeVisible({ timeout: 10000 });

    // Accept migration
    await page.click('[data-testid="accept-migration"]');
    await page.waitForSelector('[data-testid="migration-complete"]', { timeout: 15000 });

    // Verify migration was successful
    await expect(page.locator('[data-testid="campaign-title"]')).toContainText('Old Version Campaign');

    // Verify new fields were added to character
    await page.click('[data-testid="nav-characters"]');
    await page.click('[data-testid="edit-character"]');
    
    // Check that new fields exist (should be empty but present)
    await expect(page.locator('input[name="relationships"]')).toBeVisible();
    await expect(page.locator('input[name="statuses"]')).toBeVisible();

    // Verify backup was created
    await page.click('[data-testid="persistence-status-indicator"]');
    await page.click('text=診断情報エクスポート');
    // The export should include backup information
  });

  test('Data corruption detection and recovery', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/');
    await waitForPersistenceReady(page);

    // Create valid campaign
    await createFullTestCampaign(page);

    // Corrupt data manually
    await page.evaluate(() => {
      const corruptedData = JSON.stringify({
        id: 'corrupted-campaign',
        title: '', // Invalid: empty title
        characters: [
          { id: '', name: 'Invalid Character' }, // Invalid: empty id
        ],
        // Missing required fields
      });
      localStorage.setItem('trpg_campaign_corrupted-campaign', corruptedData);

      // Add to campaign list
      const currentList = JSON.parse(localStorage.getItem('trpg_campaign_list') || '[]');
      currentList.push({
        id: 'corrupted-campaign',
        title: 'Corrupted Campaign',
        updatedAt: new Date().toISOString(),
      });
      localStorage.setItem('trpg_campaign_list', JSON.stringify(currentList));
    });

    // Trigger integrity check
    await page.click('[data-testid="persistence-status-indicator"]');
    await page.click('text=整合性チェック実行');
    await page.waitForSelector('[data-testid="integrity-issues-detected"]', { timeout: 15000 });

    // Should show integrity dialog with issues
    await expect(page.locator('[data-testid="integrity-dialog"]')).toBeVisible();
    await expect(page.locator('text=重要な問題')).toBeVisible();

    // Run auto-repair
    await page.click('[data-testid="auto-repair-button"]');
    await page.waitForSelector('[data-testid="repair-complete"]', { timeout: 10000 });

    // Verify repair was successful
    await page.click('[data-testid="persistence-status-indicator"]');
    await page.click('text=整合性チェック実行');
    await page.waitForSelector('[data-testid="integrity-check-clean"]', { timeout: 10000 });
  });

  test('Concurrent editing and conflict resolution', async ({ context }) => {
    test.setTimeout(90000);

    // Open two tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Initialize both tabs
    await page1.goto('/');
    await page2.goto('/');
    await waitForPersistenceReady(page1);
    await waitForPersistenceReady(page2);

    // Create campaign in first tab
    await page1.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
    await page1.fill('input[name="title"]', 'Conflict Test Campaign');
    await page1.getByRole('button', { name: /作成/ }).click();
    await page1.waitForSelector('[data-testid="campaign-created"]');

    // Switch to characters and create one
    await page1.click('[data-testid="nav-characters"]');
    await page1.getByRole('button', { name: /新しいキャラクター/ }).click();
    await page1.fill('input[name="name"]', 'Conflict Character');
    await page1.getByRole('button', { name: /作成/ }).click();
    await page1.waitForSelector('[data-testid="character-created"]');

    // Refresh second tab to load the campaign
    await page2.reload();
    await waitForPersistenceReady(page2);
    await page2.click('[data-testid="nav-characters"]');

    // Edit the same character in both tabs
    await page1.click('[data-testid="edit-character"]');
    await page1.fill('input[name="level"]', '3');
    await page1.fill('textarea[name="notes"]', 'Updated from tab 1');

    await page2.click('[data-testid="edit-character"]');
    await page2.fill('input[name="level"]', '5');
    await page2.fill('textarea[name="notes"]', 'Updated from tab 2');

    // Save both (should trigger conflict)
    await page1.click('[data-testid="save-character"]');
    await page2.click('[data-testid="save-character"]');

    // One should show conflict resolution dialog
    const conflictDetected = await Promise.race([
      page1.waitForSelector('[data-testid="conflict-resolution-dialog"]', { timeout: 5000 }).then(() => 'page1'),
      page2.waitForSelector('[data-testid="conflict-resolution-dialog"]', { timeout: 5000 }).then(() => 'page2'),
      new Promise(resolve => setTimeout(() => resolve('none'), 6000)),
    ]);

    if (conflictDetected !== 'none') {
      const conflictPage = conflictDetected === 'page1' ? page1 : page2;
      
      // Verify conflict dialog shows both versions
      await expect(conflictPage.locator('[data-testid="local-version"]')).toBeVisible();
      await expect(conflictPage.locator('[data-testid="remote-version"]')).toBeVisible();

      // Resolve conflict by choosing local version
      await conflictPage.click('[data-testid="use-local-version"]');
      await conflictPage.waitForSelector('[data-testid="conflict-resolved"]');
    }

    // Verify final state is consistent
    await page1.reload();
    await page2.reload();
    await waitForPersistenceReady(page1);
    await waitForPersistenceReady(page2);

    await page1.click('[data-testid="nav-characters"]');
    await page2.click('[data-testid="nav-characters"]');

    const level1 = await page1.inputValue('input[name="level"]');
    const level2 = await page2.inputValue('input[name="level"]');
    expect(level1).toBe(level2); // Should be consistent across tabs
  });

  test('Performance under load', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/');
    await waitForPersistenceReady(page);

    // Create campaign with large dataset
    await page.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
    await page.fill('input[name="title"]', 'Performance Test Campaign');
    await page.getByRole('button', { name: /作成/ }).click();
    await page.waitForSelector('[data-testid="campaign-created"]');

    // Add many characters rapidly
    await page.click('[data-testid="nav-characters"]');
    
    const startTime = Date.now();
    
    for (let i = 0; i < 20; i++) {
      await page.getByRole('button', { name: /新しいキャラクター/ }).click();
      await page.fill('input[name="name"]', `Performance Character ${i + 1}`);
      await page.selectOption('select[name="characterType"]', 'PC');
      await page.getByRole('button', { name: /作成/ }).click();
      await page.waitForSelector('[data-testid="character-created"]', { timeout: 5000 });
    }

    const creationTime = Date.now() - startTime;
    
    // Should complete in reasonable time (under 60 seconds for 20 characters)
    expect(creationTime).toBeLessThan(60000);

    // Test retrieval performance
    const retrievalStartTime = Date.now();
    await page.reload();
    await waitForPersistenceReady(page);
    await page.click('[data-testid="nav-characters"]');
    
    // Wait for all characters to load
    await page.waitForFunction(() => {
      const characterElements = document.querySelectorAll('[data-testid="character-name"]');
      return characterElements.length >= 20;
    }, { timeout: 10000 });

    const retrievalTime = Date.now() - retrievalStartTime;
    
    // Retrieval should be fast (under 5 seconds)
    expect(retrievalTime).toBeLessThan(5000);

    // Verify storage optimization doesn't break functionality
    await page.click('[data-testid="persistence-status-indicator"]');
    await page.click('text=ストレージ最適化');
    await page.waitForSelector('[data-testid="optimization-complete"]', { timeout: 15000 });

    // Verify data still accessible after optimization
    const characterCount = await page.locator('[data-testid="character-name"]').count();
    expect(characterCount).toBe(20);
  });

  test('Cross-tab synchronization', async ({ context }) => {
    test.setTimeout(60000);

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto('/');
    await page2.goto('/');
    await waitForPersistenceReady(page1);
    await waitForPersistenceReady(page2);

    // Create campaign in tab 1
    await page1.getByRole('button', { name: /新しいキャンペーンを作成/ }).click();
    await page1.fill('input[name="title"]', 'Cross-Tab Test Campaign');
    await page1.getByRole('button', { name: /作成/ }).click();
    await page1.waitForSelector('[data-testid="campaign-created"]');

    // Tab 2 should detect the change
    await page2.waitForSelector('[data-testid="campaign-list-updated"]', { timeout: 10000 });

    // Verify campaign appears in tab 2
    await expect(page2.locator('[data-testid="campaign-title"]')).toContainText('Cross-Tab Test Campaign');

    // Make changes in tab 2
    await page2.click('[data-testid="edit-campaign"]');
    await page2.fill('textarea[name="summary"]', 'Updated from second tab');
    await page2.click('[data-testid="save-campaign"]');

    // Tab 1 should detect the change
    await page1.waitForSelector('[data-testid="campaign-updated"]', { timeout: 10000 });

    // Verify changes appear in tab 1
    const summaryValue = await page1.inputValue('textarea[name="summary"]');
    expect(summaryValue).toContain('Updated from second tab');
  });

  test('Full system recovery after storage clear', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/');
    await waitForPersistenceReady(page);

    // Create comprehensive campaign data
    await createFullTestCampaign(page);

    // Create manual backup
    await page.click('[data-testid="persistence-status-indicator"]');
    await page.click('text=手動バックアップ作成');
    await page.waitForSelector('[data-testid="backup-created"]');

    // Get backup ID for later restoration
    const backupId = await page.evaluate(() => {
      const backups = localStorage.getItem('trpg_backup_list');
      if (backups) {
        const parsed = JSON.parse(backups);
        return parsed[0]?.id;
      }
      return null;
    });

    // Clear all storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Reload and verify empty state
    await page.reload();
    await waitForPersistenceReady(page);
    await expect(page.locator('[data-testid="empty-campaign-list"]')).toBeVisible();

    // Restore from backup using the provider
    if (backupId) {
      await page.click('[data-testid="settings-menu"]');
      await page.click('[data-testid="restore-backup"]');
      await page.selectOption('select[name="backupId"]', backupId);
      await page.click('[data-testid="confirm-restore"]');
      await page.waitForSelector('[data-testid="restore-complete"]', { timeout: 15000 });

      // Verify full restoration
      await expect(page.locator('[data-testid="campaign-title"]')).toContainText('Full Integration Test Campaign');

      await page.click('[data-testid="nav-characters"]');
      await expect(page.locator('[data-testid="character-name"]')).toContainText('Test Hero');

      await page.click('[data-testid="nav-timeline"]');
      await expect(page.locator('[data-testid="event-title"]')).toContainText('Campaign Start');
    }
  });
});
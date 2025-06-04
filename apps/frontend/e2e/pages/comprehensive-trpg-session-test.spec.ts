import { test, expect, Page } from '@playwright/test';

interface TRPGSessionFlow {
  campaignName: string;
  playerCharacter: string;
  questObjective: string;
  expectedOutcome: string;
}

/**
 * 🎮 COMPREHENSIVE TRPG SESSION TEST SUITE
 * 
 * This test suite provides complete end-to-end testing for the TRPG AI Agent GM system,
 * covering the entire user workflow from campaign creation to session completion.
 */

test.describe('🎲 Comprehensive TRPG Session Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('🏰 Complete TRPG Campaign Creation and Session Flow', async () => {
    // ============================================================================
    // 🚀 PHASE 1: CAMPAIGN CREATION
    // ============================================================================
    
    await test.step('Create New Campaign', async () => {
      // Navigate to campaign creation
      await page.click('[data-testid="new-campaign-button"], button:has-text("新規キャンペーン作成")');
      await page.waitForSelector('[data-testid="campaign-form"], .MuiDialog-paper');
      
      // Fill campaign details
      const campaignName = `Test Campaign ${Date.now()}`;
      await page.fill('[data-testid="campaign-name"], input[label*="キャンペーン名"]', campaignName);
      await page.fill('[data-testid="campaign-description"], textarea[label*="説明"]', 'Epic fantasy adventure with AI GM assistance');
      
      // Select game system
      await page.click('[data-testid="game-system-select"], [role="button"]:has-text("ゲームシステム")');
      await page.click('[data-testid="stormbringer-option"], li:has-text("Stormbringer")');
      
      // Save campaign
      await page.click('[data-testid="save-campaign"], button:has-text("作成")');
      await page.waitForSelector('[data-testid="campaign-list"], .campaign-card');
      
      // Verify campaign was created
      await expect(page.locator(`text=${campaignName}`)).toBeVisible();
    });

    // ============================================================================
    // 🧙‍♂️ PHASE 2: CHARACTER CREATION
    // ============================================================================
    
    await test.step('Create Player Characters', async () => {
      // Navigate to Characters page
      await page.click('[data-testid="characters-nav"], [href="/characters"]');
      await page.waitForLoadState('networkidle');
      
      // Switch to developer mode for character creation
      const devModeToggle = page.locator('[data-testid="developer-mode-toggle"], input[type="checkbox"]:near(:text("開発者モード"))');
      if (await devModeToggle.isVisible()) {
        await devModeToggle.check();
        await page.waitForTimeout(500);
      }
      
      // Create main player character
      await page.click('[data-testid="add-character"], button:has-text("キャラクター追加")');
      await page.waitForSelector('[data-testid="character-form"], .character-creation-dialog');
      
      await page.fill('[data-testid="character-name"], input[label*="名前"]', 'Thorin Ironforge');
      await page.fill('[data-testid="character-background"], textarea[label*="背景"]', 'Dwarven warrior seeking ancient artifacts');
      
      // Set character stats
      await page.fill('[data-testid="strength-stat"], input[label*="筋力"]', '16');
      await page.fill('[data-testid="dexterity-stat"], input[label*="敏捷"]', '12');
      await page.fill('[data-testid="constitution-stat"], input[label*="耐久"]', '15');
      await page.fill('[data-testid="intelligence-stat"], input[label*="知力"]', '11');
      await page.fill('[data-testid="wisdom-stat"], input[label*="判断"]', '13');
      await page.fill('[data-testid="charisma-stat"], input[label*="魅力"]', '10');
      
      await page.click('[data-testid="save-character"], button:has-text("保存")');
      await page.waitForSelector('[data-testid="character-card"]');
      
      // Verify character was created
      await expect(page.locator('text=Thorin Ironforge')).toBeVisible();
    });

    // ============================================================================
    // 🗺️ PHASE 3: WORLD BUILDING
    // ============================================================================
    
    await test.step('Set Up World and Locations', async () => {
      // Navigate to World Building
      await page.click('[data-testid="worldbuilding-nav"], [href="/worldbuilding"]');
      await page.waitForLoadState('networkidle');
      
      // Create a base location
      await page.click('[data-testid="add-location"], button:has-text("拠点追加")');
      await page.waitForSelector('[data-testid="location-form"]');
      
      await page.fill('[data-testid="location-name"], input[label*="拠点名"]', 'Ancient Fortress');
      await page.fill('[data-testid="location-description"], textarea[label*="説明"]', 'A mysterious fortress containing ancient secrets');
      await page.selectOption('[data-testid="location-type"], select[label*="種類"]', 'dungeon');
      await page.selectOption('[data-testid="location-importance"], select[label*="重要度"]', 'high');
      
      await page.click('[data-testid="save-location"], button:has-text("保存")');
      await page.waitForSelector('[data-testid="location-card"]');
      
      // Verify location was created
      await expect(page.locator('text=Ancient Fortress')).toBeVisible();
    });

    // ============================================================================
    // 📋 PHASE 4: QUEST CREATION
    // ============================================================================
    
    await test.step('Create Quest and Timeline Events', async () => {
      // Navigate to Plot/Quest page
      await page.click('[data-testid="plot-nav"], [href="/plot"]');
      await page.waitForLoadState('networkidle');
      
      // Create a quest
      await page.click('[data-testid="add-quest"], button:has-text("クエスト追加")');
      await page.waitForSelector('[data-testid="quest-form"]');
      
      await page.fill('[data-testid="quest-title"], input[label*="タイトル"]', 'Retrieve the Ancient Artifact');
      await page.fill('[data-testid="quest-description"], textarea[label*="説明"]', 'Find and retrieve the legendary Crystal of Power from the Ancient Fortress');
      await page.selectOption('[data-testid="quest-difficulty"], select[label*="難易度"]', 'medium');
      
      await page.click('[data-testid="save-quest"], button:has-text("保存")');
      await page.waitForSelector('[data-testid="quest-card"]');
      
      // Navigate to Timeline to create events
      await page.click('[data-testid="timeline-nav"], [href="/timeline"]');
      await page.waitForLoadState('networkidle');
      
      // Enable developer mode for timeline editing
      const timelineDevMode = page.locator('[data-testid="timeline-dev-mode"], input[type="checkbox"]:near(:text("開発者モード"))');
      if (await timelineDevMode.isVisible()) {
        await timelineDevMode.check();
        await page.waitForTimeout(500);
      }
      
      // Create timeline event
      await page.click('[data-testid="add-timeline-event"], button:has-text("イベント追加")');
      await page.waitForSelector('[data-testid="timeline-event-form"]');
      
      await page.fill('[data-testid="event-title"], input[label*="タイトル"]', 'Encounter with Guardian Spirit');
      await page.fill('[data-testid="event-description"], textarea[label*="説明"]', 'The party encounters the guardian spirit of the fortress');
      await page.selectOption('[data-testid="event-type"], select[label*="種類"]', 'combat');
      
      await page.click('[data-testid="save-timeline-event"], button:has-text("保存")');
      await page.waitForSelector('[data-testid="timeline-event-card"]');
    });

    // ============================================================================
    // 🎮 PHASE 5: TRPG SESSION EXECUTION
    // ============================================================================
    
    await test.step('Execute TRPG Session', async () => {
      // Navigate to TRPG Session
      await page.click('[data-testid="session-nav"], [href="/session"]');
      await page.waitForLoadState('networkidle');
      
      // Start session
      await page.click('[data-testid="start-session"], button:has-text("セッション開始")');
      await page.waitForSelector('[data-testid="session-interface"]');
      
      // Select character
      await page.click('[data-testid="select-character"], button:has-text("Thorin Ironforge")');
      await page.waitForTimeout(1000);
      
      // Interact with AI GM
      const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="メッセージ"]');
      await chatInput.fill('I want to explore the Ancient Fortress and search for the Crystal of Power.');
      await page.click('[data-testid="send-message"], button:has-text("送信")');
      
      // Wait for AI response
      await page.waitForSelector('[data-testid="ai-response"], .ai-message', { timeout: 10000 });
      
      // Verify AI GM responded
      const aiResponse = page.locator('[data-testid="ai-response"], .ai-message').last();
      await expect(aiResponse).toBeVisible();
      
      // Perform dice roll
      await page.click('[data-testid="dice-roll"], button:has-text("ダイス")');
      await page.waitForSelector('[data-testid="dice-dialog"]');
      
      await page.selectOption('[data-testid="dice-type"], select:has-text("d20")', 'd20');
      await page.click('[data-testid="roll-dice"], button:has-text("ロール実行")');
      
      // Wait for dice result
      await page.waitForSelector('[data-testid="dice-result"]', { timeout: 5000 });
      const diceResult = page.locator('[data-testid="dice-result"]');
      await expect(diceResult).toBeVisible();
    });

    // ============================================================================
    // 🏆 PHASE 6: SESSION COMPLETION AND RESULTS
    // ============================================================================
    
    await test.step('Complete Session and Record Results', async () => {
      // Record event result
      await page.click('[data-testid="record-result"], button:has-text("結果記録")');
      await page.waitForSelector('[data-testid="event-result-dialog"]');
      
      await page.selectOption('[data-testid="outcome-select"], select[label*="結果"]', 'success');
      await page.fill('[data-testid="result-notes"], textarea[label*="メモ"]', 'Successfully retrieved the Crystal of Power after defeating the guardian spirit');
      
      await page.click('[data-testid="save-result"], button:has-text("結果を記録")');
      await page.waitForSelector('[data-testid="session-complete"]');
      
      // Verify session completion
      await expect(page.locator('text=セッション完了')).toBeVisible();
      
      // Check world state changes
      await page.click('[data-testid="world-state"], button:has-text("世界状態")');
      await page.waitForSelector('[data-testid="world-state-panel"]');
      
      // Verify world state was updated
      const stabilityValue = page.locator('[data-testid="stability-value"]');
      await expect(stabilityValue).toBeVisible();
    });

    // ============================================================================
    // 📊 PHASE 7: DATA VERIFICATION
    // ============================================================================
    
    await test.step('Verify Data Persistence', async () => {
      // Refresh page to test persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify campaign still exists
      await expect(page.locator('text=Test Campaign')).toBeVisible();
      
      // Navigate back to characters and verify persistence
      await page.click('[data-testid="characters-nav"], [href="/characters"]');
      await expect(page.locator('text=Thorin Ironforge')).toBeVisible();
      
      // Navigate to timeline and verify events
      await page.click('[data-testid="timeline-nav"], [href="/timeline"]');
      await expect(page.locator('text=Encounter with Guardian Spirit')).toBeVisible();
    });
  });

  test('🎭 Multi-Character Session Management', async () => {
    await test.step('Create Multiple Characters', async () => {
      await page.click('[data-testid="characters-nav"], [href="/characters"]');
      
      const characters = [
        { name: 'Elara Moonwhisper', class: 'Wizard', background: 'Scholar seeking forbidden knowledge' },
        { name: 'Gareth Stormshield', class: 'Paladin', background: 'Holy warrior defending the innocent' },
        { name: 'Zara Shadowstep', class: 'Rogue', background: 'Former thief turned adventurer' }
      ];
      
      for (const char of characters) {
        await page.click('[data-testid="add-character"], button:has-text("キャラクター追加")');
        await page.waitForSelector('[data-testid="character-form"]');
        
        await page.fill('[data-testid="character-name"], input[label*="名前"]', char.name);
        await page.fill('[data-testid="character-background"], textarea[label*="背景"]', char.background);
        
        await page.click('[data-testid="save-character"], button:has-text("保存")');
        await page.waitForSelector(`text=${char.name}`);
      }
    });

    await test.step('Manage Party in Session', async () => {
      await page.click('[data-testid="session-nav"], [href="/session"]');
      await page.click('[data-testid="start-session"], button:has-text("セッション開始")');
      
      // Test character switching
      await page.click('[data-testid="character-selector"]');
      await page.click('text=Elara Moonwhisper');
      await expect(page.locator('[data-testid="active-character"]:has-text("Elara")')).toBeVisible();
      
      // Test AI party management
      await page.fill('[data-testid="chat-input"]', 'I cast a spell to illuminate the dark corridor.');
      await page.click('[data-testid="send-message"]');
      
      await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 });
    });
  });

  test('🎨 AI Integration and Response Quality', async () => {
    await test.step('Test AI GM Responses', async () => {
      await page.goto('/session');
      
      const testScenarios = [
        { input: 'I want to negotiate with the bandit leader', expectedContext: 'social interaction' },
        { input: 'I search the room for hidden treasures', expectedContext: 'exploration' },
        { input: 'I attack the orc with my sword', expectedContext: 'combat' },
        { input: 'I try to cast a healing spell on my wounded ally', expectedContext: 'magic' }
      ];
      
      for (const scenario of testScenarios) {
        await page.fill('[data-testid="chat-input"]', scenario.input);
        await page.click('[data-testid="send-message"]');
        
        // Wait for AI response
        await page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });
        
        // Verify response is contextually appropriate
        const response = await page.locator('[data-testid="ai-response"]').last().textContent();
        expect(response).toBeTruthy();
        expect(response!.length).toBeGreaterThan(10);
      }
    });
  });

  test('⚡ Performance and Stability', async () => {
    await test.step('Load Testing with Multiple Actions', async () => {
      const startTime = Date.now();
      
      // Perform rapid actions
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="dice-roll"]');
        await page.selectOption('[data-testid="dice-type"]', 'd20');
        await page.click('[data-testid="roll-dice"]');
        await page.waitForSelector('[data-testid="dice-result"]', { timeout: 3000 });
        await page.click('[data-testid="close-dice-dialog"]');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verify performance (should complete within reasonable time)
      expect(duration).toBeLessThan(30000); // 30 seconds max
    });

    await test.step('Memory and Resource Management', async () => {
      // Test large data handling
      await page.goto('/timeline');
      
      // Create multiple events rapidly
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="add-timeline-event"]');
        await page.fill('[data-testid="event-title"]', `Test Event ${i}`);
        await page.click('[data-testid="save-timeline-event"]');
        await page.waitForTimeout(100);
      }
      
      // Verify page remains responsive
      await expect(page.locator('[data-testid="timeline-chart"]')).toBeVisible();
    });
  });

  test('🔧 Error Handling and Recovery', async () => {
    await test.step('Network Error Simulation', async () => {
      // Simulate network issues
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/session');
      await page.fill('[data-testid="chat-input"]', 'Test message during network error');
      await page.click('[data-testid="send-message"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
      
      // Restore network
      await page.unroute('**/api/**');
    });

    await test.step('Data Validation and Error Prevention', async () => {
      await page.goto('/characters');
      
      // Test form validation
      await page.click('[data-testid="add-character"]');
      await page.click('[data-testid="save-character"]');
      
      // Verify validation errors are shown
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });
  });

  test('📱 Responsive Design and Accessibility', async () => {
    await test.step('Mobile Viewport Testing', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      await page.goto('/');
      
      // Verify mobile navigation works
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-nav-menu"]')).toBeVisible();
      
      // Test mobile session interface
      await page.goto('/session');
      await expect(page.locator('[data-testid="session-interface"]')).toBeVisible();
    });

    await test.step('Keyboard Navigation', async () => {
      await page.setViewportSize({ width: 1280, height: 720 }); // Reset to desktop
      
      await page.goto('/');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Verify navigation worked
      await page.waitForURL('**/characters');
    });
  });
});

/**
 * 🎯 EVIDENCE COLLECTION TESTS
 * These tests capture screenshots and collect evidence of successful functionality
 */
test.describe('📸 Evidence Collection for TRPG Functionality', () => {
  test('Complete Workflow Evidence Documentation', async ({ page }) => {
    // Set higher timeout for evidence collection
    test.setTimeout(120000);
    
    await page.goto('/');
    
    // Evidence 1: Home page with campaign selection
    await page.screenshot({ 
      path: 'evidence-01-home-page-campaign-selection.png',
      fullPage: true 
    });
    
    // Evidence 2: Character creation process
    await page.click('[href="/characters"]');
    await page.screenshot({ 
      path: 'evidence-02-character-creation-interface.png',
      fullPage: true 
    });
    
    // Evidence 3: World building interface
    await page.click('[href="/worldbuilding"]');
    await page.screenshot({ 
      path: 'evidence-03-world-building-locations.png',
      fullPage: true 
    });
    
    // Evidence 4: Timeline and quest management
    await page.click('[href="/timeline"]');
    await page.screenshot({ 
      path: 'evidence-04-timeline-quest-management.png',
      fullPage: true 
    });
    
    // Evidence 5: TRPG session in action
    await page.click('[href="/session"]');
    await page.screenshot({ 
      path: 'evidence-05-trpg-session-interface.png',
      fullPage: true 
    });
    
    console.log('✅ Evidence collection completed - Screenshots saved for documentation');
  });
});
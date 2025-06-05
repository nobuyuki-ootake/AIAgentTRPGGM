import { test, expect } from '@playwright/test';

test.describe('Comprehensive TRPG Session Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('Navigation & Initial Setup', async ({ page }) => {
    // Take initial screenshot
    await page.screenshot({ path: 'trpg-test-01-initial-page.png', fullPage: true });
    
    // Look for TRPG Session navigation
    const trpgSessionLink = await page.locator('text=TRPGセッション').or(page.locator('text=TRPG Session')).or(page.locator('[href*="trpg-session"]')).first();
    
    if (await trpgSessionLink.count() === 0) {
      // Check if we can find it in a menu or sidebar
      const menuButton = await page.locator('[aria-label*="menu"]').or(page.locator('button:has-text("Menu")')).first();
      if (await menuButton.count() > 0) {
        await menuButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'trpg-test-02-menu-opened.png', fullPage: true });
      }
      
      // Try to find TRPG Session link again
      const trpgSessionLinkInMenu = await page.locator('text=TRPGセッション').or(page.locator('text=TRPG Session')).first();
      if (await trpgSessionLinkInMenu.count() > 0) {
        await trpgSessionLinkInMenu.click();
      } else {
        // Navigate directly to the TRPG session page
        await page.goto('http://localhost:5174/trpg-session');
      }
    } else {
      await trpgSessionLink.click();
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'trpg-test-03-trpg-session-page.png', fullPage: true });
    
    // Verify we're on the TRPG Session page
    await expect(page).toHaveURL(/.*trpg-session.*/);
  });

  test('Character Management Testing', async ({ page }) => {
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // Look for character display elements
    const characterSection = await page.locator('[data-testid="character-display"]').or(page.locator('text=キャラクター').locator('..')).first();
    await page.screenshot({ path: 'trpg-test-04-character-section.png', fullPage: true });
    
    // Try to add/select characters
    const addCharacterButton = await page.locator('button:has-text("キャラクター追加")').or(page.locator('button:has-text("Add Character")')).first();
    if (await addCharacterButton.count() > 0) {
      await addCharacterButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'trpg-test-05-add-character-dialog.png', fullPage: true });
      
      // Close dialog if opened
      const closeButton = await page.locator('button:has-text("キャンセル")').or(page.locator('button:has-text("Cancel")')).first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
      }
    }
    
    // Check for existing characters
    const characterCards = await page.locator('[data-testid="character-card"]').or(page.locator('.character-card')).all();
    console.log(`Found ${characterCards.length} character cards`);
    
    await page.screenshot({ path: 'trpg-test-06-character-management.png', fullPage: true });
  });

  test('Dice Rolling System Testing', async ({ page }) => {
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // Look for dice rolling interface
    const diceSection = await page.locator('[data-testid="dice-ui"]').or(page.locator('text=ダイス').locator('..')).first();
    await page.screenshot({ path: 'trpg-test-07-dice-section.png', fullPage: true });
    
    // Test basic dice types
    const diceTypes = ['d20', 'd6', 'd4', 'd8', 'd10', 'd12'];
    for (const diceType of diceTypes) {
      const diceButton = await page.locator(`button:has-text("${diceType.toUpperCase()}")`).or(page.locator(`[data-dice="${diceType}"]`)).first();
      if (await diceButton.count() > 0) {
        await diceButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `trpg-test-08-dice-${diceType}-rolled.png`, fullPage: true });
      }
    }
    
    // Test custom dice if available
    const customDiceInput = await page.locator('input[placeholder*="dice"]').or(page.locator('input[placeholder*="ダイス"]')).first();
    if (await customDiceInput.count() > 0) {
      await customDiceInput.fill('3d6+2');
      const rollButton = await page.locator('button:has-text("Roll")').or(page.locator('button:has-text("振る")')).first();
      if (await rollButton.count() > 0) {
        await rollButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'trpg-test-09-custom-dice-rolled.png', fullPage: true });
      }
    }
  });

  test('Chat Interface Testing', async ({ page }) => {
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // Look for chat interface
    const chatSection = await page.locator('[data-testid="chat-interface"]').or(page.locator('text=チャット').locator('..')).first();
    await page.screenshot({ path: 'trpg-test-10-chat-interface.png', fullPage: true });
    
    // Try to send a message
    const chatInput = await page.locator('textarea[placeholder*="message"]').or(page.locator('textarea[placeholder*="メッセージ"]')).or(page.locator('input[type="text"]')).first();
    if (await chatInput.count() > 0) {
      await chatInput.fill('テストメッセージです。Hello from test!');
      await page.screenshot({ path: 'trpg-test-11-chat-input-filled.png', fullPage: true });
      
      const sendButton = await page.locator('button:has-text("Send")').or(page.locator('button:has-text("送信")')).first();
      if (await sendButton.count() > 0) {
        await sendButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'trpg-test-12-message-sent.png', fullPage: true });
      }
    }
    
    // Test AI assistant integration if available
    const aiAssistButton = await page.locator('button:has-text("AI")').or(page.locator('[data-testid="ai-assist"]')).first();
    if (await aiAssistButton.count() > 0) {
      await aiAssistButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'trpg-test-13-ai-assist-opened.png', fullPage: true });
    }
  });

  test('Skill Check & Power Check Testing', async ({ page }) => {
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // Look for skill check interface
    const skillCheckButton = await page.locator('button:has-text("スキルチェック")').or(page.locator('button:has-text("Skill Check")')).first();
    if (await skillCheckButton.count() > 0) {
      await skillCheckButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'trpg-test-14-skill-check-dialog.png', fullPage: true });
      
      // Try to perform a skill check
      const skillSelect = await page.locator('select').or(page.locator('[role="combobox"]')).first();
      if (await skillSelect.count() > 0) {
        await skillSelect.click();
        await page.waitForTimeout(500);
        
        // Select first available skill
        const firstSkill = await page.locator('option').or(page.locator('[role="option"]')).first();
        if (await firstSkill.count() > 0) {
          await firstSkill.click();
        }
      }
      
      const performCheckButton = await page.locator('button:has-text("チェック実行")').or(page.locator('button:has-text("Perform Check")')).first();
      if (await performCheckButton.count() > 0) {
        await performCheckButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'trpg-test-15-skill-check-result.png', fullPage: true });
      }
    }
    
    // Test power check
    const powerCheckButton = await page.locator('button:has-text("パワーチェック")').or(page.locator('button:has-text("Power Check")')).first();
    if (await powerCheckButton.count() > 0) {
      await powerCheckButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'trpg-test-16-power-check-dialog.png', fullPage: true });
    }
  });

  test('Session State Management', async ({ page }) => {
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // Test session save/load functionality
    const saveButton = await page.locator('button:has-text("保存")').or(page.locator('button:has-text("Save")')).first();
    if (await saveButton.count() > 0) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'trpg-test-17-session-save.png', fullPage: true });
    }
    
    // Check for session state indicators
    const sessionStatus = await page.locator('[data-testid="session-status"]').or(page.locator('text=セッション状態')).first();
    if (await sessionStatus.count() > 0) {
      await page.screenshot({ path: 'trpg-test-18-session-status.png', fullPage: true });
    }
    
    // Test real-time updates (check for auto-save indicators)
    const autoSaveIndicator = await page.locator('text=自動保存').or(page.locator('text=Auto-save')).first();
    if (await autoSaveIndicator.count() > 0) {
      await page.screenshot({ path: 'trpg-test-19-auto-save.png', fullPage: true });
    }
  });

  test('Interactive Elements & UI Testing', async ({ page }) => {
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // Test all clickable elements
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons on the page`);
    
    // Take comprehensive screenshots
    await page.screenshot({ path: 'trpg-test-20-full-interface.png', fullPage: true });
    
    // Test tabs if available
    const tabs = await page.locator('[role="tab"]').all();
    for (let i = 0; i < Math.min(tabs.length, 5); i++) {
      await tabs[i].click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `trpg-test-21-tab-${i}.png`, fullPage: true });
    }
    
    // Test responsive behavior
    await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
    await page.screenshot({ path: 'trpg-test-22-tablet-view.png', fullPage: true });
    
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.screenshot({ path: 'trpg-test-23-mobile-view.png', fullPage: true });
    
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.screenshot({ path: 'trpg-test-24-desktop-view.png', fullPage: true });
  });

  test('Error Handling & Edge Cases', async ({ page }) => {
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // Test with invalid inputs
    const inputs = await page.locator('input[type="text"], input[type="number"], textarea').all();
    for (const input of inputs.slice(0, 3)) { // Test first 3 inputs
      await input.fill('');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ path: 'trpg-test-25-error-handling.png', fullPage: true });
    
    // Test page without internet (simulate offline)
    await page.context().setOffline(true);
    await page.reload();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'trpg-test-26-offline-behavior.png', fullPage: true });
    
    await page.context().setOffline(false);
  });

  test('Japanese Language Support', async ({ page }) => {
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForLoadState('networkidle');
    
    // Check for Japanese text elements
    const japaneseText = await page.locator('text=/[ひらがなカタカナ漢字]/').$all();
    console.log(`Found ${japaneseText.length} Japanese text elements`);
    
    // Test Japanese input
    const textInputs = await page.locator('input[type="text"], textarea').all();
    if (textInputs.length > 0) {
      await textInputs[0].fill('これは日本語のテストです。ダイスを振ります。');
      await page.screenshot({ path: 'trpg-test-27-japanese-input.png', fullPage: true });
    }
  });

  test('Performance & Loading Tests', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:5174/trpg-session');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // Check for loading states
    await page.reload();
    const loadingIndicator = await page.locator('text=Loading').or(page.locator('text=読み込み中')).first();
    if (await loadingIndicator.count() > 0) {
      await page.screenshot({ path: 'trpg-test-28-loading-state.png', fullPage: true });
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'trpg-test-29-final-loaded-state.png', fullPage: true });
  });
});
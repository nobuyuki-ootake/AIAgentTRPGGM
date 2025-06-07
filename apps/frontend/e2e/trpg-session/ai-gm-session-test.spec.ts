import { test, expect } from '@playwright/test';

test.describe('AI Game Master Session Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to TRPG session page
    await page.goto('http://localhost:5173/trpg-session');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full AI GM session flow', async ({ page }) => {
    // Step 1: Verify initial state
    await page.waitForLoadState('networkidle');
    
    // Check that the session header is visible
    await expect(page.getByRole('heading', { name: /TRPGセッション/i })).toBeVisible();
    
    // Step 2: Select a character
    const characterCard = page.locator('[data-testid="character-card"]').first();
    await characterCard.click();
    await page.waitForTimeout(500);
    
    // Verify character is selected
    await expect(page.locator('text=操作:')).toBeVisible();
    
    // Step 3: Start AI session
    const startButton = page.getByTestId('start-ai-session-button');
    await expect(startButton).toBeEnabled();
    await startButton.click();
    
    // Wait for AI session to start
    await page.waitForTimeout(2000);
    
    // Verify session started message
    await expect(page.locator('text=AIセッション開始！')).toBeVisible();
    
    // Step 4: Wait for AI GM initial message
    await page.waitForSelector('text=セッション開始アナウンス', { timeout: 10000 });
    
    // Step 5: Check for action selection prompt
    await expect(page.locator('text=チャット形式で行動を連絡、もしくはボタンで行動を選択してください')).toBeVisible({ timeout: 15000 });
    
    // Step 6: Test chat input action
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('街の中を探索する');
    await page.keyboard.press('Enter');
    
    // Wait for player action to be processed
    await page.waitForTimeout(1000);
    
    // Verify player action was recorded
    await expect(page.locator('text=🎯').first()).toBeVisible();
    
    // Step 7: Wait for other characters' actions
    await expect(page.locator('text=AI操作キャラクター')).toBeVisible({ timeout: 10000 });
    
    // Step 8: Wait for turn completion and summary
    await expect(page.locator('text=ターン 1 完了')).toBeVisible({ timeout: 15000 });
    
    // Take screenshot of completed turn
    await page.screenshot({ path: 'ai-gm-session-completed-turn.png', fullPage: true });
  });

  test('should handle action button selection', async ({ page }) => {
    // Select character and start session
    await page.locator('[data-testid="character-card"]').first().click();
    await page.waitForTimeout(500);
    await page.getByTestId('start-ai-session-button').click();
    
    // Wait for action buttons to appear
    await page.waitForSelector('[data-testid="action-button"]', { timeout: 20000 });
    
    // Click first action button
    const actionButton = page.locator('[data-testid="action-button"]').first();
    await expect(actionButton).toBeVisible();
    await actionButton.click();
    
    // Verify action was executed
    await page.waitForTimeout(1000);
    await expect(page.locator('text=の行動:').first()).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'ai-gm-action-button-selected.png', fullPage: true });
  });

  test('should display character-specific action choices', async ({ page }) => {
    // Select character and start session
    await page.locator('[data-testid="character-card"]').first().click();
    await page.waitForTimeout(500);
    await page.getByTestId('start-ai-session-button').click();
    
    // Wait for character action announcements
    await page.waitForSelector('text=の行動選択肢】', { timeout: 20000 });
    
    // Verify each character has action choices displayed
    const actionAnnouncements = page.locator('text=の行動選択肢】');
    const count = await actionAnnouncements.count();
    expect(count).toBeGreaterThan(0);
    
    // Take screenshot of action choices
    await page.screenshot({ path: 'ai-gm-character-action-choices.png', fullPage: true });
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Remove API key to trigger error
    await page.evaluate(() => {
      localStorage.removeItem('gemini-api-key');
    });
    
    // Select character and try to start session
    await page.locator('[data-testid="character-card"]').first().click();
    await page.waitForTimeout(500);
    await page.getByTestId('start-ai-session-button').click();
    
    // Wait for error message
    await expect(page.locator('text=AI APIエラー')).toBeVisible({ timeout: 10000 });
    
    // Verify error details are shown
    await expect(page.locator('text=APIキー: 未設定')).toBeVisible();
    
    // Take screenshot of error state
    await page.screenshot({ path: 'ai-gm-api-error.png', fullPage: true });
  });

  test('should require character selection before starting session', async ({ page }) => {
    // Try to start session without selecting character
    const startButton = page.getByTestId('start-ai-session-button');
    
    // Button should be disabled
    await expect(startButton).toBeDisabled();
    
    // Hover to see tooltip
    await startButton.hover();
    await page.waitForTimeout(500);
    
    // Take screenshot showing disabled state
    await page.screenshot({ path: 'ai-gm-no-character-selected.png', fullPage: true });
  });
});
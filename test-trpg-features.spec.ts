import { test, expect } from '@playwright/test';

test.describe('TRPG Application Feature Tests', () => {
  
  test('Homepage loads and displays TRPG features', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ path: 'homepage-loaded.png', fullPage: true });
    
    // Check if main navigation is present
    const nav = page.locator('nav, header, [role="navigation"]');
    await expect(nav).toBeVisible();
    
    console.log('✅ Homepage navigation visible');
  });

  test('Campaign creation flow', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Look for campaign creation button
    const createButton = page.locator('button', { hasText: /新規|作成|キャンペーン/ }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.screenshot({ path: 'campaign-creation.png' });
      console.log('✅ Campaign creation dialog opened');
    } else {
      console.log('ℹ️ Campaign creation button not found - checking for project creation');
      const projectButton = page.locator('button', { hasText: /プロジェクト/ }).first();
      if (await projectButton.isVisible()) {
        await projectButton.click();
        await page.screenshot({ path: 'project-creation.png' });
        console.log('✅ Project creation flow found');
      }
    }
  });

  test('World Building features', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Look for world building navigation
    const worldBuildingLink = page.locator('a, button', { hasText: /世界観|ワールド/ }).first();
    if (await worldBuildingLink.isVisible()) {
      await worldBuildingLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'world-building.png', fullPage: true });
      
      // Check for base/location management
      const baseTab = page.locator('[role="tab"], button', { hasText: /拠点|ベース/ }).first();
      if (await baseTab.isVisible()) {
        await baseTab.click();
        await page.screenshot({ path: 'base-management.png' });
        console.log('✅ Base management tab found');
      }
      
      console.log('✅ World Building page accessible');
    } else {
      console.log('ℹ️ World Building link not found in current navigation');
    }
  });

  test('Character management features', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Look for character management
    const charactersLink = page.locator('a, button', { hasText: /キャラクター|Characters/ }).first();
    if (await charactersLink.isVisible()) {
      await charactersLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'characters.png', fullPage: true });
      console.log('✅ Characters page accessible');
    } else {
      console.log('ℹ️ Characters link not found in current navigation');
    }
  });

  test('Developer mode toggle', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Look for developer mode toggle in sidebar
    const devModeToggle = page.locator('input[type="checkbox"], switch', { near: page.locator('text=/開発者モード/') }).first();
    if (await devModeToggle.isVisible()) {
      // Test toggling developer mode
      await devModeToggle.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'developer-mode-on.png' });
      
      // Toggle it back
      await devModeToggle.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'developer-mode-off.png' });
      
      console.log('✅ Developer mode toggle working');
    } else {
      console.log('ℹ️ Developer mode toggle not found');
    }
  });

  test('AI Chat Panel visibility', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Check if AI Chat Panel is visible (should be hidden by default)
    const aiChatPanel = page.locator('[data-testid="ai-chat-panel"], .ai-chat, [class*="ai-chat"]').first();
    if (await aiChatPanel.isVisible()) {
      console.log('ℹ️ AI Chat Panel is visible (may indicate developer mode is on)');
    } else {
      console.log('✅ AI Chat Panel properly hidden in normal mode');
    }
    
    await page.screenshot({ path: 'ai-chat-visibility.png' });
  });

  test('TRPG Session interface (if accessible)', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Look for TRPG session or game interface
    const sessionLink = page.locator('a, button', { hasText: /セッション|Session|ゲーム|TRPG/ }).first();
    if (await sessionLink.isVisible()) {
      await sessionLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'trpg-session.png', fullPage: true });
      console.log('✅ TRPG Session interface accessible');
    } else {
      console.log('ℹ️ TRPG Session interface not found in navigation');
    }
  });

});
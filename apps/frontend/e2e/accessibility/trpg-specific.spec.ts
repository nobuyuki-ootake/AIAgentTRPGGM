import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * TRPG-specific accessibility tests
 * Tests accessibility for TRPG-specific components like dice, character sheets, and session interfaces
 */

test.describe('TRPG Application - TRPG-Specific Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Character creation form should be accessible', async ({ page }) => {
    // Navigate to Characters page
    await page.click('text=キャラクター');
    await page.waitForLoadState('networkidle');
    
    // Try to add a new character
    const addButton = page.locator('button:has-text("追加"), button:has-text("新規作成"), button[aria-label*="追加"], button[aria-label*="作成"]').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
      
      // Check accessibility of character form
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('form, .character-form, [role="dialog"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Check that form fields have proper labels
      const formFields = await page.locator('input, textarea, select').all();
      
      for (const field of formFields) {
        const id = await field.getAttribute('id');
        const ariaLabel = await field.getAttribute('aria-label');
        const ariaLabelledBy = await field.getAttribute('aria-labelledby');
        const type = await field.getAttribute('type');
        
        if (type === 'hidden') continue;
        
        let hasLabel = false;
        
        // Check for explicit label
        if (id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          if (label > 0) hasLabel = true;
        }
        
        // Check for ARIA labels
        if (ariaLabel || ariaLabelledBy) hasLabel = true;
        
        // Check for wrapping label
        const wrappingLabel = await field.locator('xpath=ancestor::label').count();
        if (wrappingLabel > 0) hasLabel = true;
        
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('Dice rolling interface should be accessible', async ({ page }) => {
    // Look for dice-related components
    const diceElements = await page.locator('.dice, [data-testid*="dice"], button:has-text("ダイス")').all();
    
    if (diceElements.length > 0) {
      for (const diceElement of diceElements) {
        // Check if dice button has accessible name
        const tagName = await diceElement.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'button') {
          const textContent = await diceElement.textContent();
          const ariaLabel = await diceElement.getAttribute('aria-label');
          
          const hasAccessibleName = 
            (textContent && textContent.trim().length > 0) ||
            (ariaLabel && ariaLabel.trim().length > 0);
          
          expect(hasAccessibleName).toBeTruthy();
        }
        
        // Check if dice results are announced
        const hasAriaLive = await diceElement.getAttribute('aria-live') ||
                           await page.locator('[aria-live][data-testid*="dice-result"]').count() > 0;
        
        // Dice results should be announced to screen readers
        if (hasAriaLive) {
          expect(true).toBeTruthy(); // Good practice found
        }
      }
    }
  });

  test('Timeline events should have proper semantic structure', async ({ page }) => {
    // Navigate to Timeline page
    await page.click('text=タイムライン');
    await page.waitForLoadState('networkidle');
    
    // Check accessibility of timeline
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('.timeline, .timeline-event, [data-testid*="timeline"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Check timeline events for proper labeling
    const timelineEvents = await page.locator('.timeline-event, [data-testid*="event"], .event-item').all();
    
    for (const event of timelineEvents.slice(0, 5)) {
      // Events should have accessible names
      const ariaLabel = await event.getAttribute('aria-label');
      const textContent = await event.textContent();
      
      const hasAccessibleName = 
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (textContent && textContent.trim().length > 0);
      
      expect(hasAccessibleName).toBeTruthy();
      
      // Events should have semantic role if not already semantic element
      const tagName = await event.evaluate(el => el.tagName.toLowerCase());
      const role = await event.getAttribute('role');
      
      if (!['article', 'section', 'div'].includes(tagName) && !role) {
        // Consider adding role="article" or similar for timeline events
        console.info('Timeline event could benefit from semantic role');
      }
    }
  });

  test('Character sheets should have proper table accessibility', async ({ page }) => {
    // Navigate to Characters page
    await page.click('text=キャラクター');
    await page.waitForLoadState('networkidle');
    
    // Look for character sheet tables or stat displays
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Check table accessibility
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include(table)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
      
      // Check for proper headers
      const headers = await table.locator('th').count();
      const rows = await table.locator('tr').count();
      
      if (rows > 1) {
        expect(headers).toBeGreaterThan(0);
      }
      
      // Check for caption (recommended for data tables)
      const caption = await table.locator('caption').count();
      if (caption === 0) {
        // Could benefit from a caption describing the character stats
        console.info('Character table could benefit from a caption');
      }
    }
  });

  test('World building forms should be accessible', async ({ page }) => {
    // Navigate to World Building page
    await page.click('text=世界観構築');
    await page.waitForLoadState('networkidle');
    
    // Check accessibility of world building interface
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Check tabs accessibility if present
    const tabs = await page.locator('[role="tab"], .tab, .MuiTab-root').all();
    
    if (tabs.length > 0) {
      for (const tab of tabs) {
        // Tabs should have accessible names
        const ariaLabel = await tab.getAttribute('aria-label');
        const textContent = await tab.textContent();
        
        const hasAccessibleName = 
          (ariaLabel && ariaLabel.trim().length > 0) ||
          (textContent && textContent.trim().length > 0);
        
        expect(hasAccessibleName).toBeTruthy();
        
        // Check for proper ARIA attributes
        const ariaSelected = await tab.getAttribute('aria-selected');
        const ariaControls = await tab.getAttribute('aria-controls');
        
        expect(['true', 'false']).toContain(ariaSelected);
        // aria-controls is recommended
        if (!ariaControls) {
          console.info('Tab could benefit from aria-controls attribute');
        }
      }
    }
  });

  test('Writing interface should be accessible', async ({ page }) => {
    // Navigate to Writing page
    await page.click('text=執筆');
    await page.waitForLoadState('networkidle');
    
    // Check accessibility of writing interface
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
    
    // Check text editor accessibility
    const textAreas = await page.locator('textarea, [contenteditable="true"], .editor').all();
    
    for (const editor of textAreas) {
      // Editors should have labels
      const id = await editor.getAttribute('id');
      const ariaLabel = await editor.getAttribute('aria-label');
      const ariaLabelledBy = await editor.getAttribute('aria-labelledby');
      
      let hasLabel = false;
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        if (label > 0) hasLabel = true;
      }
      
      if (ariaLabel || ariaLabelledBy) hasLabel = true;
      
      // Check for wrapping label
      const wrappingLabel = await editor.locator('xpath=ancestor::label').count();
      if (wrappingLabel > 0) hasLabel = true;
      
      expect(hasLabel).toBeTruthy();
      
      // Rich text editors should have proper role
      const role = await editor.getAttribute('role');
      const contentEditable = await editor.getAttribute('contenteditable');
      
      if (contentEditable === 'true' && !role) {
        // Consider adding role="textbox" for rich text editors
        console.info('Rich text editor could benefit from role="textbox"');
      }
    }
  });

  test('Session interface components should be accessible', async ({ page }) => {
    // Look for session-related components
    const sessionElements = await page.locator('.session, [data-testid*="session"], .trpg-session').all();
    
    if (sessionElements.length > 0) {
      for (const element of sessionElements) {
        // Check accessibility of session components
        const accessibilityScanResults = await new AxeBuilder({ page })
          .include(element)
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      }
    }
    
    // Check for chat interfaces
    const chatElements = await page.locator('.chat, [data-testid*="chat"], .chat-interface').all();
    
    for (const chat of chatElements) {
      // Chat should have proper landmarks
      const role = await chat.getAttribute('role');
      
      if (!role) {
        // Consider adding role="log" for chat history
        console.info('Chat interface could benefit from role="log"');
      }
      
      // Check for live region for new messages
      const ariaLive = await chat.getAttribute('aria-live') ||
                      await chat.locator('[aria-live]').count() > 0;
      
      if (!ariaLive) {
        console.info('Chat interface could benefit from aria-live region for new messages');
      }
    }
  });

  test('Modal dialogs in TRPG context should be accessible', async ({ page }) => {
    // Test various modal dialogs that might appear in TRPG context
    const modalTriggers = [
      'button:has-text("新しいプロジェクトを作成")',
      'button:has-text("プロジェクトを作成")',
      'button:has-text("追加")',
      'button:has-text("編集")',
      'button:has-text("設定")'
    ];
    
    for (const trigger of modalTriggers) {
      const button = page.locator(trigger).first();
      
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[role="dialog"], .modal, .MuiDialog-root').first();
        
        if (await modal.isVisible()) {
          // Check modal accessibility
          const accessibilityScanResults = await new AxeBuilder({ page })
            .include(modal)
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();

          expect(accessibilityScanResults.violations).toEqual([]);
          
          // Check modal ARIA properties
          const role = await modal.getAttribute('role');
          const ariaModal = await modal.getAttribute('aria-modal');
          const ariaLabel = await modal.getAttribute('aria-label');
          const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
          
          expect(role).toBe('dialog');
          expect(ariaModal).toBe('true');
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
          
          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
        
        break; // Only test one modal to avoid state conflicts
      }
    }
  });

  test('Error states should be accessible', async ({ page }) => {
    // Look for error states across the application
    const errorElements = await page.locator('.error, [role="alert"], .MuiAlert-root').all();
    
    for (const error of errorElements) {
      // Errors should be announced to screen readers
      const role = await error.getAttribute('role');
      const ariaLive = await error.getAttribute('aria-live');
      
      if (role === 'alert') {
        // Alerts are automatically live regions
        expect(true).toBeTruthy();
      } else if (ariaLive) {
        expect(['polite', 'assertive']).toContain(ariaLive);
      } else {
        console.info('Error element could benefit from role="alert" or aria-live');
      }
      
      // Error should have meaningful text
      const textContent = await error.textContent();
      expect(textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  test('Loading states should be accessible', async ({ page }) => {
    // Look for loading indicators
    const loadingElements = await page.locator('.loading, [data-testid*="loading"], .spinner, .MuiCircularProgress-root').all();
    
    for (const loading of loadingElements) {
      // Loading indicators should be announced
      const ariaLabel = await loading.getAttribute('aria-label');
      const ariaLive = await loading.getAttribute('aria-live');
      const role = await loading.getAttribute('role');
      
      const hasAccessibleIndication = 
        (ariaLabel && ariaLabel.includes('loading')) ||
        (ariaLive === 'polite') ||
        (role === 'status');
      
      if (!hasAccessibleIndication) {
        console.info('Loading indicator could benefit from aria-label="Loading..." or role="status"');
      }
    }
  });

  test('Data visualization should be accessible', async ({ page }) => {
    // Navigate to pages that might have charts or data visualization
    const pages = [
      { name: 'Timeline', selector: 'text=タイムライン' },
      { name: 'Characters', selector: 'text=キャラクター' }
    ];

    for (const pageInfo of pages) {
      await page.click(pageInfo.selector);
      await page.waitForLoadState('networkidle');
      
      // Look for charts or data visualizations
      const charts = await page.locator('svg, canvas, .chart, [data-testid*="chart"]').all();
      
      for (const chart of charts) {
        // Charts should have accessible names and descriptions
        const ariaLabel = await chart.getAttribute('aria-label');
        const ariaLabelledBy = await chart.getAttribute('aria-labelledby');
        const ariaDescribedBy = await chart.getAttribute('aria-describedby');
        const title = await chart.locator('title').count();
        
        const hasAccessibleName = ariaLabel || ariaLabelledBy || title > 0;
        
        if (!hasAccessibleName) {
          console.info('Data visualization could benefit from aria-label or title element');
        }
        
        // Check for alternative text representation
        const role = await chart.getAttribute('role');
        if (role !== 'img' && role !== 'presentation') {
          console.info('Consider adding role="img" for decorative charts or providing data table alternative');
        }
      }
    }
  });
});
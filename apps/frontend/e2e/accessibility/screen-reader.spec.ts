import { test, expect } from '@playwright/test';

/**
 * Screen reader accessibility tests
 * Tests screen reader compatibility following WCAG 2.1 guidelines
 */

test.describe('TRPG Application - Screen Reader Compatibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Page should have appropriate title and meta information', async ({ page }) => {
    // Check page title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
  });

  test('Main landmarks should be properly identified', async ({ page }) => {
    // Check for main landmarks
    const mainLandmark = await page.locator('main, [role="main"]').count();
    expect(mainLandmark).toBeGreaterThan(0);
    
    // Check for navigation landmark
    const navLandmark = await page.locator('nav, [role="navigation"]').count();
    expect(navLandmark).toBeGreaterThan(0);
    
    // Check for banner/header landmark (optional)
    const bannerLandmark = await page.locator('header, [role="banner"]').count();
    // Note: Not required but recommended
    
    // Check for contentinfo/footer landmark (optional)
    const contentinfoLandmark = await page.locator('footer, [role="contentinfo"]').count();
    // Note: Not required but recommended
  });

  test('Headings should form a proper hierarchy', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for exactly one H1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Check heading hierarchy
    let previousLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.charAt(1));
      const text = await heading.textContent();
      
      // Heading should have text content
      expect(text?.trim()).toBeTruthy();
      
      // Check hierarchy (no skipping levels)
      if (previousLevel > 0) {
        expect(level - previousLevel).toBeLessThanOrEqual(1);
      }
      
      previousLevel = level;
    }
  });

  test('Images should have appropriate alt text', async ({ page }) => {
    const images = await page.locator('img').all();
    
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      const src = await image.getAttribute('src');
      const role = await image.getAttribute('role');
      
      // Images should have alt attribute (even if empty for decorative images)
      expect(alt).not.toBeNull();
      
      // If image has content meaning, alt should not be empty
      if (src && !src.includes('icon') && !src.includes('decoration') && role !== 'presentation') {
        expect(alt?.length).toBeGreaterThan(0);
      }
    }
  });

  test('Form elements should have proper labels', async ({ page }) => {
    const formElements = await page.locator('input, textarea, select').all();
    
    for (const element of formElements) {
      const id = await element.getAttribute('id');
      const ariaLabel = await element.getAttribute('aria-label');
      const ariaLabelledBy = await element.getAttribute('aria-labelledby');
      const type = await element.getAttribute('type');
      
      // Skip hidden inputs
      if (type === 'hidden') continue;
      
      let hasLabel = false;
      
      // Check for explicit label
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        if (label > 0) hasLabel = true;
      }
      
      // Check for aria-label
      if (ariaLabel && ariaLabel.trim().length > 0) {
        hasLabel = true;
      }
      
      // Check for aria-labelledby
      if (ariaLabelledBy) {
        const referencedElement = await page.locator(`#${ariaLabelledBy}`).count();
        if (referencedElement > 0) hasLabel = true;
      }
      
      // Check for wrapping label
      const wrappingLabel = await element.locator('xpath=ancestor::label').count();
      if (wrappingLabel > 0) hasLabel = true;
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('Buttons should have accessible names', async ({ page }) => {
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const textContent = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const title = await button.getAttribute('title');
      
      // Button should have some form of accessible name
      const hasAccessibleName = 
        (textContent && textContent.trim().length > 0) ||
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (ariaLabelledBy && ariaLabelledBy.trim().length > 0) ||
        (title && title.trim().length > 0);
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('Links should have meaningful text', async ({ page }) => {
    const links = await page.locator('a[href]').all();
    
    for (const link of links) {
      const textContent = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      
      // Link should have meaningful text
      const hasAccessibleText = 
        (textContent && textContent.trim().length > 0 && textContent.trim() !== 'link') ||
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (title && title.trim().length > 0);
      
      expect(hasAccessibleText).toBeTruthy();
      
      // Avoid generic link text
      const genericTexts = ['click here', 'read more', 'link', 'here', 'more'];
      const isGeneric = genericTexts.some(generic => 
        textContent?.toLowerCase().includes(generic)
      );
      
      if (isGeneric && !ariaLabel && !title) {
        // Generic text should be accompanied by additional context
        console.warn(`Link with generic text: "${textContent}"`);
      }
    }
  });

  test('ARIA labels should be meaningful and accurate', async ({ page }) => {
    const elementsWithAriaLabels = await page.locator('[aria-label]').all();
    
    for (const element of elementsWithAriaLabels) {
      const ariaLabel = await element.getAttribute('aria-label');
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      // ARIA label should not be empty
      expect(ariaLabel?.trim().length).toBeGreaterThan(0);
      
      // ARIA label should be descriptive (at least 3 characters for meaningful content)
      if (ariaLabel && !['×', '✓', '✗'].includes(ariaLabel)) {
        expect(ariaLabel.trim().length).toBeGreaterThan(2);
      }
    }
  });

  test('ARIA live regions should be properly implemented', async ({ page }) => {
    const liveRegions = await page.locator('[aria-live]').all();
    
    for (const region of liveRegions) {
      const ariaLive = await region.getAttribute('aria-live');
      const validValues = ['off', 'polite', 'assertive'];
      
      expect(validValues).toContain(ariaLive);
      
      // Check for aria-atomic if present
      const ariaAtomic = await region.getAttribute('aria-atomic');
      if (ariaAtomic) {
        expect(['true', 'false']).toContain(ariaAtomic);
      }
    }
  });

  test('Status messages should be announced to screen readers', async ({ page }) => {
    // Look for status messages, alerts, notifications
    const statusElements = await page.locator('[role="status"], [role="alert"], .alert, .notification, .snackbar').all();
    
    for (const element of statusElements) {
      const role = await element.getAttribute('role');
      const ariaLive = await element.getAttribute('aria-live');
      
      // Status elements should have appropriate ARIA attributes
      if (role === 'alert') {
        // Alerts are automatically live regions
        expect(true).toBeTruthy();
      } else if (role === 'status') {
        // Status should have aria-live="polite" (implicit)
        expect(true).toBeTruthy();
      } else {
        // Other status elements should have aria-live
        expect(ariaLive).toBeTruthy();
      }
    }
  });

  test('Tables should have proper headers and captions', async ({ page }) => {
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Check for caption (recommended)
      const caption = await table.locator('caption').count();
      
      // Check for headers
      const headers = await table.locator('th').count();
      const rows = await table.locator('tr').count();
      
      if (rows > 1) {
        // Data tables should have headers
        expect(headers).toBeGreaterThan(0);
        
        // Check if headers have scope attribute for complex tables
        const headerElements = await table.locator('th').all();
        for (const header of headerElements) {
          const scope = await header.getAttribute('scope');
          // scope is recommended for complex tables
          // Common values: 'col', 'row', 'colgroup', 'rowgroup'
        }
      }
    }
  });

  test('Interactive elements should have appropriate ARIA states', async ({ page }) => {
    // Check buttons for pressed state
    const toggleButtons = await page.locator('button[aria-pressed]').all();
    for (const button of toggleButtons) {
      const ariaPressed = await button.getAttribute('aria-pressed');
      expect(['true', 'false', 'mixed']).toContain(ariaPressed);
    }
    
    // Check expandable elements
    const expandableElements = await page.locator('[aria-expanded]').all();
    for (const element of expandableElements) {
      const ariaExpanded = await element.getAttribute('aria-expanded');
      expect(['true', 'false']).toContain(ariaExpanded);
    }
    
    // Check checkboxes and radio buttons
    const checkableElements = await page.locator('[aria-checked]').all();
    for (const element of checkableElements) {
      const ariaChecked = await element.getAttribute('aria-checked');
      expect(['true', 'false', 'mixed']).toContain(ariaChecked);
    }
    
    // Check selected elements
    const selectableElements = await page.locator('[aria-selected]').all();
    for (const element of selectableElements) {
      const ariaSelected = await element.getAttribute('aria-selected');
      expect(['true', 'false']).toContain(ariaSelected);
    }
  });

  test('Modal dialogs should have proper ARIA implementation', async ({ page }) => {
    // Try to open a modal
    const newProjectButton = page.locator('button:has-text("新しいプロジェクトを作成"), button:has-text("プロジェクトを作成")').first();
    
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
      await page.waitForTimeout(500);
      
      const modal = page.locator('[role="dialog"]').first();
      
      if (await modal.isVisible()) {
        // Modal should have role="dialog"
        const role = await modal.getAttribute('role');
        expect(role).toBe('dialog');
        
        // Modal should have aria-labelledby or aria-label
        const ariaLabel = await modal.getAttribute('aria-label');
        const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
        
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        
        // Modal should have aria-modal="true"
        const ariaModal = await modal.getAttribute('aria-modal');
        expect(ariaModal).toBe('true');
        
        // Close modal
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Error messages should be associated with form fields', async ({ page }) => {
    // Navigate to pages that might have forms
    const pages = [
      { name: 'Characters', selector: 'text=キャラクター' },
      { name: 'Plot', selector: 'text=プロット' }
    ];

    for (const pageInfo of pages) {
      await page.click(pageInfo.selector);
      await page.waitForLoadState('networkidle');
      
      // Look for error messages
      const errorElements = await page.locator('.error, [role="alert"], .MuiFormHelperText-root.Mui-error').all();
      
      for (const error of errorElements) {
        const id = await error.getAttribute('id');
        
        if (id) {
          // Check if any form field references this error
          const referencingField = await page.locator(`[aria-describedby*="${id}"]`).count();
          if (referencingField === 0) {
            console.warn(`Error message with id="${id}" is not referenced by any form field`);
          }
        }
      }
    }
  });

  test('Skip links should be available for navigation', async ({ page }) => {
    // Look for skip links
    const skipLinks = await page.locator('a[href^="#"]:has-text("skip"), a[href^="#"]:has-text("Skip")').all();
    
    if (skipLinks.length > 0) {
      for (const skipLink of skipLinks) {
        const href = await skipLink.getAttribute('href');
        const targetId = href?.substring(1); // Remove #
        
        if (targetId) {
          // Target element should exist
          const target = await page.locator(`#${targetId}`).count();
          expect(target).toBeGreaterThan(0);
        }
      }
    }
  });
});
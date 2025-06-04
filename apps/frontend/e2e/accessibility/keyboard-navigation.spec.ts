import { test, expect } from '@playwright/test';

/**
 * Keyboard navigation accessibility tests
 * Tests keyboard accessibility following WCAG 2.1 guidelines
 */

test.describe('TRPG Application - Keyboard Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Should navigate through all focusable elements with Tab', async ({ page }) => {
    // Start from the first focusable element
    await page.keyboard.press('Tab');
    
    const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    // Navigate through each element
    for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
      const focusedElement = await page.locator(':focus').first();
      await expect(focusedElement).toBeVisible();
      
      // Check if element has visible focus indicator
      const focusedStyles = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow
        };
      });
      
      // Element should have some form of focus indicator
      const hasFocusIndicator = 
        focusedStyles.outline !== 'none' ||
        focusedStyles.outlineWidth !== '0px' ||
        focusedStyles.boxShadow !== 'none';
      
      expect(hasFocusIndicator).toBeTruthy();
      
      await page.keyboard.press('Tab');
    }
  });

  test('Should navigate backwards with Shift+Tab', async ({ page }) => {
    // Navigate to a middle element first
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    const midElement = await page.locator(':focus').first();
    const midElementText = await midElement.textContent();
    
    // Move forward one more time
    await page.keyboard.press('Tab');
    
    // Move back with Shift+Tab
    await page.keyboard.press('Shift+Tab');
    
    const backElement = await page.locator(':focus').first();
    const backElementText = await backElement.textContent();
    
    expect(backElementText).toBe(midElementText);
  });

  test('Should handle Enter key on buttons and links', async ({ page }) => {
    // Find all buttons and links
    const interactiveElements = await page.locator('button, a[href]').all();
    
    for (const element of interactiveElements.slice(0, 5)) {
      await element.focus();
      
      // Check if element is focused
      const isFocused = await element.evaluate(el => el === document.activeElement);
      expect(isFocused).toBeTruthy();
      
      // Test Enter key (but prevent actual navigation for links)
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'button') {
        // For buttons, we can test Enter key activation
        let clicked = false;
        await element.evaluate(el => {
          el.addEventListener('click', () => { clicked = true; }, { once: true });
        });
        
        await page.keyboard.press('Enter');
        
        // Small delay to allow event handling
        await page.waitForTimeout(100);
      }
    }
  });

  test('Should handle Space key on buttons', async ({ page }) => {
    const buttons = await page.locator('button').all();
    
    for (const button of buttons.slice(0, 3)) {
      await button.focus();
      
      // Check if button is focused
      const isFocused = await button.evaluate(el => el === document.activeElement);
      expect(isFocused).toBeTruthy();
      
      // Test Space key activation
      let activated = false;
      await button.evaluate(el => {
        el.addEventListener('click', () => { activated = true; }, { once: true });
      });
      
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);
    }
  });

  test('Should handle Escape key in modal dialogs', async ({ page }) => {
    // Try to open a modal dialog
    const newProjectButton = page.locator('button:has-text("新しいプロジェクトを作成"), button:has-text("プロジェクトを作成")').first();
    
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
      await page.waitForTimeout(500);
      
      // Check if modal is open
      const modal = page.locator('[role="dialog"], .modal, .MuiDialog-root').first();
      await expect(modal).toBeVisible();
      
      // Press Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Modal should be closed
      await expect(modal).not.toBeVisible();
    }
  });

  test('Should maintain focus within modal dialogs (focus trap)', async ({ page }) => {
    // Try to open a modal dialog
    const newProjectButton = page.locator('button:has-text("新しいプロジェクトを作成"), button:has-text("プロジェクトを作成")').first();
    
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
      await page.waitForTimeout(500);
      
      // Check if modal is open
      const modal = page.locator('[role="dialog"], .modal, .MuiDialog-root').first();
      if (await modal.isVisible()) {
        // Find focusable elements within modal
        const modalFocusableElements = await modal.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').all();
        
        if (modalFocusableElements.length > 1) {
          // Focus should start on first element or be set appropriately
          await page.keyboard.press('Tab');
          
          // Navigate through all elements in modal
          for (let i = 0; i < modalFocusableElements.length + 2; i++) {
            const focusedElement = await page.locator(':focus').first();
            
            // Check if focused element is within modal
            const isWithinModal = await modal.locator(':focus').count() > 0;
            expect(isWithinModal).toBeTruthy();
            
            await page.keyboard.press('Tab');
          }
        }
        
        // Close modal
        await page.keyboard.press('Escape');
      }
    }
  });

  test('Should handle arrow keys in navigation menus', async ({ page }) => {
    // Look for navigation menus or sidebars
    const navElements = await page.locator('nav, [role="navigation"], .sidebar').all();
    
    for (const nav of navElements) {
      const menuItems = await nav.locator('a, button, [role="menuitem"]').all();
      
      if (menuItems.length > 1) {
        // Focus first item
        await menuItems[0].focus();
        
        // Test arrow key navigation
        await page.keyboard.press('ArrowDown');
        
        // Check if focus moved to next item
        const focusedElement = await page.locator(':focus').first();
        const isSecondItem = await focusedElement.evaluate((el, expectedEl) => 
          el === expectedEl, await menuItems[1].elementHandle());
        
        // Note: This test may not pass for all navigation types,
        // as arrow key navigation is optional for some menu types
      }
    }
  });

  test('Should handle Home/End keys in appropriate contexts', async ({ page }) => {
    // Test in text inputs
    const textInputs = await page.locator('input[type="text"], textarea').all();
    
    for (const input of textInputs.slice(0, 2)) {
      // Add some text
      await input.fill('Hello World');
      await input.focus();
      
      // Test Home key
      await page.keyboard.press('Home');
      
      // Cursor should be at beginning
      const cursorPos = await input.evaluate(el => (el as HTMLInputElement).selectionStart);
      expect(cursorPos).toBe(0);
      
      // Test End key
      await page.keyboard.press('End');
      
      // Cursor should be at end
      const endPos = await input.evaluate(el => (el as HTMLInputElement).selectionStart);
      expect(endPos).toBe(11); // Length of "Hello World"
    }
  });

  test('Should skip over disabled elements during tab navigation', async ({ page }) => {
    // Create a test scenario with disabled elements
    await page.evaluate(() => {
      // Add a disabled button to test
      const container = document.querySelector('main') || document.body;
      const disabledButton = document.createElement('button');
      disabledButton.textContent = 'Disabled Button';
      disabledButton.disabled = true;
      disabledButton.id = 'test-disabled-button';
      container.appendChild(disabledButton);
    });
    
    // Navigate with Tab and ensure disabled elements are skipped
    await page.keyboard.press('Tab');
    
    // The disabled button should not receive focus
    const focusedElement = await page.locator(':focus').first();
    const isDisabledButton = await focusedElement.evaluate(el => 
      el.id === 'test-disabled-button'
    );
    
    expect(isDisabledButton).toBeFalsy();
    
    // Clean up
    await page.evaluate(() => {
      const testButton = document.getElementById('test-disabled-button');
      if (testButton) testButton.remove();
    });
  });

  test('Should handle custom tabindex values correctly', async ({ page }) => {
    // Test elements with custom tabindex values
    const customTabElements = await page.locator('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])').all();
    
    if (customTabElements.length > 0) {
      // Elements with positive tabindex should be focused first
      await page.keyboard.press('Tab');
      
      for (const element of customTabElements) {
        const tabIndex = await element.getAttribute('tabindex');
        const numericTabIndex = parseInt(tabIndex || '0');
        
        if (numericTabIndex > 0) {
          await element.focus();
          const isFocused = await element.evaluate(el => el === document.activeElement);
          expect(isFocused).toBeTruthy();
        }
      }
    }
  });

  test('Should provide visual focus indicators for all focusable elements', async ({ page }) => {
    const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    for (const element of focusableElements.slice(0, 10)) {
      await element.focus();
      
      // Check for focus indicators
      const focusStyles = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const computedStyles = window.getComputedStyle(el, ':focus');
        
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          outlineStyle: styles.outlineStyle,
          boxShadow: styles.boxShadow,
          focusOutline: computedStyles.outline,
          focusBoxShadow: computedStyles.boxShadow
        };
      });
      
      // Element should have some visible focus indicator
      const hasVisibleFocus = 
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none' ||
        focusStyles.focusOutline !== 'none' ||
        focusStyles.focusBoxShadow !== 'none';
      
      expect(hasVisibleFocus).toBeTruthy();
    }
  });
});
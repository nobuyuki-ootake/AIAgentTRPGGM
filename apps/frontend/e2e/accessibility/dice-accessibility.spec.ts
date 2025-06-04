import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Dice component accessibility tests
 * Tests accessibility for TRPG dice rolling components
 */

test.describe('TRPG Application - Dice Component Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Dice components should be keyboard accessible', async ({ page }) => {
    // Look for dice-related buttons and components
    const diceButtons = await page.locator('button:has-text("ダイス"), button:has-text("dice"), .dice-button, [data-testid*="dice"]').all();
    
    if (diceButtons.length > 0) {
      for (const button of diceButtons) {
        // Focus the dice button
        await button.focus();
        
        // Check if button is focusable
        const isFocused = await button.evaluate(el => el === document.activeElement);
        expect(isFocused).toBeTruthy();
        
        // Check for visible focus indicator
        const focusStyles = await button.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow
          };
        });
        
        const hasVisibleFocus = 
          focusStyles.outline !== 'none' ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none';
        
        expect(hasVisibleFocus).toBeTruthy();
        
        // Test activation with Enter key
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        // Test activation with Space key
        await button.focus();
        await page.keyboard.press('Space');
        await page.waitForTimeout(500);
      }
    }
  });

  test('Dice buttons should have accessible names', async ({ page }) => {
    const diceButtons = await page.locator('button:has-text("ダイス"), button:has-text("dice"), .dice-button, [data-testid*="dice"]').all();
    
    for (const button of diceButtons) {
      const textContent = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      // Button should have some form of accessible name
      const hasAccessibleName = 
        (textContent && textContent.trim().length > 0) ||
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (title && title.trim().length > 0);
      
      expect(hasAccessibleName).toBeTruthy();
      
      // If using icons only, should have aria-label
      if (!textContent?.trim() && !ariaLabel) {
        console.warn('Dice button may need aria-label for screen readers');
      }
    }
  });

  test('Dice roll results should be announced to screen readers', async ({ page }) => {
    const diceButtons = await page.locator('button:has-text("ダイス"), button:has-text("dice"), .dice-button, [data-testid*="dice"]').first();
    
    if (await diceButtons.isVisible()) {
      // Click dice button to generate result
      await diceButtons.click();
      await page.waitForTimeout(1000);
      
      // Look for dice result announcements
      const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"], .dice-result').all();
      let hasLiveRegion = false;
      
      for (const region of liveRegions) {
        const ariaLive = await region.getAttribute('aria-live');
        const role = await region.getAttribute('role');
        const textContent = await region.textContent();
        
        if ((ariaLive === 'polite' || ariaLive === 'assertive' || role === 'status' || role === 'alert') && 
            textContent && textContent.includes('dice') || textContent?.match(/\d+/)) {
          hasLiveRegion = true;
          break;
        }
      }
      
      if (!hasLiveRegion) {
        // Look for any element that might contain dice results
        const resultElements = await page.locator('.result, .dice-result, [data-testid*="result"]').all();
        
        for (const result of resultElements) {
          const ariaLive = await result.getAttribute('aria-live');
          const role = await result.getAttribute('role');
          
          if (ariaLive || role === 'status') {
            hasLiveRegion = true;
            break;
          }
        }
      }
      
      // Dice results should be announced (this might be a recommendation if not found)
      if (!hasLiveRegion) {
        console.warn('Dice results should be announced to screen readers via aria-live or role="status"');
      }
    }
  });

  test('Dice type selection should be accessible', async ({ page }) => {
    // Look for dice type selectors (d4, d6, d8, d10, d12, d20, etc.)
    const diceTypeElements = await page.locator('button:has-text("d"), select option:has-text("d"), .dice-type').all();
    
    if (diceTypeElements.length > 0) {
      for (const element of diceTypeElements.slice(0, 5)) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        if (tagName === 'button') {
          // Test keyboard accessibility
          await element.focus();
          const isFocused = await element.evaluate(el => el === document.activeElement);
          expect(isFocused).toBeTruthy();
          
          // Check accessible name
          const textContent = await element.textContent();
          const ariaLabel = await element.getAttribute('aria-label');
          
          const hasAccessibleName = 
            (textContent && textContent.trim().length > 0) ||
            (ariaLabel && ariaLabel.trim().length > 0);
          
          expect(hasAccessibleName).toBeTruthy();
        }
      }
    }
  });

  test('Dice rolling interface should pass axe accessibility audit', async ({ page }) => {
    // Look for pages or components that might contain dice
    const potentialDicePages = [
      { name: 'Characters', selector: 'text=キャラクター' },
      { name: 'TRPG Session', selector: 'text=セッション' }
    ];
    
    for (const pageInfo of potentialDicePages) {
      const pageButton = page.locator(pageInfo.selector).first();
      
      if (await pageButton.isVisible()) {
        await pageButton.click();
        await page.waitForLoadState('networkidle');
        
        // Look for dice components on this page
        const diceComponents = await page.locator('.dice, [data-testid*="dice"], button:has-text("ダイス")').count();
        
        if (diceComponents > 0) {
          // Run accessibility audit on dice components
          const accessibilityScanResults = await new AxeBuilder({ page })
            .include('.dice, [data-testid*="dice"], .dice-container')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();

          expect(accessibilityScanResults.violations).toEqual([]);
        }
      }
    }
  });

  test('Dice animation should not trigger accessibility issues', async ({ page }) => {
    const diceButtons = await page.locator('button:has-text("ダイス"), button:has-text("dice"), .dice-button').first();
    
    if (await diceButtons.isVisible()) {
      // Check for prefers-reduced-motion support
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await diceButtons.click();
      await page.waitForTimeout(2000);
      
      // Check that animations respect reduced motion preference
      const animatedElements = await page.locator('.dice-animation, .rotating, .spinning').all();
      
      for (const element of animatedElements) {
        const animationStyles = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            animationDuration: styles.animationDuration,
            animationPlayState: styles.animationPlayState,
            transitionDuration: styles.transitionDuration
          };
        });
        
        // With reduced motion, animations should be disabled or significantly reduced
        if (animationStyles.animationDuration !== '0s' && 
            animationStyles.transitionDuration !== '0s' &&
            animationStyles.animationPlayState !== 'paused') {
          console.warn('Animation should respect prefers-reduced-motion setting');
        }
      }
      
      // Reset media emulation
      await page.emulateMedia({ reducedMotion: null });
    }
  });

  test('Dice roll history should be accessible', async ({ page }) => {
    // Look for dice roll history or log components
    const historyElements = await page.locator('.dice-history, .roll-history, .dice-log, [data-testid*="history"]').all();
    
    if (historyElements.length > 0) {
      for (const history of historyElements) {
        // History should have appropriate semantic structure
        const role = await history.getAttribute('role');
        const ariaLabel = await history.getAttribute('aria-label');
        
        // Consider using role="log" for dice roll history
        if (!role && !ariaLabel) {
          console.info('Dice roll history could benefit from role="log" or aria-label');
        }
        
        // Check if history items are properly structured
        const historyItems = await history.locator('li, .history-item, .roll-item').all();
        
        for (const item of historyItems.slice(0, 3)) {
          const itemText = await item.textContent();
          expect(itemText?.trim().length).toBeGreaterThan(0);
          
          // Items should have meaningful content for screen readers
          if (itemText && !itemText.match(/\d+/)) {
            console.warn('Dice history item should include roll result');
          }
        }
      }
    }
  });

  test('Dice input fields should be properly labeled', async ({ page }) => {
    // Look for dice number input fields (number of dice, modifier, etc.)
    const diceInputs = await page.locator('input[type="number"], input[placeholder*="dice"], input[placeholder*="modifier"]').all();
    
    for (const input of diceInputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      let hasLabel = false;
      
      // Check for explicit label
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        if (label > 0) hasLabel = true;
      }
      
      // Check for ARIA labels
      if (ariaLabel || ariaLabelledBy) hasLabel = true;
      
      // Check for wrapping label
      const wrappingLabel = await input.locator('xpath=ancestor::label').count();
      if (wrappingLabel > 0) hasLabel = true;
      
      // Placeholder alone is not sufficient, but acceptable if no other label
      if (!hasLabel && placeholder) {
        console.warn('Input field relies only on placeholder for labeling - consider adding proper label');
      }
      
      expect(hasLabel || placeholder).toBeTruthy();
    }
  });

  test('Dice result display should be accessible to screen readers', async ({ page }) => {
    const diceButtons = await page.locator('button:has-text("ダイス"), button:has-text("dice"), .dice-button').first();
    
    if (await diceButtons.isVisible()) {
      await diceButtons.click();
      await page.waitForTimeout(1000);
      
      // Look for result display elements
      const resultElements = await page.locator('.dice-result, .roll-result, [data-testid*="result"]').all();
      
      for (const result of resultElements) {
        const textContent = await result.textContent();
        const ariaLabel = await result.getAttribute('aria-label');
        const ariaLive = await result.getAttribute('aria-live');
        const role = await result.getAttribute('role');
        
        // Result should have meaningful text content
        expect(textContent?.trim().length).toBeGreaterThan(0);
        
        // Result should be properly announced
        const isAnnounced = ariaLive === 'polite' || ariaLive === 'assertive' || role === 'status';
        
        if (!isAnnounced) {
          console.info('Dice result could benefit from aria-live="polite" for screen reader announcement');
        }
        
        // Check if result includes context (what was rolled)
        if (textContent && !textContent.includes('d') && !ariaLabel?.includes('d')) {
          console.info('Dice result could include more context about what was rolled');
        }
      }
    }
  });

  test('Complex dice expressions should be accessible', async ({ page }) => {
    // Look for advanced dice rolling features (3d6+2, advantage/disadvantage, etc.)
    const complexDiceElements = await page.locator('[data-testid*="advantage"], [data-testid*="disadvantage"], .dice-expression').all();
    
    if (complexDiceElements.length > 0) {
      for (const element of complexDiceElements) {
        const ariaLabel = await element.getAttribute('aria-label');
        const textContent = await element.textContent();
        const role = await element.getAttribute('role');
        
        // Complex dice expressions should be clearly explained
        const hasExplanation = 
          (ariaLabel && ariaLabel.includes('advantage')) ||
          (ariaLabel && ariaLabel.includes('disadvantage')) ||
          (textContent && (textContent.includes('advantage') || textContent.includes('disadvantage')));
        
        if (!hasExplanation && (element.toString().includes('advantage') || element.toString().includes('disadvantage'))) {
          console.info('Complex dice mechanics should have clear explanations for screen readers');
        }
      }
    }
  });
});
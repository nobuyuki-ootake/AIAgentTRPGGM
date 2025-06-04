import { Page, Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Utility functions for accessibility testing in Playwright tests
 */

export interface AccessibilityTestOptions {
  page: Page;
  selector?: string;
  tags?: string[];
  rules?: string[];
  include?: string[];
  exclude?: string[];
}

export interface ColorContrastCheck {
  element: Locator;
  ratio: number;
  passes: boolean;
  level: 'AA' | 'AAA' | 'fail';
}

export interface KeyboardNavigationResult {
  totalElements: number;
  focusableElements: number;
  keyboardAccessible: boolean;
  issues: string[];
}

/**
 * Run axe accessibility scan with custom options
 */
export async function runAccessibilityTest(options: AccessibilityTestOptions) {
  const { page, tags = ['wcag2a', 'wcag2aa', 'wcag21aa'], rules, include, exclude } = options;
  
  let builder = new AxeBuilder({ page });
  
  if (tags.length > 0) {
    builder = builder.withTags(tags);
  }
  
  if (rules && rules.length > 0) {
    builder = builder.withRules(rules);
  }
  
  if (include && include.length > 0) {
    for (const selector of include) {
      builder = builder.include(selector);
    }
  }
  
  if (exclude && exclude.length > 0) {
    for (const selector of exclude) {
      builder = builder.exclude(selector);
    }
  }
  
  return await builder.analyze();
}

/**
 * Check keyboard navigation for a page or element
 */
export async function checkKeyboardNavigation(page: Page, containerSelector?: string): Promise<KeyboardNavigationResult> {
  // Get all focusable elements
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  
  const allElements = containerSelector 
    ? await page.locator(`${containerSelector} ${focusableSelector}`)
    : await page.locator(focusableSelector);
  
  const totalElements = await allElements.count();
  let focusableElements = 0;
  const issues: string[] = [];
  
  // Test each element for keyboard accessibility
  for (let i = 0; i < Math.min(totalElements, 20); i++) {
    const element = allElements.nth(i);
    
    try {
      await element.focus();
      
      // Check if element actually received focus
      const isFocused = await element.evaluate(el => el === document.activeElement);
      
      if (isFocused) {
        focusableElements++;
        
        // Check for visible focus indicator
        const focusStyles = await element.evaluate(el => {
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
        
        if (!hasVisibleFocus) {
          const tagName = await element.evaluate(el => el.tagName.toLowerCase());
          const id = await element.getAttribute('id');
          const classes = await element.getAttribute('class');
          issues.push(`Element ${tagName}${id ? `#${id}` : ''}${classes ? `.${classes.split(' ')[0]}` : ''} lacks visible focus indicator`);
        }
      }
    } catch (error) {
      // Element might not be focusable
    }
  }
  
  return {
    totalElements,
    focusableElements,
    keyboardAccessible: focusableElements === totalElements,
    issues
  };
}

/**
 * Check color contrast for elements on a page
 */
export async function checkColorContrast(page: Page, selector = 'body *'): Promise<ColorContrastCheck[]> {
  const elements = await page.locator(selector).all();
  const results: ColorContrastCheck[] = [];
  
  for (const element of elements.slice(0, 50)) { // Limit to avoid performance issues
    try {
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight
        };
      });
      
      // Calculate contrast ratio (simplified)
      const ratio = await calculateContrastRatio(styles.color, styles.backgroundColor);
      const fontSize = parseFloat(styles.fontSize);
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight === 'bold');
      
      let level: 'AA' | 'AAA' | 'fail';
      let passes: boolean;
      
      if (isLargeText) {
        if (ratio >= 4.5) {
          level = 'AAA';
          passes = true;
        } else if (ratio >= 3) {
          level = 'AA';
          passes = true;
        } else {
          level = 'fail';
          passes = false;
        }
      } else {
        if (ratio >= 7) {
          level = 'AAA';
          passes = true;
        } else if (ratio >= 4.5) {
          level = 'AA';
          passes = true;
        } else {
          level = 'fail';
          passes = false;
        }
      }
      
      results.push({
        element,
        ratio,
        passes,
        level
      });
    } catch (error) {
      // Skip elements that can't be analyzed
    }
  }
  
  return results;
}

/**
 * Check ARIA implementation on a page
 */
export async function checkAriaImplementation(page: Page) {
  const results = {
    totalElementsWithAria: 0,
    validAriaAttributes: 0,
    invalidAriaAttributes: 0,
    missingLabels: [] as string[],
    issues: [] as string[]
  };
  
  // Check elements with ARIA attributes
  const ariaElements = await page.locator('[aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-checked], [aria-selected], [role]').all();
  results.totalElementsWithAria = ariaElements.length;
  
  for (const element of ariaElements) {
    const attributes = await element.evaluate(el => {
      const attrs: { [key: string]: string } = {};
      for (const attr of el.attributes) {
        if (attr.name.startsWith('aria-') || attr.name === 'role') {
          attrs[attr.name] = attr.value;
        }
      }
      return attrs;
    });
    
    // Validate ARIA attributes
    for (const [name, value] of Object.entries(attributes)) {
      if (name.startsWith('aria-')) {
        // Check for valid values
        switch (name) {
          case 'aria-expanded':
          case 'aria-pressed':
          case 'aria-checked':
          case 'aria-selected':
            if (['true', 'false', 'mixed'].includes(value)) {
              results.validAriaAttributes++;
            } else {
              results.invalidAriaAttributes++;
              results.issues.push(`Invalid value "${value}" for ${name}`);
            }
            break;
          case 'aria-hidden':
            if (['true', 'false'].includes(value)) {
              results.validAriaAttributes++;
            } else {
              results.invalidAriaAttributes++;
              results.issues.push(`Invalid value "${value}" for ${name}`);
            }
            break;
          default:
            if (value.trim().length > 0) {
              results.validAriaAttributes++;
            } else {
              results.invalidAriaAttributes++;
              results.issues.push(`Empty value for ${name}`);
            }
        }
      }
    }
  }
  
  // Check for missing labels on interactive elements
  const interactiveElements = await page.locator('button, input, select, textarea, a[href]').all();
  
  for (const element of interactiveElements) {
    const hasLabel = await element.evaluate(el => {
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      const id = el.getAttribute('id');
      const textContent = el.textContent?.trim();
      
      // Check for explicit label
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) return true;
      }
      
      // Check for ARIA labels
      if (ariaLabel || ariaLabelledBy) return true;
      
      // Check for text content (for buttons and links)
      if ((el.tagName === 'BUTTON' || el.tagName === 'A') && textContent) return true;
      
      // Check for wrapping label
      const wrappingLabel = el.closest('label');
      if (wrappingLabel) return true;
      
      return false;
    });
    
    if (!hasLabel) {
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const type = await element.getAttribute('type');
      const id = await element.getAttribute('id');
      
      if (type !== 'hidden') {
        results.missingLabels.push(`${tagName}${type ? `[type="${type}"]` : ''}${id ? `#${id}` : ''}`);
      }
    }
  }
  
  return results;
}

/**
 * Check heading hierarchy on a page
 */
export async function checkHeadingHierarchy(page: Page) {
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  
  const headingData = [];
  let previousLevel = 0;
  const issues: string[] = [];
  let hasH1 = false;
  
  for (const heading of headings) {
    const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
    const level = parseInt(tagName.charAt(1));
    const text = await heading.textContent();
    
    if (level === 1) {
      hasH1 = true;
    }
    
    if (!text?.trim()) {
      issues.push(`Empty ${tagName} heading found`);
    }
    
    if (level > previousLevel + 1 && previousLevel !== 0) {
      issues.push(`Heading level skipped from h${previousLevel} to h${level}`);
    }
    
    headingData.push({
      level,
      text: text?.trim() || '',
      tagName
    });
    
    previousLevel = level;
  }
  
  if (!hasH1 && headings.length > 0) {
    issues.push('Page should have exactly one h1 heading');
  }
  
  return {
    headings: headingData,
    hasValidHierarchy: issues.length === 0,
    issues
  };
}

/**
 * Test modal dialog accessibility
 */
export async function testModalAccessibility(page: Page, triggerSelector: string) {
  // Open modal
  await page.click(triggerSelector);
  await page.waitForTimeout(500);
  
  const modal = page.locator('[role="dialog"], .modal, .MuiDialog-root').first();
  
  if (!(await modal.isVisible())) {
    throw new Error('Modal not found or not visible');
  }
  
  const results = {
    hasDialogRole: false,
    hasAriaModal: false,
    hasLabel: false,
    trapsFocus: false,
    escapable: false,
    issues: [] as string[]
  };
  
  // Check dialog role
  const role = await modal.getAttribute('role');
  results.hasDialogRole = role === 'dialog';
  if (!results.hasDialogRole) {
    results.issues.push('Modal should have role="dialog"');
  }
  
  // Check aria-modal
  const ariaModal = await modal.getAttribute('aria-modal');
  results.hasAriaModal = ariaModal === 'true';
  if (!results.hasAriaModal) {
    results.issues.push('Modal should have aria-modal="true"');
  }
  
  // Check for label
  const ariaLabel = await modal.getAttribute('aria-label');
  const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
  results.hasLabel = !!(ariaLabel || ariaLabelledBy);
  if (!results.hasLabel) {
    results.issues.push('Modal should have aria-label or aria-labelledby');
  }
  
  // Test escape key
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  results.escapable = !(await modal.isVisible());
  
  if (!results.escapable) {
    results.issues.push('Modal should close with Escape key');
    // Re-open modal for further testing
    await page.click(triggerSelector);
    await page.waitForTimeout(500);
  }
  
  return results;
}

/**
 * Simple color contrast calculation
 */
async function calculateContrastRatio(foreground: string, background: string): Promise<number> {
  // This is a simplified implementation
  // In a real scenario, you'd want a more robust color parsing and contrast calculation
  
  const getLuminance = (color: string): number => {
    // Simple RGB extraction (works for rgb() format)
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return 0.5; // Default for unparseable colors
    
    const [, r, g, b] = rgbMatch.map(Number);
    
    // Convert to relative luminance
    const sRGB = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Wait for accessibility tree to be ready
 */
export async function waitForAccessibilityTree(page: Page, timeout = 5000) {
  await page.waitForFunction(
    () => {
      // Check if accessibility tree is ready by verifying common ARIA attributes are processed
      const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
      return elementsWithAria.length > 0;
    },
    { timeout }
  );
}
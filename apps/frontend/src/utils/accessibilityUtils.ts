// @ts-nocheck
/**
 * Utility functions for accessibility testing and validation
 * Following WCAG 2.1 guidelines
 */

export interface ColorContrastResult {
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  isLargeText: boolean;
  passes: boolean;
}

export interface FocusManagementResult {
  hasFocusableElements: boolean;
  focusableElements: Element[];
  hasTabOrder: boolean;
  hasFocusTrap: boolean;
  focusTraps: Element[];
}

/**
 * Calculate color contrast ratio between two colors
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
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
 * Check color contrast compliance for an element
 */
export function checkColorContrast(element: Element): ColorContrastResult {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;
  const fontSize = parseFloat(styles.fontSize);
  const fontWeight = styles.fontWeight;

  // Convert RGB to hex (simplified)
  const rgbToHex = (rgb: string): string => {
    const result = rgb.match(/\d+/g);
    if (!result) return '#000000';
    return '#' + result.map(x => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const fgColor = rgbToHex(color);
  const bgColor = rgbToHex(backgroundColor);
  
  const ratio = calculateContrastRatio(fgColor, bgColor);
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === 'bold');

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

  return {
    ratio,
    level,
    isLargeText,
    passes
  };
}

/**
 * Find all focusable elements within a container
 */
export function findFocusableElements(container: Element = document.body): Element[] {
  const focusableSelectors = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    '[contenteditable="true"]:not([tabindex="-1"])',
    'audio[controls]:not([tabindex="-1"])',
    'video[controls]:not([tabindex="-1"])',
    'details:not([tabindex="-1"])',
    'summary:not([tabindex="-1"])'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors))
    .filter(element => {
      // Check if element is visible
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
}

/**
 * Check focus management for a container
 */
export function checkFocusManagement(container: Element = document.body): FocusManagementResult {
  const focusableElements = findFocusableElements(container);
  const hasFocusableElements = focusableElements.length > 0;

  // Check tab order
  const hasTabOrder = focusableElements.every((element, index) => {
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex === null) return true;
    const numericTabIndex = parseInt(tabIndex);
    return numericTabIndex >= 0;
  });

  // Find potential focus traps
  const focusTraps = Array.from(container.querySelectorAll('[role="dialog"], .modal, .popup'))
    .filter(element => {
      const trapElements = findFocusableElements(element);
      return trapElements.length > 0;
    });

  const hasFocusTrap = focusTraps.length > 0;

  return {
    hasFocusableElements,
    focusableElements,
    hasTabOrder,
    hasFocusTrap,
    focusTraps
  };
}

/**
 * Check if an element has proper ARIA labeling
 */
export function checkAriaLabeling(element: Element): {
  hasLabel: boolean;
  labelType: 'aria-label' | 'aria-labelledby' | 'text-content' | 'none';
  labelValue: string | null;
  hasDescription: boolean;
  descriptionValue: string | null;
} {
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const ariaDescribedBy = element.getAttribute('aria-describedby');
  const textContent = element.textContent?.trim();

  let hasLabel = false;
  let labelType: 'aria-label' | 'aria-labelledby' | 'text-content' | 'none' = 'none';
  let labelValue: string | null = null;

  if (ariaLabel) {
    hasLabel = true;
    labelType = 'aria-label';
    labelValue = ariaLabel;
  } else if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) {
      hasLabel = true;
      labelType = 'aria-labelledby';
      labelValue = labelElement.textContent?.trim() || null;
    }
  } else if (textContent) {
    hasLabel = true;
    labelType = 'text-content';
    labelValue = textContent;
  }

  const hasDescription = !!ariaDescribedBy;
  let descriptionValue: string | null = null;
  if (ariaDescribedBy) {
    const descElement = document.getElementById(ariaDescribedBy);
    descriptionValue = descElement?.textContent?.trim() || null;
  }

  return {
    hasLabel,
    labelType,
    labelValue,
    hasDescription,
    descriptionValue
  };
}

/**
 * Check heading hierarchy
 */
export function checkHeadingHierarchy(container: Element = document.body): {
  isValid: boolean;
  headings: Array<{
    element: Element;
    level: number;
    text: string;
    isValid: boolean;
    issues: string[];
  }>;
  issues: string[];
} {
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const issues: string[] = [];
  let lastLevel = 0;
  let hasH1 = false;

  const headingData = headings.map((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent?.trim() || '';
    const elementIssues: string[] = [];

    if (level === 1) {
      hasH1 = true;
      if (index > 0) {
        elementIssues.push('H1 should be the first heading');
      }
    }

    if (level > lastLevel + 1 && lastLevel !== 0) {
      elementIssues.push(`Heading level skipped from H${lastLevel} to H${level}`);
    }

    if (!text) {
      elementIssues.push('Heading is empty');
    }

    lastLevel = level;

    return {
      element: heading,
      level,
      text,
      isValid: elementIssues.length === 0,
      issues: elementIssues
    };
  });

  if (!hasH1 && headings.length > 0) {
    issues.push('Page should have exactly one H1 heading');
  }

  const isValid = issues.length === 0 && headingData.every(h => h.isValid);

  return {
    isValid,
    headings: headingData,
    issues
  };
}

/**
 * Check for keyboard traps
 */
export function checkKeyboardTraps(container: Element = document.body): {
  hasTraps: boolean;
  traps: Array<{
    element: Element;
    type: 'modal' | 'dropdown' | 'menu' | 'custom';
    hasFocusTrap: boolean;
    hasEscapeMethod: boolean;
  }>;
} {
  const modalElements = Array.from(container.querySelectorAll('[role="dialog"], .modal, .popup'));
  const dropdownElements = Array.from(container.querySelectorAll('[role="menu"], [role="listbox"], .dropdown'));
  
  const traps = [...modalElements, ...dropdownElements].map(element => {
    const focusableElements = findFocusableElements(element);
    const hasFocusTrap = focusableElements.length > 0;
    
    // Check for escape methods
    const hasCloseButton = element.querySelector('[aria-label*="close"], [aria-label*="Close"], .close-button');
    const hasEscapeKeyHandler = element.hasAttribute('data-dismiss') || element.hasAttribute('data-bs-dismiss');
    const hasEscapeMethod = !!(hasCloseButton || hasEscapeKeyHandler);

    let type: 'modal' | 'dropdown' | 'menu' | 'custom';
    if (element.getAttribute('role') === 'dialog' || element.classList.contains('modal')) {
      type = 'modal';
    } else if (element.getAttribute('role') === 'menu') {
      type = 'menu';
    } else if (element.classList.contains('dropdown') || element.getAttribute('role') === 'listbox') {
      type = 'dropdown';
    } else {
      type = 'custom';
    }

    return {
      element,
      type,
      hasFocusTrap,
      hasEscapeMethod
    };
  });

  return {
    hasTraps: traps.length > 0,
    traps
  };
}

/**
 * Validate ARIA attributes
 */
export function validateAriaAttributes(element: Element): {
  isValid: boolean;
  issues: string[];
  validAttributes: string[];
  invalidAttributes: string[];
} {
  const ariaAttributes = Array.from(element.attributes)
    .filter(attr => attr.name.startsWith('aria-'))
    .map(attr => attr.name);

  const validAriaAttributes = [
    'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
    'aria-expanded', 'aria-pressed', 'aria-checked', 'aria-selected',
    'aria-disabled', 'aria-required', 'aria-invalid', 'aria-live',
    'aria-atomic', 'aria-relevant', 'aria-busy', 'aria-controls',
    'aria-owns', 'aria-flowto', 'aria-activedescendant', 'aria-orientation',
    'aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext',
    'aria-level', 'aria-posinset', 'aria-setsize', 'aria-sort',
    'aria-readonly', 'aria-multiline', 'aria-multiselectable',
    'aria-autocomplete', 'aria-haspopup', 'aria-current'
  ];

  const validAttributes = ariaAttributes.filter(attr => 
    validAriaAttributes.includes(attr)
  );

  const invalidAttributes = ariaAttributes.filter(attr => 
    !validAriaAttributes.includes(attr)
  );

  const issues: string[] = [];

  // Check for common ARIA issues
  const ariaHidden = element.getAttribute('aria-hidden');
  if (ariaHidden === 'true' && findFocusableElements(element).length > 0) {
    issues.push('Element with aria-hidden="true" contains focusable children');
  }

  const ariaExpanded = element.getAttribute('aria-expanded');
  if (ariaExpanded && !['true', 'false'].includes(ariaExpanded)) {
    issues.push('aria-expanded must be "true" or "false"');
  }

  const ariaPressed = element.getAttribute('aria-pressed');
  if (ariaPressed && !['true', 'false', 'mixed'].includes(ariaPressed)) {
    issues.push('aria-pressed must be "true", "false", or "mixed"');
  }

  if (invalidAttributes.length > 0) {
    issues.push(`Invalid ARIA attributes: ${invalidAttributes.join(', ')}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    validAttributes,
    invalidAttributes
  };
}

/**
 * Generate accessibility report for an element or page
 */
export function generateAccessibilityReport(container: Element = document.body): {
  overall: {
    score: number;
    level: 'A' | 'AA' | 'AAA' | 'fail';
    passedChecks: number;
    totalChecks: number;
  };
  colorContrast: {
    passed: number;
    failed: number;
    elements: Array<{ element: Element; result: ColorContrastResult }>;
  };
  focusManagement: FocusManagementResult;
  headingHierarchy: ReturnType<typeof checkHeadingHierarchy>;
  keyboardTraps: ReturnType<typeof checkKeyboardTraps>;
  ariaLabeling: {
    totalElements: number;
    labeledElements: number;
    unlabeledElements: Element[];
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: Element[];
  };
  recommendations: string[];
} {
  // Color contrast check
  const textElements = Array.from(container.querySelectorAll('p, span, div, a, button, label, h1, h2, h3, h4, h5, h6'));
  const contrastResults = textElements.map(el => ({
    element: el,
    result: checkColorContrast(el)
  }));
  
  const passedContrast = contrastResults.filter(r => r.result.passes).length;
  const failedContrast = contrastResults.filter(r => !r.result.passes).length;

  // Focus management
  const focusManagement = checkFocusManagement(container);

  // Heading hierarchy
  const headingHierarchy = checkHeadingHierarchy(container);

  // Keyboard traps
  const keyboardTraps = checkKeyboardTraps(container);

  // ARIA labeling
  const interactiveElements = Array.from(container.querySelectorAll('button, input, select, textarea, a'));
  const labelingResults = interactiveElements.map(el => checkAriaLabeling(el));
  const labeledElements = labelingResults.filter(r => r.hasLabel).length;
  const unlabeledElements = interactiveElements.filter((_, i) => !labelingResults[i].hasLabel);

  // Images
  const images = Array.from(container.querySelectorAll('img'));
  const imagesWithAlt = images.filter(img => img.getAttribute('alt') !== null);
  const imagesWithoutAlt = images.filter(img => img.getAttribute('alt') === null);

  // Calculate overall score
  const checks = [
    { passed: passedContrast > failedContrast, weight: 2 },
    { passed: focusManagement.hasFocusableElements && focusManagement.hasTabOrder, weight: 2 },
    { passed: headingHierarchy.isValid, weight: 1 },
    { passed: !keyboardTraps.hasTraps || keyboardTraps.traps.every(t => t.hasEscapeMethod), weight: 2 },
    { passed: labeledElements > unlabeledElements.length, weight: 2 },
    { passed: imagesWithAlt.length === images.length, weight: 1 }
  ];

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const passedWeight = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  const score = Math.round((passedWeight / totalWeight) * 100);

  let level: 'A' | 'AA' | 'AAA' | 'fail';
  if (score >= 95) level = 'AAA';
  else if (score >= 80) level = 'AA';
  else if (score >= 60) level = 'A';
  else level = 'fail';

  // Generate recommendations
  const recommendations: string[] = [];
  if (failedContrast > 0) {
    recommendations.push(`Improve color contrast for ${failedContrast} elements`);
  }
  if (unlabeledElements.length > 0) {
    recommendations.push(`Add ARIA labels to ${unlabeledElements.length} interactive elements`);
  }
  if (imagesWithoutAlt.length > 0) {
    recommendations.push(`Add alt text to ${imagesWithoutAlt.length} images`);
  }
  if (!headingHierarchy.isValid) {
    recommendations.push('Fix heading hierarchy structure');
  }
  if (keyboardTraps.hasTraps) {
    recommendations.push('Ensure all keyboard traps have escape methods');
  }

  return {
    overall: {
      score,
      level,
      passedChecks: checks.filter(c => c.passed).length,
      totalChecks: checks.length
    },
    colorContrast: {
      passed: passedContrast,
      failed: failedContrast,
      elements: contrastResults
    },
    focusManagement,
    headingHierarchy,
    keyboardTraps,
    ariaLabeling: {
      totalElements: interactiveElements.length,
      labeledElements,
      unlabeledElements
    },
    images: {
      total: images.length,
      withAlt: imagesWithAlt.length,
      withoutAlt: imagesWithoutAlt
    },
    recommendations
  };
}
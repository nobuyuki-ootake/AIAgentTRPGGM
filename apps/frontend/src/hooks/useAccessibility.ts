import { useEffect, useState, useCallback, useRef } from 'react';

interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary?: string;
  }>;
}

interface AccessibilityHookOptions {
  /** Whether to automatically check on mount */
  autoCheck?: boolean;
  /** Element to monitor for changes */
  targetElement?: Element | null;
  /** Debounce delay for checks in ms */
  debounceDelay?: number;
  /** Whether to check on DOM mutations */
  watchMutations?: boolean;
}

interface AccessibilityState {
  violations: AccessibilityViolation[];
  isChecking: boolean;
  lastChecked: Date | null;
  hasViolations: boolean;
  violationCount: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
}

/**
 * Hook for accessibility testing and monitoring
 */
export const useAccessibility = (options: AccessibilityHookOptions = {}) => {
  const {
    autoCheck = false,
    targetElement,
    debounceDelay = 500,
    watchMutations = false
  } = options;

  const [state, setState] = useState<AccessibilityState>({
    violations: [],
    isChecking: false,
    lastChecked: null,
    hasViolations: false,
    violationCount: 0,
    criticalCount: 0,
    seriousCount: 0,
    moderateCount: 0,
    minorCount: 0
  });

  const debounceRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<MutationObserver>();

  const checkAccessibility = useCallback(async (element?: Element) => {
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      const targetEl = element || targetElement || document.body;
      
      // In a real implementation, this would use axe-core
      // For now, we'll use our simulation
      const violations = await simulateAccessibilityCheck(targetEl);
      
      const violationCounts = violations.reduce(
        (acc, violation) => {
          acc[`${violation.impact}Count`]++;
          return acc;
        },
        { criticalCount: 0, seriousCount: 0, moderateCount: 0, minorCount: 0 }
      );

      setState({
        violations,
        isChecking: false,
        lastChecked: new Date(),
        hasViolations: violations.length > 0,
        violationCount: violations.length,
        ...violationCounts
      });

      return violations;
    } catch (error) {
      console.error('Accessibility check failed:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      return [];
    }
  }, [targetElement]);

  const debouncedCheck = useCallback((element?: Element) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      checkAccessibility(element);
    }, debounceDelay);
  }, [checkAccessibility, debounceDelay]);

  // Auto-check on mount
  useEffect(() => {
    if (autoCheck) {
      checkAccessibility();
    }
  }, [autoCheck, checkAccessibility]);

  // Watch for DOM mutations
  useEffect(() => {
    if (!watchMutations || !targetElement) return;

    const observer = new MutationObserver(() => {
      debouncedCheck();
    });

    observer.observe(targetElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'alt', 'role']
    });

    observerRef.current = observer;

    return () => {
      observer.disconnect();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [watchMutations, targetElement, debouncedCheck]);

  return {
    ...state,
    checkAccessibility,
    debouncedCheck
  };
};

/**
 * Hook for keyboard navigation testing
 */
export const useKeyboardNavigation = () => {
  const [focusableElements, setFocusableElements] = useState<Element[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);

  const findFocusableElements = useCallback((container?: Element) => {
    const element = container || document.body;
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = Array.from(element.querySelectorAll(focusableSelectors));
    setFocusableElements(elements);
    return elements;
  }, []);

  const simulateTabNavigation = useCallback(() => {
    const elements = findFocusableElements();
    let index = 0;
    
    const focusNext = () => {
      if (index < elements.length) {
        (elements[index] as HTMLElement).focus();
        setCurrentFocusIndex(index);
        index++;
        setTimeout(focusNext, 1000); // Simulate 1 second between focuses
      }
    };

    focusNext();
  }, [findFocusableElements]);

  const checkTabOrder = useCallback((container?: Element) => {
    const elements = findFocusableElements(container);
    const tabIndexValues = elements.map(el => ({
      element: el,
      tabIndex: el.getAttribute('tabindex') || '0'
    }));

    return tabIndexValues.sort((a, b) => {
      const aIndex = parseInt(a.tabIndex);
      const bIndex = parseInt(b.tabIndex);
      
      if (aIndex === 0 && bIndex === 0) return 0;
      if (aIndex === 0) return 1;
      if (bIndex === 0) return -1;
      return aIndex - bIndex;
    });
  }, [findFocusableElements]);

  return {
    focusableElements,
    currentFocusIndex,
    findFocusableElements,
    simulateTabNavigation,
    checkTabOrder
  };
};

/**
 * Hook for screen reader testing
 */
export const useScreenReader = () => {
  const [isScreenReaderDetected, setIsScreenReaderDetected] = useState(false);

  useEffect(() => {
    // Detect if screen reader is potentially active
    const detectScreenReader = () => {
      // Check for reduced motion preference (often used by screen reader users)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Check for high contrast mode
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      // Check for forced colors mode
      const forcedColors = window.matchMedia('(forced-colors: active)').matches;

      setIsScreenReaderDetected(prefersReducedMotion || prefersHighContrast || forcedColors);
    };

    detectScreenReader();

    // Listen for changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(forced-colors: active)')
    ];

    mediaQueries.forEach(mq => mq.addEventListener('change', detectScreenReader));

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', detectScreenReader));
    };
  }, []);

  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  const checkAriaLabels = useCallback((container?: Element) => {
    const element = container || document.body;
    const elementsWithAriaLabels = element.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
    
    const results = Array.from(elementsWithAriaLabels).map(el => ({
      element: el,
      ariaLabel: el.getAttribute('aria-label'),
      ariaLabelledBy: el.getAttribute('aria-labelledby'),
      ariaDescribedBy: el.getAttribute('aria-describedby'),
      hasValidLabel: !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'))
    }));

    return results;
  }, []);

  return {
    isScreenReaderDetected,
    announceToScreenReader,
    checkAriaLabels
  };
};

// Simulated accessibility check function
async function simulateAccessibilityCheck(element: Element): Promise<AccessibilityViolation[]> {
  const violations: AccessibilityViolation[] = [];

  // Check for missing alt text
  const images = element.querySelectorAll('img:not([alt])');
  if (images.length > 0) {
    violations.push({
      id: 'image-alt',
      impact: 'serious',
      description: 'Images must have alternate text',
      help: 'Ensures <img> elements have alternate text or a role of none or presentation',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
      nodes: Array.from(images).map((img, index) => ({
        html: img.outerHTML,
        target: [`img:nth-of-type(${index + 1})`],
        failureSummary: 'Fix this: Element does not have an alt attribute'
      }))
    });
  }

  // Check for buttons without accessible names
  const unlabeledButtons = element.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
  const problematicButtons = Array.from(unlabeledButtons).filter(button => 
    !button.textContent?.trim()
  );
  
  if (problematicButtons.length > 0) {
    violations.push({
      id: 'button-name',
      impact: 'critical',
      description: 'Buttons must have discernible text',
      help: 'Ensures buttons have discernible text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/button-name',
      nodes: problematicButtons.map((button, index) => ({
        html: button.outerHTML,
        target: [`button:nth-of-type(${index + 1})`],
        failureSummary: 'Fix this: Element does not have inner text that is visible to screen readers'
      }))
    });
  }

  // Check for missing form labels
  const inputs = element.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
  const unlabeledInputs = Array.from(inputs).filter(input => {
    const id = input.getAttribute('id');
    const hasLabel = id && element.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
    
    return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
  });

  if (unlabeledInputs.length > 0) {
    violations.push({
      id: 'label',
      impact: 'critical',
      description: 'Form elements must have labels',
      help: 'Ensures every form element has a label',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
      nodes: unlabeledInputs.map((input, index) => ({
        html: input.outerHTML,
        target: [`input:nth-of-type(${index + 1})`],
        failureSummary: 'Fix this: Form element does not have an implicit (wrapped) or explicit (associated) label'
      }))
    });
  }

  return violations;
}
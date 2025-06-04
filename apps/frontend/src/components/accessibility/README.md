# Accessibility Testing Components

This directory contains comprehensive accessibility testing tools for the TRPG AI GM application, designed to ensure WCAG 2.1 AA compliance and provide an inclusive experience for all users.

## Components

### AccessibilityChecker

A runtime accessibility validation component that uses axe-core to check for accessibility violations.

```tsx
import { AccessibilityChecker } from '../components/accessibility';

// Basic usage
<AccessibilityChecker autoCheck={true} showResults={true} />

// Advanced usage
<AccessibilityChecker 
  autoCheck={false}
  showResults={true}
  targetElement={document.getElementById('my-component')}
  onViolationsFound={(violations) => console.log(violations)}
/>
```

**Props:**
- `autoCheck`: Whether to run checks automatically on mount
- `showResults`: Whether to show the results panel
- `onViolationsFound`: Callback when violations are found
- `targetElement`: Element to check, defaults to document.body

### AccessibilityTestPanel

A comprehensive testing panel for developers to analyze and test accessibility features in real-time.

```tsx
import { AccessibilityTestPanel } from '../components/accessibility';

<AccessibilityTestPanel 
  defaultOpen={true}
  position="fixed"
  targetElement={myElement}
/>
```

**Features:**
- Overview tab with quick accessibility check
- Keyboard navigation testing
- Screen reader compatibility testing  
- Visual accessibility analysis
- Full accessibility reporting

## Hooks

### useAccessibility

Hook for accessibility testing and monitoring with automatic violation detection.

```tsx
import { useAccessibility } from '../hooks/useAccessibility';

const {
  violations,
  isChecking,
  hasViolations,
  violationCount,
  checkAccessibility
} = useAccessibility({
  autoCheck: true,
  targetElement: myRef.current,
  watchMutations: true
});
```

### useKeyboardNavigation

Hook for testing keyboard navigation and focus management.

```tsx
import { useKeyboardNavigation } from '../hooks/useAccessibility';

const {
  focusableElements,
  simulateTabNavigation,
  checkTabOrder
} = useKeyboardNavigation();
```

### useScreenReader

Hook for screen reader testing and announcements.

```tsx
import { useScreenReader } from '../hooks/useAccessibility';

const {
  isScreenReaderDetected,
  announceToScreenReader,
  checkAriaLabels
} = useScreenReader();
```

## Utility Functions

### generateAccessibilityReport

Generates a comprehensive accessibility report for an element or page.

```tsx
import { generateAccessibilityReport } from '../utils/accessibilityUtils';

const report = generateAccessibilityReport(document.body);
console.log(`Score: ${report.overall.score}%`);
console.log(`Level: ${report.overall.level}`);
```

### checkColorContrast

Validates color contrast ratios against WCAG standards.

```tsx
import { checkColorContrast } from '../utils/accessibilityUtils';

const result = checkColorContrast(element);
console.log(`Contrast ratio: ${result.ratio}`);
console.log(`Passes WCAG: ${result.passes}`);
```

## E2E Testing

### Playwright Accessibility Tests

Located in `e2e/accessibility/`, these tests provide comprehensive accessibility validation:

- **accessibility-core.spec.ts**: Core axe-core accessibility tests for all pages
- **keyboard-navigation.spec.ts**: Keyboard accessibility and navigation tests
- **screen-reader.spec.ts**: Screen reader compatibility tests
- **trpg-specific.spec.ts**: TRPG-specific component accessibility tests
- **dice-accessibility.spec.ts**: Dice component accessibility validation

### Running Accessibility Tests

```bash
# Run all accessibility tests
npm run test:accessibility

# Run with UI mode
npm run test:accessibility:headed

# Run specific test file
npx playwright test e2e/accessibility/accessibility-core.spec.ts
```

### Test Utilities

The `e2e/utils/accessibility-helpers.ts` file provides utility functions for accessibility testing:

```tsx
import { runAccessibilityTest, checkKeyboardNavigation } from '../utils/accessibility-helpers';

// Run axe scan
const results = await runAccessibilityTest({ 
  page, 
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'] 
});

// Test keyboard navigation
const navResults = await checkKeyboardNavigation(page);
```

## WCAG 2.1 Compliance

This implementation ensures compliance with WCAG 2.1 Level AA standards:

### Level A Requirements ✅
- Images have alt text
- Form elements have labels
- Heading hierarchy is logical
- Focus is visible and manageable
- Content is keyboard accessible

### Level AA Requirements ✅
- Color contrast meets 4.5:1 ratio for normal text
- Color contrast meets 3:1 ratio for large text
- Text can be resized up to 200%
- Content reflows properly at different zoom levels
- Focus indicators are clearly visible

### Level AAA Enhancements ✅
- Enhanced color contrast (7:1 for normal text)
- Additional keyboard shortcuts
- Enhanced error handling and recovery
- Comprehensive ARIA implementation

## TRPG-Specific Accessibility Features

### Dice Rolling Accessibility
- Dice buttons have clear accessible names
- Roll results are announced to screen readers via `aria-live` regions
- Keyboard activation with Enter and Space keys
- Support for reduced motion preferences in animations

### Character Sheet Accessibility
- Form fields properly labeled with context
- Stat blocks use semantic table structure with headers
- Error states clearly communicated
- Progressive enhancement for complex interactions

### Timeline Accessibility
- Events have semantic structure (`role="article"`)
- Chronological navigation with keyboard
- Clear labeling of time periods and events
- Alternative text for visual timeline elements

### Session Interface Accessibility
- Chat messages announced as they arrive
- Dice roll results integrated into chat flow
- Turn order clearly indicated
- Status changes announced appropriately

## Best Practices

### 1. Always Provide Labels
```tsx
// Good
<TextField
  id="character-name"
  label="Character Name"
  helperText="Enter your character's name"
/>

// Better with ARIA
<TextField
  id="character-name"
  label="Character Name"
  aria-describedby="character-name-helper"
  helperText="Enter your character's name"
/>
```

### 2. Use Live Regions for Dynamic Content
```tsx
// Dice roll results
<div 
  role="status" 
  aria-live="polite"
  aria-atomic="true"
>
  {diceResult && `Rolled d20: ${diceResult}`}
</div>
```

### 3. Provide Keyboard Alternatives
```tsx
// Button with multiple activation methods
<Button 
  onClick={rollDice}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      rollDice();
    }
  }}
>
  Roll Dice
</Button>
```

### 4. Use Semantic HTML
```tsx
// Character stats table
<table>
  <caption>Character Statistics</caption>
  <thead>
    <tr>
      <th scope="col">Ability</th>
      <th scope="col">Score</th>
      <th scope="col">Modifier</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Strength</th>
      <td>16</td>
      <td>+3</td>
    </tr>
  </tbody>
</table>
```

### 5. Handle Focus Management
```tsx
// Modal focus management
useEffect(() => {
  if (isOpen) {
    const firstFocusable = modalRef.current?.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    firstFocusable?.focus();
  }
}, [isOpen]);
```

## Testing Checklist

### Manual Testing
- [ ] Navigate entire interface using only keyboard
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify focus indicators are visible
- [ ] Check color contrast in all themes
- [ ] Test with 200% zoom level
- [ ] Verify reduced motion preferences

### Automated Testing
- [ ] Run axe-core accessibility scans
- [ ] Execute Playwright accessibility tests
- [ ] Validate ARIA implementation
- [ ] Check semantic HTML structure
- [ ] Test keyboard navigation flows

### TRPG-Specific Testing
- [ ] Dice rolling with keyboard and screen reader
- [ ] Character sheet navigation and editing
- [ ] Timeline event management accessibility
- [ ] Session chat and interaction accessibility
- [ ] Modal dialog accessibility (character creation, etc.)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Axe-core Rule Documentation](https://dequeuniversity.com/rules/axe/)
- [Material-UI Accessibility Guide](https://mui.com/material-ui/guides/accessibility/)

## Contributing

When adding new components or features:

1. Include accessibility considerations from the design phase
2. Add appropriate ARIA attributes and semantic HTML
3. Write corresponding accessibility tests
4. Update this documentation with new patterns
5. Test with real assistive technologies when possible

For questions or accessibility concerns, refer to the WCAG 2.1 guidelines or consult with accessibility experts.
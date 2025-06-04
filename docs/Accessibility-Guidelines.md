# TRPG Application - Accessibility Guidelines

## Document Overview

This document provides comprehensive accessibility guidelines for the TRPG application, ensuring compliance with WCAG 2.1 AA standards and creating an inclusive experience for users with disabilities.

## Table of Contents

1. [Accessibility Principles](#accessibility-principles)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Reader Support](#screen-reader-support)
4. [Visual Accessibility](#visual-accessibility)
5. [Motor Accessibility](#motor-accessibility)
6. [Cognitive Accessibility](#cognitive-accessibility)
7. [Implementation Guidelines](#implementation-guidelines)
8. [Testing Procedures](#testing-procedures)

---

## Accessibility Principles

### WCAG 2.1 Compliance

The application follows the four main principles of accessibility:

#### 1. Perceivable
- Information and UI components must be presentable in ways users can perceive
- Text alternatives for images and media
- Captions and transcripts for audio/video content
- Sufficient color contrast ratios
- Resizable text without loss of functionality

#### 2. Operable
- Interface components and navigation must be operable
- Keyboard accessibility for all functionality
- No seizure-inducing content
- Sufficient time for users to read content
- Help users navigate and find content

#### 3. Understandable
- Information and operation of UI must be understandable
- Readable and understandable text
- Predictable functionality
- Input assistance and error prevention

#### 4. Robust
- Content must be robust enough for various assistive technologies
- Valid, semantic HTML
- Compatible with current and future assistive technologies

---

## Keyboard Navigation

### Global Keyboard Shortcuts

```
Navigation Shortcuts:
├── Tab                 → Move forward through interactive elements
├── Shift+Tab          → Move backward through interactive elements
├── Enter              → Activate buttons, links, and form controls
├── Space              → Activate buttons and checkboxes
├── Escape             → Close dialogs, menus, and cancel operations
├── Arrow Keys         → Navigate within components (lists, menus, tabs)
├── Home               → Move to first item in lists/menus
├── End                → Move to last item in lists/menus
├── Page Up/Down       → Scroll content areas
└── F6                 → Cycle through main page regions
```

### Application-Specific Shortcuts

```
Campaign Management:
├── Ctrl+N             → New campaign
├── Ctrl+O             → Open campaign
├── Ctrl+S             → Save current work
├── Ctrl+Z             → Undo last action
├── Ctrl+Y             → Redo last action
└── F2                 → Rename selected item

Character Management:
├── Ctrl+N             → New character
├── Ctrl+D             → Duplicate character
├── Delete             → Delete selected character (with confirmation)
├── Ctrl+1-6           → Switch between character form tabs
└── Ctrl+Enter         → Save character form

Timeline Management:
├── Ctrl+N             → New event
├── Ctrl+E             → Edit selected event
├── Delete             → Delete selected event
├── Arrow Keys         → Navigate timeline grid
├── Space              → Select/deselect events
└── Ctrl+A             → Select all events

AI Chat:
├── Ctrl+/             → Toggle AI chat panel
├── Ctrl+Enter         → Send message
├── Ctrl+K             → Clear conversation
├── Ctrl+R             → Regenerate last response
└── Escape             → Close AI chat panel

Dice Rolling:
├── Ctrl+R             → Open dice roll dialog
├── Ctrl+Enter         → Execute roll
├── Escape             → Close dice dialog
└── R                  → Quick roll with last settings
```

### Focus Management

#### Focus Order
1. **Logical Tab Order**: Focus moves in reading order (left-to-right, top-to-bottom)
2. **Skip Links**: Provide skip-to-main-content links for screen reader users
3. **Focus Containment**: Focus trapped within modal dialogs
4. **Focus Restoration**: Return focus to triggering element when closing dialogs

#### Focus Indicators
```css
/* Focus indicators must be visible and high contrast */
.focusable:focus {
  outline: 2px solid #4285f4;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(66, 133, 244, 0.2);
}

/* Ensure focus indicators work in high contrast mode */
@media (prefers-contrast: high) {
  .focusable:focus {
    outline: 3px solid;
    outline-offset: 3px;
  }
}
```

### Keyboard Trap Management
- **Modal Dialogs**: Focus contained within dialog boundaries
- **Dropdown Menus**: Focus cycles within menu options
- **Form Sections**: Logical grouping with fieldsets
- **Escape Routes**: Always provide keyboard exit method

---

## Screen Reader Support

### Semantic HTML Structure

#### Landmark Regions
```html
<header role="banner">
  <nav role="navigation" aria-label="Main navigation">
    <!-- Navigation content -->
  </nav>
</header>

<main role="main">
  <section aria-labelledby="campaign-heading">
    <h1 id="campaign-heading">Campaign Management</h1>
    <!-- Main content -->
  </section>
</main>

<aside role="complementary" aria-label="AI Assistant">
  <!-- AI chat panel -->
</aside>

<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```

#### Heading Structure
```html
<!-- Proper heading hierarchy -->
<h1>TRPG Campaign Manager</h1>
  <h2>Character Management</h2>
    <h3>Character Creation</h3>
      <h4>Basic Information</h4>
      <h4>Ability Scores</h4>
    <h3>Character List</h3>
  <h2>Timeline Management</h2>
    <h3>Event Creation</h3>
    <h3>Event Timeline</h3>
```

### ARIA Labels and Descriptions

#### Form Labels
```html
<!-- All form controls must have labels -->
<label for="character-name">Character Name (Required)</label>
<input 
  id="character-name" 
  type="text" 
  required 
  aria-describedby="name-help"
>
<div id="name-help">
  Enter a unique name for your character (2-50 characters)
</div>
```

#### Complex Components
```html
<!-- Timeline grid with proper ARIA -->
<div 
  role="grid" 
  aria-label="Timeline Events"
  aria-describedby="timeline-help"
>
  <div role="row" aria-label="Day 1">
    <div 
      role="gridcell" 
      aria-label="Village Square, Day 1"
      tabindex="0"
    >
      <div role="button" aria-label="Goblin Attack Event">
        Goblin Attack
      </div>
    </div>
  </div>
</div>
```

#### Dice Rolling Interface
```html
<section aria-labelledby="dice-heading">
  <h3 id="dice-heading">Dice Rolling</h3>
  <button 
    aria-describedby="dice-help"
    aria-pressed="false"
  >
    Roll 1d20
  </button>
  <div id="dice-help" aria-live="polite">
    Last roll result will be announced here
  </div>
</section>
```

### Live Regions

#### Announcement Areas
```html
<!-- Status announcements -->
<div aria-live="polite" aria-label="Status updates" class="sr-only">
  <!-- Dynamically updated status messages -->
</div>

<!-- Urgent announcements -->
<div aria-live="assertive" aria-label="Important alerts" class="sr-only">
  <!-- Error messages and critical updates -->
</div>

<!-- Dice roll results -->
<div aria-live="polite" aria-label="Dice roll results">
  <!-- Roll results announced automatically -->
</div>
```

#### Dynamic Content Updates
```javascript
// Announce changes to screen readers
function announceToScreenReader(message, priority = 'polite') {
  const announcer = document.querySelector(`[aria-live="${priority}"]`);
  announcer.textContent = message;
  
  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = '';
  }, 1000);
}

// Usage examples
announceToScreenReader('Character saved successfully');
announceToScreenReader('Error: Character name is required', 'assertive');
announceToScreenReader('Rolled 1d20: 15 (total: 18 with modifier)');
```

### Screen Reader Testing

#### Common Screen Readers
- **NVDA** (Windows, Free)
- **JAWS** (Windows, Commercial)
- **VoiceOver** (macOS/iOS, Built-in)
- **TalkBack** (Android, Built-in)
- **Orca** (Linux, Free)

#### Testing Checklist
- [ ] All content is readable by screen reader
- [ ] Navigation is logical and predictable
- [ ] Form controls are properly labeled
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced
- [ ] Tables have proper headers
- [ ] Images have meaningful alt text

---

## Visual Accessibility

### Color and Contrast

#### Contrast Ratios
```css
/* WCAG AA Standard: 4.5:1 for normal text, 3:1 for large text */
.text-normal {
  color: #333333; /* 12.63:1 ratio on white background */
}

.text-secondary {
  color: #666666; /* 6.74:1 ratio on white background */
}

.link-default {
  color: #0066cc; /* 4.52:1 ratio on white background */
}

/* High contrast theme */
@media (prefers-contrast: high) {
  .text-normal { color: #000000; }
  .text-secondary { color: #000000; }
  .background { background: #ffffff; }
  .border { border-color: #000000; }
}
```

#### Color Independence
```css
/* Don't rely solely on color for meaning */
.error {
  color: #d32f2f;
  border-left: 4px solid #d32f2f;
}

.error::before {
  content: "⚠ ";
  font-weight: bold;
}

.success {
  color: #2e7d32;
  border-left: 4px solid #2e7d32;
}

.success::before {
  content: "✓ ";
  font-weight: bold;
}
```

### Typography and Readability

#### Font Choices
```css
/* Readable font stack */
body {
  font-family: 
    -apple-system, 
    BlinkMacSystemFont, 
    'Segoe UI', 
    Roboto, 
    'Helvetica Neue', 
    Arial, 
    sans-serif;
  line-height: 1.5;
  font-size: 16px; /* Minimum 16px base size */
}

/* Headings with appropriate scaling */
h1 { font-size: 2rem; line-height: 1.2; }
h2 { font-size: 1.5rem; line-height: 1.3; }
h3 { font-size: 1.25rem; line-height: 1.4; }
```

#### Responsive Text Scaling
```css
/* Support browser zoom up to 200% */
@media (max-width: 768px) {
  body { font-size: 18px; }
}

/* User preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Visual Indicators

#### Status Indicators
```html
<!-- Multi-modal status indicators -->
<div class="character-status">
  <span class="status-icon" aria-hidden="true">❤️</span>
  <span class="status-text">Healthy</span>
  <div class="status-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
    <div class="status-fill" style="width: 100%"></div>
  </div>
</div>
```

#### Loading States
```html
<div class="loading-container" aria-live="polite">
  <div class="spinner" aria-hidden="true"></div>
  <span class="loading-text">Loading character data...</span>
</div>
```

---

## Motor Accessibility

### Target Size Requirements

#### Touch Targets
```css
/* Minimum 44x44px touch targets */
.button, .link, .form-control {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Ensure adequate spacing between targets */
.button + .button {
  margin-left: 8px;
}
```

#### Click Areas
```css
/* Expand clickable areas */
.card-link {
  display: block;
  text-decoration: none;
  padding: 16px;
}

.card-link:hover, .card-link:focus {
  background-color: rgba(0, 0, 0, 0.04);
}
```

### Alternative Input Methods

#### Voice Control Support
```html
<!-- Voice-friendly labels -->
<button aria-label="Add new character">
  <span aria-hidden="true">+</span>
  <span class="sr-only">Add new character</span>
</button>

<!-- Clear action names -->
<button aria-label="Save character form">Save</button>
<button aria-label="Cancel character editing">Cancel</button>
```

#### Switch Navigation
```javascript
// Enhanced keyboard navigation for switch users
class SwitchNavigator {
  constructor() {
    this.scanTimeout = 2000; // 2 second default
    this.currentIndex = 0;
    this.focusableElements = [];
  }

  startScanning() {
    this.focusableElements = this.getFocusableElements();
    this.scan();
  }

  scan() {
    if (this.currentIndex < this.focusableElements.length) {
      this.highlightElement(this.focusableElements[this.currentIndex]);
      this.currentIndex++;
      setTimeout(() => this.scan(), this.scanTimeout);
    } else {
      this.currentIndex = 0;
      this.scan();
    }
  }

  select() {
    const currentElement = this.focusableElements[this.currentIndex - 1];
    if (currentElement) {
      currentElement.click();
    }
  }
}
```

### Timing and Timeouts

#### User Control Over Timing
```javascript
// Configurable timeouts
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const EXTENDED_TIMEOUT = 120000; // 2 minutes

class TimeoutManager {
  constructor(baseTimeout = DEFAULT_TIMEOUT) {
    this.timeout = this.getUserPreferredTimeout() || baseTimeout;
  }

  getUserPreferredTimeout() {
    return localStorage.getItem('preferred-timeout');
  }

  setUserPreferredTimeout(timeout) {
    localStorage.setItem('preferred-timeout', timeout);
    this.timeout = timeout;
  }

  createTimer(callback, customTimeout = null) {
    const timeoutDuration = customTimeout || this.timeout;
    return setTimeout(callback, timeoutDuration);
  }
}
```

---

## Cognitive Accessibility

### Clear Navigation and Structure

#### Consistent Layout
```html
<!-- Consistent page structure -->
<div class="page-layout">
  <header class="page-header">
    <!-- Consistent header across all pages -->
  </header>
  
  <nav class="page-navigation">
    <!-- Always in same location -->
  </nav>
  
  <main class="page-content">
    <h1 class="page-title"><!-- Clear page title --></h1>
    <!-- Page-specific content -->
  </main>
  
  <aside class="page-sidebar">
    <!-- Consistent sidebar tools -->
  </aside>
</div>
```

#### Breadcrumb Navigation
```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb">
    <li><a href="/home">Home</a></li>
    <li><a href="/characters">Characters</a></li>
    <li aria-current="page">New Character</li>
  </ol>
</nav>
```

### Help and Guidance

#### Contextual Help
```html
<!-- Help tooltips -->
<div class="form-field">
  <label for="armor-class">Armor Class</label>
  <input id="armor-class" type="number">
  <button 
    type="button" 
    aria-describedby="ac-help"
    class="help-button"
  >
    <span aria-hidden="true">?</span>
    <span class="sr-only">Help for Armor Class</span>
  </button>
  <div id="ac-help" class="help-tooltip" role="tooltip">
    Your Armor Class determines how hard you are to hit in combat. 
    Higher numbers are better.
  </div>
</div>
```

#### Progressive Disclosure
```html
<!-- Advanced options hidden by default -->
<section class="basic-options">
  <h3>Basic Character Information</h3>
  <!-- Essential fields only -->
</section>

<details class="advanced-options">
  <summary>Advanced Options</summary>
  <!-- Complex fields for experienced users -->
</details>
```

### Error Prevention and Recovery

#### Form Validation
```javascript
// Clear, helpful error messages
const errorMessages = {
  required: (field) => `${field} is required to continue`,
  minLength: (field, min) => `${field} must be at least ${min} characters`,
  maxLength: (field, max) => `${field} cannot exceed ${max} characters`,
  format: (field, format) => `${field} must be in ${format} format`,
  unique: (field) => `This ${field} is already taken. Please choose another.`
};

function validateField(field, value, rules) {
  const errors = [];
  
  rules.forEach(rule => {
    if (!rule.test(value)) {
      errors.push(errorMessages[rule.type](field, rule.param));
    }
  });
  
  return errors;
}
```

#### Confirmation Dialogs
```html
<!-- Clear confirmation for destructive actions -->
<dialog class="confirmation-dialog" role="alertdialog">
  <h2>Delete Character</h2>
  <p>
    Are you sure you want to delete "<strong>Aragorn</strong>"? 
    This action cannot be undone.
  </p>
  <div class="dialog-actions">
    <button type="button" class="cancel-button">
      Cancel (Keep Character)
    </button>
    <button type="button" class="danger-button">
      Delete Character
    </button>
  </div>
</dialog>
```

---

## Implementation Guidelines

### Component Development

#### Accessible Component Checklist
- [ ] Semantic HTML elements used appropriately
- [ ] ARIA labels and roles added where needed
- [ ] Keyboard navigation implemented
- [ ] Focus management handled correctly
- [ ] Color contrast meets WCAG standards
- [ ] Text alternatives provided for images
- [ ] Error messages are clear and helpful
- [ ] Component tested with screen reader

#### React Component Example
```jsx
// Accessible character card component
const CharacterCard = ({ character, onEdit, onDelete }) => {
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef(null);

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setShowDetails(!showDetails);
        break;
      case 'Escape':
        setShowDetails(false);
        break;
    }
  };

  return (
    <article 
      className="character-card"
      ref={cardRef}
      tabIndex={0}
      role="button"
      aria-expanded={showDetails}
      aria-describedby={`character-${character.id}-description`}
      onKeyDown={handleKeyDown}
    >
      <header className="character-header">
        <h3>{character.name}</h3>
        <span className="character-type">{character.type}</span>
      </header>
      
      <div 
        id={`character-${character.id}-description`}
        className="character-summary"
      >
        Level {character.level} {character.race} {character.class}
      </div>
      
      {showDetails && (
        <div className="character-details" role="region">
          <h4>Character Details</h4>
          {/* Detailed character information */}
        </div>
      )}
      
      <div className="character-actions">
        <button 
          onClick={onEdit}
          aria-label={`Edit ${character.name}`}
        >
          Edit
        </button>
        <button 
          onClick={onDelete}
          aria-label={`Delete ${character.name}`}
          className="danger-button"
        >
          Delete
        </button>
      </div>
    </article>
  );
};
```

### Testing Integration

#### Automated Testing
```javascript
// Accessibility test with @testing-library
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('character form is accessible', async () => {
  const { container } = render(<CharacterForm />);
  
  // Test for accessibility violations
  const results = await axe(container);
  expect(results).toHaveNoViolations();
  
  // Test keyboard navigation
  const nameInput = screen.getByLabelText('Character Name');
  expect(nameInput).toBeInTheDocument();
  expect(nameInput).toHaveAttribute('required');
  
  // Test focus management
  nameInput.focus();
  expect(nameInput).toHaveFocus();
});
```

#### Manual Testing Procedure
1. **Keyboard Navigation Test**
   - Disconnect mouse
   - Navigate entire application using only keyboard
   - Verify all functionality is accessible
   - Check focus indicators are visible

2. **Screen Reader Test**
   - Use NVDA or VoiceOver
   - Navigate through all pages
   - Verify content is properly announced
   - Test form completion workflow

3. **High Contrast Test**
   - Enable high contrast mode
   - Verify all content remains visible
   - Check focus indicators work properly

4. **Zoom Test**
   - Zoom browser to 200%
   - Verify layout remains usable
   - Check no content is cut off

---

## Testing Procedures

### Automated Testing Tools

#### ESLint Accessibility Plugin
```json
// .eslintrc.js
{
  "extends": ["plugin:jsx-a11y/recommended"],
  "plugins": ["jsx-a11y"],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error"
  }
}
```

#### Playwright Accessibility Tests
```javascript
// accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  
  expect(accessibilityScanResults.violations).toEqual([]);
});

test('character form should be keyboard navigable', async ({ page }) => {
  await page.goto('/characters/new');
  
  // Test tab navigation
  await page.keyboard.press('Tab');
  await expect(page.locator('[name="name"]')).toBeFocused();
  
  await page.keyboard.press('Tab');
  await expect(page.locator('[name="race"]')).toBeFocused();
});
```

### Manual Testing Checklist

#### Pre-Release Accessibility Audit
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Color contrast meets WCAG AA standards
- [ ] All images have appropriate alt text
- [ ] Form labels are properly associated
- [ ] Error messages are clear and helpful
- [ ] Page structure uses semantic HTML
- [ ] ARIA labels are used appropriately
- [ ] Screen reader testing completed
- [ ] High contrast mode verified
- [ ] 200% zoom testing completed
- [ ] Mobile accessibility verified

#### User Testing with Disabilities
- Recruit users with various disabilities
- Conduct usability testing sessions
- Gather feedback on pain points
- Iterate based on user feedback
- Document accessibility improvements

This comprehensive accessibility guide ensures the TRPG application is usable by all users, regardless of their abilities or the assistive technologies they use.
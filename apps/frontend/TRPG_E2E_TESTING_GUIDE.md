# 🎲 TRPG E2E Testing Framework Guide

This guide provides comprehensive information about the TRPG E2E testing framework, including setup, execution, and analysis.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Architecture](#test-architecture)
- [Getting Started](#getting-started)
- [Test Suites](#test-suites)
- [Running Tests](#running-tests)
- [Test Data Management](#test-data-management)
- [Performance Testing](#performance-testing)
- [Mobile Testing](#mobile-testing)
- [Accessibility Testing](#accessibility-testing)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🔍 Overview

The TRPG E2E testing framework is designed to comprehensively test the Tabletop Role-Playing Game (TRPG) application across all major workflows and user scenarios. It provides:

- **Comprehensive Coverage**: Tests all major TRPG workflows
- **Real-world Scenarios**: Simulates actual TRPG gaming sessions
- **Performance Monitoring**: Tracks application performance metrics
- **Cross-platform Testing**: Desktop, mobile, and tablet support
- **Accessibility Compliance**: WCAG 2.1 AA standards testing
- **AI Integration Testing**: Tests AI-powered features

## 🏗️ Test Architecture

### Directory Structure

```
e2e/
├── trpg-core/           # Core TRPG functionality tests
│   ├── campaign-management.spec.ts
│   ├── character-management.spec.ts
│   └── world-building.spec.ts
├── trpg-session/        # Session management tests
│   └── session-management.spec.ts
├── performance/         # Performance and load tests
│   └── performance-testing.spec.ts
├── mobile/              # Mobile-specific tests
│   └── mobile-trpg-experience.spec.ts
├── accessibility/       # Accessibility tests
│   └── *.spec.ts
├── utils/               # Test utilities and helpers
│   ├── trpg-test-helpers.ts
│   ├── test-reporting.ts
│   └── data-generators.ts
├── global-setup.ts      # Global test setup
└── global-teardown.ts   # Global test cleanup
```

### Test Projects Configuration

The framework uses Playwright's project configuration for different test types:

- **trpg-desktop**: Main desktop testing (1920x1080)
- **trpg-session**: Session-specific tests with dependencies
- **trpg-performance**: Performance benchmarking
- **trpg-mobile**: Mobile device testing (various viewports)
- **trpg-accessibility**: Accessibility compliance testing

## 🚀 Getting Started

### Prerequisites

1. **Node.js** 18+ and **pnpm** 8+
2. **Playwright** browsers installed
3. **Development server** running on localhost:5173

### Installation

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install --with-deps
```

### Basic Setup

```bash
# Start the development server
pnpm run dev

# Run a quick smoke test
pnpm run test:trpg-smoke
```

## 🧪 Test Suites

### 1. Core TRPG Tests (`trpg-core/`)

Tests fundamental TRPG application features:

#### Campaign Management
- Campaign creation and configuration
- Campaign switching and state management
- Data persistence and validation
- Export/import functionality

#### Character Management
- PC/NPC/Enemy creation and editing
- Character sheets and attributes
- Equipment and inventory management
- Character status tracking (HP, AC, etc.)

#### World Building
- Location creation and management
- Culture and society development
- Geography and environment settings
- History and timeline management
- Interactive map functionality

### 2. Session Management Tests (`trpg-session/`)

Tests live TRPG session functionality:

- Session creation and startup
- Character display during sessions
- Dice rolling system (multiple notations)
- Combat encounter management
- AI integration for NPCs and scenarios
- Session notes and event logging
- Pause/resume functionality

### 3. Performance Tests (`performance/`)

Monitors application performance:

- Startup and load time measurement
- Memory usage monitoring
- Character management scalability
- Session real-time performance
- Responsive design performance
- Stress testing with concurrent operations

### 4. Mobile Tests (`mobile/`)

Tests mobile-specific functionality:

- Touch interactions and gestures
- Mobile navigation patterns
- Responsive design adaptation
- Orientation change handling
- Mobile performance optimization
- Accessibility on mobile devices

### 5. Accessibility Tests (`accessibility/`)

Ensures WCAG 2.1 AA compliance:

- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- ARIA attribute testing
- Focus management

## ▶️ Running Tests

### Individual Test Suites

```bash
# Core functionality tests
pnpm run test:trpg-core
pnpm run test:trpg-core:headed    # With browser UI

# Session management tests
pnpm run test:trpg-session
pnpm run test:trpg-session:headed

# Performance tests
pnpm run test:trpg-performance

# Mobile tests
pnpm run test:trpg-mobile

# Accessibility tests
pnpm run test:accessibility
```

### Specific Test Categories

```bash
# Campaign management only
pnpm run test:trpg-campaign

# Character management only
pnpm run test:trpg-characters

# World building only
pnpm run test:trpg-world

# Quick smoke tests
pnpm run test:trpg-smoke
```

### Comprehensive Testing

```bash
# Run core + session tests
pnpm run test:trpg-comprehensive

# Run all TRPG tests with full reporting
pnpm run test:trpg-all
```

### Debug Mode

```bash
# Run with browser UI for debugging
pnpm run test:trpg-core:headed

# Run with Playwright UI for test development
pnpm run test:e2e:ui
```

## 📊 Test Data Management

### Test Data Generation

The framework includes comprehensive test data generators:

```typescript
// Generate test campaigns
const campaigns = generateTestCampaigns(5);

// Generate characters by type and theme
const characters = generateTestCharacters(10, "PC", "fantasy");

// Generate locations for world building
const locations = generateTestLocations(8, "medieval");
```

### Data Themes

Available themes for test data generation:

- **archaeological**: Ancient ruins and exploration
- **maritime**: Pirate adventures and sea exploration  
- **academic**: Magic school and scholarly pursuits
- **political**: Court intrigue and diplomacy
- **cyberpunk**: Futuristic high-tech scenarios

### Data Cleanup

Tests automatically clean up data between runs:

```typescript
// Automatic cleanup in test hooks
test.beforeEach(async ({ page }) => {
  await cleanupTRPGTestData(page);
});
```

## ⚡ Performance Testing

### Metrics Tracked

- **Load Times**: Initial application startup
- **Memory Usage**: Heap size and leak detection
- **Render Performance**: Character list rendering with large datasets
- **Session Performance**: Real-time dice rolling and AI responses
- **Responsive Performance**: Viewport resize and adaptation

### Performance Thresholds

- Application startup: < 10 seconds
- Page interaction ready: < 5 seconds
- Memory increase: < 50MB over session
- Dice roll response: < 1 second
- Viewport resize: < 100ms

### Performance Reports

Performance data is automatically collected and reported:

```bash
# View performance report
open test-results/trpg-test-report.html
```

## 📱 Mobile Testing

### Tested Viewports

- **Mobile Small**: 375x667 (iPhone SE)
- **Mobile Large**: 414x896 (iPhone 11)
- **Tablet Portrait**: 768x1024 (iPad)
- **Tablet Landscape**: 1024x768 (iPad)

### Mobile-Specific Features

- Touch interactions (tap, swipe, long press)
- Mobile navigation patterns
- Orientation change handling
- Virtual keyboard interactions
- Mobile performance optimization

### Mobile Test Commands

```bash
# Run all mobile tests
pnpm run test:trpg-mobile

# Test specific mobile features
playwright test e2e/mobile/mobile-trpg-experience.spec.ts --grep "navigation"
```

## ♿ Accessibility Testing

### Standards Compliance

Tests ensure compliance with:

- **WCAG 2.1 AA**: Web Content Accessibility Guidelines
- **Section 508**: US federal accessibility standards
- **EN 301 549**: European accessibility standard

### Accessibility Checks

- Screen reader compatibility
- Keyboard navigation flow
- Color contrast ratios (4.5:1 for normal text)
- Focus management and indicators
- ARIA labels and descriptions
- Touch target sizes (44x44px minimum)

### Running Accessibility Tests

```bash
# Full accessibility test suite
pnpm run test:accessibility

# Individual accessibility categories
playwright test e2e/accessibility/screen-reader.spec.ts
playwright test e2e/accessibility/keyboard-navigation.spec.ts
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The framework includes a comprehensive CI/CD workflow (`.github/workflows/trpg-e2e-tests.yml`):

#### Workflow Triggers

- **Push to main/develop**: Full test suite
- **Pull requests**: Regression tests
- **Manual dispatch**: Custom test selection

#### Test Execution Strategy

```yaml
strategy:
  matrix:
    shard: [1, 2, 3]  # Parallel execution
```

#### Artifacts and Reporting

- Test results and screenshots
- Performance reports with trend analysis
- Accessibility compliance reports
- Comprehensive HTML reports

### Local CI Simulation

```bash
# Simulate CI environment locally
docker run -it mcr.microsoft.com/playwright:focal /bin/bash
cd /workspace
pnpm install
pnpm run test:trpg-all
```

## 🔧 Troubleshooting

### Common Issues

#### Test Failures

1. **Application not responding**
   ```bash
   # Verify server is running
   curl http://localhost:5173
   
   # Check for port conflicts
   lsof -i :5173
   ```

2. **Element not found errors**
   ```typescript
   // Increase timeouts for slow elements
   await expect(element).toBeVisible({ timeout: 10000 });
   ```

3. **Session state issues**
   ```typescript
   // Clear browser state before tests
   await cleanupTRPGTestData(page);
   ```

#### Performance Issues

1. **Memory leaks detected**
   - Check for unclosed dialogs
   - Verify proper cleanup in test teardown
   - Monitor browser console for errors

2. **Slow test execution**
   - Use `--headed` mode to observe issues
   - Check network requests in browser dev tools
   - Verify test data size is reasonable

#### Mobile Testing Issues

1. **Touch interactions failing**
   ```typescript
   // Use explicit tap() instead of click()
   await element.tap();
   ```

2. **Viewport not applying**
   ```typescript
   // Ensure viewport is set before navigation
   await page.setViewportSize({ width: 375, height: 667 });
   await page.goto('/');
   ```

### Debug Commands

```bash
# Run with debug output
DEBUG=pw:api pnpm run test:trpg-core

# Run single test with trace
playwright test specific-test.spec.ts --trace on

# Generate test report
playwright show-report
```

## 🎯 Best Practices

### Test Writing Guidelines

1. **Use Page Object Pattern**
   ```typescript
   // Good: Encapsulate page interactions
   await createTRPGCharacter(page, characterData);
   
   // Avoid: Direct element manipulation in tests
   await page.click('button');
   ```

2. **Descriptive Test Names**
   ```typescript
   test("should create PC with full attributes and verify persistence", async ({ page }) => {
     // Test implementation
   });
   ```

3. **Proper Assertions**
   ```typescript
   // Good: Specific, meaningful assertions
   await expect(page.locator(`text=${character.name}`)).toBeVisible();
   
   // Avoid: Generic existence checks
   await expect(page.locator('div')).toHaveCount(1);
   ```

### Data Management

1. **Use Generated Test Data**
   ```typescript
   const campaign = await setupTRPGTestData(page);
   // Use campaign data in tests
   ```

2. **Clean Isolation**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await cleanupTRPGTestData(page);
   });
   ```

### Performance Considerations

1. **Minimize Network Requests**
   - Use mock data where possible
   - Batch data setup operations
   - Avoid unnecessary page reloads

2. **Efficient Selectors**
   ```typescript
   // Good: Specific, stable selectors
   page.locator('[data-testid="character-card"]')
   
   // Avoid: Fragile selectors
   page.locator('div > span:nth-child(3)')
   ```

### Screenshot and Video Strategy

1. **Strategic Screenshots**
   ```typescript
   // Take screenshots at key verification points
   await takeTRPGScreenshot(page, "character-created", "character-management");
   ```

2. **Failure Documentation**
   ```typescript
   // Automatic screenshots on failure
   screenshot: "only-on-failure"
   ```

## 📈 Reporting and Analysis

### Test Reports

The framework generates multiple report formats:

1. **HTML Report**: Interactive test results with screenshots
2. **JSON Report**: Machine-readable results for analysis
3. **Markdown Summary**: Human-readable summary for documentation

### Performance Analysis

Performance data includes:

- Load time trends
- Memory usage patterns
- Responsive design metrics
- Mobile performance indicators

### Accessibility Reports

Accessibility reports include:

- WCAG compliance status
- Violation details and remediation suggestions
- Screen reader compatibility results
- Keyboard navigation flow analysis

---

## 🎮 TRPG-Specific Testing Features

### Campaign Workflow Testing

The framework specifically tests TRPG campaign workflows:

1. **Campaign Creation**: From initial setup to character assignment
2. **Session Management**: Full session lifecycle including pause/resume
3. **Character Progression**: Level advancement and equipment changes
4. **World Building**: Location and culture development over time

### AI Integration Testing

Tests AI-powered features crucial for TRPG:

1. **NPC Behavior**: AI-driven NPC responses and interactions
2. **Scenario Generation**: Dynamic content creation
3. **Combat AI**: Intelligent enemy behavior
4. **Story Assistance**: AI-powered plot development

### Game System Compatibility

Tests multiple game systems:

- D&D 5e mechanics
- Pathfinder systems
- Custom rule sets
- Dice notation compatibility

This comprehensive testing framework ensures the TRPG application meets the high standards required for real-world tabletop gaming sessions while maintaining excellent performance and accessibility across all platforms.
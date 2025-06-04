# TRPG Loading States Implementation

This directory contains a comprehensive loading state management system designed specifically for TRPG (Tabletop Role-Playing Game) applications. The implementation provides engaging loading experiences for various TRPG-specific operations while maintaining excellent user experience and performance.

## 🎯 Overview

The loading state system includes:

- **Base loading components** (spinner, skeleton, progress)
- **TRPG-specific loading states** for campaigns, characters, AI operations, etc.
- **AI operation progress tracking** with time estimates and provider identification
- **Error handling and timeout management** with retry logic
- **Performance monitoring** for optimization
- **Comprehensive E2E testing** with Playwright

## 📁 File Structure

```
src/components/loading/
├── README.md                           # This documentation
├── LoadingStateIntegrationExample.tsx  # Complete usage example
├── TRPGLoadingStates.tsx               # TRPG-specific loading components
├── LoadingErrorDisplay.tsx             # Error handling UI
└── PerformanceDashboard.tsx            # Performance monitoring UI

src/components/ui/
├── LoadingSpinner.tsx                  # Base spinner component
├── LoadingSkeleton.tsx                 # Skeleton loading components
└── LoadingProgress.tsx                 # Progress indicators

src/components/ai/
└── AIOperationProgress.tsx             # AI-specific progress tracking

src/hooks/
└── useLoadingState.ts                  # Loading state management hook

src/utils/
├── loadingUtils.ts                     # Loading utility functions
├── loadingErrorHandler.ts              # Error handling utilities
└── performanceMonitor.ts               # Performance tracking

e2e/pages/
├── loading-states-comprehensive.spec.ts # Comprehensive E2E tests
├── loading-performance-test.spec.ts     # Performance testing
└── loading-test-helpers.ts              # Test utilities
```

## 🚀 Quick Start

### Basic Loading Spinner

```tsx
import { LoadingSpinner } from '../ui/LoadingSpinner';

<LoadingSpinner 
  message="Loading campaign data..." 
  fullScreen={true}
/>
```

### TRPG-Specific Loading States

```tsx
import TRPGLoadingStates from './TRPGLoadingStates';

// Campaign loading
<TRPGLoadingStates.CampaignLoadingState 
  message="Loading Curse of Strahd campaign..." 
/>

// Character sheet loading
<TRPGLoadingStates.CharacterSheetLoading 
  characterName="Gandalf the Grey" 
/>

// AI generation with progress
<TRPGLoadingStates.AIResponseLoading 
  operation="character backstory generation"
  estimatedTime={30}
  currentStep="Analyzing personality traits..."
/>
```

### Loading State Management Hook

```tsx
import useLoadingState from '../../hooks/useLoadingState';

const {
  loadingState,
  startLoading,
  updateProgress,
  finishLoading,
  setError
} = useLoadingState();

// Start a loading operation
startLoading('campaign-load', 'Loading campaign data...', {
  estimatedTime: 5000,
  timeoutMs: 15000
});

// Update progress
updateProgress('campaign-load', 50, 'Loading character sheets...');

// Complete the operation
finishLoading('campaign-load');
```

## 🎮 TRPG Loading Scenarios

### Campaign Management
- **Campaign Loading**: Full campaign data with character relationships
- **Campaign Creation**: Step-by-step wizard progress
- **Campaign Import/Export**: Large data processing with progress

### Character Management
- **Character Sheet Loading**: Stats, equipment, spells with skeleton UI
- **Bulk Character Import**: Multiple characters with individual progress
- **Character Image Generation**: AI-powered artwork creation

### AI Operations
- **Content Generation**: Backstories, NPCs, locations with time estimates
- **Image Creation**: Character portraits, maps, items with preview
- **Campaign Enhancement**: AI-driven content expansion

### Session Management
- **Session Initialization**: Loading characters, dice systems, AI GM
- **Real-time Updates**: Live session state synchronization
- **Dice Rolling**: Physics simulation with animation

### World Building
- **Location Loading**: Maps, descriptions, inhabitants
- **Timeline Processing**: Event organization and conflict resolution
- **Lore Generation**: Rich world content creation

## 🔧 Advanced Features

### Error Handling with Retry Logic

```tsx
import { LoadingErrorHandler } from '../../utils/loadingErrorHandler';

try {
  await LoadingErrorHandler.withRetry(
    () => fetchCampaignData(),
    'campaign-load',
    { maxRetries: 3, baseDelay: 1000 },
    (error) => setError(error.id, error.message),
    (attempt, delay) => console.log(`Retry ${attempt} in ${delay}ms`)
  );
} catch (error) {
  // Handle final failure
}
```

### Performance Monitoring

```tsx
import { performanceMonitor } from '../../utils/performanceMonitor';

// Automatic tracking
performanceMonitor.startOperation('ai-generation', 'character-creation');
// ... operation ...
performanceMonitor.completeOperation('ai-generation');

// Get analytics
const analytics = performanceMonitor.getAnalytics('ai-generation');
console.log(`Average duration: ${analytics.averageDuration}ms`);
console.log(`Success rate: ${analytics.successRate}%`);
```

### AI Operation Progress

```tsx
import { AIOperationProgress } from '../ai/AIOperationProgress';

<AIOperationProgress
  operationId="char-gen-001"
  title="Generating Character Backstory"
  provider="openai"
  estimatedTotalTime={30}
  currentStep={2}
  steps={[
    { id: '1', label: 'Analyzing traits', completed: true },
    { id: '2', label: 'Generating history', completed: false },
    { id: '3', label: 'Creating relationships', completed: false }
  ]}
  progress={45}
  startTime={Date.now() - 15000}
  status="processing"
/>
```

## 🧪 Testing

### E2E Testing with Playwright

```typescript
import { LoadingTestHelper, TRPG_LOADING_CONFIGS } from '../utils/loading-test-helpers';

test('should handle AI generation loading', async ({ page }) => {
  const helper = new LoadingTestHelper(page);
  
  await helper.mockLoadingEndpoint('**/api/ai-agent/generate', {
    delay: 25000,
    progressUpdates: [
      { progress: 25, message: 'Analyzing...', delay: 5000 },
      { progress: 75, message: 'Generating...', delay: 15000 }
    ]
  });

  await helper.verifyLoadingState(
    'ai-operation-progress',
    TRPG_LOADING_CONFIGS.aiGeneration
  );
});
```

### Performance Testing

```typescript
test('should complete campaign loading within acceptable time', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/campaigns');
  await expect(page.locator('[data-testid="campaign-list"]')).toBeVisible();
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(3000); // 3 second threshold
});
```

## 📊 Performance Benchmarks

| Operation | Expected Duration | Warning Threshold | Error Threshold |
|-----------|------------------|-------------------|-----------------|
| Campaign Load | 3s | 8s | 15s |
| Character Sheet | 2s | 6s | 10s |
| AI Generation | 25s | 45s | 60s |
| Image Generation | 35s | 60s | 90s |
| Timeline Processing | 5s | 12s | 20s |
| Session Initialization | 8s | 20s | 30s |
| Dice Animation | 1.5s | 3s | 5s |

## 🎨 Design Principles

### User Experience
- **Immediate Feedback**: Show loading states within 100ms
- **Progress Indication**: Provide progress bars for operations > 3s
- **Time Estimates**: Show remaining time for operations > 10s
- **Contextual Messages**: Use TRPG-specific terminology and themes

### Performance
- **Skeleton Loading**: Show content structure while loading
- **Progressive Enhancement**: Load critical content first
- **Memory Management**: Clean up loading states and avoid leaks
- **Caching**: Implement appropriate caching strategies

### Accessibility
- **Screen Reader Support**: Proper ARIA labels and live regions
- **Keyboard Navigation**: Accessible loading controls
- **High Contrast**: Visible loading indicators in all themes
- **Motion Preferences**: Respect reduced motion settings

### Error Handling
- **Graceful Degradation**: Fallback states for failed operations
- **Retry Logic**: Automatic retries with exponential backoff
- **User Recovery**: Clear error messages with suggested actions
- **Timeout Management**: Reasonable timeouts with user notification

## 🔄 Integration with Existing Systems

### Recoil State Management
```tsx
// Loading atoms
export const campaignLoadingState = atom({
  key: 'campaignLoadingState',
  default: { isLoading: false, progress: 0 }
});

// Selectors for derived state
export const isAnyOperationLoading = selector({
  key: 'isAnyOperationLoading',
  get: ({ get }) => {
    const campaign = get(campaignLoadingState);
    return campaign.isLoading;
  }
});
```

### Material-UI Theme Integration
```tsx
// Custom loading theme
const loadingTheme = createTheme({
  components: {
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 8
        }
      }
    }
  }
});
```

## 🚀 Future Enhancements

### Planned Features
- **Loading Animations**: Custom TRPG-themed animations (dice, scrolls, etc.)
- **Sound Effects**: Optional loading sounds with volume control
- **Predictive Loading**: Pre-load likely next operations
- **Offline Support**: Show appropriate messages during offline state

### Performance Optimizations
- **Virtual Scrolling**: For large character/campaign lists
- **Image Optimization**: Progressive image loading with blur-up
- **Code Splitting**: Lazy load loading components by scenario
- **Service Worker**: Background sync and caching

## 📝 Contributing

When adding new loading states:

1. **Follow naming conventions**: Use descriptive, TRPG-specific names
2. **Add performance benchmarks**: Define expected timing thresholds
3. **Include error handling**: Implement proper error states and recovery
4. **Write tests**: Add both unit and E2E tests
5. **Update documentation**: Keep this README current

### Code Review Checklist
- [ ] Loading state shows within 100ms
- [ ] Progress indication for operations > 3s
- [ ] Error handling with retry logic
- [ ] Accessibility attributes (ARIA labels)
- [ ] Performance monitoring integration
- [ ] E2E tests covering happy path and error cases
- [ ] Mobile responsive design
- [ ] Memory leak prevention

## 📖 Additional Resources

- [Material-UI Loading Components](https://mui.com/components/progress/)
- [React Loading State Patterns](https://kentcdodds.com/blog/stop-using-isloading-booleans)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Web Performance Best Practices](https://web.dev/performance/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

*This loading state system is designed to provide the best possible user experience for TRPG applications, balancing performance, accessibility, and engaging visual feedback.*
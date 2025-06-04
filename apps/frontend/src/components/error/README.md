# TRPG Error Handling System

This comprehensive error handling system provides robust error management for the TRPG application, including error boundaries, state management, network error handling, and user-friendly error display.

## Components Overview

### Error Boundaries

#### `ErrorBoundary`
Base error boundary component that catches JavaScript errors anywhere in the component tree.

```tsx
import { ErrorBoundary } from './components/error';

<ErrorBoundary section="my-section" onError={handleError}>
  <MyComponent />
</ErrorBoundary>
```

#### `TRPGErrorBoundary`
TRPG-specific error boundary with customized error messages and recovery suggestions.

```tsx
import { TRPGErrorBoundary } from './components/error';

<TRPGErrorBoundary section="character" onError={handleError}>
  <CharacterForm />
</TRPGErrorBoundary>
```

#### `AsyncErrorBoundary`
Handles both synchronous React errors and asynchronous errors from API calls.

```tsx
import { AsyncErrorBoundary, useAsyncErrorHandler } from './components/error';

const MyComponent = () => {
  const { handleAsync } = useAsyncErrorHandler();
  
  const fetchData = () => {
    handleAsync(async () => {
      const data = await api.fetchData();
      return data;
    }, 'data fetching');
  };
};
```

### Error State Management

#### `ErrorStateManager`
Global error state management with context provider.

```tsx
import { ErrorStateManager, useErrorState } from './components/error';

// In your app root
<ErrorStateManager>
  <App />
</ErrorStateManager>

// In components
const { addError, dismissError, getActiveErrors } = useErrorState();
```

#### `useTRPGErrorHandler`
TRPG-specific error handling hooks with pre-configured error types.

```tsx
import { useTRPGErrorHandler } from './components/error';

const MyComponent = () => {
  const { handleCampaignError, handleCharacterError } = useTRPGErrorHandler();
  
  try {
    // Some operation
  } catch (error) {
    handleCampaignError(error, 'campaign-loading');
  }
};
```

### Error Notifications

#### `ErrorNotificationCenter`
Displays error notifications and provides an error history drawer.

```tsx
import { ErrorNotificationCenter } from './components/error';

// Add to your app layout
<ErrorNotificationCenter 
  maxVisible={3}
  autoHideDuration={6000}
  showDrawer={true}
/>
```

### Form Validation

#### `FormValidationProvider`
Form validation with error state management.

```tsx
import { FormValidationProvider, useFormValidation, TRPGFormValidator } from './components/error';

<FormValidationProvider>
  <MyForm />
</FormValidationProvider>

const MyForm = () => {
  const { setFieldError, clearFieldError, shouldShowFieldError } = useFormValidation();
  
  const validateCampaignName = (name: string) => {
    const error = TRPGFormValidator.validateCampaignName(name);
    if (error) {
      setFieldError('campaignName', error);
    } else {
      clearFieldError('campaignName');
    }
  };
};
```

### Network Error Handling

#### `NetworkErrorHandler`
Enhanced fetch with retry logic and exponential backoff.

```tsx
import { NetworkErrorHandler, TRPGNetworkUtils } from './components/error';

// Basic network request with retry
const data = await NetworkErrorHandler.fetchWithRetry('/api/data', {
  method: 'POST',
  body: JSON.stringify(payload)
});

// TRPG-specific requests
const campaignData = await TRPGNetworkUtils.fetchCampaignData('123');
const aiResponse = await TRPGNetworkUtils.fetchAIResponse('openai', 'generate');
const diceResult = await TRPGNetworkUtils.rollDice('3d6+2');
```

#### `TRPGAPIErrorHandler`
API error handling with user-friendly messages and suggestions.

```tsx
import { TRPGAPIErrorHandler } from './components/error';

try {
  const data = await TRPGAPIErrorHandler.handleCampaignRequest('create', {
    method: 'POST',
    body: JSON.stringify(campaignData)
  });
} catch (error) {
  if (error instanceof APIError) {
    const userError = TRPGAPIErrorHandler.formatErrorForUser(error);
    // Display user-friendly error message
  }
}
```

## TRPG-Specific Error Types

### Campaign Errors
- `CAMPAIGN_NOT_FOUND`: キャンペーンが見つかりません
- `CAMPAIGN_ACCESS_DENIED`: アクセス権限がありません
- `CAMPAIGN_DATA_CORRUPTED`: データが破損しています

### Character Errors
- `CHARACTER_VALIDATION_FAILED`: データ検証に失敗
- `CHARACTER_ABILITY_INVALID`: 能力値が無効
- `CHARACTER_NAME_DUPLICATE`: 同名キャラクターが存在

### AI Service Errors
- `AI_API_KEY_INVALID`: APIキーが無効
- `AI_RATE_LIMIT_EXCEEDED`: レート制限に達しました
- `AI_SERVICE_UNAVAILABLE`: サービスが利用不可

### Dice Errors
- `DICE_EXPRESSION_INVALID`: ダイス記法が無効
- `DICE_TOO_MANY_DICE`: ダイス数が多すぎます
- `DICE_RESULT_OVERFLOW`: 結果が範囲外

### Session Errors
- `SESSION_STATE_CORRUPTED`: セッション状態が破損
- `SESSION_PLAYER_LIMIT`: 参加者数上限
- `SESSION_NOT_FOUND`: セッションが見つかりません

## Testing Utilities

### `TRPGErrorSimulator`
Error simulation for testing environments.

```tsx
import { TRPGErrorSimulator } from './components/error';

// Simulate campaign error
TRPGErrorSimulator.simulateCampaignError('campaign-id', 'corrupted');

// Simulate AI error
TRPGErrorSimulator.simulateAIError('openai', 'rate_limit');

// Simulate dice error
TRPGErrorSimulator.simulateDiceError('3d6', 'invalid_syntax');
```

### `TRPGErrorTestUtils`
Testing utilities for error scenarios.

```tsx
import { TRPGErrorTestUtils } from './components/error';

// Assert error type
TRPGErrorTestUtils.assertTRPGError(error, 'validation', 'campaign');

// Wait for error
const errorScenario = await TRPGErrorTestUtils.waitForError();

// Simulate network failure
TRPGErrorTestUtils.simulateNetworkFailure();
```

## Usage Examples

### Basic Error Boundary Setup

```tsx
import { TRPGErrorBoundary } from './components/error';

const CharactersPage = () => (
  <TRPGErrorBoundary section="character">
    <CharacterList />
    <CharacterForm />
  </TRPGErrorBoundary>
);
```

### Form Validation

```tsx
import { FormValidationProvider, useFormValidation, TRPGFormValidator } from './components/error';

const CampaignForm = () => {
  const [name, setName] = useState('');
  const { setFieldError, clearFieldError, shouldShowFieldError } = useFormValidation();
  
  const handleNameChange = (value: string) => {
    setName(value);
    const error = TRPGFormValidator.validateCampaignName(value);
    if (error) {
      setFieldError('campaignName', error);
    } else {
      clearFieldError('campaignName');
    }
  };
  
  return (
    <TextField
      value={name}
      onChange={(e) => handleNameChange(e.target.value)}
      error={shouldShowFieldError('campaignName')}
      helperText={shouldShowFieldError('campaignName') ? getFieldErrorMessage('campaignName') : ''}
    />
  );
};
```

### Network Error Handling

```tsx
import { useTRPGErrorHandler } from './components/error';
import { TRPGNetworkUtils } from './components/error';

const CampaignLoader = () => {
  const { handleCampaignError } = useTRPGErrorHandler();
  
  const loadCampaign = async (campaignId: string) => {
    try {
      const campaign = await TRPGNetworkUtils.fetchCampaignData(`${campaignId}`);
      setCampaign(campaign);
    } catch (error) {
      handleCampaignError(error, `loading-${campaignId}`);
    }
  };
};
```

### Complete App Setup

```tsx
import { 
  ErrorStateManager, 
  ErrorNotificationCenter, 
  setupGlobalErrorHandling 
} from './components/error';

// Setup global error handling
setupGlobalErrorHandling();

const App = () => (
  <ErrorStateManager>
    <Router>
      <Routes>
        {/* Your routes */}
      </Routes>
    </Router>
    <ErrorNotificationCenter />
  </ErrorStateManager>
);
```

## E2E Testing

The error handling system includes comprehensive Playwright tests:

- `error-handling-comprehensive.spec.ts`: Complete error scenario testing
- `error-boundary-tests.spec.ts`: Error boundary behavior testing

Run tests with:
```bash
pnpm test:e2e --grep "error"
```

## Best Practices

1. **Wrap major sections** with `TRPGErrorBoundary`
2. **Use specific error types** for different contexts
3. **Provide recovery suggestions** in error messages
4. **Test error scenarios** during development
5. **Monitor error patterns** in production
6. **Maintain user state** during error recovery
7. **Use form validation** for user input errors
8. **Implement retry logic** for network errors

## Error Recovery Strategies

1. **Component Reset**: Error boundaries allow component recovery
2. **Data Refetch**: Retry failed API calls with exponential backoff
3. **State Rollback**: Restore previous known good state
4. **User Guidance**: Provide clear recovery instructions
5. **Graceful Degradation**: Continue operation with reduced functionality

## Integration with External Services

The error handling system can be integrated with:

- **Error Tracking**: Sentry, Rollbar, etc.
- **Analytics**: Track error patterns and user impact
- **Monitoring**: Alert on error rate increases
- **Logging**: Centralized error logging for debugging
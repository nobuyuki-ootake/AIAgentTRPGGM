import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';

// Import loading components
import { LoadingSpinner, LoadingProgress } from '../ui';
import TRPGLoadingStates from './TRPGLoadingStates';
import { AIOperationProgress, AIOperationProgressInline } from '../ai/AIOperationProgress';
import { LoadingErrorDisplay } from './LoadingErrorDisplay';
import { PerformanceDashboard } from './PerformanceDashboard';

// Import utilities
import useLoadingState from '../../hooks/useLoadingState';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { LoadingErrorHandler } from '../../utils/loadingErrorHandler';
import { 
  getLoadingConfig, 
  createLoadingMessage, 
  simulateProgressiveLoading,
  createLoadingId
} from '../../utils/loadingUtils';

export const LoadingStateIntegrationExample: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [performanceDashboardOpen, setPerformanceDashboardOpen] = useState(false);
  const [demoError, setDemoError] = useState<any>(null);
  
  const {
    loadingState,
    startLoading,
    updateProgress,
    finishLoading,
    setError,
    clearError,
    isOperationLoading
  } = useLoadingState();

  // Demo scenarios
  const scenarios = [
    { id: 'campaign-load', name: 'Campaign Loading', component: 'CampaignLoadingState' },
    { id: 'character-sheet', name: 'Character Sheet', component: 'CharacterSheetLoading' },
    { id: 'ai-generation', name: 'AI Generation', component: 'AIResponseLoading' },
    { id: 'image-generation', name: 'Image Generation', component: 'ImageGenerationLoading' },
    { id: 'timeline-processing', name: 'Timeline Processing', component: 'TimelineEventProcessing' },
    { id: 'session-initialization', name: 'Session Initialization', component: 'SessionInitializationLoading' },
    { id: 'dice-animation', name: 'Dice Animation', component: 'DiceAnimationLoading' },
    { id: 'bulk-character-load', name: 'Bulk Character Loading', component: 'BulkCharacterLoading' }
  ];

  const simulateOperation = async (scenarioId: string) => {
    const operationId = createLoadingId(scenarioId as any, 'demo');
    const config = getLoadingConfig(scenarioId as any);
    
    try {
      // Start performance monitoring
      performanceMonitor.startOperation(operationId, scenarioId);
      
      // Start loading state
      startLoading(
        operationId,
        createLoadingMessage(scenarioId as any, 'demo'),
        {
          estimatedTime: config.estimatedTime,
          timeoutMs: config.timeoutMs
        }
      );

      // Simulate progressive loading
      await simulateProgressiveLoading(
        scenarioId as any,
        (progress, message) => {
          updateProgress(operationId, progress, message);
        },
        'demo'
      );

      // Complete operation
      finishLoading(operationId);
      performanceMonitor.completeOperation(operationId);
      
    } catch (error: any) {
      const loadingError = LoadingErrorHandler.parseError(operationId, error);
      setDemoError(loadingError);
      setError(operationId, error.message);
      performanceMonitor.failOperation(operationId, error.message);
    }
  };

  const simulateError = (errorType: 'network' | 'timeout' | 'server') => {
    const operationId = 'error-demo';
    const errors = {
      network: new Error('Network connection failed'),
      timeout: { name: 'TimeoutError', message: 'Operation timed out' },
      server: { response: { status: 500 }, message: 'Internal server error' }
    };
    
    const error = LoadingErrorHandler.parseError(operationId, errors[errorType]);
    setDemoError(error);
  };

  const renderLoadingComponent = () => {
    if (!selectedScenario) return null;

    const isLoading = isOperationLoading(createLoadingId(selectedScenario as any, 'demo'));
    
    switch (selectedScenario) {
      case 'campaign-load':
        return isLoading ? (
          <TRPGLoadingStates.CampaignLoadingState message="Loading demo campaign..." />
        ) : (
          <Alert severity="success">Campaign loaded successfully!</Alert>
        );

      case 'character-sheet':
        return isLoading ? (
          <TRPGLoadingStates.CharacterSheetLoading characterName="Demo Character" />
        ) : (
          <Alert severity="success">Character sheet loaded!</Alert>
        );

      case 'ai-generation':
        return isLoading ? (
          <TRPGLoadingStates.AIResponseLoading 
            operation="content generation"
            estimatedTime={30}
            currentStep="Analyzing request..."
          />
        ) : (
          <Alert severity="success">AI content generated!</Alert>
        );

      case 'image-generation':
        return isLoading ? (
          <TRPGLoadingStates.ImageGenerationLoading type="character" progress={45} />
        ) : (
          <Alert severity="success">Image generated successfully!</Alert>
        );

      case 'timeline-processing':
        return isLoading ? (
          <TRPGLoadingStates.TimelineEventProcessing eventCount={10} processedCount={6} />
        ) : (
          <Alert severity="success">Timeline processed!</Alert>
        );

      case 'session-initialization':
        return isLoading ? (
          <TRPGLoadingStates.SessionInitializationLoading />
        ) : (
          <Alert severity="success">Session ready!</Alert>
        );

      case 'dice-animation':
        return isLoading ? (
          <TRPGLoadingStates.DiceAnimationLoading diceType="2d6" rollCount={2} />
        ) : (
          <Alert severity="success">Dice rolled: 4, 6 (Total: 10)</Alert>
        );

      case 'bulk-character-load':
        return isLoading ? (
          <TRPGLoadingStates.BulkCharacterLoading 
            totalCharacters={5} 
            loadedCharacters={3}
            currentCharacter="Warrior Gareth"
          />
        ) : (
          <Alert severity="success">All characters loaded!</Alert>
        );

      default:
        return null;
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        TRPG Loading States Integration Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" gutterBottom>
        This demo showcases all the loading state components and utilities created for the TRPG application.
      </Typography>

      <Grid container spacing={3}>
        {/* Scenario Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loading Scenarios
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Scenario</InputLabel>
                <Select
                  value={selectedScenario}
                  label="Select Scenario"
                  onChange={(e) => setSelectedScenario(e.target.value)}
                >
                  {scenarios.map((scenario) => (
                    <MenuItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={() => simulateOperation(selectedScenario)}
                  disabled={!selectedScenario || isOperationLoading(createLoadingId(selectedScenario as any, 'demo'))}
                >
                  Start Loading Demo
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => setPerformanceDashboardOpen(true)}
                >
                  Performance Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Testing */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Handling Demo
              </Typography>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => simulateError('network')}
                >
                  Network Error
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => simulateError('timeout')}
                >
                  Timeout Error
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => simulateError('server')}
                >
                  Server Error
                </Button>
                
                {demoError && (
                  <Button
                    variant="text"
                    onClick={() => {
                      setDemoError(null);
                      clearError();
                    }}
                  >
                    Clear Error
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Loading State Display */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loading State Display
              </Typography>
              
              {selectedScenario ? (
                renderLoadingComponent()
              ) : (
                <Typography color="text.secondary">
                  Select a scenario above to see the loading state
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Error Display */}
        {demoError && (
          <Grid item xs={12}>
            <LoadingErrorDisplay
              error={demoError}
              onRetry={() => {
                setDemoError(null);
                clearError();
              }}
              onDismiss={() => {
                setDemoError(null);
                clearError();
              }}
            />
          </Grid>
        )}

        {/* Global Loading State */}
        {loadingState.isLoading && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Global Loading State
                </Typography>
                
                <LoadingProgress
                  value={loadingState.totalProgress}
                  message={`${loadingState.operations.length} operation(s) running`}
                  showPercentage
                />
                
                {loadingState.operations.map((operation) => (
                  <Box key={operation.id} mt={2}>
                    <AIOperationProgressInline
                      title={operation.message}
                      provider="custom"
                      progress={operation.progress || 0}
                      currentStep="Processing..."
                      remainingTime={operation.estimatedTime}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                Performance monitoring is active. All loading operations are being tracked.
                Use the Performance Dashboard to view detailed metrics.
              </Typography>
              
              <Box mt={2}>
                <Typography variant="caption">
                  Current session: {performanceMonitor.sessionId || 'Not available'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Dashboard Modal */}
      {performanceDashboardOpen && (
        <PerformanceDashboard onClose={() => setPerformanceDashboardOpen(false)} />
      )}
      
      {/* Usage Instructions */}
      <Box mt={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Usage Instructions
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>Loading Components:</strong> Use the TRPG-specific loading components 
              for different scenarios. Each component is optimized for its use case.
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>Loading Hooks:</strong> Use the useLoadingState hook to manage 
              multiple concurrent loading operations with progress tracking.
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>Error Handling:</strong> Implement the LoadingErrorHandler utility 
              for consistent error handling and retry logic.
            </Typography>
            
            <Typography variant="body2" paragraph>
              <strong>Performance Monitoring:</strong> The performance monitor automatically 
              tracks loading times and provides analytics for optimization.
            </Typography>
            
            <Typography variant="body2">
              <strong>Testing:</strong> Use the Playwright test helpers for comprehensive 
              loading state testing in E2E tests.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default LoadingStateIntegrationExample;
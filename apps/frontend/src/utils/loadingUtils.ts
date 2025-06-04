import { LoadingOperation } from '../hooks/useLoadingState';

export type LoadingScenario = 
  | 'campaign-load'
  | 'character-sheet'
  | 'ai-generation'
  | 'image-generation'
  | 'timeline-processing'
  | 'session-initialization'
  | 'world-building-load'
  | 'dice-animation'
  | 'bulk-character-load'
  | 'data-export'
  | 'data-import';

export interface LoadingScenarioConfig {
  estimatedTime: number;
  timeoutMs: number;
  steps?: string[];
  progressSteps?: { progress: number; message: string }[];
}

export const loadingScenarios: Record<LoadingScenario, LoadingScenarioConfig> = {
  'campaign-load': {
    estimatedTime: 5,
    timeoutMs: 15000,
    steps: ['Fetching campaign data', 'Loading characters', 'Ready']
  },
  'character-sheet': {
    estimatedTime: 3,
    timeoutMs: 10000,
    steps: ['Loading character data', 'Calculating modifiers', 'Ready']
  },
  'ai-generation': {
    estimatedTime: 30,
    timeoutMs: 60000,
    steps: ['Analyzing request', 'Consulting AI', 'Generating content', 'Finalizing'],
    progressSteps: [
      { progress: 25, message: 'Analyzing your request...' },
      { progress: 50, message: 'AI is thinking...' },
      { progress: 75, message: 'Generating content...' },
      { progress: 95, message: 'Finalizing response...' }
    ]
  },
  'image-generation': {
    estimatedTime: 45,
    timeoutMs: 90000,
    steps: ['Processing prompt', 'Generating image', 'Optimizing quality', 'Ready'],
    progressSteps: [
      { progress: 20, message: 'Processing your description...' },
      { progress: 60, message: 'AI is creating the image...' },
      { progress: 90, message: 'Optimizing image quality...' }
    ]
  },
  'timeline-processing': {
    estimatedTime: 8,
    timeoutMs: 20000,
    steps: ['Loading events', 'Checking conflicts', 'Organizing timeline', 'Ready']
  },
  'session-initialization': {
    estimatedTime: 15,
    timeoutMs: 30000,
    steps: [
      'Loading campaign data',
      'Preparing character sheets',
      'Setting up AI game master',
      'Initializing dice systems',
      'Ready to play!'
    ]
  },
  'world-building-load': {
    estimatedTime: 10,
    timeoutMs: 25000,
    steps: ['Loading world data', 'Processing locations', 'Loading NPCs', 'Ready']
  },
  'dice-animation': {
    estimatedTime: 2,
    timeoutMs: 5000,
    steps: ['Rolling dice', 'Calculating physics', 'Showing results']
  },
  'bulk-character-load': {
    estimatedTime: 12,
    timeoutMs: 30000,
    steps: ['Loading character list', 'Processing character sheets', 'Loading images', 'Ready']
  },
  'data-export': {
    estimatedTime: 8,
    timeoutMs: 20000,
    steps: ['Collecting data', 'Formatting export', 'Generating file', 'Ready for download']
  },
  'data-import': {
    estimatedTime: 15,
    timeoutMs: 30000,
    steps: ['Reading file', 'Validating data', 'Processing import', 'Updating database', 'Complete']
  }
};

export const getLoadingConfig = (scenario: LoadingScenario): LoadingScenarioConfig => {
  return loadingScenarios[scenario];
};

export const createLoadingMessage = (scenario: LoadingScenario, context?: string): string => {
  const messages: Record<LoadingScenario, string> = {
    'campaign-load': `Loading campaign${context ? ` "${context}"` : ''}...`,
    'character-sheet': `Loading character sheet${context ? ` for ${context}` : ''}...`,
    'ai-generation': `AI is generating ${context || 'content'}...`,
    'image-generation': `Generating ${context || 'image'} artwork...`,
    'timeline-processing': `Processing timeline${context ? ` for ${context}` : ''}...`,
    'session-initialization': 'Preparing TRPG session...',
    'world-building-load': `Loading world building${context ? ` - ${context}` : ''}...`,
    'dice-animation': `Rolling ${context || 'dice'}...`,
    'bulk-character-load': `Loading ${context || 'multiple'} characters...`,
    'data-export': `Exporting ${context || 'data'}...`,
    'data-import': `Importing ${context || 'data'}...`
  };

  return messages[scenario];
};

export const simulateProgressiveLoading = async (
  scenario: LoadingScenario,
  onProgress: (progress: number, message?: string) => void,
  context?: string
): Promise<void> => {
  const config = getLoadingConfig(scenario);
  const { progressSteps } = config;

  if (!progressSteps) {
    // Simple linear progress
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const progress = (i / steps) * 100;
      onProgress(progress, createLoadingMessage(scenario, context));
      await new Promise(resolve => setTimeout(resolve, config.estimatedTime * 100 / steps));
    }
    return;
  }

  // Step-based progress
  for (let i = 0; i < progressSteps.length; i++) {
    const step = progressSteps[i];
    onProgress(step.progress, step.message);
    
    const nextStep = progressSteps[i + 1];
    const stepDuration = nextStep 
      ? (nextStep.progress - step.progress) / 100 * config.estimatedTime * 1000
      : (100 - step.progress) / 100 * config.estimatedTime * 1000;
    
    await new Promise(resolve => setTimeout(resolve, stepDuration));
  }

  // Final completion
  onProgress(100, 'Complete!');
};

export const formatLoadingTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

export const getLoadingPriority = (scenario: LoadingScenario): 'high' | 'medium' | 'low' => {
  const highPriority: LoadingScenario[] = ['session-initialization', 'campaign-load'];
  const mediumPriority: LoadingScenario[] = ['character-sheet', 'ai-generation', 'timeline-processing'];
  
  if (highPriority.includes(scenario)) return 'high';
  if (mediumPriority.includes(scenario)) return 'medium';
  return 'low';
};

export const shouldShowDetailedProgress = (scenario: LoadingScenario): boolean => {
  const detailedScenarios: LoadingScenario[] = [
    'ai-generation',
    'image-generation',
    'session-initialization',
    'bulk-character-load',
    'data-export',
    'data-import'
  ];
  
  return detailedScenarios.includes(scenario);
};

export const getLoadingIcon = (scenario: LoadingScenario): string => {
  const icons: Record<LoadingScenario, string> = {
    'campaign-load': 'AutoStories',
    'character-sheet': 'Person',
    'ai-generation': 'Psychology',
    'image-generation': 'Image',
    'timeline-processing': 'Timeline',
    'session-initialization': 'Casino',
    'world-building-load': 'LocationOn',
    'dice-animation': 'Casino',
    'bulk-character-load': 'Group',
    'data-export': 'Download',
    'data-import': 'Upload'
  };
  
  return icons[scenario];
};

export const createLoadingId = (scenario: LoadingScenario, context?: string): string => {
  return context ? `${scenario}-${context}` : scenario;
};

export default {
  getLoadingConfig,
  createLoadingMessage,
  simulateProgressiveLoading,
  formatLoadingTime,
  getLoadingPriority,
  shouldShowDetailedProgress,
  getLoadingIcon,
  createLoadingId
};
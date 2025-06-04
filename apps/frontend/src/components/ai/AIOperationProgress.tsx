import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Collapse,
  IconButton,
  Alert
} from '@mui/material';
import {
  Psychology,
  ExpandMore,
  ExpandLess,
  AccessTime,
  Speed,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { LoadingProgress } from '../ui/LoadingProgress';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export interface AIOperationStep {
  id: string;
  label: string;
  description?: string;
  estimatedSeconds: number;
  completed: boolean;
  error?: string;
}

export interface AIOperationProgressProps {
  operationId: string;
  title: string;
  description?: string;
  provider: 'openai' | 'claude' | 'gemini' | 'custom';
  estimatedTotalTime: number;
  currentStep: number;
  steps: AIOperationStep[];
  progress: number;
  startTime: number;
  status: 'initializing' | 'processing' | 'completed' | 'error' | 'timeout';
  error?: string;
  showDetails?: boolean;
  onCancel?: () => void;
}

const providerConfig = {
  openai: { name: 'OpenAI GPT', color: '#10A37F', avatar: '🤖' },
  claude: { name: 'Anthropic Claude', color: '#D97706', avatar: '🧠' },
  gemini: { name: 'Google Gemini', color: '#4285F4', avatar: '💎' },
  custom: { name: 'Custom AI', color: '#6366F1', avatar: '⚡' }
};

export const AIOperationProgress: React.FC<AIOperationProgressProps> = ({
  operationId,
  title,
  description,
  provider,
  estimatedTotalTime,
  currentStep,
  steps,
  progress,
  startTime,
  status,
  error,
  showDetails = false,
  onCancel
}) => {
  const [expanded, setExpanded] = useState(showDetails);
  const [elapsedTime, setElapsedTime] = useState(0);

  const providerInfo = providerConfig[provider];

  useEffect(() => {
    if (status === 'processing' || status === 'initializing') {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, status]);

  const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);
  const isOvertime = elapsedTime > estimatedTotalTime;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': case 'timeout': return 'error';
      case 'processing': return 'primary';
      default: return 'default';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'initializing': return 'Initializing';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      case 'timeout': return 'Timeout';
      default: return 'Unknown';
    }
  };

  const currentStepInfo = steps[currentStep];

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{ 
                bgcolor: providerInfo.color, 
                width: 40, 
                height: 40,
                fontSize: '1.2rem'
              }}
            >
              {providerInfo.avatar}
            </Avatar>
            <Box>
              <Typography variant="h6">{title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {providerInfo.name}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={getStatusLabel()}
              size="small"
              color={getStatusColor() as any}
              icon={
                status === 'processing' ? <Psychology /> :
                status === 'completed' ? <CheckCircle /> :
                status === 'error' || status === 'timeout' ? <ErrorIcon /> :
                undefined
              }
            />
            {steps.length > 1 && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Description */}
        {description && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {description}
          </Typography>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Main Progress */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2">
              {currentStepInfo?.label || 'Processing...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={progress}
            color={getStatusColor() as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Time Information */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <AccessTime fontSize="small" color="action" />
              <Typography variant="caption">
                Elapsed: {formatTime(elapsedTime)}
              </Typography>
            </Box>
            
            {status === 'processing' && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Speed fontSize="small" color="action" />
                <Typography 
                  variant="caption"
                  color={isOvertime ? 'error' : 'text.secondary'}
                >
                  {isOvertime ? 'Overtime' : `${formatTime(remainingTime)} remaining`}
                </Typography>
              </Box>
            )}
          </Box>

          {status === 'processing' && (
            <Typography variant="caption" color="text.secondary">
              Step {currentStep + 1} of {steps.length}
            </Typography>
          )}
        </Box>

        {/* Detailed Steps */}
        <Collapse in={expanded}>
          <Box>
            <Stepper activeStep={currentStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.id}>
                  <StepLabel
                    error={!!step.error}
                    icon={
                      step.error ? <ErrorIcon /> :
                      step.completed ? <CheckCircle /> :
                      index === currentStep && status === 'processing' ? (
                        <LoadingSpinner size={20} />
                      ) : undefined
                    }
                  >
                    <Box>
                      <Typography variant="body2">{step.label}</Typography>
                      {step.description && (
                        <Typography variant="caption" color="text.secondary">
                          {step.description}
                        </Typography>
                      )}
                      {step.error && (
                        <Typography variant="caption" color="error">
                          Error: {step.error}
                        </Typography>
                      )}
                      {index === currentStep && status === 'processing' && (
                        <Typography variant="caption" color="primary">
                          Estimated: {formatTime(step.estimatedSeconds)}
                        </Typography>
                      )}
                    </Box>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Collapse>

        {/* Performance Metrics */}
        {status === 'completed' && (
          <Box mt={2} p={2} bgcolor="success.light" borderRadius={1}>
            <Typography variant="body2" color="success.dark">
              Operation completed successfully in {formatTime(elapsedTime)}
              {elapsedTime < estimatedTotalTime && (
                <span> ({formatTime(estimatedTotalTime - elapsedTime)} under estimate)</span>
              )}
            </Typography>
          </Box>
        )}

        {/* Cancel Button */}
        {onCancel && status === 'processing' && (
          <Box mt={2} textAlign="right">
            <Typography 
              variant="caption" 
              color="primary" 
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={onCancel}
            >
              Cancel Operation
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Simplified version for inline display
export const AIOperationProgressInline: React.FC<{
  title: string;
  provider: 'openai' | 'claude' | 'gemini' | 'custom';
  progress: number;
  currentStep?: string;
  remainingTime?: number;
}> = ({ title, provider, progress, currentStep, remainingTime }) => {
  const providerInfo = providerConfig[provider];

  return (
    <Box display="flex" alignItems="center" gap={2} p={2} bgcolor="grey.50" borderRadius={1}>
      <Avatar size="small" sx={{ bgcolor: providerInfo.color, width: 32, height: 32 }}>
        {providerInfo.avatar}
      </Avatar>
      
      <Box flex={1}>
        <Typography variant="body2" fontWeight="medium">{title}</Typography>
        {currentStep && (
          <Typography variant="caption" color="text.secondary">
            {currentStep}
          </Typography>
        )}
        
        <LinearProgress
          variant="determinate"
          value={progress}
          size="small"
          sx={{ mt: 1, height: 4, borderRadius: 2 }}
        />
      </Box>
      
      <Box textAlign="right">
        <Typography variant="caption" fontWeight="medium">
          {Math.round(progress)}%
        </Typography>
        {remainingTime && remainingTime > 0 && (
          <Typography variant="caption" color="text.secondary" display="block">
            {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AIOperationProgress;
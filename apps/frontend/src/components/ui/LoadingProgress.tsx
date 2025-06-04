import React, { useState, useEffect } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { keyframes } from '@mui/system';

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

interface LoadingProgressProps {
  value?: number;
  message?: string;
  steps?: string[];
  currentStep?: number;
  estimatedTime?: number;
  variant?: 'linear' | 'stepper' | 'detailed';
  showPercentage?: boolean;
  showTimeRemaining?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  value = 0,
  message,
  steps = [],
  currentStep = 0,
  estimatedTime,
  variant = 'linear',
  showPercentage = true,
  showTimeRemaining = false,
  color = 'primary'
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (estimatedTime && showTimeRemaining) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [estimatedTime, showTimeRemaining]);

  const timeRemaining = estimatedTime ? Math.max(0, estimatedTime - elapsedTime) : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (variant === 'stepper' && steps.length > 0) {
    return (
      <Box>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step key={step}>
              <StepLabel>{step}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {message && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
        {showTimeRemaining && timeRemaining > 0 && (
          <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mt: 1 }}>
            Estimated time remaining: {formatTime(timeRemaining)}
          </Typography>
        )}
      </Box>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Loading Progress</Typography>
            {showPercentage && (
              <Chip 
                label={`${Math.round(value)}%`} 
                size="small" 
                color={color === 'primary' ? 'primary' : 'default'}
              />
            )}
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={value} 
            color={color}
            sx={{ mb: 2, height: 8, borderRadius: 4 }}
          />
          
          {message && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {message}
            </Typography>
          )}
          
          {steps.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Current Step: {steps[currentStep] || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Step {currentStep + 1} of {steps.length}
              </Typography>
            </Box>
          )}
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            {estimatedTime && (
              <Typography variant="caption" color="text.secondary">
                Estimated: {formatTime(estimatedTime)}
              </Typography>
            )}
            {showTimeRemaining && timeRemaining > 0 && (
              <Typography variant="caption" color="text.secondary">
                Remaining: {formatTime(timeRemaining)}
              </Typography>
            )}
            {elapsedTime > 0 && (
              <Typography variant="caption" color="text.secondary">
                Elapsed: {formatTime(elapsedTime)}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
        {showPercentage && (
          <Typography variant="body2" color="text.secondary">
            {Math.round(value)}%
          </Typography>
        )}
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={value} 
        color={color}
        sx={{ 
          mb: showTimeRemaining && timeRemaining > 0 ? 1 : 0,
          height: 6,
          borderRadius: 3
        }}
      />
      
      {showTimeRemaining && timeRemaining > 0 && (
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          {formatTime(timeRemaining)} remaining
        </Typography>
      )}
    </Box>
  );
};

// Shimmer loading effect component
export const ShimmerLoading: React.FC<{ width?: string | number; height?: string | number }> = ({
  width = '100%',
  height = 20
}) => (
  <Box
    sx={{
      width,
      height,
      background: 'linear-gradient(to right, #eeeeee 8%, #dddddd 18%, #eeeeee 33%)',
      backgroundSize: '800px 104px',
      animation: `${shimmer} 1.2s ease-in-out infinite`,
      borderRadius: 1
    }}
  />
);

export default LoadingProgress;
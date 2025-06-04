import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
`;

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  variant?: 'determinate' | 'indeterminate';
  value?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showProgress?: boolean;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  message,
  variant = 'indeterminate',
  value,
  color = 'primary',
  showProgress = false,
  fullScreen = false,
  className
}) => {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      className={className}
    >
      <Box position="relative" display="inline-flex">
        <CircularProgress
          variant={variant}
          value={value}
          size={size}
          color={color}
        />
        {showProgress && variant === 'determinate' && value !== undefined && (
          <Box
            position="absolute"
            top={0}
            left={0}
            bottom={0}
            right={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
              fontSize={size / 4}
            >
              {`${Math.round(value)}%`}
            </Typography>
          </Box>
        )}
      </Box>
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{
            animation: `${pulse} 2s ease-in-out infinite`,
            maxWidth: 300
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingSpinner;
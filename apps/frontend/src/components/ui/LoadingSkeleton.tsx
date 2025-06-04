import React from 'react';
import { Skeleton, Box, Card, CardContent } from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | false;
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'wave',
  lines = 1,
  className
}) => {
  if (lines > 1) {
    return (
      <Box className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant={variant}
            width={index === lines - 1 ? '80%' : width}
            height={height}
            animation={animation}
            sx={{ mb: 0.5 }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      className={className}
    />
  );
};

// Character Card Skeleton
export const CharacterCardSkeleton: React.FC = () => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Skeleton variant="circular" width={60} height={60} />
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Box>
      <Box mb={2}>
        <Skeleton variant="text" width="30%" height={20} />
        <LoadingSkeleton lines={3} height={16} />
      </Box>
      <Box display="flex" gap={1}>
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </Box>
    </CardContent>
  </Card>
);

// Timeline Event Skeleton
export const TimelineEventSkeleton: React.FC = () => (
  <Box display="flex" alignItems="start" gap={2} p={2} border="1px solid" borderColor="divider" borderRadius={1}>
    <Skeleton variant="circular" width={40} height={40} />
    <Box flex={1}>
      <Skeleton variant="text" width="80%" height={24} />
      <Skeleton variant="text" width="50%" height={16} />
      <LoadingSkeleton lines={2} height={14} />
      <Box mt={1} display="flex" gap={1}>
        <Skeleton variant="rectangular" width={60} height={20} />
        <Skeleton variant="rectangular" width={80} height={20} />
      </Box>
    </Box>
  </Box>
);

// Campaign List Skeleton
export const CampaignListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Box>
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" gap={2}>
            <Skeleton variant="rectangular" width={120} height={80} />
            <Box flex={1}>
              <Skeleton variant="text" width="70%" height={28} />
              <Skeleton variant="text" width="50%" height={20} />
              <LoadingSkeleton lines={2} height={16} />
              <Box mt={2} display="flex" gap={1}>
                <Skeleton variant="rectangular" width={100} height={32} />
                <Skeleton variant="rectangular" width={80} height={32} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
);

// World Building Section Skeleton
export const WorldBuildingSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={2}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
            <LoadingSkeleton lines={4} height={16} />
            <Box mt={2}>
              <Skeleton variant="rectangular" width="100%" height={40} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Box>
);

// Dice Roll Skeleton
export const DiceRollSkeleton: React.FC = () => (
  <Box display="flex" alignItems="center" gap={2} p={2}>
    <Skeleton variant="rectangular" width={60} height={60} />
    <Box flex={1}>
      <Skeleton variant="text" width="40%" height={20} />
      <Skeleton variant="text" width="60%" height={24} />
    </Box>
    <Skeleton variant="rectangular" width={80} height={36} />
  </Box>
);

export default LoadingSkeleton;
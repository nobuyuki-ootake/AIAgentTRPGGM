import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Casino,
  AutoStories,
  Group,
  LocationOn,
  Timeline,
  Psychology,
  Image as ImageIcon
} from '@mui/icons-material';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { LoadingSkeleton, CharacterCardSkeleton } from '../ui/LoadingSkeleton';
import { LoadingProgress } from '../ui/LoadingProgress';

// Campaign Data Loading
export const CampaignLoadingState: React.FC<{ message?: string }> = ({ 
  message = "Loading campaign data..." 
}) => (
  <Box display="flex" flex={1} alignItems="center" justifyContent="center" minHeight={400}>
    <LoadingSpinner
      size={60}
      message={message}
      color="primary"
    />
  </Box>
);

// Character Sheet Loading with Animation
export const CharacterSheetLoading: React.FC<{ characterName?: string }> = ({ 
  characterName = "character" 
}) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <LoadingSpinner size={30} />
        <Typography variant="h6">Loading {characterName} sheet...</Typography>
      </Box>
      
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <LoadingSkeleton variant="circular" width={80} height={80} />
        <Box flex={1}>
          <LoadingSkeleton width="60%" height={32} />
          <LoadingSkeleton width="40%" height={24} />
          <LoadingSkeleton width="80%" height={20} />
        </Box>
      </Box>

      <Box mb={3}>
        <Typography variant="subtitle2" gutterBottom>Ability Scores</Typography>
        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Box key={i} textAlign="center">
              <LoadingSkeleton width={60} height={20} />
              <LoadingSkeleton width={40} height={32} />
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>Skills & Equipment</Typography>
        <LoadingSkeleton lines={4} height={16} />
      </Box>
    </CardContent>
  </Card>
);

// AI Response Loading with Progress
export const AIResponseLoading: React.FC<{
  operation: string;
  estimatedTime?: number;
  currentStep?: string;
}> = ({ operation, estimatedTime = 30, currentStep }) => {
  const steps = [
    "Analyzing request...",
    "Consulting AI system...",
    "Generating response...",
    "Finalizing content..."
  ];

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Psychology color="primary" />
          <Typography variant="h6">AI {operation}</Typography>
          <Chip label="Processing" size="small" color="primary" />
        </Box>

        <LoadingProgress
          variant="detailed"
          value={0}
          message={currentStep || "Processing your request..."}
          estimatedTime={estimatedTime}
          showTimeRemaining
          steps={steps}
          currentStep={0}
        />

        <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="body2" color="text.secondary">
            The AI is working on your {operation.toLowerCase()}. This may take a moment depending on the complexity of your request.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

// Timeline Event Processing
export const TimelineEventProcessing: React.FC<{
  eventCount: number;
  processedCount: number;
}> = ({ eventCount, processedCount }) => {
  const progress = eventCount > 0 ? (processedCount / eventCount) * 100 : 0;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Timeline color="primary" />
        <Typography variant="h6">Processing Timeline Events</Typography>
      </Box>

      <LoadingProgress
        value={progress}
        message={`Processing event ${processedCount} of ${eventCount}`}
        showPercentage
        color="primary"
      />

      <Box mt={2}>
        <Typography variant="body2" color="text.secondary">
          Organizing timeline events and checking for conflicts...
        </Typography>
      </Box>
    </Box>
  );
};

// Image Generation Loading
export const ImageGenerationLoading: React.FC<{
  type: 'character' | 'location' | 'item' | 'scene';
  progress?: number;
}> = ({ type, progress = 0 }) => {
  const typeLabels = {
    character: 'Character Portrait',
    location: 'Location Illustration',
    item: 'Item Artwork',
    scene: 'Scene Image'
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <ImageIcon color="primary" />
          <Typography variant="h6">Generating {typeLabels[type]}</Typography>
        </Box>

        <Box textAlign="center" mb={3}>
          <LoadingSkeleton 
            variant="rectangular" 
            width={200} 
            height={200} 
            animation="wave"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            AI is creating your {type} image...
          </Typography>
        </Box>

        {progress > 0 && (
          <LoadingProgress
            value={progress}
            message="Generating high-quality artwork..."
            showPercentage
            estimatedTime={45}
            showTimeRemaining
          />
        )}
      </CardContent>
    </Card>
  );
};

// Session Initialization Loading
export const SessionInitializationLoading: React.FC = () => {
  const initSteps = [
    "Loading campaign data",
    "Preparing character sheets",
    "Setting up AI game master",
    "Initializing dice systems",
    "Ready to play!"
  ];

  return (
    <Box>
      <Box textAlign="center" mb={4}>
        <Casino sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Preparing TRPG Session
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Setting up everything for your adventure...
        </Typography>
      </Box>

      <LoadingProgress
        variant="stepper"
        steps={initSteps}
        currentStep={2}
        message="Loading AI game master personality..."
        showTimeRemaining
        estimatedTime={15}
      />
    </Box>
  );
};

// World Building Data Loading
export const WorldBuildingDataLoading: React.FC<{
  section: string;
  progress?: number;
}> = ({ section, progress = 0 }) => (
  <Box>
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <LocationOn color="primary" />
      <Typography variant="h6">Loading {section}</Typography>
    </Box>

    <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={2} mb={3}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent>
            <LoadingSkeleton width="60%" height={24} />
            <LoadingSkeleton lines={3} height={16} />
            <Box mt={2}>
              <LoadingSkeleton variant="rectangular" width="100%" height={100} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>

    {progress > 0 && (
      <LoadingProgress
        value={progress}
        message={`Loading ${section.toLowerCase()} data...`}
        showPercentage
      />
    )}
  </Box>
);

// Dice Animation Loading
export const DiceAnimationLoading: React.FC<{
  diceType: string;
  rollCount: number;
}> = ({ diceType, rollCount }) => (
  <Box textAlign="center" p={3}>
    <Casino sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
    <Typography variant="h6" gutterBottom>
      Rolling {rollCount} {diceType}
    </Typography>
    <LoadingSpinner size={40} message="Dice are tumbling..." />
    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
      Calculating physics and randomization...
    </Typography>
  </Box>
);

// Bulk Character Loading
export const BulkCharacterLoading: React.FC<{
  totalCharacters: number;
  loadedCharacters: number;
  currentCharacter?: string;
}> = ({ totalCharacters, loadedCharacters, currentCharacter }) => {
  const progress = totalCharacters > 0 ? (loadedCharacters / totalCharacters) * 100 : 0;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Group color="primary" />
        <Typography variant="h6">Loading Characters</Typography>
      </Box>

      <LoadingProgress
        value={progress}
        message={currentCharacter ? `Loading ${currentCharacter}...` : 'Preparing character data...'}
        showPercentage
      />

      <Box mt={3} display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={2}>
        {Array.from({ length: Math.min(3, totalCharacters) }).map((_, index) => (
          <CharacterCardSkeleton key={index} />
        ))}
      </Box>
    </Box>
  );
};

export default {
  CampaignLoadingState,
  CharacterSheetLoading,
  AIResponseLoading,
  TimelineEventProcessing,
  ImageGenerationLoading,
  SessionInitializationLoading,
  WorldBuildingDataLoading,
  DiceAnimationLoading,
  BulkCharacterLoading
};
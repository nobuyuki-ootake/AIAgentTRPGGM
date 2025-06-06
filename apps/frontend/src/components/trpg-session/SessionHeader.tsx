import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
} from '@mui/material';
import {
  Save,
  BugReport,
} from '@mui/icons-material';
import { GameMasterIcon } from '../icons/TRPGIcons';
import { AIAssistButton } from '../ui/AIAssistButton';
import { TRPGCampaign } from '@trpg-ai-gm/types';

interface SessionHeaderProps {
  campaign?: TRPGCampaign;
  currentLocation?: string;
  currentDay: number;
  actionCount: number;
  maxActionsPerDay: number;
  developerMode?: boolean;
  showDebugPanel?: boolean;
  onSaveSession: () => void;
  onOpenAIAssist: () => void;
  onToggleDebugPanel?: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  campaign,
  currentLocation,
  currentDay,
  actionCount,
  maxActionsPerDay,
  developerMode = false,
  showDebugPanel = false,
  onSaveSession,
  onOpenAIAssist,
  onToggleDebugPanel,
}) => {
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: 'primary.dark', color: 'white' }}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item>
          <GameMasterIcon sx={{ fontSize: 40 }} />
        </Grid>
        <Grid item xs>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {campaign?.name || "TRPGセッション"}
          </Typography>
          <Typography variant="subtitle1">
            📍 {currentLocation || "場所の情報がありません"} • {currentDay}日目 • 行動回数: {actionCount}/{maxActionsPerDay}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Save />}
            onClick={onSaveSession}
            sx={{ mr: 1 }}
          >
            保存
          </Button>
          {developerMode && onToggleDebugPanel && (
            <Button
              variant="contained"
              color={showDebugPanel ? "success" : "info"}
              startIcon={<BugReport />}
              onClick={onToggleDebugPanel}
              sx={{ mr: 1 }}
              size="small"
            >
              Debug
            </Button>
          )}
          <AIAssistButton 
            onOpenAIAssist={onOpenAIAssist}
            variant="contained"
            color="warning"
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SessionHeader;
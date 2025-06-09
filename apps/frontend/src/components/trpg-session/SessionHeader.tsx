import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Save,
  BugReport,
  Person,
  Warning,
} from '@mui/icons-material';
import { GameMasterIcon } from '../icons/TRPGIcons';
import { AIAssistButton } from '../ui/AIAssistButton';
import { TRPGCampaign, TRPGCharacter } from '@trpg-ai-gm/types';

interface SessionHeaderProps {
  campaign?: TRPGCampaign;
  currentLocation?: string;
  currentDay: number;
  actionCount: number;
  maxActionsPerDay: number;
  selectedCharacter?: TRPGCharacter | null;
  playerCharacters?: TRPGCharacter[];
  isSessionStarted?: boolean;
  developerMode?: boolean;
  showDebugPanel?: boolean;
  onSaveSession: () => void;
  onStartAISession: () => void;
  onToggleDebugPanel?: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  campaign,
  currentLocation,
  currentDay,
  actionCount,
  maxActionsPerDay,
  selectedCharacter,
  playerCharacters = [],
  isSessionStarted = false,
  developerMode = false,
  showDebugPanel = false,
  onSaveSession,
  onStartAISession,
  onToggleDebugPanel,
}) => {
  // セッション開始可能かチェック
  const canStartSession = selectedCharacter && playerCharacters.length >= 1;
  const buttonTooltip = !selectedCharacter 
    ? "セッションを開始するには、キャラクターを選択してください"
    : playerCharacters.length < 1 
    ? "最低1人のキャラクターが必要です"
    : "AIセッションを開始します";
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: 'primary.dark', color: 'white' }}>
      <Grid container alignItems="center" spacing={2}>
        <Grid size={{ xs: 'auto' }}>
          <GameMasterIcon sx={{ fontSize: 40 }} />
        </Grid>
        <Grid size={{ xs: 'auto' }} sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {campaign?.title || "TRPGセッション"}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Typography variant="subtitle1">
              📍 {currentLocation || "場所の情報がありません"} • {currentDay}日目 • 行動回数: {actionCount}/{maxActionsPerDay}
            </Typography>
            {selectedCharacter && (
              <Chip
                icon={<Person />}
                label={`操作: ${selectedCharacter.name}`}
                size="small"
                sx={{ ml: 1, bgcolor: 'success.main', color: 'white' }}
              />
            )}
            {!selectedCharacter && playerCharacters.length > 0 && (
              <Chip
                icon={<Warning />}
                label="キャラクター未選択"
                size="small"
                color="warning"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </Grid>
        <Grid size={{ xs: 'auto' }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Save />}
            onClick={onSaveSession}
            sx={{ mr: 1 }}
            data-testid="save-session-button"
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
              data-testid="debug-panel-button"
            >
              Debug
            </Button>
          )}
          <Tooltip title={buttonTooltip}>
            <Button
              variant="contained"
              color={isSessionStarted ? "success" : "warning"}
              onClick={onStartAISession}
              disabled={!canStartSession || isSessionStarted}
              size="medium"
              startIcon={isSessionStarted ? <Person /> : undefined}
              data-testid="start-ai-session-button"
            >
              {isSessionStarted ? "セッション進行中" : "AIにセッションを始めてもらう"}
            </Button>
          </Tooltip>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SessionHeader;
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
} from '@mui/material';
import {
  Person,
  Group,
  Computer,
  Games,
  People,
  Lock,
  Public,
  Settings,
} from '@mui/icons-material';

export interface SessionMode {
  type: 'single' | 'multiplayer';
  playerCount: number;
  isPrivate: boolean;
  sessionName?: string;
  inviteCode?: string;
  aiGMEnabled: boolean;
  description?: string;
}

interface SessionModeSelectorProps {
  open: boolean;
  onClose: () => void;
  onModeSelected: (mode: SessionMode) => void;
  campaignName?: string;
}

export const SessionModeSelector: React.FC<SessionModeSelectorProps> = ({
  open,
  onClose,
  onModeSelected,
  campaignName = 'Unknown Campaign',
}) => {
  const [selectedMode, setSelectedMode] = useState<'single' | 'multiplayer'>('single');
  const [playerCount, setPlayerCount] = useState(1);
  const [isPrivate, setIsPrivate] = useState(true);
  const [sessionName, setSessionName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [aiGMEnabled, setAiGMEnabled] = useState(true);

  const handleModeChange = (mode: 'single' | 'multiplayer') => {
    setSelectedMode(mode);
    if (mode === 'single') {
      setPlayerCount(1);
      setIsPrivate(true);
      setSessionName('');
      setInviteCode('');
    } else {
      setPlayerCount(2);
      setSessionName(`${campaignName} セッション`);
      setInviteCode(generateInviteCode());
    }
  };

  const generateInviteCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleStartSession = () => {
    const sessionMode: SessionMode = {
      type: selectedMode,
      playerCount,
      isPrivate,
      sessionName: selectedMode === 'multiplayer' ? sessionName : undefined,
      inviteCode: selectedMode === 'multiplayer' && isPrivate ? inviteCode : undefined,
      aiGMEnabled,
      description: `${selectedMode === 'single' ? 'シングルプレイヤー' : 'マルチプレイヤー'}セッション（${playerCount}人）`,
    };

    onModeSelected(sessionMode);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <Games color="primary" />
          <Typography variant="h6">
            TRPGセッション開始
          </Typography>
        </Stack>
        <Typography variant="subtitle2" color="textSecondary">
          キャンペーン: {campaignName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* AI GM Setting */}
          <Alert severity="info">
            <Stack direction="row" spacing={2} alignItems="center">
              <Computer />
              <Box>
                <Typography variant="body2">
                  <strong>AIセッションマスター機能</strong>
                </Typography>
                <Typography variant="caption">
                  AIがゲームマスターとしてセッションを進行します
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={aiGMEnabled}
                    onChange={(e) => setAiGMEnabled(e.target.checked)}
                  />
                }
                label={aiGMEnabled ? "有効" : "無効"}
              />
            </Stack>
          </Alert>

          {aiGMEnabled && (
            <>
              {/* Mode Selection */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  セッションモード選択
                </Typography>
                <Stack direction="row" spacing={2}>
                  {/* Single Player Mode */}
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedMode === 'single' ? 2 : 1,
                      borderColor: selectedMode === 'single' ? 'primary.main' : 'divider',
                      flex: 1,
                    }}
                    onClick={() => handleModeChange('single')}
                  >
                    <CardContent>
                      <Stack spacing={2} alignItems="center">
                        <Person color={selectedMode === 'single' ? 'primary' : 'action'} />
                        <Typography variant="h6">
                          シングルモード
                        </Typography>
                        <Typography variant="body2" color="textSecondary" textAlign="center">
                          一人でプレイ
                          <br />
                          他のキャラクターは全てAIが操作
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip label="ソロプレイ" size="small" />
                          <Chip label="AI操作" size="small" />
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Multiplayer Mode */}
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedMode === 'multiplayer' ? 2 : 1,
                      borderColor: selectedMode === 'multiplayer' ? 'primary.main' : 'divider',
                      flex: 1,
                    }}
                    onClick={() => handleModeChange('multiplayer')}
                  >
                    <CardContent>
                      <Stack spacing={2} alignItems="center">
                        <Group color={selectedMode === 'multiplayer' ? 'primary' : 'action'} />
                        <Typography variant="h6">
                          マルチプレイモード
                        </Typography>
                        <Typography variant="body2" color="textSecondary" textAlign="center">
                          複数人でプレイ
                          <br />
                          リアルタイム協力プレイ
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip label="協力プレイ" size="small" />
                          <Chip label="リアルタイム" size="small" />
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Box>

              <Divider />

              {/* Mode-specific Settings */}
              {selectedMode === 'single' && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      シングルモード設定
                    </Typography>
                    <Stack spacing={2}>
                      <Alert severity="success">
                        <Typography variant="body2">
                          <strong>シングルモードの特徴：</strong>
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          <li>プレイヤーは1つのキャラクターを操作</li>
                          <li>パーティーの他のキャラクターはAIが自動操作</li>
                          <li>AIゲームマスターが物語を進行</li>
                          <li>いつでも中断・再開可能</li>
                          <li>自分のペースでプレイ可能</li>
                        </ul>
                      </Alert>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {selectedMode === 'multiplayer' && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      マルチプレイモード設定
                    </Typography>
                    <Stack spacing={3}>
                      <TextField
                        label="セッション名"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        fullWidth
                        placeholder="例: 勇者の冒険 第1話"
                      />

                      <Box>
                        <FormControl fullWidth>
                          <InputLabel>プレイヤー人数</InputLabel>
                          <Select
                            value={playerCount}
                            onChange={(e) => setPlayerCount(e.target.value as number)}
                          >
                            {[2, 3, 4, 5, 6].map(count => (
                              <MenuItem key={count} value={count}>
                                {count}人
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      <FormControlLabel
                        control={
                          <Switch
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {isPrivate ? <Lock /> : <Public />}
                              <Typography>
                                {isPrivate ? 'プライベートセッション' : 'パブリックセッション'}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" color="textSecondary">
                              {isPrivate 
                                ? '招待コードが必要です' 
                                : 'だれでも参加可能です'}
                            </Typography>
                          </Box>
                        }
                      />

                      {isPrivate && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            招待コード
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <TextField
                              value={inviteCode}
                              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                              placeholder="ABCD12"
                              inputProps={{ maxLength: 6 }}
                            />
                            <Button
                              onClick={() => setInviteCode(generateInviteCode())}
                              variant="outlined"
                              size="small"
                            >
                              再生成
                            </Button>
                          </Stack>
                          <Typography variant="caption" color="textSecondary">
                            このコードを他のプレイヤーに共有してください
                          </Typography>
                        </Box>
                      )}

                      <Alert severity="info">
                        <Typography variant="body2">
                          <strong>マルチプレイモードの特徴：</strong>
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                          <li>複数プレイヤーがリアルタイムで協力</li>
                          <li>チャット機能でコミュニケーション</li>
                          <li>同期されたダイスロール</li>
                          <li>AIゲームマスターが進行管理</li>
                          <li>全員の行動を考慮した物語展開</li>
                        </ul>
                      </Alert>
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!aiGMEnabled && (
            <Alert severity="warning">
              <Typography variant="body2">
                AIセッションマスター機能を無効にすると、手動でのセッション管理が必要になります。
                この機能は現在実装中です。
              </Typography>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleStartSession}
          disabled={!aiGMEnabled || (selectedMode === 'multiplayer' && !sessionName.trim())}
        >
          セッション開始
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionModeSelector;
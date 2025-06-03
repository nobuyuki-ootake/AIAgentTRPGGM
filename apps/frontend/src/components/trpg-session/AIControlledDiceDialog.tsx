import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
  AlertTitle,
  Button,
  Chip,
  Stack,
  LinearProgress,
  Fade,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Casino,
  Lock,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTRPGSession } from '../../hooks/useTRPGSession';
import { DiceRollResult } from '../../hooks/useTRPGSession';
import DiceDisplay from '../dice/DiceDisplay';

interface DiceSpecification {
  dice: string; // e.g., "d20", "2d6+3"
  modifier?: number;
  reason: string; // AIが要求する理由
  difficulty?: number; // 難易度クラス（DC）
  characterId?: string; // どのキャラクターの判定か
  skillName?: string; // スキル名（例：知覚、反射神経）
}

interface DiceResult {
  dice: string;
  rolls: number[];
  modifier: number;
  total: number;
  success?: boolean;
}

interface AIControlledDiceDialogProps {
  open: boolean;
  aiRequiredDice: DiceSpecification;
  onDiceRoll: (result: DiceResult) => void;
  onValidationFailed?: (error: string) => void;
}

export const AIControlledDiceDialog: React.FC<AIControlledDiceDialogProps> = ({
  open,
  aiRequiredDice,
  onDiceRoll,
  onValidationFailed,
}) => {
  const [validationError, setValidationError] = useState<string>('');
  const [rolledDice, setRolledDice] = useState<DiceResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const { rollDice } = useTRPGSession();

  // ダイス記法をパース
  const parseDiceNotation = (notation: string): { count: number; sides: number; modifier: number } => {
    const match = notation.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) {
      return { count: 1, sides: 20, modifier: 0 };
    }
    
    const count = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    return { count, sides, modifier };
  };

  // ダイスロールの実行
  const handleDiceRoll = useCallback(async () => {
    setIsRolling(true);
    setValidationError('');
    setAttemptCount(prev => prev + 1);

    try {
      // 実際のダイスロール処理
      const result = await rollDice(aiRequiredDice.dice);
      
      // AIが要求したダイスと一致するか検証
      if (result.dice !== aiRequiredDice.dice) {
        const error = `AIが指定した${aiRequiredDice.dice}を振ってください。あなたは${result.dice}を振りました。`;
        setValidationError(error);
        if (onValidationFailed) {
          onValidationFailed(error);
        }
        setIsRolling(false);
        return;
      }

      // 成功判定
      const success = aiRequiredDice.difficulty 
        ? result.total >= aiRequiredDice.difficulty 
        : undefined;

      const finalResult: DiceResult = {
        ...result,
        success,
      };

      setRolledDice(finalResult);
      
      // 成功時は少し待ってから結果を送信
      setTimeout(() => {
        onDiceRoll(finalResult);
      }, 1500);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ダイスロールに失敗しました';
      setValidationError(errorMessage);
      if (onValidationFailed) {
        onValidationFailed(errorMessage);
      }
    } finally {
      setIsRolling(false);
    }
  }, [aiRequiredDice, rollDice, onDiceRoll, onValidationFailed]);

  // エスケープキーとクリックアウトを無効化
  useEffect(() => {
    if (open) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [open]);

  // ダイアログが開いた時の初期化
  useEffect(() => {
    if (open) {
      setValidationError('');
      setRolledDice(null);
      setAttemptCount(0);
    }
  }, [open]);

  const { count, sides, modifier } = parseDiceNotation(aiRequiredDice.dice);

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        // バックドロップクリックとエスケープキーでの閉じるを無効化
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          event?.preventDefault();
          event?.stopPropagation();
        }
      }}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          border: '3px solid',
          borderColor: 'error.main',
          boxShadow: 24,
        },
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'error.dark', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}>
        <Lock />
        <Typography variant="h6" component="span" sx={{ flex: 1 }}>
          AI制御ダイスロール - 強制判定
        </Typography>
        <IconButton 
          disabled 
          sx={{ 
            color: 'white', 
            opacity: 0.3,
            cursor: 'not-allowed',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>AIゲームマスターからの要求</AlertTitle>
          このダイスロールは必須です。正しいダイスを振るまでこのダイアログは閉じられません。
        </Alert>

        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="h4" gutterBottom color="primary">
            {aiRequiredDice.dice}
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            {aiRequiredDice.reason}
          </Typography>

          {aiRequiredDice.skillName && (
            <Chip 
              label={`${aiRequiredDice.skillName}判定`} 
              color="primary" 
              variant="outlined"
              sx={{ mb: 2 }}
            />
          )}

          {aiRequiredDice.difficulty && (
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                難易度クラス (DC)
              </Typography>
              <Typography variant="h3" color="error">
                {aiRequiredDice.difficulty}
              </Typography>
            </Box>
          )}

          <Box sx={{ 
            mt: 3, 
            p: 3, 
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: 'divider',
          }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              必要なダイス
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
              <Chip
                icon={<Casino />}
                label={`${count}個`}
                color="default"
              />
              <Typography variant="h6">×</Typography>
              <Chip
                label={`d${sides}`}
                color="primary"
                variant="outlined"
              />
              {modifier !== 0 && (
                <>
                  <Typography variant="h6">
                    {modifier > 0 ? '+' : ''}
                  </Typography>
                  <Chip
                    label={Math.abs(modifier).toString()}
                    color={modifier > 0 ? 'success' : 'error'}
                  />
                </>
              )}
            </Stack>
          </Box>

          {/* ダイス可視化 */}
          {count <= 3 && sides <= 20 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                ダイス可視化
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {Array.from({ length: count }, (_, index) => (
                  <Grid item key={index}>
                    <DiceDisplay
                      diceType={`d${sides}` as any}
                      result={rolledDice?.rolls[index]}
                      isRolling={isRolling}
                      size={80}
                      showModeToggle={false}
                      defaultMode="2d"
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* ダイスロール結果 */}
          {rolledDice && (
            <Fade in>
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="h5" gutterBottom>
                  結果: {rolledDice.total}
                </Typography>
                {aiRequiredDice.difficulty && (
                  <Box sx={{ mt: 1 }}>
                    {rolledDice.success ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="成功！"
                        color="success"
                        size="large"
                      />
                    ) : (
                      <Chip
                        icon={<ErrorIcon />}
                        label="失敗..."
                        color="error"
                        size="large"
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Fade>
          )}

          {/* エラー表示 */}
          {validationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>検証エラー</AlertTitle>
              {validationError}
              {attemptCount > 2 && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  試行回数: {attemptCount}回 - 指定されたダイスを正確に振ってください
                </Typography>
              )}
            </Alert>
          )}

          {/* ローディング */}
          {isRolling && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                ダイスを振っています...
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        bgcolor: 'action.hover',
        justifyContent: 'center',
      }}>
        <Button
          variant="contained"
          color="error"
          size="large"
          onClick={handleDiceRoll}
          disabled={isRolling || !!rolledDice}
          startIcon={<Casino />}
          sx={{ 
            minWidth: 200,
            py: 1.5,
          }}
        >
          {rolledDice ? '判定完了' : `${aiRequiredDice.dice}を振る`}
        </Button>
      </DialogActions>

      {/* 警告メッセージ */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'warning.dark',
        color: 'warning.contrastText',
        textAlign: 'center',
      }}>
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          <Warning fontSize="small" />
          <Typography variant="caption">
            このダイアログは手動で閉じることができません
          </Typography>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default AIControlledDiceDialog;
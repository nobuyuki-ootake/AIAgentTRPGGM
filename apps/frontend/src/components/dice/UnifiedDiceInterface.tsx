import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  Paper,
} from '@mui/material';
import {
  Casino,
  Refresh,
  History,
  Settings,
  Info,
  PlayArrow,
  Stop,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useRecoilValue } from 'recoil';
import { currentCampaignState } from '../../store/atoms';
import { 
  DiceNotationParser, 
  DiceRollEngine, 
  GameSystemDiceInterface,
  GAME_SYSTEM_RULES,
  DiceResult 
} from '../../utils/DiceNotationSystem';

interface UnifiedDiceInterfaceProps {
  open: boolean;
  onClose: () => void;
  onResult?: (result: DiceResult & { targetMet?: boolean }) => void;
  gameSystem?: string;
  defaultNotation?: string;
  targetValue?: number;
  requiredDice?: string; // AI制御モード用
  forcedMode?: boolean; // 強制モード（閉じることができない）
  title?: string;
  description?: string;
}

interface DiceHistory {
  notation: string;
  result: DiceResult;
  timestamp: Date;
  targetValue?: number;
  targetMet?: boolean;
}

export const UnifiedDiceInterface: React.FC<UnifiedDiceInterfaceProps> = ({
  open,
  onClose,
  onResult,
  gameSystem: propGameSystem,
  defaultNotation = '',
  targetValue,
  requiredDice,
  forcedMode = false,
  title = '🎲 ダイスロール',
  description = 'ダイス記法を入力してロールしてください',
}) => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [notation, setNotation] = useState(defaultNotation);
  const [selectedGameSystem, setSelectedGameSystem] = useState(propGameSystem || currentCampaign?.gameSystem || 'dnd5e');
  const [target, setTarget] = useState<string>(targetValue?.toString() || '');
  const [lastResult, setLastResult] = useState<DiceResult | null>(null);
  const [history, setHistory] = useState<DiceHistory[]>([]);
  const [validationError, setValidationError] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ゲームシステムインターフェースを初期化
  const diceInterface = new GameSystemDiceInterface(selectedGameSystem);

  // 強制モードでrequiredDiceが指定されている場合はnotationを固定
  useEffect(() => {
    if (forcedMode && requiredDice) {
      setNotation(requiredDice);
    }
  }, [forcedMode, requiredDice]);

  // 推奨ダイスリストを取得
  const recommendedDice = diceInterface.getRecommendedDice();
  const commonChecks = diceInterface.getCommonChecks();

  // ダイスロール実行
  const handleRoll = () => {
    try {
      setValidationError('');

      // 強制モードでの検証
      if (forcedMode && requiredDice && notation !== requiredDice) {
        setValidationError(`AI指定のダイス「${requiredDice}」を正確に入力してください`);
        return;
      }

      const targetNum = target ? parseInt(target) : undefined;
      const result = diceInterface.rollWithTarget(notation, targetNum);
      
      setLastResult(result);

      // 履歴に追加
      const historyEntry: DiceHistory = {
        notation,
        result,
        timestamp: new Date(),
        targetValue: targetNum,
        targetMet: result.targetMet,
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // 最新10件を保持

      // 結果をコールバック
      if (onResult) {
        onResult(result);
      }

      // 強制モードでない場合は結果表示後に閉じる
      if (!forcedMode) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (error: unknown) {
      setValidationError(`エラー: ${error instanceof Error ? error.message : 'ダイスロールに失敗しました'}`);
    }
  };

  // 記法検証
  const validateNotation = (value: string) => {
    const diceRoll = DiceNotationParser.parse(value, selectedGameSystem);
    if (!diceRoll && value.trim()) {
      setValidationError('無効なダイス記法です');
    } else {
      setValidationError('');
    }
  };

  // ゲームシステム変更
  const handleSystemChange = (system: string) => {
    setSelectedGameSystem(system);
    setNotation(''); // リセット
    setTarget('');
    setLastResult(null);
  };

  // クイック設定
  const handleQuickSet = (quickNotation: string) => {
    setNotation(quickNotation);
    validateNotation(quickNotation);
  };

  // 結果の文字色を決定
  const getResultColor = (result: DiceResult) => {
    if (result.critical) return 'success.main';
    if (result.fumble) return 'error.main';
    if (result.targetMet === true) return 'success.main';
    if (result.targetMet === false) return 'error.main';
    return 'text.primary';
  };

  return (
    <Dialog
      open={open}
      onClose={forcedMode ? undefined : onClose} // 強制モードでは閉じることができない
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={forcedMode}
    >
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center">
          <Casino color="primary" />
          <Typography variant="h6">{title}</Typography>
          {forcedMode && (
            <Chip 
              label="AI制御モード" 
              color="warning" 
              size="small"
              icon={<Settings />}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* 説明文 */}
          <Alert severity="info" icon={<Info />}>
            {description}
            {forcedMode && requiredDice && (
              <><br /><strong>指定されたダイス</strong>: {requiredDice}</>
            )}
          </Alert>

          {/* ゲームシステム選択 */}
          {!forcedMode && (
            <FormControl fullWidth>
              <InputLabel>ゲームシステム</InputLabel>
              <Select
                value={selectedGameSystem}
                onChange={(e) => handleSystemChange(e.target.value)}
              >
                {Object.values(GAME_SYSTEM_RULES).map(rule => (
                  <MenuItem key={rule.id} value={rule.id}>
                    {rule.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* ダイス記法入力 */}
          <Box>
            <TextField
              fullWidth
              label="ダイス記法"
              value={notation}
              onChange={(e) => {
                if (!forcedMode) {
                  setNotation(e.target.value);
                  validateNotation(e.target.value);
                }
              }}
              error={!!validationError}
              helperText={validationError || '例: d20+5, 3d6, d100'}
              disabled={forcedMode}
              variant="outlined"
            />

            {/* クイック設定ボタン */}
            {!forcedMode && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  推奨ダイス:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {recommendedDice.slice(0, 6).map(dice => (
                    <Chip
                      key={dice}
                      label={dice}
                      size="small"
                      onClick={() => handleQuickSet(dice)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          {/* 目標値設定 */}
          {!forcedMode && GAME_SYSTEM_RULES[selectedGameSystem]?.successBasedSystem && (
            <TextField
              label="目標値（オプション）"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              type="number"
              helperText={`${GAME_SYSTEM_RULES[selectedGameSystem]?.name}の判定用`}
            />
          )}

          {/* 最新結果表示 */}
          {lastResult && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎲 ロール結果
                </Typography>
                <Typography 
                  variant="h4" 
                  sx={{ color: getResultColor(lastResult) }}
                  gutterBottom
                >
                  {lastResult.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lastResult.description}
                </Typography>
                
                {/* 成功/失敗判定 */}
                {lastResult.targetMet !== undefined && (
                  <Alert 
                    severity={lastResult.targetMet ? 'success' : 'error'} 
                    sx={{ mt: 1 }}
                    icon={lastResult.targetMet ? <CheckCircle /> : <Error />}
                  >
                    {lastResult.targetMet ? '成功！' : '失敗...'}
                  </Alert>
                )}

                {/* クリティカル/ファンブル */}
                {lastResult.critical && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    🌟 クリティカル！
                  </Alert>
                )}
                {lastResult.fumble && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    💥 ファンブル...
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* 一般的な判定（高度設定） */}
          {!forcedMode && showAdvanced && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  一般的な判定
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(commonChecks).map(([key, value]) => (
                    <Grid size={{ xs: 6, sm: 4 }} key={key}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => handleQuickSet(value)}
                      >
                        {key}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* 履歴表示 */}
          {!forcedMode && history.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <History sx={{ verticalAlign: 'middle', mr: 1 }} />
                  ロール履歴
                </Typography>
                <Stack spacing={1}>
                  {history.slice(0, 3).map((entry, index) => (
                    <Paper key={index} sx={{ p: 1, bgcolor: 'grey.50' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {entry.notation} = {entry.result.total}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          {/* 高度設定切り替え */}
          {!forcedMode && (
            <Tooltip title="高度設定">
              <IconButton onClick={() => setShowAdvanced(!showAdvanced)}>
                <Settings />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ flex: 1 }} />

          {/* キャンセルボタン（強制モードでは無効） */}
          {!forcedMode && (
            <Button onClick={onClose}>
              キャンセル
            </Button>
          )}

          {/* ロールボタン */}
          <Button
            variant="contained"
            onClick={handleRoll}
            disabled={!notation.trim() || !!validationError}
            startIcon={<Casino />}
          >
            ロール
          </Button>

          {/* 強制モードでの確認ボタン */}
          {forcedMode && lastResult && (
            <Button
              variant="contained"
              color="success"
              onClick={onClose}
              startIcon={<CheckCircle />}
            >
              確認
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default UnifiedDiceInterface;
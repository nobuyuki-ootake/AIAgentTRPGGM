import React, { useState, useEffect, Suspense } from 'react';
import { 
  Box, 
  FormControlLabel, 
  Switch, 
  Typography, 
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import Dice2D from './Dice2D';
import { DiceTheme } from './DiceTheme';

// Lazy load the 3D component to handle potential loading issues
const DiceVisualization = React.lazy(() => import('./DiceVisualization'));

interface DiceDisplayProps {
  diceType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  result?: number;
  isRolling?: boolean;
  onRollComplete?: (result: number) => void;
  size?: number;
  showModeToggle?: boolean;
  defaultMode?: '2d' | '3d';
  theme?: DiceTheme;
}

const DiceDisplay: React.FC<DiceDisplayProps> = ({
  diceType,
  result,
  isRolling = false,
  onRollComplete,
  size = 80,
  showModeToggle = true,
  defaultMode = '2d',
  theme
}) => {
  const [mode, setMode] = useState<'2d' | '3d'>(defaultMode);
  const [has3DSupport, setHas3DSupport] = useState(true);
  const [loadingError, setLoadingError] = useState(false);

  // WebGL サポートチェック
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHas3DSupport(!!gl);
    } catch (error) {
      setHas3DSupport(false);
    }
  }, []);

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.checked ? '3d' : '2d';
    if (newMode === '3d' && !has3DSupport) {
      // 3Dサポートがない場合は2Dモードのまま
      return;
    }
    setMode(newMode);
  };

  const handle3DError = () => {
    setLoadingError(true);
    setMode('2d');
  };

  const renderDice = () => {
    if (mode === '3d' && has3DSupport && !loadingError) {
      return (
        <Suspense 
          fallback={
            <Box 
              sx={{ 
                width: '100%', 
                height: 200, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
            >
              <CircularProgress />
            </Box>
          }
        >
          <ErrorBoundary onError={handle3DError}>
            <DiceVisualization
              diceType={diceType}
              result={result}
              isRolling={isRolling}
              onRollComplete={onRollComplete}
              theme={theme}
            />
          </ErrorBoundary>
        </Suspense>
      );
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Dice2D
          type={diceType}
          value={result}
          isRolling={isRolling}
          size={size}
          onRollComplete={onRollComplete}
          theme={theme}
        />
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2 }}>
      {showModeToggle && (
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={mode === '3d'}
                onChange={handleModeChange}
                disabled={!has3DSupport || loadingError}
              />
            }
            label={
              <Typography variant="body2">
                3D表示
                {!has3DSupport && ' (お使いのブラウザは3D表示をサポートしていません)'}
                {loadingError && ' (3D表示でエラーが発生しました)'}
              </Typography>
            }
          />
        </Box>
      )}

      {!has3DSupport && mode === '3d' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          お使いのブラウザは3D表示をサポートしていないため、2D表示に切り替えられました。
        </Alert>
      )}

      {loadingError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          3D表示でエラーが発生したため、2D表示に切り替えました。
        </Alert>
      )}

      {renderDice()}
    </Paper>
  );
};

// Error Boundary コンポーネント
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Dice rendering error:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          sx={{ 
            width: '100%', 
            height: 200, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}
        >
          <Typography>3D表示でエラーが発生しました</Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default DiceDisplay;
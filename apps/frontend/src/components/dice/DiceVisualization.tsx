import React from 'react';
import { Box as MUIBox, Typography, Paper } from '@mui/material';
import { DiceTheme, DICE_THEMES } from './DiceTheme';

interface DiceProps {
  type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  value?: number;
  isRolling?: boolean;
  theme?: DiceTheme;
}

interface DiceVisualizationProps {
  diceType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  result?: number;
  isRolling?: boolean;
  onRollComplete?: (result: number) => void;
  theme?: DiceTheme;
}

// 一時的な2Dダイス表示（3D依存関係問題回避のため）
const Dice: React.FC<DiceProps> = ({ 
  type, 
  value, 
  isRolling = false, 
  theme = DICE_THEMES.classic 
}) => {
  const getDiceSymbol = (diceType: string) => {
    switch (diceType) {
      case 'd4': return '△';
      case 'd6': return '⚅';
      case 'd8': return '⬧';
      case 'd10': return '⬟';
      case 'd12': return '⬢';
      case 'd20': return '⬣';
      default: return '⚅';
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.color,
        color: theme.textColor || '#fff',
        border: `2px solid ${theme.borderColor || theme.color}`,
        borderRadius: 2,
        animation: isRolling ? 'roll 0.5s infinite' : 'none',
        '@keyframes roll': {
          '0%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(90deg)' },
          '50%': { transform: 'rotate(180deg)' },
          '75%': { transform: 'rotate(270deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }}
    >
      <MUIBox textAlign="center">
        <Typography variant="h6" component="div" sx={{ fontSize: '1.2rem' }}>
          {getDiceSymbol(type)}
        </Typography>
        {value && (
          <Typography variant="caption" component="div" sx={{ fontSize: '0.7rem' }}>
            {value}
          </Typography>
        )}
      </MUIBox>
    </Paper>
  );
};

const DiceVisualization: React.FC<DiceVisualizationProps> = ({
  diceType,
  result,
  isRolling,
  onRollComplete,
  theme = DICE_THEMES.classic
}) => {
  React.useEffect(() => {
    if (isRolling && onRollComplete) {
      const timer = setTimeout(() => {
        const maxValue = parseInt(diceType.substring(1));
        const rollResult = Math.floor(Math.random() * maxValue) + 1;
        onRollComplete(rollResult);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isRolling, onRollComplete, diceType]);

  return (
    <MUIBox 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 2 
      }}
    >
      <Dice 
        type={diceType} 
        value={result} 
        isRolling={isRolling}
        theme={theme}
      />
    </MUIBox>
  );
};

export default DiceVisualization;
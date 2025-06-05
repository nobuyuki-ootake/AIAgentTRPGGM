import React, { useState, useEffect } from 'react';
import { Box, Typography, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';
import { DiceTheme, DICE_THEMES } from './DiceTheme';

interface Dice2DProps {
  type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  value?: number;
  isRolling?: boolean;
  size?: number;
  onRollComplete?: (result: number) => void;
  theme?: DiceTheme;
}

const rollAnimation = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.1); }
  50% { transform: rotate(180deg) scale(0.9); }
  75% { transform: rotate(270deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
`;

const bounceAnimation = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

const DiceContainer = styled(Box)<{ isRolling: boolean; size: number }>(({ theme, isRolling, size }) => ({
  width: size,
  height: size,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  cursor: 'pointer',
  animation: isRolling ? `${rollAnimation} 0.8s ease-in-out infinite, ${bounceAnimation} 0.8s ease-in-out infinite` : 'none',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: isRolling ? 'none' : 'scale(1.05)',
  },
}));

const DiceShape = styled(Box)<{ diceType: string; size: number; color: string }>(({ diceType, size, color }) => {
  const baseStyles = {
    width: size * 0.8,
    height: size * 0.8,
    backgroundColor: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: 'white',
    textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
    border: '2px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
    position: 'relative',
    fontSize: Math.max(12, size * 0.3),
  };

  switch (diceType) {
    case 'd4':
      return {
        ...baseStyles,
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        borderRadius: 0,
      };
    case 'd6':
      return {
        ...baseStyles,
        borderRadius: '8px',
      };
    case 'd8':
      return {
        ...baseStyles,
        clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        borderRadius: 0,
      };
    case 'd10':
      return {
        ...baseStyles,
        clipPath: 'polygon(50% 0%, 80% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 20% 20%)',
        borderRadius: 0,
      };
    case 'd12':
      return {
        ...baseStyles,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        borderRadius: 0,
      };
    case 'd20':
      return {
        ...baseStyles,
        borderRadius: '50%',
        clipPath: 'circle(40%)',
      };
    default:
      return baseStyles;
  }
});

const getDiceColor = (type: string, theme: DiceTheme): string => {
  return theme.colors[type as keyof DiceTheme['colors']] || theme.colors.d6;
};

const getMaxValue = (type: string): number => {
  return parseInt(type.substring(1));
};

const DicePattern: React.FC<{ type: string; value: number; size: number; theme: DiceTheme }> = ({ type, value, size, theme }) => {
  if (type === 'd6' && value <= 6) {
    // d6の場合は点のパターンを表示
    const dots = [];
    const dotSize = size * 0.05;
    const positions = {
      1: [[0, 0]],
      2: [[-0.2, -0.2], [0.2, 0.2]],
      3: [[-0.2, -0.2], [0, 0], [0.2, 0.2]],
      4: [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]],
      5: [[-0.2, -0.2], [0.2, -0.2], [0, 0], [-0.2, 0.2], [0.2, 0.2]],
      6: [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0], [0.2, 0], [-0.2, 0.2], [0.2, 0.2]]
    };

    const dotPositions = positions[value as keyof typeof positions] || [];
    
    return (
      <>
        {dotPositions.map((pos, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              width: dotSize,
              height: dotSize,
              backgroundColor: 'white',
              borderRadius: '50%',
              left: `calc(50% + ${pos[0] * size}px)`,
              top: `calc(50% + ${pos[1] * size}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </>
    );
  }

  // その他のダイスは数字を表示
  return (
    <Typography
      variant="h6"
      sx={{
        fontSize: Math.max(12, size * 0.25),
        fontWeight: 'bold',
        color: theme.textColor || 'white',
        textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
      }}
    >
      {value}
    </Typography>
  );
};

const Dice2D: React.FC<Dice2DProps> = ({
  type,
  value,
  isRolling = false,
  size = 80,
  onRollComplete,
  theme = DICE_THEMES.classic
}) => {
  const [currentValue, setCurrentValue] = useState<number | undefined>(value);
  const [rollingValue, setRollingValue] = useState<number>(1);

  useEffect(() => {
    if (isRolling) {
      setCurrentValue(undefined);
      
      // ロール中のアニメーション用のランダム値変更
      const interval = setInterval(() => {
        setRollingValue(Math.floor(Math.random() * getMaxValue(type)) + 1);
      }, 100);

      // 2秒後に結果を確定
      const timeout = setTimeout(() => {
        clearInterval(interval);
        const result = Math.floor(Math.random() * getMaxValue(type)) + 1;
        setCurrentValue(result);
        onRollComplete?.(result);
      }, 2000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setCurrentValue(value);
    }
  }, [isRolling, value, type, onRollComplete]);

  const displayValue = isRolling ? rollingValue : currentValue;
  const color = getDiceColor(type, theme);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <DiceContainer isRolling={isRolling} size={size}>
        <DiceShape diceType={type} size={size} color={color}>
          {displayValue && (
            <DicePattern type={type} value={displayValue} size={size} theme={theme} />
          )}
        </DiceShape>
      </DiceContainer>
      
      <Typography variant="caption" color="text.secondary">
        {type.toUpperCase()}
        {currentValue && !isRolling && ` : ${currentValue}`}
      </Typography>
      
      {isRolling && (
        <Typography variant="caption" color="primary">
          転がっています...
        </Typography>
      )}
    </Box>
  );
};

export default Dice2D;
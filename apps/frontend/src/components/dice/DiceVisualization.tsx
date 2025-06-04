import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Text, OrbitControls } from '@react-three/drei';
import { Mesh } from 'three';
import { Box as MUIBox, Typography } from '@mui/material';

export interface DiceTheme {
  name: string;
  colors: {
    d4: string;
    d6: string;
    d8: string;
    d10: string;
    d12: string;
    d20: string;
  };
  material?: 'standard' | 'metallic' | 'glass' | 'neon';
  textColor?: string;
  glowEffect?: boolean;
}

export const DICE_THEMES: { [key: string]: DiceTheme } = {
  classic: {
    name: 'クラシック',
    colors: {
      d4: '#ff6b6b',
      d6: '#4ecdc4',
      d8: '#45b7d1',
      d10: '#96ceb4',
      d12: '#ffeaa7',
      d20: '#dda0dd'
    },
    material: 'standard',
    textColor: 'white'
  },
  fantasy: {
    name: 'ファンタジー',
    colors: {
      d4: '#8B4513',
      d6: '#DAA520',
      d8: '#4B0082',
      d10: '#228B22',
      d12: '#DC143C',
      d20: '#FF4500'
    },
    material: 'metallic',
    textColor: '#FFD700',
    glowEffect: true
  },
  cyberpunk: {
    name: 'サイバーパンク',
    colors: {
      d4: '#00FFFF',
      d6: '#FF1493',
      d8: '#00FF00',
      d10: '#FFD700',
      d12: '#FF69B4',
      d20: '#9400D3'
    },
    material: 'neon',
    textColor: '#FFFFFF',
    glowEffect: true
  },
  nature: {
    name: 'ナチュラル',
    colors: {
      d4: '#8FBC8F',
      d6: '#DEB887',
      d8: '#5F9EA0',
      d10: '#D2691E',
      d12: '#9ACD32',
      d20: '#CD853F'
    },
    material: 'standard',
    textColor: '#2F4F4F'
  },
  fire: {
    name: '炎',
    colors: {
      d4: '#FF0000',
      d6: '#FF4500',
      d8: '#FF6347',
      d10: '#FF8C00',
      d12: '#FFA500',
      d20: '#FFD700'
    },
    material: 'metallic',
    textColor: '#FFFF00',
    glowEffect: true
  },
  ice: {
    name: '氷',
    colors: {
      d4: '#B0E0E6',
      d6: '#87CEEB',
      d8: '#87CEFA',
      d10: '#00BFFF',
      d12: '#1E90FF',
      d20: '#0000FF'
    },
    material: 'glass',
    textColor: '#FFFFFF'
  }
};

interface DiceProps {
  type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  value?: number;
  isRolling?: boolean;
  position?: [number, number, number];
  theme?: DiceTheme;
}

interface DiceVisualizationProps {
  diceType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  result?: number;
  isRolling?: boolean;
  onRollComplete?: (result: number) => void;
  theme?: DiceTheme;
}

const Dice: React.FC<DiceProps> = ({ type, value, isRolling = false, position = [0, 0, 0], theme = DICE_THEMES.classic }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current && isRolling) {
      meshRef.current.rotation.x += delta * 3;
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.rotation.z += delta * 1;
    }
  });

  const getDiceGeometry = () => {
    switch (type) {
      case 'd4':
        return <coneGeometry args={[0.8, 1.6, 4]} />;
      case 'd6':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'd8':
        return <octahedronGeometry args={[0.8]} />;
      case 'd10':
        return <coneGeometry args={[0.8, 1.2, 10]} />;
      case 'd12':
        return <dodecahedronGeometry args={[0.8]} />;
      case 'd20':
        return <icosahedronGeometry args={[0.8]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  const getDiceColor = () => {
    return theme.colors[type] || theme.colors.d6;
  };

  const getMaterial = () => {
    const color = getDiceColor();
    const baseProps = {
      color,
      transparent: theme.material === 'glass',
      opacity: theme.material === 'glass' ? 0.8 : 1
    };

    switch (theme.material) {
      case 'metallic':
        return <meshStandardMaterial {...baseProps} metalness={0.8} roughness={0.2} />;
      case 'glass':
        return <meshPhysicalMaterial {...baseProps} transmission={0.9} thickness={0.2} />;
      case 'neon':
        return <meshStandardMaterial {...baseProps} emissive={color} emissiveIntensity={0.3} />;
      default:
        return <meshStandardMaterial {...baseProps} />;
    }
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        {getDiceGeometry()}
        {getMaterial()}
      </mesh>
      
      {/* グロー効果 */}
      {theme.glowEffect && (
        <mesh position={position} scale={hovered ? 1.15 : 1.05}>
          {getDiceGeometry()}
          <meshStandardMaterial
            color={getDiceColor()}
            transparent
            opacity={0.2}
            emissive={getDiceColor()}
            emissiveIntensity={0.1}
          />
        </mesh>
      )}
      
      {value && !isRolling && (
        <Text
          position={[position[0], position[1], position[2] + 1]}
          fontSize={0.3}
          color={theme.textColor || 'white'}
          anchorX="center"
          anchorY="middle"
        >
          {value.toString()}
        </Text>
      )}
    </group>
  );
};

const DiceVisualization: React.FC<DiceVisualizationProps> = ({
  diceType,
  result,
  isRolling = false,
  onRollComplete,
  theme = DICE_THEMES.classic
}) => {
  const [animationResult, setAnimationResult] = useState<number | undefined>(result);

  React.useEffect(() => {
    if (isRolling) {
      setAnimationResult(undefined);
      
      // シミュレートされたロール時間
      const rollDuration = 2000;
      
      setTimeout(() => {
        const maxValue = parseInt(diceType.substring(1));
        const rollResult = Math.floor(Math.random() * maxValue) + 1;
        setAnimationResult(rollResult);
        onRollComplete?.(rollResult);
      }, rollDuration);
    } else {
      setAnimationResult(result);
    }
  }, [isRolling, result, diceType, onRollComplete]);

  return (
    <MUIBox sx={{ width: '100%', height: 200, position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        <Dice
          type={diceType}
          value={animationResult}
          isRolling={isRolling}
          theme={theme}
        />
        
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
      
      {/* ダイス情報表示 */}
      <MUIBox
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: 1,
          borderRadius: 1,
          fontSize: '0.75rem'
        }}
      >
        <Typography variant="caption">
          {diceType.toUpperCase()}
          {animationResult && ` : ${animationResult}`}
        </Typography>
      </MUIBox>
      
      {/* ローディング表示 */}
      {isRolling && (
        <MUIBox
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: 1,
            borderRadius: 1,
            fontSize: '0.75rem'
          }}
        >
          <Typography variant="caption">
            転がっています...
          </Typography>
        </MUIBox>
      )}
    </MUIBox>
  );
};

export default DiceVisualization;
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Text, OrbitControls } from '@react-three/drei';
import { Mesh } from 'three';
import { Box as MUIBox, Typography } from '@mui/material';

interface DiceProps {
  type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  value?: number;
  isRolling?: boolean;
  position?: [number, number, number];
}

interface DiceVisualizationProps {
  diceType: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';
  result?: number;
  isRolling?: boolean;
  onRollComplete?: (result: number) => void;
}

const Dice: React.FC<DiceProps> = ({ type, value, isRolling = false, position = [0, 0, 0] }) => {
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
    switch (type) {
      case 'd4': return '#ff6b6b';
      case 'd6': return '#4ecdc4';
      case 'd8': return '#45b7d1';
      case 'd10': return '#96ceb4';
      case 'd12': return '#ffeaa7';
      case 'd20': return '#dda0dd';
      default: return '#95afc0';
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      {getDiceGeometry()}
      <meshStandardMaterial color={getDiceColor()} />
      
      {value && !isRolling && (
        <Text
          position={[0, 0, 1]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {value.toString()}
        </Text>
      )}
    </mesh>
  );
};

const DiceVisualization: React.FC<DiceVisualizationProps> = ({
  diceType,
  result,
  isRolling = false,
  onRollComplete
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
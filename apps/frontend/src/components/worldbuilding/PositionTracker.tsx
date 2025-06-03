import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  MyLocation,
  Navigation,
  Timer,
  Warning,
  CheckCircle,
  LocationOn,
  Explore,
  Speed,
  Terrain,
} from '@mui/icons-material';
import { BaseLocation } from '@novel-ai-assistant/types';

interface Position {
  lat: number;
  lng: number;
  timestamp: number;
}

interface MovementPlan {
  destination: BaseLocation;
  route: Position[];
  estimatedTime: number;
  travelMode: 'walking' | 'riding' | 'teleport';
  hazards: string[];
}

interface PositionTrackerProps {
  currentLocation?: BaseLocation;
  playerPosition?: Position;
  availableLocations: BaseLocation[];
  onPositionUpdate: (position: Position) => void;
  onLocationReached: (location: BaseLocation) => void;
  onEncounterTriggered?: (encounter: any) => void;
  realTimeTracking?: boolean;
}

export const PositionTracker: React.FC<PositionTrackerProps> = ({
  currentLocation,
  playerPosition,
  availableLocations,
  onPositionUpdate,
  onLocationReached,
  onEncounterTriggered,
  realTimeTracking = true,
}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [movementPlan, setMovementPlan] = useState<MovementPlan | null>(null);
  const [movementProgress, setMovementProgress] = useState(0);
  const [travelTime, setTravelTime] = useState(0);
  const [movementDialog, setMovementDialog] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<BaseLocation | null>(null);
  const [encounterAlert, setEncounterAlert] = useState<any>(null);

  // 🎯 リアルタイム位置追跡
  useEffect(() => {
    if (!realTimeTracking || !isMoving || !movementPlan) return;

    const interval = setInterval(() => {
      setTravelTime(prev => {
        const newTime = prev + 1;
        const progress = Math.min((newTime / movementPlan.estimatedTime) * 100, 100);
        setMovementProgress(progress);

        // 🎲 遭遇判定
        if (newTime % 30 === 0 && Math.random() < 0.1) { // 30秒ごとに10%の確率
          checkForEncounters();
        }

        // 🏁 到達判定
        if (progress >= 100) {
          handleArrival();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [realTimeTracking, isMoving, movementPlan]);

  // 📍 移動計画の作成
  const createMovementPlan = useCallback((destination: BaseLocation): MovementPlan => {
    const currentPos = playerPosition || { lat: 0, lng: 0, timestamp: Date.now() };
    const destPos = destination.coordinates || { lat: 0, lng: 0 };
    
    // 🗺️ 距離計算（簡易版）
    const distance = Math.sqrt(
      Math.pow(destPos.lat - currentPos.lat, 2) + 
      Math.pow(destPos.lng - currentPos.lng, 2)
    );

    // ⏱️ 移動時間計算（地形考慮）
    let baseTime = distance * 60; // 基本: 60秒/単位
    
    if (destination.environmentalFactors?.terrain === 'mountain') {
      baseTime *= 2; // 山岳地帯は2倍
    } else if (destination.environmentalFactors?.terrain === 'forest') {
      baseTime *= 1.5; // 森林は1.5倍
    } else if (destination.environmentalFactors?.terrain === 'desert') {
      baseTime *= 1.8; // 砂漠は1.8倍
    }

    // 🛤️ ルート生成（直線ルート）
    const route: Position[] = [];
    const steps = Math.ceil(distance * 2);
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      route.push({
        lat: currentPos.lat + (destPos.lat - currentPos.lat) * ratio,
        lng: currentPos.lng + (destPos.lng - currentPos.lng) * ratio,
        timestamp: Date.now() + (baseTime * ratio * 1000),
      });
    }

    // ⚠️ 危険要素の評価
    const hazards: string[] = [];
    if (destination.encounterRules) {
      hazards.push('野生動物の出現');
    }
    if (destination.environmentalFactors?.naturalHazards) {
      hazards.push(...destination.environmentalFactors.naturalHazards);
    }
    if (distance > 50) {
      hazards.push('長距離移動による疲労');
    }

    return {
      destination,
      route,
      estimatedTime: Math.ceil(baseTime),
      travelMode: 'walking', // デフォルト
      hazards,
    };
  }, [playerPosition]);

  // 🚀 移動開始
  const startMovement = useCallback((destination: BaseLocation) => {
    const plan = createMovementPlan(destination);
    setMovementPlan(plan);
    setIsMoving(true);
    setMovementProgress(0);
    setTravelTime(0);
    setMovementDialog(false);
    
    console.log(`🚶‍♂️ ${destination.name}への移動を開始`, plan);
  }, [createMovementPlan]);

  // 🛑 移動中止
  const stopMovement = useCallback(() => {
    setIsMoving(false);
    setMovementPlan(null);
    setMovementProgress(0);
    setTravelTime(0);
  }, []);

  // 🏁 到達処理
  const handleArrival = useCallback(() => {
    if (!movementPlan) return;

    setIsMoving(false);
    const finalPosition = movementPlan.route[movementPlan.route.length - 1];
    onPositionUpdate(finalPosition);
    onLocationReached(movementPlan.destination);
    
    setMovementPlan(null);
    setMovementProgress(0);
    setTravelTime(0);
    
    console.log(`🎯 ${movementPlan.destination.name}に到達しました`);
  }, [movementPlan, onPositionUpdate, onLocationReached]);

  // ⚔️ 遭遇判定
  const checkForEncounters = useCallback(() => {
    if (!movementPlan || !onEncounterTriggered) return;

    const { destination } = movementPlan;
    if (!destination.encounterRules) return;

    // 🎲 時間帯ベース遭遇判定
    const hour = new Date().getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const encounterChance = destination.encounterRules.timeOfDay[timeOfDay];
    if (Math.random() < encounterChance.probability) {
      const encounter = {
        type: encounterChance.type,
        description: `${timeOfDay}の時間帯に${encounterChance.type}が発生しました`,
        location: destination,
        timestamp: Date.now(),
      };

      setEncounterAlert(encounter);
      onEncounterTriggered(encounter);
    }
  }, [movementPlan, onEncounterTriggered]);

  // 🎮 移動先選択ダイアログ
  const handleMoveToLocation = (location: BaseLocation) => {
    setSelectedDestination(location);
    setMovementDialog(true);
  };

  return (
    <Box>
      {/* 📊 現在位置情報 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <MyLocation color="primary" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">
                現在位置: {currentLocation?.name || '未設定'}
              </Typography>
              {playerPosition && (
                <Typography variant="caption" color="text.secondary">
                  座標: ({playerPosition.lat.toFixed(2)}, {playerPosition.lng.toFixed(2)})
                </Typography>
              )}
            </Box>
            {isMoving && (
              <Chip 
                label="移動中" 
                color="primary" 
                icon={<Navigation />}
                sx={{ animation: 'pulse 2s infinite' }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* 🚶‍♂️ 移動状況表示 */}
      {isMoving && movementPlan && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  🎯 {movementPlan.destination.name}へ移動中
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small"
                  onClick={stopMovement}
                >
                  中止
                </Button>
              </Stack>
              
              <LinearProgress 
                variant="determinate" 
                value={movementProgress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              
              <Stack direction="row" spacing={2} justifyContent="space-between">
                <Typography variant="body2">
                  <Timer fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  経過時間: {Math.floor(travelTime / 60)}分{travelTime % 60}秒
                </Typography>
                <Typography variant="body2">
                  <Speed fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  進捗: {movementProgress.toFixed(1)}%
                </Typography>
              </Stack>

              {movementPlan.hazards.length > 0 && (
                <Alert severity="warning" size="small">
                  <strong>注意事項:</strong> {movementPlan.hazards.join(', ')}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* 📍 利用可能な移動先 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Explore sx={{ verticalAlign: 'middle', mr: 1 }} />
            移動可能な場所
          </Typography>
          
          <Stack spacing={1}>
            {availableLocations
              .filter(location => location.id !== currentLocation?.id)
              .map((location) => {
                const plan = createMovementPlan(location);
                return (
                  <Button
                    key={location.id}
                    variant="outlined"
                    onClick={() => handleMoveToLocation(location)}
                    disabled={isMoving}
                    sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                      <LocationOn />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1">{location.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          推定移動時間: {Math.floor(plan.estimatedTime / 60)}分
                          {plan.hazards.length > 0 && ` • 危険要素: ${plan.hazards.length}件`}
                        </Typography>
                      </Box>
                      <Chip label={location.type} size="small" />
                    </Stack>
                  </Button>
                );
              })}
          </Stack>
        </CardContent>
      </Card>

      {/* 🗺️ 移動確認ダイアログ */}
      <Dialog
        open={movementDialog}
        onClose={() => setMovementDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedDestination?.name}への移動
        </DialogTitle>
        
        <DialogContent>
          {selectedDestination && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {selectedDestination.description}
              </Typography>
              
              {(() => {
                const plan = createMovementPlan(selectedDestination);
                return (
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Timer /></ListItemIcon>
                      <ListItemText 
                        primary="推定移動時間" 
                        secondary={`${Math.floor(plan.estimatedTime / 60)}分${plan.estimatedTime % 60}秒`}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><Terrain /></ListItemIcon>
                      <ListItemText 
                        primary="地形タイプ" 
                        secondary={selectedDestination.environmentalFactors?.terrain || '平地'}
                      />
                    </ListItem>

                    {plan.hazards.length > 0 && (
                      <ListItem>
                        <ListItemIcon><Warning color="warning" /></ListItemIcon>
                        <ListItemText 
                          primary="危険要素" 
                          secondary={plan.hazards.join(', ')}
                        />
                      </ListItem>
                    )}
                  </List>
                );
              })()}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setMovementDialog(false)}>
            キャンセル
          </Button>
          <Button 
            variant="contained"
            onClick={() => selectedDestination && startMovement(selectedDestination)}
            disabled={isMoving}
          >
            移動開始
          </Button>
        </DialogActions>
      </Dialog>

      {/* ⚔️ 遭遇アラートダイアログ */}
      <Dialog
        open={!!encounterAlert}
        onClose={() => setEncounterAlert(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Warning color="warning" />
            <Typography variant="h6">遭遇発生！</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {encounterAlert && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>{encounterAlert.type}</strong>
              </Alert>
              <Typography variant="body1">
                {encounterAlert.description}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                発生場所: {encounterAlert.location?.name}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setEncounterAlert(null)}
            variant="contained"
          >
            確認
          </Button>
        </DialogActions>
      </Dialog>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default PositionTracker;
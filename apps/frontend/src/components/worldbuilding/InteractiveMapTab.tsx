import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import {
  Map,
  LocationOn,
  Settings,
  Visibility,
  VisibilityOff,
  Add,
  Navigation,
} from '@mui/icons-material';
import { useRecoilValue } from 'recoil';
import { currentCampaignState } from '../../store/atoms';
import { BaseLocation } from '@novel-ai-assistant/types';
import InteractiveMap from './InteractiveMap';
import PositionTracker from './PositionTracker';

export const InteractiveMapTab: React.FC = () => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [selectedLocation, setSelectedLocation] = useState<BaseLocation | null>(null);
  const [playerPosition, setPlayerPosition] = useState<{ lat: number; lng: number } | undefined>({
    lat: 0,
    lng: 0,
  });
  const [showPositionTracker, setShowPositionTracker] = useState(true);
  const [showEncounterZones, setShowEncounterZones] = useState(false);
  const [mapSettings, setMapSettings] = useState({
    showPlayerTrails: false,
    realTimeTracking: true,
  });

  // 🗺️ 拠点データの取得
  const availableLocations = currentCampaign?.bases || [];
  const currentLocation = selectedLocation || availableLocations.find(loc => 
    playerPosition && loc.coordinates && 
    Math.abs(loc.coordinates.lat - playerPosition.lat) < 1 && 
    Math.abs(loc.coordinates.lng - playerPosition.lng) < 1
  );

  // 📍 場所選択処理
  const handleLocationSelect = useCallback((location: BaseLocation) => {
    setSelectedLocation(location);
    console.log(`🗺️ 場所を選択しました: ${location.name}`);
  }, []);

  // 🚶‍♂️ プレイヤー移動処理
  const handlePlayerMove = useCallback((coordinates: { lat: number; lng: number }) => {
    setPlayerPosition(coordinates);
    console.log(`🚶‍♂️ プレイヤーが移動しました: (${coordinates.lat}, ${coordinates.lng})`);
  }, []);

  // 🎯 位置更新処理
  const handlePositionUpdate = useCallback((position: { lat: number; lng: number; timestamp: number }) => {
    setPlayerPosition({ lat: position.lat, lng: position.lng });
    console.log(`📍 位置を更新しました: (${position.lat}, ${position.lng})`);
  }, []);

  // 🏁 場所到達処理
  const handleLocationReached = useCallback((location: BaseLocation) => {
    setSelectedLocation(location);
    console.log(`🏁 ${location.name}に到達しました`);
    
    // 到達通知などの処理をここに追加
  }, []);

  // ⚔️ 遭遇発生処理
  const handleEncounterTriggered = useCallback((encounter: any) => {
    console.log(`⚔️ 遭遇が発生しました: ${encounter.type}`);
    
    // 遭遇処理をここに追加
    // 例: AIエージェントに遭遇イベントを送信
  }, []);

  // 🆕 新拠点追加処理
  const handleLocationAdd = useCallback((coordinates: { lat: number; lng: number }) => {
    console.log(`🆕 新しい拠点を追加: (${coordinates.lat}, ${coordinates.lng})`);
    
    // 新拠点追加ダイアログやフォームを表示
    // 暫定的に基本的な拠点データを作成
    const newLocation: BaseLocation = {
      id: `new_location_${Date.now()}`,
      name: `新しい拠点 ${coordinates.lat.toFixed(1)}, ${coordinates.lng.toFixed(1)}`,
      type: 'village',
      region: '未設定',
      description: '新しく発見された場所',
      rank: '小村',
      importance: 'サブ拠点',
      coordinates,
      facilities: {},
      npcs: [],
      features: {
        fastTravel: false,
        playerBase: false,
        questHub: false,
        defenseEvent: false,
      },
      threats: {
        dangerLevel: '低',
        monsterAttackRate: 0.1,
        playerReputation: 0,
        currentEvents: [],
        controllingFaction: '中立',
      },
      economy: {
        currency: 'ゴールド',
        priceModifier: 1.0,
        localGoods: [],
        tradeGoods: [],
      },
      meta: {
        locationId: `new_location_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: '',
      },
    };
    
    // TODO: 実際のデータ保存処理を実装
    console.log('新拠点データ:', newLocation);
  }, []);

  if (!currentCampaign) {
    return (
      <Alert severity="warning">
        キャンペーンが選択されていません。マップを表示するにはキャンペーンを選択してください。
      </Alert>
    );
  }

  if (availableLocations.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🗺️ インタラクティブマップ
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            マップに表示する拠点がありません。先に「拠点」タブで拠点を作成してください。
          </Alert>
          <Button
            variant="contained"
            onClick={() => {
              // 拠点タブに移動
              const event = new CustomEvent('worldbuilding-tab-change', { detail: { tabIndex: 10 } });
              window.dispatchEvent(event);
            }}
            startIcon={<LocationOn />}
          >
            拠点を作成する
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Stack spacing={3}>
        {/* 🎮 マップ制御パネル */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Map sx={{ verticalAlign: 'middle', mr: 1 }} />
              インタラクティブマップ設定
            </Typography>
            
            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={showPositionTracker}
                    onChange={(e) => setShowPositionTracker(e.target.checked)}
                  />
                }
                label="位置追跡パネル"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showEncounterZones}
                    onChange={(e) => setShowEncounterZones(e.target.checked)}
                  />
                }
                label="遭遇エリア表示"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={mapSettings.showPlayerTrails}
                    onChange={(e) => setMapSettings(prev => ({ ...prev, showPlayerTrails: e.target.checked }))}
                  />
                }
                label="移動軌跡表示"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={mapSettings.realTimeTracking}
                    onChange={(e) => setMapSettings(prev => ({ ...prev, realTimeTracking: e.target.checked }))}
                  />
                }
                label="リアルタイム追跡"
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip 
                label={`拠点数: ${availableLocations.length}`} 
                color="primary" 
                size="small" 
              />
              {currentLocation && (
                <Chip 
                  label={`現在地: ${currentLocation.name}`} 
                  color="secondary" 
                  size="small" 
                  icon={<LocationOn />}
                />
              )}
              {playerPosition && (
                <Chip 
                  label={`座標: (${playerPosition.lat.toFixed(1)}, ${playerPosition.lng.toFixed(1)})`} 
                  variant="outlined" 
                  size="small" 
                />
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* 🗺️ メインマップ */}
        <Card>
          <CardContent>
            <InteractiveMap
              locations={availableLocations}
              currentLocation={currentLocation}
              playerPosition={playerPosition}
              onLocationSelect={handleLocationSelect}
              onLocationAdd={handleLocationAdd}
              onPlayerMove={handlePlayerMove}
              showPlayerTrails={mapSettings.showPlayerTrails}
              showEncounterZones={showEncounterZones}
            />
          </CardContent>
        </Card>

        {/* 🧭 位置追跡パネル */}
        {showPositionTracker && (
          <Card>
            <CardContent>
              <PositionTracker
                currentLocation={currentLocation}
                playerPosition={playerPosition ? { ...playerPosition, timestamp: Date.now() } : undefined}
                availableLocations={availableLocations}
                onPositionUpdate={handlePositionUpdate}
                onLocationReached={handleLocationReached}
                onEncounterTriggered={handleEncounterTriggered}
                realTimeTracking={mapSettings.realTimeTracking}
              />
            </CardContent>
          </Card>
        )}

        {/* 💡 使用方法のヒント */}
        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>
            📋 マップの使用方法
          </Typography>
          <Typography variant="body2" component="div">
            • <strong>拠点選択:</strong> マップ上のマーカーをクリックして拠点を選択<br />
            • <strong>新拠点追加:</strong> マップをダブルクリックして新しい拠点を追加<br />
            • <strong>移動:</strong> 位置追跡パネルから目的地を選択して移動開始<br />
            • <strong>遭遇システム:</strong> 移動中にランダムで遭遇イベントが発生<br />
            • <strong>リアルタイム追跡:</strong> 自動で位置情報を更新し続ける
          </Typography>
        </Alert>
      </Stack>
    </Box>
  );
};

export default InteractiveMapTab;
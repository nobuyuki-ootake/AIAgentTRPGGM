import React, { useState, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
  Annotation
} from 'react-simple-maps';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  Refresh,
  LocationOn,
  Visibility,
  VisibilityOff,
  Settings,
  Add,
} from '@mui/icons-material';
import { BaseLocation } from '@trpg-ai-gm/types';

// 🗺️ カスタム世界地図のGeoJSONデータ
const FANTASY_WORLD_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { NAME: "大陸", ISO_A2: "FC" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [-50, 60], [50, 60], [50, -60], [-50, -60], [-50, 60]
        ]]
      }
    }
  ]
};

interface InteractiveMapProps {
  locations: BaseLocation[];
  currentLocation?: BaseLocation;
  playerPosition?: { lat: number; lng: number };
  onLocationSelect: (location: BaseLocation) => void;
  onLocationAdd?: (coordinates: { lat: number; lng: number }) => void;
  onPlayerMove?: (coordinates: { lat: number; lng: number }) => void;
  showPlayerTrails?: boolean;
  showEncounterZones?: boolean;
}

interface MapSettings {
  zoom: number;
  center: [number, number];
  showLabels: boolean;
  showGrid: boolean;
  showEncounters: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  locations,
  currentLocation,
  playerPosition,
  onLocationSelect,
  onLocationAdd,
  onPlayerMove,
  showPlayerTrails = false,
  showEncounterZones = false,
}) => {
  const theme = useTheme();
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    zoom: 1,
    center: [0, 0],
    showLabels: true,
    showGrid: false,
    showEncounters: showEncounterZones,
  });
  
  const [selectedLocation, setSelectedLocation] = useState<BaseLocation | null>(null);
  const [locationDialog, setLocationDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);

  // 🎯 ズーム制御
  const handleZoomIn = useCallback(() => {
    setMapSettings(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.5, 8)
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setMapSettings(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.5, 0.5)
    }));
  }, []);

  const handleReset = useCallback(() => {
    setMapSettings(prev => ({
      ...prev,
      zoom: 1,
      center: [0, 0]
    }));
  }, []);

  // 📍 場所選択処理
  const handleLocationClick = useCallback((location: BaseLocation) => {
    setSelectedLocation(location);
    setLocationDialog(true);
    onLocationSelect(location);
  }, [onLocationSelect]);

  // 🗺️ マップクリック処理（新拠点追加）
  const handleMapClick = useCallback((geography: any, event: any) => {
    if (onLocationAdd && event.detail === 2) { // ダブルクリック
      const coords = event.target.getBoundingClientRect();
      const lat = (event.clientY - coords.top - coords.height / 2) / 10;
      const lng = (event.clientX - coords.left - coords.width / 2) / 10;
      onLocationAdd({ lat, lng });
    }
  }, [onLocationAdd]);

  // 🎨 場所タイプ別スタイリング
  const getLocationStyle = (location: BaseLocation) => {
    const isCurrentLocation = currentLocation?.id === location.id;
    const baseColor = isCurrentLocation ? '#ff4444' : '#2196f3';
    
    switch (location.type) {
      case 'city':
        return {
          fill: baseColor,
          stroke: '#ffffff',
          strokeWidth: 2,
          r: isCurrentLocation ? 8 : 6,
        };
      case 'village':
        return {
          fill: baseColor,
          stroke: '#ffffff',
          strokeWidth: 1,
          r: isCurrentLocation ? 6 : 4,
        };
      case 'dungeon':
        return {
          fill: '#8b4513',
          stroke: '#ffffff',
          strokeWidth: 2,
          r: isCurrentLocation ? 7 : 5,
        };
      case 'wilderness':
        return {
          fill: '#228b22',
          stroke: '#ffffff',
          strokeWidth: 1,
          r: isCurrentLocation ? 5 : 3,
        };
      default:
        return {
          fill: baseColor,
          stroke: '#ffffff',
          strokeWidth: 1,
          r: isCurrentLocation ? 6 : 4,
        };
    }
  };

  // 🌐 遭遇エリア表示
  const renderEncounterZones = () => {
    if (!mapSettings.showEncounters) return null;

    return locations
      .filter(location => location.encounterRules)
      .map(location => (
        <circle
          key={`encounter-${location.id}`}
          cx={location.coordinates?.lng || 0}
          cy={location.coordinates?.lat || 0}
          r={15}
          fill={alpha('#ff9800', 0.2)}
          stroke="#ff9800"
          strokeWidth={1}
          strokeDasharray="5,5"
        />
      ));
  };

  return (
    <Box sx={{ position: 'relative', height: '600px', border: 1, borderColor: 'divider' }}>
      {/* 🗺️ メインマップ */}
      <ComposableMap
        projection="geoMercator"
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup zoom={mapSettings.zoom} center={mapSettings.center}>
          {/* 🌍 地形表示 */}
          <Geographies geography={FANTASY_WORLD_GEOJSON}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={theme.palette.mode === 'dark' ? '#404040' : '#e0e0e0'}
                  stroke={theme.palette.mode === 'dark' ? '#606060' : '#cccccc'}
                  strokeWidth={0.5}
                  onClick={handleMapClick}
                  style={{
                    default: { outline: 'none' },
                    hover: { 
                      fill: alpha(theme.palette.primary.main, 0.1),
                      outline: 'none'
                    },
                    pressed: { outline: 'none' }
                  }}
                />
              ))
            }
          </Geographies>

          {/* 🎯 遭遇エリア表示 */}
          <g>{renderEncounterZones()}</g>

          {/* 📍 場所マーカー */}
          {locations.map((location) => (
            <Marker
              key={location.id}
              coordinates={[location.coordinates?.lng || 0, location.coordinates?.lat || 0]}
            >
              <circle
                {...getLocationStyle(location)}
                onClick={() => handleLocationClick(location)}
                style={{ cursor: 'pointer' }}
              />
              
              {mapSettings.showLabels && (
                <Annotation
                  subject={[location.coordinates?.lng || 0, location.coordinates?.lat || 0]}
                  dx={-10}
                  dy={-15}
                  connectorProps={{
                    stroke: theme.palette.text.primary,
                    strokeWidth: 1
                  }}
                >
                  <text
                    x={0}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill={theme.palette.text.primary}
                    fontSize={12}
                    fontWeight="bold"
                  >
                    {location.name}
                  </text>
                </Annotation>
              )}
            </Marker>
          ))}

          {/* 🧙‍♂️ プレイヤー位置マーカー */}
          {playerPosition && (
            <Marker coordinates={[playerPosition.lng, playerPosition.lat]}>
              <circle
                r={8}
                fill="#ff4444"
                stroke="#ffffff"
                strokeWidth={3}
                style={{ 
                  cursor: onPlayerMove ? 'move' : 'default',
                  filter: 'drop-shadow(0 0 5px rgba(255, 68, 68, 0.8))'
                }}
                onClick={(event) => {
                  if (onPlayerMove && event.target) {
                    const coords = (event.target as HTMLElement).getBoundingClientRect();
                    const lat = (event.clientY - coords.top - coords.height / 2) / 10;
                    const lng = (event.clientX - coords.left - coords.width / 2) / 10;
                    onPlayerMove({ lat, lng });
                  }
                }}
              />
              <text
                y={-12}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={10}
                fontWeight="bold"
              >
                PC
              </text>
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>

      {/* 🎮 マップ制御UI */}
      <Stack
        spacing={1}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          borderRadius: 1,
          p: 1,
        }}
      >
        <Tooltip title="ズームイン">
          <IconButton size="small" onClick={handleZoomIn}>
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title="ズームアウト">
          <IconButton size="small" onClick={handleZoomOut}>
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title="リセット">
          <IconButton size="small" onClick={handleReset}>
            <Refresh />
          </IconButton>
        </Tooltip>
        <Tooltip title="設定">
          <IconButton size="small" onClick={() => setSettingsDialog(true)}>
            <Settings />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* 📊 地図情報パネル */}
      <Card
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          maxWidth: 300,
          bgcolor: alpha(theme.palette.background.paper, 0.95),
        }}
      >
        <CardContent sx={{ p: 2, pb: '16px !important' }}>
          <Typography variant="h6" gutterBottom>
            🗺️ 世界マップ
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`拠点数: ${locations.length}`} size="small" />
            <Chip 
              label={`ズーム: ${mapSettings.zoom.toFixed(1)}x`} 
              size="small" 
              color="primary" 
            />
            {currentLocation && (
              <Chip 
                label={`現在地: ${currentLocation.name}`} 
                size="small" 
                color="secondary" 
              />
            )}
          </Stack>
          {onLocationAdd && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              💡 ダブルクリックで新しい拠点を追加
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* 📍 場所詳細ダイアログ */}
      <Dialog
        open={locationDialog}
        onClose={() => setLocationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <LocationOn color="primary" />
            <Typography variant="h6">
              {selectedLocation?.name}
            </Typography>
            <Chip label={selectedLocation?.type} size="small" />
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {selectedLocation && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {selectedLocation.description}
              </Typography>
              
              {selectedLocation.facilities && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    🏛️ 利用可能施設
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.keys(selectedLocation.facilities).map(facility => (
                      <Chip key={facility} label={facility} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}

              {selectedLocation.encounterRules && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    ⚔️ 遭遇情報
                  </Typography>
                  <Typography variant="caption" display="block">
                    この地域では特定の条件下で遭遇イベントが発生する可能性があります
                  </Typography>
                </Box>
              )}

              {selectedLocation.environmentalFactors && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    🌍 環境要因
                  </Typography>
                  <Typography variant="caption" display="block">
                    気候: {selectedLocation.environmentalFactors.climate}
                  </Typography>
                  <Typography variant="caption" display="block">
                    地形: {selectedLocation.environmentalFactors.terrain}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setLocationDialog(false)}>
            閉じる
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (selectedLocation) {
                onLocationSelect(selectedLocation);
              }
              setLocationDialog(false);
            }}
          >
            この場所に移動
          </Button>
        </DialogActions>
      </Dialog>

      {/* ⚙️ 設定ダイアログ */}
      <Dialog
        open={settingsDialog}
        onClose={() => setSettingsDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>マップ設定</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button
              variant={mapSettings.showLabels ? "contained" : "outlined"}
              onClick={() => setMapSettings(prev => ({ ...prev, showLabels: !prev.showLabels }))}
              startIcon={mapSettings.showLabels ? <Visibility /> : <VisibilityOff />}
            >
              場所名表示
            </Button>
            <Button
              variant={mapSettings.showEncounters ? "contained" : "outlined"}
              onClick={() => setMapSettings(prev => ({ ...prev, showEncounters: !prev.showEncounters }))}
              startIcon={mapSettings.showEncounters ? <Visibility /> : <VisibilityOff />}
            >
              遭遇エリア表示
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InteractiveMap;
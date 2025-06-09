// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Slider,
  FormControlLabel,
  Switch,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import {
  Nature as NatureIcon,
  Waves as WaterIcon,
  Whatshot as FireIcon,
  Air as WindIcon,
  Group as CrowdIcon,
  Home as IndoorIcon,
  Terrain as OutdoorIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from "@mui/icons-material";
import { BaseLocation } from "@trpg-ai-gm/types";

interface AmbientSound {
  id: string;
  name: string;
  description: string;
  category: "nature" | "urban" | "indoor" | "weather" | "magical";
  tags: string[];
  volume: number;
  intensity: number; // 0-100 for environmental intensity
  isActive: boolean;
  icon: React.ReactElement;
  locationTypes: string[]; // Which location types this sound fits
  timeOfDay?: "day" | "night" | "any";
  weather?: string[];
}

const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: "forest_birds",
    name: "森の鳥たち",
    description: "鳥のさえずりと葉のそよぎ",
    category: "nature",
    tags: ["forest", "peaceful", "daytime"],
    volume: 50,
    intensity: 60,
    isActive: false,
    icon: <NatureIcon />,
    locationTypes: ["forest", "woods", "grove"],
    timeOfDay: "day",
  },
  {
    id: "ocean_waves",
    name: "波音",
    description: "寄せては返す波の音",
    category: "nature",
    tags: ["ocean", "coast", "relaxing"],
    volume: 60,
    intensity: 70,
    isActive: false,
    icon: <WaterIcon />,
    locationTypes: ["coast", "beach", "harbor"],
    timeOfDay: "any",
  },
  {
    id: "crackling_fire",
    name: "焚き火",
    description: "薪がパチパチと燃える音",
    category: "indoor",
    tags: ["fire", "cozy", "tavern"],
    volume: 40,
    intensity: 50,
    isActive: false,
    icon: <FireIcon />,
    locationTypes: ["tavern", "camp", "inn", "home"],
    timeOfDay: "any",
  },
  {
    id: "wind_through_trees",
    name: "木々を渡る風",
    description: "葉を揺らす風の音",
    category: "nature",
    tags: ["wind", "forest", "peaceful"],
    volume: 35,
    intensity: 40,
    isActive: false,
    icon: <WindIcon />,
    locationTypes: ["forest", "plains", "mountain"],
    timeOfDay: "any",
    weather: ["windy", "stormy"],
  },
  {
    id: "tavern_crowd",
    name: "酒場の喧騒",
    description: "人々の話し声と笑い声",
    category: "urban",
    tags: ["social", "crowd", "indoor"],
    volume: 55,
    intensity: 65,
    isActive: false,
    icon: <CrowdIcon />,
    locationTypes: ["tavern", "inn", "market"],
    timeOfDay: "any",
  },
  {
    id: "night_crickets",
    name: "夜の虫の音",
    description: "コオロギの鳴き声",
    category: "nature",
    tags: ["night", "insects", "peaceful"],
    volume: 30,
    intensity: 40,
    isActive: false,
    icon: <NatureIcon />,
    locationTypes: ["forest", "plains", "garden"],
    timeOfDay: "night",
  },
  {
    id: "dungeon_drip",
    name: "ダンジョンの水滴",
    description: "どこからか聞こえる水滴の音",
    category: "indoor",
    tags: ["underground", "mysterious", "dark"],
    volume: 25,
    intensity: 30,
    isActive: false,
    icon: <WaterIcon />,
    locationTypes: ["dungeon", "cave", "underground"],
    timeOfDay: "any",
  },
  {
    id: "magical_hum",
    name: "魔法的な響き",
    description: "神秘的なエネルギーの音",
    category: "magical",
    tags: ["magic", "mysterious", "energy"],
    volume: 40,
    intensity: 50,
    isActive: false,
    icon: <NatureIcon />,
    locationTypes: ["temple", "tower", "magical"],
    timeOfDay: "any",
  },
];

interface AmbientSoundControllerProps {
  currentLocation?: BaseLocation;
  currentWeather?: string;
  timeOfDay?: "day" | "night";
  masterVolume?: number;
  isEnabled?: boolean;
  onSoundChange?: (sounds: AmbientSound[]) => void;
}

const AmbientSoundController: React.FC<AmbientSoundControllerProps> = ({
  currentLocation,
  currentWeather = "clear",
  timeOfDay = "day",
  masterVolume = 70,
  isEnabled = true,
  onSoundChange,
}) => {
  const [ambientSounds, setAmbientSounds] = useState<AmbientSound[]>(AMBIENT_SOUNDS);
  const [autoMode, setAutoMode] = useState(true);
  const [environmentalIntensity, setEnvironmentalIntensity] = useState(50);

  // 場所に応じて自動的に環境音を調整
  useEffect(() => {
    if (autoMode && currentLocation) {
      adjustSoundsForLocation();
    }
  }, [currentLocation, timeOfDay, currentWeather, autoMode]);

  // 場所に応じた音の調整
  const adjustSoundsForLocation = () => {
    if (!currentLocation) return;

    const updatedSounds = ambientSounds.map(sound => {
      let shouldBeActive = false;
      let adjustedVolume = sound.volume;
      let adjustedIntensity = sound.intensity;

      // 場所タイプのマッチング
      const locationMatch = sound.locationTypes.some(type => 
        currentLocation.type?.toLowerCase().includes(type) ||
        currentLocation.name?.toLowerCase().includes(type)
      );

      // 時間帯のマッチング
      const timeMatch = sound.timeOfDay === "any" || sound.timeOfDay === timeOfDay;

      // 天気のマッチング
      const weatherMatch = !sound.weather || sound.weather.includes(currentWeather);

      if (locationMatch && timeMatch && weatherMatch) {
        shouldBeActive = true;
        
        // 環境の強度に応じて音量調整
        adjustedVolume = Math.round(sound.volume * (environmentalIntensity / 100));
        adjustedIntensity = Math.round(sound.intensity * (environmentalIntensity / 100));
      }

      return {
        ...sound,
        isActive: shouldBeActive,
        volume: adjustedVolume,
        intensity: adjustedIntensity,
      };
    });

    setAmbientSounds(updatedSounds);
    if (onSoundChange) {
      onSoundChange(updatedSounds.filter(s => s.isActive));
    }
  };

  // 個別音源の制御
  const toggleSound = (soundId: string) => {
    const updatedSounds = ambientSounds.map(sound => {
      if (sound.id === soundId) {
        return { ...sound, isActive: !sound.isActive };
      }
      return sound;
    });
    setAmbientSounds(updatedSounds);
  };

  // 音量調整
  const updateSoundVolume = (soundId: string, volume: number) => {
    const updatedSounds = ambientSounds.map(sound => {
      if (sound.id === soundId) {
        return { ...sound, volume };
      }
      return sound;
    });
    setAmbientSounds(updatedSounds);
  };

  // 全ての音を停止
  const stopAllSounds = () => {
    const updatedSounds = ambientSounds.map(sound => ({
      ...sound,
      isActive: false,
    }));
    setAmbientSounds(updatedSounds);
  };

  // カテゴリーの色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "nature": return "success";
      case "urban": return "primary";
      case "indoor": return "warning";
      case "weather": return "info";
      case "magical": return "secondary";
      default: return "default";
    }
  };

  // アクティブな音源
  const activeSounds = ambientSounds.filter(sound => sound.isActive);

  if (!isEnabled) {
    return null;
  }

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          環境音コントロール
        </Typography>

        {/* 現在の環境情報 */}
        {currentLocation && (
          <Card sx={{ mb: 2, bgcolor: "background.default" }}>
            <CardContent sx={{ py: 1 }}>
              <Typography variant="body2" color="text.secondary">
                現在地: {currentLocation.name} | 時間: {timeOfDay === "day" ? "昼" : "夜"} | 天気: {currentWeather}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* 設定 */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                size="small"
              />
            }
            label="自動調整"
          />
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 200 }}>
            <Typography variant="body2">環境強度:</Typography>
            <Slider
              value={environmentalIntensity}
              onChange={(_, value) => setEnvironmentalIntensity(value as number)}
              min={0}
              max={100}
              size="small"
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
          </Box>
        </Box>

        {/* アクティブな音源の概要 */}
        {activeSounds.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              再生中の環境音 ({activeSounds.length}):
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {activeSounds.map(sound => (
                <Chip
                  key={sound.id}
                  label={sound.name}
                  size="small"
                  color={getCategoryColor(sound.category)}
                  variant="filled"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 音源リスト */}
        <List dense>
          {ambientSounds.map((sound) => {
            const effectiveVolume = Math.round((sound.volume * masterVolume) / 100);
            
            return (
              <ListItem
                key={sound.id}
                sx={{
                  border: 1,
                  borderColor: sound.isActive ? "primary.main" : "divider",
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: sound.isActive ? "action.selected" : "transparent",
                }}
              >
                <ListItemIcon>
                  {sound.icon}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="subtitle2">{sound.name}</Typography>
                      <Chip
                        label={sound.category}
                        size="small"
                        color={getCategoryColor(sound.category)}
                        variant="outlined"
                      />
                      {sound.timeOfDay && sound.timeOfDay !== "any" && (
                        <Chip
                          label={sound.timeOfDay === "day" ? "昼のみ" : "夜のみ"}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {sound.description}
                      </Typography>
                      {sound.isActive && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <VolumeIcon fontSize="small" />
                          <Slider
                            value={sound.volume}
                            onChange={(_, value) => updateSoundVolume(sound.id, value as number)}
                            min={0}
                            max={100}
                            size="small"
                            sx={{ width: 100 }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${Math.round((value * masterVolume) / 100)}%`}
                          />
                          <Typography variant="caption" sx={{ minWidth: 40 }}>
                            {effectiveVolume}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <IconButton
                    onClick={() => toggleSound(sound.id)}
                    color={sound.isActive ? "primary" : "default"}
                  >
                    {sound.isActive ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        {activeSounds.length === 0 && autoMode && (
          <Alert severity="info" sx={{ mt: 2 }}>
            現在の環境に適した音源が見つかりません。場所を移動するか、手動で音源を選択してください。
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default AmbientSoundController;
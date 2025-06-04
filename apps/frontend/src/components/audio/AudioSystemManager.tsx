import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  MusicNote as MusicIcon,
  GraphicEq as SoundIcon,
  Nature as AmbientIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Loop as LoopIcon,
  Shuffle as ShuffleIcon,
  ExpandMore,
  Download as DownloadIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";

interface AudioTrack {
  id: string;
  name: string;
  category: "bgm" | "ambient" | "sfx";
  tags: string[];
  duration?: number;
  volume: number;
  loop: boolean;
  src?: string; // URL or file path
  isPlaying: boolean;
  currentTime: number;
}

interface AudioPreset {
  id: string;
  name: string;
  description: string;
  tracks: AudioTrack[];
  environment: string;
  mood: string;
}

interface AudioSystemManagerProps {
  currentLocation?: string;
  currentScene?: string;
  gamePhase?: "exploration" | "combat" | "social" | "rest";
  onAudioChange?: (tracks: AudioTrack[]) => void;
}

const AUDIO_PRESETS: AudioPreset[] = [
  {
    id: "tavern",
    name: "酒場・宿屋",
    description: "にぎやかな酒場の雰囲気",
    environment: "indoor",
    mood: "social",
    tracks: [
      {
        id: "tavern_ambient",
        name: "酒場の喧騒",
        category: "ambient",
        tags: ["social", "indoor", "tavern"],
        volume: 60,
        loop: true,
        isPlaying: false,
        currentTime: 0,
      },
      {
        id: "medieval_music",
        name: "中世の音楽",
        category: "bgm",
        tags: ["medieval", "peaceful"],
        volume: 40,
        loop: true,
        isPlaying: false,
        currentTime: 0,
      },
    ],
  },
  {
    id: "forest",
    name: "森林",
    description: "神秘的な森の環境音",
    environment: "outdoor",
    mood: "exploration",
    tracks: [
      {
        id: "forest_ambient",
        name: "森の音",
        category: "ambient",
        tags: ["nature", "outdoor", "forest"],
        volume: 70,
        loop: true,
        isPlaying: false,
        currentTime: 0,
      },
      {
        id: "bird_songs",
        name: "鳥のさえずり",
        category: "ambient",
        tags: ["nature", "birds"],
        volume: 30,
        loop: true,
        isPlaying: false,
        currentTime: 0,
      },
    ],
  },
  {
    id: "dungeon",
    name: "ダンジョン",
    description: "緊張感のあるダンジョン探索",
    environment: "underground",
    mood: "tension",
    tracks: [
      {
        id: "dungeon_ambient",
        name: "ダンジョンの環境音",
        category: "ambient",
        tags: ["underground", "dark", "mysterious"],
        volume: 80,
        loop: true,
        isPlaying: false,
        currentTime: 0,
      },
      {
        id: "tension_music",
        name: "緊張感のある音楽",
        category: "bgm",
        tags: ["tension", "dark"],
        volume: 50,
        loop: true,
        isPlaying: false,
        currentTime: 0,
      },
    ],
  },
  {
    id: "combat",
    name: "戦闘",
    description: "激しい戦闘BGM",
    environment: "any",
    mood: "combat",
    tracks: [
      {
        id: "battle_music",
        name: "戦闘音楽",
        category: "bgm",
        tags: ["combat", "intense", "action"],
        volume: 70,
        loop: true,
        isPlaying: false,
        currentTime: 0,
      },
    ],
  },
];

const SOUND_EFFECTS = [
  { id: "sword_clash", name: "剣戟", category: "combat" },
  { id: "magic_cast", name: "魔法詠唱", category: "magic" },
  { id: "door_open", name: "扉が開く", category: "interaction" },
  { id: "treasure_open", name: "宝箱を開ける", category: "interaction" },
  { id: "footsteps", name: "足音", category: "movement" },
  { id: "dice_roll", name: "ダイスロール", category: "game" },
];

const AudioSystemManager: React.FC<AudioSystemManagerProps> = ({
  currentLocation,
  currentScene,
  gamePhase = "exploration",
  onAudioChange,
}) => {
  const [currentTracks, setCurrentTracks] = useState<AudioTrack[]>([]);
  const [masterVolume, setMasterVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<AudioPreset | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [autoAdjust, setAutoAdjust] = useState(true);
  const [fadeTransitions, setFadeTransitions] = useState(true);
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // ゲームフェーズに応じた自動調整
  useEffect(() => {
    if (autoAdjust && gamePhase) {
      adjustForGamePhase(gamePhase);
    }
  }, [gamePhase, autoAdjust]);

  // プリセット適用
  const applyPreset = (preset: AudioPreset) => {
    if (fadeTransitions) {
      fadeOutCurrentTracks(() => {
        setCurrentTracks([...preset.tracks]);
        setCurrentPreset(preset);
        if (onAudioChange) onAudioChange(preset.tracks);
      });
    } else {
      stopAllTracks();
      setCurrentTracks([...preset.tracks]);
      setCurrentPreset(preset);
      if (onAudioChange) onAudioChange(preset.tracks);
    }
  };

  // ゲームフェーズに応じた調整
  const adjustForGamePhase = (phase: string) => {
    const updatedTracks = currentTracks.map(track => {
      const newTrack = { ...track };
      
      switch (phase) {
        case "combat":
          if (track.tags.includes("combat")) {
            newTrack.volume = Math.min(track.volume * 1.2, 100);
          } else if (track.category === "ambient") {
            newTrack.volume = track.volume * 0.5;
          }
          break;
        case "social":
          if (track.tags.includes("social")) {
            newTrack.volume = Math.min(track.volume * 1.1, 100);
          }
          break;
        case "rest":
          newTrack.volume = track.volume * 0.7;
          break;
        default:
          // exploration - no changes
          break;
      }
      
      return newTrack;
    });
    
    setCurrentTracks(updatedTracks);
  };

  // トラック再生制御
  const toggleTrack = (trackId: string) => {
    const updatedTracks = currentTracks.map(track => {
      if (track.id === trackId) {
        return { ...track, isPlaying: !track.isPlaying };
      }
      return track;
    });
    setCurrentTracks(updatedTracks);
  };

  // 全トラック停止
  const stopAllTracks = () => {
    const updatedTracks = currentTracks.map(track => ({
      ...track,
      isPlaying: false,
      currentTime: 0,
    }));
    setCurrentTracks(updatedTracks);
  };

  // フェードアウト
  const fadeOutCurrentTracks = (callback: () => void) => {
    // 簡単な実装：即座にコールバック実行
    // 実際の実装では、音量を徐々に下げる
    callback();
  };

  // ボリューム調整
  const updateTrackVolume = (trackId: string, volume: number) => {
    const updatedTracks = currentTracks.map(track => {
      if (track.id === trackId) {
        return { ...track, volume };
      }
      return track;
    });
    setCurrentTracks(updatedTracks);
  };

  // 効果音再生
  const playSoundEffect = (effectId: string) => {
    // 効果音の再生ロジック
    console.log(`Playing sound effect: ${effectId}`);
  };

  // カテゴリ別のアイコン
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "bgm": return <MusicIcon />;
      case "ambient": return <AmbientIcon />;
      case "sfx": return <SoundIcon />;
      default: return <MusicIcon />;
    }
  };

  // カテゴリ別の色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "bgm": return "primary";
      case "ambient": return "success";
      case "sfx": return "warning";
      default: return "default";
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">
            オーディオシステム
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {gamePhase && `フェーズ: ${gamePhase}`}
            </Typography>
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        {/* マスターコントロール */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={2}>
              <IconButton onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <MuteIcon /> : <VolumeIcon />}
              </IconButton>
            </Grid>
            <Grid item xs={8}>
              <Slider
                value={isMuted ? 0 : masterVolume}
                onChange={(_, value) => setMasterVolume(value as number)}
                disabled={isMuted}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">{masterVolume}%</Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<StopIcon />}
              onClick={stopAllTracks}
              size="small"
            >
              全停止
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={autoAdjust}
                  onChange={(e) => setAutoAdjust(e.target.checked)}
                  size="small"
                />
              }
              label="自動調整"
            />
          </Box>
        </Box>

        <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 2 }}>
          <Tab label="プリセット" />
          <Tab label="現在の音声" />
          <Tab label="効果音" />
        </Tabs>

        {/* プリセットタブ */}
        {tabValue === 0 && (
          <Grid container spacing={2}>
            {AUDIO_PRESETS.map((preset) => (
              <Grid item xs={12} md={6} key={preset.id}>
                <Card
                  sx={{
                    border: currentPreset?.id === preset.id ? 2 : 1,
                    borderColor: currentPreset?.id === preset.id ? "primary.main" : "divider",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {preset.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {preset.description}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5, mb: 2 }}>
                      <Chip label={preset.environment} size="small" />
                      <Chip label={preset.mood} size="small" variant="outlined" />
                      <Chip label={`${preset.tracks.length}音源`} size="small" variant="outlined" />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => applyPreset(preset)}
                      variant={currentPreset?.id === preset.id ? "contained" : "outlined"}
                    >
                      {currentPreset?.id === preset.id ? "適用中" : "適用"}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* 現在の音声タブ */}
        {tabValue === 1 && (
          <Box>
            {currentTracks.length === 0 ? (
              <Alert severity="info">
                音声が設定されていません。プリセットを選択してください。
              </Alert>
            ) : (
              <List>
                {currentTracks.map((track) => (
                  <ListItem key={track.id} sx={{ border: 1, borderColor: "divider", mb: 1, borderRadius: 1 }}>
                    <ListItemIcon>
                      {getCategoryIcon(track.category)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="subtitle1">{track.name}</Typography>
                          <Chip 
                            label={track.category} 
                            size="small" 
                            color={getCategoryColor(track.category)} 
                          />
                          {track.loop && <LoopIcon fontSize="small" />}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Slider
                            value={track.volume}
                            onChange={(_, value) => updateTrackVolume(track.id, value as number)}
                            min={0}
                            max={100}
                            size="small"
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => `${value}%`}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => toggleTrack(track.id)}>
                        {track.isPlaying ? <PauseIcon /> : <PlayIcon />}
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* 効果音タブ */}
        {tabValue === 2 && (
          <Box>
            <Grid container spacing={1}>
              {SOUND_EFFECTS.map((effect) => (
                <Grid item xs={6} md={4} key={effect.id}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => playSoundEffect(effect.id)}
                    sx={{ justifyContent: "flex-start" }}
                  >
                    <SoundIcon sx={{ mr: 1 }} />
                    {effect.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* 設定ダイアログ */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>オーディオ設定</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={fadeTransitions}
                    onChange={(e) => setFadeTransitions(e.target.checked)}
                  />
                }
                label="フェード切り替え"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoAdjust}
                    onChange={(e) => setAutoAdjust(e.target.checked)}
                  />
                }
                label="ゲームフェーズに応じた自動音量調整"
              />
            </Grid>

            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>詳細設定</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Alert severity="info">
                        カスタム音声ファイルのアップロード機能は将来的に実装予定です。
                      </Alert>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        startIcon={<UploadIcon />}
                        variant="outlined"
                        disabled
                      >
                        カスタム音声をアップロード
                      </Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        startIcon={<DownloadIcon />}
                        variant="outlined"
                        disabled
                      >
                        音声パックをダウンロード
                      </Button>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AudioSystemManager;
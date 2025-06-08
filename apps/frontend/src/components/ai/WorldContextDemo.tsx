import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  Psychology,
  Map,
  WbSunny,
  Terrain,
  AutoAwesome,
  Settings,
  PlayArrow,
  Code,
  Casino as DiceIcon,
  Group as PartyIcon,
  Person as CharacterIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useRecoilValue } from 'recoil';
import { currentCampaignState } from '../../store/atoms';
import { BaseLocation, TRPGCharacter } from '@trpg-ai-gm/types';
import { useWorldContextAI } from '../../hooks/useWorldContextAI';
import { WorldContextBuilder } from '../../utils/WorldContextBuilder';
import { LocationBasedAI } from '../../utils/LocationBasedAI';
import { EnvironmentalSystem } from '../../utils/EnvironmentalSystem';

interface WorldContextDemoProps {
  currentLocation?: BaseLocation;
  activeCharacters?: TRPGCharacter[];
  onLocationChange?: (location: BaseLocation) => void;
}

export const WorldContextDemo: React.FC<WorldContextDemoProps> = ({
  currentLocation,
  activeCharacters = [],
  onLocationChange,
}) => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const { 
    startEncounterAI, 
    startConversationAI, 
    startExplorationAI, 
    startGeneralSessionAI,
    generateContext 
  } = useWorldContextAI();

  const [selectedSituation, setSelectedSituation] = useState<'encounter' | 'conversation' | 'exploration' | 'general'>('general');
  const [customInstruction, setCustomInstruction] = useState('');
  const [selectedNPC, setSelectedNPC] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [sessionDay, setSessionDay] = useState(1);
  const [contextDialog, setContextDialog] = useState(false);
  const [generatedContext, setGeneratedContext] = useState('');
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [environmentalEffects, setEnvironmentalEffects] = useState<any>(null);

  // 🌤️ 天候情報を生成
  useEffect(() => {
    if (currentLocation) {
      const weather = EnvironmentalSystem.generateCurrentWeather(currentLocation, 'spring');
      setCurrentWeather(weather);

      // 環境効果を計算
      if (activeCharacters.length > 0) {
        const effects = EnvironmentalSystem.calculateEnvironmentalEffectsOnCharacter(
          activeCharacters[0],
          currentLocation,
          weather,
          2 // 2時間滞在
        );
        setEnvironmentalEffects(effects);
      }
    }
  }, [currentLocation, activeCharacters]);

  // 🎮 AI対話を開始
  const handleStartAI = () => {
    if (!currentLocation) {
      console.error('拠点を選択してください');
      return;
    }

    const contextOptions = {
      currentLocation,
      activeCharacters,
      timeOfDay,
      sessionDay,
    };

    switch (selectedSituation) {
      case 'encounter':
        startEncounterAI(currentLocation, activeCharacters, customInstruction);
        break;
      case 'conversation':
        if (!selectedNPC) {
          console.error('NPCを選択してください');
          return;
        }
        startConversationAI(currentLocation, selectedNPC, activeCharacters, customInstruction);
        break;
      case 'exploration':
        startExplorationAI(currentLocation, activeCharacters, customInstruction);
        break;
      case 'general':
        startGeneralSessionAI(customInstruction || 'セッションを進行してください', contextOptions);
        break;
    }
  };

  // 📋 コンテキストをプレビュー
  const handlePreviewContext = () => {
    if (!currentLocation) {
      console.error('拠点を選択してください');
      return;
    }

    const contextOptions = {
      currentLocation,
      activeCharacters,
      timeOfDay,
      sessionDay,
    };

    const additionalInfo = selectedSituation === 'conversation' ? { npcName: selectedNPC } : undefined;
    const context = generateContext(selectedSituation, contextOptions, additionalInfo);
    setGeneratedContext(context);
    setContextDialog(true);
  };

  // 利用可能な拠点とNPCを取得
  const availableLocations = currentCampaign?.bases || [];
  const availableNPCs = currentLocation?.npcs || [];

  if (!currentCampaign) {
    return (
      <Alert severity="warning">
        キャンペーンが選択されていません。世界観コンテキストを使用するにはキャンペーンを選択してください。
      </Alert>
    );
  }

  return (
    <Box>
      <Stack spacing={3}>
        {/* 🎮 基本設定 */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Settings sx={{ verticalAlign: 'middle', mr: 1 }} />
              TRPG 世界観AI システム
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              拠点、時間、キャラクター情報を統合したコンテキスト認識型AIでTRPGセッションを進行
            </Typography>
            
            <Stack spacing={2}>
              {/* 拠点選択 */}
              <FormControl fullWidth>
                <InputLabel>現在の拠点</InputLabel>
                <Select
                  value={currentLocation?.id || ''}
                  onChange={(e) => {
                    const location = availableLocations.find(loc => loc.id === e.target.value);
                    if (location && onLocationChange) {
                      onLocationChange(location);
                    }
                  }}
                >
                  {availableLocations.map(location => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name} ({location.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 状況選択 */}
              <FormControl fullWidth>
                <InputLabel>セッション状況</InputLabel>
                <Select
                  value={selectedSituation}
                  onChange={(e) => setSelectedSituation(e.target.value as any)}
                >
                  <MenuItem value="encounter">⚔️ 戦闘・遭遇シーン</MenuItem>
                  <MenuItem value="conversation">💬 ロールプレイ・NPC対話</MenuItem>
                  <MenuItem value="exploration">🔍 探索・調査シーン</MenuItem>
                  <MenuItem value="general">🎮 汎用セッション進行</MenuItem>
                </Select>
              </FormControl>

              {/* NPC選択（会話時のみ） */}
              {selectedSituation === 'conversation' && (
                <FormControl fullWidth>
                  <InputLabel>対話するNPC</InputLabel>
                  <Select
                    value={selectedNPC}
                    onChange={(e) => setSelectedNPC(e.target.value)}
                  >
                    {availableNPCs.map(npc => (
                      <MenuItem key={npc.id} value={npc.name}>
                        {npc.name} ({npc.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* 時間帯・日数 */}
              <Stack direction="row" spacing={2}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel>時間帯</InputLabel>
                  <Select
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  >
                    <MenuItem value="morning">朝</MenuItem>
                    <MenuItem value="afternoon">昼</MenuItem>
                    <MenuItem value="evening">夕方</MenuItem>
                    <MenuItem value="night">夜</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="セッション日数"
                  type="number"
                  value={sessionDay}
                  onChange={(e) => setSessionDay(parseInt(e.target.value) || 1)}
                  sx={{ width: 140 }}
                />
              </Stack>

              {/* カスタム指示 */}
              <TextField
                label="カスタム指示（オプション）"
                multiline
                rows={3}
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="特別な状況や要求があれば入力してください..."
              />

              {/* アクションボタン */}
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleStartAI}
                  startIcon={<PlayArrow />}
                  disabled={!currentLocation}
                >
                  TRPGセッションを開始
                </Button>
                <Button
                  variant="outlined"
                  onClick={handlePreviewContext}
                  startIcon={<Code />}
                  disabled={!currentLocation}
                >
                  世界観コンテキスト確認
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* 🌍 現在の環境情報 */}
        {currentLocation && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Map sx={{ verticalAlign: 'middle', mr: 1 }} />
                現在の環境: {currentLocation.name}
              </Typography>
              
              <Stack spacing={2}>
                {/* 基本情報 */}
                <Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`種類: ${currentLocation.type}`} color="primary" size="small" />
                    <Chip label={`地域: ${currentLocation.region}`} size="small" />
                    <Chip label={`重要度: ${currentLocation.importance}`} size="small" />
                  </Stack>
                </Box>

                {/* 天候情報 */}
                {currentWeather && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        <WbSunny sx={{ verticalAlign: 'middle', mr: 1 }} />
                        天候情報
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1}>
                        <Typography><strong>状況</strong>: {currentWeather.condition}</Typography>
                        <Typography><strong>気温</strong>: {currentWeather.temperature}°C</Typography>
                        <Typography><strong>風速</strong>: {currentWeather.windSpeed}m/s</Typography>
                        <Typography><strong>視界</strong>: {currentWeather.visibility}</Typography>
                        {currentWeather.effects.length > 0 && (
                          <Box>
                            <Typography><strong>効果</strong>:</Typography>
                            {currentWeather.effects.map((effect: string, idx: number) => (
                              <Chip key={idx} label={effect} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* 環境効果 */}
                {environmentalEffects && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        <Terrain sx={{ verticalAlign: 'middle', mr: 1 }} />
                        環境効果
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        {environmentalEffects.healthEffects.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2">健康への影響:</Typography>
                            {environmentalEffects.healthEffects.map((effect: string, idx: number) => (
                              <Chip key={idx} label={effect} size="small" color="error" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        )}
                        
                        {environmentalEffects.recommendations.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2">推奨事項:</Typography>
                            {environmentalEffects.recommendations.map((rec: string, idx: number) => (
                              <Chip key={idx} label={rec} size="small" color="info" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* AI人格プレビュー */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>
                      <Psychology sx={{ verticalAlign: 'middle', mr: 1 }} />
                      AI人格設定
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {LocationBasedAI.getLocationPersonality(currentLocation)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* 🎯 使用方法ガイド */}
        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>
            <AutoAwesome sx={{ verticalAlign: 'middle', mr: 1 }} />
            TRPGセッション AI ガイド
          </Typography>
          <List dense sx={{ pl: 0 }}>
            <ListItem sx={{ pl: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Map fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="拠点選択" 
                secondary="現在いるキャンペーン拠点を選択してセッション舞台を設定"
              />
            </ListItem>
            <ListItem sx={{ pl: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <DiceIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="シーン設定" 
                secondary="戦闘、ロールプレイ、探索、汎用から状況を選択"
              />
            </ListItem>
            <ListItem sx={{ pl: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <TimelineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="時間・環境" 
                secondary="時間帯、セッション日数、特別な指示を設定"
              />
            </ListItem>
            <ListItem sx={{ pl: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Psychology fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="AI GMモード" 
                secondary="拠点データ、天候、文化的背景を統合したAIゲームマスター体験"
              />
            </ListItem>
          </List>
        </Alert>
      </Stack>

      {/* 📋 コンテキストプレビューダイアログ */}
      <Dialog
        open={contextDialog}
        onClose={() => setContextDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          TRPGキャンペーン世界観コンテキスト情報
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={20}
            fullWidth
            value={generatedContext}
            variant="outlined"
            InputProps={{
              readOnly: true,
              style: { fontFamily: 'monospace', fontSize: '0.875rem' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContextDialog(false)}>
            閉じる
          </Button>
          <Button 
            onClick={() => navigator.clipboard.writeText(generatedContext)}
            variant="contained"
          >
            コピー
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorldContextDemo;
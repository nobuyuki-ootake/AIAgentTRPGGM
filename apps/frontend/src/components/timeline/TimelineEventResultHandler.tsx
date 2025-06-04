import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Cancel as FailureIcon,
  Help as UnknownIcon,
  ExpandMore,
  Psychology as AIIcon,
  LocationOn as LocationIcon,
  Group as FactionIcon,
  TrendingUp as ImpactIcon,
} from '@mui/icons-material';
import { TimelineEvent } from '@trpg-ai-gm/types';

export interface EventResult {
  eventId: string;
  eventName: string;
  eventType: 'quest_completion' | 'combat_result' | 'social_interaction' | 'exploration' | 'political_action' | 'economic_action' | 'natural_disaster' | 'magical_event';
  outcome: 'success' | 'failure' | 'partial_success' | 'unknown';
  playerActions: string[];
  consequences: string[];
  affectedLocations: string[];
  affectedFactions: string[];
  worldStateChanges: {
    attribute: string;
    change: number;
    description: string;
  }[];
  longTermEffects: string[];
  playerInfluenceLevel: number; // 0-100
  notes: string;
}

interface TimelineEventResultHandlerProps {
  open: boolean;
  event: TimelineEvent | null;
  onClose: () => void;
  onSubmit: (result: EventResult) => void;
  onGenerateAIResult?: (event: TimelineEvent) => Promise<Partial<EventResult>>;
  availableLocations: Array<{ id: string; name: string }>;
  availableFactions?: Array<{ id: string; name: string }>;
}

const TimelineEventResultHandler: React.FC<TimelineEventResultHandlerProps> = ({
  open,
  event,
  onClose,
  onSubmit,
  onGenerateAIResult,
  availableLocations,
  availableFactions = [],
}) => {
  const [result, setResult] = useState<EventResult>({
    eventId: '',
    eventName: '',
    eventType: 'quest_completion',
    outcome: 'unknown',
    playerActions: [],
    consequences: [],
    affectedLocations: [],
    affectedFactions: [],
    worldStateChanges: [],
    longTermEffects: [],
    playerInfluenceLevel: 50,
    notes: '',
  });

  const [newPlayerAction, setNewPlayerAction] = useState('');
  const [newConsequence, setNewConsequence] = useState('');
  const [newLongTermEffect, setNewLongTermEffect] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  React.useEffect(() => {
    if (event) {
      setResult({
        eventId: event.id,
        eventName: event.title,
        eventType: mapEventTypeToStateChangeType(event.type),
        outcome: 'unknown',
        playerActions: [],
        consequences: [],
        affectedLocations: event.location ? [event.location] : [],
        affectedFactions: [],
        worldStateChanges: [],
        longTermEffects: [],
        playerInfluenceLevel: 50,
        notes: '',
      });
    }
  }, [event]);

  const mapEventTypeToStateChangeType = (eventType: string) => {
    switch (eventType) {
      case 'combat': return 'combat_result';
      case 'quest': return 'quest_completion';
      case 'social': return 'social_interaction';
      case 'exploration': return 'exploration';
      case 'political': return 'political_action';
      case 'economic': return 'economic_action';
      case 'natural': return 'natural_disaster';
      case 'magical': return 'magical_event';
      default: return 'quest_completion';
    }
  };

  const handleGenerateAIResult = async () => {
    if (!event || !onGenerateAIResult) return;
    
    setIsGeneratingAI(true);
    try {
      const aiResult = await onGenerateAIResult(event);
      setResult(prev => ({
        ...prev,
        ...aiResult,
      }));
    } catch (error) {
      console.error('AI結果生成エラー:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addPlayerAction = () => {
    if (newPlayerAction.trim()) {
      setResult(prev => ({
        ...prev,
        playerActions: [...prev.playerActions, newPlayerAction.trim()],
      }));
      setNewPlayerAction('');
    }
  };

  const addConsequence = () => {
    if (newConsequence.trim()) {
      setResult(prev => ({
        ...prev,
        consequences: [...prev.consequences, newConsequence.trim()],
      }));
      setNewConsequence('');
    }
  };

  const addLongTermEffect = () => {
    if (newLongTermEffect.trim()) {
      setResult(prev => ({
        ...prev,
        longTermEffects: [...prev.longTermEffects, newLongTermEffect.trim()],
      }));
      setNewLongTermEffect('');
    }
  };

  const removeItem = (array: string[], index: number, field: keyof EventResult) => {
    const newArray = array.filter((_, i) => i !== index);
    setResult(prev => ({
      ...prev,
      [field]: newArray,
    }));
  };

  const handleSubmit = () => {
    onSubmit(result);
    onClose();
  };

  const getOutcomeIcon = (outcome: EventResult['outcome']) => {
    switch (outcome) {
      case 'success': return <SuccessIcon color="success" />;
      case 'failure': return <FailureIcon color="error" />;
      case 'partial_success': return <ImpactIcon color="warning" />;
      default: return <UnknownIcon />;
    }
  };

  const generateWorldStateChanges = () => {
    const changes = [];
    
    // 結果に基づく自動的な状態変化提案
    switch (result.outcome) {
      case 'success':
        if (result.eventType === 'quest_completion') {
          changes.push({
            attribute: 'global.stability',
            change: 5,
            description: 'クエスト成功により安定度向上',
          });
        }
        if (result.eventType === 'combat_result') {
          changes.push({
            attribute: 'global.stability',
            change: 3,
            description: '戦闘勝利により治安改善',
          });
        }
        break;
      case 'failure':
        if (result.eventType === 'quest_completion') {
          changes.push({
            attribute: 'global.stability',
            change: -3,
            description: 'クエスト失敗により不安定化',
          });
        }
        break;
    }

    setResult(prev => ({
      ...prev,
      worldStateChanges: changes,
    }));
  };

  React.useEffect(() => {
    if (result.outcome !== 'unknown') {
      generateWorldStateChanges();
    }
  }, [result.outcome, result.eventType]);

  if (!event) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getOutcomeIcon(result.outcome)}
          イベント結果の記録 - {event.title}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* 基本情報 */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  基本情報
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>結果</InputLabel>
                      <Select
                        value={result.outcome}
                        onChange={(e) => setResult(prev => ({ ...prev, outcome: e.target.value as EventResult['outcome'] }))}
                        label="結果"
                      >
                        <MenuItem value="success">成功</MenuItem>
                        <MenuItem value="partial_success">部分的成功</MenuItem>
                        <MenuItem value="failure">失敗</MenuItem>
                        <MenuItem value="unknown">未確定</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>イベント種別</InputLabel>
                      <Select
                        value={result.eventType}
                        onChange={(e) => setResult(prev => ({ ...prev, eventType: e.target.value as EventResult['eventType'] }))}
                        label="イベント種別"
                      >
                        <MenuItem value="quest_completion">クエスト完了</MenuItem>
                        <MenuItem value="combat_result">戦闘結果</MenuItem>
                        <MenuItem value="social_interaction">社交イベント</MenuItem>
                        <MenuItem value="exploration">探索</MenuItem>
                        <MenuItem value="political_action">政治的行動</MenuItem>
                        <MenuItem value="economic_action">経済活動</MenuItem>
                        <MenuItem value="natural_disaster">自然災害</MenuItem>
                        <MenuItem value="magical_event">魔法的事象</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* AI生成ボタン */}
          {onGenerateAIResult && (
            <Grid item xs={12}>
              <Alert severity="info" action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleGenerateAIResult}
                  disabled={isGeneratingAI}
                  startIcon={<AIIcon />}
                >
                  {isGeneratingAI ? '生成中...' : 'AI結果生成'}
                </Button>
              }>
                AIを使用してイベント結果を自動生成できます
              </Alert>
            </Grid>
          )}

          {/* プレイヤーアクション */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">プレイヤーアクション ({result.playerActions.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      label="プレイヤーアクション"
                      value={newPlayerAction}
                      onChange={(e) => setNewPlayerAction(e.target.value)}
                      fullWidth
                      size="small"
                      onKeyPress={(e) => e.key === 'Enter' && addPlayerAction()}
                    />
                    <Button onClick={addPlayerAction} variant="outlined">
                      追加
                    </Button>
                  </Box>
                  <List dense>
                    {result.playerActions.map((action, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={action} />
                        <Button
                          size="small"
                          onClick={() => removeItem(result.playerActions, index, 'playerActions')}
                        >
                          削除
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 直接的な結果 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">直接的な結果 ({result.consequences.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      label="結果・影響"
                      value={newConsequence}
                      onChange={(e) => setNewConsequence(e.target.value)}
                      fullWidth
                      size="small"
                      onKeyPress={(e) => e.key === 'Enter' && addConsequence()}
                    />
                    <Button onClick={addConsequence} variant="outlined">
                      追加
                    </Button>
                  </Box>
                  <List dense>
                    {result.consequences.map((consequence, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={consequence} />
                        <Button
                          size="small"
                          onClick={() => removeItem(result.consequences, index, 'consequences')}
                        >
                          削除
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* 影響範囲 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">影響範囲</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>影響を受ける場所</InputLabel>
                      <Select
                        multiple
                        value={result.affectedLocations}
                        onChange={(e) => setResult(prev => ({ ...prev, affectedLocations: e.target.value as string[] }))}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={availableLocations.find(l => l.id === value)?.name || value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {availableLocations.map((location) => (
                          <MenuItem key={location.id} value={location.id}>
                            <LocationIcon sx={{ mr: 1 }} />
                            {location.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>影響を受ける勢力</InputLabel>
                      <Select
                        multiple
                        value={result.affectedFactions}
                        onChange={(e) => setResult(prev => ({ ...prev, affectedFactions: e.target.value as string[] }))}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={availableFactions.find(f => f.id === value)?.name || value} size="small" />
                            ))}
                          </Box>
                        )}
                      >
                        {availableFactions.map((faction) => (
                          <MenuItem key={faction.id} value={faction.id}>
                            <FactionIcon sx={{ mr: 1 }} />
                            {faction.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* プレイヤー影響度 */}
          <Grid item xs={12}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                プレイヤー影響度: {result.playerInfluenceLevel}%
              </Typography>
              <Slider
                value={result.playerInfluenceLevel}
                onChange={(_, value) => setResult(prev => ({ ...prev, playerInfluenceLevel: value as number }))}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '無関係' },
                  { value: 25, label: '軽微' },
                  { value: 50, label: '中程度' },
                  { value: 75, label: '重要' },
                  { value: 100, label: '決定的' },
                ]}
              />
            </Box>
          </Grid>

          {/* 世界状態への影響 */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">世界状態への影響 ({result.worldStateChanges.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {result.worldStateChanges.length > 0 ? (
                  <List>
                    {result.worldStateChanges.map((change, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ImpactIcon color={change.change > 0 ? 'success' : 'error'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${change.attribute}: ${change.change > 0 ? '+' : ''}${change.change}`}
                          secondary={change.description}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    世界状態への影響は結果に基づいて自動計算されます
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* メモ */}
          <Grid item xs={12}>
            <TextField
              label="メモ・追加情報"
              multiline
              rows={3}
              value={result.notes}
              onChange={(e) => setResult(prev => ({ ...prev, notes: e.target.value }))}
              fullWidth
              placeholder="このイベントに関する追加情報や特記事項..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          キャンセル
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          結果を記録
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimelineEventResultHandler;
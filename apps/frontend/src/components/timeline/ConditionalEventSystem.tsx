import React, { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Event as EventIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ExpandMore,
  Add as AddIcon,
} from "@mui/icons-material";
import { TimelineEvent, TRPGCharacter, BaseLocation } from "@trpg-ai-gm/types";

interface EventTriggerCondition {
  id: string;
  type: "time" | "location" | "character_presence" | "item_possession" | "quest_status" | "random";
  timeCondition?: {
    day: number;
    hour?: number;
  };
  locationCondition?: {
    location: string;
    characters?: string[]; // 特定のキャラクターがその場所にいる必要がある
  };
  characterCondition?: {
    characterId: string;
    health?: "low" | "high";
    status?: string;
  };
  itemCondition?: {
    itemName: string;
    quantity?: number;
  };
  questCondition?: {
    questId: string;
    status: "active" | "completed" | "failed";
  };
  randomCondition?: {
    probability: number; // 0-100%
    checkInterval: "hourly" | "daily";
  };
}

interface ConditionalEvent extends TimelineEvent {
  triggerConditions: EventTriggerCondition[];
  triggered: boolean;
  consequenceEvents?: string[]; // このイベントが引き起こす他のイベントのID
  preventable: boolean; // プレイヤーの行動で回避可能かどうか
  severity: "info" | "warning" | "danger" | "critical";
}

interface ConditionalEventSystemProps {
  currentDay: number;
  currentHour: number;
  currentLocation: string;
  characters: TRPGCharacter[];
  locations: BaseLocation[];
  playerInventory: string[];
  activeQuests: { id: string; status: string }[];
  events: ConditionalEvent[];
  onEventTriggered: (event: ConditionalEvent) => void;
  onEventCreated: (event: ConditionalEvent) => void;
}

const ConditionalEventSystem: React.FC<ConditionalEventSystemProps> = ({
  currentDay,
  currentHour,
  currentLocation,
  characters,
  locations,
  playerInventory,
  activeQuests,
  events,
  onEventTriggered,
  onEventCreated,
}) => {
  const [triggeredEvents, setTriggeredEvents] = useState<ConditionalEvent[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<ConditionalEvent>>({
    triggerConditions: [],
    triggered: false,
    preventable: true,
    severity: "info",
  });

  // イベント条件チェック
  useEffect(() => {
    const checkEvents = () => {
      const triggeredList: ConditionalEvent[] = [];

      events.forEach(event => {
        if (event.triggered) return;

        let shouldTrigger = false;

        // 全ての条件をチェック
        const conditionsMet = event.triggerConditions.every(condition => {
          switch (condition.type) {
            case "time":
              if (condition.timeCondition) {
                const { day, hour } = condition.timeCondition;
                if (currentDay >= day) {
                  if (hour !== undefined) {
                    return currentDay === day && currentHour >= hour;
                  }
                  return true;
                }
              }
              return false;

            case "location":
              if (condition.locationCondition) {
                const { location, characters: requiredChars } = condition.locationCondition;
                if (currentLocation === location) {
                  if (requiredChars && requiredChars.length > 0) {
                    // 特定のキャラクターがその場所にいるかチェック
                    return requiredChars.every(charId =>
                      characters.some(char => 
                        char.id === charId && 
                        (char as any).currentLocation === currentLocation
                      )
                    );
                  }
                  return true;
                }
              }
              return false;

            case "character_presence":
              if (condition.characterCondition) {
                const char = characters.find(c => c.id === condition.characterCondition!.characterId);
                if (char) {
                  if (condition.characterCondition.health) {
                    const healthPercentage = (char.stats.hitPoints.current / char.stats.hitPoints.max) * 100;
                    if (condition.characterCondition.health === "low" && healthPercentage > 25) return false;
                    if (condition.characterCondition.health === "high" && healthPercentage < 75) return false;
                  }
                  return true;
                }
              }
              return false;

            case "item_possession":
              if (condition.itemCondition) {
                const { itemName, quantity = 1 } = condition.itemCondition;
                const itemCount = playerInventory.filter(item => item === itemName).length;
                return itemCount >= quantity;
              }
              return false;

            case "quest_status":
              if (condition.questCondition) {
                const quest = activeQuests.find(q => q.id === condition.questCondition!.questId);
                return quest ? quest.status === condition.questCondition.status : false;
              }
              return false;

            case "random":
              if (condition.randomCondition) {
                // 簡単な確率チェック（実際のゲームではより複雑な実装が必要）
                return Math.random() * 100 < condition.randomCondition.probability;
              }
              return false;

            default:
              return false;
          }
        });

        if (conditionsMet) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          triggeredList.push(event);
        }
      });

      if (triggeredList.length > 0) {
        setTriggeredEvents(triggeredList);
        triggeredList.forEach(event => onEventTriggered(event));
      }
    };

    checkEvents();
  }, [currentDay, currentHour, currentLocation, characters, playerInventory, activeQuests, events, onEventTriggered]);

  // 新しい条件発火イベント作成
  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.description) return;

    const event: ConditionalEvent = {
      id: `conditional-event-${Date.now()}`,
      title: newEvent.title,
      description: newEvent.description,
      type: newEvent.type || "encounter",
      day: currentDay,
      timeOfDay: "morning",
      location: currentLocation,
      characters: [],
      plotElementId: "",
      triggerConditions: newEvent.triggerConditions || [],
      triggered: false,
      consequenceEvents: [],
      preventable: newEvent.preventable !== false,
      severity: newEvent.severity || "info",
    };

    onEventCreated(event);
    setCreateDialogOpen(false);
    setNewEvent({
      triggerConditions: [],
      triggered: false,
      preventable: true,
      severity: "info",
    });
  };

  // 条件の追加
  const addCondition = () => {
    const newCondition: EventTriggerCondition = {
      id: `condition-${Date.now()}`,
      type: "time",
      timeCondition: { day: currentDay + 1 },
    };

    setNewEvent({
      ...newEvent,
      triggerConditions: [...(newEvent.triggerConditions || []), newCondition],
    });
  };

  // 重要度カラー
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "info": return "info";
      case "warning": return "warning";
      case "danger": return "error";
      case "critical": return "error";
      default: return "default";
    }
  };

  return (
    <Box>
      {/* 発生したイベントの表示 */}
      {triggeredEvents.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            発生したイベント
          </Typography>
          {triggeredEvents.map(event => (
            <Alert
              key={event.id}
              severity={getSeverityColor(event.severity) as any}
              sx={{ mb: 1 }}
              icon={<EventIcon />}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {event.title}
              </Typography>
              <Typography variant="body2">
                {event.description}
              </Typography>
              {!event.preventable && (
                <Typography variant="caption" color="error">
                  このイベントは回避不可能です
                </Typography>
              )}
            </Alert>
          ))}
        </Box>
      )}

      {/* 条件発火イベント作成 */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          条件発火イベントを作成
        </Button>
      </Box>

      {/* 既存の条件発火イベント一覧 */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          設定済み条件発火イベント ({events.length})
        </Typography>
        
        {events.map(event => (
          <Paper key={event.id} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {event.title}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  label={event.triggered ? "発生済み" : "待機中"}
                  color={event.triggered ? "success" : "default"}
                  size="small"
                />
                <Chip
                  label={event.severity}
                  color={getSeverityColor(event.severity)}
                  size="small"
                />
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {event.description}
            </Typography>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="body2">
                  発火条件 ({event.triggerConditions.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {event.triggerConditions.map(condition => (
                    <ListItem key={condition.id}>
                      <ListItemIcon>
                        {condition.type === "time" && <ScheduleIcon />}
                        {condition.type === "location" && <LocationIcon />}
                        {condition.type === "character_presence" && <PersonIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={getConditionDescription(condition)}
                        secondary={`タイプ: ${condition.type}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Paper>
        ))}
      </Box>

      {/* イベント作成ダイアログ */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>条件発火イベント作成</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="イベント名"
                value={newEvent.title || ""}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="イベント説明"
                multiline
                rows={3}
                value={newEvent.description || ""}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>重要度</InputLabel>
                <Select
                  value={newEvent.severity || "info"}
                  label="重要度"
                  onChange={(e) => setNewEvent({ ...newEvent, severity: e.target.value as any })}
                >
                  <MenuItem value="info">情報</MenuItem>
                  <MenuItem value="warning">警告</MenuItem>
                  <MenuItem value="danger">危険</MenuItem>
                  <MenuItem value="critical">緊急</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>回避可能性</InputLabel>
                <Select
                  value={newEvent.preventable !== false ? "true" : "false"}
                  label="回避可能性"
                  onChange={(e) => setNewEvent({ ...newEvent, preventable: e.target.value === "true" })}
                >
                  <MenuItem value="true">回避可能</MenuItem>
                  <MenuItem value="false">回避不可</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">発火条件</Typography>
                <Button variant="outlined" onClick={addCondition}>
                  条件を追加
                </Button>
              </Box>
              
              {/* 条件リスト表示は省略（実装可能） */}
              <Typography variant="body2" color="text.secondary">
                {newEvent.triggerConditions?.length || 0} 個の条件が設定されています
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleCreateEvent}
            disabled={!newEvent.title || !newEvent.description}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// 条件の説明文を生成
const getConditionDescription = (condition: EventTriggerCondition): string => {
  switch (condition.type) {
    case "time":
      if (condition.timeCondition) {
        const { day, hour } = condition.timeCondition;
        return hour !== undefined
          ? `${day}日目の${hour}時に発生`
          : `${day}日目に発生`;
      }
      return "時間条件";
      
    case "location":
      if (condition.locationCondition) {
        return `場所「${condition.locationCondition.location}」で発生`;
      }
      return "場所条件";
      
    case "character_presence":
      if (condition.characterCondition) {
        return `キャラクター条件: ${condition.characterCondition.characterId}`;
      }
      return "キャラクター条件";
      
    case "item_possession":
      if (condition.itemCondition) {
        const { itemName, quantity = 1 } = condition.itemCondition;
        return `アイテム「${itemName}」を${quantity}個以上所持`;
      }
      return "アイテム条件";
      
    case "quest_status":
      if (condition.questCondition) {
        return `クエスト「${condition.questCondition.questId}」が${condition.questCondition.status}`;
      }
      return "クエスト条件";
      
    case "random":
      if (condition.randomCondition) {
        return `確率${condition.randomCondition.probability}%で発生`;
      }
      return "ランダム条件";
      
    default:
      return "不明な条件";
  }
};

export default ConditionalEventSystem;
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
  Slider,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { TimelineEvent, BaseLocation, TRPGCharacter } from "@trpg-ai-gm/types";

interface LocationTimeEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  timeRange: {
    startDay: number;
    endDay: number;
    startHour?: number;
    endHour?: number;
  };
  frequency: "once" | "daily" | "weekly" | "random";
  probability?: number; // ランダムイベントの確率 (0-100)
  requiredCharacters?: string[]; // このイベントに必要なキャラクター
  consequences: {
    statChanges?: { characterId: string; stat: string; change: number }[];
    itemGains?: { item: string; quantity: number }[];
    itemLosses?: { item: string; quantity: number }[];
    questUpdates?: { questId: string; status: string }[];
    locationChanges?: { location: string; property: string; value: any }[];
  };
  priority: "low" | "medium" | "high" | "critical";
  triggered: boolean;
  lastTriggered?: Date;
}

interface LocationTimeEventTriggerProps {
  currentDay: number;
  currentHour: number;
  currentLocation: string;
  characters: TRPGCharacter[];
  locations: BaseLocation[];
  events: LocationTimeEvent[];
  onEventTriggered: (event: LocationTimeEvent) => void;
  onEventCreated: (event: LocationTimeEvent) => void;
  onEventUpdated: (event: LocationTimeEvent) => void;
}

const LocationTimeEventTrigger: React.FC<LocationTimeEventTriggerProps> = ({
  currentDay,
  currentHour,
  currentLocation,
  characters,
  locations,
  events,
  onEventTriggered,
  onEventCreated,
  onEventUpdated,
}) => {
  const [activeEvents, setActiveEvents] = useState<LocationTimeEvent[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LocationTimeEvent | null>(null);
  
  const [formData, setFormData] = useState<Partial<LocationTimeEvent>>({
    title: "",
    description: "",
    location: currentLocation,
    timeRange: {
      startDay: currentDay,
      endDay: currentDay + 7,
    },
    frequency: "once",
    probability: 50,
    priority: "medium",
    consequences: {},
  });

  // イベントトリガーチェック
  useEffect(() => {
    const triggeredEvents: LocationTimeEvent[] = [];

    events.forEach(event => {
      if (event.triggered && event.frequency === "once") return;

      // 場所チェック
      if (event.location !== currentLocation) return;

      // 時間範囲チェック
      const { startDay, endDay, startHour, endHour } = event.timeRange;
      if (currentDay < startDay || currentDay > endDay) return;

      // 時間帯チェック
      if (startHour !== undefined && endHour !== undefined) {
        if (currentHour < startHour || currentHour > endHour) return;
      }

      // 頻度チェック
      if (event.frequency === "daily") {
        // 毎日発生する場合、最後の発生から24時間経過しているかチェック
        if (event.lastTriggered) {
          const lastDate = new Date(event.lastTriggered);
          const currentDate = new Date();
          const hoursSince = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
          if (hoursSince < 24) return;
        }
      } else if (event.frequency === "weekly") {
        // 週1回の場合、最後の発生から7日経過しているかチェック
        if (event.lastTriggered) {
          const lastDate = new Date(event.lastTriggered);
          const currentDate = new Date();
          const daysSince = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < 7) return;
        }
      } else if (event.frequency === "random") {
        // ランダムイベントの確率チェック
        if (Math.random() * 100 > (event.probability || 50)) return;
      }

      // 必要キャラクターチェック
      if (event.requiredCharacters && event.requiredCharacters.length > 0) {
        const presentCharacters = characters.filter(char => 
          (char as any).currentLocation === currentLocation
        );
        const hasRequiredChars = event.requiredCharacters.every(reqCharId =>
          presentCharacters.some(char => char.id === reqCharId)
        );
        if (!hasRequiredChars) return;
      }

      triggeredEvents.push(event);
    });

    if (triggeredEvents.length > 0) {
      setActiveEvents(triggeredEvents);
      triggeredEvents.forEach(event => {
        onEventTriggered(event);
        
        // イベント状態を更新
        const updatedEvent = {
          ...event,
          triggered: true,
          lastTriggered: new Date(),
        };
        onEventUpdated(updatedEvent);
      });
    }
  }, [currentDay, currentHour, currentLocation, characters, events, onEventTriggered, onEventUpdated]);

  // 新規イベント作成
  const handleCreateEvent = () => {
    if (!formData.title || !formData.description || !formData.location) return;

    const newEvent: LocationTimeEvent = {
      id: `location-time-event-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      timeRange: formData.timeRange!,
      frequency: formData.frequency || "once",
      probability: formData.probability,
      requiredCharacters: formData.requiredCharacters,
      consequences: formData.consequences || {},
      priority: formData.priority || "medium",
      triggered: false,
    };

    onEventCreated(newEvent);
    handleCloseDialog();
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      location: currentLocation,
      timeRange: {
        startDay: currentDay,
        endDay: currentDay + 7,
      },
      frequency: "once",
      probability: 50,
      priority: "medium",
      consequences: {},
    });
  };

  // 優先度の色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "success";
      case "medium": return "warning";
      case "high": return "error";
      case "critical": return "error";
      default: return "default";
    }
  };

  // 現在の場所で発生可能なイベント
  const availableEvents = events.filter(event => 
    event.location === currentLocation &&
    currentDay >= event.timeRange.startDay &&
    currentDay <= event.timeRange.endDay
  );

  return (
    <Box>
      {/* アクティブイベント表示 */}
      {activeEvents.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            発生中のイベント
          </Typography>
          {activeEvents.map(event => (
            <Alert
              key={event.id}
              severity={getPriorityColor(event.priority) as any}
              icon={<EventIcon />}
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {event.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {event.description}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip label={event.location} size="small" icon={<LocationIcon />} />
                <Chip label={event.priority} size="small" color={getPriorityColor(event.priority)} />
                <Chip label={event.frequency} size="small" variant="outlined" />
              </Box>
            </Alert>
          ))}
        </Box>
      )}

      {/* 現在地で利用可能なイベント */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {currentLocation} で発生可能なイベント ({availableEvents.length})
        </Typography>
        
        <Grid container spacing={2}>
          {availableEvents.map(event => (
            <Grid size={{ xs: 12, md: 6 }} key={event.id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {event.title}
                  </Typography>
                  <Chip
                    label={event.triggered ? "発生済み" : "待機中"}
                    color={event.triggered ? "success" : "default"}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {event.description}
                </Typography>

                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <Chip label={event.priority} size="small" color={getPriorityColor(event.priority)} />
                  <Chip label={event.frequency} size="small" variant="outlined" />
                  {event.probability && (
                    <Chip label={`確率: ${event.probability}%`} size="small" variant="outlined" />
                  )}
                </Box>

                <Typography variant="body2" sx={{ mb: 1 }}>
                  <ScheduleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                  {event.timeRange.startDay}日目〜{event.timeRange.endDay}日目
                  {event.timeRange.startHour !== undefined && (
                    <> ({event.timeRange.startHour}時〜{event.timeRange.endHour}時)</>
                  )}
                </Typography>

                {event.requiredCharacters && event.requiredCharacters.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    必要キャラクター: {event.requiredCharacters.join(", ")}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* イベント作成ボタン */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          場所・時間イベントを作成
        </Button>
      </Box>

      {/* 全イベント一覧 */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          全イベント一覧 ({events.length})
        </Typography>
        
        <List>
          {events.map(event => (
            <ListItem key={event.id} sx={{ border: 1, borderColor: "divider", mb: 1, borderRadius: 1 }}>
              <ListItemIcon>
                <EventIcon color={event.triggered ? "success" : "action"} />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle1">{event.title}</Typography>
                    <Chip label={event.location} size="small" />
                    <Chip label={event.priority} size="small" color={getPriorityColor(event.priority)} />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {event.description}
                    </Typography>
                    <Typography variant="caption">
                      {event.timeRange.startDay}日目〜{event.timeRange.endDay}日目 | {event.frequency}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* イベント作成ダイアログ */}
      <Dialog open={createDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>場所・時間イベント作成</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="イベント名"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="イベント説明"
                multiline
                rows={3}
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>場所</InputLabel>
                <Select
                  value={formData.location || ""}
                  label="場所"
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  {locations.map(location => (
                    <MenuItem key={location.id} value={location.name}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>頻度</InputLabel>
                <Select
                  value={formData.frequency || "once"}
                  label="頻度"
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                >
                  <MenuItem value="once">一度のみ</MenuItem>
                  <MenuItem value="daily">毎日</MenuItem>
                  <MenuItem value="weekly">毎週</MenuItem>
                  <MenuItem value="random">ランダム</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="開始日"
                type="number"
                value={formData.timeRange?.startDay || currentDay}
                onChange={(e) => setFormData({
                  ...formData,
                  timeRange: {
                    ...formData.timeRange!,
                    startDay: parseInt(e.target.value) || currentDay
                  }
                })}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="終了日"
                type="number"
                value={formData.timeRange?.endDay || currentDay + 7}
                onChange={(e) => setFormData({
                  ...formData,
                  timeRange: {
                    ...formData.timeRange!,
                    endDay: parseInt(e.target.value) || currentDay + 7
                  }
                })}
              />
            </Grid>

            {formData.frequency === "random" && (
              <Grid size={{ xs: 12 }}>
                <Typography gutterBottom>発生確率: {formData.probability}%</Typography>
                <Slider
                  value={formData.probability || 50}
                  onChange={(_, value) => setFormData({ ...formData, probability: value as number })}
                  min={0}
                  max={100}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>優先度</InputLabel>
                <Select
                  value={formData.priority || "medium"}
                  label="優先度"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <MenuItem value="low">低</MenuItem>
                  <MenuItem value="medium">中</MenuItem>
                  <MenuItem value="high">高</MenuItem>
                  <MenuItem value="critical">緊急</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleCreateEvent}
            disabled={!formData.title || !formData.description || !formData.location}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationTimeEventTrigger;
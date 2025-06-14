import React, { useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  useTheme,
  IconButton,
  Button,
} from "@mui/material";
import {
  Event as EventIcon,
  Place as PlaceIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";
import { useDroppable } from "@dnd-kit/core";
import {
  TimelineEvent,
  PlaceElement,
  BaseLocation,
  CampaignMilestone,
} from "@trpg-ai-gm/types";
import TimelineEventCard from "./TimelineEventCard";
import MilestoneIndicator from "./MilestoneIndicator";
import moment from "moment";

interface TimelineDayListProps {
  timelineEvents: TimelineEvent[];
  places: (PlaceElement | BaseLocation)[];
  plots: any[];
  dateArray: string[];
  milestones?: CampaignMilestone[];
  currentDay?: number;
  onEventClick: (id: string) => void;
  onDeleteEvent?: (id: string) => void;
  onEventResultClick?: (event: TimelineEvent) => void;
  onAddEventToDay?: (date: string) => void;
  onClearConditionClick?: () => void;
  onMilestoneEdit?: (milestone: CampaignMilestone) => void;
}

const TimelineDayList: React.FC<TimelineDayListProps> = ({
  timelineEvents,
  places,
  plots,
  dateArray,
  milestones = [],
  currentDay = 1,
  onEventClick,
  onDeleteEvent,
  onEventResultClick,
  onAddEventToDay,
  onClearConditionClick,
  onMilestoneEdit,
}) => {
  const theme = useTheme();

  // 日付ごとのイベントをグループ化
  const eventsByDate = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    
    // 全ての日付を初期化
    dateArray.forEach((dateString, index) => {
      let validDate;
      if (typeof dateString === 'string' && dateString.trim()) {
        validDate = moment(dateString);
      } else {
        validDate = moment().add(index, 'days');
      }
      
      if (validDate.isValid()) {
        const dayKey = validDate.format("YYYY-MM-DD");
        map.set(dayKey, []);
      }
    });
    
    // イベントを日付ごとに分類
    timelineEvents.forEach(event => {
      const eventDay = moment(event.date).format("YYYY-MM-DD");
      const existingEvents = map.get(eventDay) || [];
      map.set(eventDay, [...existingEvents, event].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      ));
    });
    
    return map;
  }, [timelineEvents, dateArray]);

  // 日数ごとのマイルストーンをグループ化
  const milestonesByDay = useMemo(() => {
    const map = new Map<number, CampaignMilestone[]>();
    
    milestones.forEach(milestone => {
      // targetDayに基づいてマイルストーンを配置
      const day = milestone.targetDay;
      const existingMilestones = map.get(day) || [];
      map.set(day, [...existingMilestones, milestone]);
    });
    
    return map;
  }, [milestones]);

  // イベントの色をマイルストーンに基づいて決定
  const getEventColor = useCallback((event: TimelineEvent) => {
    // このイベントが関連するマイルストーンを検索
    const relatedMilestone = milestones.find(milestone => 
      milestone.requirements.some(req => 
        req.type === "events" && req.eventIds?.includes(event.id)
      )
    );
    
    if (relatedMilestone) {
      // マイルストーンの色を返す
      if (relatedMilestone.status === "completed") return "#4CAF50";
      if (relatedMilestone.status === "failed") return "#F44336";
      if (relatedMilestone.status === "overdue") return "#FF5722";
      
      switch (relatedMilestone.priority) {
        case "critical": return "#E91E63";
        case "important": return "#2196F3";
        case "optional": return "#9E9E9E";
        default: return "#2196F3";
      }
    }
    
    return null; // デフォルト色を使用
  }, [milestones]);

  // 場所名を取得
  const getPlaceName = useCallback((placeId?: string) => {
    if (!placeId) return "未設定";
    const place = places.find(p => p.id === placeId);
    return place?.name || "不明な場所";
  }, [places]);

  // プロット名を取得
  const getPlotName = useCallback((plotId: string) => {
    const plot = plots.find(p => p.id === plotId);
    return plot?.title || "不明なプロット";
  }, [plots]);

  // 日付カードのドロップ可能エリア
  const DayDropZone: React.FC<{ date: string; children: React.ReactNode }> = ({ date, children }) => {
    const dayKey = moment(date).format("YYYY-MM-DD");
    const { setNodeRef, isOver } = useDroppable({
      id: `day-${dayKey}`,
      data: {
        type: "timeline-day",
        date: date,
        dayKey: dayKey,
      },
    });

    return (
      <Box
        ref={setNodeRef}
        sx={{
          position: "relative",
          minHeight: 120,
          backgroundColor: isOver ? theme.palette.action.hover : "transparent",
          borderRadius: 1,
          transition: "background-color 0.2s ease",
        }}
      >
        {children}
        {isOver && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.palette.primary.main,
              opacity: 0.1,
              borderRadius: 1,
              border: `2px dashed ${theme.palette.primary.main}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Typography variant="body2" color="primary" fontWeight="bold">
              イベントをここにドロップ
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <CalendarIcon color="primary" />
        <Typography variant="h6">
          タイムライン（日付別）
        </Typography>
        <Chip 
          label={`${dateArray.length}日間`} 
          size="small" 
          color="primary" 
          variant="outlined" 
        />
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        pr: 1,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#a1a1a1',
        },
      }}>
        <Stack spacing={2}>
        {dateArray.map((dateString, index) => {
          console.log('[TimelineDayList] Processing dateString:', dateString, 'type:', typeof dateString);
          
          // dateStringが有効な日付でない場合のフォールバック
          let validDate;
          if (typeof dateString === 'string' && dateString.trim()) {
            validDate = moment(dateString);
          } else {
            // インデックスベースで日付を生成
            validDate = moment().add(index, 'days');
          }
          
          const dayKey = validDate.format("YYYY-MM-DD");
          const dayEvents = eventsByDate.get(dayKey) || [];
          const dayNumber = index + 1;
          const formattedDate = validDate.isValid() ? validDate.format("MM月DD日(ddd)") : `${dayNumber}日目`;
          const isFinalDay = index === dateArray.length - 1;
          const dayMilestones = milestonesByDay.get(dayNumber) || [];
          
          return (
            <Paper 
              key={dayKey} 
              elevation={2} 
              sx={{ 
                overflow: "hidden",
                border: dayEvents.length > 0 ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
              }}
            >
              {/* 日付ヘッダー */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: dayEvents.length > 0 
                    ? theme.palette.primary.main 
                    : theme.palette.grey[100],
                  color: dayEvents.length > 0 
                    ? theme.palette.primary.contrastText 
                    : theme.palette.text.primary,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    {dayNumber}日目
                  </Typography>
                  <Typography variant="subtitle1">
                    {formattedDate}
                  </Typography>
                  
                  {/* マイルストーンインジケーター */}
                  {dayMilestones.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      {dayMilestones.map((milestone) => (
                        <Box key={milestone.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <MilestoneIndicator
                            milestone={milestone}
                            day={dayNumber}
                            currentDay={currentDay}
                            onEdit={onMilestoneEdit}
                            size="medium"
                          />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              color: dayEvents.length > 0 
                                ? theme.palette.primary.contrastText 
                                : theme.palette.text.primary,
                              maxWidth: 80,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {milestone.title}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  <Chip 
                    label={`${dayEvents.length}イベント`}
                    size="small"
                    sx={{
                      backgroundColor: dayEvents.length > 0 
                        ? theme.palette.primary.contrastText 
                        : theme.palette.primary.main,
                      color: dayEvents.length > 0 
                        ? theme.palette.primary.main 
                        : theme.palette.primary.contrastText,
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {onAddEventToDay && (
                    <IconButton
                      size="small"
                      onClick={() => onAddEventToDay(dateString)}
                      sx={{
                        color: dayEvents.length > 0 
                          ? theme.palette.primary.contrastText 
                          : theme.palette.primary.main,
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  )}
                  
                  {isFinalDay && onClearConditionClick && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<FlagIcon />}
                      onClick={onClearConditionClick}
                      sx={{
                        color: dayEvents.length > 0 
                          ? theme.palette.primary.contrastText 
                          : theme.palette.primary.main,
                        borderColor: dayEvents.length > 0 
                          ? theme.palette.primary.contrastText 
                          : theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: dayEvents.length > 0 
                            ? 'rgba(255, 255, 255, 0.1)'
                            : theme.palette.primary.main + '10',
                        }
                      }}
                    >
                      クリア条件設定
                    </Button>
                  )}
                </Box>
              </Box>

              {/* イベントコンテンツエリア */}
              <DayDropZone date={dateString}>
                <Box sx={{ p: 2 }}>
                  {dayEvents.length > 0 ? (
                    <Stack spacing={2}>
                      {dayEvents.map((event, eventIndex) => {
                        const placeName = getPlaceName(event.placeId);
                        let plotName: string | undefined = undefined;
                        if (event.relatedPlotIds && event.relatedPlotIds.length > 0) {
                          plotName = getPlotName(event.relatedPlotIds[0]);
                        }

                        return (
                          <Box key={event.id}>
                            {eventIndex > 0 && <Divider sx={{ my: 1 }} />}
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                              {/* イベント順序番号 */}
                              <Box
                                sx={{
                                  minWidth: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  backgroundColor: theme.palette.primary.main,
                                  color: theme.palette.primary.contrastText,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.875rem",
                                  fontWeight: "bold",
                                  mt: 0.5,
                                }}
                              >
                                {eventIndex + 1}
                              </Box>
                              
                              {/* イベントカード */}
                              <Box sx={{ flex: 1 }}>
                                <TimelineEventCard
                                  event={event}
                                  placeName={placeName}
                                  plotName={plotName}
                                  onEdit={() => onEventClick(event.id)}
                                  onDelete={onDeleteEvent}
                                  onEventResultClick={onEventResultClick}
                                  dndContextType="day-list"
                                  compact={true}
                                  milestoneColor={getEventColor(event) || undefined}
                                />
                                
                                {/* 場所情報 */}
                                <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                  <PlaceIcon fontSize="small" color="action" />
                                  <Typography variant="caption" color="text.secondary">
                                    場所: {placeName}
                                  </Typography>
                                  {plotName && (
                                    <>
                                      <Divider orientation="vertical" flexItem />
                                      <EventIcon fontSize="small" color="action" />
                                      <Typography variant="caption" color="text.secondary">
                                        関連: {plotName}
                                      </Typography>
                                    </>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 4,
                        color: "text.secondary",
                        bgcolor: theme.palette.grey[50],
                        borderRadius: 1,
                        border: `2px dashed ${theme.palette.divider}`,
                      }}
                    >
                      <EventIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                      <Typography variant="body2">
                        この日にはイベントが設定されていません
                      </Typography>
                      <Typography variant="caption">
                        イベントシードをドラッグしてここにドロップするか、「+」ボタンで追加できます
                      </Typography>
                    </Box>
                  )}
                </Box>
              </DayDropZone>
            </Paper>
          );
        })}
        </Stack>
      </Box>
    </Box>
  );
};

export default TimelineDayList;
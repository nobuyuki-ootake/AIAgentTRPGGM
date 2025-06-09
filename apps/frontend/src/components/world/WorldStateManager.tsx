import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Slider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import {
  Public as WorldIcon,
  TrendingUp as ImpactIcon,
  TrendingDown as DeclineIcon,
  Timeline as TimelineIcon,
  Event as EventIcon,
  Assessment as AnalyticsIcon,
  ExpandMore,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Cached as ResetIcon,
  AutoAwesome as AIIcon,
  Group as FactionIcon,
  LocationCity as LocationIcon,
  Star as ReputationIcon,
  AttachMoney as EconomyIcon,
  Security as StabilityIcon,
} from "@mui/icons-material";
import { TRPGCampaign, BaseLocation } from "@trpg-ai-gm/types";

interface WorldStateChange {
  id: string;
  timestamp: Date;
  eventId: string;
  eventName: string;
  eventType: "quest_completion" | "combat_result" | "social_interaction" | "exploration" | "political_action" | "economic_action" | "natural_disaster" | "magical_event";
  affectedAreas: {
    type: "global" | "regional" | "local";
    locationIds: string[];
    factionIds: string[];
  };
  changes: {
    attribute: string;
    oldValue: number;
    newValue: number;
    changeType: "increase" | "decrease" | "set";
    permanence: "temporary" | "permanent" | "seasonal";
    duration?: number; // 日数（temporaryの場合）
  }[];
  consequences: {
    immediate: string[];
    longTerm: string[];
    cascading: string[];
  };
  playerInfluence: number; // 0-100: プレイヤーアクションの影響度
  aiGenerated: boolean;
  description: string;
  severity: "minor" | "moderate" | "major" | "critical";
}

interface WorldState {
  global: {
    stability: number; // 0-100: 世界の安定度
    economy: number; // 0-100: 経済状況
    magicLevel: number; // 0-100: 魔法の濃度
    politicalTension: number; // 0-100: 政治的緊張
    naturalBalance: number; // 0-100: 自然のバランス
  };
  regions: {
    [regionId: string]: {
      prosperity: number;
      security: number;
      population: number;
      reputation: number;
      influence: number;
    };
  };
  factions: {
    [factionId: string]: {
      power: number;
      relations: { [otherFactionId: string]: number }; // -100 to 100
      resources: number;
      territory: number;
      morale: number;
    };
  };
  locations: {
    [locationId: string]: {
      condition: number; // 0-100: 場所の状態
      accessibility: number; // 0-100: アクセスしやすさ
      dangerLevel: number; // 0-100: 危険度
      resources: number; // 0-100: 利用可能リソース
      population: number; // 0-100: 人口密度
    };
  };
  trends: {
    attribute: string;
    direction: "rising" | "falling" | "stable";
    speed: "slow" | "moderate" | "fast";
    prediction: string;
  }[];
}

interface WorldStateManagerProps {
  campaign?: TRPGCampaign;
  locations: BaseLocation[];
  onStateChange: (newState: WorldState) => void;
  onSuggestion: (suggestion: string, priority: "low" | "medium" | "high") => void;
}

const WorldStateManager: React.FC<WorldStateManagerProps> = ({
  campaign,
  locations,
  onStateChange,
  onSuggestion,
}) => {
  const [worldState, setWorldState] = useState<WorldState>({
    global: {
      stability: 75,
      economy: 60,
      magicLevel: 50,
      politicalTension: 30,
      naturalBalance: 80,
    },
    regions: {},
    factions: {},
    locations: {},
    trends: [],
  });

  const [stateHistory, setStateHistory] = useState<WorldStateChange[]>([]);
  const [selectedChange, setSelectedChange] = useState<WorldStateChange | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoSimulation, setAutoSimulation] = useState(true);
  
  // 世界状態の初期化
  useEffect(() => {
    if (locations.length > 0) {
      initializeWorldState();
    }
  }, [locations]);

  // 世界状態初期化
  const initializeWorldState = () => {
    const newState: WorldState = {
      ...worldState,
      locations: {},
      regions: {},
    };

    // 場所ごとの状態初期化
    locations.forEach(location => {
      newState.locations[location.id] = {
        condition: 75,
        accessibility: 80,
        dangerLevel: location.importance === "主要拠点" ? 60 : 30,
        resources: 70,
        population: location.type === "city" ? 90 : location.type === "town" ? 60 : 20,
      };

      // 地域レベルの集約
      if (!newState.regions[location.region]) {
        newState.regions[location.region] = {
          prosperity: 70,
          security: 75,
          population: 50,
          reputation: 60,
          influence: 50,
        };
      }
    });

    setWorldState(newState);
    onStateChange(newState);
  };

  // イベント結果の適用
  const applyEventResult = (eventResult: {
    eventId: string;
    eventName: string;
    eventType: WorldStateChange["eventType"];
    success: boolean;
    playerActions: string[];
    consequences: string[];
    affectedLocations: string[];
  }) => {
    const change: WorldStateChange = {
      id: `change-${Date.now()}`,
      timestamp: new Date(),
      eventId: eventResult.eventId,
      eventName: eventResult.eventName,
      eventType: eventResult.eventType,
      affectedAreas: {
        type: "local",
        locationIds: eventResult.affectedLocations,
        factionIds: [],
      },
      changes: [],
      consequences: {
        immediate: eventResult.consequences,
        longTerm: [],
        cascading: [],
      },
      playerInfluence: calculatePlayerInfluence(eventResult.playerActions),
      aiGenerated: false,
      description: generateChangeDescription(eventResult),
      severity: determineSeverity(eventResult),
    };

    // 結果に基づく状態変化を計算
    const stateChanges = calculateStateChanges(eventResult);
    change.changes = stateChanges;

    // 長期的な影響を予測
    change.consequences.longTerm = predictLongTermEffects(change);
    change.consequences.cascading = predictCascadingEffects(change);

    // 世界状態を更新
    const newState = applyChangesToWorldState(worldState, change);
    setWorldState(newState);
    setStateHistory(prev => [...prev, change].slice(-50)); // 最新50件を保持
    onStateChange(newState);

    // AI提案を生成
    if (autoSimulation) {
      generateAISuggestions(change, newState);
    }
  };

  // プレイヤー影響度計算
  const calculatePlayerInfluence = (actions: string[]): number => {
    let influence = 0;
    actions.forEach(action => {
      if (action.includes("決定的")) influence += 30;
      else if (action.includes("重要")) influence += 20;
      else if (action.includes("支援")) influence += 15;
      else influence += 10;
    });
    return Math.min(100, influence);
  };

  // 重要度判定
  const determineSeverity = (eventResult: any): WorldStateChange["severity"] => {
    const affectedCount = eventResult.affectedLocations.length;
    const consequenceCount = eventResult.consequences.length;
    
    if (affectedCount >= 3 || consequenceCount >= 5) return "critical";
    if (affectedCount >= 2 || consequenceCount >= 3) return "major";
    if (affectedCount >= 1 || consequenceCount >= 2) return "moderate";
    return "minor";
  };

  // 状態変化の計算
  const calculateStateChanges = (eventResult: any) => {
    const changes: WorldStateChange["changes"] = [];
    
    switch (eventResult.eventType) {
      case "quest_completion":
        if (eventResult.success) {
          changes.push({
            attribute: "global.stability",
            oldValue: worldState.global.stability,
            newValue: Math.min(100, worldState.global.stability + 5),
            changeType: "increase",
            permanence: "permanent",
          });
        }
        break;
        
      case "combat_result":
        changes.push({
          attribute: "global.stability",
          oldValue: worldState.global.stability,
          newValue: eventResult.success ? 
            Math.min(100, worldState.global.stability + 3) :
            Math.max(0, worldState.global.stability - 5),
          changeType: eventResult.success ? "increase" : "decrease",
          permanence: "temporary",
          duration: 7,
        });
        break;
        
      case "economic_action":
        changes.push({
          attribute: "global.economy",
          oldValue: worldState.global.economy,
          newValue: eventResult.success ?
            Math.min(100, worldState.global.economy + 10) :
            Math.max(0, worldState.global.economy - 8),
          changeType: eventResult.success ? "increase" : "decrease",
          permanence: "permanent",
        });
        break;
    }

    return changes;
  };

  // 長期効果の予測
  const predictLongTermEffects = (change: WorldStateChange): string[] => {
    const effects: string[] = [];
    
    change.changes.forEach(ch => {
      if (ch.attribute === "global.stability") {
        if (ch.changeType === "increase") {
          effects.push("治安の改善により貿易が活性化");
          effects.push("新たな入植者の流入");
        } else {
          effects.push("不安定化により税収が減少");
          effects.push("周辺地域への不安の拡散");
        }
      }
      
      if (ch.attribute === "global.economy") {
        if (ch.changeType === "increase") {
          effects.push("経済成長により技術発展が促進");
          effects.push("軍事力強化の機会");
        } else {
          effects.push("失業率上昇による社会不安");
          effects.push("インフラ整備の遅延");
        }
      }
    });

    return effects.slice(0, 3); // 最大3件
  };

  // 連鎖効果の予測
  const predictCascadingEffects = (change: WorldStateChange): string[] => {
    const effects: string[] = [];
    
    if (change.severity === "critical" || change.severity === "major") {
      effects.push("周辺地域への影響波及");
      effects.push("政治的バランスの変化");
      effects.push("新たなクエストやイベントの発生");
    }
    
    if (change.playerInfluence > 70) {
      effects.push("プレイヤーの評判変化");
      effects.push("NPCの態度変化");
    }

    return effects;
  };

  // 変化説明の生成
  const generateChangeDescription = (eventResult: any): string => {
    const location = eventResult.affectedLocations[0];
    const success = eventResult.success ? "成功" : "失敗";
    
    return `${eventResult.eventName}の${success}により、${location}を中心とした地域に影響が発生。${eventResult.consequences.length}件の直接的な変化が確認されている。`;
  };

  // 世界状態への変化適用
  const applyChangesToWorldState = (currentState: WorldState, change: WorldStateChange): WorldState => {
    const newState = { ...currentState };
    
    change.changes.forEach(ch => {
      const [category, attribute] = ch.attribute.split(".");
      
      if (category === "global") {
        (newState.global as any)[attribute] = ch.newValue;
      }
      // 他のカテゴリも必要に応じて実装
    });

    return newState;
  };

  // AI提案生成
  const generateAISuggestions = (change: WorldStateChange, newState: WorldState) => {
    if (change.severity === "critical") {
      onSuggestion(
        `重大な世界状態変化が発生しました。${change.eventName}の影響により長期的な対応が必要になる可能性があります。`,
        "high"
      );
    }
    
    if (newState.global.stability < 30) {
      onSuggestion(
        "世界の安定度が危険なレベルまで低下しています。安定化のためのクエストやイベントを検討してください。",
        "high"
      );
    }
    
    if (newState.global.economy < 20) {
      onSuggestion(
        "経済状況が悪化しています。貿易ルートの確保や経済復興のイベントが必要かもしれません。",
        "medium"
      );
    }
  };

  // 世界状態シミュレーション
  const simulateWorldProgression = () => {
    setIsSimulating(true);
    
    // 自然な世界の変化をシミュレート
    setTimeout(() => {
      const simulatedChange: WorldStateChange = {
        id: `sim-${Date.now()}`,
        timestamp: new Date(),
        eventId: "natural_progression",
        eventName: "自然な世界の変化",
        eventType: "natural_disaster",
        affectedAreas: {
          type: "global",
          locationIds: [],
          factionIds: [],
        },
        changes: [
          {
            attribute: "global.stability",
            oldValue: worldState.global.stability,
            newValue: Math.max(0, worldState.global.stability + (Math.random() - 0.5) * 2),
            changeType: Math.random() > 0.5 ? "increase" : "decrease",
            permanence: "temporary",
            duration: 30,
          },
        ],
        consequences: {
          immediate: ["季節の変化による影響"],
          longTerm: ["長期的な気候パターンの変化"],
          cascading: [],
        },
        playerInfluence: 0,
        aiGenerated: true,
        description: "時間の経過による自然な世界状態の変化",
        severity: "minor",
      };

      const newState = applyChangesToWorldState(worldState, simulatedChange);
      setWorldState(newState);
      setStateHistory(prev => [...prev, simulatedChange]);
      setIsSimulating(false);
    }, 2000);
  };

  // 詳細表示
  const handleViewDetail = (change: WorldStateChange) => {
    setSelectedChange(change);
    setDetailDialog(true);
  };

  // 重要度による色分け
  const getSeverityColor = (severity: WorldStateChange["severity"]) => {
    switch (severity) {
      case "critical": return "error";
      case "major": return "warning";
      case "moderate": return "info";
      case "minor": return "success";
      default: return "default";
    }
  };

  // 状態値の色分け
  const getStateColor = (value: number) => {
    if (value >= 80) return "success";
    if (value >= 60) return "info";
    if (value >= 40) return "warning";
    return "error";
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        世界状態管理システム
      </Typography>

      {/* 現在の世界状態 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <WorldIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            現在の世界状態
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>グローバル指標</Typography>
              {Object.entries(worldState.global).map(([key, value]) => (
                <Box key={key} sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2">
                      {key === "stability" ? "安定度" :
                       key === "economy" ? "経済" :
                       key === "magicLevel" ? "魔法濃度" :
                       key === "politicalTension" ? "政治的緊張" :
                       key === "naturalBalance" ? "自然バランス" : key}
                    </Typography>
                    <Chip 
                      label={`${value}%`} 
                      size="small" 
                      color={getStateColor(value)}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={value}
                    color={getStateColor(value)}
                    sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                  />
                </Box>
              ))}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>地域概況</Typography>
              {Object.entries(worldState.regions).slice(0, 3).map(([regionId, region]) => (
                <Box key={regionId} sx={{ mb: 1, p: 1, border: 1, borderColor: "divider", borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {regionId}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                    <Chip label={`繁栄: ${region.prosperity}%`} size="small" />
                    <Chip label={`治安: ${region.security}%`} size="small" />
                    <Chip label={`評判: ${region.reputation}%`} size="small" />
                  </Box>
                </Box>
              ))}
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            startIcon={<AnalyticsIcon />}
            onClick={() => setAnalyticsDialog(true)}
          >
            詳細分析
          </Button>
          <Button
            startIcon={<AIIcon />}
            onClick={simulateWorldProgression}
            disabled={isSimulating}
          >
            {isSimulating ? "シミュレート中..." : "進行シミュレート"}
          </Button>
        </CardActions>
      </Card>

      {/* 最近の変化履歴 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <HistoryIcon sx={{ verticalAlign: "middle", mr: 1 }} />
          最近の世界状態変化
        </Typography>

        {stateHistory.length > 0 ? (
          <Timeline>
            {stateHistory.slice(-5).reverse().map((change) => (
              <TimelineItem key={change.id}>
                <TimelineOppositeContent sx={{ m: "auto 0" }}>
                  {change.timestamp.toLocaleString()}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={getSeverityColor(change.severity) as any}>
                    <EventIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent sx={{ py: "12px", px: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="h6" component="span">
                        {change.eventName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: "block" }}>
                        {change.description}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Chip label={change.eventType} size="small" />
                        <Chip label={change.severity} size="small" color={getSeverityColor(change.severity)} />
                        {change.aiGenerated && <Chip label="AI生成" size="small" color="secondary" />}
                      </Box>
                    </Box>
                    <IconButton onClick={() => handleViewDetail(change)}>
                      <ViewIcon />
                    </IconButton>
                  </Box>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        ) : (
          <Alert severity="info">
            まだ世界状態の変化が記録されていません。
          </Alert>
        )}
      </Paper>

      {/* 詳細ダイアログ */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        {selectedChange && (
          <>
            <DialogTitle>
              世界状態変化の詳細 - {selectedChange.eventName}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>基本情報</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="イベント種別" secondary={selectedChange.eventType} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="重要度" secondary={selectedChange.severity} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="プレイヤー影響度" secondary={`${selectedChange.playerInfluence}%`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="発生時刻" secondary={selectedChange.timestamp.toLocaleString()} />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>状態変化</Typography>
                  {selectedChange.changes.map((change, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, border: 1, borderColor: "divider", borderRadius: 1 }}>
                      <Typography variant="body2">
                        {change.attribute}: {change.oldValue} → {change.newValue}
                      </Typography>
                      <Chip 
                        label={change.changeType} 
                        size="small" 
                        color={change.changeType === "increase" ? "success" : "error"}
                      />
                      <Chip label={change.permanence} size="small" sx={{ ml: 1 }} />
                    </Box>
                  ))}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>影響と結果</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="subtitle2">即座の影響</Typography>
                          <List dense>
                            {selectedChange.consequences.immediate.map((effect, index) => (
                              <ListItem key={index}>
                                <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary={effect} />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="subtitle2">長期的影響</Typography>
                          <List dense>
                            {selectedChange.consequences.longTerm.map((effect, index) => (
                              <ListItem key={index}>
                                <ListItemIcon><ImpactIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary={effect} />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="subtitle2">連鎖効果</Typography>
                          <List dense>
                            {selectedChange.consequences.cascading.map((effect, index) => (
                              <ListItem key={index}>
                                <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
                                <ListItemText primary={effect} />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialog(false)}>
                閉じる
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 分析ダイアログ */}
      <Dialog open={analyticsDialog} onClose={() => setAnalyticsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>世界状態分析</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>トレンド分析</Typography>
          <Alert severity="info">
            詳細な分析機能は今後実装予定です。現在は基本的な状態表示のみ利用可能です。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialog(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorldStateManager;
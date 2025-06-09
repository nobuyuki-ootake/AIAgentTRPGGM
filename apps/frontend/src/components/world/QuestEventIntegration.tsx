import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Assignment as QuestIcon,
  Event as EventIcon,
  Public as WorldIcon,
  TrendingUp as ImpactIcon,
  AccountTree as ConnectionIcon,
  PlayArrow as TriggerIcon,
  CheckCircle as CompleteIcon,
  Error as FailIcon,
  Pending as PendingIcon,
  ExpandMore,
  Info as InfoIcon,
  Warning as WarningIcon,
  AutoAwesome as AIIcon,
  Timeline as TimelineIcon,
  Map as LocationIcon,
  Group as FactionIcon,
  Star as RewardIcon,
  Build as ActionIcon,
  Psychology as DecisionIcon,
} from "@mui/icons-material";

interface QuestEventConnection {
  id: string;
  questId: string;
  eventId: string;
  connectionType: "prerequisite" | "consequence" | "parallel" | "alternative" | "blocking";
  conditions: {
    questStatus?: "pending" | "active" | "completed" | "failed";
    worldStateRequirements?: { attribute: string; operator: ">" | "<" | "="; value: number }[];
    locationRequirements?: string[];
    timeRequirements?: { minDay?: number; maxDay?: number; timeOfDay?: string };
  };
  effects: {
    onTrigger: WorldStateEffect[];
    onComplete: WorldStateEffect[];
    onFail: WorldStateEffect[];
  };
  priority: number;
  isActive: boolean;
}

interface WorldStateEffect {
  attribute: string;
  changeType: "increase" | "decrease" | "set";
  value: number;
  duration?: number; // 日数（永続の場合は undefined）
  description: string;
}

interface QuestEventIntegrationProps {
  currentWorldState: any;
  availableQuests: any[];
  availableEvents: any[];
  onQuestUpdate: (questId: string, update: any) => void;
  onEventTrigger: (eventId: string, trigger: any) => void;
  onWorldStateChange: (changes: WorldStateEffect[]) => void;
}

const QuestEventIntegration: React.FC<QuestEventIntegrationProps> = ({
  currentWorldState,
  availableQuests,
  availableEvents,
  onQuestUpdate,
  onEventTrigger,
  onWorldStateChange,
}) => {
  const [connections, setConnections] = useState<QuestEventConnection[]>([]);
  const [activeConnections, setActiveConnections] = useState<QuestEventConnection[]>([]);
  const [newConnectionDialog, setNewConnectionDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<QuestEventConnection | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [autoProcessing, setAutoProcessing] = useState(true);
  const [processingQueue, setProcessingQueue] = useState<any[]>([]);

  // 接続の自動検出と処理
  useEffect(() => {
    if (autoProcessing) {
      processConnections();
    }
  }, [currentWorldState, availableQuests, availableEvents, autoProcessing]);

  // 接続の処理
  const processConnections = () => {
    const triggers: any[] = [];
    
    connections.forEach(connection => {
      if (shouldTriggerConnection(connection)) {
        triggers.push({
          connection,
          timestamp: new Date(),
          reason: determineTriggererReason(connection),
        });
      }
    });

    if (triggers.length > 0) {
      setProcessingQueue(triggers);
      processTriggers(triggers);
    }
  };

  // 接続の発火条件チェック
  const shouldTriggerConnection = (connection: QuestEventConnection): boolean => {
    const { conditions } = connection;
    
    // クエスト状態チェック
    if (conditions.questStatus) {
      const quest = availableQuests.find(q => q.id === connection.questId);
      if (!quest || quest.status !== conditions.questStatus) {
        return false;
      }
    }

    // 世界状態チェック
    if (conditions.worldStateRequirements) {
      for (const req of conditions.worldStateRequirements) {
        const [category, attribute] = req.attribute.split('.');
        const currentValue = currentWorldState[category]?.[attribute];
        
        if (currentValue === undefined) continue;
        
        switch (req.operator) {
          case '>':
            if (currentValue <= req.value) return false;
            break;
          case '<':
            if (currentValue >= req.value) return false;
            break;
          case '=':
            if (currentValue !== req.value) return false;
            break;
        }
      }
    }

    // 場所要件チェック
    if (conditions.locationRequirements) {
      // 現在地情報が必要
      // 実装は現在地システムと連携
    }

    // 時間要件チェック
    if (conditions.timeRequirements) {
      // 現在のゲーム内時間との比較
      // 実装はタイムラインシステムと連携
    }

    return true;
  };

  // 発火理由の特定
  const determineTriggererReason = (connection: QuestEventConnection): string => {
    const { conditions } = connection;
    
    if (conditions.questStatus) {
      return `クエスト「${getQuestName(connection.questId)}」が${conditions.questStatus}状態になったため`;
    }
    
    if (conditions.worldStateRequirements?.length) {
      const req = conditions.worldStateRequirements[0];
      return `世界状態「${req.attribute}」が条件を満たしたため`;
    }
    
    return "条件が満たされたため";
  };

  // トリガーの実行
  const processTriggers = (triggers: any[]) => {
    triggers.forEach(trigger => {
      const { connection } = trigger;
      
      // エフェクトの適用
      const effects = connection.effects.onTrigger;
      if (effects.length > 0) {
        onWorldStateChange(effects);
      }

      // イベントの発火
      if (connection.eventId) {
        onEventTrigger(connection.eventId, {
          triggeredBy: connection.questId,
          reason: trigger.reason,
          worldStateSnapshot: currentWorldState,
        });
      }

      // 接続をアクティブ状態に
      setActiveConnections(prev => [...prev, connection]);
    });
  };

  // 新しい接続の作成
  const createConnection = (connectionData: Partial<QuestEventConnection>) => {
    const newConnection: QuestEventConnection = {
      id: `connection-${Date.now()}`,
      questId: "",
      eventId: "",
      connectionType: "consequence",
      conditions: {},
      effects: {
        onTrigger: [],
        onComplete: [],
        onFail: [],
      },
      priority: 1,
      isActive: true,
      ...connectionData,
    };

    setConnections(prev => [...prev, newConnection]);
  };

  // 事前定義された接続パターンの生成
  const generateCommonConnections = () => {
    const commonPatterns = [
      // クエスト完了 → 世界状態改善
      {
        questId: "example-quest-1",
        eventId: "stability-increase",
        connectionType: "consequence" as const,
        conditions: { questStatus: "completed" as const },
        effects: {
          onTrigger: [
            {
              attribute: "global.stability",
              changeType: "increase" as const,
              value: 10,
              description: "クエスト完了により地域の安定が向上",
            },
          ],
          onComplete: [],
          onFail: [],
        },
      },
      // 世界状態悪化 → 緊急クエスト発生
      {
        questId: "emergency-quest",
        eventId: "crisis-event",
        connectionType: "prerequisite" as const,
        conditions: {
          worldStateRequirements: [
            { attribute: "global.stability", operator: "<" as const, value: 30 },
          ],
        },
        effects: {
          onTrigger: [
            {
              attribute: "global.politicalTension",
              changeType: "increase" as const,
              value: 20,
              description: "危機的状況により政治的緊張が高まる",
            },
          ],
          onComplete: [],
          onFail: [],
        },
      },
    ];

    commonPatterns.forEach(pattern => createConnection(pattern));
  };

  // ヘルパー関数
  const getQuestName = (questId: string): string => {
    const quest = availableQuests.find(q => q.id === questId);
    return quest?.name || "不明なクエスト";
  };

  const getEventName = (eventId: string): string => {
    const event = availableEvents.find(e => e.id === eventId);
    return event?.name || "不明なイベント";
  };

  const getConnectionTypeLabel = (type: QuestEventConnection["connectionType"]): string => {
    switch (type) {
      case "prerequisite": return "前提条件";
      case "consequence": return "結果";
      case "parallel": return "並行";
      case "alternative": return "代替";
      case "blocking": return "阻害";
      default: return type;
    }
  };

  const getConnectionTypeColor = (type: QuestEventConnection["connectionType"]) => {
    switch (type) {
      case "prerequisite": return "warning";
      case "consequence": return "success";
      case "parallel": return "info";
      case "alternative": return "secondary";
      case "blocking": return "error";
      default: return "default";
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        クエスト・イベント統合システム
      </Typography>

      {/* コントロールパネル */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">
              <ConnectionIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              統合管理
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoProcessing}
                    onChange={(e) => setAutoProcessing(e.target.checked)}
                  />
                }
                label="自動処理"
              />
              <Button
                variant="outlined"
                onClick={generateCommonConnections}
                startIcon={<AIIcon />}
              >
                一般的な接続を生成
              </Button>
              <Button
                variant="contained"
                onClick={() => setNewConnectionDialog(true)}
                startIcon={<ConnectionIcon />}
              >
                新しい接続
              </Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center" }}>
                    <QuestIcon sx={{ mr: 1 }} />
                    アクティブクエスト
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {availableQuests.filter(q => q.status === "active").length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center" }}>
                    <EventIcon sx={{ mr: 1 }} />
                    待機イベント
                  </Typography>
                  <Typography variant="h4" color="secondary">
                    {availableEvents.filter(e => e.status === "pending").length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ display: "flex", alignItems: "center" }}>
                    <ConnectionIcon sx={{ mr: 1 }} />
                    アクティブ接続
                  </Typography>
                  <Typography variant="h4" color="success">
                    {activeConnections.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 接続一覧 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          設定済み接続
        </Typography>

        {connections.length > 0 ? (
          <Grid container spacing={2}>
            {connections.map((connection) => (
              <Grid size={{ xs: 12, md: 6 }} key={connection.id}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                      <Chip
                        label={getConnectionTypeLabel(connection.connectionType)}
                        color={getConnectionTypeColor(connection.connectionType)}
                        size="small"
                      />
                      <Chip
                        label={connection.isActive ? "有効" : "無効"}
                        color={connection.isActive ? "success" : "default"}
                        size="small"
                      />
                    </Box>

                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      {getQuestName(connection.questId)} → {getEventName(connection.eventId)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {connection.effects.onTrigger.length}個の効果が設定済み
                    </Typography>

                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {connection.conditions.questStatus && (
                        <Chip label={`クエスト: ${connection.conditions.questStatus}`} size="small" />
                      )}
                      {connection.conditions.worldStateRequirements?.length && (
                        <Chip label={`世界状態: ${connection.conditions.worldStateRequirements.length}条件`} size="small" />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedConnection(connection);
                        setDetailDialog(true);
                      }}
                    >
                      詳細
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        if (shouldTriggerConnection(connection)) {
                          processTriggers([{ connection, timestamp: new Date(), reason: "手動実行" }]);
                        }
                      }}
                      disabled={!shouldTriggerConnection(connection)}
                    >
                      実行
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            まだ接続が設定されていません。「一般的な接続を生成」または「新しい接続」で設定を開始してください。
          </Alert>
        )}
      </Paper>

      {/* 最近の処理履歴 */}
      {processingQueue.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            最近の処理履歴
          </Typography>
          <List>
            {processingQueue.slice(-5).reverse().map((process, index) => (
              <ListItem key={index} sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  <TriggerIcon />
                </ListItemIcon>
                <ListItemText
                  primary={`${getQuestName(process.connection.questId)} → ${getEventName(process.connection.eventId)}`}
                  secondary={`${process.timestamp.toLocaleString()} - ${process.reason}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* 詳細ダイアログ */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        {selectedConnection && (
          <>
            <DialogTitle>
              接続詳細: {getQuestName(selectedConnection.questId)} → {getEventName(selectedConnection.eventId)}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>基本情報</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="接続タイプ" secondary={getConnectionTypeLabel(selectedConnection.connectionType)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="優先度" secondary={selectedConnection.priority} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="状態" secondary={selectedConnection.isActive ? "有効" : "無効"} />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>発火条件</Typography>
                  {selectedConnection.conditions.questStatus && (
                    <Chip label={`クエスト状態: ${selectedConnection.conditions.questStatus}`} sx={{ mb: 0.5, mr: 0.5 }} />
                  )}
                  {selectedConnection.conditions.worldStateRequirements?.map((req, index) => (
                    <Chip 
                      key={index}
                      label={`${req.attribute} ${req.operator} ${req.value}`} 
                      sx={{ mb: 0.5, mr: 0.5 }} 
                    />
                  ))}
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>効果一覧</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="subtitle2">発火時効果</Typography>
                          <List dense>
                            {selectedConnection.effects.onTrigger.map((effect, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={`${effect.attribute}: ${effect.changeType} ${effect.value}`}
                                  secondary={effect.description}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="subtitle2">完了時効果</Typography>
                          <List dense>
                            {selectedConnection.effects.onComplete.map((effect, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={`${effect.attribute}: ${effect.changeType} ${effect.value}`}
                                  secondary={effect.description}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="subtitle2">失敗時効果</Typography>
                          <List dense>
                            {selectedConnection.effects.onFail.map((effect, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={`${effect.attribute}: ${effect.changeType} ${effect.value}`}
                                  secondary={effect.description}
                                />
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

      {/* 新規接続作成ダイアログ */}
      <Dialog open={newConnectionDialog} onClose={() => setNewConnectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新しい接続を作成</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            接続作成機能は今後実装予定です。現在は事前定義された一般的な接続のみ利用可能です。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConnectionDialog(false)}>
            キャンセル
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestEventIntegration;
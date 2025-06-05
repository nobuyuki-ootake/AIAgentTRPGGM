import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tabs,
  Tab,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  GamesOutlined as CombatIcon,
  Shield as DefenseIcon,
  LocalHospital as HealIcon,
  AutoAwesome as MagicIcon,
  Casino as DiceIcon,
  Timeline as TimelineIcon,
  Person as CharacterIcon,
  ExpandMore,
  Download as ExportIcon,
  Visibility as ViewIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { TRPGCharacter } from "@trpg-ai-gm/types";

interface CombatAction {
  id: string;
  timestamp: Date;
  round: number;
  initiative: number;
  actorId: string;
  actorName: string;
  actorType: "player" | "npc" | "enemy" | "environmental";
  actionType: "attack" | "defend" | "heal" | "spell" | "move" | "item" | "other";
  targetId?: string;
  targetName?: string;
  description: string;
  diceRoll?: {
    notation: string;
    result: number;
    breakdown: string;
  };
  damage?: {
    amount: number;
    type: string;
    absorbed: number;
  };
  healing?: {
    amount: number;
    type: string;
  };
  effects?: {
    name: string;
    duration: number;
    description: string;
  }[];
  critical?: boolean;
  fumble?: boolean;
  result: "success" | "failure" | "critical_success" | "critical_failure";
}

interface CombatSession {
  id: string;
  name: string;
  location: string;
  participants: TRPGCharacter[];
  startTime: Date;
  endTime?: Date;
  totalRounds: number;
  status: "active" | "paused" | "completed";
  actions: CombatAction[];
  summary?: {
    totalDamageDealt: number;
    totalHealingDone: number;
    mvpCharacterId: string;
    criticalHits: number;
    criticalFailures: number;
  };
}

interface CombatLoggerProps {
  currentSession?: CombatSession;
  characters: TRPGCharacter[];
  onNewSession: (session: CombatSession) => void;
  onEndSession: (sessionId: string, summary: any) => void;
  onLogAction: (action: CombatAction) => void;
  onExportLog: (sessionId: string, format: "json" | "pdf" | "csv") => void;
}

const CombatLogger: React.FC<CombatLoggerProps> = ({
  currentSession,
  characters,
  onNewSession,
  onEndSession,
  onLogAction,
  onExportLog,
}) => {
  const [sessions, setSessions] = useState<CombatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CombatSession | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);
  
  // 新規戦闘セッション作成
  const handleNewSession = () => {
    if (!characters.length) {
      alert("参加キャラクターが必要です");
      return;
    }

    const newSession: CombatSession = {
      id: `combat-${Date.now()}`,
      name: `戦闘セッション ${new Date().toLocaleDateString()}`,
      location: "未設定",
      participants: characters,
      startTime: new Date(),
      totalRounds: 0,
      status: "active",
      actions: [],
    };

    setSessions(prev => [...prev, newSession]);
    onNewSession(newSession);
  };

  // セッション終了
  const handleEndSession = (session: CombatSession) => {
    const summary = generateSessionSummary(session);
    const endedSession = {
      ...session,
      endTime: new Date(),
      status: "completed" as const,
      summary,
    };

    setSessions(prev => prev.map(s => s.id === session.id ? endedSession : s));
    onEndSession(session.id, summary);
  };

  // セッションサマリー生成
  const generateSessionSummary = (session: CombatSession) => {
    const actions = session.actions;
    const totalDamageDealt = actions
      .filter(a => a.damage)
      .reduce((sum, a) => sum + (a.damage?.amount || 0), 0);
    
    const totalHealingDone = actions
      .filter(a => a.healing)
      .reduce((sum, a) => sum + (a.healing?.amount || 0), 0);
    
    const criticalHits = actions.filter(a => a.critical).length;
    const criticalFailures = actions.filter(a => a.fumble).length;
    
    // MVP判定（ダメージ + ヒール + クリティカル）
    const participantScores = session.participants.map(p => {
      const participantActions = actions.filter(a => a.actorId === p.id);
      const damage = participantActions.reduce((sum, a) => sum + (a.damage?.amount || 0), 0);
      const healing = participantActions.reduce((sum, a) => sum + (a.healing?.amount || 0), 0);
      const crits = participantActions.filter(a => a.critical).length;
      
      return {
        characterId: p.id,
        score: damage + healing + (crits * 10),
      };
    });
    
    const mvp = participantScores.sort((a, b) => b.score - a.score)[0];

    return {
      totalDamageDealt,
      totalHealingDone,
      mvpCharacterId: mvp?.characterId || "",
      criticalHits,
      criticalFailures,
    };
  };

  // アクション記録
  const handleLogAction = (actionData: Partial<CombatAction>) => {
    if (!currentSession) return;

    const action: CombatAction = {
      id: `action-${Date.now()}`,
      timestamp: new Date(),
      round: currentSession.totalRounds + 1,
      initiative: 0,
      actorId: "",
      actorName: "",
      actorType: "player",
      actionType: "attack",
      description: "",
      result: "success",
      ...actionData,
    } as CombatAction;

    onLogAction(action);
  };

  // フィルター済みアクション
  const getFilteredActions = (session: CombatSession) => {
    let filtered = session.actions;
    
    if (filterType !== "all") {
      filtered = filtered.filter(a => a.actionType === filterType);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.actorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // アクションタイプの色
  const getActionTypeColor = (type: string) => {
    switch (type) {
      case "attack": return "error";
      case "defend": return "primary";
      case "heal": return "success";
      case "spell": return "secondary";
      case "move": return "info";
      case "item": return "warning";
      default: return "default";
    }
  };

  // アクションアイコン
  const getActionIcon = (type: string) => {
    switch (type) {
      case "attack": return <CombatIcon />;
      case "defend": return <DefenseIcon />;
      case "heal": return <HealIcon />;
      case "spell": return <MagicIcon />;
      case "move": return <TimelineIcon />;
      case "item": return <DiceIcon />;
      default: return <CharacterIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        戦闘ログシステム
      </Typography>

      <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 2 }}>
        <Tab label="アクティブセッション" />
        <Tab label="セッション履歴" />
        <Tab label="統計・分析" />
      </Tabs>

      {/* アクティブセッションタブ */}
      {tabValue === 0 && (
        <Box>
          {!currentSession ? (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  新しい戦闘セッションを開始
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  参加キャラクター: {characters.length}人
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleNewSession}
                  startIcon={<CombatIcon />}
                  disabled={characters.length === 0}
                >
                  戦闘開始
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {/* セッション情報 */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {currentSession.name}
                    </Typography>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary="場所" 
                          secondary={currentSession.location} 
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary="ラウンド数" 
                          secondary={currentSession.totalRounds} 
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary="参加者数" 
                          secondary={`${currentSession.participants.length}人`} 
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText 
                          primary="アクション数" 
                          secondary={currentSession.actions.length} 
                        />
                      </ListItem>
                    </List>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleEndSession(currentSession)}
                      fullWidth
                    >
                      戦闘終了
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* アクションログ */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6">アクションログ</Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>フィルター</InputLabel>
                        <Select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                        >
                          <MenuItem value="all">すべて</MenuItem>
                          <MenuItem value="attack">攻撃</MenuItem>
                          <MenuItem value="defend">防御</MenuItem>
                          <MenuItem value="heal">回復</MenuItem>
                          <MenuItem value="spell">呪文</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        placeholder="検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                        }}
                      />
                    </Box>
                  </Box>

                  <List sx={{ maxHeight: 400, overflow: "auto" }}>
                    {getFilteredActions(currentSession).map((action) => (
                      <ListItem
                        key={action.id}
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                          mb: 1,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSelectedAction(action);
                          setDetailDialog(true);
                        }}
                      >
                        <ListItemIcon>
                          {getActionIcon(action.actionType)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="body1">
                                {action.actorName} - {action.description}
                              </Typography>
                              <Chip
                                label={action.actionType}
                                size="small"
                                color={getActionTypeColor(action.actionType)}
                              />
                              {action.critical && (
                                <Chip label="クリティカル!" size="small" color="success" />
                              )}
                              {action.fumble && (
                                <Chip label="ファンブル" size="small" color="error" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption">
                                R{action.round} - {action.timestamp.toLocaleTimeString()}
                              </Typography>
                              {action.diceRoll && (
                                <Typography variant="caption" sx={{ ml: 2 }}>
                                  🎲 {action.diceRoll.notation} = {action.diceRoll.result}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>

                  {currentSession.actions.length === 0 && (
                    <Alert severity="info">
                      まだアクションが記録されていません。戦闘を開始してログを記録しましょう。
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      {/* セッション履歴タブ */}
      {tabValue === 1 && (
        <Box>
          <Grid container spacing={2}>
            {sessions.filter(s => s.status === "completed").map((session) => (
              <Grid item xs={12} md={6} key={session.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {session.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {session.startTime.toLocaleDateString()} - {session.location}
                    </Typography>
                    
                    <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                      <Chip label={`${session.totalRounds}ラウンド`} size="small" />
                      <Chip label={`${session.actions.length}アクション`} size="small" />
                      {session.summary && (
                        <Chip 
                          label={`${session.summary.totalDamageDealt}ダメージ`} 
                          size="small" 
                          color="error" 
                        />
                      )}
                    </Box>

                    {session.summary && (
                      <Typography variant="body2">
                        MVP: {session.participants.find(p => p.id === session.summary?.mvpCharacterId)?.name || "不明"}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      onClick={() => setSelectedSession(session)}
                    >
                      詳細表示
                    </Button>
                    <Button 
                      size="small" 
                      onClick={() => onExportLog(session.id, "json")}
                    >
                      エクスポート
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {sessions.filter(s => s.status === "completed").length === 0 && (
            <Alert severity="info">
              完了した戦闘セッションがありません。
            </Alert>
          )}
        </Box>
      )}

      {/* 統計・分析タブ */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            戦闘統計
          </Typography>
          
          {sessions.length > 0 ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      <AnalyticsIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                      全体統計
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="総セッション数" 
                          secondary={sessions.length} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="総ラウンド数" 
                          secondary={sessions.reduce((sum, s) => sum + s.totalRounds, 0)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="総アクション数" 
                          secondary={sessions.reduce((sum, s) => sum + s.actions.length, 0)} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              統計を表示するにはセッションを実行してください。
            </Alert>
          )}
        </Box>
      )}

      {/* アクション詳細ダイアログ */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        {selectedAction && (
          <>
            <DialogTitle>
              アクション詳細 - {selectedAction.actorName}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>基本情報</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="アクション種別" secondary={selectedAction.actionType} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="ラウンド" secondary={selectedAction.round} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="時刻" secondary={selectedAction.timestamp.toLocaleString()} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="結果" secondary={selectedAction.result} />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {selectedAction.diceRoll && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>ダイスロール</Typography>
                      <Typography variant="body2">
                        {selectedAction.diceRoll.notation} = {selectedAction.diceRoll.result}
                      </Typography>
                      {selectedAction.diceRoll.breakdown && (
                        <Typography variant="caption" color="text.secondary">
                          {selectedAction.diceRoll.breakdown}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {selectedAction.damage && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>ダメージ</Typography>
                      <Typography variant="body2">
                        {selectedAction.damage.amount} ({selectedAction.damage.type})
                      </Typography>
                    </Box>
                  )}

                  {selectedAction.healing && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>回復</Typography>
                      <Typography variant="body2">
                        {selectedAction.healing.amount} HP
                      </Typography>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>説明</Typography>
                  <Typography variant="body2">
                    {selectedAction.description}
                  </Typography>
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
    </Box>
  );
};

export default CombatLogger;
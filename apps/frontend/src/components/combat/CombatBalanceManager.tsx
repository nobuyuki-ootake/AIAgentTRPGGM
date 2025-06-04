import React, { useState, useEffect, useCallback } from "react";
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
  LinearProgress,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Tooltip,
  IconButton,
  Badge,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Balance as BalanceIcon,
  TrendingUp as IncreaseIcon,
  TrendingDown as DecreaseIcon,
  Assessment as AnalysisIcon,
  AutoAwesome as AIIcon,
  Settings as SettingsIcon,
  ExpandMore,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Speed as QuickIcon,
  Timer as TimerIcon,
  Security as DefenseIcon,
  LocalFireDepartment as AttackIcon,
  Healing as HealIcon,
  Psychology as StrategyIcon,
  Group as TeamIcon,
  Person as IndividualIcon,
  Refresh as RefreshIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Save as SaveIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { TRPGCharacter } from "@trpg-ai-gm/types";

interface CombatMetrics {
  roundNumber: number;
  partyHPPercentage: number;
  enemyHPPercentage: number;
  averagePartyDamagePerRound: number;
  averageEnemyDamagePerRound: number;
  partyHitRate: number;
  enemyHitRate: number;
  partyHealingPerRound: number;
  actionEconomy: {
    partyActions: number;
    enemyActions: number;
  };
  resourceUsage: {
    spellSlots: number;
    consumables: number;
  };
  tacticalAdvantage: number; // -100 to 100: 負数は敵有利、正数はパーティ有利
}

interface BalanceAdjustment {
  id: string;
  timestamp: Date;
  trigger: "automatic" | "manual" | "emergency";
  reason: string;
  adjustments: {
    enemyHP: number; // 修正値
    enemyAC: number;
    enemyAttack: number;
    enemyDamage: number;
    enemyInitiative: number;
    enemyCount: number;
    environmentalFactors: number;
  };
  expectedImpact: "minor" | "moderate" | "major";
  actualImpact?: "positive" | "negative" | "neutral";
  playerFeedback?: "satisfied" | "too_easy" | "too_hard" | "just_right";
}

interface CombatDifficulty {
  overall: number; // 1-10
  categories: {
    damage: number;
    survivability: number;
    tactics: number;
    resources: number;
    time: number;
  };
  trend: "increasing" | "decreasing" | "stable";
  prediction: string;
}

interface CombatBalanceManagerProps {
  characters: TRPGCharacter[];
  currentCombat?: any;
  metrics?: CombatMetrics;
  onAdjustmentApplied: (adjustment: BalanceAdjustment) => void;
  onDifficultyChanged: (difficulty: CombatDifficulty) => void;
}

const CombatBalanceManager: React.FC<CombatBalanceManagerProps> = ({
  characters,
  currentCombat,
  metrics,
  onAdjustmentApplied,
  onDifficultyChanged,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<CombatDifficulty>({
    overall: 5,
    categories: {
      damage: 5,
      survivability: 5,
      tactics: 5,
      resources: 5,
      time: 5,
    },
    trend: "stable",
    prediction: "バランスが保たれています",
  });
  
  const [adjustmentHistory, setAdjustmentHistory] = useState<BalanceAdjustment[]>([]);
  const [autoBalance, setAutoBalance] = useState(true);
  const [balanceSettings, setBalanceSettings] = useState({
    sensitivity: 0.7, // 0-1: 調整の感度
    aggressiveness: 0.5, // 0-1: 調整の積極性
    playerFeedbackWeight: 0.8, // 0-1: プレイヤーフィードバックの重み
    emergencyThreshold: 0.3, // 0-1: 緊急調整の閾値
    targetDifficulty: 5, // 1-10: 目標難易度
  });
  
  const [analysisDialog, setAnalysisDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [historyCombats, setHistoryCombats] = useState<any[]>([]);
  const [combatInProgress, setCombatInProgress] = useState(false);

  // 定期的なバランス分析
  useEffect(() => {
    if (combatInProgress && metrics) {
      analyzeBalance();
    }
  }, [metrics, combatInProgress]);

  // バランス分析の実行
  const analyzeBalance = useCallback(async () => {
    if (!metrics) return;

    setIsAnalyzing(true);
    
    try {
      const difficulty = calculateDifficulty(metrics);
      setCurrentDifficulty(difficulty);
      onDifficultyChanged(difficulty);

      // 自動調整が有効な場合
      if (autoBalance) {
        const needsAdjustment = assessNeedForAdjustment(difficulty, metrics);
        if (needsAdjustment.required) {
          await applyAutoAdjustment(needsAdjustment);
        }
      }

    } catch (error) {
      console.error("バランス分析エラー:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [metrics, autoBalance, balanceSettings]);

  // 難易度計算
  const calculateDifficulty = (metrics: CombatMetrics): CombatDifficulty => {
    const damage = calculateDamageDifficulty(metrics);
    const survivability = calculateSurvivabilityDifficulty(metrics);
    const tactics = calculateTacticalDifficulty(metrics);
    const resources = calculateResourceDifficulty(metrics);
    const time = calculateTimeDifficulty(metrics);

    const overall = (damage + survivability + tactics + resources + time) / 5;
    const trend = determineTrend(overall);
    const prediction = generatePrediction(overall, trend);

    return {
      overall,
      categories: { damage, survivability, tactics, resources, time },
      trend,
      prediction,
    };
  };

  const calculateDamageDifficulty = (metrics: CombatMetrics): number => {
    const damageRatio = metrics.averageEnemyDamagePerRound / Math.max(1, metrics.averagePartyDamagePerRound);
    
    if (damageRatio > 2) return 9; // 敵のダメージが圧倒的
    if (damageRatio > 1.5) return 7; // 敵優勢
    if (damageRatio > 1.2) return 6; // やや敵優勢
    if (damageRatio > 0.8) return 5; // バランス
    if (damageRatio > 0.5) return 4; // やや味方優勢
    if (damageRatio > 0.3) return 3; // 味方優勢
    return 2; // 味方圧勝
  };

  const calculateSurvivabilityDifficulty = (metrics: CombatMetrics): number => {
    const hpRatio = metrics.partyHPPercentage / Math.max(1, metrics.enemyHPPercentage);
    
    if (metrics.partyHPPercentage < 20) return 9; // パーティ危険
    if (metrics.partyHPPercentage < 40) return 7; // パーティ苦戦
    if (metrics.partyHPPercentage < 60) return 6; // やや苦戦
    if (hpRatio > 0.8 && hpRatio < 1.2) return 5; // バランス
    if (metrics.partyHPPercentage > 80) return 3; // パーティ優勢
    return 4;
  };

  const calculateTacticalDifficulty = (metrics: CombatMetrics): number => {
    const hitRateDiff = metrics.enemyHitRate - metrics.partyHitRate;
    const actionEconomyRatio = metrics.actionEconomy.enemyActions / Math.max(1, metrics.actionEconomy.partyActions);
    
    let tacticalScore = 5;
    
    if (hitRateDiff > 0.3) tacticalScore += 2; // 敵の命中率が高い
    if (hitRateDiff < -0.3) tacticalScore -= 2; // パーティの命中率が高い
    
    if (actionEconomyRatio > 1.5) tacticalScore += 1; // 敵のアクション数が多い
    if (actionEconomyRatio < 0.7) tacticalScore -= 1; // パーティのアクション数が多い
    
    return Math.max(1, Math.min(10, tacticalScore));
  };

  const calculateResourceDifficulty = (metrics: CombatMetrics): number => {
    const resourceUsageRate = (metrics.resourceUsage.spellSlots + metrics.resourceUsage.consumables) / metrics.roundNumber;
    
    if (resourceUsageRate > 3) return 8; // リソース枯渇の危険
    if (resourceUsageRate > 2) return 6; // リソース消耗が激しい
    if (resourceUsageRate > 1) return 5; // 適度なリソース使用
    if (resourceUsageRate > 0.5) return 4; // 控えめなリソース使用
    return 3; // ほとんどリソースを使わない
  };

  const calculateTimeDifficulty = (metrics: CombatMetrics): number => {
    if (metrics.roundNumber > 15) return 7; // 長期戦
    if (metrics.roundNumber > 10) return 6; // やや長い
    if (metrics.roundNumber > 5) return 5; // 適度
    if (metrics.roundNumber > 3) return 4; // 短め
    return 3; // 非常に短い
  };

  const determineTrend = (currentOverall: number): CombatDifficulty["trend"] => {
    const recentAdjustments = adjustmentHistory.slice(-3);
    if (recentAdjustments.length < 2) return "stable";
    
    const trends = recentAdjustments.map(adj => {
      if (adj.adjustments.enemyHP > 0 || adj.adjustments.enemyDamage > 0) return 1;
      if (adj.adjustments.enemyHP < 0 || adj.adjustments.enemyDamage < 0) return -1;
      return 0;
    });
    
    const averageTrend = trends.reduce((sum, t) => sum + t, 0) / trends.length;
    
    if (averageTrend > 0.3) return "increasing";
    if (averageTrend < -0.3) return "decreasing";
    return "stable";
  };

  const generatePrediction = (overall: number, trend: CombatDifficulty["trend"]): string => {
    if (overall > 8) return "非常に困難な戦闘が予想されます";
    if (overall > 6) return "挑戦的な戦闘になるでしょう";
    if (overall > 4) return "バランスの取れた戦闘です";
    if (overall > 2) return "比較的簡単な戦闘になりそうです";
    return "非常に簡単な戦闘です";
  };

  // 調整必要性の評価
  const assessNeedForAdjustment = (difficulty: CombatDifficulty, metrics: CombatMetrics) => {
    const targetDiff = balanceSettings.targetDifficulty;
    const currentDiff = difficulty.overall;
    const deviation = Math.abs(currentDiff - targetDiff);

    const required = deviation > (balanceSettings.sensitivity * 2);
    const emergency = deviation > (balanceSettings.emergencyThreshold * 10);
    
    let reason = "";
    if (currentDiff > targetDiff + 2) {
      reason = "戦闘が難しすぎます";
    } else if (currentDiff < targetDiff - 2) {
      reason = "戦闘が簡単すぎます";
    } else if (metrics.partyHPPercentage < 20) {
      reason = "パーティのHPが危険なレベルです";
    } else if (metrics.roundNumber > 15) {
      reason = "戦闘が長期化しています";
    }

    return {
      required,
      emergency,
      reason,
      deviation,
      suggestedAdjustments: calculateSuggestedAdjustments(difficulty, metrics),
    };
  };

  // 推奨調整の計算
  const calculateSuggestedAdjustments = (difficulty: CombatDifficulty, metrics: CombatMetrics) => {
    const adjustments = {
      enemyHP: 0,
      enemyAC: 0,
      enemyAttack: 0,
      enemyDamage: 0,
      enemyInitiative: 0,
      enemyCount: 0,
      environmentalFactors: 0,
    };

    const targetDiff = balanceSettings.targetDifficulty;
    const currentDiff = difficulty.overall;
    const adjustmentMagnitude = (currentDiff - targetDiff) * balanceSettings.aggressiveness;

    if (currentDiff > targetDiff) {
      // 難易度を下げる
      adjustments.enemyHP = Math.floor(adjustmentMagnitude * -10); // HP減少
      adjustments.enemyDamage = Math.floor(adjustmentMagnitude * -5); // ダメージ減少
      adjustments.enemyAC = Math.floor(adjustmentMagnitude * -2); // AC減少
    } else if (currentDiff < targetDiff) {
      // 難易度を上げる
      adjustments.enemyHP = Math.floor(Math.abs(adjustmentMagnitude) * 10); // HP増加
      adjustments.enemyDamage = Math.floor(Math.abs(adjustmentMagnitude) * 5); // ダメージ増加
      adjustments.enemyAC = Math.floor(Math.abs(adjustmentMagnitude) * 2); // AC増加
    }

    return adjustments;
  };

  // 自動調整の適用
  const applyAutoAdjustment = async (needsAdjustment: any) => {
    const adjustment: BalanceAdjustment = {
      id: `auto-${Date.now()}`,
      timestamp: new Date(),
      trigger: needsAdjustment.emergency ? "emergency" : "automatic",
      reason: needsAdjustment.reason,
      adjustments: needsAdjustment.suggestedAdjustments,
      expectedImpact: needsAdjustment.deviation > 3 ? "major" : needsAdjustment.deviation > 1.5 ? "moderate" : "minor",
    };

    setAdjustmentHistory(prev => [...prev, adjustment].slice(-20));
    onAdjustmentApplied(adjustment);
  };

  // 手動調整
  const applyManualAdjustment = (customAdjustments: any, reason: string) => {
    const adjustment: BalanceAdjustment = {
      id: `manual-${Date.now()}`,
      timestamp: new Date(),
      trigger: "manual",
      reason,
      adjustments: customAdjustments,
      expectedImpact: "moderate",
    };

    setAdjustmentHistory(prev => [...prev, adjustment]);
    onAdjustmentApplied(adjustment);
  };

  // 戦闘開始/終了
  const startCombatMonitoring = () => {
    setCombatInProgress(true);
  };

  const endCombatMonitoring = () => {
    setCombatInProgress(false);
    if (currentCombat) {
      setHistoryCombats(prev => [currentCombat, ...prev].slice(0, 10));
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        戦闘バランス自動調整システム
      </Typography>

      {/* 制御パネル */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">
              <BalanceIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              バランス制御
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoBalance}
                    onChange={(e) => setAutoBalance(e.target.checked)}
                  />
                }
                label="自動調整"
              />
              <IconButton onClick={() => setSettingsDialog(true)}>
                <SettingsIcon />
              </IconButton>
              <IconButton onClick={() => setAnalysisDialog(true)}>
                <AnalysisIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                現在の難易度: {currentDifficulty.overall.toFixed(1)}/10
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(currentDifficulty.overall / 10) * 100}
                color={
                  currentDifficulty.overall > 7 ? "error" :
                  currentDifficulty.overall > 5 ? "warning" :
                  currentDifficulty.overall > 3 ? "success" : "info"
                }
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  label={`傾向: ${currentDifficulty.trend === "increasing" ? "上昇" : 
                                currentDifficulty.trend === "decreasing" ? "下降" : "安定"}`}
                  size="small"
                  color={
                    currentDifficulty.trend === "increasing" ? "error" :
                    currentDifficulty.trend === "decreasing" ? "success" : "default"
                  }
                />
                <Chip
                  label={`分析中: ${isAnalyzing ? "はい" : "いいえ"}`}
                  size="small"
                  color={isAnalyzing ? "warning" : "default"}
                />
                <Chip
                  label={`調整数: ${adjustmentHistory.length}`}
                  size="small"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>カテゴリ別難易度</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`ダメージ: ${currentDifficulty.categories.damage.toFixed(1)}`} size="small" />
                <Chip label={`生存: ${currentDifficulty.categories.survivability.toFixed(1)}`} size="small" />
                <Chip label={`戦術: ${currentDifficulty.categories.tactics.toFixed(1)}`} size="small" />
                <Chip label={`リソース: ${currentDifficulty.categories.resources.toFixed(1)}`} size="small" />
                <Chip label={`時間: ${currentDifficulty.categories.time.toFixed(1)}`} size="small" />
              </Box>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            予測: {currentDifficulty.prediction}
          </Typography>
        </CardContent>
        <CardActions>
          {!combatInProgress ? (
            <Button
              variant="contained"
              onClick={startCombatMonitoring}
              startIcon={<StartIcon />}
            >
              戦闘監視開始
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="error"
              onClick={endCombatMonitoring}
              startIcon={<StopIcon />}
            >
              戦闘監視終了
            </Button>
          )}
          <Button
            onClick={() => analyzeBalance()}
            disabled={isAnalyzing}
            startIcon={<RefreshIcon />}
          >
            手動分析
          </Button>
        </CardActions>
      </Card>

      {/* 最近の調整履歴 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          <HistoryIcon sx={{ verticalAlign: "middle", mr: 1 }} />
          最近の調整履歴
        </Typography>

        {adjustmentHistory.length > 0 ? (
          <List>
            {adjustmentHistory.slice(-5).reverse().map((adjustment) => (
              <ListItem key={adjustment.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  {adjustment.trigger === "emergency" ? <WarningIcon color="error" /> :
                   adjustment.trigger === "automatic" ? <AIIcon color="primary" /> :
                   <SettingsIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body1">
                        {adjustment.reason}
                      </Typography>
                      <Chip
                        label={adjustment.trigger}
                        size="small"
                        color={
                          adjustment.trigger === "emergency" ? "error" :
                          adjustment.trigger === "automatic" ? "primary" : "default"
                        }
                      />
                      <Chip
                        label={adjustment.expectedImpact}
                        size="small"
                        color={
                          adjustment.expectedImpact === "major" ? "error" :
                          adjustment.expectedImpact === "moderate" ? "warning" : "success"
                        }
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" sx={{ display: "block" }}>
                        {adjustment.timestamp.toLocaleString()}
                      </Typography>
                      <Typography variant="caption">
                        HP: {adjustment.adjustments.enemyHP > 0 ? "+" : ""}{adjustment.adjustments.enemyHP}, 
                        ダメージ: {adjustment.adjustments.enemyDamage > 0 ? "+" : ""}{adjustment.adjustments.enemyDamage}, 
                        AC: {adjustment.adjustments.enemyAC > 0 ? "+" : ""}{adjustment.adjustments.enemyAC}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info">
            まだ調整が実行されていません。
          </Alert>
        )}
      </Paper>

      {/* 設定ダイアログ */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>バランス調整設定</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            調整感度: {balanceSettings.sensitivity}
          </Typography>
          <Slider
            value={balanceSettings.sensitivity}
            onChange={(_, value) => setBalanceSettings(prev => ({ ...prev, sensitivity: value as number }))}
            min={0.1}
            max={1.0}
            step={0.1}
            marks={[
              { value: 0.3, label: '低' },
              { value: 0.7, label: '中' },
              { value: 1.0, label: '高' },
            ]}
            valueLabelDisplay="auto"
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            目標難易度: {balanceSettings.targetDifficulty}
          </Typography>
          <Slider
            value={balanceSettings.targetDifficulty}
            onChange={(_, value) => setBalanceSettings(prev => ({ ...prev, targetDifficulty: value as number }))}
            min={1}
            max={10}
            step={1}
            marks={[
              { value: 3, label: '易' },
              { value: 5, label: '中' },
              { value: 8, label: '難' },
            ]}
            valueLabelDisplay="auto"
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            調整の積極性: {balanceSettings.aggressiveness}
          </Typography>
          <Slider
            value={balanceSettings.aggressiveness}
            onChange={(_, value) => setBalanceSettings(prev => ({ ...prev, aggressiveness: value as number }))}
            min={0.1}
            max={1.0}
            step={0.1}
            marks={[
              { value: 0.3, label: '控えめ' },
              { value: 0.5, label: '標準' },
              { value: 0.8, label: '積極的' },
            ]}
            valueLabelDisplay="auto"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* 詳細分析ダイアログ */}
      <Dialog open={analysisDialog} onClose={() => setAnalysisDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>詳細バランス分析</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>カテゴリ別詳細</Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>カテゴリ</TableCell>
                  <TableCell>現在値</TableCell>
                  <TableCell>目標値</TableCell>
                  <TableCell>状態</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(currentDifficulty.categories).map(([category, value]) => (
                  <TableRow key={category}>
                    <TableCell>{category}</TableCell>
                    <TableCell>{value.toFixed(1)}</TableCell>
                    <TableCell>{balanceSettings.targetDifficulty}</TableCell>
                    <TableCell>
                      {value > balanceSettings.targetDifficulty + 1 ? (
                        <Chip label="高い" color="error" size="small" />
                      ) : value < balanceSettings.targetDifficulty - 1 ? (
                        <Chip label="低い" color="success" size="small" />
                      ) : (
                        <Chip label="適正" color="default" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalysisDialog(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CombatBalanceManager;
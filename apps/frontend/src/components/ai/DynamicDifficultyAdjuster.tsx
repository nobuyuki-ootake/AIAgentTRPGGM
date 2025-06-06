import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Switch,
  FormControlLabel,
  Button,
  Slider,
  Alert,
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
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  TrendingUp as DifficultyIcon,
  Psychology as AIIcon,
  BarChart as AnalyticsIcon,
  Tune as AdjustIcon,
  Assessment as StatsIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ExpandMore,
  Settings as SettingsIcon,
  AutoAwesome as AutoIcon,
  Timeline as TimelineIcon,
  Group as PartyIcon,
  Speed as QuickIcon,
  Security as DefenseIcon,
} from "@mui/icons-material";
import { TRPGCharacter, TRPGCampaign } from "@trpg-ai-gm/types";

interface DifficultyMetrics {
  partyLevel: number;
  averageHitRate: number;
  averageDamagePerRound: number;
  healingEfficiency: number;
  tacticalComplexity: number;
  resourceManagement: number;
  playerEngagement: number;
  sessionLength: number;
}

interface DifficultyAdjustment {
  id: string;
  timestamp: Date;
  triggeredBy: "automatic" | "manual" | "ai_suggestion";
  oldDifficulty: number;
  newDifficulty: number;
  reason: string;
  affectedSystems: string[];
  playerFeedback?: "positive" | "negative" | "neutral";
}

interface EncounterDifficulty {
  baseLevel: number;
  modifiers: {
    enemyCount: number;
    environmentalHazards: number;
    timeConstraints: number;
    resourceAvailability: number;
    surpriseElements: number;
  };
  adaptiveFactors: {
    recentPerformance: number;
    playerFatigue: number;
    sessionProgress: number;
    learningCurve: number;
  };
  finalDifficulty: number;
  confidence: number;
}

interface DynamicDifficultyAdjusterProps {
  characters: TRPGCharacter[];
  campaign?: TRPGCampaign;
  currentEncounter?: any;
  recentActions?: any[];
  onDifficultyChange: (difficulty: EncounterDifficulty) => void;
  onSuggestion: (suggestion: string, priority: "low" | "medium" | "high") => void;
}

const DynamicDifficultyAdjuster: React.FC<DynamicDifficultyAdjusterProps> = ({
  characters,
  campaign,
  currentEncounter,
  recentActions = [],
  onDifficultyChange,
  onSuggestion,
}) => {
  // Null safety check for required props
  if (!characters || !Array.isArray(characters) || !campaign) {
    return null;
  }
  const [isEnabled, setIsEnabled] = useState(true);
  const [adjustmentHistory, setAdjustmentHistory] = useState<DifficultyAdjustment[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState<EncounterDifficulty>({
    baseLevel: 1,
    modifiers: {
      enemyCount: 0,
      environmentalHazards: 0,
      timeConstraints: 0,
      resourceAvailability: 0,
      surpriseElements: 0,
    },
    adaptiveFactors: {
      recentPerformance: 0,
      playerFatigue: 0,
      sessionProgress: 0,
      learningCurve: 0,
    },
    finalDifficulty: 1,
    confidence: 0.8,
  });
  
  const [metrics, setMetrics] = useState<DifficultyMetrics>({
    partyLevel: 1,
    averageHitRate: 0.65,
    averageDamagePerRound: 0,
    healingEfficiency: 0.7,
    tacticalComplexity: 0.5,
    resourceManagement: 0.6,
    playerEngagement: 0.8,
    sessionLength: 120,
  });

  const [settingsDialog, setSettingsDialog] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.7);
  const [autoAdjustThreshold, setAutoAdjustThreshold] = useState(0.3);

  // パーティメトリクスの計算
  useEffect(() => {
    if (characters.length > 0) {
      calculatePartyMetrics();
    }
  }, [characters, recentActions]);

  // 動的難易度調整の実行
  useEffect(() => {
    if (isEnabled && characters.length > 0) {
      performDifficultyAdjustment();
    }
  }, [metrics, isEnabled]);

  // パーティメトリクスの計算
  const calculatePartyMetrics = () => {
    const newMetrics: DifficultyMetrics = {
      partyLevel: Math.round(characters.reduce((sum, char) => sum + char.stats.level, 0) / characters.length),
      averageHitRate: calculateHitRate(),
      averageDamagePerRound: calculateAverageDamage(),
      healingEfficiency: calculateHealingEfficiency(),
      tacticalComplexity: calculateTacticalComplexity(),
      resourceManagement: calculateResourceManagement(),
      playerEngagement: calculatePlayerEngagement(),
      sessionLength: 120, // デフォルト2時間
    };

    setMetrics(newMetrics);
  };

  // 命中率計算
  const calculateHitRate = (): number => {
    if (recentActions.length === 0) return 0.65;
    
    const attackActions = recentActions.filter(action => action.type === "attack");
    if (attackActions.length === 0) return 0.65;
    
    const successfulHits = attackActions.filter(action => action.result === "success" || action.result === "critical_success").length;
    return successfulHits / attackActions.length;
  };

  // 平均ダメージ計算
  const calculateAverageDamage = (): number => {
    if (recentActions.length === 0) return 0;
    
    const damageActions = recentActions.filter(action => action.damage > 0);
    if (damageActions.length === 0) return 0;
    
    const totalDamage = damageActions.reduce((sum, action) => sum + action.damage, 0);
    return totalDamage / damageActions.length;
  };

  // 回復効率計算
  const calculateHealingEfficiency = (): number => {
    const healers = characters.filter(char => 
      char.skills?.includes("医術") || 
      char.skills?.includes("治療") ||
      char.stats.wisdom > 14
    );
    
    return Math.min(healers.length / characters.length + 0.4, 1.0);
  };

  // 戦術複雑性計算
  const calculateTacticalComplexity = (): number => {
    const tacticalSkills = characters.reduce((count, char) => {
      const skills = char.skills || [];
      return count + skills.filter(skill => 
        skill.includes("戦術") || 
        skill.includes("指揮") || 
        skill.includes("策略")
      ).length;
    }, 0);
    
    return Math.min(tacticalSkills / (characters.length * 2), 1.0);
  };

  // リソース管理計算
  const calculateResourceManagement = (): number => {
    const averageLevel = metrics.partyLevel;
    const resourceRatio = averageLevel / 10; // レベル10で完璧なリソース管理と仮定
    return Math.min(resourceRatio + 0.3, 1.0);
  };

  // プレイヤーエンゲージメント計算
  const calculatePlayerEngagement = (): number => {
    // 最近のアクション頻度から推定
    const recentActionCount = recentActions.filter(action => 
      new Date().getTime() - new Date(action.timestamp).getTime() < 10 * 60 * 1000 // 過去10分
    ).length;
    
    return Math.min(recentActionCount / (characters.length * 3), 1.0) + 0.5;
  };

  // 動的難易度調整の実行
  const performDifficultyAdjustment = () => {
    const newDifficulty = calculateOptimalDifficulty();
    const difficultyChange = Math.abs(newDifficulty.finalDifficulty - currentDifficulty.finalDifficulty);
    
    if (difficultyChange > autoAdjustThreshold) {
      const adjustment: DifficultyAdjustment = {
        id: `adjustment-${Date.now()}`,
        timestamp: new Date(),
        triggeredBy: "automatic",
        oldDifficulty: currentDifficulty.finalDifficulty,
        newDifficulty: newDifficulty.finalDifficulty,
        reason: generateAdjustmentReason(newDifficulty),
        affectedSystems: getAffectedSystems(newDifficulty),
      };

      setAdjustmentHistory(prev => [...prev, adjustment].slice(-10)); // 最新10件を保持
      setCurrentDifficulty(newDifficulty);
      onDifficultyChange(newDifficulty);

      // 提案生成
      generateAISuggestions(newDifficulty, adjustment);
    }
  };

  // 最適難易度の計算
  const calculateOptimalDifficulty = (): EncounterDifficulty => {
    const baseLevel = metrics.partyLevel;
    
    // 修正値の計算
    const modifiers = {
      enemyCount: calculateEnemyCountModifier(),
      environmentalHazards: calculateEnvironmentalModifier(),
      timeConstraints: calculateTimeConstraintModifier(),
      resourceAvailability: calculateResourceModifier(),
      surpriseElements: calculateSurpriseModifier(),
    };

    // 適応要素の計算
    const adaptiveFactors = {
      recentPerformance: calculatePerformanceModifier(),
      playerFatigue: calculateFatigueModifier(),
      sessionProgress: calculateProgressModifier(),
      learningCurve: calculateLearningModifier(),
    };

    // 最終難易度の計算
    const modifierSum = Object.values(modifiers).reduce((sum, mod) => sum + mod, 0);
    const adaptiveSum = Object.values(adaptiveFactors).reduce((sum, factor) => sum + factor, 0);
    
    const finalDifficulty = Math.max(0.1, Math.min(10, baseLevel + modifierSum + adaptiveSum));
    const confidence = calculateConfidence(metrics, modifiers, adaptiveFactors);

    return {
      baseLevel,
      modifiers,
      adaptiveFactors,
      finalDifficulty,
      confidence,
    };
  };

  // 各種修正値計算関数
  const calculateEnemyCountModifier = (): number => {
    // パーティサイズに基づく敵の数の調整
    const partySize = characters.length;
    if (partySize <= 2) return -0.5;
    if (partySize >= 5) return 0.5;
    return 0;
  };

  const calculateEnvironmentalModifier = (): number => {
    // 環境要因（天候、地形など）
    return 0; // 今後の実装で拡張
  };

  const calculateTimeConstraintModifier = (): number => {
    // セッション時間による調整
    if (metrics.sessionLength > 180) return -0.3; // 長時間セッションでは難易度を下げる
    if (metrics.sessionLength < 60) return 0.2; // 短時間セッションでは難易度を上げる
    return 0;
  };

  const calculateResourceModifier = (): number => {
    // リソース管理スキルに基づく調整
    return (1 - metrics.resourceManagement) * 0.5;
  };

  const calculateSurpriseModifier = (): number => {
    // サプライズ要素の追加
    return Math.random() * 0.2 - 0.1; // -0.1 to +0.1 のランダム調整
  };

  const calculatePerformanceModifier = (): number => {
    // 最近のパフォーマンスに基づく調整
    const hitRateDiff = metrics.averageHitRate - 0.65; // 目標命中率65%
    return -hitRateDiff * sensitivity;
  };

  const calculateFatigueModifier = (): number => {
    // プレイヤー疲労度に基づく調整
    if (metrics.sessionLength > 150) return -0.3;
    if (metrics.playerEngagement < 0.6) return -0.2;
    return 0;
  };

  const calculateProgressModifier = (): number => {
    // セッション進行度に基づく調整
    return 0; // セッション進行の詳細データが必要
  };

  const calculateLearningModifier = (): number => {
    // 学習曲線に基づく調整
    const recentAdjustments = adjustmentHistory.slice(-3);
    if (recentAdjustments.length >= 2) {
      const isImproving = recentAdjustments.every((adj, i) => 
        i === 0 || adj.newDifficulty > recentAdjustments[i-1].newDifficulty
      );
      return isImproving ? 0.1 : -0.1;
    }
    return 0;
  };

  const calculateConfidence = (metrics: DifficultyMetrics, modifiers: any, adaptive: any): number => {
    // データの信頼性に基づく信頼度計算
    let confidence = 0.8;
    
    if (recentActions.length < 5) confidence -= 0.2;
    if (metrics.playerEngagement < 0.5) confidence -= 0.1;
    if (characters.length < 3) confidence -= 0.1;
    
    return Math.max(0.3, Math.min(1.0, confidence));
  };

  // 調整理由の生成
  const generateAdjustmentReason = (difficulty: EncounterDifficulty): string => {
    const reasons = [];
    
    if (metrics.averageHitRate > 0.8) {
      reasons.push("命中率が高すぎるため難易度を上昇");
    } else if (metrics.averageHitRate < 0.5) {
      reasons.push("命中率が低すぎるため難易度を降下");
    }
    
    if (metrics.playerEngagement < 0.6) {
      reasons.push("プレイヤーエンゲージメントが低下");
    }
    
    if (difficulty.adaptiveFactors.playerFatigue < -0.2) {
      reasons.push("プレイヤー疲労を考慮した調整");
    }

    return reasons.length > 0 ? reasons.join(", ") : "総合的なバランス調整";
  };

  // 影響を受けるシステムの特定
  const getAffectedSystems = (difficulty: EncounterDifficulty): string[] => {
    const systems = [];
    
    if (Math.abs(difficulty.modifiers.enemyCount) > 0.2) systems.push("敵の数");
    if (Math.abs(difficulty.adaptiveFactors.recentPerformance) > 0.2) systems.push("命中/回避率");
    if (Math.abs(difficulty.modifiers.resourceAvailability) > 0.2) systems.push("リソース入手");
    
    return systems;
  };

  // AI提案の生成
  const generateAISuggestions = (difficulty: EncounterDifficulty, adjustment: DifficultyAdjustment) => {
    if (difficulty.finalDifficulty > 7) {
      onSuggestion(
        "難易度が非常に高くなっています。プレイヤーに追加のリソースや助けを提供することを検討してください。",
        "high"
      );
    } else if (difficulty.finalDifficulty < 2) {
      onSuggestion(
        "難易度が低すぎる可能性があります。より挑戦的な要素を追加することを検討してください。",
        "medium"
      );
    }

    if (difficulty.confidence < 0.5) {
      onSuggestion(
        "難易度調整の信頼度が低下しています。より多くのデータが必要です。",
        "low"
      );
    }
  };

  // 手動調整
  const handleManualAdjustment = (newDifficulty: number) => {
    const adjustment: DifficultyAdjustment = {
      id: `manual-${Date.now()}`,
      timestamp: new Date(),
      triggeredBy: "manual",
      oldDifficulty: currentDifficulty.finalDifficulty,
      newDifficulty,
      reason: "手動調整",
      affectedSystems: ["全システム"],
    };

    setAdjustmentHistory(prev => [...prev, adjustment]);
    setCurrentDifficulty(prev => ({ ...prev, finalDifficulty: newDifficulty }));
    onDifficultyChange({ ...currentDifficulty, finalDifficulty: newDifficulty });
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        動的難易度調整システム
      </Typography>

      {/* システム状態 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">
              <AIIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              AI難易度調整
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControlLabel
                control={<Switch checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />}
                label="自動調整"
              />
              <IconButton onClick={() => setSettingsDialog(true)}>
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  現在の難易度: {currentDifficulty.finalDifficulty.toFixed(1)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(currentDifficulty.finalDifficulty / 10) * 100}
                  color={
                    currentDifficulty.finalDifficulty < 3 ? "success" :
                    currentDifficulty.finalDifficulty < 7 ? "warning" : "error"
                  }
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  信頼度: {Math.round(currentDifficulty.confidence * 100)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={currentDifficulty.confidence * 100}
                  color={currentDifficulty.confidence > 0.7 ? "success" : "warning"}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>パーティメトリクス</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`Lv.${metrics.partyLevel}`} size="small" />
                <Chip label={`命中率: ${Math.round(metrics.averageHitRate * 100)}%`} size="small" />
                <Chip label={`エンゲージメント: ${Math.round(metrics.playerEngagement * 100)}%`} size="small" />
                <Chip 
                  label={`調整済み: ${adjustmentHistory.length}回`} 
                  size="small" 
                  color={adjustmentHistory.length > 5 ? "warning" : "default"}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 詳細メトリクス */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              <StatsIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              詳細メトリクス
            </Typography>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>基本修正値</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemIcon><PartyIcon fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="敵の数調整" 
                      secondary={`${currentDifficulty.modifiers.enemyCount >= 0 ? '+' : ''}${currentDifficulty.modifiers.enemyCount.toFixed(1)}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><DefenseIcon fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="環境要因" 
                      secondary={`${currentDifficulty.modifiers.environmentalHazards >= 0 ? '+' : ''}${currentDifficulty.modifiers.environmentalHazards.toFixed(1)}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="時間制約" 
                      secondary={`${currentDifficulty.modifiers.timeConstraints >= 0 ? '+' : ''}${currentDifficulty.modifiers.timeConstraints.toFixed(1)}`}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>適応要素</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemIcon><AnalyticsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="最近のパフォーマンス" 
                      secondary={`${currentDifficulty.adaptiveFactors.recentPerformance >= 0 ? '+' : ''}${currentDifficulty.adaptiveFactors.recentPerformance.toFixed(1)}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><QuickIcon fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="プレイヤー疲労" 
                      secondary={`${currentDifficulty.adaptiveFactors.playerFatigue >= 0 ? '+' : ''}${currentDifficulty.adaptiveFactors.playerFatigue.toFixed(1)}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TimelineIcon fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="学習曲線" 
                      secondary={`${currentDifficulty.adaptiveFactors.learningCurve >= 0 ? '+' : ''}${currentDifficulty.adaptiveFactors.learningCurve.toFixed(1)}`}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              <AdjustIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              手動調整
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                難易度調整: {currentDifficulty.finalDifficulty.toFixed(1)}
              </Typography>
              <Slider
                value={currentDifficulty.finalDifficulty}
                onChange={(_, value) => handleManualAdjustment(value as number)}
                min={0.1}
                max={10}
                step={0.1}
                marks={[
                  { value: 1, label: '易' },
                  { value: 5, label: '中' },
                  { value: 10, label: '難' },
                ]}
                valueLabelDisplay="auto"
              />
            </Box>

            <Alert severity="info" sx={{ fontSize: "0.875rem" }}>
              手動調整は自動調整を一時的に上書きします。システムは継続的にデータを収集し、次回から適応します。
            </Alert>
          </Paper>
        </Grid>
      </Grid>

      {/* 調整履歴 */}
      {adjustmentHistory.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <HistoryIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            調整履歴
          </Typography>
          
          <List>
            {adjustmentHistory.slice(-5).reverse().map((adjustment) => (
              <ListItem key={adjustment.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  {adjustment.triggeredBy === "automatic" ? <AutoIcon /> :
                   adjustment.triggeredBy === "manual" ? <AdjustIcon /> : <AIIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">
                        {adjustment.oldDifficulty.toFixed(1)} → {adjustment.newDifficulty.toFixed(1)}
                      </Typography>
                      <Chip 
                        label={adjustment.triggeredBy === "automatic" ? "自動" : "手動"}
                        size="small"
                        color={adjustment.triggeredBy === "automatic" ? "primary" : "secondary"}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption">
                        {adjustment.timestamp.toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        {adjustment.reason}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* 設定ダイアログ */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>難易度調整設定</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              調整感度: {sensitivity}
            </Typography>
            <Slider
              value={sensitivity}
              onChange={(_, value) => setSensitivity(value as number)}
              min={0.1}
              max={1.0}
              step={0.1}
              marks={[
                { value: 0.3, label: '低' },
                { value: 0.7, label: '中' },
                { value: 1.0, label: '高' },
              ]}
              valueLabelDisplay="auto"
            />
            
            <Typography variant="subtitle2" sx={{ mb: 2, mt: 3 }}>
              自動調整閾値: {autoAdjustThreshold}
            </Typography>
            <Slider
              value={autoAdjustThreshold}
              onChange={(_, value) => setAutoAdjustThreshold(value as number)}
              min={0.1}
              max={1.0}
              step={0.1}
              marks={[
                { value: 0.2, label: '敏感' },
                { value: 0.5, label: '標準' },
                { value: 0.8, label: '保守的' },
              ]}
              valueLabelDisplay="auto"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DynamicDifficultyAdjuster;
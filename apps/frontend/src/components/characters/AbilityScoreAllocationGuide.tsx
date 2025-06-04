import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from "@mui/material";
import {
  Casino as DiceIcon,
  Psychology as IntelligenceIcon,
  FitnessCenter as StrengthIcon,
  Speed as DexterityIcon,
  Favorite as ConstitutionIcon,
  Visibility as WisdomIcon,
  RecordVoiceOver as CharismaIcon,
  Help as HelpIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { TRPGCharacter, CharacterStats } from "@trpg-ai-gm/types";

interface AbilityScore {
  name: string;
  shortName: string;
  description: string;
  icon: React.ReactElement;
  examples: string[];
}

interface AllocationMethod {
  id: string;
  name: string;
  description: string;
  totalPoints?: number;
  minScore?: number;
  maxScore?: number;
  rollMethod?: string;
}

interface CharacterRole {
  id: string;
  name: string;
  description: string;
  primaryAbilities: string[];
  secondaryAbilities: string[];
  dumpAbilities: string[];
  recommendedDistribution: Record<string, number>;
}

const ABILITY_SCORES: AbilityScore[] = [
  {
    name: "筋力",
    shortName: "STR",
    description: "物理的な力の強さ。近接攻撃、持ち運び能力に影響",
    icon: <StrengthIcon />,
    examples: ["近接攻撃ダメージ", "持ち運び重量", "跳躍距離", "登攀能力"],
  },
  {
    name: "敏捷力",
    shortName: "DEX",
    description: "身体の俊敏さと器用さ。AC、イニシアチブ、遠距離攻撃に影響",
    icon: <DexterityIcon />,
    examples: ["アーマークラス", "イニシアチブ", "遠距離攻撃", "隠密行動"],
  },
  {
    name: "耐久力",
    shortName: "CON",
    description: "体力と生命力。ヒットポイント、耐久性に影響",
    icon: <ConstitutionIcon />,
    examples: ["ヒットポイント", "毒への耐性", "疲労への抵抗", "生存能力"],
  },
  {
    name: "知力",
    shortName: "INT",
    description: "論理的思考力と学習能力。技能ポイント、呪文に影響",
    icon: <IntelligenceIcon />,
    examples: ["知識技能", "言語数", "呪文ボーナス", "問題解決"],
  },
  {
    name: "判断力",
    shortName: "WIS",
    description: "直感と洞察力。知覚、意志セーブ、神聖呪文に影響",
    icon: <WisdomIcon />,
    examples: ["知覚判定", "意志セーブ", "動物の扱い", "生存技能"],
  },
  {
    name: "魅力",
    shortName: "CHA",
    description: "人格の魅力と存在感。社交、指導力、一部の呪文に影響",
    icon: <CharismaIcon />,
    examples: ["説得判定", "威圧判定", "指導力", "信仰呪文"],
  },
];

const ALLOCATION_METHODS: AllocationMethod[] = [
  {
    id: "point_buy",
    name: "ポイント購入制",
    description: "決められたポイントを使って能力値を購入する方法",
    totalPoints: 27,
    minScore: 8,
    maxScore: 15,
  },
  {
    id: "standard_array",
    name: "標準配列",
    description: "事前に決められた6つの値を各能力値に割り振る方法",
  },
  {
    id: "rolling",
    name: "ダイスロール",
    description: "ダイスを振って能力値を決定する方法",
    rollMethod: "4d6kh3",
  },
  {
    id: "heroic_array",
    name: "ヒロイック配列",
    description: "より高い能力値が設定された配列",
  },
];

const CHARACTER_ROLES: CharacterRole[] = [
  {
    id: "fighter",
    name: "戦士/ファイター",
    description: "前線で戦う近接戦闘の専門家",
    primaryAbilities: ["strength", "constitution"],
    secondaryAbilities: ["dexterity"],
    dumpAbilities: ["intelligence", "charisma"],
    recommendedDistribution: {
      strength: 15,
      dexterity: 13,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    },
  },
  {
    id: "rogue",
    name: "盗賊/ローグ",
    description: "隠密と技能に特化した多才なキャラクター",
    primaryAbilities: ["dexterity"],
    secondaryAbilities: ["intelligence", "wisdom"],
    dumpAbilities: ["strength"],
    recommendedDistribution: {
      strength: 8,
      dexterity: 15,
      constitution: 13,
      intelligence: 12,
      wisdom: 14,
      charisma: 10,
    },
  },
  {
    id: "wizard",
    name: "魔法使い/ウィザード",
    description: "学習した魔法を使う知的な呪文使い",
    primaryAbilities: ["intelligence"],
    secondaryAbilities: ["dexterity", "constitution"],
    dumpAbilities: ["strength"],
    recommendedDistribution: {
      strength: 8,
      dexterity: 14,
      constitution: 13,
      intelligence: 15,
      wisdom: 12,
      charisma: 10,
    },
  },
  {
    id: "cleric",
    name: "聖職者/クレリック",
    description: "神聖な力を使う支援と治療の専門家",
    primaryAbilities: ["wisdom"],
    secondaryAbilities: ["constitution", "strength"],
    dumpAbilities: ["intelligence"],
    recommendedDistribution: {
      strength: 13,
      dexterity: 10,
      constitution: 14,
      intelligence: 8,
      wisdom: 15,
      charisma: 12,
    },
  },
];

interface AbilityScoreAllocationGuideProps {
  character: Partial<TRPGCharacter>;
  gameSystem?: string;
  onStatsUpdated: (stats: CharacterStats) => void;
  onClose: () => void;
}

const AbilityScoreAllocationGuide: React.FC<AbilityScoreAllocationGuideProps> = ({
  character,
  gameSystem = "D&D 5e",
  onStatsUpdated,
  onClose,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<AllocationMethod | null>(null);
  const [selectedRole, setSelectedRole] = useState<CharacterRole | null>(null);
  const [currentStats, setCurrentStats] = useState<Record<string, number>>({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });
  const [pointsRemaining, setPointsRemaining] = useState(27);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<AbilityScore | null>(null);

  // ポイント購入コスト計算
  const getPointCost = (score: number): number => {
    if (score <= 8) return 0;
    if (score <= 13) return score - 8;
    if (score === 14) return 7;
    if (score === 15) return 9;
    return 10;
  };

  // 使用ポイント計算
  const calculateUsedPoints = (): number => {
    return Object.values(currentStats).reduce((total, score) => total + getPointCost(score), 0);
  };

  // ポイント残量更新
  useEffect(() => {
    if (selectedMethod?.id === "point_buy") {
      const used = calculateUsedPoints();
      setPointsRemaining((selectedMethod.totalPoints || 27) - used);
    }
  }, [currentStats, selectedMethod]);

  // 能力値修正の計算
  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  // ステップの処理
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedMethod(null);
    setSelectedRole(null);
    setCurrentStats({
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    });
  };

  // 配列方式の値
  const getArrayValues = (methodId: string): number[] => {
    switch (methodId) {
      case "standard_array":
        return [15, 14, 13, 12, 10, 8];
      case "heroic_array":
        return [17, 15, 13, 12, 10, 8];
      default:
        return [15, 14, 13, 12, 10, 8];
    }
  };

  // ダイスロール
  const rollStats = () => {
    const newStats = { ...currentStats };
    Object.keys(newStats).forEach(stat => {
      // 4d6 drop lowest の実装
      const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      newStats[stat] = rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
    });
    setCurrentStats(newStats);
  };

  // 推奨配分の適用
  const applyRecommendedDistribution = () => {
    if (selectedRole) {
      setCurrentStats({ ...selectedRole.recommendedDistribution });
    }
  };

  // 能力値の更新
  const updateAbilityScore = (ability: string, value: number) => {
    if (selectedMethod?.id === "point_buy") {
      const newStats = { ...currentStats, [ability]: value };
      const usedPoints = Object.entries(newStats).reduce((total, [key, score]) => {
        return total + getPointCost(score);
      }, 0);
      
      if (usedPoints <= (selectedMethod.totalPoints || 27)) {
        setCurrentStats(newStats);
      }
    } else {
      setCurrentStats({ ...currentStats, [ability]: value });
    }
  };

  // 最終確定
  const handleFinalize = () => {
    const finalStats: CharacterStats = {
      strength: currentStats.strength,
      dexterity: currentStats.dexterity,
      constitution: currentStats.constitution,
      intelligence: currentStats.intelligence,
      wisdom: currentStats.wisdom,
      charisma: currentStats.charisma,
      hitPoints: { 
        current: Math.max(1, 8 + getAbilityModifier(currentStats.constitution)), 
        max: Math.max(1, 8 + getAbilityModifier(currentStats.constitution)), 
        temp: 0 
      },
      armorClass: 10 + getAbilityModifier(currentStats.dexterity),
      speed: 30,
      level: 1,
      experience: 0,
      proficiencyBonus: 2,
    };
    
    onStatsUpdated(finalStats);
    onClose();
  };

  const steps = [
    "配分方法の選択",
    "キャラクター役割の選択",
    "能力値の配分",
    "確認と調整",
  ];

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6">能力値配分ガイド</Typography>
          <IconButton onClick={() => setHelpDialogOpen(true)}>
            <HelpIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* ステップ1: 配分方法の選択 */}
          <Step>
            <StepLabel>配分方法の選択</StepLabel>
            <StepContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {gameSystem} での能力値配分方法を選択してください。
              </Typography>
              <Grid container spacing={2}>
                {ALLOCATION_METHODS.map((method) => (
                  <Grid item xs={12} md={6} key={method.id}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        border: selectedMethod?.id === method.id ? 2 : 1,
                        borderColor: selectedMethod?.id === method.id ? "primary.main" : "divider",
                      }}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {method.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {method.description}
                        </Typography>
                        {method.totalPoints && (
                          <Chip label={`総ポイント: ${method.totalPoints}`} size="small" />
                        )}
                        {method.rollMethod && (
                          <Chip label={`ロール方法: ${method.rollMethod}`} size="small" />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!selectedMethod}
                >
                  次へ
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* ステップ2: 役割選択 */}
          <Step>
            <StepLabel>キャラクター役割の選択</StepLabel>
            <StepContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                キャラクターの役割を選択すると、推奨能力値配分が提案されます。
              </Typography>
              <Grid container spacing={2}>
                {CHARACTER_ROLES.map((role) => (
                  <Grid item xs={12} md={6} key={role.id}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        border: selectedRole?.id === role.id ? 2 : 1,
                        borderColor: selectedRole?.id === role.id ? "primary.main" : "divider",
                      }}
                      onClick={() => setSelectedRole(role)}
                    >
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {role.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {role.description}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          <Chip label="主要" size="small" color="primary" />
                          {role.primaryAbilities.map(ability => (
                            <Chip key={ability} label={ability} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Button onClick={handleBack} sx={{ mr: 1 }}>
                  戻る
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!selectedRole}
                >
                  次へ
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* ステップ3: 能力値配分 */}
          <Step>
            <StepLabel>能力値の配分</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {selectedMethod?.id === "point_buy" && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    残りポイント: {pointsRemaining} / {selectedMethod.totalPoints}
                  </Alert>
                )}
                
                {selectedRole && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={applyRecommendedDistribution}
                      startIcon={<CheckIcon />}
                    >
                      推奨配分を適用
                    </Button>
                  </Box>
                )}

                {selectedMethod?.id === "rolling" && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={rollStats}
                      startIcon={<DiceIcon />}
                    >
                      ダイスをロール
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={2}>
                {ABILITY_SCORES.map((ability) => {
                  const abilityKey = ability.name === "筋力" ? "strength" :
                                   ability.name === "敏捷力" ? "dexterity" :
                                   ability.name === "耐久力" ? "constitution" :
                                   ability.name === "知力" ? "intelligence" :
                                   ability.name === "判断力" ? "wisdom" : "charisma";
                  
                  const value = currentStats[abilityKey];
                  const modifier = getAbilityModifier(value);
                  const isImportant = selectedRole?.primaryAbilities.includes(abilityKey);

                  return (
                    <Grid item xs={12} md={6} key={ability.name}>
                      <Paper sx={{ p: 2, border: isImportant ? 2 : 1, borderColor: isImportant ? "primary.main" : "divider" }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          {ability.icon}
                          <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                            {ability.name} ({ability.shortName})
                          </Typography>
                          <Chip
                            label={`${value} (${modifier >= 0 ? '+' : ''}${modifier})`}
                            color={isImportant ? "primary" : "default"}
                          />
                        </Box>
                        
                        {selectedMethod?.id === "point_buy" ? (
                          <Box sx={{ px: 2 }}>
                            <Slider
                              value={value}
                              onChange={(_, newValue) => updateAbilityScore(abilityKey, newValue as number)}
                              min={selectedMethod.minScore || 8}
                              max={selectedMethod.maxScore || 15}
                              marks
                              step={1}
                              valueLabelDisplay="auto"
                            />
                            <Typography variant="caption" color="text.secondary">
                              コスト: {getPointCost(value)}ポイント
                            </Typography>
                          </Box>
                        ) : (
                          <TextField
                            type="number"
                            value={value}
                            onChange={(e) => updateAbilityScore(abilityKey, parseInt(e.target.value) || 8)}
                            inputProps={{ min: 3, max: 18 }}
                            size="small"
                            sx={{ width: "100px" }}
                          />
                        )}

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {ability.description}
                        </Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Button onClick={handleBack} sx={{ mr: 1 }}>
                  戻る
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={selectedMethod?.id === "point_buy" && pointsRemaining !== 0}
                >
                  次へ
                </Button>
              </Box>
            </StepContent>
          </Step>

          {/* ステップ4: 確認 */}
          <Step>
            <StepLabel>確認と調整</StepLabel>
            <StepContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                能力値配分の確認
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      最終能力値
                    </Typography>
                    <Grid container spacing={1}>
                      {ABILITY_SCORES.map((ability) => {
                        const abilityKey = ability.name === "筋力" ? "strength" :
                                         ability.name === "敏捷力" ? "dexterity" :
                                         ability.name === "耐久力" ? "constitution" :
                                         ability.name === "知力" ? "intelligence" :
                                         ability.name === "判断力" ? "wisdom" : "charisma";
                        
                        const value = currentStats[abilityKey];
                        const modifier = getAbilityModifier(value);

                        return (
                          <Grid item xs={6} key={ability.name}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                              <Typography variant="body2">
                                {ability.name}:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {value} ({modifier >= 0 ? '+' : ''}{modifier})
                              </Typography>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      派生ステータス
                    </Typography>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="ヒットポイント"
                          secondary={Math.max(1, 8 + getAbilityModifier(currentStats.constitution))}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="アーマークラス"
                          secondary={10 + getAbilityModifier(currentStats.dexterity)}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemText
                          primary="イニシアチブ修正"
                          secondary={`+${getAbilityModifier(currentStats.dexterity)}`}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Button onClick={handleBack} sx={{ mr: 1 }}>
                  戻る
                </Button>
                <Button onClick={handleReset} sx={{ mr: 1 }}>
                  最初から
                </Button>
                <Button variant="contained" onClick={handleFinalize}>
                  能力値を確定
                </Button>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
      </DialogActions>

      {/* ヘルプダイアログ */}
      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>能力値配分ガイド - ヘルプ</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            各能力値の説明
          </Typography>
          {ABILITY_SCORES.map((ability) => (
            <Box key={ability.name} sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                {ability.icon}
                <Typography variant="subtitle1" sx={{ ml: 1 }}>
                  {ability.name} ({ability.shortName})
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {ability.description}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {ability.examples.map((example) => (
                  <Chip key={example} label={example} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default AbilityScoreAllocationGuide;
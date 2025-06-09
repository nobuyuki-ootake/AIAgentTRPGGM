import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Alert,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import PartyRadarChart from "./PartyRadarChart";
import {
  Shield as TankIcon,
  LocalHospital as HealerIcon,
  Whatshot as DamageIcon,
  Visibility as SupportIcon,
  Psychology as MagicIcon,
  Security as DefenseIcon,
  Speed as UtilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  ExpandMore,
  Assessment as AnalysisIcon,
} from "@mui/icons-material";
import { TRPGCharacter, TRPGCampaign } from "@trpg-ai-gm/types";

interface PartyRole {
  id: string;
  name: string;
  description: string;
  icon: React.ReactElement;
  weight: number; // 重要度 (1-5)
  minRecommended: number; // 推奨最小人数
  maxEffective: number; // 効果的な最大人数
}

interface RoleAnalysis {
  role: PartyRole;
  currentCount: number;
  coverage: number; // 0-100の充足率
  status: "lacking" | "adequate" | "good" | "excessive";
  characters: TRPGCharacter[];
  recommendations: string[];
}

interface PartyBalanceResult {
  roleAnalysis: RoleAnalysis[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  riskFactors: string[];
  synergies: string[];
  radarData: Array<{
    label: string;
    value: number;
    maxValue: number;
  }>;
}

const PARTY_ROLES: PartyRole[] = [
  {
    id: "tank",
    name: "タンク/前衛",
    description: "敵の攻撃を受け止め、パーティを守る役割",
    icon: <TankIcon />,
    weight: 5,
    minRecommended: 1,
    maxEffective: 2,
  },
  {
    id: "healer",
    name: "ヒーラー/回復",
    description: "仲間のHPやステータス異常を回復する役割",
    icon: <HealerIcon />,
    weight: 4,
    minRecommended: 1,
    maxEffective: 2,
  },
  {
    id: "damage",
    name: "アタッカー/火力",
    description: "高いダメージで敵を倒す役割",
    icon: <DamageIcon />,
    weight: 4,
    minRecommended: 1,
    maxEffective: 3,
  },
  {
    id: "support",
    name: "サポート/補助",
    description: "バフ・デバフや戦術支援を行う役割",
    icon: <SupportIcon />,
    weight: 3,
    minRecommended: 0,
    maxEffective: 2,
  },
  {
    id: "magic",
    name: "魔法使い/術者",
    description: "魔法や特殊能力を使用する役割",
    icon: <MagicIcon />,
    weight: 3,
    minRecommended: 0,
    maxEffective: 2,
  },
  {
    id: "utility",
    name: "ユーティリティ/技能",
    description: "探索、解錠、情報収集などの技能担当",
    icon: <UtilityIcon />,
    weight: 2,
    minRecommended: 1,
    maxEffective: 2,
  },
];

interface PartyBalanceEvaluatorProps {
  characters: TRPGCharacter[];
  campaign?: TRPGCampaign;
  onRecommendationSelected?: (recommendation: string) => void;
}

const PartyBalanceEvaluator: React.FC<PartyBalanceEvaluatorProps> = ({
  characters,
  campaign,
  onRecommendationSelected,
}) => {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleAnalysis | null>(null);

  // キャラクターの役割を分析
  const analyzeCharacterRole = (character: TRPGCharacter): string[] => {
    const roles: string[] = [];
    const attributes = character.attributes;

    // Stormbringerの能力値から役割を推定
    if (attributes.CON > 14 && attributes.STR > 12) {
      roles.push("tank");
    }
    if (attributes.POW > 14) {
      roles.push("healer", "magic");
    }
    if (attributes.STR > 14 || attributes.DEX > 14) {
      roles.push("damage");
    }
    if (attributes.INT > 14 || attributes.CHA > 14) {
      roles.push("support", "magic");
    }
    if (attributes.DEX > 12) {
      roles.push("utility");
    }

    // 最低でも1つの役割は持つ
    if (roles.length === 0) {
      roles.push("damage");
    }

    return roles;
  };

  // パーティバランス分析
  const partyAnalysis: PartyBalanceResult = useMemo(() => {
    const roleAnalysis: RoleAnalysis[] = PARTY_ROLES.map(role => {
      const matchingCharacters = characters.filter(char =>
        analyzeCharacterRole(char).includes(role.id)
      );

      const currentCount = matchingCharacters.length;
      let coverage = 0;
      let status: RoleAnalysis["status"] = "lacking";

      if (currentCount >= role.minRecommended) {
        coverage = Math.min((currentCount / role.maxEffective) * 100, 100);
        if (currentCount <= role.maxEffective) {
          status = currentCount >= role.minRecommended + 1 ? "good" : "adequate";
        } else {
          status = "excessive";
        }
      } else {
        coverage = (currentCount / role.minRecommended) * 50;
        status = "lacking";
      }

      const recommendations: string[] = [];
      if (status === "lacking") {
        recommendations.push(`${role.name}の追加を強く推奨`);
      } else if (status === "excessive") {
        recommendations.push(`${role.name}が多すぎる可能性`);
      }

      return {
        role,
        currentCount,
        coverage,
        status,
        characters: matchingCharacters,
        recommendations,
      };
    });

    // レーダーチャート用データの生成（5段階評価）
    const radarData = roleAnalysis.map(analysis => {
      // coverageを0-100から1-5の範囲に変換
      let value = 1; // 最低値は1
      if (analysis.currentCount >= analysis.role.maxEffective) {
        value = 5; // 最適人数以上なら最高評価
      } else if (analysis.currentCount >= analysis.role.minRecommended) {
        value = 3 + Math.min(2, analysis.currentCount - analysis.role.minRecommended); // 推奨以上なら3-5
      } else if (analysis.currentCount > 0) {
        value = 1 + Math.round((analysis.currentCount / analysis.role.minRecommended) * 2); // 不足でも1人以上いれば2-3
      }
      
      return {
        label: analysis.role.name.split('/')[0], // "タンク/前衛" → "タンク"
        value: Math.min(5, Math.max(1, value)),
        maxValue: 5,
      };
    });

    // 強みと弱みの分析
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    const synergies: string[] = [];

    roleAnalysis.forEach(analysis => {
      if (analysis.status === "good") {
        strengths.push(`${analysis.role.name}が充実`);
      } else if (analysis.status === "lacking") {
        weaknesses.push(`${analysis.role.name}が不足`);
        recommendations.push(`${analysis.role.name}の追加が必要`);
      } else if (analysis.status === "excessive") {
        riskFactors.push(`${analysis.role.name}が過多で役割の重複`);
      }
    });

    // パーティサイズの評価
    if (characters.length < 3) {
      riskFactors.push("パーティサイズが小さすぎる（推奨3-6人）");
    } else if (characters.length > 6) {
      riskFactors.push("パーティサイズが大きすぎる（推奨3-6人）");
    }

    // シナジー分析
    const tankRole = roleAnalysis.find(r => r.role.id === "tank");
    const healerRole = roleAnalysis.find(r => r.role.id === "healer");
    const hasTankAndHealer = tankRole && healerRole && 
                            tankRole.currentCount > 0 && healerRole.currentCount > 0;
    if (hasTankAndHealer) {
      synergies.push("タンクとヒーラーの組み合わせで安定した戦闘");
    }

    const magicRole = roleAnalysis.find(r => r.role.id === "magic");
    const supportRole = roleAnalysis.find(r => r.role.id === "support");
    const hasMagicAndSupport = magicRole && supportRole &&
                              magicRole.currentCount > 0 && supportRole.currentCount > 0;
    if (hasMagicAndSupport) {
      synergies.push("魔法使いとサポートで多彩な戦術選択肢");
    }

    return {
      roleAnalysis,
      strengths,
      weaknesses,
      recommendations,
      riskFactors,
      synergies,
      radarData,
    };
  }, [characters]);

  // 役割状態の色
  const getRoleStatusColor = (status: RoleAnalysis["status"]): "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case "good": return "success";
      case "adequate": return "info";
      case "lacking": return "error";
      case "excessive": return "warning";
      default: return "primary";
    }
  };

  const handleRoleClick = (role: RoleAnalysis) => {
    setSelectedRole(role);
    setDetailDialogOpen(true);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        パーティバランス評価
      </Typography>

      {/* パーティ構成の可視化 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            パーティ構成バランス
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <PartyRadarChart data={partyAnalysis.radarData} />
          </Box>
          <Typography variant="body2" color="text.secondary" align="center">
            パーティメンバー: {characters.length}人
            {campaign && ` | ゲームシステム: ${campaign.gameSystem || "未設定"}`}
          </Typography>
        </CardContent>
      </Card>

      {/* 役割別分析 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          役割別充足状況
        </Typography>
        <Grid container spacing={2}>
          {partyAnalysis.roleAnalysis.map((analysis) => (
            <Grid size={{ xs: 12, md: 6 }} key={analysis.role.id}>
              <Paper
                sx={{
                  p: 2,
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  }
                }}
                onClick={() => handleRoleClick(analysis)}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  {analysis.role.icon}
                  <Typography variant="subtitle1" sx={{ ml: 1, flex: 1 }}>
                    {analysis.role.name}
                  </Typography>
                  <Chip
                    label={analysis.currentCount}
                    color={getRoleStatusColor(analysis.status)}
                    size="small"
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analysis.coverage}
                  color={getRoleStatusColor(analysis.status)}
                  sx={{ height: 6, borderRadius: 3, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {analysis.role.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* 強み・弱み・推奨事項 */}
      <Grid container spacing={2}>
        {/* 強み */}
        {partyAnalysis.strengths.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Alert severity="success" icon={<CheckIcon />}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                パーティの強み
              </Typography>
              <List dense>
                {partyAnalysis.strengths.map((strength, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemText primary={`• ${strength}`} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          </Grid>
        )}

        {/* 弱み */}
        {partyAnalysis.weaknesses.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Alert severity="error" icon={<WarningIcon />}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                改善が必要な点
              </Typography>
              <List dense>
                {partyAnalysis.weaknesses.map((weakness, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemText primary={`• ${weakness}`} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          </Grid>
        )}

        {/* 推奨事項 */}
        {partyAnalysis.recommendations.length > 0 && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                推奨事項
              </Typography>
              <List dense>
                {partyAnalysis.recommendations.map((recommendation, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemText primary={`• ${recommendation}`} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* シナジーとリスクファクター */}
      {(partyAnalysis.synergies.length > 0 || partyAnalysis.riskFactors.length > 0) && (
        <Box sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <AnalysisIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">詳細分析</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {partyAnalysis.synergies.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "success.main" }}>
                      シナジー効果
                    </Typography>
                    <List dense>
                      {partyAnalysis.synergies.map((synergy, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={synergy} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}

                {partyAnalysis.riskFactors.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "warning.main" }}>
                      リスクファクター
                    </Typography>
                    <List dense>
                      {partyAnalysis.riskFactors.map((risk, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningIcon color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={risk} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* 役割詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedRole && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {selectedRole.role.icon}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {selectedRole.role.name} 詳細分析
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    役割情報
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedRole.role.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>重要度:</strong> {selectedRole.role.weight}/5
                    </Typography>
                    <Typography variant="body2">
                      <strong>推奨最小人数:</strong> {selectedRole.role.minRecommended}人
                    </Typography>
                    <Typography variant="body2">
                      <strong>効果的最大人数:</strong> {selectedRole.role.maxEffective}人
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    現在の状況
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>該当キャラクター数:</strong> {selectedRole.currentCount}人
                    </Typography>
                    <Typography variant="body2">
                      <strong>充足率:</strong> {Math.round(selectedRole.coverage)}%
                    </Typography>
                    <Typography variant="body2">
                      <strong>状態:</strong>{" "}
                      <Chip
                        label={
                          selectedRole.status === "good" ? "良好" :
                          selectedRole.status === "adequate" ? "十分" :
                          selectedRole.status === "lacking" ? "不足" : "過多"
                        }
                        color={getRoleStatusColor(selectedRole.status)}
                        size="small"
                      />
                    </Typography>
                  </Box>
                </Grid>

                {selectedRole.characters.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      該当キャラクター
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {selectedRole.characters.map((char) => (
                        <Chip
                          key={char.id}
                          label={char.name}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {selectedRole.recommendations.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      推奨事項
                    </Typography>
                    <List dense>
                      {selectedRole.recommendations.map((rec, index) => (
                        <ListItem key={index} sx={{ py: 0 }}>
                          <ListItemText primary={`• ${rec}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                閉じる
              </Button>
              {onRecommendationSelected && selectedRole.recommendations.length > 0 && (
                <Button
                  variant="contained"
                  onClick={() => {
                    onRecommendationSelected(selectedRole.recommendations[0]);
                    setDetailDialogOpen(false);
                  }}
                >
                  推奨事項を適用
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PartyBalanceEvaluator;
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Alert,
  Divider,
} from "@mui/material";
import {
  Casino as DiceIcon,
  Psychology as MindIcon,
  Shield as ArmorIcon,
  Whatshot as MagicIcon,
} from "@mui/icons-material";
import { TRPGCharacter, CharacterStats } from "@trpg-ai-gm/types";

interface GameSystemTemplate {
  id: string;
  name: string;
  description: string;
  features: string[];
  stats: {
    primary: string[];
    secondary: string[];
  };
  skills: string[];
  characterTemplate: Partial<TRPGCharacter>;
  diceSystem: {
    primary: string; // メインダイス (d20, 2d6, etc.)
    attributes: string; // 能力値の範囲
    skills: string; // 技能判定
  };
  magicSystem?: {
    type: "vancian" | "mana" | "skill_based" | "none";
    description: string;
  };
  difficultyModifier: number; // 基本難易度への修正
}

const gameSystemTemplates: GameSystemTemplate[] = [
  {
    id: "dnd5e",
    name: "D&D 5e",
    description: "世界で最も人気のあるファンタジーTRPG。バランスの取れたルールと豊富なオプション。",
    features: [
      "アドバンテージ/ディスアドバンテージシステム",
      "短休息・長休息による回復",
      "呪文スロットシステム",
      "クラス・種族・背景による個性化"
    ],
    stats: {
      primary: ["筋力", "敏捷力", "耐久力", "知力", "判断力", "魅力"],
      secondary: ["ヒットポイント", "アーマークラス", "移動速度", "習熟ボーナス"]
    },
    skills: [
      "運動", "軽業", "手先の早業", "隠密", "捜査", "自然", "知覚", "生存",
      "動物使い", "洞察", "医術", "看破", "威圧", "欺瞞", "芸能", "説得",
      "魔法学", "歴史", "宗教"
    ],
    characterTemplate: {
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hitPoints: { current: 8, max: 8, temp: 0 },
        armorClass: 10,
        speed: 30,
        level: 1,
        experience: 0,
        proficiencyBonus: 2,
      },
      skills: ["運動", "知覚"]
    },
    diceSystem: {
      primary: "d20",
      attributes: "3d6または配列 (15,14,13,12,10,8)",
      skills: "d20 + 能力修正 + 習熟ボーナス"
    },
    magicSystem: {
      type: "vancian",
      description: "呪文スロット制。準備した呪文を消費して使用。"
    },
    difficultyModifier: 0
  },
  {
    id: "pathfinder2e",
    name: "Pathfinder 2e",
    description: "戦術的で複雑なファンタジーTRPG。豊富なカスタマイズオプションと詳細なルール。",
    features: [
      "3アクションシステム",
      "成功度システム（クリティカル成功/失敗）",
      "詳細なキャラクター作成",
      "豊富なアーキタイプとフィート"
    ],
    stats: {
      primary: ["筋力", "敏捷力", "耐久力", "知力", "判断力", "魅力"],
      secondary: ["ヒットポイント", "アーマークラス", "移動速度", "習熟度"]
    },
    skills: [
      "軽業", "魔法学", "運動", "製作", "欺瞞", "外交", "威圧", "学識",
      "医術", "自然", "潜行", "知覚", "芸能", "宗教", "社会", "呪文学",
      "生存", "盗賊", "動物使い"
    ],
    characterTemplate: {
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hitPoints: { current: 8, max: 8, temp: 0 },
        armorClass: 10,
        speed: 25,
        level: 1,
        experience: 0,
        proficiencyBonus: 2,
      },
      skills: ["知覚", "運動"]
    },
    diceSystem: {
      primary: "d20",
      attributes: "10 + 種族/クラスボーナス",
      skills: "d20 + 能力修正 + 習熟度 + アイテムボーナス"
    },
    magicSystem: {
      type: "vancian",
      description: "準備済み呪文システム。フォーカス呪文と儀式呪文も使用可能。"
    },
    difficultyModifier: 2
  },
  {
    id: "coc7e",
    name: "クトゥルフ神話TRPG 7版",
    description: "ホラー・ミステリーTRPG。狂気と恐怖の現代オカルト調査。",
    features: [
      "狂気システム",
      "技能成長ロール",
      "プッシュロール",
      "ボーナス・ペナルティダイス"
    ],
    stats: {
      primary: ["STR", "CON", "POW", "DEX", "APP", "SIZ", "INT", "EDU"],
      secondary: ["HP", "MP", "正気度", "幸運"]
    },
    skills: [
      "言いくるめ", "威圧", "魅惑", "説得", "心理学", "精神分析",
      "目星", "聞き耳", "図書館", "オカルト", "考古学", "人類学",
      "医学", "機械修理", "電気修理", "コンピューター", "運転",
      "回避", "登攀", "跳躍", "水泳", "投擲", "格闘", "拳銃", "ライフル"
    ],
    characterTemplate: {
      stats: {
        strength: 50,
        dexterity: 50,
        constitution: 50,
        intelligence: 50,
        wisdom: 50,
        charisma: 50,
        hitPoints: { current: 10, max: 10, temp: 0 },
        armorClass: 0,
        speed: 0,
        level: 1,
        experience: 0,
        proficiencyBonus: 0,
      },
      skills: ["目星", "聞き耳", "図書館"]
    },
    diceSystem: {
      primary: "d100",
      attributes: "3d6×5または配分制",
      skills: "d100 ≤ 技能値で成功"
    },
    difficultyModifier: -10
  },
  {
    id: "sw25",
    name: "ソード・ワールド2.5",
    description: "日本のファンタジーTRPGの代表格。分かりやすいルールと豊富な背景設定。",
    features: [
      "2d6システム",
      "技能レベル制",
      "魔法技能システム",
      "種族と出身地による個性"
    ],
    stats: {
      primary: ["器用度", "敏捷度", "筋力", "生命力", "知力", "精神力"],
      secondary: ["HP", "MP", "生命抵抗力", "精神抵抗力"]
    },
    skills: [
      "冒険者技能", "ファイター", "グラップラー", "フェンサー", "シューター",
      "ソーサラー", "コンジャラー", "ウィザード", "プリースト", "マギテック",
      "スカウト", "レンジャー", "セージ", "エンハンサー", "バード", "ライダー"
    ],
    characterTemplate: {
      stats: {
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8,
        hitPoints: { current: 15, max: 15, temp: 0 },
        armorClass: 10,
        speed: 30,
        level: 1,
        experience: 0,
        proficiencyBonus: 0,
      },
      skills: ["冒険者技能", "ファイター"]
    },
    diceSystem: {
      primary: "2d6",
      attributes: "2d6+6またはダイス配分",
      skills: "2d6 + 能力ボーナス + 技能レベル"
    },
    magicSystem: {
      type: "mana",
      description: "MP消費型。真語魔法、信仰魔法、魔動機術など複数系統。"
    },
    difficultyModifier: 0
  },
  {
    id: "stormbringer",
    name: "ストームブリンガー",
    description: "マイケル・ムアコックの「エルリック・サーガ」を原作とする退廃的ファンタジーTRPG。",
    features: [
      "混沌と秩序の対立",
      "悪魔召喚システム",
      "ルーン魔法",
      "運命と宿命のテーマ"
    ],
    stats: {
      primary: ["STR", "CON", "SIZ", "INT", "POW", "DEX", "CHA"],
      secondary: ["HP", "魔法力", "移動力", "技能修正"]
    },
    skills: [
      "近接戦闘", "飛び道具", "回避", "乗騎", "隠密", "聞き耳", "見つける",
      "追跡", "芸術", "評価", "製作", "工芸", "博学", "言語", "操縦",
      "説得", "治療", "召喚", "ルーン魔法", "秘術"
    ],
    characterTemplate: {
      stats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        hitPoints: { current: 10, max: 10, temp: 0 },
        armorClass: 0,
        speed: 30,
        level: 1,
        experience: 0,
        proficiencyBonus: 0,
      },
      skills: ["近接戦闘", "回避", "隠密"]
    },
    diceSystem: {
      primary: "d100",
      attributes: "3d6またはダイス配分",
      skills: "d100 ≤ (能力値×5 + 技能値)"
    },
    magicSystem: {
      type: "skill_based",
      description: "ルーン魔法と召喚術。魔法力を消費して呪文を行使。"
    },
    difficultyModifier: 0
  }
];

interface GameSystemTemplatesProps {
  onTemplateSelected: (template: GameSystemTemplate) => void;
  onCharacterTemplateApplied: (character: Partial<TRPGCharacter>) => void;
}

const GameSystemTemplates: React.FC<GameSystemTemplatesProps> = ({
  onTemplateSelected,
  onCharacterTemplateApplied,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<GameSystemTemplate | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const handleTemplateSelect = (template: GameSystemTemplate) => {
    setSelectedTemplate(template);
    setDetailDialogOpen(true);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelected(selectedTemplate);
      onCharacterTemplateApplied(selectedTemplate.characterTemplate);
      setDetailDialogOpen(false);
    }
  };

  const getSystemIcon = (systemId: string) => {
    switch (systemId) {
      case "dnd5e":
      case "pathfinder2e":
        return <MagicIcon color="primary" />;
      case "coc7e":
        return <MindIcon color="secondary" />;
      case "sw25":
        return <ArmorIcon color="success" />;
      case "stormbringer":
        return <DiceIcon color="error" />;
      default:
        return <DiceIcon />;
    }
  };

  const getSystemColor = (systemId: string) => {
    switch (systemId) {
      case "dnd5e": return "primary";
      case "pathfinder2e": return "secondary";
      case "coc7e": return "warning";
      case "sw25": return "success";
      case "stormbringer": return "error";
      default: return "default";
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        ゲームシステムテンプレート
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        キャンペーンで使用するTRPGシステムを選択してください。
        各システムに適したキャラクタービルドやルール設定が自動的に適用されます。
      </Typography>

      <Grid container spacing={3}>
        {gameSystemTemplates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card 
              sx={{ 
                height: "100%", 
                display: "flex", 
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                }
              }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  {getSystemIcon(template.id)}
                  <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                    {template.name}
                  </Typography>
                  <Chip 
                    label={template.diceSystem.primary} 
                    size="small" 
                    color={getSystemColor(template.id)} 
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    主要な特徴:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {template.features.slice(0, 2).map((feature, index) => (
                      <Chip 
                        key={index} 
                        label={feature} 
                        size="small" 
                        variant="outlined" 
                      />
                    ))}
                    {template.features.length > 2 && (
                      <Chip 
                        label={`+${template.features.length - 2}個`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>ダイスシステム:</strong> {template.diceSystem.primary}
                </Typography>
                
                {template.magicSystem && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>魔法システム:</strong> {template.magicSystem.description}
                  </Typography>
                )}

                <Typography variant="body2">
                  <strong>基本スキル数:</strong> {template.skills.length}個
                </Typography>
              </CardContent>
              
              <CardActions>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => handleTemplateSelect(template)}
                >
                  詳細を見る
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 詳細ダイアログ */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedTemplate && (
          <>
            <DialogTitle>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {getSystemIcon(selectedTemplate.id)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {selectedTemplate.name}
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedTemplate.description}
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                このテンプレートを適用すると、キャラクター作成時の初期値や
                推奨スキルが自動的に設定されます。
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    システムの特徴
                  </Typography>
                  <List dense>
                    {selectedTemplate.features.map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText primary={`• ${feature}`} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    ダイスシステム
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>メインダイス:</strong> {selectedTemplate.diceSystem.primary}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>能力値生成:</strong> {selectedTemplate.diceSystem.attributes}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>技能判定:</strong> {selectedTemplate.diceSystem.skills}
                  </Typography>

                  {selectedTemplate.magicSystem && (
                    <>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        魔法システム
                      </Typography>
                      <Typography variant="body2">
                        {selectedTemplate.magicSystem.description}
                      </Typography>
                    </>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    基本能力値 ({selectedTemplate.stats.primary.length}種類)
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    {selectedTemplate.stats.primary.map((stat) => (
                      <Chip key={stat} label={stat} variant="outlined" />
                    ))}
                  </Box>

                  <Typography variant="h6" sx={{ mb: 2 }}>
                    推奨技能 ({selectedTemplate.skills.length}種類)
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {selectedTemplate.skills.slice(0, 10).map((skill) => (
                      <Chip key={skill} label={skill} size="small" />
                    ))}
                    {selectedTemplate.skills.length > 10 && (
                      <Chip 
                        label={`+${selectedTemplate.skills.length - 10}個`} 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setDetailDialogOpen(false)}>
                キャンセル
              </Button>
              <Button 
                variant="contained" 
                onClick={handleApplyTemplate}
                color={getSystemColor(selectedTemplate.id)}
              >
                このテンプレートを適用
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default GameSystemTemplates;
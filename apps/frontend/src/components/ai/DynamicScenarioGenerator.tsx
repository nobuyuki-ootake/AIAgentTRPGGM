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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Rating,
} from "@mui/material";
import {
  AutoAwesome as GenerateIcon,
  Psychology as AIIcon,
  ExpandMore,
  Settings as SettingsIcon,
  Timeline as StoryIcon,
  Map as LocationIcon,
  Group as CharacterIcon,
  Event as EventIcon,
  Assignment as QuestIcon,
  Warning as ConflictIcon,
  Lightbulb as IdeaIcon,
  Speed as DifficultyIcon,
  Assessment as AnalysisIcon,
  School as ThemeIcon,
  Memory as HistoryIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RegenerateIcon,
  PlayArrow as ImplementIcon,
  Star as FavoriteIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
} from "@mui/icons-material";
import { TRPGCampaign, TRPGCharacter, BaseLocation } from "@trpg-ai-gm/types";

interface ScenarioElement {
  type: "location" | "character" | "event" | "conflict" | "mystery" | "treasure" | "challenge";
  name: string;
  description: string;
  importance: "low" | "medium" | "high" | "critical";
  connections: string[]; // 他要素との関連ID
  tags: string[];
  difficulty: number; // 1-10
  estimatedDuration: number; // 分単位
}

interface GeneratedScenario {
  id: string;
  title: string;
  description: string;
  theme: string;
  genre: "adventure" | "mystery" | "horror" | "political" | "exploration" | "social" | "combat";
  targetLevel: number;
  estimatedSessions: number;
  elements: ScenarioElement[];
  plotStructure: {
    introduction: string;
    risingAction: string[];
    climax: string;
    resolution: string;
  };
  hooks: string[]; // プレイヤーを引き込む要素
  twists: string[]; // 予想外の展開
  npcs: {
    name: string;
    role: "ally" | "enemy" | "neutral" | "mentor" | "rival";
    motivation: string;
    secret?: string;
  }[];
  locations: {
    name: string;
    type: string;
    significance: string;
    encounters: string[];
  }[];
  rewards: {
    type: "item" | "knowledge" | "reputation" | "connection" | "power";
    description: string;
    value: number;
  }[];
  adaptationNotes: string[]; // GMへの運用アドバイス
  difficulty: number; // 1-10
  creativity: number; // 1-10
  coherence: number; // 1-10
  generated: Date;
}

interface GenerationParams {
  genre: GeneratedScenario["genre"];
  targetLevel: number;
  sessionCount: number;
  themes: string[];
  includedElements: ScenarioElement["type"][];
  complexity: "simple" | "moderate" | "complex";
  tone: "lighthearted" | "serious" | "dark" | "heroic" | "mysterious";
  playerPreferences: {
    combat: number; // 0-100
    roleplay: number;
    exploration: number;
    puzzles: number;
  };
  worldContext?: {
    campaign: TRPGCampaign;
    currentLocation: BaseLocation;
    activeQuests: any[];
    worldState: any;
  };
}

interface DynamicScenarioGeneratorProps {
  campaign?: TRPGCampaign;
  characters: TRPGCharacter[];
  currentContext?: any;
  onScenarioGenerated: (scenario: GeneratedScenario) => void;
  onScenarioImplemented: (scenario: GeneratedScenario) => void;
}

const DynamicScenarioGenerator: React.FC<DynamicScenarioGeneratorProps> = ({
  campaign,
  characters,
  currentContext,
  onScenarioGenerated,
  onScenarioImplemented,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScenarios, setGeneratedScenarios] = useState<GeneratedScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<GeneratedScenario | null>(null);
  const [generationParams, setGenerationParams] = useState<GenerationParams>({
    genre: "adventure",
    targetLevel: 3,
    sessionCount: 3,
    themes: ["discovery", "conflict"],
    includedElements: ["location", "character", "event", "conflict"],
    complexity: "moderate",
    tone: "serious",
    playerPreferences: {
      combat: 60,
      roleplay: 70,
      exploration: 80,
      puzzles: 50,
    },
  });
  
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // 利用可能なテーマ
  const availableThemes = [
    "discovery", "conflict", "mystery", "revenge", "rescue", "exploration",
    "political_intrigue", "ancient_secrets", "forbidden_knowledge", "survival",
    "redemption", "betrayal", "friendship", "sacrifice", "power_struggle"
  ];

  // シナリオ生成
  const generateScenario = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // AIによるシナリオ生成をシミュレート
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const scenario = await createScenario(generationParams);
      setGeneratedScenarios(prev => [scenario, ...prev].slice(0, 20)); // 最新20件を保持
      onScenarioGenerated(scenario);
      
    } catch (error) {
      console.error("シナリオ生成エラー:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [generationParams, onScenarioGenerated]);

  const createScenario = async (params: GenerationParams): Promise<GeneratedScenario> => {
    const scenario: GeneratedScenario = {
      id: `scenario-${Date.now()}`,
      title: generateScenarioTitle(params),
      description: generateScenarioDescription(params),
      theme: params.themes[0] || "adventure",
      genre: params.genre,
      targetLevel: params.targetLevel,
      estimatedSessions: params.sessionCount,
      elements: generateScenarioElements(params),
      plotStructure: generatePlotStructure(params),
      hooks: generateHooks(params),
      twists: generateTwists(params),
      npcs: generateNPCs(params),
      locations: generateLocations(params),
      rewards: generateRewards(params),
      adaptationNotes: generateAdaptationNotes(params),
      difficulty: calculateDifficulty(params),
      creativity: calculateCreativity(params),
      coherence: calculateCoherence(params),
      generated: new Date(),
    };

    return scenario;
  };

  const generateScenarioTitle = (params: GenerationParams): string => {
    const titlePatterns = {
      adventure: ["失われた#{artifact}の謎", "#{location}の冒険", "#{character}と#{conflict}"],
      mystery: ["#{location}の謎", "消えた#{character}の行方", "#{artifact}をめぐる陰謀"],
      horror: ["#{location}の恐怖", "呪われた#{artifact}", "#{character}の悪夢"],
      political: ["#{faction}の陰謀", "#{location}の政変", "#{character}の野望"],
      exploration: ["未知なる#{location}", "#{artifact}の探索", "#{character}との旅路"],
      social: ["#{character}との絆", "#{location}の人々", "#{faction}の秘密"],
      combat: ["#{enemy}との戦い", "#{location}の守護者", "#{artifact}をかけた戦い"],
    };

    const patterns = titlePatterns[params.genre] || titlePatterns.adventure;
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    return pattern
      .replace("#{artifact}", getRandomElement(["聖剣", "古代の巻物", "魔法の石", "失われた王冠"]))
      .replace("#{location}", getRandomElement(["古城", "森の奥地", "地下遺跡", "魔法都市"]))
      .replace("#{character}", getRandomElement(["賢者", "騎士", "盗賊", "魔法使い"]))
      .replace("#{conflict}", getRandomElement(["闇の勢力", "裏切り", "古代の呪い", "政治的陰謀"]))
      .replace("#{faction}", getRandomElement(["騎士団", "商業ギルド", "魔法議会", "盗賊組合"]))
      .replace("#{enemy}", getRandomElement(["ドラゴン", "闇の軍団", "堕落した騎士", "邪悪な魔法使い"]));
  };

  const generateScenarioDescription = (params: GenerationParams): string => {
    const baseDescriptions = {
      adventure: "プレイヤーたちは新たな冒険に乗り出す。",
      mystery: "謎めいた事件がプレイヤーたちを待ち受ける。",
      horror: "恐怖と戦いながら真実に迫る。",
      political: "複雑な政治的状況に巻き込まれる。",
      exploration: "未知の領域を探索する冒険が始まる。",
      social: "人々との交流を通じて物語が展開する。",
      combat: "強敵との戦いが待ち受ける。",
    };

    return baseDescriptions[params.genre] + " " + generateContextualDescription(params);
  };

  const generateContextualDescription = (params: GenerationParams): string => {
    const contextParts = [];
    
    if (params.worldContext?.campaign) {
      contextParts.push(`${params.worldContext.campaign.name}の世界で`);
    }
    
    if (params.themes.includes("mystery")) {
      contextParts.push("謎に満ちた状況の中で");
    }
    
    if (params.complexity === "complex") {
      contextParts.push("複雑に絡み合った要素により");
    }
    
    contextParts.push(`${params.sessionCount}セッション分の充実した内容が展開される。`);
    
    return contextParts.join("");
  };

  const generateScenarioElements = (params: GenerationParams): ScenarioElement[] => {
    const elements: ScenarioElement[] = [];
    
    params.includedElements.forEach(type => {
      const count = type === "location" || type === "character" ? 2 : 1;
      for (let i = 0; i < count; i++) {
        elements.push(createElementByType(type, params));
      }
    });

    return elements;
  };

  const createElementByType = (type: ScenarioElement["type"], params: GenerationParams): ScenarioElement => {
    const elementTemplates = {
      location: {
        names: ["古い図書館", "廃墟の砦", "神秘の森", "地下洞窟", "商業区域"],
        descriptions: ["重要な手がかりが隠されている", "危険だが価値ある情報がある", "謎めいた存在が潜んでいる"],
      },
      character: {
        names: ["謎の商人", "古老の賢者", "若き騎士", "隠者の魔法使い", "情報通の盗賊"],
        descriptions: ["重要な情報を持つ", "プレイヤーの助けとなる", "複雑な動機を持つ"],
      },
      event: {
        names: ["突然の襲撃", "不可解な現象", "重要な発見", "予期せぬ出会い", "危機的状況"],
        descriptions: ["物語の転換点となる", "プレイヤーの決断を要求する", "新たな展開をもたらす"],
      },
    };

    const template = elementTemplates[type as keyof typeof elementTemplates];
    if (!template) {
      return {
        type,
        name: `${type}要素`,
        description: "シナリオの重要な要素",
        importance: "medium",
        connections: [],
        tags: [params.genre],
        difficulty: params.targetLevel,
        estimatedDuration: 30,
      };
    }

    return {
      type,
      name: getRandomElement(template.names),
      description: getRandomElement(template.descriptions),
      importance: getRandomElement(["low", "medium", "high"] as const),
      connections: [],
      tags: [params.genre, ...params.themes.slice(0, 2)],
      difficulty: params.targetLevel + Math.floor(Math.random() * 3) - 1,
      estimatedDuration: 20 + Math.floor(Math.random() * 40),
    };
  };

  const generatePlotStructure = (params: GenerationParams) => {
    return {
      introduction: "プレイヤーたちは新たな状況に直面し、冒険の始まりを迎える。",
      risingAction: [
        "最初の手がかりを発見する",
        "障害に遭遇し、それを乗り越える",
        "重要な情報や同盟者を得る",
        "真の敵や問題の正体が明らかになる",
      ],
      climax: "すべての要素が集約し、最大の困難に立ち向かう決定的な瞬間。",
      resolution: "冒険の結果を受けて、新たな状況や関係性が確立される。",
    };
  };

  const generateHooks = (params: GenerationParams): string[] => {
    const hooks = [
      "プレイヤーキャラクターの過去に関連する出来事",
      "世界の平和を脅かす新たな脅威",
      "失われた宝物や知識の手がかり",
      "重要な人物からの緊急の依頼",
      "偶然の出会いから始まる冒険",
    ];
    
    return hooks.slice(0, 3);
  };

  const generateTwists = (params: GenerationParams): string[] => {
    const twists = [
      "信頼していた味方が実は敵だった",
      "目的の物が偽物だった",
      "真の敵は別に存在していた",
      "プレイヤーの行動が予期せぬ結果を招く",
      "過去の出来事が現在に影響を与える",
    ];
    
    return twists.slice(0, 2);
  };

  const generateNPCs = (params: GenerationParams) => {
    return [
      {
        name: "マスター・エリック",
        role: "mentor" as const,
        motivation: "プレイヤーたちの成長を見守る",
        secret: "かつて同じ冒険を経験した",
      },
      {
        name: "シャドウ・ローグ",
        role: "enemy" as const,
        motivation: "自分の目的のために手段を選ばない",
      },
      {
        name: "村長アーサー",
        role: "ally" as const,
        motivation: "村の平和を守りたい",
      },
    ];
  };

  const generateLocations = (params: GenerationParams) => {
    return [
      {
        name: "エルダーウッドの森",
        type: "wilderness",
        significance: "古代の秘密が眠る場所",
        encounters: ["森の守護者", "迷子の旅人", "隠された遺跡"],
      },
      {
        name: "ストーンブリッジ村",
        type: "settlement",
        significance: "情報収集と補給の拠点",
        encounters: ["村人との会話", "商人との交渉", "村の問題"],
      },
    ];
  };

  const generateRewards = (params: GenerationParams) => {
    return [
      {
        type: "item" as const,
        description: "魔法の武器または防具",
        value: params.targetLevel * 1000,
      },
      {
        type: "knowledge" as const,
        description: "重要な情報や技能",
        value: params.targetLevel * 500,
      },
      {
        type: "reputation" as const,
        description: "組織や地域での名声",
        value: params.targetLevel * 200,
      },
    ];
  };

  const generateAdaptationNotes = (params: GenerationParams): string[] => {
    return [
      "プレイヤーの行動に応じて難易度を調整してください",
      "キャラクターの背景を活用した展開を検討してください",
      "セッション時間に応じて内容を調整可能です",
      "プレイヤーの好みに合わせて要素の重点を変更できます",
    ];
  };

  const calculateDifficulty = (params: GenerationParams): number => {
    let difficulty = params.targetLevel;
    if (params.complexity === "complex") difficulty += 2;
    if (params.playerPreferences.combat > 80) difficulty += 1;
    return Math.min(10, Math.max(1, difficulty));
  };

  const calculateCreativity = (params: GenerationParams): number => {
    let creativity = 5;
    creativity += params.themes.length;
    if (params.tone === "mysterious") creativity += 2;
    if (params.complexity === "complex") creativity += 1;
    return Math.min(10, Math.max(1, creativity));
  };

  const calculateCoherence = (params: GenerationParams): number => {
    let coherence = 7;
    if (params.complexity === "simple") coherence += 2;
    if (params.includedElements.length > 6) coherence -= 1;
    return Math.min(10, Math.max(1, coherence));
  };

  const getRandomElement = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  // フィルタリング
  const filteredScenarios = generatedScenarios.filter(scenario => {
    const matchesGenre = filterGenre === "all" || scenario.genre === filterGenre;
    const matchesSearch = searchTerm === "" || 
      scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        動的シナリオ生成システム
      </Typography>

      {/* 生成パラメータ */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            <GenerateIcon sx={{ verticalAlign: "middle", mr: 1 }} />
            シナリオ生成設定
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>ジャンル</InputLabel>
                <Select
                  value={generationParams.genre}
                  onChange={(e) => setGenerationParams(prev => ({ ...prev, genre: e.target.value as any }))}
                >
                  <MenuItem value="adventure">冒険</MenuItem>
                  <MenuItem value="mystery">ミステリー</MenuItem>
                  <MenuItem value="horror">ホラー</MenuItem>
                  <MenuItem value="political">政治的陰謀</MenuItem>
                  <MenuItem value="exploration">探索</MenuItem>
                  <MenuItem value="social">社会的</MenuItem>
                  <MenuItem value="combat">戦闘</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                対象レベル: {generationParams.targetLevel}
              </Typography>
              <Slider
                value={generationParams.targetLevel}
                onChange={(_, value) => setGenerationParams(prev => ({ ...prev, targetLevel: value as number }))}
                min={1}
                max={20}
                marks={[
                  { value: 1, label: '1' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' },
                ]}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                想定セッション数: {generationParams.sessionCount}
              </Typography>
              <Slider
                value={generationParams.sessionCount}
                onChange={(_, value) => setGenerationParams(prev => ({ ...prev, sessionCount: value as number }))}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>プレイヤー好み</Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">戦闘: {generationParams.playerPreferences.combat}%</Typography>
                <Slider
                  value={generationParams.playerPreferences.combat}
                  onChange={(_, value) => setGenerationParams(prev => ({
                    ...prev,
                    playerPreferences: { ...prev.playerPreferences, combat: value as number }
                  }))}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">ロールプレイ: {generationParams.playerPreferences.roleplay}%</Typography>
                <Slider
                  value={generationParams.playerPreferences.roleplay}
                  onChange={(_, value) => setGenerationParams(prev => ({
                    ...prev,
                    playerPreferences: { ...prev.playerPreferences, roleplay: value as number }
                  }))}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">探索: {generationParams.playerPreferences.exploration}%</Typography>
                <Slider
                  value={generationParams.playerPreferences.exploration}
                  onChange={(_, value) => setGenerationParams(prev => ({
                    ...prev,
                    playerPreferences: { ...prev.playerPreferences, exploration: value as number }
                  }))}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            onClick={generateScenario}
            disabled={isGenerating}
            startIcon={isGenerating ? <CircularProgress size={16} /> : <GenerateIcon />}
          >
            {isGenerating ? "生成中..." : "シナリオ生成"}
          </Button>
          <Button onClick={() => setSettingsDialog(true)} startIcon={<SettingsIcon />}>
            詳細設定
          </Button>
        </CardActions>
      </Card>

      {/* 生成されたシナリオ一覧 */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">
            生成シナリオ一覧 ({filteredScenarios.length})
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>ジャンル</InputLabel>
              <Select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="adventure">冒険</MenuItem>
                <MenuItem value="mystery">ミステリー</MenuItem>
                <MenuItem value="horror">ホラー</MenuItem>
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

        {filteredScenarios.length > 0 ? (
          <Grid container spacing={2}>
            {filteredScenarios.map((scenario) => (
              <Grid item xs={12} md={6} lg={4} key={scenario.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {scenario.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {scenario.description}
                    </Typography>
                    
                    <Box sx={{ display: "flex", gap: 0.5, mb: 2, flexWrap: "wrap" }}>
                      <Chip label={scenario.genre} size="small" color="primary" />
                      <Chip label={`Lv.${scenario.targetLevel}`} size="small" />
                      <Chip label={`${scenario.estimatedSessions}セッション`} size="small" />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ display: "block" }}>
                        難易度: <Rating value={scenario.difficulty / 2} readOnly size="small" />
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block" }}>
                        創造性: <Rating value={scenario.creativity / 2} readOnly size="small" />
                      </Typography>
                      <Typography variant="caption">
                        一貫性: <Rating value={scenario.coherence / 2} readOnly size="small" />
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedScenario(scenario);
                        setPreviewDialog(true);
                      }}
                      startIcon={<PreviewIcon />}
                    >
                      プレビュー
                    </Button>
                    <Button
                      size="small"
                      onClick={() => onScenarioImplemented(scenario)}
                      startIcon={<ImplementIcon />}
                    >
                      実装
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            {generatedScenarios.length === 0 ? 
              "まだシナリオが生成されていません。「シナリオ生成」ボタンで新しいシナリオを作成してください。" :
              "検索条件に一致するシナリオがありません。"}
          </Alert>
        )}
      </Paper>

      {/* プレビューダイアログ */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        {selectedScenario && (
          <>
            <DialogTitle>{selectedScenario.title}</DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedScenario.description}
              </Typography>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>プロット構造</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle2">導入</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedScenario.plotStructure.introduction}
                  </Typography>
                  
                  <Typography variant="subtitle2">展開</Typography>
                  <List dense>
                    {selectedScenario.plotStructure.risingAction.map((action, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`${index + 1}. ${action}`} />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Typography variant="subtitle2">クライマックス</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedScenario.plotStructure.climax}
                  </Typography>
                  
                  <Typography variant="subtitle2">解決</Typography>
                  <Typography variant="body2">
                    {selectedScenario.plotStructure.resolution}
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>NPCと場所</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>重要NPC</Typography>
                  {selectedScenario.npcs.map((npc, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, border: 1, borderColor: "divider", borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>{npc.name}</strong> ({npc.role})
                      </Typography>
                      <Typography variant="caption">
                        動機: {npc.motivation}
                      </Typography>
                    </Box>
                  ))}
                  
                  <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>重要な場所</Typography>
                  {selectedScenario.locations.map((location, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, border: 1, borderColor: "divider", borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>{location.name}</strong>
                      </Typography>
                      <Typography variant="caption">
                        {location.significance}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewDialog(false)}>
                閉じる
              </Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  onScenarioImplemented(selectedScenario);
                  setPreviewDialog(false);
                }}
              >
                このシナリオを実装
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DynamicScenarioGenerator;
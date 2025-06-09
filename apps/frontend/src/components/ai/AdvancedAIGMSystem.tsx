// @ts-nocheck
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
  LinearProgress,
  Switch,
  FormControlLabel,
  Slider,
  IconButton,
  Badge,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import {
  Psychology as AIIcon,
  Settings as SettingsIcon,
  TrendingUp as AnalyticsIcon,
  Lightbulb as IdeaIcon,
  Speed as ResponseIcon,
  Chat as ConversationIcon,
  Casino as DiceIcon,
  PlayArrow as ActionIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { TRPGCampaign, TRPGCharacter, BaseLocation } from "@trpg-ai-gm/types";

interface AIGMContext {
  campaign: TRPGCampaign | null;
  currentLocation: BaseLocation | null;
  activeCharacters: TRPGCharacter[];
  sessionDay: number;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  currentQuests: any[];
  recentEvents: any[];
  worldState: any;
  partyMood: "excited" | "cautious" | "tired" | "focused" | "confused";
  sessionTone: "serious" | "lighthearted" | "dramatic" | "mysterious" | "action";
}

interface AIResponse {
  id: string;
  timestamp: Date;
  context: AIGMContext;
  userInput: string;
  responseType: "narration" | "dialogue" | "description" | "action_request" | "dice_request" | "choice_presentation";
  content: string;
  followUpOptions?: string[];
  contextualHints?: string[];
  emotionalTone: "neutral" | "encouraging" | "challenging" | "sympathetic" | "mysterious" | "exciting";
  confidence: number; // 0-100: AI応答の確信度
  strategicNotes?: string[]; // GMへの内部メモ
}

interface AIPersonality {
  name: string;
  description: string;
  traits: {
    storytelling: number; // 0-100: 物語性重視度
    tactical: number; // 0-100: 戦術性重視度
    roleplay: number; // 0-100: ロールプレイ重視度
    improvisation: number; // 0-100: 即興性
    structure: number; // 0-100: 構造化偏向
  };
  responsePatterns: {
    verbosity: "concise" | "detailed" | "elaborate";
    formality: "casual" | "formal" | "dynamic";
    humor: "none" | "light" | "frequent";
    challenge: "easy" | "moderate" | "hard";
  };
}

interface AdvancedAIGMSystemProps {
  context: AIGMContext;
  onResponse: (response: AIResponse) => void;
  onContextUpdate: (context: Partial<AIGMContext>) => void;
  onActionRequest: (action: any) => void;
}

const AdvancedAIGMSystem: React.FC<AdvancedAIGMSystemProps> = ({
  context,
  onResponse,
  onContextUpdate,
  onActionRequest,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState<AIPersonality>({
    name: "バランス型GM",
    description: "物語とゲームプレイのバランスを重視する万能型AI GM",
    traits: {
      storytelling: 70,
      tactical: 60,
      roleplay: 75,
      improvisation: 65,
      structure: 55,
    },
    responsePatterns: {
      verbosity: "detailed",
      formality: "dynamic",
      humor: "light",
      challenge: "moderate",
    },
  });
  
  const [responseHistory, setResponseHistory] = useState<AIResponse[]>([]);
  const [contextAnalysis, setContextAnalysis] = useState<any>(null);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [analyticsDialog, setAnalyticsDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [autoResponse, setAutoResponse] = useState(true);
  const [responseDelay, setResponseDelay] = useState(2000);
  const [contextSensitivity, setContextSensitivity] = useState(0.8);

  // 利用可能なAI人格プリセット
  const personalityPresets: AIPersonality[] = [
    {
      name: "物語重視GM",
      description: "ストーリーテリングと世界観描写を最重要視",
      traits: { storytelling: 95, tactical: 40, roleplay: 85, improvisation: 80, structure: 45 },
      responsePatterns: { verbosity: "elaborate", formality: "formal", humor: "light", challenge: "easy" },
    },
    {
      name: "戦術指向GM",
      description: "戦闘や戦略的思考を重視する挑戦的なGM",
      traits: { storytelling: 50, tactical: 95, roleplay: 60, improvisation: 70, structure: 85 },
      responsePatterns: { verbosity: "concise", formality: "formal", humor: "none", challenge: "hard" },
    },
    {
      name: "ロールプレイ特化GM",
      description: "キャラクター間の相互作用とロールプレイを促進",
      traits: { storytelling: 75, tactical: 45, roleplay: 95, improvisation: 85, structure: 40 },
      responsePatterns: { verbosity: "detailed", formality: "casual", humor: "frequent", challenge: "moderate" },
    },
    {
      name: "即興型GM",
      description: "プレイヤーの行動に応じて柔軟に対応する自由度重視",
      traits: { storytelling: 70, tactical: 65, roleplay: 80, improvisation: 95, structure: 30 },
      responsePatterns: { verbosity: "detailed", formality: "casual", humor: "frequent", challenge: "moderate" },
    },
  ];

  // コンテキスト分析
  useEffect(() => {
    analyzeContext();
  }, [context]);

  const analyzeContext = () => {
    const analysis = {
      complexity: calculateContextComplexity(),
      urgency: calculateUrgency(),
      opportunities: identifyOpportunities(),
      tensions: identifyTensions(),
      nextSteps: suggestNextSteps(),
    };
    setContextAnalysis(analysis);
  };

  const calculateContextComplexity = (): number => {
    let complexity = 0;
    complexity += context.activeCharacters.length * 10;
    complexity += context.currentQuests.length * 15;
    complexity += context.recentEvents.length * 5;
    if (context.currentLocation) complexity += 20;
    return Math.min(100, complexity);
  };

  const calculateUrgency = (): number => {
    let urgency = 0;
    // 世界状態に基づく緊急度
    if (context.worldState?.global?.stability < 30) urgency += 40;
    if (context.partyMood === "tired") urgency -= 20;
    if (context.partyMood === "excited") urgency += 20;
    // 時間帯による調整
    if (context.timeOfDay === "night") urgency += 10;
    return Math.max(0, Math.min(100, urgency + 30));
  };

  const identifyOpportunities = (): string[] => {
    const opportunities = [];
    
    if (context.activeCharacters.length > 1) {
      opportunities.push("キャラクター間の相互作用を促進できる");
    }
    
    if (context.currentLocation?.npcs?.length > 0) {
      opportunities.push("NPCとの意味深い会話の機会");
    }
    
    if (context.currentQuests.length === 0) {
      opportunities.push("新しいクエストの導入タイミング");
    }
    
    if (context.worldState?.global?.stability > 70) {
      opportunities.push("平和な探索や世界観描写の時間");
    }

    return opportunities;
  };

  const identifyTensions = (): string[] => {
    const tensions = [];
    
    if (context.worldState?.global?.stability < 50) {
      tensions.push("世界の不安定化による緊張");
    }
    
    if (context.currentQuests.length > 3) {
      tensions.push("複数クエストによる優先度の競合");
    }
    
    if (context.partyMood === "confused") {
      tensions.push("パーティの方向性に関する混乱");
    }

    return tensions;
  };

  const suggestNextSteps = (): string[] => {
    const steps = [];
    
    if (contextAnalysis?.urgency > 70) {
      steps.push("緊急事態への対応を促す");
    } else if (contextAnalysis?.urgency < 30) {
      steps.push("ゆっくりとした世界観描写や休息の時間");
    }
    
    if (context.activeCharacters.some(char => char.stats.hp < char.stats.maxHp * 0.5)) {
      steps.push("回復やリソース補給の機会を提供");
    }
    
    if (context.currentQuests.length === 0) {
      steps.push("新しい冒険の種を蒔く");
    }

    return steps;
  };

  // AI応答生成
  const generateAIResponse = useCallback(async (userInput: string) => {
    setIsProcessing(true);
    
    try {
      // 実際のAI応答生成をシミュレート
      await new Promise(resolve => setTimeout(resolve, responseDelay));
      
      const response: AIResponse = {
        id: `response-${Date.now()}`,
        timestamp: new Date(),
        context: { ...context },
        userInput,
        responseType: determineResponseType(userInput),
        content: await generateResponseContent(userInput),
        followUpOptions: generateFollowUpOptions(userInput),
        contextualHints: generateContextualHints(),
        emotionalTone: determineEmotionalTone(),
        confidence: calculateConfidence(),
        strategicNotes: generateStrategicNotes(),
      };

      setResponseHistory(prev => [...prev, response].slice(-20)); // 最新20件を保持
      onResponse(response);
      
      // 自動的にコンテキストを更新
      if (autoResponse) {
        updateContextBasedOnResponse(response);
      }
      
    } catch (error) {
      console.error("AI応答生成エラー:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [context, currentPersonality, responseDelay, autoResponse]);

  const determineResponseType = (input: string): AIResponse["responseType"] => {
    if (input.includes("ダイス") || input.includes("判定")) return "dice_request";
    if (input.includes("選択") || input.includes("どうする")) return "choice_presentation";
    if (input.includes("話す") || input.includes("会話")) return "dialogue";
    if (input.includes("見る") || input.includes("確認")) return "description";
    if (input.includes("行動") || input.includes("実行")) return "action_request";
    return "narration";
  };

  const generateResponseContent = async (input: string): Promise<string> => {
    // AI人格に基づいた応答生成
    const personality = currentPersonality;
    let baseResponse = "";

    switch (determineResponseType(input)) {
      case "narration":
        baseResponse = generateNarration(input, personality);
        break;
      case "dialogue":
        baseResponse = generateDialogue(input, personality);
        break;
      case "description":
        baseResponse = generateDescription(input, personality);
        break;
      case "action_request":
        baseResponse = generateActionRequest(input, personality);
        break;
      case "dice_request":
        baseResponse = generateDiceRequest(input, personality);
        break;
      case "choice_presentation":
        baseResponse = generateChoicePresentation(input, personality);
        break;
    }

    return enhanceResponseWithContext(baseResponse, personality);
  };

  const generateNarration = (input: string, personality: AIPersonality): string => {
    const templates = [
      "セッションが進行する中で、",
      "物語が展開していく...",
      "この瞬間、冒険者たちは",
      "状況が変化しつつある。",
    ];
    
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    if (personality.traits.storytelling > 70) {
      return `${template} 豊かな想像力を持って状況を描写し、プレイヤーの心を物語の世界に引き込んでいく。`;
    }
    
    return `${template} 状況に応じた適切な進行を心がけている。`;
  };

  const generateDialogue = (input: string, personality: AIPersonality): string => {
    if (context.currentLocation?.npcs?.length > 0) {
      const npc = context.currentLocation.npcs[0];
      return `${npc.name}が話しかける：「${input}についてですが...」`;
    }
    return "NPCとの会話の機会を探しています。";
  };

  const generateDescription = (input: string, personality: AIPersonality): string => {
    if (context.currentLocation) {
      return `${context.currentLocation.name}の詳細な様子が目に入る。${context.currentLocation.description}`;
    }
    return "周囲の状況を詳しく観察する。";
  };

  const generateActionRequest = (input: string, personality: AIPersonality): string => {
    return `${input}を実行するために、どのような行動を取りますか？`;
  };

  const generateDiceRequest = (input: string, personality: AIPersonality): string => {
    const diceTypes = ["d20", "2d6", "1d10"];
    const dice = diceTypes[Math.floor(Math.random() * diceTypes.length)];
    return `${input}の判定のために、${dice}をロールしてください。`;
  };

  const generateChoicePresentation = (input: string, personality: AIPersonality): string => {
    return `${input}について、以下の選択肢があります：`;
  };

  const enhanceResponseWithContext = (baseResponse: string, personality: AIPersonality): string => {
    let enhanced = baseResponse;
    
    // 時間帯による修飾
    if (context.timeOfDay === "night") {
      enhanced = `夜の静けさの中で、${enhanced}`;
    } else if (context.timeOfDay === "morning") {
      enhanced = `朝の清々しい空気の中で、${enhanced}`;
    }
    
    // パーティムードによる調整
    if (context.partyMood === "excited") {
      enhanced += " 一行の興奮が伝わってくる。";
    } else if (context.partyMood === "tired") {
      enhanced += " 疲労の色が見える中でも、冒険は続く。";
    }
    
    return enhanced;
  };

  const generateFollowUpOptions = (input: string): string[] => {
    return [
      "詳しく調べる",
      "別の行動を取る",
      "仲間と相談する",
      "状況を見守る",
    ];
  };

  const generateContextualHints = (): string[] => {
    const hints = [];
    
    if (context.currentQuests.length > 0) {
      hints.push("アクティブなクエストが進行中");
    }
    
    if (context.worldState?.global?.stability < 50) {
      hints.push("世界情勢が不安定");
    }
    
    if (context.activeCharacters.length > 3) {
      hints.push("大きなパーティでの行動");
    }

    return hints;
  };

  const determineEmotionalTone = (): AIResponse["emotionalTone"] => {
    if (context.worldState?.global?.stability < 30) return "challenging";
    if (context.partyMood === "excited") return "exciting";
    if (context.partyMood === "confused") return "sympathetic";
    if (context.sessionTone === "mysterious") return "mysterious";
    return "neutral";
  };

  const calculateConfidence = (): number => {
    let confidence = 70;
    
    if (context.campaign) confidence += 10;
    if (context.currentLocation) confidence += 10;
    if (context.activeCharacters.length > 0) confidence += 5;
    if (contextAnalysis?.complexity < 50) confidence += 5;
    
    return Math.min(100, confidence);
  };

  const generateStrategicNotes = (): string[] => {
    const notes = [];
    
    if (contextAnalysis?.urgency > 70) {
      notes.push("高緊張状況：積極的な進行を");
    }
    
    if (contextAnalysis?.opportunities.length > 0) {
      notes.push("機会活用：" + contextAnalysis.opportunities[0]);
    }
    
    if (context.partyMood === "confused") {
      notes.push("方向性の明確化が必要");
    }

    return notes;
  };

  const updateContextBasedOnResponse = (response: AIResponse) => {
    const updates: Partial<AIGMContext> = {};
    
    // 応答タイプに基づくコンテキスト更新
    if (response.responseType === "action_request") {
      if (context.partyMood === "tired") {
        updates.partyMood = "focused";
      }
    }
    
    if (response.responseType === "dice_request") {
      if (context.partyMood === "confused") {
        updates.partyMood = "cautious";
      }
    }
    
    if (Object.keys(updates).length > 0) {
      onContextUpdate(updates);
    }
  };

  // 手動応答トリガー
  const handleManualResponse = (input: string) => {
    generateAIResponse(input);
  };

  // 人格変更
  const handlePersonalityChange = (personality: AIPersonality) => {
    setCurrentPersonality(personality);
  };

  // 設定エクスポート/インポート
  const exportSettings = () => {
    const settings = {
      personality: currentPersonality,
      autoResponse,
      responseDelay,
      contextSensitivity,
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-gm-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.personality) setCurrentPersonality(settings.personality);
        if (settings.autoResponse !== undefined) setAutoResponse(settings.autoResponse);
        if (settings.responseDelay) setResponseDelay(settings.responseDelay);
        if (settings.contextSensitivity) setContextSensitivity(settings.contextSensitivity);
      } catch (error) {
        console.error('設定インポートエラー:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        高度AI GMシステム
      </Typography>

      {/* メイン制御パネル */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">
              <AIIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              AI GM: {currentPersonality.name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Badge badgeContent={responseHistory.length} color="primary">
                <IconButton onClick={() => setAnalyticsDialog(true)}>
                  <AnalyticsIcon />
                </IconButton>
              </Badge>
              <IconButton onClick={() => setSettingsDialog(true)}>
                <SettingsIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>現在のコンテキスト</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                <Chip label={`${context.activeCharacters.length}人パーティ`} size="small" />
                <Chip label={context.timeOfDay} size="small" />
                <Chip label={context.partyMood} size="small" color="secondary" />
                <Chip label={context.sessionTone} size="small" color="primary" />
              </Box>
              
              {contextAnalysis && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>状況分析</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={contextAnalysis.complexity} 
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption">
                    複雑度: {contextAnalysis.complexity}% | 緊急度: {contextAnalysis.urgency}%
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>AI特性</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                <Chip label={`物語性: ${currentPersonality.traits.storytelling}%`} size="small" />
                <Chip label={`戦術性: ${currentPersonality.traits.tactical}%`} size="small" />
                <Chip label={`即興性: ${currentPersonality.traits.improvisation}%`} size="small" />
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={autoResponse}
                    onChange={(e) => setAutoResponse(e.target.checked)}
                  />
                }
                label="自動応答"
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            onClick={() => handleManualResponse("セッションを進行してください")}
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={16} /> : <ActionIcon />}
          >
            {isProcessing ? "AI思考中..." : "セッション進行"}
          </Button>
          <Button
            onClick={() => handleManualResponse("状況を説明してください")}
            disabled={isProcessing}
          >
            状況説明
          </Button>
          <Button
            onClick={() => handleManualResponse("選択肢を提示してください")}
            disabled={isProcessing}
          >
            選択肢提示
          </Button>
        </CardActions>
      </Card>

      {/* 最近の応答履歴 */}
      {responseHistory.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            最近のAI応答
          </Typography>
          <List>
            {responseHistory.slice(-3).reverse().map((response) => (
              <ListItem key={response.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 1 }}>
                <ListItemIcon>
                  {response.responseType === "dice_request" ? <DiceIcon /> :
                   response.responseType === "dialogue" ? <ConversationIcon /> :
                   response.responseType === "choice_presentation" ? <IdeaIcon /> :
                   <ResponseIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={response.content}
                  secondary={
                    <Box>
                      <Typography variant="caption">
                        {response.timestamp.toLocaleTimeString()} | 
                        タイプ: {response.responseType} | 
                        信頼度: {response.confidence}%
                      </Typography>
                      {response.followUpOptions && (
                        <Box sx={{ mt: 1, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          {response.followUpOptions.map((option, index) => (
                            <Chip 
                              key={index} 
                              label={option} 
                              size="small" 
                              onClick={() => handleManualResponse(option)}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* 設定ダイアログ */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>AI GM設定</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 2 }}>
            <Tab label="人格設定" />
            <Tab label="応答設定" />
            <Tab label="インポート/エクスポート" />
          </Tabs>

          {tabValue === 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>AI人格プリセット</Typography>
              <Grid container spacing={2}>
                {personalityPresets.map((preset) => (
                  <Grid item xs={12} md={6} key={preset.name}>
                    <Card 
                      variant={currentPersonality.name === preset.name ? "outlined" : "elevation"}
                      sx={{ 
                        cursor: "pointer",
                        border: currentPersonality.name === preset.name ? 2 : 0,
                        borderColor: "primary.main"
                      }}
                      onClick={() => handlePersonalityChange(preset)}
                    >
                      <CardContent>
                        <Typography variant="h6">{preset.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {preset.description}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          <Chip label={`物語: ${preset.traits.storytelling}`} size="small" />
                          <Chip label={`戦術: ${preset.traits.tactical}`} size="small" />
                          <Chip label={`RP: ${preset.traits.roleplay}`} size="small" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>応答タイミング</Typography>
              <Slider
                value={responseDelay}
                onChange={(_, value) => setResponseDelay(value as number)}
                min={500}
                max={5000}
                step={500}
                marks={[
                  { value: 1000, label: '1秒' },
                  { value: 3000, label: '3秒' },
                  { value: 5000, label: '5秒' },
                ]}
                valueLabelDisplay="auto"
                sx={{ mb: 3 }}
              />
              
              <Typography variant="subtitle2" sx={{ mb: 2 }}>コンテキスト感度</Typography>
              <Slider
                value={contextSensitivity}
                onChange={(_, value) => setContextSensitivity(value as number)}
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
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Button
                variant="outlined"
                onClick={exportSettings}
                startIcon={<DownloadIcon />}
                sx={{ mr: 2, mb: 2 }}
              >
                設定をエクスポート
              </Button>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mb: 2 }}
              >
                設定をインポート
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={importSettings}
                />
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* 分析ダイアログ */}
      <Dialog open={analyticsDialog} onClose={() => setAnalyticsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>AI GM分析</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2 }}>応答パフォーマンス分析</Typography>
          <Alert severity="info">
            詳細な分析機能は今後実装予定です。
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

export default AdvancedAIGMSystem;
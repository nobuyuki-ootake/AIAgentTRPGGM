import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert,
  Tooltip,
  Badge,
  CircularProgress,
} from "@mui/material";
import {
  Chat as ConversationIcon,
  Person as NPCIcon,
  Psychology as PersonalityIcon,
  ExpandMore,
  Send as SendIcon,
  Mic as VoiceIcon,
  VolumeUp as SpeakIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Mood as EmotionIcon,
  School as KnowledgeIcon,
  Group as RelationshipIcon,
  Event as MemoryIcon,
  Star as FavoriteIcon,
  Warning as ConflictIcon,
  Info as InfoIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  Refresh as ResetIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Visibility as ObserveIcon,
  Speed as QuickIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { TRPGCharacter, BaseLocation } from "@trpg-ai-gm/types";

interface NPCPersonality {
  name: string;
  description: string;
  traits: {
    friendliness: number; // 0-100: 親しみやすさ
    honesty: number; // 0-100: 正直さ
    intelligence: number; // 0-100: 知性
    curiosity: number; // 0-100: 好奇心
    caution: number; // 0-100: 慎重さ
    humor: number; // 0-100: ユーモア
    formality: number; // 0-100: 礼儀正しさ
  };
  speechPatterns: {
    verbosity: "concise" | "normal" | "verbose"; // 話の長さ
    tone: "formal" | "casual" | "rough" | "polite"; // 口調
    dialect: "standard" | "regional" | "archaic" | "modern"; // 方言・言葉遣い
    emotiveness: "stoic" | "balanced" | "expressive"; // 感情表現
  };
  background: {
    occupation: string;
    socialClass: "peasant" | "merchant" | "noble" | "clergy" | "military" | "scholar";
    education: "none" | "basic" | "advanced" | "specialized";
    experiences: string[]; // 人生経験
  };
  currentState: {
    mood: "happy" | "sad" | "angry" | "fearful" | "excited" | "calm" | "suspicious" | "friendly";
    energy: number; // 0-100: 活力
    stress: number; // 0-100: ストレス
    trust: { [characterId: string]: number }; // キャラクターごとの信頼度
  };
  knowledge: {
    topics: string[]; // 知っている話題
    secrets: string[]; // 秘密の情報
    rumors: string[]; // 噂や憶測
    personalMemories: string[]; // 個人的な記憶
  };
  relationships: {
    [characterId: string]: {
      type: "friend" | "enemy" | "neutral" | "family" | "lover" | "rival" | "mentor" | "student";
      strength: number; // 0-100: 関係の強さ
      history: string[]; // 関係の歴史
    };
  };
}

interface ConversationContext {
  location: BaseLocation | null;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  weather: string;
  recentEvents: string[];
  presentCharacters: TRPGCharacter[];
  conversationTopic?: string;
  conversationGoal?: "information" | "persuasion" | "intimidation" | "befriend" | "trade" | "casual";
  urgency: "low" | "medium" | "high";
  privacy: "public" | "private" | "secret";
}

interface ConversationMessage {
  id: string;
  timestamp: Date;
  speaker: "player" | "npc";
  speakerId: string;
  content: string;
  intent?: string; // プレイヤーの意図
  emotion: string; // 話者の感情
  bodyLanguage?: string; // 身振り手振り
  tone: "neutral" | "friendly" | "hostile" | "suspicious" | "excited" | "sad" | "angry";
  confidence: number; // 0-100: 発言の確信度
  aiGeneratedHints?: string[]; // AIが生成したヒント
}

interface ConversationSession {
  id: string;
  npcId: string;
  startTime: Date;
  endTime?: Date;
  context: ConversationContext;
  messages: ConversationMessage[];
  outcomes: {
    informationGained: string[];
    relationshipChanges: { [characterId: string]: number };
    questProgress: string[];
    moodChanges: string[];
  };
  summary: string;
}

interface NaturalNPCConversationAIProps {
  npcs: any[];
  characters: TRPGCharacter[];
  currentLocation?: BaseLocation;
  currentContext?: ConversationContext;
  onConversationUpdate: (session: ConversationSession) => void;
  onRelationshipChange: (npcId: string, characterId: string, change: number) => void;
}

const NaturalNPCConversationAI: React.FC<NaturalNPCConversationAIProps> = ({
  npcs,
  characters,
  currentLocation,
  currentContext,
  onConversationUpdate,
  onRelationshipChange,
}) => {
  const [activeConversation, setActiveConversation] = useState<ConversationSession | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<any>(null);
  const [npcPersonalities, setNpcPersonalities] = useState<{ [npcId: string]: NPCPersonality }>({});
  const [playerInput, setPlayerInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationSession[]>([]);
  
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [personalityDialog, setPersonalityDialog] = useState(false);
  const [editingNPC, setEditingNPC] = useState<string | null>(null);
  
  const [aiSettings, setAiSettings] = useState({
    responseSpeed: 2000, // ms
    creativityLevel: 0.7, // 0-1
    emotionalDepth: 0.8, // 0-1
    memoryStrength: 0.9, // 0-1
    consistencyCheck: true,
    contextAwareness: 0.8, // 0-1
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // NPCの初期人格生成
  useEffect(() => {
    npcs.forEach(npc => {
      if (!npcPersonalities[npc.id]) {
        generateNPCPersonality(npc);
      }
    });
  }, [npcs]);

  // メッセージリストの自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // NPCの人格生成
  const generateNPCPersonality = (npc: any) => {
    const personality: NPCPersonality = {
      name: npc.name,
      description: npc.description || "一般的な住民",
      traits: {
        friendliness: 50 + Math.floor(Math.random() * 40),
        honesty: 30 + Math.floor(Math.random() * 50),
        intelligence: 40 + Math.floor(Math.random() * 40),
        curiosity: 30 + Math.floor(Math.random() * 60),
        caution: 40 + Math.floor(Math.random() * 40),
        humor: 20 + Math.floor(Math.random() * 60),
        formality: determineFormality(npc),
      },
      speechPatterns: {
        verbosity: getRandomElement(["concise", "normal", "verbose"]),
        tone: determineTone(npc),
        dialect: "standard",
        emotiveness: getRandomElement(["stoic", "balanced", "expressive"]),
      },
      background: {
        occupation: npc.role || "村人",
        socialClass: determineSocialClass(npc),
        education: determineEducation(npc),
        experiences: generateExperiences(npc),
      },
      currentState: {
        mood: "calm",
        energy: 60 + Math.floor(Math.random() * 30),
        stress: Math.floor(Math.random() * 40),
        trust: {},
      },
      knowledge: {
        topics: generateKnownTopics(npc),
        secrets: [],
        rumors: generateRumors(),
        personalMemories: [],
      },
      relationships: {},
    };

    setNpcPersonalities(prev => ({ ...prev, [npc.id]: personality }));
  };

  const determineFormality = (npc: any): number => {
    if (npc.role?.includes("貴族") || npc.role?.includes("騎士")) return 80;
    if (npc.role?.includes("商人")) return 60;
    if (npc.role?.includes("農民")) return 30;
    return 50;
  };

  const determineTone = (npc: any): NPCPersonality["speechPatterns"]["tone"] => {
    if (npc.role?.includes("貴族")) return "formal";
    if (npc.role?.includes("盗賊")) return "rough";
    if (npc.role?.includes("聖職者")) return "polite";
    return "casual";
  };

  const determineSocialClass = (npc: any): NPCPersonality["background"]["socialClass"] => {
    if (npc.role?.includes("貴族")) return "noble";
    if (npc.role?.includes("商人")) return "merchant";
    if (npc.role?.includes("聖職者")) return "clergy";
    if (npc.role?.includes("騎士") || npc.role?.includes("兵士")) return "military";
    if (npc.role?.includes("学者")) return "scholar";
    return "peasant";
  };

  const determineEducation = (npc: any): NPCPersonality["background"]["education"] => {
    if (npc.role?.includes("学者") || npc.role?.includes("魔法使い")) return "advanced";
    if (npc.role?.includes("聖職者") || npc.role?.includes("商人")) return "basic";
    if (npc.role?.includes("貴族")) return "specialized";
    return "none";
  };

  const generateExperiences = (npc: any): string[] => {
    const experiences = ["地域での生活", "日常的な仕事"];
    if (npc.role?.includes("商人")) experiences.push("他地域での取引経験");
    if (npc.role?.includes("冒険者")) experiences.push("危険な冒険の経験");
    return experiences;
  };

  const generateKnownTopics = (npc: any): string[] => {
    const topics = ["天気", "地域の出来事", "日常生活"];
    if (npc.role?.includes("商人")) topics.push("貿易", "経済", "他地域の情報");
    if (npc.role?.includes("学者")) topics.push("歴史", "魔法", "古代の知識");
    if (npc.role?.includes("農民")) topics.push("農業", "季節", "自然");
    return topics;
  };

  const generateRumors = (): string[] => {
    return [
      "最近の奇妙な出来事について",
      "他の村での不思議な話",
      "古い伝説や言い伝え",
    ];
  };

  const getRandomElement = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };

  // 会話開始
  const startConversation = (npc: any) => {
    const session: ConversationSession = {
      id: `conversation-${Date.now()}`,
      npcId: npc.id,
      startTime: new Date(),
      context: currentContext || {
        location: currentLocation || null,
        timeOfDay: "afternoon",
        weather: "晴れ",
        recentEvents: [],
        presentCharacters: characters,
        urgency: "low",
        privacy: "public",
      },
      messages: [],
      outcomes: {
        informationGained: [],
        relationshipChanges: {},
        questProgress: [],
        moodChanges: [],
      },
      summary: "",
    };

    setActiveConversation(session);
    setSelectedNPC(npc);

    // 初期挨拶メッセージを生成
    generateNPCResponse("", session, true);
  };

  // プレイヤーメッセージ送信
  const sendPlayerMessage = async () => {
    if (!playerInput.trim() || !activeConversation || isProcessing) return;

    const playerMessage: ConversationMessage = {
      id: `message-${Date.now()}`,
      timestamp: new Date(),
      speaker: "player",
      speakerId: "player",
      content: playerInput,
      emotion: "neutral",
      tone: "neutral",
      confidence: 80,
    };

    const updatedSession = {
      ...activeConversation,
      messages: [...activeConversation.messages, playerMessage],
    };

    setActiveConversation(updatedSession);
    setPlayerInput("");

    // NPCの応答を生成
    await generateNPCResponse(playerInput, updatedSession);
  };

  // NPC応答生成
  const generateNPCResponse = async (playerInput: string, session: ConversationSession, isGreeting: boolean = false) => {
    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, aiSettings.responseSpeed));

      const npcPersonality = npcPersonalities[session.npcId];
      if (!npcPersonality) return;

      const response = await createNPCResponse(playerInput, session, npcPersonality, isGreeting);
      
      const npcMessage: ConversationMessage = {
        id: `message-${Date.now()}`,
        timestamp: new Date(),
        speaker: "npc",
        speakerId: session.npcId,
        content: response.content,
        emotion: response.emotion,
        tone: response.tone,
        confidence: response.confidence,
        bodyLanguage: response.bodyLanguage,
        aiGeneratedHints: response.hints,
      };

      const updatedSession = {
        ...session,
        messages: [...session.messages, npcMessage],
      };

      setActiveConversation(updatedSession);
      onConversationUpdate(updatedSession);

      // 関係性の変化をチェック
      updateRelationships(response, session);

    } catch (error) {
      console.error("NPC応答生成エラー:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // NPC応答の作成
  const createNPCResponse = async (playerInput: string, session: ConversationSession, personality: NPCPersonality, isGreeting: boolean) => {
    let content = "";
    let emotion = personality.currentState.mood;
    let tone: ConversationMessage["tone"] = "neutral";
    let confidence = 70;
    let bodyLanguage = "";
    let hints: string[] = [];

    if (isGreeting) {
      content = generateGreeting(personality, session.context);
      emotion = "friendly";
      tone = "friendly";
    } else {
      content = generateResponseContent(playerInput, personality, session);
      const analysis = analyzePlayerInput(playerInput);
      emotion = determineEmotionalResponse(analysis, personality);
      tone = determineToneResponse(analysis, personality);
      confidence = calculateConfidence(analysis, personality);
      bodyLanguage = generateBodyLanguage(emotion, personality);
      hints = generateConversationHints(analysis, personality, session);
    }

    return {
      content: enhanceWithPersonality(content, personality),
      emotion,
      tone,
      confidence,
      bodyLanguage,
      hints,
    };
  };

  const generateGreeting = (personality: NPCPersonality, context: ConversationContext): string => {
    const greetings = {
      formal: ["ご挨拶申し上げます", "お忙しい中失礼いたします", "お疲れ様でございます"],
      casual: ["やあ、こんにちは", "おつかれさま", "どうも"],
      rough: ["よう", "おい", "何か用か？"],
      polite: ["こんにちは", "お疲れ様です", "良い日ですね"],
    };

    const timeGreetings = {
      morning: "おはようございます",
      afternoon: "こんにちは",
      evening: "こんばんは",
      night: "夜分に失礼します",
    };

    let greeting = greetings[personality.speechPatterns.tone][0];
    
    if (personality.traits.friendliness > 70) {
      greeting = timeGreetings[context.timeOfDay];
    }

    return greeting + "。何かご用でしょうか？";
  };

  const generateResponseContent = (input: string, personality: NPCPersonality, session: ConversationSession): string => {
    const inputLower = input.toLowerCase();
    
    // 質問パターンの検出
    if (inputLower.includes("知って") || inputLower.includes("教えて")) {
      return generateInformationResponse(input, personality);
    }
    
    if (inputLower.includes("どう思う") || inputLower.includes("意見")) {
      return generateOpinionResponse(input, personality);
    }
    
    if (inputLower.includes("助けて") || inputLower.includes("頼み")) {
      return generateHelpResponse(input, personality);
    }

    // デフォルト応答
    return generateDefaultResponse(input, personality);
  };

  const generateInformationResponse = (input: string, personality: NPCPersonality): string => {
    if (personality.traits.honesty > 70 && personality.traits.intelligence > 60) {
      return "それについては詳しく知っています。お話ししましょう。";
    } else if (personality.traits.caution > 70) {
      return "申し訳ありませんが、それについてはよく分からないのです。";
    }
    return "そうですね...少しは知っているかもしれません。";
  };

  const generateOpinionResponse = (input: string, personality: NPCPersonality): string => {
    if (personality.traits.intelligence > 70) {
      return "興味深い質問ですね。私としては...";
    } else if (personality.traits.caution > 70) {
      return "う〜ん、難しい質問ですね。";
    }
    return "そうですね、私の考えでは...";
  };

  const generateHelpResponse = (input: string, personality: NPCPersonality): string => {
    if (personality.traits.friendliness > 70) {
      return "もちろんです！喜んでお手伝いします。";
    } else if (personality.traits.caution > 70) {
      return "どのようなお手伝いでしょうか？";
    }
    return "可能な範囲でお手伝いします。";
  };

  const generateDefaultResponse = (input: string, personality: NPCPersonality): string => {
    const responses = [
      "なるほど、そうですか。",
      "興味深い話ですね。",
      "それは初耳です。",
      "そういうこともあるでしょうね。",
    ];
    
    return getRandomElement(responses);
  };

  const analyzePlayerInput = (input: string) => {
    return {
      intent: "unknown",
      emotion: "neutral",
      politeness: input.includes("ください") || input.includes("お願い") ? "polite" : "neutral",
      urgency: input.includes("急") || input.includes("すぐ") ? "high" : "low",
      topics: extractTopics(input),
    };
  };

  const extractTopics = (input: string): string[] => {
    const topics = [];
    if (input.includes("天気")) topics.push("weather");
    if (input.includes("仕事")) topics.push("work");
    if (input.includes("家族")) topics.push("family");
    return topics;
  };

  const determineEmotionalResponse = (analysis: any, personality: NPCPersonality): string => {
    if (analysis.politeness === "polite" && personality.traits.friendliness > 60) {
      return "happy";
    }
    if (analysis.urgency === "high" && personality.traits.caution > 70) {
      return "suspicious";
    }
    return personality.currentState.mood;
  };

  const determineToneResponse = (analysis: any, personality: NPCPersonality): ConversationMessage["tone"] => {
    if (personality.traits.friendliness > 80) return "friendly";
    if (personality.traits.caution > 80) return "suspicious";
    return "neutral";
  };

  const calculateConfidence = (analysis: any, personality: NPCPersonality): number => {
    let confidence = 70;
    if (personality.traits.intelligence > 80) confidence += 15;
    if (personality.traits.honesty > 80) confidence += 10;
    if (analysis.topics.length > 0) confidence += 5;
    return Math.min(100, confidence);
  };

  const generateBodyLanguage = (emotion: string, personality: NPCPersonality): string => {
    const bodyLanguageMap = {
      happy: ["微笑んでいる", "目を輝かせている", "身を乗り出している"],
      suspicious: ["眉をひそめている", "警戒している様子", "一歩後ずさりしている"],
      calm: ["落ち着いている", "穏やかな表情", "リラックスしている"],
      excited: ["興奮している", "身振り手振りが大きい", "早口になっている"],
    };

    const expressions = bodyLanguageMap[emotion as keyof typeof bodyLanguageMap] || ["普通の表情"];
    return getRandomElement(expressions);
  };

  const generateConversationHints = (analysis: any, personality: NPCPersonality, session: ConversationSession): string[] => {
    const hints = [];
    
    if (personality.traits.friendliness > 70) {
      hints.push("この人は親しみやすそうです");
    }
    
    if (personality.knowledge.topics.length > 3) {
      hints.push("この人は多くのことを知っているようです");
    }
    
    if (personality.traits.honesty < 50) {
      hints.push("何か隠していることがあるかもしれません");
    }

    return hints;
  };

  const enhanceWithPersonality = (content: string, personality: NPCPersonality): string => {
    let enhanced = content;

    // 話し方の調整
    if (personality.speechPatterns.verbosity === "verbose") {
      enhanced = "実のところ、" + enhanced + "と思うのです。";
    } else if (personality.speechPatterns.verbosity === "concise") {
      enhanced = enhanced.split("。")[0] + "。";
    }

    // 口調の調整
    if (personality.speechPatterns.tone === "formal") {
      enhanced = enhanced.replace("です", "でございます");
    } else if (personality.speechPatterns.tone === "rough") {
      enhanced = enhanced.replace("です", "だ").replace("。", "。");
    }

    return enhanced;
  };

  const updateRelationships = (response: any, session: ConversationSession) => {
    // 関係性の変化をシミュレート
    const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
    if (change !== 0) {
      onRelationshipChange(session.npcId, "player", change);
    }
  };

  // 会話終了
  const endConversation = () => {
    if (!activeConversation) return;

    const endedSession = {
      ...activeConversation,
      endTime: new Date(),
      summary: generateConversationSummary(activeConversation),
    };

    setConversationHistory(prev => [endedSession, ...prev].slice(0, 10));
    setActiveConversation(null);
    setSelectedNPC(null);
  };

  const generateConversationSummary = (session: ConversationSession): string => {
    const messageCount = session.messages.length;
    const npc = npcs.find(n => n.id === session.npcId);
    return `${npc?.name || "NPC"}との${messageCount}回のやり取りが行われました。`;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        自然なNPC会話AI
      </Typography>

      {/* NPC選択 */}
      {!activeConversation && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            会話するNPCを選択
          </Typography>
          <Grid container spacing={2}>
            {npcs.map((npc) => (
              <Grid item xs={12} sm={6} md={4} key={npc.id}>
                <Card 
                  sx={{ cursor: "pointer", "&:hover": { elevation: 4 } }}
                  onClick={() => startConversation(npc)}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Avatar sx={{ mr: 2 }}>
                        <NPCIcon />
                      </Avatar>
                      <Typography variant="h6">{npc.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {npc.role || "住民"}
                    </Typography>
                    
                    {npcPersonalities[npc.id] && (
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        <Chip 
                          label={`親しみやすさ: ${npcPersonalities[npc.id].traits.friendliness}%`} 
                          size="small" 
                        />
                        <Chip 
                          label={npcPersonalities[npc.id].speechPatterns.tone} 
                          size="small" 
                          color="secondary"
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* アクティブ会話 */}
      {activeConversation && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">
              <ConversationIcon sx={{ verticalAlign: "middle", mr: 1 }} />
              {selectedNPC?.name}との会話
            </Typography>
            <Box>
              <IconButton onClick={() => setPersonalityDialog(true)}>
                <PersonalityIcon />
              </IconButton>
              <IconButton onClick={() => setSettingsDialog(true)}>
                <SettingsIcon />
              </IconButton>
              <Button color="error" onClick={endConversation}>
                会話終了
              </Button>
            </Box>
          </Box>

          {/* メッセージ履歴 */}
          <Box sx={{ height: 400, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1, p: 1, mb: 2 }}>
            {activeConversation.messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: "flex",
                  justifyContent: message.speaker === "player" ? "flex-end" : "flex-start",
                  mb: 2,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    maxWidth: "70%",
                    backgroundColor: message.speaker === "player" ? "primary.light" : "grey.100",
                    color: message.speaker === "player" ? "primary.contrastText" : "text.primary",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Avatar size="small" sx={{ width: 24, height: 24, mr: 1 }}>
                      {message.speaker === "player" ? "P" : "N"}
                    </Avatar>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {message.timestamp.toLocaleTimeString()}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    {message.content}
                  </Typography>
                  
                  {message.bodyLanguage && (
                    <Typography variant="caption" sx={{ fontStyle: "italic", opacity: 0.7 }}>
                      ({message.bodyLanguage})
                    </Typography>
                  )}
                  
                  {message.aiGeneratedHints && message.aiGeneratedHints.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {message.aiGeneratedHints.map((hint, index) => (
                        <Chip key={index} label={hint} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </Box>
                  )}
                </Paper>
              </Box>
            ))}
            
            {isProcessing && (
              <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
                <Paper elevation={1} sx={{ p: 2, backgroundColor: "grey.100" }}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {selectedNPC?.name}が考えています...
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* 入力エリア */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              placeholder="メッセージを入力..."
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendPlayerMessage()}
              disabled={isProcessing}
            />
            <Button
              variant="contained"
              onClick={sendPlayerMessage}
              disabled={!playerInput.trim() || isProcessing}
              startIcon={<SendIcon />}
            >
              送信
            </Button>
          </Box>
        </Paper>
      )}

      {/* 会話履歴 */}
      {conversationHistory.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            会話履歴
          </Typography>
          <List>
            {conversationHistory.map((session) => {
              const npc = npcs.find(n => n.id === session.npcId);
              return (
                <ListItem key={session.id} divider>
                  <ListItemIcon>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${npc?.name || "不明なNPC"}との会話`}
                    secondary={`${session.startTime.toLocaleString()} - ${session.messages.length}メッセージ`}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}

      {/* 設定ダイアログ */}
      <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>AI会話設定</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>応答速度 (ms)</Typography>
          <Slider
            value={aiSettings.responseSpeed}
            onChange={(_, value) => setAiSettings(prev => ({ ...prev, responseSpeed: value as number }))}
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
          
          <Typography variant="subtitle2" sx={{ mb: 1 }}>創造性レベル</Typography>
          <Slider
            value={aiSettings.creativityLevel}
            onChange={(_, value) => setAiSettings(prev => ({ ...prev, creativityLevel: value as number }))}
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
          
          <FormControlLabel
            control={
              <Switch
                checked={aiSettings.consistencyCheck}
                onChange={(e) => setAiSettings(prev => ({ ...prev, consistencyCheck: e.target.checked }))}
              />
            }
            label="一貫性チェック"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialog(false)}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* 人格詳細ダイアログ */}
      <Dialog open={personalityDialog} onClose={() => setPersonalityDialog(false)} maxWidth="md" fullWidth>
        {selectedNPC && npcPersonalities[selectedNPC.id] && (
          <>
            <DialogTitle>{selectedNPC.name}の人格詳細</DialogTitle>
            <DialogContent>
              <Typography variant="h6" sx={{ mb: 2 }}>性格特性</Typography>
              <Grid container spacing={2}>
                {Object.entries(npcPersonalities[selectedNPC.id].traits).map(([trait, value]) => (
                  <Grid item xs={6} key={trait}>
                    <Typography variant="body2">
                      {trait}: {value}%
                    </Typography>
                    <LinearProgress variant="determinate" value={value} sx={{ mt: 0.5 }} />
                  </Grid>
                ))}
              </Grid>
              
              <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>話し方</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip label={`口調: ${npcPersonalities[selectedNPC.id].speechPatterns.tone}`} />
                <Chip label={`話の長さ: ${npcPersonalities[selectedNPC.id].speechPatterns.verbosity}`} />
                <Chip label={`感情表現: ${npcPersonalities[selectedNPC.id].speechPatterns.emotiveness}`} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPersonalityDialog(false)}>
                閉じる
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default NaturalNPCConversationAI;
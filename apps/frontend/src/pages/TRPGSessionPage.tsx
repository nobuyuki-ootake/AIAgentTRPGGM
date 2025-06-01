import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  TextField,
  Divider,
} from "@mui/material";
import {
  Map as MapIcon,
  Assignment,
  Bolt,
  Save,
  Casino,
} from "@mui/icons-material";
import { useRecoilState } from "recoil";
import { currentCampaignState, sessionStateAtom } from "../store/atoms";
import { AIAssistButton } from "../components/ui/AIAssistButton";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { v4 as uuidv4 } from "uuid";
import { TRPGCharacter, GameSession } from "@novel-ai-assistant/types";
import ChatInterface, { ChatMessage, DiceRoll } from "../components/trpg-session/ChatInterface";
import DiceRollUI from "../components/trpg-session/DiceRollUI";
import CharacterDisplay from "../components/trpg-session/CharacterDisplay";


const TRPGSessionPage: React.FC = () => {
  const [currentCampaign] = useRecoilState(currentCampaignState);
  const [sessionState, setSessionState] = useRecoilState(sessionStateAtom);
  const [tabValue, setTabValue] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<TRPGCharacter | null>(null);
  const [diceDialog, setDiceDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [combatMode, setCombatMode] = useState(false);
  const [initiativeOrder, setInitiativeOrder] = useState<string[]>([]);
  const [selectedEnemies, setSelectedEnemies] = useState<string[]>([]);

  const { openAIAssist } = useAIChatIntegration();

  // プレイヤーキャラクター取得
  const playerCharacters = currentCampaign?.characters?.filter(c => c.characterType === "PC") || [];
  const npcs = currentCampaign?.npcs || [];
  const enemies = currentCampaign?.enemies || [];

  // セッション開始時の初期化
  useEffect(() => {
    if (!sessionState) {
      const newSession: GameSession = {
        id: uuidv4(),
        campaignId: currentCampaign?.id || "",
        sessionNumber: (currentCampaign?.sessions?.length || 0) + 1,
        title: `セッション ${(currentCampaign?.sessions?.length || 0) + 1}`,
        date: new Date(),
        summary: "",
        npcsEncountered: [],
        combatEncounters: [],
        lootObtained: [],
        questProgress: {},
        playerNotes: {},
        gmNotes: "",
        recordingUrl: "",
        duration: 0,
      };
      setSessionState(newSession);
    }
  }, [sessionState, setSessionState, currentCampaign]);

  // タブ変更ハンドラ
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // チャット送信
  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: uuidv4(),
      sender: "GM",
      senderType: "gm",
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatInput("");
  };

  // ダイスロール
  const handleDiceRoll = (diceRoll: DiceRoll) => {
    const newMessage: ChatMessage = {
      id: uuidv4(),
      sender: selectedCharacter?.name || "システム",
      senderType: "system",
      message: `${diceRoll.purpose}: ${diceRoll.dice} = [${diceRoll.rolls.join(", ")}] = ${diceRoll.total}`,
      timestamp: new Date(),
      diceRoll,
    };

    setChatMessages([...chatMessages, newMessage]);
  };

  // AIゲームマスターアシスト
  const handleAIGameMaster = () => {
    const context = {
      currentScene: sessionNotes,
      playerCharacters: playerCharacters.map(c => ({ name: c.name, stats: c.stats })),
      npcsPresent: npcs.filter(n => sessionState?.npcsEncountered?.includes(n.id)),
      combatMode,
    };

    openAIAssist(
      "session-gm",
      {
        title: "AIゲームマスターアシスタント",
        description: "現在のシーンに基づいて、GMとしてのアドバイスや展開を提案します。",
        defaultMessage: `現在のシーン:
${sessionNotes || "セッション開始"}

プレイヤーキャラクター:
${playerCharacters.map(c => `- ${c.name} (${c.class}, レベル${c.stats?.level || 1})`).join('\n')}

以下について提案してください：
1. 次の展開案
2. NPCの反応や台詞
3. 環境描写
4. 可能なスキルチェック`,
        onComplete: (result) => {
          if (result.content) {
            const gmMessage: ChatMessage = {
              id: uuidv4(),
              sender: "AIゲームマスター",
              senderType: "gm",
              message: result.content as string,
              timestamp: new Date(),
            };
            setChatMessages([...chatMessages, gmMessage]);
          }
        },
      },
      context
    );
  };

  // 戦闘開始
  const handleStartCombat = () => {
    setCombatMode(true);
    // イニシアチブ順の計算（簡易版）
    const allCombatants = [
      ...playerCharacters,
      ...enemies.filter(e => selectedEnemies.includes(e.id)),
    ];
    
    const sortedByInitiative = allCombatants
      .map(c => ({
        id: c.id,
        name: c.name,
        initiative: Math.floor(Math.random() * 20) + 1 + Math.floor((c.stats?.dexterity || 10 - 10) / 2),
      }))
      .sort((a, b) => b.initiative - a.initiative)
      .map(c => c.id);
    
    setInitiativeOrder(sortedByInitiative);
  };

  // エネミー選択の切り替え
  const handleEnemyToggle = (enemyId: string) => {
    setSelectedEnemies(prev =>
      prev.includes(enemyId)
        ? prev.filter(id => id !== enemyId)
        : [...prev, enemyId]
    );
  };

  // キャラクター選択
  const handleCharacterSelect = (character: any) => {
    setSelectedCharacter(character);
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ヘッダー */}
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {currentCampaign?.title || "キャンペーン"}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {sessionState?.title || "新規セッション"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {combatMode && (
              <Chip
                icon={<Bolt />}
                label="戦闘中"
                color="error"
                variant="filled"
              />
            )}
            <AIAssistButton
              onAssist={handleAIGameMaster}
              text="AIゲームマスター"
              variant="default"
              showHelp={true}
              helpText="AIがゲームマスターとして展開を提案します"
            />
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => {
                // セッション保存処理
                console.log("セッション保存");
              }}
            >
              セッション保存
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* メインコンテンツ */}
      <Box sx={{ flex: 1, display: "flex", gap: 2, overflow: "hidden" }}>
        {/* 左サイドバー - キャラクター情報 */}
        <Paper sx={{ width: 300, display: "flex", flexDirection: "column" }}>
          <CharacterDisplay
            playerCharacters={playerCharacters}
            npcs={npcs}
            enemies={enemies}
            selectedCharacter={selectedCharacter}
            selectedEnemies={selectedEnemies}
            tabValue={tabValue}
            combatMode={combatMode}
            onTabChange={handleTabChange}
            onCharacterSelect={handleCharacterSelect}
            onEnemyToggle={handleEnemyToggle}
            onStartCombat={handleStartCombat}
          />
        </Paper>

        {/* 中央 - チャット・メインビュー */}
        <Paper sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <ChatInterface
            messages={chatMessages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSendMessage={handleSendChat}
            onOpenDiceDialog={() => setDiceDialog(true)}
          />
        </Paper>

        {/* 右サイドバー - ツール・ノート */}
        <Paper sx={{ width: 350, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            セッションノート
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="セッションの進行状況をメモ..."
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            クイックツール
          </Typography>
          <Stack spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Casino />}
              onClick={() => setDiceDialog(true)}
              fullWidth
            >
              ダイスロール
            </Button>
            <Button
              variant="outlined"
              startIcon={<MapIcon />}
              fullWidth
            >
              マップ表示
            </Button>
            <Button
              variant="outlined"
              startIcon={<Assignment />}
              fullWidth
            >
              クエスト進捗
            </Button>
          </Stack>

          {combatMode && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                イニシアチブ順
              </Typography>
              <List dense>
                {initiativeOrder.map((id, index) => {
                  const character = [...playerCharacters, ...enemies].find(c => c.id === id);
                  return (
                    <ListItem key={id}>
                      <ListItemText
                        primary={`${index + 1}. ${character?.name}`}
                        secondary={character?.characterType}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
        </Paper>
      </Box>

      {/* ダイスロールダイアログ */}
      <DiceRollUI
        open={diceDialog}
        onClose={() => setDiceDialog(false)}
        onRoll={handleDiceRoll}
        selectedCharacterName={selectedCharacter?.name}
      />
    </Box>
  );
};

export default TRPGSessionPage;
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Tabs,
  Tab,
  Fade,
  Slide,
} from "@mui/material";
import {
  Send as SendIcon,
  Close as CloseIcon,
  ExpandLess,
  ExpandMore,
  ChatBubble as ChatBubbleIcon,
  Settings as SettingsIcon,
  AutoFixHigh as AutoFixHighIcon,
} from "@mui/icons-material";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  aiChatPanelOpenState,
  selectedElementsState,
  aiChatHistoryState,
  currentMessageState,
  aiLoadingState,
  ChatMessage,
  aiChatTabState,
  AIChatTabType,
} from "../../store/atoms";
import { v4 as uuidv4 } from "uuid";
import { AISettingsTab } from "./AISettingsTab";
import { AIAssistTab } from "./AIAssistTab";
import {
  AIProvider,
  availableModels,
  ProviderSettings,
} from "../../types/aiSettings";
import { aiAgentApi } from "../../api/aiAgent";
import { HelpTooltip } from "../ui/HelpTooltip";

// AIとのメッセージのやり取りを表示するコンポーネント
const ChatMessageItem: React.FC<{ message: ChatMessage; index: number }> =
  React.memo(({ message, index }) => {
    return (
      <Slide
        direction="up"
        in={true}
        timeout={300 + index * 100} // メッセージごとに遅延
        mountOnEnter
        unmountOnExit
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: message.role === "user" ? "flex-end" : "flex-start",
            mb: 2,
            maxWidth: "80%",
            alignSelf: message.role === "user" ? "flex-end" : "flex-start",
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor:
                message.role === "user" ? "primary.light" : "background.paper",
              color: message.role === "user" ? "white" : "text.primary",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                elevation: 3,
                transform: "translateY(-1px)",
              },
            }}
          >
            <Typography variant="body1">{message.content}</Typography>
          </Paper>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, mx: 1 }}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </Slide>
    );
  });

ChatMessageItem.displayName = "ChatMessageItem";

// ローディング中のメッセージ表示
const LoadingMessage: React.FC = React.memo(() => {
  return (
    <Fade in={true} timeout={300}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          mb: 2,
          maxWidth: "80%",
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "background.paper",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="body1" color="text.secondary">
            AIが回答を生成中...
          </Typography>
        </Paper>
      </Box>
    </Fade>
  );
});

LoadingMessage.displayName = "LoadingMessage";

// 選択された要素を表示するコンポーネント
const SelectedContext: React.FC = React.memo(() => {
  const selectedElements = useRecoilValue(selectedElementsState);
  const [open, setOpen] = useState(true);

  const handleToggle = useCallback(() => {
    setOpen(!open);
  }, [open]);

  const memoizedElements = useMemo(() => {
    return selectedElements.map((element, index) => (
      <Slide
        key={element.id}
        direction="right"
        in={true}
        timeout={200 + index * 50}
        mountOnEnter
      >
        <ListItem>
          <Chip
            label={`${element.content.title}`}
            size="small"
            sx={{
              mr: 1,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
            color="primary"
            variant="outlined"
          />
          <ListItemText
            primary={element.type}
            secondary={element.content.description}
            primaryTypographyProps={{ variant: "caption" }}
            secondaryTypographyProps={{ variant: "caption" }}
          />
        </ListItem>
      </Slide>
    ));
  }, [selectedElements]);

  if (selectedElements.length === 0) {
    return null;
  }

  return (
    <Fade in={true} timeout={500}>
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            transition: "background-color 0.2s ease-in-out",
            borderRadius: 1,
            p: 0.5,
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
          onClick={handleToggle}
        >
          <Typography variant="subtitle2" color="text.secondary">
            選択中の要素 ({selectedElements.length})
          </Typography>
          {open ? <ExpandLess /> : <ExpandMore />}
        </Box>
        <Collapse in={open} timeout={300}>
          <List dense sx={{ mt: 1 }}>
            {memoizedElements}
          </List>
        </Collapse>
        <Divider sx={{ mt: 1 }} />
      </Box>
    </Fade>
  );
});

SelectedContext.displayName = "SelectedContext";

const AIChatPanel: React.FC = () => {
  // Recoilの状態
  const [isOpen, setIsOpen] = useRecoilState(aiChatPanelOpenState);
  const [chatHistory, setChatHistory] = useRecoilState(aiChatHistoryState);
  const [currentMessage, setCurrentMessage] =
    useRecoilState(currentMessageState);
  const [isLoading, setIsLoading] = useRecoilState(aiLoadingState);
  const [activeTab, setActiveTab] = useRecoilState(aiChatTabState);
  const selectedElements = useRecoilValue(selectedElementsState);

  // 設定関連の状態
  const [activeProvider, setActiveProvider] = useState<AIProvider>("openai");
  const [settings, setSettings] = useState<
    Record<AIProvider, ProviderSettings | undefined>
  >({
    openai: undefined,
    anthropic: undefined,
    gemini: undefined,
    custom: undefined,
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // 設定の読み込み
  const loadSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    setSettingsError(null);

    try {
      const apiSettings = await aiAgentApi.getApiSettings();
      setSettings(apiSettings);
    } catch (err) {
      setSettingsError("設定の読み込みに失敗しました");
      console.error("設定読み込みエラー:", err);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  // 設定の読み込み
  useEffect(() => {
    if (activeTab === "settings" && isOpen) {
      loadSettings();
    }
  }, [activeTab, isOpen, loadSettings]);

  // APIキーのテスト
  const handleTestApiKey = useCallback(
    async (provider: AIProvider, apiKey: string, modelName: string) => {
      try {
        const result = await aiAgentApi.testApiKey(provider, apiKey, modelName);
        return result.valid;
      } catch (error) {
        console.error("APIキーテストエラー:", error);
        return false;
      }
    },
    []
  );

  // 設定の保存
  const handleSaveSettings = useCallback(
    async (newSettings: ProviderSettings) => {
      try {
        await aiAgentApi.saveApiSettings(newSettings);

        // 設定を更新
        setSettings((prev) => ({
          ...prev,
          [newSettings.provider]: newSettings,
        }));
      } catch (error) {
        console.error("設定保存エラー:", error);
        throw error;
      }
    },
    []
  );

  // チャットメッセージ送信時の処理
  const handleSendMessage = useCallback(async () => {
    if (currentMessage.trim() === "" || isLoading) return;

    // 新しいユーザーメッセージを作成
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    // メッセージをチャット履歴に追加
    setChatHistory([...chatHistory, userMessage]);
    setCurrentMessage("");

    // ここでAIとの通信を行う処理が入ります
    // 現在はモックレスポンスを返すだけの実装
    setIsLoading(true);

    try {
      // モック: 実際にはAPIリクエストを行う
      setTimeout(() => {
        const aiResponse: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: `AIレスポンスの例：\n${
            selectedElements.length > 0
              ? `選択された${selectedElements.length}個の要素について考慮します。`
              : "特に選択された要素はありません。"
          }\n\n${currentMessage}についての提案や回答をここに表示します。`,
          timestamp: new Date(),
        };

        setChatHistory((prev) => [...prev, aiResponse]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("AI通信エラー:", error);
      setIsLoading(false);
    }
  }, [currentMessage, isLoading, chatHistory, selectedElements]);

  // Enter キーでメッセージを送信
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // チャットパネルを閉じる
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  // チャットパネルを開く
  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  // タブの変更ハンドラー
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: AIChatTabType) => {
      setActiveTab(newValue);
    },
    [setActiveTab]
  );

  // プロバイダータブ一覧をメモ化
  const providerTabs = useMemo(
    () => [
      { id: "openai" as AIProvider, label: "OpenAI" },
      { id: "anthropic" as AIProvider, label: "Claude" },
      { id: "gemini" as AIProvider, label: "Gemini" },
      { id: "custom" as AIProvider, label: "カスタム" },
    ],
    []
  );

  // チャット履歴の表示をメモ化
  const memoizedChatHistory = useMemo(() => {
    return chatHistory.map((message, index) => (
      <ChatMessageItem key={message.id} message={message} index={index} />
    ));
  }, [chatHistory]);

  // フローティングボタン（チャットパネルが閉じているとき表示）
  if (!isOpen) {
    return (
      <IconButton
        color="primary"
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          backgroundColor: "primary.main",
          color: "white",
          "&:hover": {
            backgroundColor: "primary.dark",
          },
        }}
        onClick={handleOpen}
      >
        <ChatBubbleIcon />
      </IconButton>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      variant="temporary"
      onClose={handleClose}
      sx={{
        width: 350,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 350,
          boxSizing: "border-box",
          padding: 2,
        },
      }}
    >
      {/* ヘッダー */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h6">AIアシスタント</Typography>
          <HelpTooltip
            title="チャット: AIとの自由な対話&#10;アシスト: 各画面の専用AI機能&#10;設定: AIプロバイダーの設定&#10;&#10;右下のフローティングボタンからいつでも開けます"
            placement="bottom"
            maxWidth={280}
            inline
          />
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* タブナビゲーション */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          label="チャット"
          value="chat"
          icon={<ChatBubbleIcon fontSize="small" />}
          iconPosition="start"
        />
        <Tab
          label="アシスト"
          value="assist"
          icon={<AutoFixHighIcon fontSize="small" />}
          iconPosition="start"
        />
        <Tab
          label="設定"
          value="settings"
          icon={<SettingsIcon fontSize="small" />}
          iconPosition="start"
        />
      </Tabs>

      {/* チャットタブのコンテンツ */}
      {activeTab === "chat" && (
        <>
          <Divider sx={{ mb: 2 }} />

          {/* 選択されたコンテキスト表示 */}
          <SelectedContext />

          {/* チャット履歴表示エリア */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              mb: 2,
              p: 1,
              backgroundColor: "background.default",
              borderRadius: 1,
              minHeight: "300px",
              maxHeight: "calc(100vh - 250px)",
            }}
          >
            {chatHistory.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", my: 10 }}
              >
                AIアシスタントに質問や提案を求めてみましょう
              </Typography>
            ) : (
              memoizedChatHistory
            )}
            {isLoading && <LoadingMessage />}
          </Box>

          {/* メッセージ入力エリア */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              variant="outlined"
              size="small"
              placeholder="AIに質問や指示を入力..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={currentMessage.trim() === "" || isLoading}
            >
              送信
            </Button>
          </Box>
        </>
      )}

      {/* アシストタブのコンテンツ */}
      {activeTab === "assist" && <AIAssistTab />}

      {/* 設定タブのコンテンツ */}
      {activeTab === "settings" && (
        <Box sx={{ overflowY: "auto", height: "calc(100vh - 150px)" }}>
          {isSettingsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : settingsError ? (
            <Box sx={{ p: 2, color: "error.main" }}>
              <Typography color="error">{settingsError}</Typography>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={loadSettings}
                sx={{ mt: 1 }}
              >
                再試行
              </Button>
            </Box>
          ) : (
            <>
              {/* プロバイダー選択タブ */}
              <Tabs
                value={activeProvider}
                onChange={(_, newValue) => setActiveProvider(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
              >
                {providerTabs.map((tab) => (
                  <Tab key={tab.id} label={tab.label} value={tab.id} />
                ))}
              </Tabs>

              {/* プロバイダー設定 */}
              <Box sx={{ px: 1 }}>
                <AISettingsTab
                  provider={activeProvider}
                  availableModels={availableModels}
                  currentSettings={settings[activeProvider]}
                  onSave={handleSaveSettings}
                  onTest={handleTestApiKey}
                />
              </Box>
            </>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default AIChatPanel;

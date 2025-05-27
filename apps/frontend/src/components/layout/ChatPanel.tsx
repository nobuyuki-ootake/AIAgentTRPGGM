import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  Avatar,
} from "@mui/material";
import {
  Send as SendIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useRecoilState } from "recoil";
import {
  chatHistoryState,
  chatPanelOpenState,
  Message,
} from "../../store/atoms";
import { v4 as uuidv4 } from "uuid";

interface ChatPanelProps {
  open: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ open }) => {
  const [chatPanelOpen, setChatPanelOpen] = useRecoilState(chatPanelOpenState);
  const [chatHistory, setChatHistory] = useRecoilState(chatHistoryState);
  const [message, setMessage] = useState("");

  const toggleChatPanel = () => {
    setChatPanelOpen(!chatPanelOpen);
  };

  const handleSendMessage = () => {
    if (message.trim() === "") return;

    // ユーザーメッセージを追加
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // メッセージ履歴を更新
    setChatHistory((prevHistory) => [...prevHistory, userMessage]);

    // メッセージ入力をクリア
    setMessage("");

    // 実際のアプリでは、ここでAIへのリクエストを送信する処理を実装
    // この例ではダミーのAI応答を追加
    setTimeout(() => {
      const aiMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: `「${message}」についての回答です。AIアシスタントとしてあなたの創作をサポートします。`,
        timestamp: new Date(),
      };
      setChatHistory((prevHistory) => [...prevHistory, aiMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        right: open ? 0 : -320,
        top: 0,
        width: 320,
        height: "100vh",
        bgcolor: "background.paper",
        borderLeft: "1px solid",
        borderColor: "divider",
        transition: "right 0.2s ease-in-out",
        display: "flex",
        flexDirection: "column",
        zIndex: 1200,
        boxShadow: open ? "-4px 0 8px rgba(0, 0, 0, 0.05)" : "none",
      }}
    >
      {/* チャットパネルのトグルボタン */}
      <IconButton
        onClick={toggleChatPanel}
        sx={{
          position: "absolute",
          left: -40,
          top: 20,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "50% 0 0 50%",
          width: 40,
          height: 40,
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <ChevronRightIcon />
      </IconButton>

      {/* チャットパネルのヘッダー */}
      <Paper
        elevation={0}
        sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Typography variant="h6">AIアシスタント</Typography>
      </Paper>

      {/* チャットメッセージ表示エリア */}
      <List sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
        {chatHistory.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              AIアシスタントとの会話を開始しましょう。
              <br />
              プロットやキャラクター、文章について質問や相談ができます。
            </Typography>
          </Box>
        ) : (
          chatHistory.map((msg) => (
            <ListItem
              key={msg.id}
              sx={{
                mb: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <Box sx={{ display: "flex", mb: 0.5, gap: 1 }}>
                {msg.role === "assistant" && (
                  <Avatar
                    sx={{ bgcolor: "primary.main", width: 24, height: 24 }}
                  >
                    AI
                  </Avatar>
                )}
                <Typography variant="caption" color="text.secondary">
                  {msg.role === "user" ? "あなた" : "AI"}
                </Typography>
                {msg.role === "user" && (
                  <Avatar
                    sx={{ bgcolor: "secondary.main", width: 24, height: 24 }}
                  >
                    You
                  </Avatar>
                )}
              </Box>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor:
                    msg.role === "user" ? "secondary.light" : "primary.light",
                  color: "text.primary",
                  maxWidth: "85%",
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </Typography>
              </Paper>
            </ListItem>
          ))
        )}
      </List>

      {/* メッセージ入力エリア */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="メッセージを入力..."
            variant="outlined"
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={message.trim() === ""}
          >
            送信
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPanel;

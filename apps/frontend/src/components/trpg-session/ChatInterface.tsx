import React, { useRef, useEffect, useState } from "react";
import {
  Box,
  List,
  ListItem,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Chip,
  Divider,
} from "@mui/material";
import {
  Send,
  Casino,
} from "@mui/icons-material";
import ChatSearchFilter, { ChatSearchCriteria } from "./ChatSearchFilter";

export interface DiceRoll {
  dice: string;
  rolls: number[];
  total: number;
  purpose: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderType: "player" | "gm" | "system";
  message: string;
  timestamp: Date;
  diceRoll?: DiceRoll;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onOpenDiceDialog: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onOpenDiceDialog,
}) => {
  const chatEndRef = useRef<null | HTMLDivElement>(null);
  
  // 一時的にフィルター機能を無効化
  // const [searchCriteria, setSearchCriteria] = useState<ChatSearchCriteria>({
  //   searchText: "",
  //   senderFilter: "all",
  //   hasSpellCheck: false,
  //   timeRange: "all",
  // });
  // const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>(messages);

  // メッセージが変更されたときに自動スクロール
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6">セッションログ</Typography>
        {/* 一時的にChatSearchFilterを無効化 */}
        {/* <ChatSearchFilter
          messages={messages}
          searchCriteria={searchCriteria}
          onSearchCriteriaChange={setSearchCriteria}
          onFilteredMessagesChange={setFilteredMessages}
        /> */}
      </Box>
      
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id} sx={{ flexDirection: "column", alignItems: "flex-start" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Avatar
                  sx={{
                    bgcolor: msg.senderType === "gm" ? "primary.main" :
                            msg.senderType === "system" ? "grey.500" : "secondary.main",
                    width: 32,
                    height: 32,
                  }}
                >
                  {msg.senderType === "gm" ? "GM" :
                   msg.senderType === "system" ? <Casino /> :
                   msg.sender[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">{msg.sender}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {msg.message}
                  </Typography>
                  {msg.diceRoll && (
                    <Chip
                      icon={<Casino />}
                      label={`${msg.diceRoll.dice} = ${msg.diceRoll.total}`}
                      size="small"
                      color="primary"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </ListItem>
          ))}
          <div ref={chatEndRef} />
        </List>
      </Box>

      <Divider />

      <Box sx={{ p: 2, display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          placeholder="メッセージを入力... (Shift+Enterで改行)"
          value={chatInput || ""}
          onChange={(e) => {
            e.preventDefault();
            onChatInputChange(e.target.value);
          }}
          onKeyPress={handleKeyPress}
          size="small"
          multiline
          maxRows={4}
        />
        <IconButton onClick={onOpenDiceDialog} color="primary">
          <Casino />
        </IconButton>
        <IconButton onClick={onSendMessage} color="primary" disabled={!chatInput?.trim()}>
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatInterface;
import React, { useRef, useEffect } from "react";
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

export interface DiceRoll {
  dice: string;
  rolls: number[];
  total: number;
  purpose: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderType: "player" | "gm" | "system" | "ai_pc";
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
  onAddSystemMessage?: (message: string) => void;
  isAwaitingActionSelection?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onOpenDiceDialog,
  onAddSystemMessage: _onAddSystemMessage,
  isAwaitingActionSelection = false,
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
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%",
      maxHeight: "100%", // 親の高さを超えないよう制限
      overflow: "hidden", // 親レベルではスクロールを防ぐ
      minHeight: 0 // flexbox子要素のmin-heightリセット
    }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <Typography variant="h6">セッションログ</Typography>
        {/* 一時的にChatSearchFilterを無効化 */}
        {/* <ChatSearchFilter
          messages={messages}
          searchCriteria={searchCriteria}
          onSearchCriteriaChange={setSearchCriteria}
          onFilteredMessagesChange={setFilteredMessages}
        /> */}
      </Box>
      
      <Box sx={{ 
        flex: 1, // 残りスペースを占有
        minHeight: 0, // flexアイテムのmin-heightをリセット
        overflow: "auto",
        p: 2,
        scrollbarWidth: "thin",
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '3px',
          '&:hover': {
            background: '#a8a8a8',
          },
        },
      }}>
        <List 
          data-testid="chat-messages"
          sx={{
            margin: 0,
            padding: 0,
            // 高さをfitからautoに変更し、親のスクロールエリアに委ねる
            overflow: 'visible'
          }}
        >
          {messages.map((msg) => (
            <ListItem key={msg.id} sx={{ flexDirection: "column", alignItems: "flex-start" }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, width: "100%" }}>
                <Avatar
                  sx={{
                    bgcolor: msg.senderType === "gm" ? "primary.main" :
                            msg.senderType === "system" ? "grey.500" : "secondary.main",
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                  }}
                >
                  {msg.senderType === "gm" ? "GM" :
                   msg.senderType === "system" ? <Casino /> :
                   msg.sender[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2">{msg.sender}</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                      maxWidth: "100%"
                    }}
                  >
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
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ flexShrink: 0, ml: 1 }}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </ListItem>
          ))}
          <div ref={chatEndRef} />
        </List>
      </Box>

      <Divider />

      <Box sx={{ 
        p: 2, 
        display: "flex", 
        gap: 1,
        flexShrink: 0,
        borderTop: 1,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        position: "relative", // z-indexのため
        zIndex: 1 // チャットメッセージの上に表示
      }}>
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
          data-testid="chat-input"
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: isAwaitingActionSelection ? '#FF8A00' : 'rgba(0, 0, 0, 0.23)',
                borderWidth: isAwaitingActionSelection ? '2px' : '1px',
              },
              '&:hover fieldset': {
                borderColor: isAwaitingActionSelection ? '#FF6F00' : 'rgba(0, 0, 0, 0.87)',
              },
              '&.Mui-focused fieldset': {
                borderColor: isAwaitingActionSelection ? '#FF8A00' : '#1976d2',
                borderWidth: '2px',
              },
            },
          }}
        />
        <IconButton onClick={onOpenDiceDialog} color="primary" data-testid="dice-button">
          <Casino />
        </IconButton>
        <IconButton onClick={onSendMessage} color="primary" disabled={!chatInput?.trim()} data-testid="send-button">
          <Send />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatInterface;
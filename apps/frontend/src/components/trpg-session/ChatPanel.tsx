import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import {
  Forum,
} from '@mui/icons-material';
import { ChatMessage } from './ChatInterface';
import ChatInterface from './ChatInterface';

interface ChatPanelProps {
  // チャット関連
  chatMessages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onAddSystemMessage: (message: string) => void;
  onOpenDiceDialog: () => void;
  
  // アクション選択状態
  isAwaitingActionSelection?: boolean;
  actionSelectionPrompt?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  chatMessages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onAddSystemMessage,
  onOpenDiceDialog,
  isAwaitingActionSelection = false,
  actionSelectionPrompt = "",
}) => {
  return (
    <Paper elevation={2} sx={{ 
      height: '100%', // 親の高さに合わせる
      maxHeight: '100%', // 親の高さを超えないよう明示的に制限
      display: 'flex', 
      flexDirection: 'column',
      width: '100%',
      minHeight: 0, // flexboxの子要素として適切に動作
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <Forum color="primary" />
        <Typography variant="h6">
          セッションチャット
        </Typography>
      </Box>
      
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0, // flex子要素のmin-heightリセット
        overflow: 'hidden' // 子要素の拡張を防ぐ
      }}>
        {/* アクション選択時のアナウンス */}
        {isAwaitingActionSelection && actionSelectionPrompt && (
          <Alert 
            severity="info" 
            sx={{ 
              m: 1,
              borderLeft: '4px solid #FF8A00',
              backgroundColor: '#FFF3E0',
              '& .MuiAlert-icon': {
                color: '#FF8A00'
              }
            }}
          >
            {actionSelectionPrompt}
          </Alert>
        )}
        
        <ChatInterface
          messages={chatMessages}
          chatInput={chatInput}
          onChatInputChange={onChatInputChange}
          onSendMessage={onSendMessage}
          onOpenDiceDialog={onOpenDiceDialog}
          onAddSystemMessage={onAddSystemMessage}
          isAwaitingActionSelection={isAwaitingActionSelection}
        />
      </Box>
    </Paper>
  );
};

export default ChatPanel;
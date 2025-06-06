import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Forum,
  CheckCircle,
  Bolt,
} from '@mui/icons-material';
import {
  DiceD20Icon,
} from '../icons/TRPGIcons';
import { ChatMessage } from './ChatInterface';
import ChatInterface from './ChatInterface';

// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chat-dice-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

import { TRPGCharacter } from '@trpg-ai-gm/types';

interface ChatAndDicePanelProps {
  // チャット関連
  chatMessages: ChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendMessage: () => void;
  onAddSystemMessage: (message: string) => void;
  
  // ダイス関連
  lastDiceResult: {
    result: number;
    notation: string;
    details: string;
  } | null;
  onOpenDiceDialog: () => void;
  onOpenSkillCheckDialog: () => void;
  onOpenPowerCheckDialog: () => void;
  
  // ステータス表示用
  selectedCharacter?: TRPGCharacter;
  
  // タブ状態
  rightPanelTab: number;
  onTabChange: (value: number) => void;
}

const ChatAndDicePanel: React.FC<ChatAndDicePanelProps> = ({
  chatMessages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  onAddSystemMessage,
  lastDiceResult,
  onOpenDiceDialog,
  onOpenSkillCheckDialog,
  onOpenPowerCheckDialog,
  selectedCharacter,
  rightPanelTab,
  onTabChange,
}) => {
  return (
    <Paper elevation={2} sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={rightPanelTab} onChange={(e, v) => onTabChange(v)} variant="fullWidth">
          <Tab label="チャット" icon={<Forum />} />
          <Tab label="ダイス" icon={<DiceD20Icon />} />
          <Tab label="ステータス" icon={<CheckCircle />} />
        </Tabs>
      </Box>
      
      <TabPanel value={rightPanelTab} index={0}>
        {/* チャットタブ */}
        <ChatInterface
          messages={chatMessages}
          chatInput={chatInput}
          onChatInputChange={onChatInputChange}
          onSendMessage={onSendMessage}
          onOpenDiceDialog={onOpenDiceDialog}
          onAddSystemMessage={onAddSystemMessage}
        />
      </TabPanel>
      
      <TabPanel value={rightPanelTab} index={1}>
        {/* ダイスタブ */}
        <Box sx={{ p: 1 }}>
          <Typography variant="h6" gutterBottom>
            ダイスロール
          </Typography>
          
          <Stack spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              onClick={onOpenDiceDialog}
              startIcon={<DiceD20Icon />}
            >
              基本ダイス
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={onOpenSkillCheckDialog}
              startIcon={<CheckCircle />}
            >
              技能判定
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={onOpenPowerCheckDialog}
              startIcon={<Bolt />}
            >
              能力判定
            </Button>
          </Stack>
          
          {lastDiceResult && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
              <Typography variant="body1">
                最後のロール: {lastDiceResult.notation}
              </Typography>
              <Typography variant="h6" color="primary">
                結果: {lastDiceResult.result}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lastDiceResult.details}
              </Typography>
            </Paper>
          )}
        </Box>
      </TabPanel>
      
      <TabPanel value={rightPanelTab} index={2}>
        {/* ステータスタブ */}
        <Box sx={{ p: 1 }}>
          {selectedCharacter ? (
            <>
              <Typography variant="h6" gutterBottom>
                {selectedCharacter.name}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  基本情報
                </Typography>
                <Typography variant="body2">
                  種族: {selectedCharacter.race || '未設定'}
                </Typography>
                <Typography variant="body2">
                  クラス: {selectedCharacter.characterClass || '未設定'}
                </Typography>
                <Typography variant="body2">
                  レベル: {selectedCharacter.level || 1}
                </Typography>
              </Box>
              
              {selectedCharacter.stats && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    ステータス
                  </Typography>
                  <Typography variant="body2">
                    HP: {String(selectedCharacter.stats.hitPoints || 0)}/{String(selectedCharacter.stats.maxHitPoints || 100)}
                  </Typography>
                  <Typography variant="body2">
                    MP: {String(selectedCharacter.stats.magicPoints || 0)}/{String(selectedCharacter.stats.maxMagicPoints || 10)}
                  </Typography>
                  <Typography variant="body2">
                    AC: {String(selectedCharacter.stats.armorClass || 10)}
                  </Typography>
                  <Typography variant="body2">
                    速度: {String(selectedCharacter.stats.speed || 30)}
                  </Typography>
                </Box>
              )}
              
              {selectedCharacter.equipment && selectedCharacter.equipment.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    装備
                  </Typography>
                  {selectedCharacter.equipment.map((item, index) => (
                    <Typography key={index} variant="body2">
                      • {typeof item === 'string' ? item : item?.name || 'アイテム'}
                    </Typography>
                  ))}
                </Box>
              )}
              
              {selectedCharacter.skills && selectedCharacter.skills.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    スキル
                  </Typography>
                  {selectedCharacter.skills.map((skill, index) => (
                    <Typography key={index} variant="body2">
                      {typeof skill === 'string' ? skill : skill?.name || 'スキル'}: レベル {typeof skill === 'string' ? '1' : String(skill?.level || 1)}
                    </Typography>
                  ))}
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                📊 キャラクター未選択
              </Typography>
              <Typography variant="body2" color="text.secondary">
                左のパーティパネルからキャラクターを選択してください
              </Typography>
            </Box>
          )}
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default ChatAndDicePanel;
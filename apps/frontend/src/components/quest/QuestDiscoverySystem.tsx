import React, { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  Divider,
  Paper,
} from "@mui/material";
import {
  Assignment as QuestIcon,
  Person as NPCIcon,
  LocationOn as LocationIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { EnhancedQuest } from "../../pages/QuestPage";
import { NPCCharacter, BaseLocation } from "@trpg-ai-gm/types";

interface QuestDiscoveryCondition {
  questId: string;
  npcId?: string;
  location?: string;
  itemRequired?: string;
  questboardAvailable: boolean;
  discovered: boolean;
}

interface QuestDiscoverySystemProps {
  quests: EnhancedQuest[];
  npcs: NPCCharacter[];
  locations: BaseLocation[];
  currentLocation?: string;
  interactingNPCId?: string;
  playerInventory: string[];
  onQuestDiscovered: (questId: string) => void;
  onQuestAccepted: (questId: string) => void;
}

const QuestDiscoverySystem: React.FC<QuestDiscoverySystemProps> = ({
  quests,
  npcs,
  locations,
  currentLocation,
  interactingNPCId,
  playerInventory,
  onQuestDiscovered,
  onQuestAccepted,
}) => {
  const [discoveredQuests, setDiscoveredQuests] = useState<string[]>([]);
  const [availableQuests, setAvailableQuests] = useState<EnhancedQuest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogQuests, setDialogQuests] = useState<EnhancedQuest[]>([]);
  const [dialogType, setDialogType] = useState<"npc" | "questboard">("npc");

  // クエスト発見条件をチェック
  useEffect(() => {
    const newlyDiscovered: string[] = [];
    const available: EnhancedQuest[] = [];

    quests.forEach(quest => {
      // 既に発見済みまたは完了済みのクエストはスキップ
      if (quest.status !== "hidden" || discoveredQuests.includes(quest.id)) {
        return;
      }

      const conditions = quest.discoveryConditions;
      let canDiscover = false;
      let discoveryReason = "";

      // NPC対話による発見
      if (conditions.npcId && interactingNPCId === conditions.npcId) {
        const npc = npcs.find(n => n.id === conditions.npcId);
        if (npc) {
          canDiscover = true;
          discoveryReason = `${npc.name}との対話`;
        }
      }

      // 場所での発見（クエストボード等）
      if (conditions.questboardAvailable && currentLocation) {
        const location = locations.find(l => l.name === currentLocation);
        if (location && location.facilities?.includes("クエストボード")) {
          canDiscover = true;
          discoveryReason = "クエストボード";
        }
      }

      // アイテム要件チェック
      if (conditions.itemRequired) {
        if (!playerInventory.includes(conditions.itemRequired)) {
          canDiscover = false;
        }
      }

      if (canDiscover) {
        newlyDiscovered.push(quest.id);
        available.push({
          ...quest,
          discoveryReason,
        } as EnhancedQuest & { discoveryReason: string });
      }
    });

    if (newlyDiscovered.length > 0) {
      setDiscoveredQuests(prev => [...prev, ...newlyDiscovered]);
      setAvailableQuests(available);
      
      // 発見通知
      newlyDiscovered.forEach(questId => onQuestDiscovered(questId));

      // NPC対話の場合
      if (interactingNPCId) {
        const npcQuests = available.filter(q => 
          q.discoveryConditions.npcId === interactingNPCId
        );
        if (npcQuests.length > 0) {
          setDialogQuests(npcQuests);
          setDialogType("npc");
          setDialogOpen(true);
        }
      }
      
      // クエストボードの場合
      if (currentLocation) {
        const questboardQuests = available.filter(q => 
          q.discoveryConditions.questboardAvailable
        );
        if (questboardQuests.length > 0) {
          setDialogQuests(questboardQuests);
          setDialogType("questboard");
          setDialogOpen(true);
        }
      }
    }
  }, [quests, npcs, locations, currentLocation, interactingNPCId, playerInventory, discoveredQuests, onQuestDiscovered]);

  // クエスト受注
  const handleAcceptQuest = (quest: EnhancedQuest) => {
    onQuestAccepted(quest.id);
    setDialogOpen(false);
  };

  // クエスト拒否
  const handleDeclineQuest = () => {
    setDialogOpen(false);
  };

  // 現在のNPCの情報
  const currentNPC = interactingNPCId ? npcs.find(npc => npc.id === interactingNPCId) : null;

  return (
    <>
      {/* クエスト発見ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {dialogType === "npc" ? <NPCIcon /> : <LocationIcon />}
            <Typography variant="h6">
              {dialogType === "npc" 
                ? `${currentNPC?.name}からのクエスト`
                : "クエストボード"
              }
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {dialogType === "npc" && currentNPC && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {currentNPC.name}: 「{currentNPC.personality || "助けが必要なのです..."}」
              </Typography>
            </Alert>
          )}

          {dialogType === "questboard" && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                クエストボードに新しい依頼が掲示されています。
              </Typography>
            </Alert>
          )}

          <List>
            {dialogQuests.map((quest, index) => (
              <Box key={quest.id}>
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <QuestIcon color="primary" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {quest.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {quest.description}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                        <Chip label={quest.difficulty} size="small" color="primary" />
                        <Chip 
                          label={`経験値: ${quest.rewards.experience}`} 
                          size="small" 
                          variant="outlined" 
                        />
                        <Chip 
                          label={`ゴールド: ${quest.rewards.gold}`} 
                          size="small" 
                          variant="outlined" 
                        />
                      </Box>

                      {quest.rewards.items.length > 0 && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>報酬アイテム:</strong> {quest.rewards.items.join(", ")}
                        </Typography>
                      )}

                      {quest.timeLimit && (
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            制限時間: {quest.timeLimit.days}日
                            {quest.timeLimit.consequences && (
                              <><br />失敗時: {quest.timeLimit.consequences}</>
                            )}
                          </Typography>
                        </Alert>
                      )}

                      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          onClick={() => handleAcceptQuest(quest)}
                          startIcon={<QuestIcon />}
                        >
                          受注する
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={handleDeclineQuest}
                        >
                          後で
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            ))}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleDeclineQuest}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* 発見されたクエストのサマリー表示（開発者向け） */}
      {process.env.NODE_ENV === "development" && discoveredQuests.length > 0 && (
        <Box sx={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}>
          <Paper sx={{ p: 2, maxWidth: 300 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              発見済みクエスト ({discoveredQuests.length})
            </Typography>
            <List dense>
              {discoveredQuests.slice(-3).map(questId => {
                const quest = quests.find(q => q.id === questId);
                return quest ? (
                  <ListItem key={questId} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <QuestIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={quest.title}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                ) : null;
              })}
            </List>
          </Paper>
        </Box>
      )}
    </>
  );
};

export default QuestDiscoverySystem;
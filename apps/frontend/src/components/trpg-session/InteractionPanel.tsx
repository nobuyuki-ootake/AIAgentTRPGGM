import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Stack,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Person,
  Chat,
  Favorite,
  Business,
  Grade,
  Casino,
  ExpandMore as ExpandMoreIcon,
  QuestionAnswer,
  LocalMall,
  Restaurant,
  Hotel,
  DirectionsRun,
  Security,
} from "@mui/icons-material";
import { TRPGCharacter, NPCCharacter, BaseLocation, CharacterInteraction } from "@trpg-ai-gm/types";
import { useTRPGSession } from "../../hooks/useTRPGSession";

interface InteractionPanelProps {
  currentLocation: BaseLocation;
  playerCharacter: TRPGCharacter;
  availableNPCs: NPCCharacter[];
  otherCharacters: TRPGCharacter[];
}

const InteractionPanel: React.FC<InteractionPanelProps> = ({
  currentLocation,
  playerCharacter,
  availableNPCs,
  otherCharacters,
}) => {
  const {
    executeAction,
    addMessage,
    rollDice,
    isLoading,
  } = useTRPGSession();

  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [interactionType, setInteractionType] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [interactionMessage, setInteractionMessage] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [relationshipView, setRelationshipView] = useState(false);

  // インタラクション実行
  const handleInteraction = async (type: string, target?: any) => {
    setInteractionType(type);
    setSelectedTarget(target);
    
    if (type === "simple_talk" && target) {
      // 簡単な会話は直接実行
      await executeAction({
        id: "talk",
        type: "talk",
        label: "会話",
        description: `${target.name}と会話する`,
      }, target);
    } else {
      // 複雑なインタラクションはダイアログを開く
      setDialogOpen(true);
    }
  };

  // ダイアログでのインタラクション実行
  const handleExecuteInteraction = async () => {
    if (!selectedTarget) return;

    try {
      switch (interactionType) {
        case "detailed_talk":
          await executeAction({
            id: "detailed_talk",
            type: "talk",
            label: "詳細会話",
            description: interactionMessage || `${selectedTarget.name}と詳しく話す`,
          }, selectedTarget);
          break;

        case "persuade":
          // 説得判定を含む会話
          const persuadeRoll = rollDice("1d20", "説得判定");
          addMessage("システム", "system", `説得判定: ${persuadeRoll.total}`);
          await executeAction({
            id: "persuade",
            type: "talk",
            label: "説得",
            description: `${selectedTarget.name}を説得する: ${interactionMessage}`,
          }, selectedTarget);
          break;

        case "trade":
          await executeAction({
            id: "trade",
            type: "shop",
            label: "取引",
            description: `${selectedTarget.name}と取引する`,
          }, selectedTarget);
          break;

        case "skill_check":
          if (selectedSkill) {
            const skillRoll = rollDice("1d20", `${selectedSkill}判定`);
            addMessage("システム", "system", `${selectedSkill}判定: ${skillRoll.total}`);
          }
          break;

        case "character_interaction":
          await executeAction({
            id: "character_interaction",
            type: "interact",
            label: "キャラクター交流",
            description: `${selectedTarget.name}と交流する: ${interactionMessage}`,
          }, selectedTarget);
          break;
      }
    } catch (error) {
      console.error("インタラクション実行エラー:", error);
    }

    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTarget(null);
    setInteractionType("");
    setInteractionMessage("");
    setSelectedSkill("");
  };

  // NPCの好感度色を取得
  const getRelationshipColor = (relationship: number) => {
    if (relationship >= 80) return "success";
    if (relationship >= 60) return "info";
    if (relationship >= 40) return "warning";
    return "error";
  };

  // 利用可能なアクションを取得
  const getAvailableActions = (target: NPCCharacter) => {
    const actions = ["simple_talk", "detailed_talk"];
    
    if (target.services?.includes("取引") || target.services?.includes("商売")) {
      actions.push("trade");
    }
    
    if (target.attitude !== "hostile") {
      actions.push("persuade");
    }

    return actions;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        インタラクション
      </Typography>

      {/* 現在地情報 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            現在地: {currentLocation.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentLocation.description}
          </Typography>
          {currentLocation.facilities && Object.keys(currentLocation.facilities).length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                利用可能な施設:
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                {currentLocation.facilities.inn && (
                  <Chip icon={<Hotel />} label="宿屋" size="small" />
                )}
                {currentLocation.facilities.shops && currentLocation.facilities.shops.length > 0 && (
                  <Chip icon={<LocalMall />} label="店舗" size="small" />
                )}
                {currentLocation.facilities.temple && (
                  <Chip icon={<Restaurant />} label="神殿" size="small" />
                )}
                {currentLocation.facilities.guild && (
                  <Chip icon={<Business />} label="ギルド" size="small" />
                )}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* インタラクション対象 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">NPCとの交流</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {availableNPCs.map((npc) => (
              <Grid item xs={12} md={6} key={npc.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Avatar sx={{ mr: 1 }}>
                        <Person />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2">{npc.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {npc.occupation}
                        </Typography>
                      </Box>
                      <Chip
                        label={npc.attitude || "neutral"}
                        size="small"
                        color={npc.attitude === "friendly" ? "success" : 
                               npc.attitude === "hostile" ? "error" : "default"}
                      />
                    </Box>
                    
                    {npc.services && npc.services.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          サービス:
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {npc.services.map((service, idx) => (
                            <Chip key={idx} label={service} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Chat />}
                      onClick={() => handleInteraction("simple_talk", npc)}
                      disabled={isLoading}
                    >
                      話しかける
                    </Button>
                    <Button
                      size="small"
                      startIcon={<QuestionAnswer />}
                      onClick={() => handleInteraction("detailed_talk", npc)}
                      disabled={isLoading}
                    >
                      詳しく話す
                    </Button>
                    {npc.services?.includes("取引") && (
                      <Button
                        size="small"
                        startIcon={<LocalMall />}
                        onClick={() => handleInteraction("trade", npc)}
                        disabled={isLoading}
                      >
                        取引
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {availableNPCs.length === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
              この場所にはNPCがいません
            </Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* パーティメンバーとの交流 */}
      {otherCharacters.length > 0 && (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">パーティメンバーとの交流</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {otherCharacters.map((character) => (
                <Grid item xs={12} md={6} key={character.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <Avatar src={character.imageUrl} sx={{ mr: 1 }}>
                          <Person />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle2">{character.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {character.profession}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Favorite sx={{ mr: 0.5, fontSize: 16 }} />
                          <Typography variant="body2">
                            {/* 好感度は実装に応じて追加 */}
                            85
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          HP: {character.derived.HP}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(character.derived.HP / character.derived.HP) * 100}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<Chat />}
                        onClick={() => handleInteraction("character_interaction", character)}
                        disabled={isLoading}
                      >
                        交流
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Favorite />}
                        onClick={() => handleInteraction("relationship", character)}
                        disabled={isLoading}
                      >
                        親睦を深める
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* 施設利用 */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">施設利用</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {currentLocation.facilities.inn && (
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Hotel sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">
                        {currentLocation.facilities.inn.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      一泊 {currentLocation.facilities.inn.pricePerNight}G
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => handleInteraction("rest")}
                      disabled={isLoading}
                    >
                      休息
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            {currentLocation.facilities.shops?.map((shop, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <LocalMall sx={{ mr: 1 }} />
                      <Typography variant="subtitle2">{shop.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {shop.type}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => handleInteraction("shop", shop)}
                      disabled={isLoading}
                    >
                      買い物
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* インタラクションダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {interactionType === "detailed_talk" && "詳細会話"}
          {interactionType === "persuade" && "説得"}
          {interactionType === "character_interaction" && "キャラクター交流"}
          {interactionType === "skill_check" && "スキル判定"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedTarget && (
              <Box>
                <Typography variant="subtitle2">
                  対象: {selectedTarget.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTarget.profession || selectedTarget.occupation}
                </Typography>
              </Box>
            )}

            {(interactionType === "detailed_talk" || 
              interactionType === "persuade" || 
              interactionType === "character_interaction") && (
              <TextField
                label="メッセージ"
                multiline
                rows={3}
                value={interactionMessage}
                onChange={(e) => setInteractionMessage(e.target.value)}
                placeholder="何を話しますか？"
                fullWidth
              />
            )}

            {interactionType === "skill_check" && (
              <FormControl fullWidth>
                <InputLabel>使用スキル</InputLabel>
                <Select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  label="使用スキル"
                >
                  <MenuItem value="説得">説得</MenuItem>
                  <MenuItem value="威圧">威圧</MenuItem>
                  <MenuItem value="洞察">洞察</MenuItem>
                  <MenuItem value="詐欺">詐欺</MenuItem>
                  <MenuItem value="芸能">芸能</MenuItem>
                </Select>
              </FormControl>
            )}

            {interactionType === "persuade" && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  説得判定が行われます。成功すると相手の態度が良くなる可能性があります。
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            キャンセル
          </Button>
          <Button 
            onClick={handleExecuteInteraction} 
            variant="contained"
            disabled={isLoading || (
              (interactionType === "detailed_talk" || 
               interactionType === "persuade" || 
               interactionType === "character_interaction") && 
              !interactionMessage.trim()
            )}
          >
            実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InteractionPanel;
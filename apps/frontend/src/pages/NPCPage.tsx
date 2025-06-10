import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Divider,
  Card,
  CardContent,
  Grid,
  Avatar,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonOutline,
  Store,
  Security,
  Work,
  School,
  Groups,
  Favorite,
  Psychology,
  AutoFixHigh,
} from "@mui/icons-material";
import { useRecoilState } from "recoil";
import { currentCampaignState } from "../store/atoms";
import { v4 as uuidv4 } from "uuid";
import { AIAssistButton } from "../components/ui/AIAssistButton";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { NPCCharacter } from "@trpg-ai-gm/types";

const NPCPage: React.FC = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [npcs, setNpcs] = useState<NPCCharacter[]>(currentCampaign?.npcs || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<NPCCharacter | null>(null);
  const [formData, setFormData] = useState<NPCCharacter>({
    id: "",
    name: "",
    characterType: "NPC" as const,
    profession: "",
    gender: "",
    nation: "",
    religion: "",
    player: "",
    age: 25,
    description: "",
    attributes: {
      STR: 10,
      CON: 10,
      SIZ: 10,
      INT: 10,
      POW: 10,
      DEX: 10,
      CHA: 10,
    },
    derived: {
      HP: 10,
      MP: 10,
      SW: 10,
      RES: 10,
    },
    weapons: [],
    armor: {
      head: 0,
      body: 0,
      leftArm: 0,
      rightArm: 0,
      leftLeg: 0,
      rightLeg: 0,
    },
    skills: {
      AgilitySkills: [],
      CommunicationSkills: [],
      KnowledgeSkills: [],
      ManipulationSkills: [],
      PerceptionSkills: [],
      StealthSkills: [],
      MagicSkills: [],
      WeaponSkills: [],
    },
    imageUrl: "",
    attitude: "neutral" as const,
    location: "",
    occupation: "",
    knowledge: [],
    services: [],
    questIds: [],
    dialoguePatterns: [],
  });

  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterNpcType, setFilterNpcType] = useState<string>("all");

  const { openAIAssist } = useAIChatIntegration();

  // 拠点リストを取得（世界観構築から）
  const locations = currentCampaign?.bases?.map((b: any) => b.name) || [];
  const uniqueLocations = ["all", ...new Set(locations)];

  // NPC態度のリスト
  const npcTypes = [
    { value: "friendly", label: "友好的", icon: <PersonOutline /> },
    { value: "neutral", label: "中立", icon: <Groups /> },
    { value: "hostile", label: "敵対的", icon: <Security /> },
    { value: "unknown", label: "不明", icon: <Work /> },
  ];

  // フィルタリングされたNPCリスト
  const filteredNpcs = npcs.filter(npc => {
    const locationMatch = filterLocation === "all" || npc.location === filterLocation;
    const typeMatch = filterNpcType === "all" || npc.attitude === filterNpcType;
    return locationMatch && typeMatch;
  });

  // ダイアログを開く
  const handleOpenDialog = (npc?: NPCCharacter) => {
    if (npc) {
      setEditingNpc(npc);
      setFormData(npc);
    } else {
      setEditingNpc(null);
      setFormData({
        id: uuidv4(),
        name: "",
        characterType: "NPC" as const,
        profession: "",
        nation: "",
        religion: "",
        player: "",
        gender: "",
        age: 25,
        description: "",
        attributes: {
          STR: 10,
          CON: 10,
          SIZ: 10,
          INT: 10,
          POW: 10,
          DEX: 10,
          CHA: 10,
        },
        derived: {
          HP: 10,
          MP: 10,
          SW: 10,
          RES: 10,
        },
        weapons: [],
        armor: {
          head: 0,
          body: 0,
          leftArm: 0,
          rightArm: 0,
          leftLeg: 0,
          rightLeg: 0,
        },
        skills: {
          AgilitySkills: [],
          CommunicationSkills: [],
          KnowledgeSkills: [],
          ManipulationSkills: [],
          PerceptionSkills: [],
          StealthSkills: [],
          MagicSkills: [],
          WeaponSkills: [],
        },
        imageUrl: "",
        attitude: "neutral" as const,
        location: locations[0] || "",
        occupation: "",
        knowledge: [],
        services: [],
        questIds: [],
        dialoguePatterns: [],
      });
    }
    setDialogOpen(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingNpc(null);
  };

  // NPCを保存
  const handleSaveNpc = () => {
    if (!formData.name.trim()) return;

    let newNpcs: NPCCharacter[];
    if (editingNpc) {
      newNpcs = npcs.map((n) =>
        n.id === editingNpc.id ? formData : n
      );
    } else {
      newNpcs = [...npcs, formData];
    }
    
    setNpcs(newNpcs);
    
    // キャンペーンデータも更新
    if (currentCampaign) {
      setCurrentCampaign({
        ...currentCampaign,
        npcs: newNpcs,
        updatedAt: new Date(),
      });
    }
    
    handleCloseDialog();
  };

  // NPCを削除
  const handleDeleteNpc = (id: string) => {
    if (window.confirm("このNPCを削除してもよろしいですか？")) {
      const newNpcs = npcs.filter((n) => n.id !== id);
      setNpcs(newNpcs);
      
      if (currentCampaign) {
        setCurrentCampaign({
          ...currentCampaign,
          npcs: newNpcs,
          updatedAt: new Date(),
        });
      }
    }
  };

  // フォーム入力の処理
  const handleFormChange = (field: keyof NPCCharacter, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // AIアシスト機能
  const handleOpenAIAssist = async () => {
    openAIAssist(
      "characters",
      {
        title: "NPC生成アシスタント",
        description: "拠点や物語に基づいて、適切なNPCを生成します。",
        defaultMessage: `現在のキャンペーンの拠点と世界観に基づいて、プレイヤーが出会うNPCを提案してください。

拠点情報:
${currentCampaign?.bases?.map((b: any) => `- ${b.name}: ${b.description}`).join('\n') || '拠点が設定されていません'}

以下のタイプのNPCを含めてください：
- 商人（アイテムやサービスを提供）
- クエスト提供者（物語を進める重要人物）
- 情報提供者（ヒントや噂話を持つ人物）
- 地域の有力者（権力や影響力を持つ人物）`,
        supportsBatchGeneration: true,
        onComplete: (result) => {
          if (result.content && typeof result.content === "string") {
            try {
              const parsedNpcs = JSON.parse(result.content);
              if (Array.isArray(parsedNpcs)) {
                parsedNpcs.forEach((npc) => {
                  const newNpc: NPCCharacter = {
                    id: uuidv4(),
                    name: npc.name || "名無しのNPC",
                    characterType: "NPC" as const,
                    profession: npc.profession || "",
                    gender: npc.gender || "",
                    age: npc.age || 25,
                    nation: npc.nation || "",
                    religion: npc.religion || "",
                    player: "",
                    description: npc.description || "",
                    attributes: npc.attributes || formData.attributes,
                    derived: npc.derived || formData.derived,
                    weapons: npc.weapons || [],
                    armor: npc.armor || formData.armor,
                    skills: npc.skills || formData.skills,
                    imageUrl: npc.imageUrl || "",
                    attitude: npc.attitude || "neutral" as const,
                    location: npc.location || locations[0] || "",
                    occupation: npc.occupation || "",
                    knowledge: npc.knowledge || [],
                    services: npc.services || [],
                    questIds: npc.questIds || [],
                    dialoguePatterns: npc.dialoguePatterns || [],
                  };
                  
                  const updatedNpcs = [...npcs, newNpc];
                  setNpcs(updatedNpcs);
                  
                  if (currentCampaign) {
                    setCurrentCampaign({
                      ...currentCampaign,
                      npcs: updatedNpcs,
                      updatedAt: new Date(),
                    });
                  }
                });
              }
            } catch (error) {
              console.error("NPC解析エラー:", error);
            }
          }
        },
      },
      currentCampaign
    );
  };

  // NPCタイプのアイコンを取得
  const getNpcTypeIcon = (type: string) => {
    const typeInfo = npcTypes.find(t => t.value === type);
    return typeInfo?.icon || <PersonOutline />;
  };

  // NPCタイプの表示名を取得
  const getNpcTypeName = (type: string) => {
    const typeInfo = npcTypes.find(t => t.value === type);
    return typeInfo?.label || "その他";
  };

  // 友好度の色を取得
  const getDispositionColor = (disposition: number) => {
    if (disposition >= 75) return "success";
    if (disposition >= 50) return "primary";
    if (disposition >= 25) return "warning";
    return "error";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {currentCampaign?.title || "キャンペーン"}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          NPC管理
        </Typography>
      </Paper>

      {/* フィルター */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>拠点でフィルター</InputLabel>
              <Select
                value={filterLocation}
                label="拠点でフィルター"
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                {uniqueLocations.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc === "all" ? "すべての拠点" : loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>タイプでフィルター</InputLabel>
              <Select
                value={filterNpcType}
                label="タイプでフィルター"
                onChange={(e) => setFilterNpcType(e.target.value)}
              >
                <MenuItem value="all">すべてのタイプ</MenuItem>
                {npcTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <AIAssistButton
                onAssist={handleOpenAIAssist}
                text="AIでNPC生成"
                variant="default"
                showHelp={true}
                helpText="キャンペーンの拠点や世界観に基づいて、適切なNPCを自動生成します。"
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                新規NPC
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* NPCリスト */}
      <Grid container spacing={3}>
        {filteredNpcs.map((npc) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={npc.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {getNpcTypeIcon(npc.attitude)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{npc.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {npc.occupation || "職業不明"}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        {npc.questIds && npc.questIds.length > 0 && (
                          <Chip
                            icon={<AutoFixHigh />}
                            label="クエスト"
                            size="small"
                            color="secondary"
                          />
                        )}
                        <Chip
                          label={npc.location || "未設定"}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(npc)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteNpc(npc.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* 態度 */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Favorite fontSize="small" color={npc.attitude === "friendly" ? "success" : npc.attitude === "hostile" ? "error" : "action"} />
                    <Typography variant="body2">
                      態度: {npc.attitude === "friendly" ? "友好的" : npc.attitude === "neutral" ? "中立" : npc.attitude === "hostile" ? "敵対的" : "不明"}
                    </Typography>
                  </Box>
                </Box>

                {/* 説明 */}
                {npc.description && (
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 1 }}>
                    <Psychology fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {npc.description}
                    </Typography>
                  </Box>
                )}

                {/* サービス */}
                {npc.services && npc.services.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      提供サービス:
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {npc.services.map((service, index) => (
                        <Chip
                          key={index}
                          label={service}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredNpcs.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="text.secondary">
            {filterLocation !== "all" || filterNpcType !== "all"
              ? "条件に一致するNPCがいません"
              : "まだNPCが登録されていません"}
          </Typography>
        </Box>
      )}

      {/* NPC編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNpc ? "NPCを編集" : "新規NPCを作成"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* 基本情報 */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="NPC名"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>態度</InputLabel>
                  <Select
                    value={formData.attitude}
                    label="態度"
                    onChange={(e) => handleFormChange("attitude", e.target.value as NPCCharacter["attitude"])}
                  >
                    {npcTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {type.icon}
                          {type.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>拠点</InputLabel>
                  <Select
                    value={formData.location}
                    label="拠点"
                    onChange={(e) => handleFormChange("location", e.target.value)}
                  >
                    {locations.map((loc) => (
                      <MenuItem key={loc} value={loc}>
                        {loc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="職業"
                  value={formData.profession}
                  onChange={(e) => handleFormChange("profession", e.target.value)}
                  fullWidth
                  placeholder="宿屋の主人、衛兵隊長など"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="役割"
                  value={formData.occupation}
                  onChange={(e) => handleFormChange("occupation", e.target.value)}
                  fullWidth
                  placeholder="商人、情報屋、クエスト提供者など"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="国籍"
                  value={formData.nation}
                  onChange={(e) => handleFormChange("nation", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="性別"
                  value={formData.gender}
                  onChange={(e) => handleFormChange("gender", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="年齢"
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleFormChange("age", parseInt(e.target.value) || 25)}
                  fullWidth
                />
              </Grid>
            </Grid>

            {/* 詳細情報 */}
            <TextField
              label="説明・外見"
              value={formData.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              multiline
              rows={4}
              fullWidth
              placeholder="NPCの外見、性格、背景、動機などを記述"
            />

            <TextField
              label="宗教・信仰"
              value={formData.religion}
              onChange={(e) => handleFormChange("religion", e.target.value)}
              fullWidth
              placeholder="信仰する神や宗教、または無宗教など"
            />

            <TextField
              label="提供サービス（カンマ区切り）"
              value={formData.services?.join(", ") || ""}
              onChange={(e) => handleFormChange("services", e.target.value.split(",").map(s => s.trim()).filter(s => s))}
              multiline
              rows={2}
              fullWidth
              placeholder="宿泊, 食事, 情報収集, 装備修理"
            />

            <TextField
              label="知識・情報（カンマ区切り）"
              value={formData.knowledge?.join(", ") || ""}
              onChange={(e) => handleFormChange("knowledge", e.target.value.split(",").map(s => s.trim()).filter(s => s))}
              multiline
              rows={2}
              fullWidth
              placeholder="古代遺跡の場所, 盗賊団の動向, 王国の歴史"
            />

            <TextField
              label="会話パターン（カンマ区切り）"
              value={formData.dialoguePatterns?.join(", ") || ""}
              onChange={(e) => handleFormChange("dialoguePatterns", e.target.value.split(",").map(s => s.trim()).filter(s => s))}
              multiline
              rows={2}
              fullWidth
              placeholder="～じゃ（老人口調）, ～でござる（侍口調）, 早口で話す"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveNpc} variant="contained" disabled={!formData.name.trim()}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NPCPage;
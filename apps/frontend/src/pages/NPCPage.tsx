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
    characterType: "NPC",
    npcType: "merchant",
    role: "",
    race: "",
    class: "",
    background: "",
    alignment: "",
    gender: "",
    age: "",
    appearance: "",
    personality: "",
    motivation: "",
    stats: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      hitPoints: { current: 10, max: 10, temp: 0 },
      armorClass: 10,
      speed: 30,
      level: 1,
      experience: 0,
      proficiencyBonus: 2,
    },
    skills: [],
    equipment: [],
    progression: [],
    traits: [],
    relationships: [],
    imageUrl: "",
    customFields: [],
    statuses: [],
    notes: "",
    location: "",
    services: [],
    secrets: [],
    questGiver: false,
    disposition: 50,
    faction: "",
    voiceDescription: "",
    mannerisms: "",
  });

  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterNpcType, setFilterNpcType] = useState<string>("all");

  const { openAIAssist } = useAIChatIntegration();

  // 拠点リストを取得（世界観構築から）
  const locations = currentCampaign?.worldBuilding?.bases?.map(b => b.name) || [];
  const uniqueLocations = ["all", ...new Set(locations)];

  // NPCタイプのリスト
  const npcTypes = [
    { value: "merchant", label: "商人", icon: <Store /> },
    { value: "guard", label: "衛兵", icon: <Security /> },
    { value: "noble", label: "貴族", icon: <Work /> },
    { value: "scholar", label: "学者", icon: <School /> },
    { value: "commoner", label: "市民", icon: <Groups /> },
    { value: "quest", label: "クエスト", icon: <AutoFixHigh /> },
    { value: "other", label: "その他", icon: <PersonOutline /> },
  ];

  // フィルタリングされたNPCリスト
  const filteredNpcs = npcs.filter(npc => {
    const locationMatch = filterLocation === "all" || npc.location === filterLocation;
    const typeMatch = filterNpcType === "all" || npc.npcType === filterNpcType;
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
        characterType: "NPC",
        npcType: "merchant",
        role: "",
        race: "",
        class: "",
        background: "",
        alignment: "",
        gender: "",
        age: "",
        appearance: "",
        personality: "",
        motivation: "",
        stats: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
          hitPoints: { current: 10, max: 10, temp: 0 },
          armorClass: 10,
          speed: 30,
          level: 1,
          experience: 0,
          proficiencyBonus: 2,
        },
        skills: [],
        equipment: [],
        progression: [],
        traits: [],
        relationships: [],
        imageUrl: "",
        customFields: [],
        statuses: [],
        notes: "",
        location: locations[0] || "",
        services: [],
        secrets: [],
        questGiver: false,
        disposition: 50,
        faction: "",
        voiceDescription: "",
        mannerisms: "",
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
  const handleOpenAIAssist = () => {
    openAIAssist(
      "npc",
      {
        title: "NPC生成アシスタント",
        description: "拠点や物語に基づいて、適切なNPCを生成します。",
        defaultMessage: `現在のキャンペーンの拠点と世界観に基づいて、プレイヤーが出会うNPCを提案してください。

拠点情報:
${currentCampaign?.worldBuilding?.bases?.map(b => `- ${b.name}: ${b.description}`).join('\n') || '拠点が設定されていません'}

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
                    characterType: "NPC",
                    npcType: npc.npcType || "merchant",
                    role: npc.role || "",
                    race: npc.race || "",
                    class: npc.class || "",
                    background: npc.background || "",
                    alignment: npc.alignment || "",
                    gender: npc.gender || "",
                    age: npc.age || "",
                    appearance: npc.appearance || "",
                    personality: npc.personality || "",
                    motivation: npc.motivation || "",
                    stats: npc.stats || formData.stats,
                    skills: npc.skills || [],
                    equipment: npc.equipment || [],
                    progression: [],
                    traits: npc.traits || [],
                    relationships: npc.relationships || [],
                    imageUrl: "",
                    customFields: [],
                    statuses: [],
                    notes: npc.notes || "",
                    location: npc.location || locations[0] || "",
                    services: npc.services || [],
                    secrets: npc.secrets || [],
                    questGiver: npc.questGiver || false,
                    disposition: npc.disposition || 50,
                    faction: npc.faction || "",
                    voiceDescription: npc.voiceDescription || "",
                    mannerisms: npc.mannerisms || "",
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
                      {getNpcTypeIcon(npc.npcType)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{npc.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {npc.role || getNpcTypeName(npc.npcType)}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        {npc.questGiver && (
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

                {/* 友好度 */}
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Favorite fontSize="small" color={getDispositionColor(npc.disposition)} />
                    <Typography variant="body2">
                      友好度: {npc.disposition}/100
                    </Typography>
                  </Box>
                </Box>

                {/* 性格 */}
                {npc.personality && (
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, mb: 1 }}>
                    <Psychology fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {npc.personality}
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
                  <InputLabel>タイプ</InputLabel>
                  <Select
                    value={formData.npcType}
                    label="タイプ"
                    onChange={(e) => handleFormChange("npcType", e.target.value)}
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
                  label="役割"
                  value={formData.role}
                  onChange={(e) => handleFormChange("role", e.target.value)}
                  fullWidth
                  placeholder="宿屋の主人、衛兵隊長など"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="友好度"
                  type="number"
                  value={formData.disposition}
                  onChange={(e) => handleFormChange("disposition", parseInt(e.target.value) || 50)}
                  fullWidth
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.questGiver}
                      onChange={(e) => handleFormChange("questGiver", e.target.checked)}
                    />
                  }
                  label="クエスト提供者"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="種族"
                  value={formData.race}
                  onChange={(e) => handleFormChange("race", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="性別"
                  value={formData.gender}
                  onChange={(e) => handleFormChange("gender", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="年齢"
                  value={formData.age}
                  onChange={(e) => handleFormChange("age", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="所属勢力"
                  value={formData.faction}
                  onChange={(e) => handleFormChange("faction", e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>

            {/* 詳細情報 */}
            <TextField
              label="外見"
              value={formData.appearance}
              onChange={(e) => handleFormChange("appearance", e.target.value)}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="性格"
              value={formData.personality}
              onChange={(e) => handleFormChange("personality", e.target.value)}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="動機・目的"
              value={formData.motivation}
              onChange={(e) => handleFormChange("motivation", e.target.value)}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="口調・話し方"
              value={formData.voiceDescription}
              onChange={(e) => handleFormChange("voiceDescription", e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder="例：訛りがある、早口、丁寧語を使うなど"
            />

            <TextField
              label="癖・仕草"
              value={formData.mannerisms}
              onChange={(e) => handleFormChange("mannerisms", e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder="例：髭を撫でる、指を鳴らす、目を合わせないなど"
            />

            <TextField
              label="サービス（カンマ区切り）"
              value={formData.services?.join(", ") || ""}
              onChange={(e) => handleFormChange("services", e.target.value.split(",").map(s => s.trim()).filter(s => s))}
              multiline
              rows={2}
              fullWidth
              placeholder="宿泊, 食事, 情報収集, 装備修理"
            />

            <TextField
              label="秘密（カンマ区切り）"
              value={formData.secrets?.join(", ") || ""}
              onChange={(e) => handleFormChange("secrets", e.target.value.split(",").map(s => s.trim()).filter(s => s))}
              multiline
              rows={2}
              fullWidth
              placeholder="実は元貴族, 盗賊ギルドと繋がりがある"
            />

            <TextField
              label="備考"
              value={formData.notes}
              onChange={(e) => handleFormChange("notes", e.target.value)}
              multiline
              rows={2}
              fullWidth
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
import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Dangerous,
  Star,
  Favorite,
  LocalHospital,
  Bolt,
  Shield,
  Speed,
} from "@mui/icons-material";
import { useRecoilState } from "recoil";
import { currentCampaignState } from "../store/atoms";
import { v4 as uuidv4 } from "uuid";
import { AIAssistButton } from "../components/ui/AIAssistButton";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { EnemyCharacter, CharacterStats } from "@trpg-ai-gm/types";

const EnemyPage: React.FC = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [enemies, setEnemies] = useState<EnemyCharacter[]>(currentCampaign?.enemies || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnemy, setEditingEnemy] = useState<EnemyCharacter | null>(null);
  const [formData, setFormData] = useState<EnemyCharacter>({
    id: "",
    name: "",
    characterType: "Enemy",
    enemyType: "mob",
    challengeRating: 1,
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
    tactics: "",
    loot: [],
    spawnLocations: [],
    behaviorPattern: "",
  });

  const { openAIAssist } = useAIChatIntegration();

  // ダイアログを開く
  const handleOpenDialog = (enemy?: EnemyCharacter) => {
    if (enemy) {
      setEditingEnemy(enemy);
      setFormData(enemy);
    } else {
      setEditingEnemy(null);
      setFormData({
        id: uuidv4(),
        name: "",
        characterType: "Enemy",
        enemyType: "mob",
        challengeRating: 1,
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
        tactics: "",
        loot: [],
        spawnLocations: [],
        behaviorPattern: "",
      });
    }
    setDialogOpen(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEnemy(null);
  };

  // エネミーを保存
  const handleSaveEnemy = () => {
    if (!formData.name.trim()) return;

    let newEnemies: EnemyCharacter[];
    if (editingEnemy) {
      newEnemies = enemies.map((e) =>
        e.id === editingEnemy.id ? formData : e
      );
    } else {
      newEnemies = [...enemies, formData];
    }
    
    setEnemies(newEnemies);
    
    // キャンペーンデータも更新
    if (currentCampaign) {
      setCurrentCampaign({
        ...currentCampaign,
        enemies: newEnemies,
        updatedAt: new Date(),
      });
    }
    
    handleCloseDialog();
  };

  // エネミーを削除
  const handleDeleteEnemy = (id: string) => {
    if (window.confirm("このエネミーを削除してもよろしいですか？")) {
      const newEnemies = enemies.filter((e) => e.id !== id);
      setEnemies(newEnemies);
      
      if (currentCampaign) {
        setCurrentCampaign({
          ...currentCampaign,
          enemies: newEnemies,
          updatedAt: new Date(),
        });
      }
    }
  };

  // フォーム入力の処理
  const handleFormChange = (field: keyof EnemyCharacter, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // ステータス変更
  const handleStatChange = (stat: keyof CharacterStats, value: number) => {
    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        [stat]: value,
      },
    });
  };

  // HP変更
  const handleHPChange = (field: "current" | "max" | "temp", value: number) => {
    setFormData({
      ...formData,
      stats: {
        ...formData.stats,
        hitPoints: {
          ...formData.stats.hitPoints,
          [field]: value,
        },
      },
    });
  };

  // AIアシスト機能
  const handleOpenAIAssist = () => {
    openAIAssist(
      "enemy",
      {
        title: "エネミー生成アシスタント",
        description: "キャンペーン設定やクエストに基づいて、適切なエネミーを生成します。",
        defaultMessage: "現在のキャンペーンとクエストに基づいて、プレイヤーが遭遇するエネミーを提案してください。モブ、エリート、ボスなど、バリエーションのあるエネミーを含めてください。",
        supportsBatchGeneration: true,
        onComplete: (result) => {
          if (result.content && typeof result.content === "string") {
            try {
              const parsedEnemies = JSON.parse(result.content);
              if (Array.isArray(parsedEnemies)) {
                parsedEnemies.forEach((enemy) => {
                  const newEnemy: EnemyCharacter = {
                    id: uuidv4(),
                    name: enemy.name || "名無しのエネミー",
                    characterType: "Enemy",
                    enemyType: enemy.enemyType || "mob",
                    challengeRating: enemy.challengeRating || 1,
                    race: enemy.race || "",
                    class: enemy.class || "",
                    background: enemy.background || "",
                    alignment: enemy.alignment || "",
                    gender: enemy.gender || "",
                    age: enemy.age || "",
                    appearance: enemy.appearance || "",
                    personality: enemy.personality || "",
                    motivation: enemy.motivation || "",
                    stats: enemy.stats || formData.stats,
                    skills: enemy.skills || [],
                    equipment: enemy.equipment || [],
                    progression: [],
                    traits: enemy.traits || [],
                    relationships: [],
                    imageUrl: "",
                    customFields: [],
                    statuses: [],
                    notes: enemy.notes || "",
                    tactics: enemy.tactics || "",
                    loot: enemy.loot || [],
                    spawnLocations: enemy.spawnLocations || [],
                    behaviorPattern: enemy.behaviorPattern || "",
                  };
                  
                  const updatedEnemies = [...enemies, newEnemy];
                  setEnemies(updatedEnemies);
                  
                  if (currentCampaign) {
                    setCurrentCampaign({
                      ...currentCampaign,
                      enemies: updatedEnemies,
                      updatedAt: new Date(),
                    });
                  }
                });
              }
            } catch (error) {
              console.error("エネミー解析エラー:", error);
            }
          }
        },
      },
      currentCampaign
    );
  };

  // エネミータイプの表示名
  const getEnemyTypeName = (type: string) => {
    switch (type) {
      case "mob":
        return "モブ";
      case "elite":
        return "エリート";
      case "boss":
        return "ボス";
      default:
        return "不明";
    }
  };

  // エネミータイプの色
  const getEnemyTypeColor = (type: string) => {
    switch (type) {
      case "mob":
        return "default";
      case "elite":
        return "warning";
      case "boss":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {currentCampaign?.title || "キャンペーン"}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          エネミー管理
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 3 }}>
        <AIAssistButton
          onAssist={handleOpenAIAssist}
          text="AIでエネミー生成"
          variant="default"
          showHelp={true}
          helpText="キャンペーン設定に基づいて、適切なエネミーを自動生成します。"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新規エネミー
        </Button>
      </Box>

      {/* エネミーリスト */}
      <Grid container spacing={3}>
        {enemies.map((enemy) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={enemy.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ bgcolor: "error.main" }}>
                      <Dangerous />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{enemy.name}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          label={getEnemyTypeName(enemy.enemyType)}
                          size="small"
                          color={getEnemyTypeColor(enemy.enemyType) as any}
                        />
                        <Chip
                          icon={<Star />}
                          label={`CR ${enemy.challengeRating}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => handleOpenDialog(enemy)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteEnemy(enemy.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* ステータス表示 */}
                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Favorite fontSize="small" color="error" />
                      <Typography variant="body2">
                        HP: {enemy.stats.hitPoints.max}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Shield fontSize="small" color="primary" />
                      <Typography variant="body2">
                        AC: {enemy.stats.armorClass}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Speed fontSize="small" color="action" />
                      <Typography variant="body2">
                        速度: {enemy.stats.speed}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Bolt fontSize="small" color="warning" />
                      <Typography variant="body2">
                        レベル: {enemy.stats.level}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {enemy.tactics && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      戦術: {enemy.tactics}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {enemies.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="text.secondary">
            まだエネミーが登録されていません
          </Typography>
        </Box>
      )}

      {/* エネミー編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEnemy ? "エネミーを編集" : "新規エネミーを作成"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* 基本情報 */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="エネミー名"
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
                    value={formData.enemyType}
                    label="タイプ"
                    onChange={(e) => handleFormChange("enemyType", e.target.value)}
                  >
                    <MenuItem value="mob">モブ</MenuItem>
                    <MenuItem value="elite">エリート</MenuItem>
                    <MenuItem value="boss">ボス</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="CR (脅威度)"
                  type="number"
                  value={formData.challengeRating}
                  onChange={(e) => handleFormChange("challengeRating", parseFloat(e.target.value) || 1)}
                  fullWidth
                  inputProps={{ min: 0, max: 30, step: 0.25 }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="種族"
                  value={formData.race}
                  onChange={(e) => handleFormChange("race", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="クラス"
                  value={formData.class}
                  onChange={(e) => handleFormChange("class", e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="属性"
                  value={formData.alignment}
                  onChange={(e) => handleFormChange("alignment", e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>

            {/* ステータス */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                基本ステータス
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="筋力"
                    type="number"
                    value={formData.stats.strength}
                    onChange={(e) => handleStatChange("strength", parseInt(e.target.value) || 10)}
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="敏捷力"
                    type="number"
                    value={formData.stats.dexterity}
                    onChange={(e) => handleStatChange("dexterity", parseInt(e.target.value) || 10)}
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="耐久力"
                    type="number"
                    value={formData.stats.constitution}
                    onChange={(e) => handleStatChange("constitution", parseInt(e.target.value) || 10)}
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="知力"
                    type="number"
                    value={formData.stats.intelligence}
                    onChange={(e) => handleStatChange("intelligence", parseInt(e.target.value) || 10)}
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="判断力"
                    type="number"
                    value={formData.stats.wisdom}
                    onChange={(e) => handleStatChange("wisdom", parseInt(e.target.value) || 10)}
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="魅力"
                    type="number"
                    value={formData.stats.charisma}
                    onChange={(e) => handleStatChange("charisma", parseInt(e.target.value) || 10)}
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* 戦闘データ */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                戦闘データ
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="最大HP"
                    type="number"
                    value={formData.stats.hitPoints.max}
                    onChange={(e) => handleHPChange("max", parseInt(e.target.value) || 10)}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="AC"
                    type="number"
                    value={formData.stats.armorClass}
                    onChange={(e) => handleStatChange("armorClass", parseInt(e.target.value) || 10)}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="移動速度"
                    type="number"
                    value={formData.stats.speed}
                    onChange={(e) => handleStatChange("speed", parseInt(e.target.value) || 30)}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="レベル"
                    type="number"
                    value={formData.stats.level}
                    onChange={(e) => handleStatChange("level", parseInt(e.target.value) || 1)}
                    fullWidth
                    inputProps={{ min: 1, max: 20 }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* 特殊情報 */}
            <TextField
              label="戦術"
              value={formData.tactics}
              onChange={(e) => handleFormChange("tactics", e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder="このエネミーの戦闘時の行動パターンや戦術"
            />

            <TextField
              label="行動パターン"
              value={formData.behaviorPattern}
              onChange={(e) => handleFormChange("behaviorPattern", e.target.value)}
              multiline
              rows={2}
              fullWidth
              placeholder="非戦闘時の行動パターンや習性"
            />

            <TextField
              label="外見"
              value={formData.appearance}
              onChange={(e) => handleFormChange("appearance", e.target.value)}
              multiline
              rows={2}
              fullWidth
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
          <Button onClick={handleSaveEnemy} variant="contained" disabled={!formData.name.trim()}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnemyPage;
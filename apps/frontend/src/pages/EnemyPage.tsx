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
import { EnemyCharacter } from "@trpg-ai-gm/types";

const EnemyPage: React.FC = () => {
  const [currentCampaign, setCurrentCampaign] =
    useRecoilState(currentCampaignState);
  const [enemies, setEnemies] = useState<EnemyCharacter[]>(
    currentCampaign?.enemies || []
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnemy, setEditingEnemy] = useState<EnemyCharacter | null>(null);
  const [formData, setFormData] = useState<EnemyCharacter>({
    id: "",
    name: "",
    rank: "モブ",
    type: "",
    description: "",
    level: 1,
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
    },
    derivedStats: {
      hp: 10,
      mp: 0,
      attack: 10,
      defense: 10,
      magicAttack: 10,
      magicDefense: 10,
      accuracy: 10,
      evasion: 10,
      criticalRate: 5,
      initiative: 10,
    },
    skills: {
      basicAttack: "",
      specialSkills: [],
      passives: [],
    },
    behavior: {
      aiPattern: "",
      targeting: "",
    },
    drops: {
      exp: 0,
      gold: 0,
      items: [],
      rareDrops: [],
    },
    status: {
      currentHp: 10,
      currentMp: 0,
      statusEffects: [],
      location: "",
    },
    imageUrl: "",
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
        rank: "モブ",
        type: "",
        description: "",
        level: 1,
        attributes: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
        },
        derivedStats: {
          hp: 10,
          mp: 0,
          attack: 10,
          defense: 10,
          magicAttack: 10,
          magicDefense: 10,
          accuracy: 10,
          evasion: 10,
          criticalRate: 5,
          initiative: 10,
        },
        skills: {
          basicAttack: "",
          specialSkills: [],
          passives: [],
        },
        behavior: {
          aiPattern: "",
          targeting: "",
        },
        drops: {
          exp: 0,
          gold: 0,
          items: [],
          rareDrops: [],
        },
        status: {
          currentHp: 10,
          currentMp: 0,
          statusEffects: [],
          location: "",
        },
        imageUrl: "",
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
  const handleStatChange = (stat: string, value: number) => {
    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        [stat]: value,
      },
    });
  };

  // HP変更
  const handleHPChange = (value: number) => {
    setFormData({
      ...formData,
      derivedStats: {
        ...formData.derivedStats,
        hp: value,
      },
    });
  };

  // AIアシスト機能
  const handleOpenAIAssist = async () => {
    openAIAssist(
      "characters",
      {
        title: "エネミー生成アシスタント",
        description:
          "キャンペーン設定やクエストに基づいて、適切なエネミーを生成します。",
        defaultMessage:
          "現在のキャンペーンとクエストに基づいて、プレイヤーが遭遇するエネミーを提案してください。モブ、エリート、ボスなど、バリエーションのあるエネミーを含めてください。",
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
                    rank: enemy.rank || "モブ",
                    type: enemy.type || "",
                    description: enemy.description || "",
                    level: enemy.level || 1,
                    attributes: enemy.attributes || formData.attributes,
                    derivedStats: enemy.derivedStats || formData.derivedStats,
                    skills: enemy.skills || formData.skills,
                    behavior: enemy.behavior || formData.behavior,
                    drops: enemy.drops || formData.drops,
                    status: enemy.status || {
                      currentHp: 10,
                      currentMp: 0,
                      statusEffects: [],
                      location: "",
                    },
                    imageUrl: enemy.imageUrl || "",
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
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ bgcolor: "error.main" }}>
                      <Dangerous />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{enemy.name}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip label={enemy.rank} size="small" color="primary" />
                        <Chip
                          icon={<Star />}
                          label={`Lv ${enemy.level}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(enemy)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteEnemy(enemy.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* ステータス表示 */}
                <Grid container spacing={1}>
                  <Grid size={{ xs: 6 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Favorite fontSize="small" color="error" />
                      <Typography variant="body2">
                        HP: {enemy.derivedStats?.hp ?? 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Shield fontSize="small" color="primary" />
                      <Typography variant="body2">
                        防御: {enemy.derivedStats?.defense ?? 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Speed fontSize="small" color="action" />
                      <Typography variant="body2">
                        イニシアチブ: {enemy.derivedStats?.initiative ?? 0}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Bolt fontSize="small" color="warning" />
                      <Typography variant="body2">
                        レベル: {enemy.level}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {enemy.behavior?.aiPattern && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      AI行動: {enemy.behavior.aiPattern}
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
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
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
                    value={formData.rank}
                    label="ランク"
                    onChange={(e) => handleFormChange("rank", e.target.value)}
                  >
                    <MenuItem value="モブ">モブ</MenuItem>
                    <MenuItem value="中ボス">中ボス</MenuItem>
                    <MenuItem value="ボス">ボス</MenuItem>
                    <MenuItem value="EXボス">EXボス</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="レベル"
                  type="number"
                  value={formData.level}
                  onChange={(e) =>
                    handleFormChange("level", parseInt(e.target.value) || 1)
                  }
                  fullWidth
                  inputProps={{ min: 0, max: 30, step: 0.25 }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="タイプ"
                  value={formData.type}
                  onChange={(e) => handleFormChange("type", e.target.value)}
                  fullWidth
                  placeholder="例：アンデッド、魔獣、機械"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="説明"
                  value={formData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  fullWidth
                  multiline
                  rows={2}
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
                    value={formData.attributes.strength}
                    onChange={(e) =>
                      handleStatChange(
                        "strength",
                        parseInt(e.target.value) || 10
                      )
                    }
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="敏捷力"
                    type="number"
                    value={formData.attributes.dexterity}
                    onChange={(e) =>
                      handleStatChange(
                        "dexterity",
                        parseInt(e.target.value) || 10
                      )
                    }
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="耐久力"
                    type="number"
                    value={formData.attributes.constitution}
                    onChange={(e) =>
                      handleStatChange(
                        "constitution",
                        parseInt(e.target.value) || 10
                      )
                    }
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="知力"
                    type="number"
                    value={formData.attributes.intelligence}
                    onChange={(e) =>
                      handleStatChange(
                        "intelligence",
                        parseInt(e.target.value) || 10
                      )
                    }
                    fullWidth
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <TextField
                    label="判断力"
                    type="number"
                    value={formData.attributes.wisdom}
                    onChange={(e) =>
                      handleStatChange("wisdom", parseInt(e.target.value) || 10)
                    }
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
                    value={formData.derivedStats.hp}
                    onChange={(e) =>
                      handleHPChange(parseInt(e.target.value) || 10)
                    }
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="防御力"
                    type="number"
                    value={formData.derivedStats.defense}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        derivedStats: {
                          ...formData.derivedStats,
                          defense: parseInt(e.target.value) || 10,
                        },
                      })
                    }
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="イニシアチブ"
                    type="number"
                    value={formData.derivedStats.initiative}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        derivedStats: {
                          ...formData.derivedStats,
                          initiative: parseInt(e.target.value) || 10,
                        },
                      })
                    }
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    label="レベル"
                    type="number"
                    value={formData.level}
                    onChange={(e) =>
                      handleFormChange("level", parseInt(e.target.value) || 1)
                    }
                    fullWidth
                    inputProps={{ min: 1, max: 20 }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* 特殊情報 */}
            <TextField
              label="AI行動パターン"
              value={formData.behavior.aiPattern}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  behavior: {
                    ...formData.behavior,
                    aiPattern: e.target.value,
                  },
                })
              }
              multiline
              rows={2}
              fullWidth
              placeholder="このエネミーの戦闘時の行動パターンや戦術"
            />

            <TextField
              label="ターゲット指定"
              value={formData.behavior.targeting}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  behavior: {
                    ...formData.behavior,
                    targeting: e.target.value,
                  },
                })
              }
              multiline
              rows={2}
              fullWidth
              placeholder="誰を優先的にターゲットするか"
            />

            <TextField
              label="基本攻撃"
              value={formData.skills.basicAttack}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  skills: {
                    ...formData.skills,
                    basicAttack: e.target.value,
                  },
                })
              }
              fullWidth
              placeholder="基本攻撃の説明"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button
            onClick={handleSaveEnemy}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnemyPage;

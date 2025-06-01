import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  Grid,
  Divider,
  Stack,
} from "@mui/material";
import {
  Image as ImageIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import {
  TRPGCharacter,
  CharacterStatus,
  CharacterTrait,
  QuestElement,
} from "@novel-ai-assistant/types";
import CharacterStatusList from "./CharacterStatusList";
import CharacterStatusEditorDialog from "./CharacterStatusEditorDialog";
import { useAIChatIntegration } from "../../hooks/useAIChatIntegration";
import { SelectChangeEvent } from "@mui/material/Select";
import { useRecoilValue } from "recoil";
import { currentCampaignState, ResponseData } from "../../store/atoms";
import { AIAssistButton } from "../ui/AIAssistButton";

// キャラクタータイプに応じたアイコンとカラーを定義
const characterTypeIcons: Record<
  TRPGCharacter["characterType"] | "default",
  { color: string; emoji: string; label: string }
> = {
  PC: {
    color: "#FFD700", // ゴールド
    emoji: "🦸",
    label: "プレイヤーキャラクター",
  },
  NPC: {
    color: "#4169E1", // ロイヤルブルー
    emoji: "👤",
    label: "NPC",
  },
  Enemy: {
    color: "#DC143C", // クリムゾン
    emoji: "👹",
    label: "エネミー",
  },
  default: {
    color: "#808080", // グレー
    emoji: "❓",
    label: "その他",
  },
};

// 利用可能な絵文字リスト
const availableEmojis = [
  "🦸", "👤", "👹", "🧙", "⚔️", "🛡️", "🏹", "🗡️",
  "👑", "🦹", "🧝", "👸", "🤴", "🥷", "🧚", "🧛",
  "🧟", "🧞", "🐉", "🦊", "🐺", "🦁", "🐯", "🐻",
];

interface CharacterFormProps {
  formData: TRPGCharacter;
  formErrors: Record<string, string>;
  selectedEmoji: string;
  tempImageUrl: string;
  newTrait: string;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSelectChange: (e: {
    target: { name: string; value: any };
  }) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEmojiSelect: (emoji: string) => void;
  onNewTraitChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddTrait: (trait: { value: string; source: string }) => void;
  onRemoveTrait: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onSaveStatus: (status: CharacterStatus) => void;
  onDeleteStatus: (statusId: string) => void;
  onStatsChange: (stats: TRPGCharacter["stats"]) => void;
  onSkillsChange: (skills: TRPGCharacter["skills"]) => void;
  onEquipmentChange: (equipment: TRPGCharacter["equipment"]) => void;
}

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
      id={`character-tabpanel-${index}`}
      aria-labelledby={`character-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const CharacterForm: React.FC<CharacterFormProps> = ({
  formData,
  formErrors,
  selectedEmoji,
  tempImageUrl,
  newTrait,
  onInputChange,
  onSelectChange,
  onImageUpload,
  onEmojiSelect,
  onNewTraitChange,
  onAddTrait,
  onRemoveTrait,
  onSave,
  onCancel,
  onSaveStatus,
  onDeleteStatus,
  onStatsChange,
  onSkillsChange,
  onEquipmentChange,
}) => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [activeTab, setActiveTab] = useState(0);
  const [statusEditorOpen, setStatusEditorOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<CharacterStatus | undefined>(
    undefined
  );
  const { openAIAssist } = useAIChatIntegration();

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Status editor handlers
  const handleOpenStatusEditor = (status?: CharacterStatus) => {
    setEditingStatus(status);
    setStatusEditorOpen(true);
  };

  const handleCloseStatusEditor = () => {
    setStatusEditorOpen(false);
    setEditingStatus(undefined);
  };

  const handleSaveStatusCallback = (status: CharacterStatus) => {
    onSaveStatus(status);
    handleCloseStatusEditor();
  };

  // AIアシスト機能
  const handleOpenAIAssist = (target: string) => async () => {
    const defaultMessage = `TRPGキャラクターの${target}を生成してください。
キャンペーン背景: ${currentCampaign?.synopsis || "（背景情報なし）"}
キャラクタータイプ: ${formData.characterType}
${formData.name ? `名前: ${formData.name}` : ""}`;

    await openAIAssist(
      "characters",
      {
        title: `AIに${target}を提案してもらう`,
        description: `キャンペーン背景を参照して、キャラクターの${target}を生成します。`,
        defaultMessage,
        onComplete: (result: ResponseData) => {
          if (result.content && typeof result.content === "string") {
            // AI応答の処理（簡略化版）
            console.log("AI Response:", result.content);
          }
        },
      },
      currentCampaign,
      []
    );
  };

  // 能力値の更新
  const handleStatChange = (statName: string, value: number) => {
    const newStats = {
      ...formData.stats,
      [statName]: value,
    };
    onStatsChange(newStats);
  };

  // アイコンプレビュー
  const getIconPreview = () => {
    if (tempImageUrl && !tempImageUrl.startsWith("data:text/plain")) {
      return (
        <img
          src={tempImageUrl}
          alt="Character preview"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
        />
      );
    } else if (selectedEmoji) {
      return (
        <Avatar
          sx={{
            width: 80,
            height: 80,
            fontSize: "3rem",
            bgcolor:
              characterTypeIcons[formData.characterType]?.color ||
              characterTypeIcons.default.color,
          }}
        >
          {selectedEmoji}
        </Avatar>
      );
    } else {
      return (
        <Typography variant="body2" color="text.secondary">
          画像または絵文字を選択してください
        </Typography>
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="基本情報" />
        <Tab label="能力値" />
        <Tab label="スキル" />
        <Tab label="装備" />
        <Tab label="画像・状態" />
      </Tabs>

      {/* 基本情報タブ */}
      <TabPanel value={activeTab} index={0}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6">基本情報</Typography>
            <AIAssistButton
              onAssist={handleOpenAIAssist("基本情報")}
              text="AI提案"
              variant="outline"
            />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="名前"
                value={formData.name || ""}
                onChange={onInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>キャラクタータイプ</InputLabel>
                <Select
                  name="characterType"
                  value={formData.characterType || "PC"}
                  label="キャラクタータイプ"
                  onChange={(e: SelectChangeEvent) =>
                    onSelectChange({
                      target: {
                        name: "characterType",
                        value: e.target.value as TRPGCharacter["characterType"],
                      },
                    })
                  }
                >
                  <MenuItem value="PC">プレイヤーキャラクター</MenuItem>
                  <MenuItem value="NPC">NPC</MenuItem>
                  <MenuItem value="Enemy">エネミー</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.characterType === "PC" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  name="playerName"
                  label="プレイヤー名"
                  value={formData.playerName || ""}
                  onChange={onInputChange}
                  fullWidth
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                name="race"
                label="種族"
                value={formData.race || ""}
                onChange={onInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="class"
                label="職業/クラス"
                value={formData.class || ""}
                onChange={onInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="gender"
                label="性別"
                value={formData.gender || ""}
                onChange={onInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="age"
                label="年齢"
                value={formData.age || ""}
                onChange={onInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="alignment"
                label="属性/アライメント"
                value={formData.alignment || ""}
                onChange={onInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="background"
                label="背景"
                value={formData.background || ""}
                onChange={onInputChange}
                multiline
                rows={3}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="personality"
                label="性格"
                value={formData.personality || ""}
                onChange={onInputChange}
                multiline
                rows={2}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="appearance"
                label="外見"
                value={formData.appearance || ""}
                onChange={onInputChange}
                multiline
                rows={2}
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      {/* 能力値タブ */}
      <TabPanel value={activeTab} index={1}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            能力値（ステータス）
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={3}>
              <TextField
                label="STR (筋力)"
                type="number"
                value={formData.stats?.STR || 10}
                onChange={(e) => handleStatChange("STR", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <TextField
                label="CON (耐久力)"
                type="number"
                value={formData.stats?.CON || 10}
                onChange={(e) => handleStatChange("CON", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <TextField
                label="DEX (器用さ)"
                type="number"
                value={formData.stats?.DEX || 10}
                onChange={(e) => handleStatChange("DEX", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <TextField
                label="INT (知力)"
                type="number"
                value={formData.stats?.INT || 10}
                onChange={(e) => handleStatChange("INT", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <TextField
                label="WIS (判断力)"
                type="number"
                value={formData.stats?.WIS || 10}
                onChange={(e) => handleStatChange("WIS", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <TextField
                label="CHA (魅力)"
                type="number"
                value={formData.stats?.CHA || 10}
                onChange={(e) => handleStatChange("CHA", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            派生ステータス
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <TextField
                label="HP (ヒットポイント)"
                type="number"
                value={formData.stats?.HP || 10}
                onChange={(e) => handleStatChange("HP", parseInt(e.target.value) || 10)}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                label="MP (マジックポイント)"
                type="number"
                value={formData.stats?.MP || 10}
                onChange={(e) => handleStatChange("MP", parseInt(e.target.value) || 10)}
                fullWidth
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField
                label="AC (アーマークラス)"
                type="number"
                value={formData.stats?.AC || 10}
                onChange={(e) => handleStatChange("AC", parseInt(e.target.value) || 10)}
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      {/* スキルタブ */}
      <TabPanel value={activeTab} index={2}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            スキル
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            キャラクターのスキルを管理します。詳細なスキル管理は後のアップデートで実装予定です。
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />}>
            スキルを追加
          </Button>
        </Box>
      </TabPanel>

      {/* 装備タブ */}
      <TabPanel value={activeTab} index={3}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            装備
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            キャラクターの装備を管理します。詳細な装備管理は後のアップデートで実装予定です。
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />}>
            装備を追加
          </Button>
        </Box>
      </TabPanel>

      {/* 画像・状態タブ */}
      <TabPanel value={activeTab} index={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            キャラクター画像/アイコン
          </Typography>
          <Box
            sx={{
              width: "100%",
              height: 200,
              border: "1px dashed grey",
              borderRadius: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 2,
              overflow: "hidden",
              backgroundColor: "#f5f5f5",
            }}
          >
            {getIconPreview()}
          </Box>

          <Button
            variant="outlined"
            component="label"
            startIcon={<ImageIcon />}
            sx={{ mr: 1 }}
          >
            画像をアップロード
            <input type="file" hidden accept="image/*" onChange={onImageUpload} />
          </Button>

          {formErrors.image && (
            <Typography
              color="error"
              variant="caption"
              sx={{ display: "block", mt: 1 }}
            >
              {formErrors.image}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              または絵文字アイコンを選択:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {availableEmojis.map((emoji, index) => (
                <Box key={index} sx={{ width: 40, height: 40 }}>
                  <Tooltip title={`${emoji}を選択`}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: "1.2rem",
                        cursor: "pointer",
                        bgcolor:
                          selectedEmoji === emoji
                            ? characterTypeIcons[formData.characterType]?.color ||
                              characterTypeIcons.default.color
                            : "transparent",
                        border:
                          selectedEmoji === emoji
                            ? "2px solid #000"
                            : "1px solid #ddd",
                        "&:hover": {
                          transform: "scale(1.1)",
                          transition: "transform 0.2s",
                        },
                      }}
                      onClick={() => onEmojiSelect(emoji)}
                    >
                      {emoji}
                    </Avatar>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>
            状態管理
          </Typography>
          <CharacterStatusList
            statuses={formData.statuses || []}
            onEdit={handleOpenStatusEditor}
            onDelete={onDeleteStatus}
          />
          <Button
            variant="outlined"
            onClick={() => handleOpenStatusEditor()}
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
          >
            新しい状態を追加
          </Button>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>
            特性
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
            <TextField
              label="新しい特性"
              value={newTrait}
              onChange={onNewTraitChange}
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <Button
              onClick={() => onAddTrait({ value: newTrait, source: "手動入力" })}
              variant="outlined"
              disabled={!newTrait.trim()}
            >
              追加
            </Button>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {(formData.traits || []).map((trait: CharacterTrait, index) => (
              <Chip
                key={trait.id || index}
                label={trait.name}
                onDelete={() => onRemoveTrait(index)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>
      </TabPanel>

      {/* アクションボタン */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>
          キャンセル
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          保存
        </Button>
      </Box>

      <CharacterStatusEditorDialog
        open={statusEditorOpen}
        editingStatus={editingStatus}
        onClose={handleCloseStatusEditor}
        onSave={handleSaveStatusCallback}
      />
    </Box>
  );
};

export default CharacterForm;
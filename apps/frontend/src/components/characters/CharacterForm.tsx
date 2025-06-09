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
  Switch,
  FormControlLabel,
  LinearProgress,
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
} from "@trpg-ai-gm/types";
import CharacterStatusList from "./CharacterStatusList";
import CharacterStatusEditorDialog from "./CharacterStatusEditorDialog";
import GameSystemTemplates from "../templates/GameSystemTemplates";
import { useAIChatIntegration } from "../../hooks/useAIChatIntegration";
import { SelectChangeEvent } from "@mui/material/Select";
import { useRecoilValue } from "recoil";
import { currentCampaignState, ResponseData } from "../../store/atoms";
import { AIAssistButton } from "../ui/AIAssistButton";
import RealTimeValidator, { createCommonRules } from "../ui/RealTimeValidator";
import useFormValidation, { TRPGValidationRules } from "../../hooks/useFormValidation";
import AIAutoComplete from "../ai/AIAutoComplete";
import AbilityScoreAllocationGuide from "./AbilityScoreAllocationGuide";

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
  onStatsChange: (stats: any) => void;
  onSkillsChange: (skills: TRPGCharacter["skills"]) => void;
  onEquipmentChange: (equipment: any) => void;
  onTemplateApplied?: (template: any, character: Partial<TRPGCharacter>) => void;
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
  onTemplateApplied,
}) => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [activeTab, setActiveTab] = useState(0);
  const [statusEditorOpen, setStatusEditorOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<CharacterStatus | undefined>(
    undefined
  );
  const { openAIAssist } = useAIChatIntegration();
  
  // AI自動補完の状態管理
  const [aiAutoCompleteEnabled, setAiAutoCompleteEnabled] = useState(true);
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const [currentField, setCurrentField] = useState<string>("");
  
  // フォーム検証の設定
  const {
    setValue,
    setFieldRules,
    getFieldError,
    hasFieldError,
    validationState,
    formScore,
    isFormValid
  } = useFormValidation(300);

  // フィールドナビゲーション機能
  const handleNavigateToField = (fieldName: string) => {
    // タブ間ナビゲーション
    const fieldTabMap: Record<string, number> = {
      'name': 1,
      'nation': 1,
      'profession': 1,
      'characterType': 1,
      'player': 1,
      'gender': 1,
      'age': 1,
      'description': 1,
      'background': 1,
      'personality': 1,
      'appearance': 1,
      'attributes': 2,
      'skills': 3,
      'equipment': 4,
    };

    const targetTab = fieldTabMap[fieldName];
    if (targetTab !== undefined) {
      setActiveTab(targetTab);
      
      // フィールドにフォーカス（遅延実行）
      setTimeout(() => {
        const element = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // バリデーションルールの設定
  React.useEffect(() => {
    setFieldRules("name", TRPGValidationRules.characterName());
    setFieldRules("nation", [
      createCommonRules.required("国籍/種族を入力してください"),
      createCommonRules.minLength(2, "国籍名は2文字以上で入力してください"),
      createCommonRules.maxLength(20, "国籍名は20文字以下で入力してください")
    ]);
    setFieldRules("profession", [
      createCommonRules.required("職業を入力してください"),
      createCommonRules.minLength(2, "職業名は2文字以上で入力してください")
    ]);
  }, [setFieldRules]);

  // フォームデータと検証の同期
  React.useEffect(() => {
    setValue("name", formData.name || "");
    setValue("nation", formData.nation || "");
    setValue("profession", formData.profession || "");
  }, [formData.name, formData.nation, formData.profession, setValue]);

  // 検証付き入力変更ハンドラ
  const handleValidatedInputChange = (fieldName: string, value: string) => {
    setValue(fieldName, value);
    // 既存のハンドラも呼び出す
    onInputChange({
      target: { name: fieldName, value }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // フォーカスイベントハンドラ（AI自動補完用）
  const handleFieldFocus = (fieldName: string) => (event: React.FocusEvent<HTMLInputElement>) => {
    setFocusedElement(event.target);
    setCurrentField(fieldName);
  };

  const handleFieldBlur = () => {
    // 少し遅延させてフォーカスを解除（AIAutoCompleteのクリックを可能にするため）
    setTimeout(() => {
      setFocusedElement(null);
      setCurrentField("");
    }, 150);
  };

  // AI提案受け入れハンドラ
  const handleAISuggestionAccepted = (suggestion: string) => {
    if (currentField) {
      handleValidatedInputChange(currentField, suggestion);
    }
  };

  // AI提案拒否ハンドラ
  const handleAISuggestionRejected = (suggestionId: string) => {
    console.log("AI suggestion rejected:", suggestionId);
  };

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
      ...formData.attributes,
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
        <Tab label="システムテンプレート" />
        <Tab label="基本情報" />
        <Tab label="能力値" />
        <Tab label="スキル" />
        <Tab label="装備" />
        <Tab label="画像・状態" />
      </Tabs>

      {/* システムテンプレートタブ */}
      <TabPanel value={activeTab} index={0}>
        <GameSystemTemplates
          onTemplateSelected={(template) => {
            if (onTemplateApplied) {
              onTemplateApplied(template, template.characterTemplate);
            }
          }}
          onCharacterTemplateApplied={(character) => {
            // 自動的に基本情報タブに移動
            setActiveTab(1);
          }}
        />
      </TabPanel>

      {/* 基本情報タブ */}
      <TabPanel value={activeTab} index={1}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="h6">基本情報</Typography>
            <AIAssistButton
              onAssist={handleOpenAIAssist("基本情報")}
              text="AI提案"
              variant="outline"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={aiAutoCompleteEnabled}
                  onChange={(e) => setAiAutoCompleteEnabled(e.target.checked)}
                  size="small"
                />
              }
              label="AI自動補完"
              sx={{ ml: 2 }}
            />
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RealTimeValidator
                value={formData.name || ""}
                label="名前 *"
                placeholder="キャラクターの名前を入力"
                rules={TRPGValidationRules.characterName()}
                onValueChange={(value) => handleValidatedInputChange("name", value)}
                onNavigateToField={handleNavigateToField}
                showValidationScore={true}
                suggestions={[
                  "アルトリア", "ガンダルフ", "レオナルド", "イザベラ", "ケイ",
                  "アーサー", "マーリン", "エレン", "ミカサ", "リヴァイ"
                ]}
                allowSuggestions={true}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
                </Select>
              </FormControl>
            </Grid>
            {formData.characterType === "PC" && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="playerName"
                  label="プレイヤー名"
                  value={formData.player || ""}
                  onChange={onInputChange}
                  fullWidth
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <RealTimeValidator
                value={formData.nation || ""}
                label="国籍/種族"
                placeholder="キャラクターの国籍や種族を入力"
                rules={[
                  createCommonRules.required("国籍/種族を入力してください"),
                  createCommonRules.minLength(2, "国籍名は2文字以上で入力してください"),
                  createCommonRules.maxLength(20, "国籍名は20文字以下で入力してください")
                ]}
                onValueChange={(value) => handleValidatedInputChange("nation", value)}
                onNavigateToField={handleNavigateToField}
                suggestions={[
                  "人間", "エルフ", "ドワーフ", "ハーフリング", "オーク",
                  "ハーフエルフ", "ドラゴンボーン", "ティーフリング", "ノーム"
                ]}
                allowSuggestions={true}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <RealTimeValidator
                value={formData.profession || ""}
                label="職業"
                placeholder="キャラクターの職業を入力"
                rules={[
                  createCommonRules.required("職業を入力してください"),
                  createCommonRules.minLength(2, "職業名は2文字以上で入力してください")
                ]}
                onValueChange={(value) => handleValidatedInputChange("profession", value)}
                onNavigateToField={handleNavigateToField}
                suggestions={[
                  "ファイター", "ウィザード", "クレリック", "ローグ", "レンジャー",
                  "パラディン", "バーバリアン", "ソーサラー", "バード", "ウォーロック"
                ]}
                allowSuggestions={true}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="gender"
                label="性別"
                value={formData.gender || ""}
                onChange={onInputChange}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="age"
                label="年齢"
                value={formData.age || ""}
                onChange={onInputChange}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="alignment"
                label="属性/アライメント"
                value={formData.description || ""}
                onChange={onInputChange}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="background"
                label="背景"
                value={formData.description || ""}
                onChange={onInputChange}
                onFocus={handleFieldFocus("background")}
                onBlur={handleFieldBlur}
                multiline
                rows={3}
                fullWidth
                placeholder="キャラクターの背景や経歴を入力（AI自動補完が利用可能）"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="personality"
                label="性格"
                value={formData.description || ""}
                onChange={onInputChange}
                onFocus={handleFieldFocus("personality")}
                onBlur={handleFieldBlur}
                multiline
                rows={2}
                fullWidth
                placeholder="キャラクターの性格や特徴を入力（AI自動補完が利用可能）"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="appearance"
                label="外見"
                value={formData.description || ""}
                onChange={onInputChange}
                onFocus={handleFieldFocus("appearance")}
                onBlur={handleFieldBlur}
                multiline
                rows={2}
                fullWidth
                placeholder="キャラクターの外見的特徴を入力（AI自動補完が利用可能）"
              />
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      {/* 能力値タブ */}
      <TabPanel value={activeTab} index={2}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            能力値（ステータス）
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <TextField
                label="STR (筋力)"
                type="number"
                value={formData.attributes?.STR || 10}
                onChange={(e) => handleStatChange("STR", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <TextField
                label="CON (耐久力)"
                type="number"
                value={formData.attributes?.CON || 10}
                onChange={(e) => handleStatChange("CON", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <TextField
                label="DEX (器用さ)"
                type="number"
                value={formData.attributes?.DEX || 10}
                onChange={(e) => handleStatChange("DEX", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <TextField
                label="INT (知力)"
                type="number"
                value={formData.attributes?.INT || 10}
                onChange={(e) => handleStatChange("INT", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <TextField
                label="POW (魔力)"
                type="number"
                value={formData.attributes?.POW || 10}
                onChange={(e) => handleStatChange("POW", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <TextField
                label="SIZ (体格)"
                type="number"
                value={formData.attributes?.SIZ || 10}
                onChange={(e) => handleStatChange("SIZ", parseInt(e.target.value) || 10)}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <TextField
                label="CHA (魅力)"
                type="number"
                value={formData.attributes?.CHA || 10}
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
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                label="HP (ヒットポイント)"
                type="number"
                value={formData.derived?.HP || 10}
                onChange={(e) => handleStatChange("HP", parseInt(e.target.value) || 10)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                label="MP (マジックポイント)"
                type="number"
                value={formData.derived?.MP || 10}
                onChange={(e) => handleStatChange("MP", parseInt(e.target.value) || 10)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField
                label="SW (先制値)"
                type="number"
                value={formData.derived?.SW || 10}
                onChange={(e) => handleStatChange("SW", parseInt(e.target.value) || 10)}
                fullWidth
              />
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      {/* スキルタブ */}
      <TabPanel value={activeTab} index={3}>
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
      <TabPanel value={activeTab} index={4}>
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
      <TabPanel value={activeTab} index={5}>
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
          {/* TODO: Implement character status management 
          <CharacterStatusList
            statuses={[]}
            onEdit={handleOpenStatusEditor}
            onDelete={onDeleteStatus}
          />
          */}
          <Typography variant="body2" color="text.secondary">
            キャラクター状態管理機能は今後実装予定です
          </Typography>
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
          {/* TODO: Implement character traits management
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[].map((trait: CharacterTrait, index: number) => (
              <Chip
                key={index}
                label={trait.name}
                onDelete={() => onRemoveTrait(index)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>
          */}
          <Typography variant="body2" color="text.secondary">
            キャラクター特性管理機能は今後実装予定です
          </Typography>
        </Box>
      </TabPanel>

      {/* バリデーションサマリー */}
      {Object.keys(validationState).length > 0 && (
        <Paper elevation={1} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2">
              フォーム品質スコア: {formScore}/100
            </Typography>
            <Chip 
              label={isFormValid ? "入力完了" : "入力中"} 
              color={isFormValid ? "success" : "warning"}
              size="small"
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={formScore} 
            color={isFormValid ? "success" : "warning"}
            sx={{ height: 6, borderRadius: 3 }}
          />
          {!isFormValid && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              エラーのあるフィールドを修正してください
            </Typography>
          )}
        </Paper>
      )}

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
          disabled={!isFormValid && Object.keys(validationState).length > 0}
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

      {/* AI自動補完コンポーネント */}
      <AIAutoComplete
        targetElement={focusedElement}
        currentValue={
          currentField === "background" ? formData.description || "" :
          currentField === "personality" ? formData.description || "" :
          currentField === "appearance" ? formData.description || "" :
          ""
        }
        field={currentField}
        context={{
          character: formData,
          campaign: currentCampaign || undefined,
          gameSystem: "Fantasy",
        }}
        onSuggestionAccepted={handleAISuggestionAccepted}
        onSuggestionRejected={handleAISuggestionRejected}
        enabled={aiAutoCompleteEnabled}
      />
    </Box>
  );
};

export default CharacterForm;
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
  // DialogContentText, // Unused
} from "@mui/material";
import {
  Image as ImageIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import {
  Character,
  CharacterStatus,
  CharacterTrait,
  PlotElement,
} from "@novel-ai-assistant/types";
import CharacterStatusList from "./CharacterStatusList";
import CharacterStatusEditorDialog from "./CharacterStatusEditorDialog";
import { useAIChatIntegration } from "../../hooks/useAIChatIntegration";
import { SelectChangeEvent } from "@mui/material/Select";
import { useRecoilValue } from "recoil";
import { currentProjectState, ResponseData } from "../../store/atoms";
import { AIAssistButton } from "../ui/AIAssistButton";
// import { useCurrentProject } from "../../contexts/CurrentProjectContext"; // Unused
// import { useCharactersContext } from "../../contexts/CharactersContext"; // Unused

// キャラクターの役割に応じたアイコンとカラーを定義
const characterIcons: Record<
  Character["role"] | "default",
  { color: string; emoji: string; label: string }
> = {
  protagonist: {
    color: "#FFD700", // ゴールド
    emoji: "👑",
    label: "主人公",
  },
  antagonist: {
    color: "#DC143C", // クリムゾン
    emoji: "😈",
    label: "敵役",
  },
  supporting: {
    color: "#4169E1", // ロイヤルブルー
    emoji: "🙂",
    label: "脇役",
  },
  default: {
    color: "#808080", // グレー
    emoji: "👤",
    label: "その他",
  },
};

// 利用可能な絵文字リスト
const availableEmojis = [
  "👑",
  "😈",
  "🙂",
  "👤",
  "🦸",
  "🦹",
  "🧙",
  "👸",
  "🤴",
  "👩‍🚀",
  "👨‍🚀",
  "👩‍🔬",
  "👨‍🔬",
  "🧝",
  "🧛",
  "🧟",
  "🧞",
  "🥷",
  "🧚",
  "🧜",
  "🧝‍♀️",
  "🧙‍♂️",
  "🦊",
  "🐱",
  "🐶",
  "🐺",
  "🦁",
  "🐯",
];

interface CharacterFormProps {
  formData: Character;
  formErrors: Record<string, string>;
  selectedEmoji: string;
  tempImageUrl: string;
  newTrait: string;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onSelectChange: (e: {
    target: { name: string; value: Character["role"] };
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
}) => {
  const currentProject = useRecoilValue(currentProjectState);
  const [statusEditorOpen, setStatusEditorOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<
    CharacterStatus | undefined
  >(undefined);
  const { openAIAssist } = useAIChatIntegration();

  // AIアシストを開く
  const handleOpenAIAssist =
    (target: "basic" | "background" | "personality") => async () => {
      const title =
        target === "basic"
          ? "AIにキャラクターの基本情報を提案してもらう"
          : target === "background"
          ? "AIにキャラクターの背景・動機を提案してもらう"
          : "AIにキャラクターの性格・特性を提案してもらう";

      const description =
        target === "basic"
          ? "あらすじとプロットを参照して、キャラクターの基本情報（名前、役割、性別、年齢など）を生成します。"
          : target === "background"
          ? "あらすじとプロットを参照して、キャラクターの背景や動機を生成します。"
          : "あらすじとプロットを参照して、キャラクターの性格や特性を生成します。";

      const defaultMessage =
        `あらすじとプロットを参照して、${
          target === "basic"
            ? "キャラクターの基本情報（名前、役割、性別、年齢など）"
            : target === "background"
            ? "キャラクターの背景や動機"
            : "キャラクターの性格や特性（長所、短所、特徴的な性格）"
        }を考えてください。\n\n` +
        `現在のあらすじ：\n${
          currentProject?.synopsis || "（あらすじがありません）"
        }\n\n` +
        `キャラクター名： ${formData.name || "（名前未設定）"}\n` +
        `役割： ${
          formData.role === "protagonist"
            ? "主人公"
            : formData.role === "antagonist"
            ? "敵役"
            : "脇役"
        }` +
        `${
          currentProject?.plot && currentProject.plot.length > 0
            ? "\n\nプロット：\n" +
              currentProject.plot
                .map((p: PlotElement) => `- ${p.title}: ${p.description}`)
                .join("\n")
            : ""
        }`;

      await openAIAssist(
        "characters",
        {
          title,
          description,
          defaultMessage,
          onComplete: (result: ResponseData) => {
            if (result.content) {
              applyAIResponse(result.content, target);
            }
          },
        },
        currentProject,
        []
      );
    };

  // AIの応答を適用する関数
  const applyAIResponse = (
    aiResponse: string,
    target: "basic" | "background" | "personality"
  ) => {
    if (target === "basic") {
      // 基本情報の抽出
      const nameMatch = aiResponse.match(/名前[：:]\s*(.+?)($|\n)/);
      if (nameMatch && nameMatch[1]) {
        onInputChange({
          target: { name: "name", value: nameMatch[1].trim() },
        } as React.ChangeEvent<HTMLInputElement>);
      }

      const roleMatch = aiResponse.match(
        /役割[：:]\s*(主人公|敵役|脇役)($|\n)/
      );
      if (roleMatch && roleMatch[1]) {
        const roleMap: Record<string, Character["role"]> = {
          主人公: "protagonist",
          敵役: "antagonist",
          脇役: "supporting",
        };
        const role = roleMap[roleMatch[1]] || "supporting";
        onSelectChange({ target: { name: "role", value: role } });
      }

      const genderMatch = aiResponse.match(/性別[：:]\s*(.+?)($|\n)/);
      if (genderMatch && genderMatch[1]) {
        onInputChange({
          target: { name: "gender", value: genderMatch[1].trim() },
        } as React.ChangeEvent<HTMLInputElement>);
      }

      const ageMatch = aiResponse.match(/年齢[：:]\s*(.+?)($|\n)/);
      if (ageMatch && ageMatch[1]) {
        onInputChange({
          target: { name: "age", value: ageMatch[1].trim() },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    } else if (target === "background") {
      // 背景情報の抽出
      const backgroundMatch = aiResponse.match(
        /背景[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
      );
      if (backgroundMatch && backgroundMatch[1]) {
        onInputChange({
          target: { name: "background", value: backgroundMatch[1].trim() },
        } as React.ChangeEvent<HTMLTextAreaElement>);
      }

      const motivationMatch = aiResponse.match(
        /動機[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
      );
      if (motivationMatch && motivationMatch[1]) {
        onInputChange({
          target: { name: "motivation", value: motivationMatch[1].trim() },
        } as React.ChangeEvent<HTMLTextAreaElement>);
      }
    } else if (target === "personality") {
      // 性格特性の抽出
      const traitsMatch = aiResponse.match(/特性[：:]\s*(.+?)(\n\n|\n[^:]|$)/s);
      if (traitsMatch && traitsMatch[1]) {
        const traits = traitsMatch[1]
          .split(/[,、]/)
          .map((t) => t.trim())
          .filter((t) => t && t.length > 0);

        // すでに存在する特性を除去して追加
        const existingTraitValues = new Set(
          (formData.traits || []).map((t: CharacterTrait) => t.value || t.name)
        );
        for (const traitValue of traits) {
          if (!existingTraitValues.has(traitValue)) {
            onAddTrait({ value: traitValue, source: "AI" });
          }
        }
      }

      // 説明の抽出
      const descriptionMatch = aiResponse.match(
        /説明[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
      );
      if (descriptionMatch && descriptionMatch[1]) {
        onInputChange({
          target: { name: "description", value: descriptionMatch[1].trim() },
        } as React.ChangeEvent<HTMLTextAreaElement>);
      }

      // 性格の抽出
      const personalityMatch = aiResponse.match(
        /性格[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
      );
      if (personalityMatch && personalityMatch[1]) {
        onInputChange({
          target: { name: "personality", value: personalityMatch[1].trim() },
        } as React.ChangeEvent<HTMLTextAreaElement>);
      }

      // 外見の抽出
      const appearanceMatch = aiResponse.match(
        /外見[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
      );
      if (appearanceMatch && appearanceMatch[1]) {
        onInputChange({
          target: { name: "appearance", value: appearanceMatch[1].trim() },
        } as React.ChangeEvent<HTMLTextAreaElement>);
      }
    }
  };

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
              characterIcons[formData.role]?.color ||
              characterIcons.default.color,
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
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="h6">基本情報</Typography>
          <AIAssistButton
            onAssist={handleOpenAIAssist("basic")}
            text="AI提案"
            variant="outline"
          />
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <TextField
            name="name"
            label="名前"
            value={formData.name || ""}
            onChange={onInputChange}
            error={!!formErrors.name}
            helperText={formErrors.name}
            required
          />
          <FormControl error={!!formErrors.role}>
            <InputLabel>役割</InputLabel>
            <Select
              name="role"
              value={formData.role || "supporting"}
              label="役割"
              onChange={(e: SelectChangeEvent) =>
                onSelectChange({
                  target: {
                    name: "role",
                    value: e.target.value as Character["role"],
                  },
                })
              }
            >
              <MenuItem value="protagonist">主人公</MenuItem>
              <MenuItem value="antagonist">敵役</MenuItem>
              <MenuItem value="supporting">脇役</MenuItem>
            </Select>
          </FormControl>
          <TextField
            name="gender"
            label="性別"
            value={formData.gender || ""}
            onChange={onInputChange}
          />
          <TextField
            name="age"
            label="年齢"
            value={formData.age || ""}
            onChange={onInputChange}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="h6">背景・動機</Typography>
          <AIAssistButton
            onAssist={handleOpenAIAssist("background")}
            text="AI提案"
            variant="outline"
          />
        </Box>
        <TextField
          name="background"
          label="背景"
          value={formData.background || ""}
          onChange={onInputChange}
          multiline
          rows={3}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          name="motivation"
          label="動機"
          value={formData.motivation || ""}
          onChange={onInputChange}
          multiline
          rows={2}
          fullWidth
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Typography variant="h6">性格・特性</Typography>
          <AIAssistButton
            onAssist={handleOpenAIAssist("personality")}
            text="AI提案"
            variant="outline"
          />
        </Box>
        <TextField
          name="personality"
          label="性格"
          value={formData.personality || ""}
          onChange={onInputChange}
          multiline
          rows={3}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          name="description"
          label="説明"
          value={formData.description || ""}
          onChange={onInputChange}
          multiline
          rows={3}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          name="appearance"
          label="外見"
          value={formData.appearance || ""}
          onChange={onInputChange}
          multiline
          rows={2}
          fullWidth
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
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
            sx={{ ml: 1 }}
          >
            追加
          </Button>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {(formData.traits || []).map((trait: CharacterTrait, index) => (
            <Chip
              key={trait.id || index}
              label={trait.name}
              onDelete={() => onRemoveTrait(index)}
              color="primary"
              variant="outlined"
            />
          ))}
          {!formData.traits || formData.traits.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              特性がありません
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
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
                          ? characterIcons[formData.role]?.color ||
                            characterIcons.default.color
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
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
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
      </Box>

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

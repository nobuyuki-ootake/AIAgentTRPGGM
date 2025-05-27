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
  Grid,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Stack,
  // DialogContentText, // 未使用のためコメントアウト
  // DialogTitle, // 未使用のためコメントアウト
  // DialogContent, // 未使用のためコメントアウト
  // DialogActions, // 未使用のためコメントアウト
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Image as ImageIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import {
  Character,
  CustomField,
  CharacterTrait,
  // CharacterRole, // 削除 (CharacterRoleType を types/index.ts で定義)
  // CharacterStatus, // 未使用のためコメントアウト
} from "@novel-ai-assistant/types";
import {
  characterIcons,
  availableEmojis,
  emojiToDataUrl,
  dataUrlToEmoji,
} from "./characterUtils";
import type { SelectChangeEvent } from "@mui/material/Select";
// import { useCharactersContext } from "../../contexts/CharactersContext"; // 未使用のためコメントアウト
// import { useAIAssist } from "../../hooks/useAIAssist"; // 未使用のためコメントアウト (AIAssistModal削除のため)
// import { AIAssistModal } from "../../components/common/AIAssistModal"; // 未使用のためコメントアウト (ファイル存在しないため)

interface CharacterFormProps {
  formData: Omit<Character, "traits"> & { traits: CharacterTrait[] };
  setFormData: React.Dispatch<React.SetStateAction<Character>>;
  formErrors: Record<string, string>;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * キャラクター編集フォームコンポーネント
 */
const CharacterForm: React.FC<CharacterFormProps> = ({
  formData,
  setFormData,
  formErrors,
  onSave,
  onCancel,
}) => {
  const [tempImageUrl, setTempImageUrl] = useState<string>(
    formData.imageUrl || ""
  );
  const [selectedEmoji, setSelectedEmoji] = useState<string>(
    dataUrlToEmoji(formData.imageUrl || "") || ""
  );
  const [newTrait, setNewTrait] = useState<string>("");
  const [newCustomField, setNewCustomField] = useState<CustomField>({
    id: "",
    name: "",
    value: "",
  });

  // フォーム入力の処理
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // セレクト入力の処理
  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const name = event.target.name as string;
    const value = event.target.value as string;
    setFormData({ ...formData, [name]: value });
  };

  // 画像アップロード処理
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      // エラー処理はこのコンポーネントの外で行う
      return;
    }

    // 画像のプレビューURLを作成
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setTempImageUrl(result);
      setFormData({ ...formData, imageUrl: result });
      setSelectedEmoji(""); // 画像がアップロードされたら絵文字選択をクリア
    };
    reader.readAsDataURL(file);
  };

  // 絵文字を選択してアイコンとして設定
  const handleEmojiSelect = (emoji: string) => {
    const emojiDataUrl = emojiToDataUrl(emoji);
    setSelectedEmoji(emoji);
    setTempImageUrl(""); // 絵文字が選択されたら画像をクリア
    setFormData({ ...formData, imageUrl: emojiDataUrl });
  };

  // 特性の追加
  const handleAddTrait = () => {
    if (!newTrait.trim()) return;
    const updatedTraits: CharacterTrait[] = [
      ...formData.traits,
      { id: uuidv4(), name: newTrait.trim(), value: "" },
    ];
    setFormData({ ...formData, traits: updatedTraits });
    setNewTrait("");
  };

  // 特性の削除
  const handleRemoveTrait = (index: number) => {
    const updatedTraits: CharacterTrait[] = formData.traits.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, traits: updatedTraits });
  };

  // カスタムフィールドの入力処理
  const handleCustomFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewCustomField({ ...newCustomField, [name]: value });
  };

  // カスタムフィールドの追加
  const handleAddCustomField = () => {
    if (!newCustomField.name.trim()) return;

    const customFields = formData.customFields || [];
    const updatedCustomFields = [
      ...customFields,
      { ...newCustomField, id: uuidv4() },
    ];

    setFormData({ ...formData, customFields: updatedCustomFields });
    setNewCustomField({ id: "", name: "", value: "" });
  };

  // カスタムフィールドの削除
  const handleRemoveCustomField = (id: string) => {
    const updatedCustomFields =
      formData.customFields?.filter((field) => field.id !== id) || [];
    setFormData({ ...formData, customFields: updatedCustomFields });
  };

  // デフォルトアイコンのプレビュー表示
  const getIconPreview = () => {
    if (tempImageUrl && !tempImageUrl.startsWith("data:text/plain")) {
      // 通常の画像
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
      // 選択した絵文字
      return (
        <Avatar
          sx={{
            width: 120,
            height: 120,
            fontSize: "4rem",
            bgcolor:
              characterIcons[formData.role]?.color ||
              characterIcons.default.color,
          }}
        >
          {selectedEmoji}
        </Avatar>
      );
    } else {
      // デフォルトアイコン
      const iconConfig =
        characterIcons[formData.role] || characterIcons.default;
      return (
        <Avatar
          sx={{
            width: 120,
            height: 120,
            fontSize: "4rem",
            bgcolor: iconConfig.color,
          }}
        >
          {iconConfig.emoji}
        </Avatar>
      );
    }
  };

  return (
    <>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* 左側：基本情報 */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              基本情報
            </Typography>
            <TextField
              fullWidth
              label="名前"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />
            <FormControl fullWidth margin="normal" error={!!formErrors.role}>
              <InputLabel id="role-label">役割</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                onChange={handleSelectChange}
                label="役割"
                required
              >
                <MenuItem value="protagonist">主人公</MenuItem>
                <MenuItem value="antagonist">敵役</MenuItem>
                <MenuItem value="supporting">脇役</MenuItem>
              </Select>
              {formErrors.role && (
                <FormHelperText>{formErrors.role}</FormHelperText>
              )}
            </FormControl>
            <TextField
              fullWidth
              label="性別"
              name="gender"
              value={formData.gender || ""}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="生年月日"
              name="birthDate"
              value={formData.birthDate || ""}
              onChange={handleInputChange}
              margin="normal"
              placeholder="YYYY-MM-DD または自由形式"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              説明
            </Typography>
            <TextField
              fullWidth
              label="キャラクター説明"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="背景"
              name="background"
              value={formData.background}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="動機"
              name="motivation"
              value={formData.motivation}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </Box>

        {/* 右側：画像とカスタムフィールド */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ mb: 4, textAlign: "center" }}>
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
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
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

            {/* 絵文字アイコン選択セクション */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                または絵文字アイコンを選択:
              </Typography>
              <Grid container spacing={1}>
                {availableEmojis.map((emoji, index) => (
                  <div key={index}>
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
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </Avatar>
                    </Tooltip>
                  </div>
                ))}
              </Grid>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              特性
            </Typography>
            <Box sx={{ display: "flex", mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                label="新しい特性"
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={handleAddTrait}
                disabled={!newTrait.trim()}
                sx={{ ml: 1 }}
              >
                追加
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {formData.traits!.map((trait: CharacterTrait, index: number) => (
                <Chip
                  key={trait.id}
                  label={trait.name}
                  onDelete={() => handleRemoveTrait(index)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
              {formData.traits!.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  特性がありません
                </Typography>
              )}
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              カスタムフィールド
            </Typography>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="フィールド名"
                name="name"
                value={newCustomField.name}
                onChange={handleCustomFieldChange}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: "flex" }}>
                <TextField
                  fullWidth
                  size="small"
                  label="値"
                  name="value"
                  value={newCustomField.value}
                  onChange={handleCustomFieldChange}
                />
                <Button
                  variant="contained"
                  onClick={handleAddCustomField}
                  disabled={!newCustomField.name.trim()}
                  sx={{ ml: 1 }}
                >
                  追加
                </Button>
              </Box>
            </Box>

            <List dense>
              {formData.customFields?.map((field) => (
                <ListItem
                  key={field.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveCustomField(field.id)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary={field.name} secondary={field.value} />
                </ListItem>
              ))}
              {(!formData.customFields ||
                formData.customFields.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  カスタムフィールドがありません
                </Typography>
              )}
            </List>
          </Box>
        </Box>
      </Stack>

      {/* フォームのアクション */}
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
    </>
  );
};

export default CharacterForm;

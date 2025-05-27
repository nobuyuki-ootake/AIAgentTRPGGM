import React from "react";
import { Box, TextField, Button, Typography, CardContent } from "@mui/material";
import { Save as SaveIcon, Edit as EditIcon } from "@mui/icons-material";
import { AIAssistButton } from "../ui/AIAssistButton";
import { useAIChatIntegration } from "../../hooks/useAIChatIntegration";
import { useRecoilValue } from "recoil";
import { currentProjectState } from "../../store/atoms";

interface SynopsisEditorProps {
  synopsis: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SynopsisEditor: React.FC<SynopsisEditorProps> = ({
  synopsis,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  onChange,
}) => {
  const currentProject = useRecoilValue(currentProjectState);
  const projectTitle = currentProject?.title || "";
  const { openAIAssist } = useAIChatIntegration();

  // AIアシスト機能の統合
  const handleOpenAIAssist = async (): Promise<void> => {
    // 編集モードでない場合は編集モードに切り替える
    if (!isEditing) {
      onEdit();
    }

    const defaultMessage = projectTitle
      ? `「${projectTitle}」という物語のあらすじを考えてください：`
      : "次のような物語のあらすじを考えてください：";

    openAIAssist(
      "synopsis",
      {
        title: "AIにあらすじを作成してもらう",
        description: `${
          projectTitle ? `「${projectTitle}」という` : ""
        }物語のあらすじを作成します。ジャンルや主人公、設定などのアイデアを入力してください。`,
        defaultMessage,
        onComplete: (result) => {
          // AIの応答を処理してシノプシスに設定
          if (result && result.content) {
            // テキストフィールドの変更をシミュレートするためイベントオブジェクトを作成
            const event = {
              target: { value: result.content },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(event);
          }
        },
      },
      currentProject
    );
  };

  return (
    <CardContent>
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">物語の概要</Typography>
        {isEditing ? (
          <Box>
            <Button
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
              onClick={onCancel}
            >
              キャンセル
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={!synopsis.trim()}
            >
              保存
            </Button>
          </Box>
        ) : (
          <Box>
            <AIAssistButton
              onAssist={handleOpenAIAssist}
              text="AIに項目を埋めてもらう"
              variant="outline"
              className="mr-2"
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >
              編集
            </Button>
          </Box>
        )}
      </Box>

      {isEditing ? (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            minRows={8}
            maxRows={15}
            value={synopsis}
            onChange={onChange}
            placeholder="あなたの物語のあらすじを入力してください。主要な登場人物、設定、物語の大まかな流れを含めるとよいでしょう。"
            variant="outlined"
            autoFocus
          />
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <AIAssistButton
              onAssist={handleOpenAIAssist}
              text="AIに項目を埋めてもらう"
              variant="outline"
            />
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {synopsis ? (
            <Typography
              variant="body1"
              sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
            >
              {synopsis}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: "italic" }}
            >
              まだあらすじが入力されていません。「編集」ボタンをクリックして、物語のあらすじを追加してください。または「AIに項目を埋めてもらう」ボタンを使用することもできます。
            </Typography>
          )}
        </Box>
      )}
    </CardContent>
  );
};

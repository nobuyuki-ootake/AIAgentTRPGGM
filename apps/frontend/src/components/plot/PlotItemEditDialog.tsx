import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { AIAssistButton } from "../ui/AIAssistButton";
import { useAIChatIntegration } from "../../hooks/useAIChatIntegration";
import { useRecoilValue } from "recoil";
import { currentProjectState } from "../../store/atoms";

interface PlotItemEditDialogProps {
  open: boolean;
  title: string;
  description: string;
  status: "決定" | "検討中";
  onClose: () => void;
  onUpdate: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStatusChange: (value: "決定" | "検討中") => void;
}

const PlotItemEditDialog: React.FC<PlotItemEditDialogProps> = ({
  open,
  title,
  description,
  status,
  onClose,
  onUpdate,
  onTitleChange,
  onDescriptionChange,
  onStatusChange,
}) => {
  const currentProject = useRecoilValue(currentProjectState);
  const { openAIAssist } = useAIChatIntegration();

  // AIの応答をプロットフォームに適用する関数
  const applyAIResponse = (aiResponse: string) => {
    // タイトルを抽出（最初の行や「タイトル:」などの形式から）
    const titleMatch = aiResponse.match(/タイトル[：:]\s*(.+?)($|\n)/);
    if (titleMatch && titleMatch[1]) {
      onTitleChange(titleMatch[1].trim());
    } else {
      // タイトルが明示的になければ、最初の行をタイトルとして抽出
      const firstLine = aiResponse.split("\n")[0].trim();
      if (firstLine && firstLine.length < 50) {
        // 短い文を想定
        onTitleChange(firstLine);
      }
    }

    // 詳細を抽出
    const descriptionMatch = aiResponse.match(
      /詳細[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
    );
    if (descriptionMatch && descriptionMatch[1]) {
      onDescriptionChange(descriptionMatch[1].trim());
    } else {
      // 詳細が明示的になければ、タイトル以外の内容を詳細として扱う
      const lines = aiResponse.split("\n");
      if (lines.length > 1) {
        // 最初の行をスキップして残りを詳細として使用
        onDescriptionChange(lines.slice(1).join("\n").trim());
      } else if (!titleMatch) {
        // 1行だけでタイトルとして使っていない場合は詳細として使用
        onDescriptionChange(aiResponse.trim());
      }
    }
  };

  // AIアシスト機能の統合
  const handleOpenAIAssist = async (): Promise<void> => {
    const defaultMessage = `あらすじを参照して、物語に必要なプロットアイテムを考えてください。\nタイトルと詳細を含めてください。\n\n現在のあらすじ:\n${
      currentProject?.synopsis || "（あらすじがありません）"
    }`;

    openAIAssist(
      "plot",
      {
        title: "AIにプロットアイテムを作成してもらう",
        description:
          "あらすじを参照して、物語のプロットアイテム（イベント、転換点など）を作成します。",
        defaultMessage,
        onComplete: (result) => {
          if (result && result.content && typeof result.content === "string") {
            applyAIResponse(result.content);
          }
        },
      },
      currentProject
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>プロットアイテム編集</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="タイトル"
            type="text"
            fullWidth
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="詳細"
            multiline
            rows={4}
            fullWidth
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="status-select-label">ステータス</InputLabel>
            <Select
              labelId="status-select-label"
              value={status}
              label="ステータス"
              onChange={(e: SelectChangeEvent) =>
                onStatusChange(e.target.value as "決定" | "検討中")
              }
            >
              <MenuItem value="決定">決定</MenuItem>
              <MenuItem value="検討中">検討中</MenuItem>
            </Select>
          </FormControl>
          <AIAssistButton
            onAssist={handleOpenAIAssist}
            text="AIに項目を埋めてもらう"
            variant="outline"
            width="full"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            キャンセル
          </Button>
          <Button
            onClick={onUpdate}
            color="primary"
            variant="contained"
            disabled={!title.trim()}
          >
            更新
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlotItemEditDialog;

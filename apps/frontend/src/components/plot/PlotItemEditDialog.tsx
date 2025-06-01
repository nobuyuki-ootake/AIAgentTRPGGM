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
  Box,
  Chip,
  Stack,
} from "@mui/material";
import { AIAssistButton } from "../ui/AIAssistButton";
import { useAIChatIntegration } from "../../hooks/useAIChatIntegration";
import { useRecoilValue } from "recoil";
import { currentCampaignState } from "../../store/atoms";

interface PlotItemEditDialogProps {
  open: boolean;
  title: string;
  description: string;
  status: "未開始" | "進行中" | "完了" | "失敗" | "保留";
  questType: "メイン" | "サブ" | "個人" | "隠し";
  difficulty: 1 | 2 | 3 | 4 | 5;
  scheduledDay?: number; // 日程
  rewards?: string[];
  prerequisites?: string[];
  onClose: () => void;
  onUpdate: () => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStatusChange: (value: "未開始" | "進行中" | "完了" | "失敗" | "保留") => void;
  onQuestTypeChange: (value: "メイン" | "サブ" | "個人" | "隠し") => void;
  onDifficultyChange: (value: 1 | 2 | 3 | 4 | 5) => void;
  onScheduledDayChange: (value: number | undefined) => void;
  onRewardsChange: (value: string[]) => void;
  onPrerequisitesChange: (value: string[]) => void;
}

const PlotItemEditDialog: React.FC<PlotItemEditDialogProps> = ({
  open,
  title,
  description,
  status,
  questType,
  difficulty,
  scheduledDay,
  rewards = [],
  prerequisites = [],
  onClose,
  onUpdate,
  onTitleChange,
  onDescriptionChange,
  onStatusChange,
  onQuestTypeChange,
  onDifficultyChange,
  onScheduledDayChange,
  onRewardsChange,
  onPrerequisitesChange,
}) => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const { openAIAssist } = useAIChatIntegration();
  
  // 新しい報酬入力用の状態
  const [newReward, setNewReward] = React.useState("");
  const [newPrerequisite, setNewPrerequisite] = React.useState("");

  // AIの応答をプロットフォームに適用する関数
  const applyAIResponse = (aiResponse: string) => {
    // タイトルを抽出
    const titleMatch = aiResponse.match(/タイトル[：:]\s*(.+?)($|\n)/);
    if (titleMatch && titleMatch[1]) {
      onTitleChange(titleMatch[1].trim());
    }

    // 詳細を抽出
    const descriptionMatch = aiResponse.match(
      /詳細[：:]\s*(.+?)(\n\n|\n[^:]|$)/s
    );
    if (descriptionMatch && descriptionMatch[1]) {
      onDescriptionChange(descriptionMatch[1].trim());
    }

    // 難易度を抽出
    const difficultyMatch = aiResponse.match(/難易度[：:]\s*(\d+)/);
    if (difficultyMatch && difficultyMatch[1]) {
      const diff = parseInt(difficultyMatch[1]);
      if (diff >= 1 && diff <= 5) {
        onDifficultyChange(diff as 1 | 2 | 3 | 4 | 5);
      }
    }

    // 報酬を抽出
    const rewardsMatch = aiResponse.match(/報酬[：:]\s*(.+?)(\n|$)/);
    if (rewardsMatch && rewardsMatch[1]) {
      const rewardsList = rewardsMatch[1].split(/[,、，]/).map(r => r.trim()).filter(r => r);
      onRewardsChange(rewardsList);
    }

    // 前提条件を抽出
    const prerequisitesMatch = aiResponse.match(/前提条件[：:]\s*(.+?)(\n|$)/);
    if (prerequisitesMatch && prerequisitesMatch[1]) {
      const prerequisitesList = prerequisitesMatch[1].split(/[,、，]/).map(p => p.trim()).filter(p => p);
      onPrerequisitesChange(prerequisitesList);
    }
  };

  // 報酬を追加
  const handleAddReward = () => {
    if (newReward.trim()) {
      onRewardsChange([...rewards, newReward.trim()]);
      setNewReward("");
    }
  };

  // 報酬を削除
  const handleRemoveReward = (index: number) => {
    onRewardsChange(rewards.filter((_, i) => i !== index));
  };

  // 前提条件を追加
  const handleAddPrerequisite = () => {
    if (newPrerequisite.trim()) {
      onPrerequisitesChange([...prerequisites, newPrerequisite.trim()]);
      setNewPrerequisite("");
    }
  };

  // 前提条件を削除
  const handleRemovePrerequisite = (index: number) => {
    onPrerequisitesChange(prerequisites.filter((_, i) => i !== index));
  };

  // AIアシスト機能の統合
  const handleOpenAIAssist = async (): Promise<void> => {
    const defaultMessage = `TRPGキャンペーンのクエストを考えてください。
キャンペーン背景: ${currentCampaign?.synopsis || "（キャンペーン背景がありません）"}

以下の形式で提案してください：
タイトル: [クエスト名]
詳細: [クエストの詳細説明]
難易度: [1-5の数値]
報酬: [報酬の内容（カンマ区切り）]
前提条件: [前提条件（カンマ区切り）]`;

    openAIAssist(
      "plot",
      {
        title: "AIにクエストを作成してもらう",
        description:
          "キャンペーン背景を参照して、TRPGのクエストを作成します。",
        defaultMessage,
        onComplete: (result) => {
          if (result && result.content && typeof result.content === "string") {
            applyAIResponse(result.content);
          }
        },
      },
      currentCampaign
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>クエスト編集</DialogTitle>
        <DialogContent dividers sx={{ overflowY: 'auto' }}>
          <TextField
            autoFocus
            margin="dense"
            label="クエスト名"
            type="text"
            fullWidth
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="詳細説明"
            multiline
            rows={4}
            fullWidth
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel id="quest-type-label">クエストタイプ</InputLabel>
              <Select
                labelId="quest-type-label"
                value={questType}
                label="クエストタイプ"
                onChange={(e: SelectChangeEvent) =>
                  onQuestTypeChange(e.target.value as "メイン" | "サブ" | "個人" | "隠し")
                }
              >
                <MenuItem value="メイン">メイン</MenuItem>
                <MenuItem value="サブ">サブ</MenuItem>
                <MenuItem value="個人">個人</MenuItem>
                <MenuItem value="隠し">隠し</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 1 }}>
              <InputLabel id="status-select-label">ステータス</InputLabel>
              <Select
                labelId="status-select-label"
                value={status}
                label="ステータス"
                onChange={(e: SelectChangeEvent) =>
                  onStatusChange(e.target.value as "未開始" | "進行中" | "完了" | "失敗" | "保留")
                }
              >
                <MenuItem value="未開始">未開始</MenuItem>
                <MenuItem value="進行中">進行中</MenuItem>
                <MenuItem value="完了">完了</MenuItem>
                <MenuItem value="失敗">失敗</MenuItem>
                <MenuItem value="保留">保留</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel id="difficulty-label">難易度</InputLabel>
              <Select
                labelId="difficulty-label"
                value={difficulty}
                label="難易度"
                onChange={(e: SelectChangeEvent<number>) =>
                  onDifficultyChange(e.target.value as 1 | 2 | 3 | 4 | 5)
                }
              >
                <MenuItem value={1}>1 - 簡単</MenuItem>
                <MenuItem value={2}>2 - やや簡単</MenuItem>
                <MenuItem value={3}>3 - 普通</MenuItem>
                <MenuItem value={4}>4 - 難しい</MenuItem>
                <MenuItem value={5}>5 - 非常に困難</MenuItem>
              </Select>
            </FormControl>

            <TextField
              sx={{ flex: 1 }}
              margin="dense"
              label="予定日程（何日目）"
              type="number"
              value={scheduledDay || ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : undefined;
                onScheduledDayChange(val);
              }}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>

          {/* 報酬セクション */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="報酬を追加"
                value={newReward}
                onChange={(e) => setNewReward(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddReward();
                    e.preventDefault();
                  }
                }}
                sx={{ flex: 1 }}
              />
              <Button onClick={handleAddReward} variant="outlined" size="small">
                追加
              </Button>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {rewards.map((reward, index) => (
                <Chip
                  key={index}
                  label={reward}
                  onDelete={() => handleRemoveReward(index)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>

          {/* 前提条件セクション */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="前提条件を追加"
                value={newPrerequisite}
                onChange={(e) => setNewPrerequisite(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPrerequisite();
                    e.preventDefault();
                  }
                }}
                sx={{ flex: 1 }}
              />
              <Button onClick={handleAddPrerequisite} variant="outlined" size="small">
                追加
              </Button>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {prerequisites.map((prerequisite, index) => (
                <Chip
                  key={index}
                  label={prerequisite}
                  onDelete={() => handleRemovePrerequisite(index)}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>

          <AIAssistButton
            onAssist={handleOpenAIAssist}
            text="AIにクエストを作成してもらう"
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

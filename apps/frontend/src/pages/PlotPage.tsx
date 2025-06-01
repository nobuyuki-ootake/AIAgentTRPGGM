import React from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
// import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"; // 削除
import PlotItem from "../components/plot/PlotItem";
import { PlotProvider, usePlotContext } from "../contexts/PlotContext";
import { useAIChatIntegration } from "../hooks/useAIChatIntegration";
import { TRPGCampaign } from "@novel-ai-assistant/types";

// PlotPageの実装コンポーネント
const PlotPageContent: React.FC = () => {
  const {
    plotItems,
    editItemTitle,
    editItemDescription,
    editItemStatus,
    isDialogOpen,
    hasUnsavedChanges,
    currentProject,
    setNewItemTitle,
    setNewItemDescription,
    setEditItemTitle,
    setEditItemDescription,
    setEditItemStatus,
    handleAddItem,
    handleDeleteItem,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleUpdateItem,
    // handleDragEnd, // PlotContextから受け取っているが、一旦削除
    handleStatusChange,
    handleSave,
    applyAIPlotResponse,
  } = usePlotContext();

  const { openAIAssist } = useAIChatIntegration();

  // AIアシスト機能の統合
  const handleOpenAIAssist = async (): Promise<void> => {
    openAIAssist(
      "quest",
      {
        title: "TRPGクエスト作成アシスタント",
        description:
          "キャンペーン設定を参照して、プレイヤーが挑戦できるクエストやイベントを生成します。",
        defaultMessage: `キャンペーン設定を参照して、TRPGセッションで使用できるクエストやイベントを複数考えてください。

メインクエスト、サブクエスト、ランダムエンカウンターなど、プレイヤーが楽しめる多様な要素を提案してください。

現在のキャンペーン設定:
${(currentProject as TRPGCampaign)?.synopsis || "（キャンペーン設定がありません）"}`,
        onComplete: (result) => {
          // クエスト生成完了時の処理
          console.log("クエスト生成完了:", result);
          if (result.content) {
            // result.contentが配列の場合は構造化されたデータ、文字列の場合は従来のレスポンス
            if (Array.isArray(result.content)) {
              applyAIPlotResponse(result.content);
            } else if (typeof result.content === "string") {
              applyAIPlotResponse(result.content);
            } else {
              console.warn("予期しないレスポンス形式:", result.content);
            }
          }
        },
      },
      currentProject
    );
  };

  if (!currentProject) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>キャンペーンが選択されていません。</Typography>
      </Container>
    );
  }

  // ステータス別のクエスト数をカウント
  const countByStatus = plotItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {(currentProject as TRPGCampaign).title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          クエスト・イベント管理
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              未実施: {countByStatus["検討中"] || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              完了: {countByStatus["決定"] || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              合計: {plotItems.length}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenAIAssist}
            >
              AIアシスト
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setNewItemTitle("");
                setNewItemDescription("");
                handleOpenEditDialog({
                  id: "",
                  title: "",
                  description: "",
                  order: plotItems.length,
                  status: "検討中",
                });
              }}
            >
              新規クエスト
            </Button>
            <Button
              variant="contained"
              color="success"
              disabled={!hasUnsavedChanges}
              onClick={handleSave}
            >
              変更を保存
            </Button>
          </Stack>
        </Box>
      </Paper>
      {/* <DragDropContext onDragEnd={handleDragEnd}> */} {/* 削除 */}
      {/* <Droppable droppableId="plot-items"> */}
      {/* 削除 */}
      {/* {(provided) => ( */}
      {/* 削除 */}
      <Box /* {...provided.droppableProps} ref={provided.innerRef} */>
        {" "}
        {/* refとprops削除 */}
        {plotItems.map(
          (
            item /*, index*/ // index を削除
          ) => (
            // <Draggable key={item.id} draggableId={item.id} index={index}> {/* 削除 */}
            // {(provided) => ( {/* 削除 */}
            <Box
              key={
                item.id
              } /* ref={provided.innerRef} {...provided.draggableProps} */
            >
              {" "}
              {/* refとprops削除、keyをBoxに移動 */}
              <PlotItem
                item={item}
                onEdit={() => handleOpenEditDialog(item)}
                onDelete={() => handleDeleteItem(item.id)}
                onStatusChange={handleStatusChange}
                // dragHandleProps={provided.dragHandleProps} // 削除
              />
            </Box>
            // )} {/* 削除 */}
            // </Draggable> /* 削除 */}
          )
        )}
        {/* {provided.placeholder} */}
        {/* 削除 */}
      </Box>
      {/* )} */}
      {/* 削除 */}
      {/* </Droppable> */}
      {/* 削除 */}
      {/* </DragDropContext> */} {/* 削除 */}
      {/* 編集ダイアログ */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editItemTitle ? "クエストを編集" : "新規クエスト"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="クエスト名"
              fullWidth
              margin="normal"
              value={editItemTitle}
              onChange={(e) => setEditItemTitle(e.target.value)}
            />
            <TextField
              label="クエスト詳細"
              fullWidth
              margin="normal"
              multiline
              rows={6}
              value={editItemDescription}
              onChange={(e) => setEditItemDescription(e.target.value)}
              placeholder="依頼人、目的、報酬、障害などを記載"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>ステータス</InputLabel>
              <Select
                value={editItemStatus}
                label="ステータス"
                onChange={(e) =>
                  setEditItemStatus(e.target.value as "検討中" | "決定")
                }
              >
                <MenuItem value="検討中">未実施</MenuItem>
                <MenuItem value="決定">完了</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>キャンセル</Button>
          <Button
            onClick={editItemTitle ? handleUpdateItem : handleAddItem}
            variant="contained"
            color="primary"
          >
            {editItemTitle ? "更新" : "追加"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// ラッパーコンポーネント
const PlotPage: React.FC = () => {
  return (
    <PlotProvider>
      <PlotPageContent />
    </PlotProvider>
  );
};

export default PlotPage;

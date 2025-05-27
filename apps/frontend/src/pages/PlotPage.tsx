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
import { NovelProject } from "@novel-ai-assistant/types";

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
      "plot",
      {
        title: "プロット作成アシスタント",
        description:
          "あらすじを参照して、物語に必要なプロットアイテムを生成します。",
        defaultMessage: `あらすじを参照して、物語に必要なプロットアイテムを複数考えてください。

物語の展開や重要な出来事、転換点などを含めて、魅力的なストーリーを構成するプロット要素を提案してください。

現在のあらすじ:
${(currentProject as NovelProject)?.synopsis || "（あらすじがありません）"}`,
        onComplete: (result) => {
          // プロット生成完了時の処理
          console.log("プロット生成完了:", result);
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
        <Typography>プロジェクトが選択されていません。</Typography>
      </Container>
    );
  }

  // ステータス別のアイテム数をカウント
  const countByStatus = plotItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {(currentProject as NovelProject).title}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          プロット
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
              検討中: {countByStatus["検討中"] || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              決定済み: {countByStatus["決定"] || 0}
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
              新規追加
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
          {editItemTitle ? "プロット項目を編集" : "新規プロット項目"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="タイトル"
              fullWidth
              margin="normal"
              value={editItemTitle}
              onChange={(e) => setEditItemTitle(e.target.value)}
            />
            <TextField
              label="説明"
              fullWidth
              margin="normal"
              multiline
              rows={6}
              value={editItemDescription}
              onChange={(e) => setEditItemDescription(e.target.value)}
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
                <MenuItem value="検討中">検討中</MenuItem>
                <MenuItem value="決定">決定</MenuItem>
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

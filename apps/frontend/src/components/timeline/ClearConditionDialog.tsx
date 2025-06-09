import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  IconButton,
  Chip,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Flag as FlagIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { ClearCondition, Item, QuestElement } from "@trpg-ai-gm/types";

interface ClearConditionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (clearConditions: ClearCondition[]) => void;
  existingConditions?: ClearCondition[];
  availableItems?: Item[];
  availableQuests?: QuestElement[];
  availableCharacters?: { id: string; name: string }[];
  availableLocations?: { id: string; name: string }[];
}

interface NewConditionFormData {
  title: string;
  description: string;
  type: ClearCondition["type"];
  priority: ClearCondition["priority"];
  successDescription: string;
  failureDescription: string;
  requiredItems: { itemId: string; itemName: string; quantity: number }[];
  requiredQuests: string[];
  requiredCharacters: string[];
  requiredLocation: string;
  storyMilestone: string;
  customDescription: string;
}

const ClearConditionDialog: React.FC<ClearConditionDialogProps> = ({
  open,
  onClose,
  onSave,
  existingConditions = [],
  availableItems = [],
  availableQuests = [],
  availableCharacters = [],
  availableLocations = [],
}) => {
  const [conditions, setConditions] = useState<ClearCondition[]>(existingConditions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCondition, setNewCondition] = useState<NewConditionFormData>({
    title: "",
    description: "",
    type: "item_collection",
    priority: "primary",
    successDescription: "",
    failureDescription: "",
    requiredItems: [],
    requiredQuests: [],
    requiredCharacters: [],
    requiredLocation: "",
    storyMilestone: "",
    customDescription: "",
  });

  useEffect(() => {
    setConditions(existingConditions);
  }, [existingConditions]);

  const handleAddCondition = () => {
    if (!newCondition.title.trim() || !newCondition.description.trim()) {
      return;
    }

    const condition: ClearCondition = {
      id: crypto.randomUUID(),
      title: newCondition.title,
      description: newCondition.description,
      type: newCondition.type,
      priority: newCondition.priority,
      successDescription: newCondition.successDescription || `${newCondition.title}を達成しました！`,
      failureDescription: newCondition.failureDescription,
    };

    // タイプに応じて必要なフィールドを設定
    switch (newCondition.type) {
      case "item_collection":
        condition.requiredItems = newCondition.requiredItems;
        break;
      case "quest_completion":
        condition.requiredQuests = newCondition.requiredQuests;
        break;
      case "character_survival":
        condition.requiredCharacters = newCondition.requiredCharacters;
        break;
      case "location_reached":
        condition.requiredLocation = newCondition.requiredLocation;
        break;
      case "story_milestone":
        condition.storyMilestone = newCondition.storyMilestone;
        break;
      case "custom":
        condition.customDescription = newCondition.customDescription;
        break;
    }

    setConditions([...conditions, condition]);
    setNewCondition({
      title: "",
      description: "",
      type: "item_collection",
      priority: "primary",
      successDescription: "",
      failureDescription: "",
      requiredItems: [],
      requiredQuests: [],
      requiredCharacters: [],
      requiredLocation: "",
      storyMilestone: "",
      customDescription: "",
    });
    setShowAddForm(false);
  };

  const handleDeleteCondition = (conditionId: string) => {
    setConditions(conditions.filter(c => c.id !== conditionId));
  };

  const handleAddRequiredItem = () => {
    if (availableItems.length === 0) return;
    
    const firstItem = availableItems[0];
    setNewCondition(prev => ({
      ...prev,
      requiredItems: [
        ...prev.requiredItems,
        { itemId: firstItem.id, itemName: firstItem.name, quantity: 1 }
      ]
    }));
  };

  const handleUpdateRequiredItem = (index: number, field: string, value: any) => {
    setNewCondition(prev => ({
      ...prev,
      requiredItems: prev.requiredItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleRemoveRequiredItem = (index: number) => {
    setNewCondition(prev => ({
      ...prev,
      requiredItems: prev.requiredItems.filter((_, i) => i !== index)
    }));
  };

  const getPriorityColor = (priority: ClearCondition["priority"]) => {
    switch (priority) {
      case "primary": return "error";
      case "secondary": return "warning";
      case "optional": return "info";
      default: return "default";
    }
  };

  const getPriorityLabel = (priority: ClearCondition["priority"]) => {
    switch (priority) {
      case "primary": return "必須";
      case "secondary": return "重要";
      case "optional": return "任意";
      default: return "不明";
    }
  };

  const getTypeLabel = (type: ClearCondition["type"]) => {
    switch (type) {
      case "item_collection": return "アイテム収集";
      case "quest_completion": return "クエスト完了";
      case "character_survival": return "キャラクター生存";
      case "location_reached": return "場所到達";
      case "story_milestone": return "ストーリー節目";
      case "custom": return "カスタム";
      default: return "不明";
    }
  };

  const handleSave = () => {
    onSave(conditions);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <FlagIcon color="primary" />
        キャンペーンクリア条件設定
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Alert severity="info">
          <Typography variant="body2">
            キャンペーンのクリア条件を設定します。プライマリ条件は達成必須、セカンダリ条件は重要、オプション条件は任意です。
          </Typography>
        </Alert>

        {/* 既存の条件リスト */}
        {conditions.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="primary" />
              設定済みクリア条件 ({conditions.length}件)
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: '200px', overflow: 'auto' }}>
              {conditions.map((condition) => (
                <Accordion key={condition.id} elevation={1}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Chip
                        label={getPriorityLabel(condition.priority)}
                        color={getPriorityColor(condition.priority)}
                        size="small"
                      />
                      <Chip
                        label={getTypeLabel(condition.type)}
                        variant="outlined"
                        size="small"
                      />
                      <Typography variant="subtitle1" sx={{ flex: 1 }}>
                        {condition.title}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCondition(condition.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {condition.description}
                    </Typography>
                    
                    {condition.requiredItems && condition.requiredItems.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>必要アイテム:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {condition.requiredItems.map((item, index) => (
                            <Chip
                              key={index}
                              label={`${item.itemName} x${item.quantity}`}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <Typography variant="body2" color="success.main">
                      <strong>成功時:</strong> {condition.successDescription}
                    </Typography>
                    
                    {condition.failureDescription && (
                      <Typography variant="body2" color="error.main">
                        <strong>失敗時:</strong> {condition.failureDescription}
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        )}

        <Divider />

        {/* 新しい条件追加フォーム */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              新しいクリア条件を追加
            </Typography>
            <Button
              variant={showAddForm ? "outlined" : "contained"}
              startIcon={<AddIcon />}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "キャンセル" : "条件を追加"}
            </Button>
          </Box>

          {showAddForm && (
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <TextField
                fullWidth
                label="条件名"
                value={newCondition.title}
                onChange={(e) => setNewCondition(prev => ({ ...prev, title: e.target.value }))}
                sx={{ mb: 2 }}
                required
              />

              <TextField
                fullWidth
                label="条件の説明"
                value={newCondition.description}
                onChange={(e) => setNewCondition(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
                sx={{ mb: 2 }}
                required
              />

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>条件タイプ</InputLabel>
                  <Select
                    value={newCondition.type}
                    label="条件タイプ"
                    onChange={(e) => setNewCondition(prev => ({ ...prev, type: e.target.value as ClearCondition["type"] }))}
                  >
                    <MenuItem value="item_collection">アイテム収集</MenuItem>
                    <MenuItem value="quest_completion">クエスト完了</MenuItem>
                    <MenuItem value="character_survival">キャラクター生存</MenuItem>
                    <MenuItem value="location_reached">場所到達</MenuItem>
                    <MenuItem value="story_milestone">ストーリー節目</MenuItem>
                    <MenuItem value="custom">カスタム</MenuItem>
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>重要度</InputLabel>
                  <Select
                    value={newCondition.priority}
                    label="重要度"
                    onChange={(e) => setNewCondition(prev => ({ ...prev, priority: e.target.value as ClearCondition["priority"] }))}
                  >
                    <MenuItem value="primary">必須</MenuItem>
                    <MenuItem value="secondary">重要</MenuItem>
                    <MenuItem value="optional">任意</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* タイプ別の追加設定 */}
              {newCondition.type === "item_collection" && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">必要アイテム</Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddRequiredItem}
                      disabled={availableItems.length === 0}
                    >
                      アイテム追加
                    </Button>
                  </Box>
                  
                  {newCondition.requiredItems.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>アイテム</InputLabel>
                        <Select
                          value={item.itemId}
                          label="アイテム"
                          onChange={(e) => {
                            const selectedItem = availableItems.find(i => i.id === e.target.value);
                            if (selectedItem) {
                              handleUpdateRequiredItem(index, 'itemId', e.target.value);
                              handleUpdateRequiredItem(index, 'itemName', selectedItem.name);
                            }
                          }}
                        >
                          {availableItems.map((availableItem) => (
                            <MenuItem key={availableItem.id} value={availableItem.id}>
                              {availableItem.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <TextField
                        label="数量"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateRequiredItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        sx={{ width: 100 }}
                        inputProps={{ min: 1 }}
                      />
                      
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveRequiredItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}

              {newCondition.type === "custom" && (
                <TextField
                  fullWidth
                  label="カスタム条件の詳細"
                  value={newCondition.customDescription}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, customDescription: e.target.value }))}
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                fullWidth
                label="成功時のメッセージ"
                value={newCondition.successDescription}
                onChange={(e) => setNewCondition(prev => ({ ...prev, successDescription: e.target.value }))}
                sx={{ mb: 2 }}
                placeholder="条件達成時に表示されるメッセージ"
              />

              <TextField
                fullWidth
                label="失敗時のメッセージ（任意）"
                value={newCondition.failureDescription}
                onChange={(e) => setNewCondition(prev => ({ ...prev, failureDescription: e.target.value }))}
                sx={{ mb: 2 }}
                placeholder="条件を満たせなかった場合のメッセージ"
              />

              <Button
                variant="contained"
                onClick={handleAddCondition}
                disabled={!newCondition.title.trim() || !newCondition.description.trim()}
                sx={{ mt: 1 }}
              >
                条件を追加
              </Button>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<FlagIcon />}
        >
          クリア条件を保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClearConditionDialog;
import React, { useState } from "react";
import { useWorldBuildingContext } from "../../contexts/WorldBuildingContext";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Explore,
  Forest,
  Castle,
  Terrain,
  ExpandMore as ExpandMoreIcon,
  Security,
  AttachMoney,
  People,
  ImageNotSupported,
  Image as ImageIcon,
} from "@mui/icons-material";
import { StartingLocationInfo } from "@trpg-ai-gm/types";
import { StartingLocationSelect, CurrentStartingLocationDisplay } from "./StartingLocationSelect";
import { useRecoilState } from "recoil";
import { currentCampaignState } from "../../store/atoms";

// 場所専用の簡略化された型定義
interface ExplorationLocation {
  id: string;
  name: string;
  type: "森" | "山" | "洞窟" | "遺跡" | "平原" | "海岸" | "砂漠" | "湿地" | "その他";
  region: string;
  description: string;
  dangerLevel: "極低" | "低" | "中" | "高" | "極高";
  
  // 探索系行動選択肢
  availableActions?: {
    id: string;
    name: string;
    description: string;
    category: "exploration" | "social" | "combat" | "survival" | "custom";
    requirements?: string[];
    effects?: string[];
  }[];
  
  // 遭遇・発見要素
  encounters: {
    monsters: string[];
    events: string[];
    treasures: string[];
    npcs: string[];
  };
  
  // 環境要因
  environment: {
    climate: string;
    terrain: string;
    hazards: string[];
  };
  
  // メタ情報
  meta: {
    unlocked: boolean;
    discovered: boolean;
    lastVisited?: string;
  };
  
  imageUrl?: string;
  created_at: string;
  updated_at: string;
}

const LocationTab: React.FC = () => {
  const { setHasUnsavedChanges } = useWorldBuildingContext();
  const [locations, setLocations] = useState<ExplorationLocation[]>([]);
  
  // 開始場所管理のための状態
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ExplorationLocation | null>(null);
  const [formData, setFormData] = useState<Omit<ExplorationLocation, "id" | "created_at" | "updated_at">>({
    name: "",
    type: "森",
    region: "",
    description: "",
    dangerLevel: "低",
    availableActions: [],
    encounters: {
      monsters: [],
      events: [],
      treasures: [],
      npcs: []
    },
    environment: {
      climate: "",
      terrain: "",
      hazards: []
    },
    meta: {
      unlocked: true,
      discovered: false
    }
  });

  // 行動選択肢編集用の状態
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [actionFormData, setActionFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "exploration" as const,
    requirements: [] as string[],
    effects: [] as string[]
  });

  // ダイアログを開く
  const handleOpenDialog = (location?: ExplorationLocation) => {
    if (location) {
      setEditingLocation(location);
      const { id, created_at, updated_at, ...editableData } = location;
      setFormData(editableData);
    } else {
      setEditingLocation(null);
      setFormData({
        name: "",
        type: "森",
        region: "",
        description: "",
        dangerLevel: "低",
        availableActions: [],
        encounters: {
          monsters: [],
          events: [],
          treasures: [],
          npcs: []
        },
        environment: {
          climate: "",
          terrain: "",
          hazards: []
        },
        meta: {
          unlocked: true,
          discovered: false
        }
      });
    }
    setDialogOpen(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLocation(null);
  };

  // 場所を保存
  const handleSaveLocation = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingLocation) {
        // 更新
        setLocations(prev => prev.map(loc => 
          loc.id === editingLocation.id 
            ? { ...loc, ...formData, updated_at: new Date().toISOString() }
            : loc
        ));
      } else {
        // 新規作成
        const newLocation: ExplorationLocation = {
          ...formData,
          id: `location-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setLocations(prev => [...prev, newLocation]);
      }
      setHasUnsavedChanges?.(true);
      handleCloseDialog();
    } catch (error) {
      console.error("場所の保存に失敗しました:", error);
    }
  };

  // 場所を削除
  const handleDeleteLocation = async (id: string) => {
    if (window.confirm("この場所を削除してもよろしいですか？")) {
      setLocations(prev => prev.filter(loc => loc.id !== id));
      setHasUnsavedChanges?.(true);
    }
  };

  // フォーム入力の処理
  const handleFormChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField as keyof typeof prev],
          [childField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // 開始場所として設定
  const handleSetAsStartingLocation = (locationId: string, locationName: string, locationType: "base" | "location") => {
    if (!currentCampaign) return;
    
    const startingLocation: StartingLocationInfo = {
      id: locationId,
      name: locationName,
      type: locationType,
      description: locations.find(l => l.id === locationId)?.description,
      imageUrl: locations.find(l => l.id === locationId)?.imageUrl,
      setAt: new Date(),
      isActive: true,
    };

    setCurrentCampaign(prev => prev ? {
      ...prev,
      startingLocation
    } : null);
    setHasUnsavedChanges?.(true);
  };

  // 開始場所設定を解除
  const handleRemoveStartingLocation = () => {
    if (!currentCampaign) return;
    
    setCurrentCampaign(prev => prev ? {
      ...prev,
      startingLocation: undefined
    } : null);
    setHasUnsavedChanges?.(true);
  };

  // 行動選択肢編集ダイアログを開く
  const handleOpenActionDialog = (actionIndex?: number) => {
    if (actionIndex !== undefined && formData.availableActions) {
      const action = formData.availableActions[actionIndex];
      setEditingActionIndex(actionIndex);
      setActionFormData({
        id: action.id,
        name: action.name,
        description: action.description,
        category: action.category,
        requirements: action.requirements || [],
        effects: action.effects || []
      });
    } else {
      setEditingActionIndex(null);
      setActionFormData({
        id: `action-${Date.now()}`,
        name: "",
        description: "",
        category: "exploration",
        requirements: [],
        effects: []
      });
    }
    setActionDialogOpen(true);
  };

  // 行動選択肢編集ダイアログを閉じる
  const handleCloseActionDialog = () => {
    setActionDialogOpen(false);
    setEditingActionIndex(null);
  };

  // 行動選択肢を保存
  const handleSaveAction = () => {
    if (!actionFormData.name.trim()) return;

    const newActions = [...(formData.availableActions || [])];
    
    if (editingActionIndex !== null) {
      // 既存の行動を更新
      newActions[editingActionIndex] = actionFormData;
    } else {
      // 新しい行動を追加
      newActions.push(actionFormData);
    }
    
    handleFormChange("availableActions", newActions);
    handleCloseActionDialog();
  };

  // 場所タイプのアイコンを取得
  const getLocationIcon = (type: string) => {
    switch (type) {
      case "森":
        return <Forest />;
      case "山":
        return <Terrain />;
      case "洞窟":
        return <Terrain />;
      case "遺跡":
        return <Castle />;
      default:
        return <Explore />;
    }
  };

  // 危険度の色を取得
  const getDangerColor = (dangerLevel: string) => {
    switch (dangerLevel) {
      case "極低":
      case "低":
        return "success";
      case "中":
        return "warning";
      case "高":
      case "極高":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">探索地・フィールド設定</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          新規場所
        </Button>
      </Box>

      {/* 現在の開始場所表示 */}
      <CurrentStartingLocationDisplay
        currentStartingLocation={currentCampaign?.startingLocation}
        onClearStartingLocation={handleRemoveStartingLocation}
        compact={true}
      />

      {/* 場所リスト */}
      <List>
        {locations.map((location, index) => (
          <React.Fragment key={location.id}>
            {index > 0 && <Divider />}
            <ListItem>
              <Card sx={{ width: "100%", my: 1 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    {/* 場所画像 */}
                    <Box sx={{ flexShrink: 0, width: 120, height: 90 }}>
                      {location.imageUrl ? (
                        <Box
                          component="img"
                          src={location.imageUrl}
                          alt={location.name}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "2px solid",
                            borderColor: "divider",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "action.hover",
                            borderRadius: 1,
                            border: "2px dashed",
                            borderColor: "divider",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <ImageNotSupported color="disabled" />
                          <Typography variant="caption" color="text.disabled" textAlign="center">
                            画像なし
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                        {getLocationIcon(location.type)}
                        <Typography variant="h6">
                          {location.name}
                        </Typography>
                        <Chip
                          label={location.type}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`危険度: ${location.dangerLevel}`}
                          size="small"
                          color={getDangerColor(location.dangerLevel) as any}
                        />
                        {!location.meta.unlocked && (
                          <Chip
                            label="未開放"
                            size="small"
                            color="warning"
                          />
                        )}
                        {location.meta.discovered && (
                          <Chip
                            label="発見済み"
                            size="small"
                            color="info"
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {location.description}
                      </Typography>
                      
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {location.region && (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              地域: {location.region}
                            </Typography>
                          </Grid>
                        )}
                        {location.environment.climate && (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              気候: {location.environment.climate}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>

                      {/* 行動選択肢情報 */}
                      {location.availableActions && location.availableActions.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            探索行動 ({location.availableActions.length}件):
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {location.availableActions.slice(0, 3).map((action, i) => (
                              <Chip 
                                key={`action-${i}`} 
                                label={action.name} 
                                size="small" 
                                color="secondary" 
                                variant="outlined" 
                              />
                            ))}
                            {location.availableActions.length > 3 && (
                              <Chip 
                                label={`他${location.availableActions.length - 3}件`} 
                                size="small" 
                                variant="outlined" 
                              />
                            )}
                          </Stack>
                        </Box>
                      )}

                      {/* 開始場所選択UI */}
                      <StartingLocationSelect
                        currentStartingLocation={currentCampaign?.startingLocation}
                        locationId={location.id}
                        locationName={location.name}
                        locationType="location"
                        locationDescription={location.description}
                        locationImageUrl={location.imageUrl}
                        onSetAsStartingLocation={handleSetAsStartingLocation}
                        onRemoveStartingLocation={handleRemoveStartingLocation}
                      />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(location)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteLocation(location.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </ListItem>
          </React.Fragment>
        ))}
      </List>

      {locations.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">
            まだ探索地が設定されていません
          </Typography>
        </Box>
      )}

      {/* 場所編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingLocation ? "探索地を編集" : "新規探索地を作成"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* 基本情報 */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">基本情報</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="場所名"
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>場所タイプ</InputLabel>
                      <Select
                        value={formData.type}
                        onChange={(e) => handleFormChange("type", e.target.value)}
                        label="場所タイプ"
                      >
                        <MenuItem value="森">森</MenuItem>
                        <MenuItem value="山">山</MenuItem>
                        <MenuItem value="洞窟">洞窟</MenuItem>
                        <MenuItem value="遺跡">遺跡</MenuItem>
                        <MenuItem value="平原">平原</MenuItem>
                        <MenuItem value="海岸">海岸</MenuItem>
                        <MenuItem value="砂漠">砂漠</MenuItem>
                        <MenuItem value="湿地">湿地</MenuItem>
                        <MenuItem value="その他">その他</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="地域"
                      value={formData.region}
                      onChange={(e) => handleFormChange("region", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>危険レベル</InputLabel>
                      <Select
                        value={formData.dangerLevel}
                        onChange={(e) => handleFormChange("dangerLevel", e.target.value)}
                        label="危険レベル"
                      >
                        <MenuItem value="極低">極低</MenuItem>
                        <MenuItem value="低">低</MenuItem>
                        <MenuItem value="中">中</MenuItem>
                        <MenuItem value="高">高</MenuItem>
                        <MenuItem value="極高">極高</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="説明"
                      value={formData.description}
                      onChange={(e) => handleFormChange("description", e.target.value)}
                      multiline
                      rows={3}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 探索行動選択肢 */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">探索行動選択肢</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    この場所でプレイヤーが実行可能な探索行動を設定します。TRPGセッション時にこれらの行動が選択肢として表示されます。
                  </Typography>
                  
                  {/* 行動リスト */}
                  {formData.availableActions && formData.availableActions.length > 0 ? (
                    <List>
                      {formData.availableActions.map((action, index) => (
                        <ListItem key={index} divider={index < formData.availableActions!.length - 1}>
                          <ListItemText
                            primary={action.name}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {action.description}
                                </Typography>
                                <Chip label={action.category} size="small" sx={{ mt: 0.5 }} />
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenActionDialog(index)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const newActions = [...(formData.availableActions || [])];
                                  newActions.splice(index, 1);
                                  handleFormChange("availableActions", newActions);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      まだ探索行動が設定されていません
                    </Typography>
                  )}
                  
                  {/* 新しい行動を追加するボタン */}
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenActionDialog()}
                  >
                    探索行動を追加
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* メタ情報 */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">メタ情報</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.meta.unlocked}
                          onChange={(e) => handleFormChange("meta.unlocked", e.target.checked)}
                        />
                      }
                      label="解放済み"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.meta.discovered}
                          onChange={(e) => handleFormChange("meta.discovered", e.target.checked)}
                        />
                      }
                      label="発見済み"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button 
            onClick={handleSaveLocation} 
            variant="contained" 
            disabled={!formData.name.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 行動選択肢編集ダイアログ */}
      <Dialog open={actionDialogOpen} onClose={handleCloseActionDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingActionIndex !== null ? "探索行動を編集" : "新しい探索行動を追加"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label="行動名"
              value={actionFormData.name}
              onChange={(e) => setActionFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              placeholder="例: 森の奥を探索する"
            />
            
            <TextField
              label="説明"
              value={actionFormData.description}
              onChange={(e) => setActionFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              required
              placeholder="例: 森の深部に進み、隠されたアイテムやモンスターとの遭遇を探す"
            />
            
            <FormControl fullWidth>
              <InputLabel>カテゴリ</InputLabel>
              <Select
                value={actionFormData.category}
                onChange={(e) => setActionFormData(prev => ({ ...prev, category: e.target.value as any }))}
                label="カテゴリ"
              >
                <MenuItem value="exploration">探索</MenuItem>
                <MenuItem value="social">社交</MenuItem>
                <MenuItem value="combat">戦闘</MenuItem>
                <MenuItem value="survival">生存</MenuItem>
                <MenuItem value="custom">カスタム</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="前提条件（任意）"
              value={actionFormData.requirements?.join(', ') || ''}
              onChange={(e) => setActionFormData(prev => ({ 
                ...prev, 
                requirements: e.target.value ? e.target.value.split(',').map(s => s.trim()) : [] 
              }))}
              fullWidth
              placeholder="例: 生存スキル3以上, 探索装備"
              helperText="カンマ区切りで複数の条件を入力できます"
            />
            
            <TextField
              label="効果・結果（任意）"
              value={actionFormData.effects?.join(', ') || ''}
              onChange={(e) => setActionFormData(prev => ({ 
                ...prev, 
                effects: e.target.value ? e.target.value.split(',').map(s => s.trim()) : [] 
              }))}
              fullWidth
              placeholder="例: アイテム発見, モンスター遭遇, 経験値+50"
              helperText="カンマ区切りで複数の効果を入力できます"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActionDialog}>キャンセル</Button>
          <Button 
            onClick={handleSaveAction} 
            variant="contained" 
            disabled={!actionFormData.name.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationTab;
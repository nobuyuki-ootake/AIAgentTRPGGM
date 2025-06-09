import React, { useState } from "react";
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
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationCity,
  Home,
  Castle,
  Store,
  ExpandMore as ExpandMoreIcon,
  Security,
  AttachMoney,
  People,
  ImageNotSupported,
  Image as ImageIcon,
} from "@mui/icons-material";
import { useBases } from "../../hooks/useBases";
import { BaseLocation, StartingLocationInfo } from "@trpg-ai-gm/types";
import { aiAgentApi } from "../../api/aiAgent";
import { TRPGLocalStorageManager } from "../../utils/trpgLocalStorage";
import { StartingLocationSelect, CurrentStartingLocationDisplay } from "./StartingLocationSelect";
import { useWorldBuildingContext } from "../../contexts/WorldBuildingContext";
import { useRecoilValue, useRecoilState } from "recoil";
import { currentCampaignState } from "../../store/atoms";

const BaseTab: React.FC = () => {
  const {
    bases,
    isLoading,
    error,
    createBase,
    updateBase,
    deleteBase,
    createBaseTemplate,
  } = useBases();

  // 開始場所管理のための状態とコンテキスト
  const { setHasUnsavedChanges } = useWorldBuildingContext();
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBase, setEditingBase] = useState<BaseLocation | null>(null);
  const [formData, setFormData] = useState<Omit<BaseLocation, "id" | "created_at" | "updated_at">>(createBaseTemplate("村"));
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState<'error' | 'warning' | 'info' | 'success'>('info');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // 行動選択肢編集用の状態
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [actionFormData, setActionFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "custom" as const,
    requirements: [] as string[],
    effects: [] as string[]
  });

  // ダイアログを開く
  const handleOpenDialog = (base?: BaseLocation) => {
    if (base) {
      setEditingBase(base);
      const { id, created_at, updated_at, ...editableData } = base;
      setFormData(editableData);
    } else {
      setEditingBase(null);
      setFormData(createBaseTemplate("村"));
    }
    setDialogOpen(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBase(null);
  };

  // 拠点を保存
  const handleSaveBase = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingBase) {
        await updateBase(editingBase.id, formData);
      } else {
        await createBase(formData);
      }
      handleCloseDialog();
    } catch (error) {
      console.error("拠点の保存に失敗しました:", error);
    }
  };

  // 拠点を削除
  const handleDeleteBase = async (id: string) => {
    if (window.confirm("この拠点を削除してもよろしいですか？")) {
      try {
        await deleteBase(id);
      } catch (error) {
        console.error("拠点の削除に失敗しました:", error);
      }
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
      description: bases.find(b => b.id === locationId)?.description,
      imageUrl: bases.find(b => b.id === locationId)?.imageUrl,
      setAt: new Date(),
      isActive: true,
    };

    const updatedCampaign = currentCampaign ? {
      ...currentCampaign,
      startingLocation
    } : null;
    
    setCurrentCampaign(updatedCampaign);
    
    // localStorageに保存
    if (updatedCampaign) {
      TRPGLocalStorageManager.saveCampaign(updatedCampaign);
    }
    
    setHasUnsavedChanges?.(true);
  };

  // 開始場所設定を解除
  const handleRemoveStartingLocation = () => {
    if (!currentCampaign) return;
    
    const updatedCampaign = currentCampaign ? {
      ...currentCampaign,
      startingLocation: undefined
    } : null;
    
    setCurrentCampaign(updatedCampaign);
    
    // localStorageに保存
    if (updatedCampaign) {
      TRPGLocalStorageManager.saveCampaign(updatedCampaign);
    }
    
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
        category: "custom",
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

  // AI画像生成
  const handleGenerateAIImage = async () => {
    if (!formData.name.trim()) {
      setNotificationMessage("拠点名を入力してから画像を生成してください。");
      setNotificationSeverity('warning');
      setShowNotification(true);
      return;
    }

    setIsGeneratingImage(true);
    try {
      console.log('AI画像生成開始:', {
        baseName: formData.name,
        baseType: formData.type,
        description: formData.description
      });

      const result = await aiAgentApi.generateBaseImage(
        formData.name,
        formData.type,
        formData.description,
        "fantasy",
        "16:9"
      );

      if (result.status === 'success' && result.data.imageUrl) {
        handleFormChange("imageUrl", result.data.imageUrl);
        console.log('AI画像生成成功:', result.data.imageUrl);
      } else {
        throw new Error(result.message || '画像生成に失敗しました');
      }
    } catch (error) {
      console.error('AI画像生成エラー:', error);
      setNotificationMessage(`画像生成に失敗しました: ${error.message || 'Unknown error'}`);
      setNotificationSeverity('error');
      setShowNotification(true);
    } finally {
      setIsGeneratingImage(false);
    }
  };


  // 拠点タイプのアイコンを取得
  const getBaseIcon = (type: string) => {
    switch (type) {
      case "村":
        return <Home />;
      case "町":
        return <LocationCity />;
      case "都市":
        return <LocationCity />;
      case "城":
        return <Castle />;
      default:
        return <Home />;
    }
  };

  // 重要度の色を取得
  const getImportanceColor = (importance: BaseLocation["importance"]) => {
    switch (importance) {
      case "主要拠点":
        return "primary";
      case "サブ拠点":
        return "secondary";
      case "隠し拠点":
        return "warning";
      default:
        return "default";
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
        <Typography variant="h6">拠点・ベース設定</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={isLoading}
        >
          新規拠点
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: "error.light", borderRadius: 1 }}>
          <Typography color="error.main">{error}</Typography>
        </Box>
      )}

      {/* 現在の開始場所表示 */}
      <CurrentStartingLocationDisplay
        currentStartingLocation={currentCampaign?.startingLocation}
        onClearStartingLocation={handleRemoveStartingLocation}
        compact={false}
      />

      {/* 拠点リスト */}
      <List>
        {bases.map((base, index) => (
          <React.Fragment key={base.id}>
            {index > 0 && <Divider />}
            <ListItem>
              <Card sx={{ width: "100%", my: 1 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    {/* 拠点画像 */}
                    <Box sx={{ flexShrink: 0, width: 120, height: 90 }}>
                      {base.imageUrl ? (
                        <Box
                          component="img"
                          src={base.imageUrl}
                          alt={base.name}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "2px solid",
                            borderColor: "divider",
                          }}
                          onError={(e) => {
                            // 画像読み込みエラー時の処理
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: base.imageUrl ? "none" : "flex",
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
                    </Box>

                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                        {getBaseIcon(base.type)}
                        <Typography variant="h6">
                          {base.name}
                        </Typography>
                        <Chip
                          label={base.type}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={base.rank}
                          size="small"
                          color={getImportanceColor(base.importance) as any}
                        />
                        <Chip
                          label={`危険度: ${base.threats.dangerLevel}`}
                          size="small"
                          color={getDangerColor(base.threats.dangerLevel) as any}
                        />
                        {!base.meta.unlocked && (
                          <Chip
                            label="未開放"
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {base.description}
                      </Typography>
                      
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {base.region && (
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                              地域: {base.region}
                            </Typography>
                          </Grid>
                        )}
                        {base.threats.controllingFaction && (
                          <Grid size={{ xs: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                              支配勢力: {base.threats.controllingFaction}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>

                      {/* 施設情報 */}
                      {Object.keys(base.facilities).length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            施設:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {base.facilities.inn && (
                              <Chip key="inn" label={`宿屋: ${base.facilities.inn.name}`} size="small" variant="outlined" />
                            )}
                            {base.facilities.shops?.map((shop, i) => (
                              <Chip key={`shop-${i}`} label={`店舗: ${shop.name}`} size="small" variant="outlined" />
                            ))}
                            {base.facilities.armory && (
                              <Chip key="armory" label={`武器庫: ${base.facilities.armory.name}`} size="small" variant="outlined" />
                            )}
                            {base.facilities.temple && (
                              <Chip key="temple" label={`神殿: ${base.facilities.temple.name}`} size="small" variant="outlined" />
                            )}
                            {base.facilities.guild && (
                              <Chip key="guild" label={`ギルド: ${base.facilities.guild.name}`} size="small" variant="outlined" />
                            )}
                            {base.facilities.blacksmith && (
                              <Chip key="blacksmith" label={`鍛冶場: ${base.facilities.blacksmith.name}`} size="small" variant="outlined" />
                            )}
                          </Stack>
                        </Box>
                      )}

                      {/* 機能情報 */}
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          機能:
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                          {base.features.fastTravel && (
                            <Chip label="ファストトラベル" size="small" color="primary" variant="outlined" />
                          )}
                          {base.features.playerBase && (
                            <Chip label="プレイヤー拠点" size="small" color="primary" variant="outlined" />
                          )}
                          {base.features.questHub && (
                            <Chip label="クエストハブ" size="small" color="primary" variant="outlined" />
                          )}
                          {base.features.defenseEvent && (
                            <Chip label="防衛イベント" size="small" color="primary" variant="outlined" />
                          )}
                        </Stack>
                      </Box>

                      {/* 行動選択肢情報 */}
                      {base.availableActions && base.availableActions.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            行動選択肢 ({base.availableActions.length}件):
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                            {base.availableActions.slice(0, 3).map((action, i) => (
                              <Chip 
                                key={`action-${i}`} 
                                label={action.name} 
                                size="small" 
                                color="secondary" 
                                variant="outlined" 
                              />
                            ))}
                            {base.availableActions.length > 3 && (
                              <Chip 
                                label={`他${base.availableActions.length - 3}件`} 
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
                        locationId={base.id}
                        locationName={base.name}
                        locationType="base"
                        locationDescription={base.description}
                        locationImageUrl={base.imageUrl}
                        onSetAsStartingLocation={handleSetAsStartingLocation}
                        onRemoveStartingLocation={handleRemoveStartingLocation}
                        disabled={isLoading}
                      />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(base)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteBase(base.id)}
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

      {bases.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="text.secondary">
            まだ拠点が設定されていません
          </Typography>
        </Box>
      )}

      {/* 拠点編集ダイアログ */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingBase ? "拠点を編集" : "新規拠点を作成"}
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="拠点名"
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>拠点タイプ</InputLabel>
                      <Select
                        value={formData.type}
                        onChange={(e) => handleFormChange("type", e.target.value)}
                        label="拠点タイプ"
                      >
                        <MenuItem value="村">村</MenuItem>
                        <MenuItem value="町">町</MenuItem>
                        <MenuItem value="都市">都市</MenuItem>
                        <MenuItem value="城">城</MenuItem>
                        <MenuItem value="その他">その他</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="地域"
                      value={formData.region}
                      onChange={(e) => handleFormChange("region", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="ランク"
                      value={formData.rank}
                      onChange={(e) => handleFormChange("rank", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>重要度</InputLabel>
                      <Select
                        value={formData.importance}
                        onChange={(e) => handleFormChange("importance", e.target.value)}
                        label="重要度"
                      >
                        <MenuItem value="主要拠点">主要拠点</MenuItem>
                        <MenuItem value="サブ拠点">サブ拠点</MenuItem>
                        <MenuItem value="隠し拠点">隠し拠点</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
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

            {/* 機能設定 */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">機能設定</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.features.fastTravel}
                          onChange={(e) => handleFormChange("features.fastTravel", e.target.checked)}
                        />
                      }
                      label="ファストトラベル可能"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.features.playerBase}
                          onChange={(e) => handleFormChange("features.playerBase", e.target.checked)}
                        />
                      }
                      label="プレイヤー拠点として使用可能"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.features.questHub}
                          onChange={(e) => handleFormChange("features.questHub", e.target.checked)}
                        />
                      }
                      label="クエストハブ"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.features.defenseEvent}
                          onChange={(e) => handleFormChange("features.defenseEvent", e.target.checked)}
                        />
                      }
                      label="防衛イベント対象"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 脅威・影響 */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">脅威・影響</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>危険レベル</InputLabel>
                      <Select
                        value={formData.threats.dangerLevel}
                        onChange={(e) => handleFormChange("threats.dangerLevel", e.target.value)}
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="支配勢力"
                      value={formData.threats.controllingFaction}
                      onChange={(e) => handleFormChange("threats.controllingFaction", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 経済 */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">経済</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="通貨"
                      value={formData.economy.currency}
                      onChange={(e) => handleFormChange("economy.currency", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="価格修正倍率"
                      type="number"
                      value={formData.economy.priceModifier}
                      onChange={(e) => handleFormChange("economy.priceModifier", parseFloat(e.target.value) || 1.0)}
                      inputProps={{ min: 0.1, max: 5.0, step: 0.1 }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* 行動選択肢 */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">行動選択肢</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    この拠点でプレイヤーが実行可能な行動を設定します。TRPGセッション時にこれらの行動が選択肢として表示されます。
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
                      まだ行動選択肢が設定されていません
                    </Typography>
                  )}
                  
                  {/* 新しい行動を追加するボタン */}
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenActionDialog()}
                  >
                    行動選択肢を追加
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                      <TextField
                        label="画像URL"
                        value={formData.imageUrl || ""}
                        onChange={(e) => handleFormChange("imageUrl", e.target.value)}
                        fullWidth
                        placeholder="https://example.com/base-image.jpg"
                        helperText="拠点の画像URLを入力してください（オプション）"
                      />
                      <Button
                        variant="outlined"
                        startIcon={<ImageIcon />}
                        onClick={handleGenerateAIImage}
                        sx={{ mb: 2.5, whiteSpace: "nowrap" }}
                        disabled={!formData.name.trim() || isGeneratingImage}
                        title={!formData.name.trim() ? "拠点名を入力してください" : "AIで拠点画像を生成"}
                      >
                        {isGeneratingImage ? "生成中..." : "AI生成"}
                      </Button>
                    </Box>
                  </Grid>
                  {/* 画像プレビュー */}
                  {formData.imageUrl && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        画像プレビュー:
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                        <Box
                          component="img"
                          src={formData.imageUrl}
                          alt="拠点画像プレビュー"
                          sx={{
                            maxWidth: "100%",
                            maxHeight: 200,
                            objectFit: "contain",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                          onError={(e) => {
                            // プレビュー画像読み込みエラー時
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling.style.display = "flex";
                          }}
                        />
                        <Box
                          sx={{
                            display: "none",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            gap: 1,
                            p: 2,
                            border: "1px dashed",
                            borderColor: "error.main",
                            borderRadius: 1,
                            bgcolor: "error.lighter",
                          }}
                        >
                          <ImageNotSupported color="error" />
                          <Typography variant="caption" color="error.main" textAlign="center">
                            画像を読み込めません
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button 
            onClick={handleSaveBase} 
            variant="contained" 
            disabled={!formData.name.trim() || isLoading}
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 行動選択肢編集ダイアログ */}
      <Dialog open={actionDialogOpen} onClose={handleCloseActionDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingActionIndex !== null ? "行動選択肢を編集" : "新しい行動選択肢を追加"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <TextField
              label="行動名"
              value={actionFormData.name}
              onChange={(e) => setActionFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
              placeholder="例: 装備品を購入する"
            />
            
            <TextField
              label="説明"
              value={actionFormData.description}
              onChange={(e) => setActionFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              required
              placeholder="例: 街の商店で武器、防具、アイテムを購入できます"
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
                <MenuItem value="shopping">買い物</MenuItem>
                <MenuItem value="training">訓練</MenuItem>
                <MenuItem value="rest">休憩</MenuItem>
                <MenuItem value="quest">クエスト</MenuItem>
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
              placeholder="例: レベル5以上, 特定のアイテム所持"
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
              placeholder="例: アイテム獲得, 経験値+100"
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

      {/* 通知用Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowNotification(false)} 
          severity={notificationSeverity} 
          variant="filled"
        >
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BaseTab;
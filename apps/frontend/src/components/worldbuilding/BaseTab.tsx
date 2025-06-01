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
} from "@mui/icons-material";
import { useBases } from "../../hooks/useBases";
import { BaseLocation } from "@novel-ai-assistant/types";

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
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBase, setEditingBase] = useState<BaseLocation | null>(null);
  const [formData, setFormData] = useState<Omit<BaseLocation, "id" | "created_at" | "updated_at">>(createBaseTemplate("村"));

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

      {/* 拠点リスト */}
      <List>
        {bases.map((base, index) => (
          <React.Fragment key={base.id}>
            {index > 0 && <Divider />}
            <ListItem>
              <Card sx={{ width: "100%", my: 1 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">
                              地域: {base.region}
                            </Typography>
                          </Grid>
                        )}
                        {base.threats.controllingFaction && (
                          <Grid item xs={6}>
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="拠点名"
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="地域"
                      value={formData.region}
                      onChange={(e) => handleFormChange("region", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="ランク"
                      value={formData.rank}
                      onChange={(e) => handleFormChange("rank", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
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

            {/* 機能設定 */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">機能設定</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="通貨"
                      value={formData.economy.currency}
                      onChange={(e) => handleFormChange("economy.currency", e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12}>
                    <TextField
                      label="画像URL"
                      value={formData.imageUrl || ""}
                      onChange={(e) => handleFormChange("imageUrl", e.target.value)}
                      fullWidth
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
            onClick={handleSaveBase} 
            variant="contained" 
            disabled={!formData.name.trim() || isLoading}
          >
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BaseTab;
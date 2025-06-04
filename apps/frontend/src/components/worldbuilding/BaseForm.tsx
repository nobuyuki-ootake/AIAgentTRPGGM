import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  IconButton,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Store,
  Hotel,
  Security,
  Church,
  Build,
  Group,
} from "@mui/icons-material";
import { BaseLocation, Inn, Shop, Armory, Temple, Guild, Blacksmith, LocationNPC } from "@trpg-ai-gm/types";
import { useBases } from "../../hooks/useBases";

interface BaseFormProps {
  base?: BaseLocation;
  onSave: (base: BaseLocation) => void;
  onCancel: () => void;
}

const BaseForm: React.FC<BaseFormProps> = ({ base, onSave, onCancel }) => {
  const { createBaseTemplate } = useBases();
  const [formData, setFormData] = useState<Omit<BaseLocation, "id" | "created_at" | "updated_at">>(
    base ? (() => {
      const { id, created_at, updated_at, ...editableData } = base;
      return editableData;
    })() : createBaseTemplate("村")
  );

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

  // 配列項目の追加
  const handleAddArrayItem = (field: string, item: any) => {
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField as keyof typeof prev],
          [childField]: [...(prev[parentField as keyof typeof prev] as any)[childField], item],
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as any), item],
      }));
    }
  };

  // 配列項目の削除
  const handleRemoveArrayItem = (field: string, index: number) => {
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parentField]: {
          ...prev[parentField as keyof typeof prev],
          [childField]: (prev[parentField as keyof typeof prev] as any)[childField].filter((_: any, i: number) => i !== index),
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: (prev[field as keyof typeof prev] as any).filter((_: any, i: number) => i !== index),
      }));
    }
  };

  // 施設の状態管理
  const [newShop, setNewShop] = useState<Partial<Shop>>({ name: "", type: "一般商店", items: [], priceModifier: 1.0 });
  const [newNPC, setNewNPC] = useState<Partial<LocationNPC>>({ id: "", name: "", role: "", function: "" });
  const [newItem, setNewItem] = useState("");
  const [newLocalGood, setNewLocalGood] = useState("");
  const [newTradeGood, setNewTradeGood] = useState("");
  const [newCurrentEvent, setNewCurrentEvent] = useState("");

  // 宿屋を追加/更新
  const handleInnChange = (field: keyof Inn, value: any) => {
    const inn = formData.facilities.inn || { name: "", pricePerNight: 5, services: [] };
    handleFormChange("facilities.inn", { ...inn, [field]: value });
  };

  // 店舗を追加
  const handleAddShop = () => {
    if (newShop.name && newShop.type) {
      const shop: Shop = {
        name: newShop.name,
        type: newShop.type,
        items: newShop.items || [],
        priceModifier: newShop.priceModifier || 1.0,
      };
      handleAddArrayItem("facilities.shops", shop);
      setNewShop({ name: "", type: "一般商店", items: [], priceModifier: 1.0 });
    }
  };

  // 武器庫を追加/更新
  const handleArmoryChange = (field: keyof Armory, value: any) => {
    const armory = formData.facilities.armory || { name: "", weaponTypes: [], armorTypes: [], specialItems: [] };
    handleFormChange("facilities.armory", { ...armory, [field]: value });
  };

  // 神殿を追加/更新
  const handleTempleChange = (field: keyof Temple, value: any) => {
    const temple = formData.facilities.temple || { name: "", deity: "", functions: [] };
    handleFormChange("facilities.temple", { ...temple, [field]: value });
  };

  // ギルドを追加/更新
  const handleGuildChange = (field: keyof Guild, value: any) => {
    const guild = formData.facilities.guild || { name: "", type: "冒険者ギルド", services: [] };
    handleFormChange("facilities.guild", { ...guild, [field]: value });
  };

  // 鍛冶場を追加/更新
  const handleBlacksmithChange = (field: keyof Blacksmith, value: any) => {
    const blacksmith = formData.facilities.blacksmith || { name: "", services: [] };
    handleFormChange("facilities.blacksmith", { ...blacksmith, [field]: value });
  };

  // NPCを追加
  const handleAddNPC = () => {
    if (newNPC.name && newNPC.role) {
      const npc: LocationNPC = {
        id: `npc_${Date.now()}`,
        name: newNPC.name,
        role: newNPC.role,
        function: newNPC.function || "",
      };
      handleAddArrayItem("npcs", npc);
      setNewNPC({ id: "", name: "", role: "", function: "" });
    }
  };

  const handleSave = () => {
    if (base) {
      onSave({ ...base, ...formData });
    } else {
      onSave(formData as BaseLocation);
    }
  };

  return (
    <Box>
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

        {/* 施設 */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">施設</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              {/* 宿屋 */}
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Hotel sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">宿屋</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="宿屋名"
                        value={formData.facilities.inn?.name || ""}
                        onChange={(e) => handleInnChange("name", e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="一泊料金"
                        type="number"
                        value={formData.facilities.inn?.pricePerNight || 5}
                        onChange={(e) => handleInnChange("pricePerNight", parseInt(e.target.value) || 5)}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 店舗 */}
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Store sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">店舗</Typography>
                  </Box>
                  
                  {/* 新規店舗追加 */}
                  <Box sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="店舗名"
                          value={newShop.name}
                          onChange={(e) => setNewShop(prev => ({ ...prev, name: e.target.value }))}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>店舗タイプ</InputLabel>
                          <Select
                            value={newShop.type}
                            onChange={(e) => setNewShop(prev => ({ ...prev, type: e.target.value }))}
                            label="店舗タイプ"
                          >
                            <MenuItem value="一般商店">一般商店</MenuItem>
                            <MenuItem value="武具屋">武具屋</MenuItem>
                            <MenuItem value="魔法店">魔法店</MenuItem>
                            <MenuItem value="薬屋">薬屋</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <TextField
                            label="価格修正"
                            type="number"
                            value={newShop.priceModifier}
                            onChange={(e) => setNewShop(prev => ({ ...prev, priceModifier: parseFloat(e.target.value) || 1.0 }))}
                            inputProps={{ min: 0.1, max: 5.0, step: 0.1 }}
                            size="small"
                            fullWidth
                          />
                          <Button onClick={handleAddShop} variant="outlined" size="small">
                            追加
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* 既存店舗リスト */}
                  {formData.facilities.shops?.map((shop, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, border: 1, borderColor: "grey.300", borderRadius: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2">
                          {shop.name} ({shop.type}) - 価格修正: {shop.priceModifier}x
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveArrayItem("facilities.shops", index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* 武器庫 */}
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Security sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">武器庫</Typography>
                  </Box>
                  <TextField
                    label="武器庫名"
                    value={formData.facilities.armory?.name || ""}
                    onChange={(e) => handleArmoryChange("name", e.target.value)}
                    fullWidth
                  />
                </CardContent>
              </Card>

              {/* 神殿 */}
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Church sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">神殿</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="神殿名"
                        value={formData.facilities.temple?.name || ""}
                        onChange={(e) => handleTempleChange("name", e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="祭神"
                        value={formData.facilities.temple?.deity || ""}
                        onChange={(e) => handleTempleChange("deity", e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* ギルド */}
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Group sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">ギルド</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="ギルド名"
                        value={formData.facilities.guild?.name || ""}
                        onChange={(e) => handleGuildChange("name", e.target.value)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="ギルドタイプ"
                        value={formData.facilities.guild?.type || ""}
                        onChange={(e) => handleGuildChange("type", e.target.value)}
                        fullWidth
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 鍛冶場 */}
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Build sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">鍛冶場</Typography>
                  </Box>
                  <TextField
                    label="鍛冶場名"
                    value={formData.facilities.blacksmith?.name || ""}
                    onChange={(e) => handleBlacksmithChange("name", e.target.value)}
                    fullWidth
                  />
                </CardContent>
              </Card>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* NPC */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">NPC</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* 新規NPC追加 */}
            <Box sx={{ mb: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="NPC名"
                    value={newNPC.name}
                    onChange={(e) => setNewNPC(prev => ({ ...prev, name: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="役職"
                    value={newNPC.role}
                    onChange={(e) => setNewNPC(prev => ({ ...prev, role: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="機能"
                    value={newNPC.function}
                    onChange={(e) => setNewNPC(prev => ({ ...prev, function: e.target.value }))}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button onClick={handleAddNPC} variant="outlined" size="small" fullWidth>
                    追加
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* 既存NPCリスト */}
            {formData.npcs.map((npc, index) => (
              <Box key={index} sx={{ mb: 1, p: 1, border: 1, borderColor: "grey.300", borderRadius: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2">
                    {npc.name} - {npc.role} ({npc.function})
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveArrayItem("npcs", index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}
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

        {/* アクションボタン */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button onClick={onCancel} variant="outlined">
            キャンセル
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.name.trim()}>
            保存
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default BaseForm;
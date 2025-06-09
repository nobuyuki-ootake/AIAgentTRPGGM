import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  FormHelperText,
} from "@mui/material";
import { Grid } from '@mui/material';
import {
  Item,
  ItemType,
  ItemCategory,
  ItemRarity,
  ItemEffect,
  EquipmentSlot,
  ItemAttribute,
} from "@trpg-ai-gm/types";
import { v4 as uuidv4 } from "uuid";

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  item?: Item;
  mode: "create" | "edit";
}

const ItemFormDialog: React.FC<ItemFormDialogProps> = ({
  open,
  onClose,
  onSave,
  item,
  mode,
}) => {
  const [formData, setFormData] = useState<Partial<Item>>({
    id: "",
    name: "",
    description: "",
    type: "other",
    category: "general",
    rarity: "common",
    value: 0,
    weight: 0,
    stackable: true,
    maxStack: 99,
    usable: false,
    consumable: false,
    effects: [],
    attributes: [],
    requirements: {
      level: 0,
      stats: {},
      skills: [],
      classes: [],
    },
    equipmentSlot: undefined,
    damage: undefined,
    defense: undefined,
    tags: [],
    questRelated: false,
    tradable: true,
    destroyable: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item && mode === "edit") {
      setFormData(item);
    } else if (mode === "create") {
      setFormData({
        id: uuidv4(),
        name: "",
        description: "",
        type: "other",
        category: "general",
        rarity: "common",
        value: 0,
        weight: 0,
        stackable: true,
        maxStack: 99,
        usable: false,
        consumable: false,
        effects: [],
        attributes: [],
        requirements: {
          level: 0,
          stats: {},
          skills: [],
          classes: [],
        },
        equipmentSlot: undefined,
        damage: undefined,
        defense: undefined,
        tags: [],
        questRelated: false,
        tradable: true,
        destroyable: true,
      });
    }
  }, [item, mode]);

  const handleFieldChange = (field: keyof Item, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "アイテム名は必須です";
    }

    if (!formData.description?.trim()) {
      newErrors.description = "説明は必須です";
    }

    if (formData.value === undefined || formData.value < 0) {
      newErrors.value = "価値は0以上の数値を入力してください";
    }

    if (formData.weight === undefined || formData.weight < 0) {
      newErrors.weight = "重量は0以上の数値を入力してください";
    }

    if (formData.stackable && (!formData.maxStack || formData.maxStack < 1)) {
      newErrors.maxStack = "最大スタック数は1以上の数値を入力してください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const itemToSave: Item = {
      id: formData.id || uuidv4(),
      name: formData.name!.trim(),
      description: formData.description!.trim(),
      type: formData.type!,
      category: formData.category!,
      rarity: formData.rarity!,
      value: formData.value!,
      weight: formData.weight!,
      stackable: formData.stackable!,
      maxStack: formData.maxStack!,
      usable: formData.usable!,
      consumable: formData.consumable!,
      effects: formData.effects || [],
      attributes: formData.attributes || [],
      requirements: formData.requirements || {
        level: 0,
        stats: {},
        skills: [],
        classes: [],
      },
      equipmentSlot: formData.equipmentSlot,
      damage: formData.damage,
      defense: formData.defense,
      tags: formData.tags || [],
      questRelated: formData.questRelated!,
      tradable: formData.tradable!,
      destroyable: formData.destroyable!,
    };

    onSave(itemToSave);
  };

  const handleTypeChange = (type: ItemType) => {
    handleFieldChange("type", type);
    
    // タイプに応じてデフォルト値を設定
    switch (type) {
      case "consumable":
        handleFieldChange("consumable", true);
        handleFieldChange("usable", true);
        handleFieldChange("stackable", true);
        break;
      case "equipment":
        handleFieldChange("consumable", false);
        handleFieldChange("usable", false);
        handleFieldChange("stackable", false);
        handleFieldChange("maxStack", 1);
        break;
      case "key_item":
        handleFieldChange("consumable", false);
        handleFieldChange("tradable", false);
        handleFieldChange("destroyable", false);
        handleFieldChange("stackable", false);
        handleFieldChange("maxStack", 1);
        break;
      case "quest_item":
        handleFieldChange("questRelated", true);
        handleFieldChange("tradable", false);
        break;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === "create" ? "新規アイテム作成" : "アイテム編集"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* 基本情報 */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom>
                基本情報
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="アイテム名"
                value={formData.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
                data-testid="item-name-input"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>タイプ</InputLabel>
                <Select
                  value={formData.type || "other"}
                  onChange={(e) => handleTypeChange(e.target.value as ItemType)}
                  label="タイプ"
                  data-testid="item-type-select"
                >
                  <MenuItem value="consumable">消耗品</MenuItem>
                  <MenuItem value="equipment">装備</MenuItem>
                  <MenuItem value="key_item">キーアイテム</MenuItem>
                  <MenuItem value="material">素材</MenuItem>
                  <MenuItem value="quest_item">クエストアイテム</MenuItem>
                  <MenuItem value="currency">通貨</MenuItem>
                  <MenuItem value="other">その他</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="説明"
                value={formData.description || ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                error={!!errors.description}
                helperText={errors.description}
                required
                multiline
                rows={3}
                data-testid="item-description-input"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>カテゴリ</InputLabel>
                <Select
                  value={formData.category || "general"}
                  onChange={(e) => handleFieldChange("category", e.target.value as ItemCategory)}
                  label="カテゴリ"
                >
                  <MenuItem value="general">一般</MenuItem>
                  <MenuItem value="weapon">武器</MenuItem>
                  <MenuItem value="armor">防具</MenuItem>
                  <MenuItem value="accessory">アクセサリー</MenuItem>
                  <MenuItem value="consumable">消耗品</MenuItem>
                  <MenuItem value="material">素材</MenuItem>
                  <MenuItem value="tool">道具</MenuItem>
                  <MenuItem value="book">書物</MenuItem>
                  <MenuItem value="food">食料</MenuItem>
                  <MenuItem value="magic">魔法</MenuItem>
                  <MenuItem value="treasure">財宝</MenuItem>
                  <MenuItem value="junk">ジャンク</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>レアリティ</InputLabel>
                <Select
                  value={formData.rarity || "common"}
                  onChange={(e) => handleFieldChange("rarity", e.target.value as ItemRarity)}
                  label="レアリティ"
                  data-testid="item-rarity-select"
                >
                  <MenuItem value="common">コモン</MenuItem>
                  <MenuItem value="uncommon">アンコモン</MenuItem>
                  <MenuItem value="rare">レア</MenuItem>
                  <MenuItem value="epic">エピック</MenuItem>
                  <MenuItem value="legendary">レジェンダリー</MenuItem>
                  <MenuItem value="artifact">アーティファクト</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="価値 (G)"
                type="number"
                value={formData.value || 0}
                onChange={(e) => handleFieldChange("value", parseInt(e.target.value) || 0)}
                error={!!errors.value}
                helperText={errors.value}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* 詳細情報 */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom>
                詳細情報
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="重量 (kg)"
                type="number"
                value={formData.weight || 0}
                onChange={(e) => handleFieldChange("weight", parseFloat(e.target.value) || 0)}
                error={!!errors.weight}
                helperText={errors.weight}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>

            {formData.type === "equipment" && (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>装備スロット</InputLabel>
                    <Select
                      value={formData.equipmentSlot || ""}
                      onChange={(e) => handleFieldChange("equipmentSlot", e.target.value as EquipmentSlot)}
                      label="装備スロット"
                    >
                      <MenuItem value="">なし</MenuItem>
                      <MenuItem value="head">頭</MenuItem>
                      <MenuItem value="body">体</MenuItem>
                      <MenuItem value="hands">手</MenuItem>
                      <MenuItem value="feet">足</MenuItem>
                      <MenuItem value="weapon">武器</MenuItem>
                      <MenuItem value="shield">盾</MenuItem>
                      <MenuItem value="accessory">アクセサリー</MenuItem>
                      <MenuItem value="ring">指輪</MenuItem>
                      <MenuItem value="necklace">首飾り</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {(formData.category === "weapon" || formData.equipmentSlot === "weapon") && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="攻撃力"
                      type="number"
                      value={formData.damage || 0}
                      onChange={(e) => handleFieldChange("damage", parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                )}

                {(formData.category === "armor" || formData.equipmentSlot === "body" || formData.equipmentSlot === "shield") && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="防御力"
                      type="number"
                      value={formData.defense || 0}
                      onChange={(e) => handleFieldChange("defense", parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                )}
              </>
            )}

            {formData.stackable && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="最大スタック数"
                  type="number"
                  value={formData.maxStack || 99}
                  onChange={(e) => handleFieldChange("maxStack", parseInt(e.target.value) || 1)}
                  error={!!errors.maxStack}
                  helperText={errors.maxStack}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {mode === "create" ? "作成" : "保存"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ItemFormDialog;
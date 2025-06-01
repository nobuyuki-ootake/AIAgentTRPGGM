import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Typography,
  Box,
  Chip,
  Grid,
  Tooltip,
} from "@mui/material";
import {
  Casino,
} from "@mui/icons-material";

export interface DiceRoll {
  dice: string;
  rolls: number[];
  total: number;
  purpose: string;
}

interface DiceRollUIProps {
  open: boolean;
  onClose: () => void;
  onRoll: (diceRoll: DiceRoll) => void;
  selectedCharacterName?: string;
}

const DiceRollUI: React.FC<DiceRollUIProps> = ({
  open,
  onClose,
  onRoll,
  selectedCharacterName,
}) => {
  const [diceCount, setDiceCount] = useState(1);
  const [diceType, setDiceType] = useState(20);
  const [modifier, setModifier] = useState(0);
  const [purpose, setPurpose] = useState("");

  // よく使われるダイス組み合わせのプリセット
  const presets = [
    { name: "d20", count: 1, type: 20, mod: 0, desc: "基本判定" },
    { name: "攻撃ロール", count: 1, type: 20, mod: 0, desc: "攻撃判定" },
    { name: "ダメージ(1d6)", count: 1, type: 6, mod: 0, desc: "基本ダメージ" },
    { name: "ダメージ(1d8)", count: 1, type: 8, mod: 0, desc: "武器ダメージ" },
    { name: "能力値", count: 3, type: 6, mod: 0, desc: "能力値生成" },
    { name: "イニシアチブ", count: 1, type: 20, mod: 0, desc: "行動順決定" },
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    setDiceCount(preset.count);
    setDiceType(preset.type);
    setModifier(preset.mod);
    setPurpose(preset.desc);
  };

  const handleRoll = () => {
    const rolls: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      rolls.push(Math.floor(Math.random() * diceType) + 1);
    }
    const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;

    const diceRoll: DiceRoll = {
      dice: `${diceCount}d${diceType}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`,
      rolls,
      total,
      purpose: purpose || (selectedCharacterName ? `${selectedCharacterName}のロール` : "ダイスロール"),
    };

    onRoll(diceRoll);
    onClose();
  };

  const resetForm = () => {
    setDiceCount(1);
    setDiceType(20);
    setModifier(0);
    setPurpose("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Casino />
          ダイスロール
          {selectedCharacterName && (
            <Chip label={selectedCharacterName} size="small" color="primary" />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* プリセット */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              クイックプリセット
            </Typography>
            <Grid container spacing={1}>
              {presets.map((preset) => (
                <Grid item key={preset.name}>
                  <Tooltip title={preset.desc}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePresetClick(preset)}
                      sx={{ minWidth: "auto" }}
                    >
                      {preset.name}
                    </Button>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* 手動設定 */}
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>ダイス数</InputLabel>
                <Select
                  value={diceCount}
                  label="ダイス数"
                  onChange={(e) => setDiceCount(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(n => (
                    <MenuItem key={n} value={n}>{n}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>ダイスタイプ</InputLabel>
                <Select
                  value={diceType}
                  label="ダイスタイプ"
                  onChange={(e) => setDiceType(Number(e.target.value))}
                >
                  <MenuItem value={4}>d4</MenuItem>
                  <MenuItem value={6}>d6</MenuItem>
                  <MenuItem value={8}>d8</MenuItem>
                  <MenuItem value={10}>d10</MenuItem>
                  <MenuItem value={12}>d12</MenuItem>
                  <MenuItem value={20}>d20</MenuItem>
                  <MenuItem value={100}>d100</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={4}>
              <TextField
                label="修正値"
                type="number"
                value={modifier}
                onChange={(e) => setModifier(Number(e.target.value))}
                fullWidth
                inputProps={{ step: 1 }}
              />
            </Grid>
          </Grid>

          <TextField
            label="判定の目的 (任意)"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            fullWidth
            placeholder="例: 筋力判定, 隠密チェック, 魔法攻撃"
          />

          {/* プレビュー */}
          <Box sx={{ 
            p: 2, 
            bgcolor: "primary.light", 
            color: "primary.contrastText", 
            borderRadius: 1,
            textAlign: "center"
          }}>
            <Typography variant="h6">
              {diceCount}d{diceType}{modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}
            </Typography>
            <Typography variant="body2">
              {purpose && `${purpose} - `}
              最小値: {diceCount + modifier}, 最大値: {diceCount * diceType + modifier}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>キャンセル</Button>
        <Button onClick={resetForm} color="secondary">リセット</Button>
        <Button onClick={handleRoll} variant="contained" startIcon={<Casino />}>
          ロール実行
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiceRollUI;
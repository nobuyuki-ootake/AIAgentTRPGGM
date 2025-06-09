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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { DiceD20Icon, DiceD6Icon } from "../icons/TRPGIcons";
import UnifiedDiceInterface from "../dice/UnifiedDiceInterface";
import DiceDisplay from "../dice/DiceDisplay";
import DiceThemeSelector from "../dice/DiceThemeSelector";
import DiceVisualization from "../dice/DiceVisualization";
import { DICE_THEMES } from "../dice/DiceTheme";
import { useRecoilValue } from "recoil";
import { currentCampaignState } from "../../store/atoms";

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
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [useUnifiedInterface, setUseUnifiedInterface] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  
  // 旧システム用
  const [diceCount, setDiceCount] = useState(1);
  const [diceType, setDiceType] = useState(20);
  const [modifier, setModifier] = useState(0);
  const [purpose, setPurpose] = useState("");
  
  // ダイス可視化用
  const [showDiceVisualization, setShowDiceVisualization] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [rollResults, setRollResults] = useState<number[]>([]);
  const [totalResult, setTotalResult] = useState<number | null>(null);
  
  // ダイステーマ用
  const [selectedDiceTheme, setSelectedDiceTheme] = useState<string>(() => {
    return localStorage.getItem('dice-theme') || 'classic';
  });

  // テーマ変更ハンドラー
  const handleThemeChange = (themeKey: string) => {
    setSelectedDiceTheme(themeKey);
    localStorage.setItem('dice-theme', themeKey);
  };

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
    if (showDiceVisualization) {
      // 可視化モードの場合
      setIsRolling(true);
      setActiveTab(1); // 可視化タブに切り替え
      setRollResults([]);
      setTotalResult(null);
      
      // 複数ダイスの場合は順次ロール
      rollDiceSequentially();
    } else {
      // 通常モードの場合
      performInstantRoll();
    }
  };

  const rollDiceSequentially = async () => {
    const results: number[] = [];
    
    for (let i = 0; i < diceCount; i++) {
      const result = Math.floor(Math.random() * diceType) + 1;
      results.push(result);
      setRollResults([...results]);
      
      // 各ダイスのロール間に少し時間を置く
      if (i < diceCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const total = results.reduce((sum, roll) => sum + roll, 0) + modifier;
    setTotalResult(total);
    setIsRolling(false);
    
    // 結果をメインシステムに送信
    const diceRoll: DiceRoll = {
      dice: `${diceCount}d${diceType}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ""}`,
      rolls: results,
      total,
      purpose: purpose || (selectedCharacterName ? `${selectedCharacterName}のロール` : "ダイスロール"),
    };
    
    setTimeout(() => {
      onRoll(diceRoll);
    }, 1500); // 結果表示後に自動送信
  };

  const performInstantRoll = () => {
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
    setActiveTab(0);
    setShowDiceVisualization(false);
    setIsRolling(false);
    setRollResults([]);
    setTotalResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const legacyInterface = (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DiceD20Icon />
          ダイスロール
          {selectedCharacterName && (
            <Chip label={selectedCharacterName} size="small" color="primary" />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="設定" />
          <Tab label="ダイス可視化" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={3} sx={{ pt: 1 }}>
          {/* プリセット */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              クイックプリセット
            </Typography>
            <Grid container spacing={1}>
              {presets.map((preset) => (
                <Grid size={{ xs: 'auto' }} key={preset.name}>
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
            <Grid size={{ xs: 4 }}>
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

            <Grid size={{ xs: 4 }}>
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

            <Grid size={{ xs: 4 }}>
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

          {/* ダイス可視化モード切り替え */}
          <Box>
            <Tooltip title="ダイスの転がりアニメーションを表示します">
              <Button
                variant={showDiceVisualization ? "contained" : "outlined"}
                onClick={() => setShowDiceVisualization(!showDiceVisualization)}
                fullWidth
              >
                {showDiceVisualization ? "可視化モード ON" : "可視化モード OFF"}
              </Button>
            </Tooltip>
          </Box>

          {/* ダイステーマ設定 */}
          {showDiceVisualization && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">
                  ダイステーマ設定 ({DICE_THEMES[selectedDiceTheme]?.name || 'クラシック'})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <DiceThemeSelector
                  selectedTheme={selectedDiceTheme}
                  onThemeChange={handleThemeChange}
                  showPreview={false}
                  compact={true}
                />
              </AccordionDetails>
            </Accordion>
          )}
        </Stack>
        )}

        {activeTab === 1 && (
          <Box sx={{ minHeight: 400 }}>
            {diceCount <= 3 && diceType !== 100 ? (
              <Grid container spacing={2}>
                {Array.from({ length: Math.max(1, rollResults.length || diceCount) }, (_, index) => (
                  <Grid size={{ xs: 12 / Math.min(3, diceCount) }} key={index}>
                    <DiceDisplay
                      diceType={`d${diceType}` as any}
                      result={rollResults[index]}
                      isRolling={isRolling && index <= rollResults.length}
                      size={120}
                      showModeToggle={index === 0}
                      defaultMode="2d"
                      theme={DICE_THEMES[selectedDiceTheme]}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {isRolling ? '転がっています...' : `${diceCount}d${diceType}`}
                </Typography>
                {rollResults.length > 0 && (
                  <Typography variant="body1">
                    個別結果: {rollResults.join(', ')}
                  </Typography>
                )}
                {totalResult !== null && (
                  <Typography variant="h4" color="primary" sx={{ mt: 2 }}>
                    合計: {totalResult}
                  </Typography>
                )}
              </Box>
            )}
            
            {totalResult !== null && modifier !== 0 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  ダイス合計: {totalResult - modifier}, 修正値: {modifier > 0 ? `+${modifier}` : modifier}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} disabled={isRolling}>
          {totalResult !== null ? '完了' : 'キャンセル'}
        </Button>
        <Button onClick={resetForm} color="secondary" disabled={isRolling}>
          リセット
        </Button>
        <Button 
          onClick={handleRoll} 
          variant="contained" 
          startIcon={<DiceD20Icon />}
          disabled={isRolling}
        >
          {isRolling ? '転がっています...' : 'ロール実行'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // 拡張されたダイス可視化インターフェースを使用
  return legacyInterface;
};

export default DiceRollUI;
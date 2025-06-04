import React, { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Paper,
  Grid,
  Alert,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Warning as TrapIcon,
  Search as DetectIcon,
  Build as DisarmIcon,
  Bolt as TriggerIcon,
  Add as AddIcon,
  ExpandMore,
  Visibility,
  Delete as DeleteIcon,
  Build,
  AutoFixHigh,
  Nature,
} from "@mui/icons-material";
import { TRPGCharacter } from "@trpg-ai-gm/types";

interface TrapEvent {
  id: string;
  name: string;
  description: string;
  location: string;
  trapType: "mechanical" | "magical" | "environmental" | "illusion";
  detectionDC: number; // 発見の難易度
  disarmDC: number; // 解除の難易度
  damage: {
    type: "physical" | "fire" | "ice" | "lightning" | "poison" | "psychic";
    amount: string; // "2d6+3" のようなダイス記法
  };
  effects: {
    status?: "poisoned" | "stunned" | "paralyzed" | "charmed" | "frightened";
    duration?: number; // ターン数
    area?: "single" | "5ft" | "10ft" | "15ft" | "line" | "cone";
  };
  resetCondition: "manual" | "time" | "never"; // リセット条件
  resetTime?: number; // 時間でリセットする場合の時間（分）
  hidden: boolean; // プレイヤーに見えるかどうか
  detected: boolean; // 発見済みかどうか
  disarmed: boolean; // 解除済みかどうか
  triggered: boolean; // 発動済みかどうか
}

interface TrapCheckResult {
  success: boolean;
  roll: number;
  dc: number;
  character: TRPGCharacter;
  type: "detection" | "disarm";
}

interface TrapEventSystemProps {
  currentLocation: string;
  characters: TRPGCharacter[];
  traps: TrapEvent[];
  onTrapTriggered: (trap: TrapEvent, character: TRPGCharacter) => void;
  onTrapDetected: (trap: TrapEvent, character: TRPGCharacter) => void;
  onTrapDisarmed: (trap: TrapEvent, character: TRPGCharacter) => void;
  onTrapCreated: (trap: TrapEvent) => void;
  onTrapUpdated: (trap: TrapEvent) => void;
  onTrapDeleted: (trapId: string) => void;
}

const TrapEventSystem: React.FC<TrapEventSystemProps> = ({
  currentLocation,
  characters,
  traps,
  onTrapTriggered,
  onTrapDetected,
  onTrapDisarmed,
  onTrapCreated,
  onTrapUpdated,
  onTrapDeleted,
}) => {
  const [locationTraps, setLocationTraps] = useState<TrapEvent[]>([]);
  const [checkDialog, setCheckDialog] = useState<{
    open: boolean;
    trap: TrapEvent | null;
    type: "detection" | "disarm";
  }>({ open: false, trap: null, type: "detection" });
  const [createDialog, setCreateDialog] = useState(false);
  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    result: TrapCheckResult | null;
  }>({ open: false, result: null });

  const [newTrap, setNewTrap] = useState<Partial<TrapEvent>>({
    name: "",
    description: "",
    location: currentLocation,
    trapType: "mechanical",
    detectionDC: 15,
    disarmDC: 15,
    damage: { type: "physical", amount: "1d6" },
    effects: { area: "single" },
    resetCondition: "manual",
    hidden: true,
    detected: false,
    disarmed: false,
    triggered: false,
  });

  // 現在の場所のトラップを取得
  useEffect(() => {
    const currentTraps = traps.filter(trap => trap.location === currentLocation);
    setLocationTraps(currentTraps);
  }, [traps, currentLocation]);

  // ダイスロール関数
  const rollDice = (dice: string): number => {
    // 簡単なダイスロール実装 (例: "1d20+5")
    const match = dice.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (!match) return Math.floor(Math.random() * 20) + 1;

    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = parseInt(match[3] || "0");

    let total = modifier;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
  };

  // 能力値修正の計算
  const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  // トラップ発見チェック
  const performDetectionCheck = (trap: TrapEvent, character: TRPGCharacter) => {
    const roll = rollDice("1d20");
    const wisdomMod = getAbilityModifier(character.stats.wisdom);
    const total = roll + wisdomMod;
    
    const result: TrapCheckResult = {
      success: total >= trap.detectionDC,
      roll: total,
      dc: trap.detectionDC,
      character,
      type: "detection",
    };

    if (result.success) {
      const updatedTrap = { ...trap, detected: true };
      onTrapDetected(updatedTrap, character);
      onTrapUpdated(updatedTrap);
    }

    setResultDialog({ open: true, result });
    setCheckDialog({ open: false, trap: null, type: "detection" });
  };

  // トラップ解除チェック
  const performDisarmCheck = (trap: TrapEvent, character: TRPGCharacter) => {
    const roll = rollDice("1d20");
    const dexterityMod = getAbilityModifier(character.stats.dexterity);
    const total = roll + dexterityMod;
    
    const result: TrapCheckResult = {
      success: total >= trap.disarmDC,
      roll: total,
      dc: trap.disarmDC,
      character,
      type: "disarm",
    };

    if (result.success) {
      const updatedTrap = { ...trap, disarmed: true };
      onTrapDisarmed(updatedTrap, character);
      onTrapUpdated(updatedTrap);
    } else {
      // 失敗時はトラップが発動
      const triggeredTrap = { ...trap, triggered: true };
      onTrapTriggered(triggeredTrap, character);
      onTrapUpdated(triggeredTrap);
    }

    setResultDialog({ open: true, result });
    setCheckDialog({ open: false, trap: null, type: "disarm" });
  };

  // トラップ作成
  const handleCreateTrap = () => {
    if (!newTrap.name || !newTrap.description) return;

    const trap: TrapEvent = {
      id: `trap-${Date.now()}`,
      name: newTrap.name,
      description: newTrap.description,
      location: newTrap.location || currentLocation,
      trapType: newTrap.trapType || "mechanical",
      detectionDC: newTrap.detectionDC || 15,
      disarmDC: newTrap.disarmDC || 15,
      damage: newTrap.damage || { type: "physical", amount: "1d6" },
      effects: newTrap.effects || { area: "single" },
      resetCondition: newTrap.resetCondition || "manual",
      resetTime: newTrap.resetTime,
      hidden: newTrap.hidden !== false,
      detected: false,
      disarmed: false,
      triggered: false,
    };

    onTrapCreated(trap);
    setCreateDialog(false);
    setNewTrap({
      name: "",
      description: "",
      location: currentLocation,
      trapType: "mechanical",
      detectionDC: 15,
      disarmDC: 15,
      damage: { type: "physical", amount: "1d6" },
      effects: { area: "single" },
      resetCondition: "manual",
      hidden: true,
      detected: false,
      disarmed: false,
      triggered: false,
    });
  };

  // トラップ状態の色
  const getTrapStatusColor = (trap: TrapEvent) => {
    if (trap.disarmed) return "success";
    if (trap.triggered) return "error";
    if (trap.detected) return "warning";
    return "default";
  };

  // トラップタイプのアイコン
  const getTrapTypeIcon = (type: string) => {
    switch (type) {
      case "mechanical": return <Build />;
      case "magical": return <AutoFixHigh />;
      case "environmental": return <Nature />;
      case "illusion": return <Visibility />;
      default: return <TrapIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {currentLocation} のトラップ ({locationTraps.length})
      </Typography>

      {/* トラップ作成ボタン */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
        >
          トラップを設置
        </Button>
      </Box>

      {/* トラップ一覧 */}
      <Grid container spacing={2}>
        {locationTraps.map((trap) => {
          // 隠されたトラップは発見されるまで表示しない（GM向けの表示は別）
          if (trap.hidden && !trap.detected && process.env.NODE_ENV === "production") {
            return null;
          }

          return (
            <Grid item xs={12} md={6} key={trap.id}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {trap.detected || process.env.NODE_ENV === "development" ? trap.name : "未知の危険"}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Chip
                      label={trap.disarmed ? "解除済み" : trap.triggered ? "発動済み" : trap.detected ? "発見済み" : "隠蔽"}
                      color={getTrapStatusColor(trap)}
                      size="small"
                    />
                    {process.env.NODE_ENV === "development" && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onTrapDeleted(trap.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {(trap.detected || process.env.NODE_ENV === "development") && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {trap.description}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                      <Chip label={trap.trapType} size="small" variant="outlined" />
                      <Chip label={`ダメージ: ${trap.damage.amount}`} size="small" variant="outlined" />
                      {trap.effects.status && (
                        <Chip label={trap.effects.status} size="small" color="warning" />
                      )}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {!trap.detected && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DetectIcon />}
                          onClick={() => setCheckDialog({ open: true, trap, type: "detection" })}
                        >
                          発見 (DC {trap.detectionDC})
                        </Button>
                      )}
                      {trap.detected && !trap.disarmed && !trap.triggered && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={<DisarmIcon />}
                          onClick={() => setCheckDialog({ open: true, trap, type: "disarm" })}
                        >
                          解除 (DC {trap.disarmDC})
                        </Button>
                      )}
                    </Box>
                  </>
                )}

                {process.env.NODE_ENV === "development" && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="body2">開発者情報</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">
                        発見DC: {trap.detectionDC} | 解除DC: {trap.disarmDC}
                        <br />
                        ダメージ: {trap.damage.type} {trap.damage.amount}
                        <br />
                        効果範囲: {trap.effects.area}
                        {trap.effects.status && <><br />状態異常: {trap.effects.status}</>}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {locationTraps.length === 0 && (
        <Alert severity="info">
          この場所にはトラップが設置されていません。
        </Alert>
      )}

      {/* チェック実行ダイアログ */}
      <Dialog open={checkDialog.open} onClose={() => setCheckDialog({ open: false, trap: null, type: "detection" })}>
        <DialogTitle>
          {checkDialog.type === "detection" ? "トラップ発見" : "トラップ解除"}チェック
        </DialogTitle>
        <DialogContent>
          {checkDialog.trap && (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {checkDialog.trap.name} に対して{checkDialog.type === "detection" ? "発見" : "解除"}を試みます。
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                難易度: {checkDialog.type === "detection" ? checkDialog.trap.detectionDC : checkDialog.trap.disarmDC}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>キャラクター選択</InputLabel>
                <Select defaultValue="">
                  {characters.map(char => (
                    <MenuItem key={char.id} value={char.id}>
                      {char.name} (
                      {checkDialog.type === "detection" 
                        ? `判断力: ${char.stats.wisdom}` 
                        : `器用さ: ${char.stats.dexterity}`
                      })
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckDialog({ open: false, trap: null, type: "detection" })}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const character = characters[0]; // 選択されたキャラクター（簡略化）
              if (checkDialog.type === "detection") {
                performDetectionCheck(checkDialog.trap!, character);
              } else {
                performDisarmCheck(checkDialog.trap!, character);
              }
            }}
          >
            チェック実行
          </Button>
        </DialogActions>
      </Dialog>

      {/* 結果表示ダイアログ */}
      <Dialog open={resultDialog.open} onClose={() => setResultDialog({ open: false, result: null })}>
        <DialogTitle>
          {resultDialog.result?.type === "detection" ? "発見" : "解除"}チェック結果
        </DialogTitle>
        <DialogContent>
          {resultDialog.result && (
            <Box>
              <Typography variant="h6" color={resultDialog.result.success ? "success.main" : "error.main"} sx={{ mb: 2 }}>
                {resultDialog.result.success ? "成功！" : "失敗..."}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {resultDialog.result.character.name}のチェック
              </Typography>
              <Typography variant="body2">
                ロール結果: {resultDialog.result.roll} (DC: {resultDialog.result.dc})
              </Typography>
              {!resultDialog.result.success && resultDialog.result.type === "disarm" && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  解除に失敗したため、トラップが発動しました！
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialog({ open: false, result: null })}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>

      {/* トラップ作成ダイアログ */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>新しいトラップを設置</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="トラップ名"
                value={newTrap.name || ""}
                onChange={(e) => setNewTrap({ ...newTrap, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="説明"
                multiline
                rows={3}
                value={newTrap.description || ""}
                onChange={(e) => setNewTrap({ ...newTrap, description: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>トラップタイプ</InputLabel>
                <Select
                  value={newTrap.trapType || "mechanical"}
                  label="トラップタイプ"
                  onChange={(e) => setNewTrap({ ...newTrap, trapType: e.target.value as any })}
                >
                  <MenuItem value="mechanical">機械式</MenuItem>
                  <MenuItem value="magical">魔法式</MenuItem>
                  <MenuItem value="environmental">環境</MenuItem>
                  <MenuItem value="illusion">幻術</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={3}>
              <TextField
                fullWidth
                label="発見DC"
                type="number"
                value={newTrap.detectionDC || 15}
                onChange={(e) => setNewTrap({ ...newTrap, detectionDC: parseInt(e.target.value) || 15 })}
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                fullWidth
                label="解除DC"
                type="number"
                value={newTrap.disarmDC || 15}
                onChange={(e) => setNewTrap({ ...newTrap, disarmDC: parseInt(e.target.value) || 15 })}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>ダメージタイプ</InputLabel>
                <Select
                  value={newTrap.damage?.type || "physical"}
                  label="ダメージタイプ"
                  onChange={(e) => setNewTrap({
                    ...newTrap,
                    damage: { ...newTrap.damage!, type: e.target.value as any }
                  })}
                >
                  <MenuItem value="physical">物理</MenuItem>
                  <MenuItem value="fire">火</MenuItem>
                  <MenuItem value="ice">氷</MenuItem>
                  <MenuItem value="lightning">雷</MenuItem>
                  <MenuItem value="poison">毒</MenuItem>
                  <MenuItem value="psychic">精神</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="ダメージ量 (ダイス記法)"
                value={newTrap.damage?.amount || "1d6"}
                onChange={(e) => setNewTrap({
                  ...newTrap,
                  damage: { ...newTrap.damage!, amount: e.target.value }
                })}
                helperText="例: 2d6+3, 1d10"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>キャンセル</Button>
          <Button
            variant="contained"
            onClick={handleCreateTrap}
            disabled={!newTrap.name || !newTrap.description}
          >
            設置
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrapEventSystem;
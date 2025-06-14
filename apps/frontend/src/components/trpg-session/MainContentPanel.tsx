import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CardMedia,
  Tab,
  Tabs,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  NavigateNext,
  CheckCircle,
  Place,
  LocationOn,
} from "@mui/icons-material";
import { DungeonIcon, BaseIcon, QuestScrollIcon } from "../icons/TRPGIcons";
import EnemySelectionPanel from "./EnemySelectionPanel";
import {
  EnemyCharacter,
  TRPGCharacter,
  BaseLocation,
  NPCCharacter,
  TRPGCampaign,
} from "@trpg-ai-gm/types";

// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  // hidden属性をstyle.displayで明示的に制御
  const isVisible = value === index;

  return (
    <div
      role="tabpanel"
      id={`main-content-tabpanel-${index}`}
      style={{
        height: "100%",
        display: isVisible ? "flex" : "none", // hidden属性の代わりにdisplayで制御
        flexDirection: "column",
        width: "100%",
        overflow: "auto",
      }}
      {...other}
    >
      {isVisible && (
        <Box
          sx={{
            p: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minHeight: 0,
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

// 行動選択の型定義
interface ActionChoice {
  id: string;
  type: "move" | "shop" | "talk" | "interact" | "skill" | "custom" | "attack";
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresTarget?: boolean;
  targetType?: "location" | "npc" | "character" | "item" | "enemy";
}

interface MainContentPanelProps {
  currentLocation?: string;
  currentBaseImage?: string;
  availableActions: ActionChoice[];
  actionCount: number;
  maxActionsPerDay: number;
  currentBase?: any;
  enemies?: EnemyCharacter[];
  npcs?: NPCCharacter[];
  selectedCharacter?: TRPGCharacter;
  bases?: BaseLocation[];
  currentCampaign?: TRPGCampaign;
  isSessionStarted?: boolean;
  getCampaignFlag?: (flagKey: string, defaultValue?: any) => any;
  onExecuteAction: (action: ActionChoice) => void;
  onAdvanceDay: () => void;
  onFacilityInteract: (facility: any) => void;
  onAttackEnemies?: (selectedEnemies: string[]) => void;
  onLocationChange?: (locationName: string) => void;
}

const MainContentPanel: React.FC<MainContentPanelProps> = ({
  currentLocation,
  currentBaseImage,
  availableActions,
  actionCount,
  maxActionsPerDay,
  currentBase,
  enemies = [],
  npcs = [],
  selectedCharacter,
  bases = [],
  currentCampaign,
  isSessionStarted = false,
  getCampaignFlag: _getCampaignFlag,
  onExecuteAction,
  onAdvanceDay,
  onFacilityInteract,
  onAttackEnemies,
  onLocationChange,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [showEnemySelection, setShowEnemySelection] = useState(false);
  const [selectedEnemies, setSelectedEnemies] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // 現在地にいるNPCをフィルタリング
  const currentLocationNPCs = npcs.filter(
    (npc) => npc.location === currentLocation,
  );

  // 行動選択の処理
  const handleActionClick = (action: ActionChoice) => {
    if (action.type === "attack") {
      // 攻撃アクションの場合は敵選択UIを表示
      setShowEnemySelection(true);
      setSelectedEnemies([]);
    } else {
      // その他のアクションは通常通り実行
      onExecuteAction(action);
    }
  };

  // 敵選択の処理
  const handleEnemyToggle = (enemyId: string) => {
    setSelectedEnemies((prev) =>
      prev.includes(enemyId)
        ? prev.filter((id) => id !== enemyId)
        : [...prev, enemyId],
    );
  };

  // 攻撃確認の処理
  const handleConfirmAttack = (selectedEnemyIds: string[]) => {
    if (onAttackEnemies) {
      onAttackEnemies(selectedEnemyIds);
    }
    setShowEnemySelection(false);
    setSelectedEnemies([]);
  };

  // 攻撃キャンセルの処理
  const handleCancelAttack = () => {
    setShowEnemySelection(false);
    setSelectedEnemies([]);
  };

  // 場所変更の処理
  const handleLocationChange = (event: any) => {
    const newLocation = event.target.value;
    if (onLocationChange && newLocation !== currentLocation) {
      onLocationChange(newLocation);
    }
  };

  // 現在地が拠点か場所かを判定する関数
  const getCurrentLocationType = () => {
    if (!currentLocation) return null;

    // 拠点リストから検索
    const base = bases.find((base) => base.name === currentLocation);
    if (base) {
      return { type: "base", data: base };
    }

    // TODO: 場所リストからも検索する（将来的にlocationsフィールドが追加される場合）
    // const location = locations?.find(loc => loc.name === currentLocation);
    // if (location) {
    //   return { type: 'location', data: location };
    // }

    return null;
  };

  const currentLocationInfo = getCurrentLocationType();

  return (
    <Paper
      elevation={2}
      sx={{
        height: "100%",
        maxHeight: "100%", // 親の高さを超えないよう明示的に制限
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: 0, // flexbox子要素として適切に動作
        overflow: "hidden",
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab
            label="探索"
            icon={<DungeonIcon />}
            disabled={!isSessionStarted}
          />
          <Tab
            label={currentLocationInfo?.type === "base" ? "拠点" : "場所"}
            icon={
              currentLocationInfo?.type === "base" ? (
                <BaseIcon />
              ) : (
                <LocationOn />
              )
            }
            disabled={!isSessionStarted}
          />
          <Tab label="ステータス" icon={<CheckCircle />} />
          <Tab
            label="クエスト"
            icon={<QuestScrollIcon />}
            disabled={!isSessionStarted}
          />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <TabPanel value={tabValue} index={0}>
          {/* 探索タブ */}
          <Box
            sx={{
              height: "100%",
              overflow: "auto",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "3px",
                "&:hover": {
                  background: "#a8a8a8",
                },
              },
            }}
          >
            {showEnemySelection ? (
              // 敵選択UI表示
              <EnemySelectionPanel
                enemies={enemies}
                selectedEnemies={selectedEnemies}
                onEnemySelect={() => {
                  /* Enemy selection handler - not implemented yet */
                }}
                onEnemyToggle={handleEnemyToggle}
                onConfirmAttack={handleConfirmAttack}
                onCancel={handleCancelAttack}
                attackingCharacter={selectedCharacter?.name}
              />
            ) : !currentLocation ? (
              // 場所が設定されていない場合
              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  📍 場所の情報がありません
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  冒険を始めるには、まず場所を登録してください
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setNotificationMessage(
                      "世界観構築画面で場所を登録してください",
                    );
                    setShowNotification(true);
                  }}
                  sx={{ mb: 2 }}
                >
                  場所を登録する
                </Button>
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                >
                  世界観構築 → 拠点タブから場所を追加できます
                </Typography>
              </Box>
            ) : (
              // 場所が設定されている場合の通常表示
              <>
                {/* 場所選択ドロップダウン */}
                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="location-select-label">
                      移動先を選択
                    </InputLabel>
                    <Select
                      labelId="location-select-label"
                      value={currentLocation || ""}
                      label="移動先を選択"
                      onChange={handleLocationChange}
                      startAdornment={<Place sx={{ mr: 1 }} />}
                    >
                      {bases
                        .filter((base) => base.meta.unlocked)
                        .map((base) => (
                          <MenuItem key={base.id} value={base.name}>
                            {base.type === "都市"
                              ? "🏛️"
                              : base.type === "森"
                                ? "🌲"
                                : base.type === "遺跡"
                                  ? "🏛️"
                                  : "📍"}{" "}
                            {base.name}
                            {base.threats.dangerLevel === "高" && " ⚠️"}
                            {base.threats.dangerLevel === "中" && " ⚡"}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>

                <Typography variant="h6" gutterBottom>
                  現在地: {currentLocation}
                </Typography>

                {currentBaseImage && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={currentBaseImage}
                    alt={currentLocation}
                    sx={{ borderRadius: 1, mb: 2 }}
                  />
                )}

                <Grid container spacing={1} data-testid="available-actions">
                  {availableActions.map((action) => (
                    <Grid size={{ xs: 12 }} key={action.id}>
                      <Tooltip
                        title={action.description || action.label}
                        placement="right"
                      >
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={action.icon}
                          onClick={() => handleActionClick(action)}
                          disabled={actionCount >= maxActionsPerDay}
                          sx={{ p: 1, textAlign: "left" }}
                          data-testid="action-button"
                        >
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {action.label}
                            </Typography>
                          </Box>
                        </Button>
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>

                {actionCount >= maxActionsPerDay && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={onAdvanceDay}
                      startIcon={<NavigateNext />}
                    >
                      翌日に進む
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* 拠点/場所タブ */}
          <Box
            sx={{
              height: "100%",
              overflow: "auto",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "3px",
                "&:hover": {
                  background: "#a8a8a8",
                },
              },
            }}
          >
            {!currentLocation ? (
              /* 現在地データ読み込み中 */
              <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary">
                  📍 場所データを読み込み中...
                </Typography>
              </Box>
            ) : currentLocationInfo?.type === "base" ? (
              <>
                {/* 拠点の場合: 施設情報 + 行動選択肢 */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    🏛️ 拠点施設
                  </Typography>
                  {currentBase && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {currentBase.description}
                      </Typography>
                      {/* TODO: 施設インタラクション機能の実装 */}
                    </Box>
                  )}
                </Box>

                {/* この場所にいるNPC */}
                {currentLocationNPCs.length > 0 && (
                  <Box sx={{ mt: 2, p: 2 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      👥 この場所にいるNPC ({currentLocationNPCs.length}人)
                    </Typography>
                    <Grid container spacing={1}>
                      {currentLocationNPCs.map((npc) => (
                        <Grid size={{ xs: 12 }} key={npc.id}>
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={() =>
                              onExecuteAction({
                                id: `talk-${npc.id}`,
                                type: "talk",
                                label: `${npc.name}と会話する`,
                                description: `${npc.name}（${npc.occupation || "NPC"}）と会話する`,
                                icon: <Place />,
                                requiresTarget: false,
                              })
                            }
                            disabled={actionCount >= maxActionsPerDay}
                            sx={{
                              p: 1.5,
                              textAlign: "left",
                              justifyContent: "flex-start",
                              border: "2px solid",
                              borderColor:
                                npc.attitude === "friendly"
                                  ? "success.main"
                                  : npc.attitude === "hostile"
                                    ? "error.main"
                                    : npc.attitude === "neutral"
                                      ? "info.main"
                                      : "grey.400",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                width: "100%",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  bgcolor:
                                    npc.attitude === "friendly"
                                      ? "success.light"
                                      : npc.attitude === "hostile"
                                        ? "error.light"
                                        : npc.attitude === "neutral"
                                          ? "info.light"
                                          : "grey.300",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontWeight: "bold",
                                }}
                              >
                                {npc.name.charAt(0)}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {npc.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {npc.occupation || "NPC"} • 態度:{" "}
                                  {npc.attitude === "friendly"
                                    ? "友好的"
                                    : npc.attitude === "hostile"
                                      ? "敵対的"
                                      : npc.attitude === "neutral"
                                        ? "中立"
                                        : "不明"}
                                </Typography>
                              </Box>
                            </Box>
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* 拠点固有の行動選択肢 */}
                {currentLocationInfo.data.availableActions &&
                  currentLocationInfo.data.availableActions.length > 0 && (
                    <Box sx={{ mt: 2, p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        🎯 拠点での行動選択肢
                      </Typography>
                      <Grid container spacing={1}>
                        {currentLocationInfo.data.availableActions.map(
                          (action) => (
                            <Grid size={{ xs: 12 }} key={action.id}>
                              <Tooltip
                                title={action.description}
                                placement="right"
                              >
                                <Button
                                  variant="outlined"
                                  fullWidth
                                  onClick={() =>
                                    onExecuteAction({
                                      id: action.id,
                                      type: "custom",
                                      label: action.name,
                                      description: action.description,
                                      icon: <CheckCircle />,
                                      requiresTarget: false,
                                    })
                                  }
                                  disabled={actionCount >= maxActionsPerDay}
                                  sx={{
                                    p: 1,
                                    textAlign: "left",
                                    justifyContent: "flex-start",
                                  }}
                                >
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight="bold"
                                    >
                                      {action.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {action.category}
                                    </Typography>
                                  </Box>
                                </Button>
                              </Tooltip>
                            </Grid>
                          ),
                        )}
                      </Grid>
                    </Box>
                  )}
              </>
            ) : (
              /* 場所の場合: 場所固有の情報と行動選択肢 */
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  📍 {currentLocation || "場所情報"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  探索地点の詳細情報と行動選択肢がここに表示されます。
                </Typography>
                {/* TODO: 場所固有の行動選択肢を実装 */}
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* ステータスタブ */}
          <Box
            sx={{
              height: "100%",
              overflow: "auto",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "3px",
                "&:hover": {
                  background: "#a8a8a8",
                },
              },
            }}
          >
            {selectedCharacter ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedCharacter.name} のステータス
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    基本情報
                  </Typography>
                  <Typography variant="body2">
                    種族: {selectedCharacter.nation || "未設定"}
                  </Typography>
                  <Typography variant="body2">
                    職業: {selectedCharacter.profession || "未設定"}
                  </Typography>
                  <Typography variant="body2">
                    年齢: {selectedCharacter.age || "不明"}
                  </Typography>
                  <Typography variant="body2">
                    性別: {selectedCharacter.gender || "不明"}
                  </Typography>
                  <Typography variant="body2">
                    宗教: {selectedCharacter.religion || "未設定"}
                  </Typography>
                </Box>

                {selectedCharacter.attributes && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      能力値
                    </Typography>
                    <Typography variant="body2">
                      STR: {selectedCharacter.attributes.STR}
                    </Typography>
                    <Typography variant="body2">
                      CON: {selectedCharacter.attributes.CON}
                    </Typography>
                    <Typography variant="body2">
                      SIZ: {selectedCharacter.attributes.SIZ}
                    </Typography>
                    <Typography variant="body2">
                      INT: {selectedCharacter.attributes.INT}
                    </Typography>
                    <Typography variant="body2">
                      POW: {selectedCharacter.attributes.POW}
                    </Typography>
                    <Typography variant="body2">
                      DEX: {selectedCharacter.attributes.DEX}
                    </Typography>
                    <Typography variant="body2">
                      CHA: {selectedCharacter.attributes.CHA}
                    </Typography>
                  </Box>
                )}

                {selectedCharacter.derived && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      派生値
                    </Typography>
                    <Typography variant="body2">
                      HP: {selectedCharacter.derived.HP}
                    </Typography>
                    <Typography variant="body2">
                      MP: {selectedCharacter.derived.MP}
                    </Typography>
                    <Typography variant="body2">
                      SW (先制値): {selectedCharacter.derived.SW}
                    </Typography>
                    <Typography variant="body2">
                      RES (抵抗値): {selectedCharacter.derived.RES}
                    </Typography>
                  </Box>
                )}

                {/* パーティ所持金表示 */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    パーティ情報
                  </Typography>
                  <Typography variant="body2">
                    💰 所持金: {currentCampaign?.partyGold ?? 500}G
                  </Typography>
                </Box>

                {/* キャンペーンフラグ表示 */}
                {currentCampaign?.campaignFlags &&
                  Object.keys(currentCampaign.campaignFlags).length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        ストーリーフラグ
                      </Typography>
                      {Object.entries(currentCampaign.campaignFlags)
                        .filter(([_, value]) => value !== null)
                        .slice(0, 5) // 最新5つのみ表示
                        .map(([key, value]) => (
                          <Typography
                            key={key}
                            variant="body2"
                            sx={{ fontSize: "0.75rem" }}
                          >
                            🚩 {key}: {String(value)}
                          </Typography>
                        ))}
                    </Box>
                  )}

                {selectedCharacter.weapons &&
                  selectedCharacter.weapons.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        武器
                      </Typography>
                      {selectedCharacter.weapons.map((weapon, index) => (
                        <Typography key={index} variant="body2">
                          • {weapon.name} (攻撃: {weapon.attack}, ダメージ:{" "}
                          {weapon.damage})
                        </Typography>
                      ))}
                    </Box>
                  )}

                {selectedCharacter.armor && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      装甲
                    </Typography>
                    <Typography variant="body2">
                      頭部: {selectedCharacter.armor.head}
                    </Typography>
                    <Typography variant="body2">
                      胴体: {selectedCharacter.armor.body}
                    </Typography>
                    <Typography variant="body2">
                      左腕: {selectedCharacter.armor.leftArm}
                    </Typography>
                    <Typography variant="body2">
                      右腕: {selectedCharacter.armor.rightArm}
                    </Typography>
                    <Typography variant="body2">
                      左脚: {selectedCharacter.armor.leftLeg}
                    </Typography>
                    <Typography variant="body2">
                      右脚: {selectedCharacter.armor.rightLeg}
                    </Typography>
                  </Box>
                )}

                {selectedCharacter.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      外見・特徴
                    </Typography>
                    <Typography variant="body2">
                      {selectedCharacter.description}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: "center", mt: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  📊 キャラクター未選択
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  左のパーティパネルからキャラクターを選択してください
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* クエストタブ */}
          <Box
            sx={{
              height: "100%",
              overflow: "auto",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "3px",
                "&:hover": {
                  background: "#a8a8a8",
                },
              },
            }}
          >
            <Typography variant="h6">進行中のクエスト</Typography>
            <Typography variant="body2" color="text.secondary">
              クエスト機能は開発中です
            </Typography>
          </Box>
        </TabPanel>
      </Box>

      {/* 通知用Snackbar */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowNotification(false)}
          severity="info"
          variant="filled"
        >
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default MainContentPanel;

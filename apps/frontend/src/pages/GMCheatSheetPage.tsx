import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Stack,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Star as StarIcon,
  SmartToy as SmartToyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Assignment as AssignmentIcon,
  Security as SecurityIcon,
  EmojiEvents as EmojiEventsIcon,
  Help as HelpIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Timeline as TimelineIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import { useRecoilValue } from "recoil";
import { currentCampaignState } from "../store/atoms";
import {
  GMCheatSheet,
  GMKeyItemInfo,
  GMClearConditionInfo,
  GMEnemyTacticsInfo,
  GMSecretInfo,
  GMSessionNotes,
  TRPGCampaign,
  Item,
  ClearCondition,
  EnemyCharacter,
} from "@trpg-ai-gm/types";

// タブパネルコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gm-tabpanel-${index}`}
      aria-labelledby={`gm-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// 重要度に応じた色とアイコンを取得
const getImportanceInfo = (importance: "critical" | "high" | "medium" | "low") => {
  switch (importance) {
    case "critical":
      return { color: "error", icon: <WarningIcon />, label: "クリティカル" };
    case "high":
      return { color: "warning", icon: <StarIcon />, label: "高" };
    case "medium":
      return { color: "info", icon: <InfoIcon />, label: "中" };
    case "low":
      return { color: "success", icon: <CheckCircleIcon />, label: "低" };
    default:
      return { color: "default", icon: <InfoIcon />, label: "不明" };
  }
};

const GMCheatSheetPage: React.FC = () => {
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [tabValue, setTabValue] = useState(0);
  const [gmCheatSheet, setGmCheatSheet] = useState<GMCheatSheet | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info">("info");

  // 既存データの抽出
  const campaignItems = currentCampaign?.items || [];
  const campaignClearConditions = currentCampaign?.clearConditions || [];
  const campaignEnemies = currentCampaign?.enemies || [];

  // ダイアログの状態
  const [secretInfoDialogOpen, setSecretInfoDialogOpen] = useState(false);
  const [sessionNotesDialogOpen, setSessionNotesDialogOpen] = useState(false);

  // 編集中のアイテム
  const [editingSecretInfo, setEditingSecretInfo] = useState<GMSecretInfo | null>(null);
  const [editingSessionNotes, setEditingSessionNotes] = useState<GMSessionNotes | null>(null);

  // 表示制御
  const [showCompletedConditions, setShowCompletedConditions] = useState(false);
  const [showLowPriorityItems, setShowLowPriorityItems] = useState(false);

  // 初期化
  useEffect(() => {
    if (currentCampaign) {
      initializeCheatSheet();
    }
  }, [currentCampaign]);

  const initializeCheatSheet = () => {
    if (!currentCampaign) return;

    // ローカルストレージからGMチートシートを読み込み
    const savedCheatSheet = localStorage.getItem(`gm-cheatsheet-${currentCampaign.id}`);
    if (savedCheatSheet) {
      try {
        const parsed = JSON.parse(savedCheatSheet);
        setGmCheatSheet(parsed);
      } catch (error) {
        console.error("GMチートシートの読み込みに失敗:", error);
        createNewCheatSheet();
      }
    } else {
      createNewCheatSheet();
    }
  };

  const createNewCheatSheet = () => {
    if (!currentCampaign) return;

    const newCheatSheet: GMCheatSheet = {
      id: `gm-cheatsheet-${currentCampaign.id}`,
      campaignId: currentCampaign.id,
      keyItemsInfo: [],
      clearConditionsInfo: [],
      enemyTacticsInfo: [],
      secretInfo: [],
      sessionNotes: [],
      quickReference: "",
      currentSessionReminders: [],
      updatedAt: new Date(),
    };

    setGmCheatSheet(newCheatSheet);
    saveCheatSheet(newCheatSheet);
  };

  const saveCheatSheet = (cheatSheet: GMCheatSheet) => {
    if (!currentCampaign) return;

    const updatedCheatSheet = {
      ...cheatSheet,
      updatedAt: new Date(),
    };

    localStorage.setItem(`gm-cheatsheet-${currentCampaign.id}`, JSON.stringify(updatedCheatSheet));
    setGmCheatSheet(updatedCheatSheet);
    
    setSnackbarMessage("GMチートシートを保存しました");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 既存データとGM情報の統合ヘルパー
  const getKeyItemsWithGMInfo = () => {
    return campaignItems.map(item => {
      const gmInfo = gmCheatSheet?.keyItemsInfo.find(info => info.itemId === item.id);
      return {
        item,
        gmInfo,
        isKeyItem: gmInfo?.isKeyItem || false,
      };
    }).filter(data => data.isKeyItem);
  };

  const getClearConditionsWithGMInfo = () => {
    return campaignClearConditions.map(condition => {
      const gmInfo = gmCheatSheet?.clearConditionsInfo.find(info => info.clearConditionId === condition.id);
      return {
        condition,
        gmInfo,
      };
    });
  };

  const getEnemiesWithGMInfo = () => {
    return campaignEnemies.map(enemy => {
      const gmInfo = gmCheatSheet?.enemyTacticsInfo.find(info => info.enemyId === enemy.id);
      return {
        enemy,
        gmInfo,
        hasGMInfo: !!gmInfo,
      };
    });
  };

  // 秘密情報関連の処理
  const handleAddSecretInfo = () => {
    setEditingSecretInfo(null);
    setSecretInfoDialogOpen(true);
  };

  const handleEditSecretInfo = (info: GMSecretInfo) => {
    setEditingSecretInfo(info);
    setSecretInfoDialogOpen(true);
  };

  const handleDeleteSecretInfo = (infoId: string) => {
    if (!gmCheatSheet) return;

    const updatedCheatSheet = {
      ...gmCheatSheet,
      secretInfo: gmCheatSheet.secretInfo.filter(info => info.id !== infoId),
    };

    saveCheatSheet(updatedCheatSheet);
  };

  // セッションノート関連の処理
  const handleAddSessionNotes = () => {
    setEditingSessionNotes(null);
    setSessionNotesDialogOpen(true);
  };

  const handleEditSessionNotes = (notes: GMSessionNotes) => {
    setEditingSessionNotes(notes);
    setSessionNotesDialogOpen(true);
  };

  // AI GMへの情報送信
  const handleSendToAIGM = () => {
    if (!gmCheatSheet) return;

    // TODO: AI GMへの情報送信機能を実装
    setSnackbarMessage("AI GMへの情報送信機能は開発中です");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  };

  if (!currentCampaign) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">キャンペーンが選択されていません</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          GMチートシートを使用するには、まずキャンペーンを選択してください。
        </Typography>
      </Box>
    );
  }

  if (!gmCheatSheet) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography variant="h6">GMチートシートを読み込み中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              🎲 GMダッシュボード
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {currentCampaign.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              最終更新: {gmCheatSheet.updatedAt.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SmartToyIcon />}
              onClick={handleSendToAIGM}
            >
              AI GMに情報を送る
            </Button>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => saveCheatSheet(gmCheatSheet)}
            >
              保存
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 統計サマリー */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <InventoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{getKeyItemsWithGMInfo().length}</Typography>
              <Typography variant="body2" color="text.secondary">キーアイテム</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEventsIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{campaignClearConditions.length}</Typography>
              <Typography variant="body2" color="text.secondary">クリア条件</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <SecurityIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{campaignEnemies.length}</Typography>
              <Typography variant="body2" color="text.secondary">エネミー</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <HelpIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">{gmCheatSheet.secretInfo.length}</Typography>
              <Typography variant="body2" color="text.secondary">秘密情報</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* タブナビゲーション */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="GM ダッシュボード タブ">
          <Tab 
            label="📊 ダッシュボード"
            icon={<DashboardIcon />}
          />
          <Tab 
            label={
              <Badge badgeContent={getKeyItemsWithGMInfo().length} color="primary">
                キーアイテム
              </Badge>
            } 
            icon={<InventoryIcon />}
          />
          <Tab 
            label={
              <Badge badgeContent={campaignClearConditions.length} color="primary">
                クリア条件
              </Badge>
            } 
            icon={<EmojiEventsIcon />}
          />
          <Tab 
            label={
              <Badge badgeContent={getEnemiesWithGMInfo().filter(e => e.hasGMInfo).length} color="primary">
                敵情報
              </Badge>
            } 
            icon={<SecurityIcon />}
          />
          <Tab 
            label={
              <Badge badgeContent={gmCheatSheet.secretInfo.length} color="primary">
                秘密情報
              </Badge>
            } 
            icon={<HelpIcon />}
          />
        </Tabs>
      </Paper>

      {/* タブコンテンツ */}
      <CustomTabPanel value={tabValue} index={0}>
        {/* ダッシュボードタブ */}
        <Typography variant="h6" gutterBottom>📊 GM情報ダッシュボード</Typography>
        
        {/* クイックアクセス */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🏃‍♂️ クイックアクション
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<InventoryIcon />}
                    endIcon={<NavigateNextIcon />}
                    fullWidth
                    onClick={() => setTabValue(1)}
                  >
                    キーアイテムの確認 ({getKeyItemsWithGMInfo().length}個)
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<EmojiEventsIcon />}
                    endIcon={<NavigateNextIcon />}
                    fullWidth
                    onClick={() => setTabValue(2)}
                  >
                    クリア条件の確認 ({campaignClearConditions.length}個)
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<SecurityIcon />}
                    endIcon={<NavigateNextIcon />}
                    fullWidth
                    onClick={() => setTabValue(3)}
                  >
                    エネミー情報の確認 ({campaignEnemies.length}体)
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎯 セッション準備状況
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color={getKeyItemsWithGMInfo().length > 0 ? "success" : "disabled"} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="キーアイテム設定"
                      secondary={`${getKeyItemsWithGMInfo().length}個のキーアイテムが設定済み`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color={campaignClearConditions.length > 0 ? "success" : "disabled"} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="クリア条件設定"
                      secondary={`${campaignClearConditions.length}個のクリア条件が設定済み`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color={gmCheatSheet.secretInfo.length > 0 ? "success" : "disabled"} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="秘密情報設定"
                      secondary={`${gmCheatSheet.secretInfo.length}個の秘密情報が設定済み`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 最近の秘密情報 */}
        {gmCheatSheet.secretInfo.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤫 最近の秘密情報
              </Typography>
              {gmCheatSheet.secretInfo.slice(0, 3).map((info) => (
                <Accordion key={info.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={info.category.replace('_', ' ')} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Typography>{info.title}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {info.content}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        )}
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={1}>
        {/* キーアイテムタブ */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">🎒 キーアイテム情報</Typography>
          <Typography variant="body2" color="text.secondary">
            アイテム管理画面で作成されたアイテムの中から、キーアイテムを指定・管理
          </Typography>
        </Box>

        {/* 既存アイテムからキーアイテム選択の説明 */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            キーアイテムは「アイテム管理」画面で作成されたアイテムの中から指定します。
            まだアイテムが作成されていない場合は、先にアイテム管理画面でアイテムを作成してください。
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          {getKeyItemsWithGMInfo().map((data) => {
            const { item, gmInfo } = data;
            const importanceInfo = getImportanceInfo(gmInfo?.importance || "medium");
            return (
              <Grid item xs={12} md={6} key={item.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        {item.name}
                        {gmInfo?.obtainStatus === "obtained" && (
                          <Chip label="取得済み" size="small" color="success" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Chip
                        icon={importanceInfo.icon}
                        label={importanceInfo.label}
                        color={importanceInfo.color as any}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {item.description}
                    </Typography>
                    
                    {gmInfo?.plotRelevance && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>ストーリー重要性:</strong> {gmInfo.plotRelevance}
                      </Typography>
                    )}
                    
                    {gmInfo?.gmHints && gmInfo.gmHints.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>GMヒント:</strong>
                        </Typography>
                        {gmInfo.gmHints.map((hint, index) => (
                          <Typography key={index} variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                            • {hint}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<EditIcon />}>
                      GM情報編集
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {getKeyItemsWithGMInfo().length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              キーアイテムが指定されていません
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              アイテム管理画面でアイテムを作成し、こちらでキーアイテムとして指定してください。
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              キーアイテムを指定
            </Button>
          </Paper>
        )}
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={2}>
        {/* クリア条件タブ */}
        <Typography variant="h6" gutterBottom>🏆 ゲームクリア条件</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            クリア条件は「タイムライン管理」画面で設定されたものが表示されます。GM追加情報を入力できます。
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          {getClearConditionsWithGMInfo().map((data) => {
            const { condition, gmInfo } = data;
            return (
              <Grid item xs={12} key={condition.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {condition.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {condition.description}
                    </Typography>
                    {gmInfo?.gmNotes && (
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        GM Note: {gmInfo.gmNotes}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<EditIcon />}>
                      GM情報編集
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {campaignClearConditions.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              クリア条件が設定されていません
            </Typography>
            <Typography variant="body1" color="text.secondary">
              タイムライン管理画面でクリア条件を設定してください。
            </Typography>
          </Paper>
        )}
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={3}>
        {/* エネミー情報タブ */}
        <Typography variant="h6" gutterBottom>⚔️ エネミー戦術情報</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            エネミー管理画面で作成されたエネミーに対するGM戦術情報を管理します。
          </Typography>
        </Alert>

        <Grid container spacing={2}>
          {getEnemiesWithGMInfo().map((data) => {
            const { enemy, gmInfo } = data;
            return (
              <Grid item xs={12} md={6} key={enemy.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {enemy.name}
                      <Chip 
                        label={enemy.rank} 
                        size="small" 
                        color="error" 
                        sx={{ ml: 1 }} 
                      />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {enemy.description}
                    </Typography>
                    {gmInfo?.tacticalAdvice && gmInfo.tacticalAdvice.length > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          GM戦術アドバイス:
                        </Typography>
                        {gmInfo.tacticalAdvice.map((advice, index) => (
                          <Typography key={index} variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                            • {advice}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button size="small" startIcon={<EditIcon />}>
                      戦術情報編集
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {campaignEnemies.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              エネミーが登録されていません
            </Typography>
            <Typography variant="body1" color="text.secondary">
              エネミー管理画面でエネミーを作成してください。
            </Typography>
          </Paper>
        )}
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={4}>
        {/* 秘密情報タブ */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">🤫 GM専用秘密情報</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSecretInfo}
          >
            秘密情報追加
          </Button>
        </Box>

        <Grid container spacing={2}>
          {gmCheatSheet.secretInfo.map((info) => {
            const importanceInfo = getImportanceInfo(info.importance);
            return (
              <Grid item xs={12} md={6} key={info.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        {info.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={info.category.replace('_', ' ')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          icon={importanceInfo.icon}
                          label={importanceInfo.label}
                          color={importanceInfo.color as any}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {info.content}
                    </Typography>
                    
                    {info.revealTiming && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>公開タイミング:</strong> {info.revealTiming.replace('_', ' ')}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton onClick={() => handleEditSecretInfo(info)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteSecretInfo(info.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {gmCheatSheet.secretInfo.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              秘密情報が登録されていません
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              プロットのネタバレ、隠された世界設定などのGM専用情報を追加してください。
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSecretInfo}>
              最初の秘密情報を追加
            </Button>
          </Paper>
        )}
      </CustomTabPanel>

      {/* スナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* TODO: ダイアログコンポーネントを実装 */}
    </Box>
  );
};

export default GMCheatSheetPage;
import React from "react";
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  Button,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  ShortText as SynopsisIcon,
  Public as WorldIcon,
  Timeline as TimelineIcon,
  MenuBook as WritingIcon,
  ChevronLeft as ChevronLeftIcon,
  ExitToApp as ExitIcon,
  Security as EnemyIcon,
  Groups as NPCIcon,
  PlayArrow as SessionIcon,
  DeveloperMode as DeveloperIcon,
  Inventory as ItemsIcon,
} from "@mui/icons-material";
import {
  QuestScrollIcon,
  DiceD20Icon,
  PartyIcon,
} from "../icons/TRPGIcons";
import { useRecoilState } from "recoil";
import {
  appModeState,
  AppMode,
  sidebarOpenState,
  currentCampaignState,
  developerModeState,
} from "../../store/atoms";

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const [appMode, setAppMode] = useRecoilState(appModeState);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const [, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [developerMode, setDeveloperMode] = useRecoilState(developerModeState);

  const handleModeChange = React.useCallback((mode: AppMode) => {
    // セッションモードの場合は専用ページに遷移
    if (mode === "session") {
      window.location.href = "/trpg-session";
      return;
    }

    // 同じモードが選択された場合は何もしない
    if (appMode === mode) {
      return;
    }

    // 編集中の場合はイベントを発火してモード変更を試みる
    const event = new CustomEvent("modeChangeAttempt", {
      detail: { mode },
      cancelable: true,
    });

    // イベントを発行して、編集中のページがキャンセルしたかどうかを確認
    const proceedWithChange = document.dispatchEvent(event);

    // イベントがキャンセルされなかった場合はモードを変更
    if (proceedWithChange) {
      setAppMode(mode);
      // モード変更時に創作メニューを閉じる（遅延実行で無限ループを防止）
      setTimeout(() => {
        setSidebarOpen(false);
        // 外部から提供されたonCloseが存在すれば実行
        if (onClose) {
          onClose();
        }
      }, 0);
    }
  }, [appMode, setAppMode, setSidebarOpen, onClose]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    // 外部から提供されたonCloseが存在すれば実行
    if (onClose) {
      onClose();
    }
  };

  // ホームに戻る処理
  const handleReturnToHome = () => {
    // 編集中の場合はイベントを発火して移動を試みる
    const event = new CustomEvent("modeChangeAttempt", {
      detail: { mode: "home" },
      cancelable: true,
    });

    // イベントを発行して、編集中のページがキャンセルしたかどうかを確認
    const proceedWithChange = document.dispatchEvent(event);

    // イベントがキャンセルされなかった場合はホームに戻る
    if (proceedWithChange) {
      // 現在のキャンペーンをクリア
      setCurrentCampaign(null);

      // ローカルストレージからcurrentCampaignIdを削除
      localStorage.removeItem("currentCampaignId");

      // ホーム画面に戻るためにURLを変更
      window.location.href = "/";
    }
  };

  // 開発者モードに応じて表示するメニューアイテムをフィルタリング
  const allMenuItems = [
    {
      mode: "synopsis" as AppMode,
      text: "キャンペーン背景",
      icon: <SynopsisIcon />,
      developerOnly: true,
    },
    {
      mode: "plot" as AppMode,
      text: "クエスト",
      icon: <QuestScrollIcon />,
      developerOnly: true,
    },
    {
      mode: "characters" as AppMode,
      text: "パーティー",
      icon: <PartyIcon />,
      developerOnly: false,
    },
    {
      mode: "enemy" as AppMode,
      text: "エネミー",
      icon: <EnemyIcon />,
      developerOnly: true,
    },
    {
      mode: "npc" as AppMode,
      text: "NPC",
      icon: <NPCIcon />,
      developerOnly: true,
    },
    {
      mode: "worldbuilding" as AppMode,
      text: "場所管理",
      icon: <WorldIcon />,
      developerOnly: true,
    },
    {
      mode: "items" as AppMode,
      text: "アイテム管理",
      icon: <ItemsIcon />,
      developerOnly: true,
    },
    {
      mode: "timeline" as AppMode,
      text: developerMode ? "キャンペーンのイベント管理" : "セッション履歴",
      icon: <TimelineIcon />,
      developerOnly: false,
    },
    {
      mode: "writing" as AppMode,
      text: "セッションノート",
      icon: <WritingIcon />,
      developerOnly: true,
    },
    {
      mode: "session" as AppMode,
      text: "TRPGセッション",
      icon: <SessionIcon />,
      developerOnly: false,
    },
  ];

  // 開発者モードでない場合は、開発者専用項目を除外
  const menuItems = developerMode
    ? allMenuItems
    : allMenuItems.filter((item) => !item.developerOnly);

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
        slotProps: {
          backdrop: {
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.2)",
            },
          },
        },
      }}
      sx={{
        width: 270,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 270,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.2s ease-in-out",
        },
      }}
    >
      {/* ヘッダー部分 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: 2,
          justifyContent: "space-between",
          backgroundColor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <DiceD20Icon sx={{ mr: 1 }} />
          <Typography variant="h6">キャンペーンメニュー</Typography>
        </Box>
        <IconButton onClick={toggleSidebar} color="inherit">
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />

      {/* メニューリスト */}
      <List sx={{ flexGrow: 1, overflow: "auto" }}>
        {menuItems.map((item) => (
          <ListItem key={item.mode}>
            <ListItemButton
              selected={appMode === item.mode}
              onClick={() => handleModeChange(item.mode)}
              sx={{
                px: 2,
                py: 1,
                minHeight: 48,
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: appMode === item.mode ? 600 : 400,
                  noWrap: false,
                  sx: {
                    wordBreak: "break-word",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* 開発者モード切り替え */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <FormControlLabel
          control={
            <Switch
              id="developer-toggle"
              checked={developerMode}
              onChange={(e) => setDeveloperMode(e.target.checked)}
              icon={<DeveloperIcon />}
              checkedIcon={<DeveloperIcon />}
              inputProps={{
                "aria-label": "developer mode toggle",
              } as React.InputHTMLAttributes<HTMLInputElement>}
              data-testid="developer-toggle"
            />
          }
          label={
            <Box>
              <Typography 
                variant="body2" 
                fontWeight="bold"
                sx={{
                  fontSize: "0.875rem",
                  lineHeight: 1.2,
                }}
              >
                開発者モード
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{
                  fontSize: "0.75rem",
                  lineHeight: 1.1,
                  display: "block",
                  wordBreak: "break-word",
                }}
              >
                キャンペーン設計機能を有効化
              </Typography>
            </Box>
          }
          labelPlacement="start"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            m: 0,
            width: "100%",
          }}
        />
      </Box>

      {/* 「ホームに戻る」ボタン */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          startIcon={<ExitIcon />}
          onClick={handleReturnToHome}
          sx={{ mb: 1 }}
        >
          ホームに戻る
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ 
            display: "block",
            fontSize: "0.7rem",
            lineHeight: 1.1,
            wordBreak: "break-word",
          }}
        >
          ※作業中のキャンペーンを閉じます
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

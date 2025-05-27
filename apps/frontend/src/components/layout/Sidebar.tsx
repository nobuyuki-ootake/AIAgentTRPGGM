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
} from "@mui/material";
import {
  ShortText as SynopsisIcon,
  List as PlotIcon,
  People as CharactersIcon,
  Public as WorldIcon,
  Timeline as TimelineIcon,
  MenuBook as WritingIcon,
  Feedback as FeedbackIcon,
  ChevronLeft as ChevronLeftIcon,
  ExitToApp as ExitIcon,
} from "@mui/icons-material";
import { useRecoilState } from "recoil";
import {
  appModeState,
  AppMode,
  sidebarOpenState,
  currentProjectState,
} from "../../store/atoms";

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const [appMode, setAppMode] = useRecoilState(appModeState);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);
  const [, setCurrentProject] = useRecoilState(currentProjectState);

  const handleModeChange = (mode: AppMode) => {
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
      // モード変更時に創作メニューを閉じる
      setSidebarOpen(false);
      // 外部から提供されたonCloseが存在すれば実行
      if (onClose) {
        onClose();
      }
    }
  };

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
      // 現在のプロジェクトをクリア
      setCurrentProject(null);

      // ローカルストレージからcurrentProjectIdを削除
      localStorage.removeItem("currentProjectId");

      // ホーム画面に戻るためにURLを変更
      window.location.href = "/";
    }
  };

  const menuItems = [
    { mode: "synopsis" as AppMode, text: "あらすじ", icon: <SynopsisIcon /> },
    { mode: "plot" as AppMode, text: "プロット", icon: <PlotIcon /> },
    {
      mode: "characters" as AppMode,
      text: "キャラクター",
      icon: <CharactersIcon />,
    },
    {
      mode: "worldbuilding" as AppMode,
      text: "世界観構築",
      icon: <WorldIcon />,
    },
    {
      mode: "timeline" as AppMode,
      text: "タイムライン",
      icon: <TimelineIcon />,
    },
    { mode: "writing" as AppMode, text: "本文執筆", icon: <WritingIcon /> },
    {
      mode: "feedback" as AppMode,
      text: "想定読者",
      icon: <FeedbackIcon />,
    },
  ];

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
        width: 240,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
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
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          創作メニュー
        </Typography>
        <IconButton onClick={toggleSidebar} color="inherit">
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />

      {/* メニューリスト */}
      <List sx={{ flexGrow: 1, overflow: "auto" }}>
        {menuItems.map((item) => (
          <ListItem key={item.mode} disablePadding>
            <ListItemButton
              selected={appMode === item.mode}
              onClick={() => handleModeChange(item.mode)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

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
          sx={{ display: "block" }}
        >
          ※作業中のプロジェクトを閉じます
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

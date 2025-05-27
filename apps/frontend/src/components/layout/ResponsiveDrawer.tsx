import React, { useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
  Fab,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

interface ResponsiveDrawerProps {
  children: React.ReactNode;
  width?: number;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  anchor?: "left" | "right";
  showToggleButton?: boolean;
  collapsible?: boolean;
}

const ResponsiveDrawer: React.FC<ResponsiveDrawerProps> = ({
  children,
  width = 300,
  open: controlledOpen,
  onToggle,
  anchor = "left",
  showToggleButton = true,
  collapsible = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [internalOpen, setInternalOpen] = useState(!isMobile);
  const [collapsed, setCollapsed] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const actualWidth = collapsed ? 64 : width;

  const handleToggle = () => {
    const newOpen = !isOpen;
    if (onToggle) {
      onToggle(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // モバイルでは常にtemporary、デスクトップではpersistent
  const drawerVariant = isMobile ? "temporary" : "persistent";

  const drawerContent = (
    <Box
      sx={{
        width: actualWidth,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      {/* ヘッダー部分 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1,
          minHeight: 64,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {!collapsed && <Box sx={{ flexGrow: 1 }} />}

        <Box sx={{ display: "flex", gap: 0.5 }}>
          {collapsible && !isMobile && (
            <Tooltip title={collapsed ? "展開" : "折りたたみ"}>
              <IconButton onClick={handleCollapse} size="small">
                {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Tooltip>
          )}

          {isMobile && (
            <IconButton onClick={handleToggle} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* コンテンツ部分 */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          p: collapsed ? 0.5 : 1,
        }}
      >
        <Box data-collapsed={collapsed}>{children}</Box>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant={drawerVariant}
        anchor={anchor}
        open={isOpen}
        onClose={handleToggle}
        sx={{
          width: isOpen ? actualWidth : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: actualWidth,
            boxSizing: "border-box",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            ...(drawerVariant === "persistent" && {
              position: "relative",
              height: "100%",
            }),
          },
        }}
        ModalProps={{
          keepMounted: true, // モバイルでのパフォーマンス向上
        }}
      >
        {drawerContent}
      </Drawer>

      {/* トグルボタン（モバイル用） */}
      {showToggleButton && isMobile && !isOpen && (
        <Fab
          color="primary"
          size="small"
          onClick={handleToggle}
          sx={{
            position: "fixed",
            bottom: 16,
            [anchor]: 16,
            zIndex: theme.zIndex.speedDial,
          }}
        >
          <MenuIcon />
        </Fab>
      )}

      {/* トグルボタン（デスクトップ用） */}
      {showToggleButton && !isMobile && !isOpen && (
        <IconButton
          onClick={handleToggle}
          sx={{
            position: "fixed",
            top: "50%",
            [anchor]: 0,
            transform: "translateY(-50%)",
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: anchor === "left" ? "0 50% 50% 0" : "50% 0 0 50%",
            "&:hover": {
              backgroundColor: "action.hover",
            },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
    </>
  );
};

export default ResponsiveDrawer;

import React from "react";
import { Box, Container, Fab, Tooltip } from "@mui/material";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentProjectState, sidebarOpenState } from "../../store/atoms";
import Sidebar from "./Sidebar";
import AIChatPanel from "../ai/AIChatPanel";
import MenuIcon from "@mui/icons-material/Menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const currentProject = useRecoilValue(currentProjectState);
  const [sidebarOpen, setSidebarOpen] = useRecoilState(sidebarOpenState);

  // プロジェクトが選択されていない場合はシンプルなレイアウトを表示
  if (!currentProject) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {children}
      </Container>
    );
  }

  // サイドバーの切り替え
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // プロジェクトが選択されている場合はサイドバー付きのレイアウトを表示
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "background.default",
        position: "relative",
      }}
    >
      {/* サイドバー - ドロワーをoverlayモードに変更 */}
      <Sidebar open={sidebarOpen} onClose={toggleSidebar} />

      {/* メインコンテンツエリア */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          height: "100vh",
          overflow: "auto",
          position: "relative",
          backgroundColor: "background.default",
        }}
      >
        {children}

        {/* フロート操作メニューボタン */}
        <Tooltip title="創作メニュー" placement="left">
          <Fab
            color="primary"
            aria-label="menu"
            onClick={toggleSidebar}
            sx={{
              position: "fixed",
              bottom: 24,
              left: 24,
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              opacity: sidebarOpen ? 0 : 1,
              visibility: sidebarOpen ? "hidden" : "visible",
              transition:
                "opacity 0.2s ease-in-out, visibility 0.2s ease-in-out",
              zIndex: 1000,
            }}
          >
            <MenuIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* AIChatPanel */}
      <AIChatPanel />
    </Box>
  );
};

export default AppLayout;

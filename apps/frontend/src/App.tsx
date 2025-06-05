import { RecoilRoot, useRecoilValue } from "recoil";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import SynopsisPage from "./pages/SynopsisPage";
import WritingPage from "./pages/WritingPage";
import HomePage from "./pages/HomePage";
import PlotPage from "./pages/PlotPage";
import QuestPage from "./pages/QuestPage";
import CharactersPage from "./pages/CharactersPage";
import WorldBuildingPage from "./pages/WorldBuildingPage";
import TimelinePage from "./pages/TimelinePage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import EnemyPage from "./pages/EnemyPage";
import NPCPage from "./pages/NPCPage";
import TRPGSessionPage from "./pages/TRPGSessionPage";
import { appModeState, currentCampaignState } from "./store/atoms";
import { Toaster } from "sonner";
import { WorldBuildingProvider } from "./contexts/WorldBuildingContext";
import CampaignDataInitializer from "./components/common/CampaignDataInitializer";

// メインコンテンツを表示するコンポーネント
const MainContent = () => {
  const appMode = useRecoilValue(appModeState);
  const currentCampaign = useRecoilValue(currentCampaignState);

  // デバッグ用に現在のモードとキャンペーンを表示
  console.log("MainContent rendering, appMode:", appMode);
  console.log("CurrentCampaign:", currentCampaign);

  // キャンペーンが選択されていない場合はホーム画面に戻す
  if (!currentCampaign) {
    return <HomePage />;
  }

  // アプリモードに応じたページを表示
  switch (appMode) {
    case "synopsis":
      return <SynopsisPage />;
    case "plot":
      return <QuestPage />;
    case "characters":
      return <CharactersPage />;
    case "worldbuilding":
      return <WorldBuildingPage />;
    case "timeline":
      return <TimelinePage />;
    case "writing":
      return <WritingPage />;
    case "enemy":
      return <EnemyPage />;
    case "npc":
      return <NPCPage />;
    case "session":
      return <TRPGSessionPage />;
    default:
      return <HomePage />;
  }
};

// Appコンポーネント
function App() {
  return (
    <RecoilRoot>
      <CampaignDataInitializer>
        <Router>
          <Toaster position="bottom-right" richColors />
          <WorldBuildingProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <AppLayout>
                    <MainContent />
                  </AppLayout>
                }
              />
              <Route path="/campaigns" element={<ProjectsPage />} />
              <Route path="/new" element={<NewProjectPage />} />
              <Route path="/worldbuilding" element={<WorldBuildingPage />} />
              <Route path="/enemy" element={<EnemyPage />} />
              <Route path="/npc" element={<NPCPage />} />
              <Route path="/session" element={
                <AppLayout>
                  <TRPGSessionPage />
                </AppLayout>
              } />
            </Routes>
          </WorldBuildingProvider>
        </Router>
      </CampaignDataInitializer>
    </RecoilRoot>
  );
}

export default App;

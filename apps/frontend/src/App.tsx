import { RecoilRoot, useRecoilValue } from "recoil";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import SynopsisPage from "./pages/SynopsisPage";
import GMCheatSheetPage from "./pages/GMCheatSheetPage";
import HomePage from "./pages/HomePage";
import QuestPage from "./pages/QuestPage";
import CharactersPage from "./pages/CharactersPage";
import PlaceManagementPage from "./pages/PlaceManagementPage";
import TimelinePage from "./pages/TimelinePage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import EnemyPage from "./pages/EnemyPage";
import NPCPage from "./pages/NPCPage";
import TRPGSessionPage from "./pages/TRPGSessionPage";
import ItemManagementPage from "./pages/ItemManagementPage";
import MinimalTRPGSessionTest from "./pages/MinimalTRPGSessionTest";
import { appModeState, currentCampaignState } from "./store/atoms";
import { Toaster } from "sonner";
// WorldBuildingProviderは削除済み
import CampaignDataInitializer from "./components/common/CampaignDataInitializer";

// メインコンテンツを表示するコンポーネント
const MainContent = () => {
  const appMode = useRecoilValue(appModeState);
  const currentCampaign = useRecoilValue(currentCampaignState);


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
      return <PlaceManagementPage />;
    case "timeline":
      return <TimelinePage />;
    case "writing":
      return <GMCheatSheetPage />;
    case "enemy":
      return <EnemyPage />;
    case "npc":
      return <NPCPage />;
    case "items":
      return <ItemManagementPage />;
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
              <Route path="/worldbuilding" element={<PlaceManagementPage />} />
              <Route path="/enemy" element={<EnemyPage />} />
              <Route path="/npc" element={<NPCPage />} />
              <Route path="/session" element={
                <AppLayout>
                  <TRPGSessionPage />
                </AppLayout>
              } />
              <Route path="/trpg-session" element={<TRPGSessionPage />} />
              <Route path="/test-dice" element={<MinimalTRPGSessionTest />} />
            </Routes>
        </Router>
      </CampaignDataInitializer>
    </RecoilRoot>
  );
}

export default App;

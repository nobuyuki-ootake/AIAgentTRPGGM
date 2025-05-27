import { RecoilRoot, useRecoilValue } from "recoil";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import SynopsisPage from "./pages/SynopsisPage";
import WritingPage from "./pages/WritingPage";
import HomePage from "./pages/HomePage";
import PlotPage from "./pages/PlotPage";
import CharactersPage from "./pages/CharactersPage";
import WorldBuildingPage from "./pages/WorldBuildingPage";
import TimelinePage from "./pages/TimelinePage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import { appModeState, currentProjectState } from "./store/atoms";
import { Toaster } from "sonner";
import { WorldBuildingProvider } from "./contexts/WorldBuildingContext";

// メインコンテンツを表示するコンポーネント
const MainContent = () => {
  const appMode = useRecoilValue(appModeState);
  const currentProject = useRecoilValue(currentProjectState);

  // デバッグ用に現在のモードとプロジェクトを表示
  console.log("MainContent rendering, appMode:", appMode);
  console.log("CurrentProject:", currentProject);

  // プロジェクトが選択されていない場合はホーム画面に戻す
  if (!currentProject) {
    return <HomePage />;
  }

  // アプリモードに応じたページを表示
  switch (appMode) {
    case "synopsis":
      return <SynopsisPage />;
    case "plot":
      return <PlotPage />;
    case "characters":
      return <CharactersPage />;
    case "worldbuilding":
      return <WorldBuildingPage />;
    case "timeline":
      return <TimelinePage />;
    case "writing":
      return <WritingPage />;
    default:
      return <HomePage />;
  }
};

// Appコンポーネント
function App() {
  return (
    <RecoilRoot>
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
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/new" element={<NewProjectPage />} />
            <Route path="/worldbuilding" element={<WorldBuildingPage />} />
          </Routes>
        </WorldBuildingProvider>
      </Router>
    </RecoilRoot>
  );
}

export default App;

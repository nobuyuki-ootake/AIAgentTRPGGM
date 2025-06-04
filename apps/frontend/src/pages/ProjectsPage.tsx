import { Container } from "@mui/material";
import { ProjectList } from "../features/projects/components/ProjectList";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import {
  currentProjectState,
  sidebarOpenState,
  chatPanelOpenState,
  appModeState,
} from "../store/atoms";
import { useEffect } from "react";
import { TRPGCampaign } from "@trpg-ai-gm/types";

const ProjectsPage = () => {
  // Convert to Campaign page for TRPG
  const navigate = useNavigate();
  const setCurrentProject = useSetRecoilState(currentProjectState);
  const setSidebarOpen = useSetRecoilState(sidebarOpenState);
  const setChatPanelOpen = useSetRecoilState(chatPanelOpenState);
  const setAppMode = useSetRecoilState(appModeState);

  // サイドバーとチャットパネルを表示しない
  useEffect(() => {
    console.log("CampaignsPage - サイドバーとチャットパネルを非表示にします");
    setSidebarOpen(false);
    setChatPanelOpen(false);
  }, [setSidebarOpen, setChatPanelOpen]);

  const handleProjectSelect = (projectId: string) => {
    console.log(
      "CampaignsPage - キャンペーン選択ハンドラが呼ばれました:",
      projectId
    );

    // ローカルストレージからキャンペーンを取得
    const projectsStr = localStorage.getItem("trpgCampaigns");
    console.log(
      "CampaignsPage - LocalStorageからデータ取得:",
      projectsStr ? "データあり" : "データなし"
    );

    if (projectsStr) {
      try {
        const projects = JSON.parse(projectsStr) as TRPGCampaign[];
        console.log(
          "CampaignsPage - パースしたキャンペーン数:",
          projects.length
        );

        const project = projects.find((p) => p.id === projectId);
        console.log(
          "CampaignsPage - 見つかったキャンペーン:",
          project ? project.title : "見つかりません"
        );

        if (project) {
          // Recoilステートに設定
          console.log(
            "CampaignsPage - Recoilステートにキャンペーン設定:",
            project.title
          );
          setCurrentProject(project);

          // アプリモードをシノプシスに設定
          console.log("CampaignsPage - アプリモードをsynopsisに設定");
          setAppMode("synopsis");

          // ローカルストレージにも現在のキャンペーンIDを保存
          console.log(
            "CampaignsPage - LocalStorageにcurrentCampaignId保存:",
            projectId
          );
          localStorage.setItem("currentCampaignId", projectId);

          // サイドバーとチャットパネルを表示する
          console.log("CampaignsPage - サイドバーとチャットパネルを表示");
          setSidebarOpen(true);
          setChatPanelOpen(true);

          // シノプシスページへナビゲート
          console.log("CampaignsPage - シノプシスページへナビゲート開始");
          navigate("/synopsis");
          console.log("CampaignsPage - ナビゲーション完了");
        } else {
          console.error(
            "CampaignsPage - キャンペーンが見つかりません:",
            projectId
          );
        }
      } catch (error) {
        console.error("CampaignsPage - キャンペーンの読み込みエラー:", error);
      }
    } else {
      console.error("CampaignsPage - trpgCampaignsがLocalStorageに存在しません");
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <ProjectList onProjectSelect={handleProjectSelect} />
    </Container>
  );
};

export default ProjectsPage;

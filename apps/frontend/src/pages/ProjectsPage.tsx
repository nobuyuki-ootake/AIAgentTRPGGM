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
import { NovelProject } from "@novel-ai-assistant/types";

const ProjectsPage = () => {
  const navigate = useNavigate();
  const setCurrentProject = useSetRecoilState(currentProjectState);
  const setSidebarOpen = useSetRecoilState(sidebarOpenState);
  const setChatPanelOpen = useSetRecoilState(chatPanelOpenState);
  const setAppMode = useSetRecoilState(appModeState);

  // サイドバーとチャットパネルを表示しない
  useEffect(() => {
    console.log("ProjectsPage - サイドバーとチャットパネルを非表示にします");
    setSidebarOpen(false);
    setChatPanelOpen(false);
  }, [setSidebarOpen, setChatPanelOpen]);

  const handleProjectSelect = (projectId: string) => {
    console.log(
      "ProjectsPage - プロジェクト選択ハンドラが呼ばれました:",
      projectId
    );

    // ローカルストレージからプロジェクトを取得
    const projectsStr = localStorage.getItem("novelProjects");
    console.log(
      "ProjectsPage - LocalStorageからデータ取得:",
      projectsStr ? "データあり" : "データなし"
    );

    if (projectsStr) {
      try {
        const projects = JSON.parse(projectsStr) as NovelProject[];
        console.log(
          "ProjectsPage - パースしたプロジェクト数:",
          projects.length
        );

        const project = projects.find((p) => p.id === projectId);
        console.log(
          "ProjectsPage - 見つかったプロジェクト:",
          project ? project.title : "見つかりません"
        );

        if (project) {
          // Recoilステートに設定
          console.log(
            "ProjectsPage - Recoilステートにプロジェクト設定:",
            project.title
          );
          setCurrentProject(project);

          // アプリモードをシノプシスに設定
          console.log("ProjectsPage - アプリモードをsynopsisに設定");
          setAppMode("synopsis");

          // ローカルストレージにも現在のプロジェクトIDを保存
          console.log(
            "ProjectsPage - LocalStorageにcurrentProjectId保存:",
            projectId
          );
          localStorage.setItem("currentProjectId", projectId);

          // サイドバーとチャットパネルを表示する
          console.log("ProjectsPage - サイドバーとチャットパネルを表示");
          setSidebarOpen(true);
          setChatPanelOpen(true);

          // シノプシスページへナビゲート
          console.log("ProjectsPage - シノプシスページへナビゲート開始");
          navigate("/synopsis");
          console.log("ProjectsPage - ナビゲーション完了");
        } else {
          console.error(
            "ProjectsPage - プロジェクトが見つかりません:",
            projectId
          );
        }
      } catch (error) {
        console.error("ProjectsPage - プロジェクトの読み込みエラー:", error);
      }
    } else {
      console.error("ProjectsPage - novelProjectsがLocalStorageに存在しません");
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <ProjectList onProjectSelect={handleProjectSelect} />
    </Container>
  );
};

export default ProjectsPage;

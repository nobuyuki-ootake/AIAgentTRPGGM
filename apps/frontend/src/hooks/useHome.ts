import { useState, useEffect, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { currentProjectState } from "../store/atoms";
import { NovelProject } from "@novel-ai-assistant/types";
// import { LocalStorageManager } from "../utils/localStorage"; // 未使用のためコメントアウト

export function useHome() {
  const [projects, setProjects] = useState<NovelProject[]>([]);
  const currentProject = useRecoilValue(currentProjectState);
  const [, setCurrentProjectStateSetter] = useRecoilState(currentProjectState);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // ローカルストレージからプロジェクト一覧を取得
  useEffect(() => {
    const savedProjects = localStorage.getItem("novelProjects");
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // プロジェクト一覧を保存
  const saveProjects = (updatedProjects: NovelProject[]) => {
    localStorage.setItem("novelProjects", JSON.stringify(updatedProjects));
    setProjects(updatedProjects);
  };

  // 新規プロジェクト作成ダイアログを開く
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  // 新規プロジェクト作成ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNewProjectTitle("");
  };

  // 新規プロジェクト作成
  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) return;

    const newProject: NovelProject = {
      id: uuidv4(),
      title: newProjectTitle.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      synopsis: "",
      plot: [],
      characters: [],
      worldBuilding: {
        id: uuidv4(),
        setting: [],
        rules: [],
        places: [],
        cultures: [],
        historyLegend: [],
        geographyEnvironment: [],
        magicTechnology: [],
        freeFields: [],
        stateDefinition: [],
        worldmaps: [],
      },
      timeline: [],
      chapters: [],
      feedback: [],
    };

    const updatedProjects = [...projects, newProject];
    saveProjects(updatedProjects);

    // 新規プロジェクトを選択
    setCurrentProjectStateSetter(newProject);
    localStorage.setItem("currentProjectId", newProject.id);

    handleCloseDialog();
  };

  // プロジェクト選択
  const handleSelectProject = (project: NovelProject) => {
    setCurrentProjectStateSetter(project);
    localStorage.setItem("currentProjectId", project.id);
  };

  // 削除確認ダイアログを開く
  const handleOpenDeleteDialog = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  // 削除確認ダイアログを閉じる
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  // プロジェクト削除
  const handleDeleteProject = () => {
    if (!projectToDelete) return;

    const updatedProjects = projects.filter(
      (project) => project.id !== projectToDelete
    );
    saveProjects(updatedProjects);
    handleCloseDeleteDialog();
  };

  // 現在のプロジェクトデータをlocalStorageに保存する関数
  const updateAndSaveCurrentProject = useCallback(
    (projectToSave: NovelProject | null) => {
      if (!projectToSave) return;

      const savedProjectsString = localStorage.getItem("novelProjects");
      let projectsToUpdate: NovelProject[] = [];
      if (savedProjectsString) {
        projectsToUpdate = JSON.parse(savedProjectsString);
      }

      const projectIndex = projectsToUpdate.findIndex(
        (p) => p.id === projectToSave.id
      );

      if (projectIndex !== -1) {
        projectsToUpdate[projectIndex] = projectToSave;
      } else {
        // もしプロジェクトリストに存在しない場合（通常はありえないが念のため）、新しいプロジェクトとして追加
        projectsToUpdate.push(projectToSave);
      }

      localStorage.setItem("novelProjects", JSON.stringify(projectsToUpdate));
      setProjects(projectsToUpdate); // ローカルのprojectsステートも更新
      console.log(
        "[DEBUG] Project saved to localStorage:",
        projectToSave.title
      );
    },
    [] // 依存配列は空でOK (localStorage と projects ステートの更新のみのため)
  );

  return {
    projects,
    currentProject,
    newProjectTitle,
    setNewProjectTitle,
    dialogOpen,
    deleteDialogOpen,
    handleOpenDialog,
    handleCloseDialog,
    handleCreateProject,
    handleSelectProject,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteProject,
    updateAndSaveCurrentProject,
  };
}

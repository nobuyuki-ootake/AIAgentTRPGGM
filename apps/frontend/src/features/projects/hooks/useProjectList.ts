import { useState, useEffect } from "react";
import { LocalStorageManager } from "../../../utils/localStorage";

interface ProjectListItem {
  id: string;
  title: string;
  updatedAt: string;
}

export const useProjectList = () => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = () => {
    try {
      setLoading(true);
      setError(null);

      const projectList = LocalStorageManager.getProjectList();

      // 更新日時でプロジェクトを降順ソート
      projectList.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setProjects(projectList);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "プロジェクト一覧の取得中にエラーが発生しました"
      );
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントのマウント時にプロジェクト一覧を読み込む
  useEffect(() => {
    loadProjects();
  }, []);

  // プロジェクトの削除処理
  const deleteProject = (projectId: string): boolean => {
    try {
      const success = LocalStorageManager.deleteProject(projectId);
      if (success) {
        setProjects((prevProjects) =>
          prevProjects.filter((project) => project.id !== projectId)
        );
      }
      return success;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "プロジェクトの削除中にエラーが発生しました"
      );
      return false;
    }
  };

  return {
    projects,
    loading,
    error,
    loadProjects,
    deleteProject,
  };
};

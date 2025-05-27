import { useRecoilState } from "recoil";
import { currentProjectState } from "../store/atoms";
import { NovelProject } from "@novel-ai-assistant/types";

/**
 * 現在のプロジェクトを取得・更新するためのカスタムフック
 */
export function useCurrentProject() {
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  /**
   * プロジェクト全体を更新
   */
  const updateProject = (newProject: NovelProject | null) => {
    setCurrentProject(newProject);
    return newProject;
  };

  /**
   * プロジェクトの部分的な更新
   */
  const updateProjectPartial = (partialProject: Partial<NovelProject>) => {
    if (!currentProject) return null;

    const updatedProject = {
      ...currentProject,
      ...partialProject,
    };

    setCurrentProject(updatedProject);
    return updatedProject;
  };

  return {
    currentProject,
    updateProject,
    updateProjectPartial,
  };
}

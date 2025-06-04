import { useRecoilState } from "recoil";
import { currentProjectState } from "../store/atoms";
import { TRPGCampaign } from "@trpg-ai-gm/types";

/**
 * 現在のキャンペーンを取得・更新するためのカスタムフック
 */
export function useCurrentProject() {
  const [currentProject, setCurrentProject] =
    useRecoilState(currentProjectState);

  /**
   * キャンペーン全体を更新
   */
  const updateProject = (newProject: TRPGCampaign | null) => {
    setCurrentProject(newProject);
    return newProject;
  };

  /**
   * キャンペーンの部分的な更新
   */
  const updateProjectPartial = (partialProject: Partial<TRPGCampaign>) => {
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

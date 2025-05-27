import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { LocalStorageManager } from "../../../utils/localStorage";
import {
  NovelProject as Project,
  ProjectStatus,
} from "@novel-ai-assistant/types";
import { Descendant } from "slate";

interface CreateProjectOptions {
  name: string;
  description?: string;
  genre?: string[];
  tags?: string[];
}

export const useCreateProject = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = async (
    options: CreateProjectOptions
  ): Promise<Project | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const now = new Date().toISOString();
      const projectId = uuidv4();

      // 新しいプロジェクトの基本構造を作成
      const newProject: Project = {
        id: projectId,
        title: options.name,
        synopsis: options.description || "",
        createdAt: new Date(),
        updatedAt: new Date(),
        characters: [],
        worldBuilding: {
          id: uuidv4(),
          setting: "",
          worldmaps: [],
          settings: [],
          rules: [],
          places: [],
          cultures: [],
          geographyEnvironment: [],
          historyLegend: [],
          magicTechnology: [],
          stateDefinition: [],
          freeFields: [],
          timelineSettings: {
            startDate: now.split("T")[0],
          },
        },
        timeline: [],
        plot: [],
        chapters: [
          {
            id: uuidv4(),
            title: "第一章",
            synopsis: "",
            content: [] as Descendant[],
            order: 1,
            scenes: [],
            status: "draft",
          },
        ],
        feedback: [],
        definedCharacterStatuses: [],
        metadata: {
          version: "1.0.0",
          status: "active" as ProjectStatus,
          genre: options.genre || [],
          tags: options.tags || [],
          targetAudience: "",
          wordCountGoal: 0,
          lastBackupDate: undefined,
        },
        notes: [],
      };

      // ローカルストレージに保存
      const success = LocalStorageManager.saveProject(newProject);

      if (!success) {
        throw new Error("プロジェクトの保存に失敗しました");
      }

      return newProject;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "プロジェクト作成中にエラーが発生しました"
      );
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createProject,
    isCreating,
    error,
  };
};

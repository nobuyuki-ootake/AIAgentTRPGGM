import { useState } from "react";
import { NovelProject } from "@novel-ai-assistant/types";
import { LocalStorageManager } from "../../../utils/localStorage";
import { ExportUtil } from "../../../utils/exportUtil";

type ExportFormat = "json" | "text" | "stats";

export const useProjectExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  /**
   * プロジェクトをエクスポートする
   * @param projectId エクスポートするプロジェクトID
   * @param format エクスポート形式
   * @returns 成功したかどうか
   */
  const exportProject = async (
    projectId: string,
    format: ExportFormat = "json"
  ): Promise<boolean> => {
    try {
      setIsExporting(true);
      setError(null);
      setSuccess(false);

      // プロジェクトを取得
      const project = LocalStorageManager.loadProject(projectId);
      if (!project) {
        throw new Error("プロジェクトが見つかりません");
      }

      // 選択された形式でエクスポート
      let result = false;
      switch (format) {
        case "json":
          result = ExportUtil.exportProjectAsJson(
            project as unknown as NovelProject
          );
          break;
        case "text":
          result = ExportUtil.exportNovelText(
            project as unknown as NovelProject
          );
          break;
        case "stats":
          result = ExportUtil.exportProjectStats(
            project as unknown as NovelProject
          );
          break;
        default:
          throw new Error("サポートされていないエクスポート形式です");
      }

      setSuccess(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "エクスポート中にエラーが発生しました";
      setError(errorMessage);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * プロジェクトを取得せずに直接エクスポートする
   * @param project エクスポートするプロジェクトオブジェクト
   * @param format エクスポート形式
   * @returns 成功したかどうか
   */
  const exportProjectDirect = async (
    project: NovelProject,
    format: ExportFormat = "json"
  ): Promise<boolean> => {
    try {
      setIsExporting(true);
      setError(null);
      setSuccess(false);

      // 選択された形式でエクスポート
      let result = false;
      switch (format) {
        case "json":
          result = ExportUtil.exportProjectAsJson(project);
          break;
        case "text":
          result = ExportUtil.exportNovelText(project);
          break;
        case "stats":
          result = ExportUtil.exportProjectStats(project);
          break;
        default:
          throw new Error("サポートされていないエクスポート形式です");
      }

      setSuccess(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "エクスポート中にエラーが発生しました";
      setError(errorMessage);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportProject,
    exportProjectDirect,
    isExporting,
    error,
    success,
  };
};

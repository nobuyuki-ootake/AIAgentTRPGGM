import { useState } from "react";
import { ImportUtil, ValidationError } from "../../../utils/importUtil";
import { NovelProject } from "@novel-ai-assistant/types";

interface ImportResult {
  success: boolean;
  projectId?: string;
  errors: ValidationError[];
}

export const useProjectImport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [importedProject, setImportedProject] = useState<NovelProject | null>(
    null
  );

  /**
   * ファイルからプロジェクトをインポートする
   * @param file インポートするファイル
   * @param saveToStorage ローカルストレージに保存するかどうか
   * @param overwriteIfExists 同じIDのプロジェクトが存在する場合に上書きするかどうか
   * @returns インポート結果
   */
  const importProject = async (
    file: File,
    saveToStorage: boolean = true,
    overwriteIfExists: boolean = false
  ): Promise<ImportResult> => {
    try {
      setIsImporting(true);
      setValidationErrors([]);
      setImportedProject(null);

      // ファイルからプロジェクトをインポート
      const { project, errors } = await ImportUtil.importProjectFromFile(file);

      if (errors.length > 0 || !project) {
        setValidationErrors(errors);
        return { success: false, errors };
      }

      setImportedProject(project);

      // ローカルストレージに保存する場合
      if (saveToStorage) {
        const projectId = ImportUtil.saveImportedProject(
          project,
          overwriteIfExists
        );

        if (!projectId) {
          return {
            success: false,
            errors: [
              { field: "storage", message: "プロジェクトの保存に失敗しました" },
            ],
          };
        }

        return { success: true, projectId, errors: [] };
      }

      return { success: true, projectId: project.id, errors: [] };
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "インポート中にエラーが発生しました";
      const errors = [{ field: "import", message: errorMessage }];
      setValidationErrors(errors);
      return { success: false, errors };
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * バリデーションエラーをクリアする
   */
  const clearErrors = () => {
    setValidationErrors([]);
  };

  return {
    importProject,
    clearErrors,
    isImporting,
    validationErrors,
    importedProject,
  };
};

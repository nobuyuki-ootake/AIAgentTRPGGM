import { NovelProject } from "@novel-ai-assistant/types";
import { LocalStorageManager } from "./localStorage";

/**
 * プロジェクトのバリデーションエラー
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * プロジェクトインポート用のユーティリティクラス
 */
export class ImportUtil {
  /**
   * ファイルからプロジェクトをインポートする
   * @param file インポートするJSONファイル
   * @returns 成功時はプロジェクト、失敗時はエラーメッセージ
   */
  static async importProjectFromFile(
    file: File
  ): Promise<{ project: NovelProject | null; errors: ValidationError[] }> {
    try {
      // ファイルがJSONかどうかをチェック
      if (!file.type.includes("json") && !file.name.endsWith(".json")) {
        return {
          project: null,
          errors: [
            {
              field: "file",
              message: "JSONファイル形式のみサポートしています",
            },
          ],
        };
      }

      // ファイルを読み込む
      const content = await this.readFileAsText(file);

      // JSONをパース
      const projectData = JSON.parse(content);

      // バリデーション
      const validationResult = this.validateProject(projectData);

      if (validationResult.errors.length > 0) {
        return validationResult;
      }

      return { project: projectData as NovelProject, errors: [] };
    } catch (error) {
      let errorMessage = "プロジェクトのインポートに失敗しました";

      if (error instanceof SyntaxError) {
        errorMessage = "JSONの解析に失敗しました: 無効なフォーマット";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        project: null,
        errors: [{ field: "file", message: errorMessage }],
      };
    }
  }

  /**
   * プロジェクトをローカルストレージに保存する
   * @param project 保存するプロジェクト
   * @param overwriteIfExists 同じIDのプロジェクトが存在する場合に上書きするかどうか
   * @returns 成功時はプロジェクトID、失敗時はnull
   */
  static saveImportedProject(
    project: NovelProject,
    overwriteIfExists: boolean = false
  ): string | null {
    try {
      // 同じIDのプロジェクトが存在するかチェック
      const existingProject = LocalStorageManager.loadProject(project.id);

      if (existingProject && !overwriteIfExists) {
        // IDの衝突があり、上書きが許可されていない場合
        throw new Error("同じIDを持つプロジェクトが既に存在します");
      }

      // プロジェクトを保存
      const success = LocalStorageManager.saveProject(project);

      if (!success) {
        throw new Error("プロジェクトの保存に失敗しました");
      }

      return project.id;
    } catch (error) {
      console.error("インポートしたプロジェクトの保存に失敗しました:", error);
      return null;
    }
  }

  /**
   * ファイルをテキストとして読み込む
   * @param file 読み込むファイル
   * @returns ファイルの内容
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          resolve(event.target.result);
        } else {
          reject(new Error("ファイルの読み込みに失敗しました"));
        }
      };

      reader.onerror = () => {
        reject(new Error("ファイルの読み込み中にエラーが発生しました"));
      };

      reader.readAsText(file);
    });
  }

  /**
   * プロジェクトデータが有効かどうかを検証する
   * @param data 検証するデータ
   * @returns バリデーション結果
   */
  private static validateProject(data: Record<string, unknown>): {
    project: NovelProject | null;
    errors: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    // 必須フィールドのチェック
    const requiredFields = [
      "id",
      "name",
      "createdAt",
      "updatedAt",
      "characters",
      "worldBuilding",
      "timeline",
      "chapters",
      "metadata",
    ];

    for (const field of requiredFields) {
      if (data[field] === undefined) {
        errors.push({
          field,
          message: `必須フィールド "${field}" がありません`,
        });
      }
    }

    if (errors.length > 0) {
      return { project: null, errors };
    }

    // メタデータのチェック
    if (data.metadata && typeof data.metadata === "object") {
      const metadata = data.metadata as Record<string, unknown>;
      if (!metadata.version) {
        errors.push({
          field: "metadata.version",
          message: "バージョン情報がありません",
        });
      }

      if (!metadata.status) {
        errors.push({
          field: "metadata.status",
          message: "プロジェクトのステータスがありません",
        });
      }
    }

    // タイムラインのチェック
    if (Array.isArray(data.timeline)) {
      (data.timeline as Array<Record<string, unknown>>).forEach(
        (event, index) => {
          if (!event.id) {
            errors.push({
              field: `timeline[${index}].id`,
              message: "タイムラインイベントにIDがありません",
            });
          }
          if (!event.title) {
            errors.push({
              field: `timeline[${index}].title`,
              message: "タイムラインイベントにタイトルがありません",
            });
          }
        }
      );
    }

    // 章のチェック
    if (Array.isArray(data.chapters)) {
      (data.chapters as Array<Record<string, unknown>>).forEach(
        (chapter, index) => {
          if (!chapter.id) {
            errors.push({
              field: `chapters[${index}].id`,
              message: "章にIDがありません",
            });
          }
          if (!chapter.title) {
            errors.push({
              field: `chapters[${index}].title`,
              message: "章にタイトルがありません",
            });
          }
          if (typeof chapter.order !== "number") {
            errors.push({
              field: `chapters[${index}].order`,
              message: "章の順序が数値ではありません",
            });
          }
        }
      );
    }

    if (errors.length > 0) {
      return { project: null, errors };
    }

    // JSONファイルのバリデーション（簡易的）
    // ここで zod などを使った詳細なバリデーションを行うのが望ましい
    if (typeof data !== "object" || data === null || !data.id || !data.title) {
      return {
        project: null,
        errors: [
          { field: "file", message: "無効なプロジェクトファイル形式です。" },
        ],
      };
    }

    // NovelProject型にキャスト（より厳密な型チェックが推奨される）
    return { project: data as unknown as NovelProject, errors: [] };
  }
}

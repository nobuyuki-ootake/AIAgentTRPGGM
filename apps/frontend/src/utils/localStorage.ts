import { NovelProject } from "@novel-ai-assistant/types";

/**
 * ローカルストレージを操作するためのクラス
 */
export class LocalStorageManager {
  private static readonly PROJECT_KEY_PREFIX = "novel_project_";
  private static readonly PROJECT_LIST_KEY = "novel_project_list";

  /**
   * プロジェクトをローカルストレージに保存する
   * @param project 保存するプロジェクト
   * @returns 成功したかどうか
   */
  static saveProject(project: NovelProject): boolean {
    try {
      // プロジェクトデータをJSON文字列に変換して保存
      const projectJson = JSON.stringify(project);
      localStorage.setItem(
        `${this.PROJECT_KEY_PREFIX}${project.id}`,
        projectJson
      );

      // プロジェクトリストを更新
      this.addProjectToList(project);

      return true;
    } catch (error) {
      console.error("プロジェクトの保存に失敗しました:", error);
      return false;
    }
  }

  /**
   * プロジェクトをローカルストレージから読み込む
   * @param projectId プロジェクトID
   * @returns プロジェクトデータ、存在しない場合はnull
   */
  static loadProject(projectId: string): NovelProject | null {
    try {
      const projectJson = localStorage.getItem(
        `${this.PROJECT_KEY_PREFIX}${projectId}`
      );
      if (!projectJson) return null;

      return JSON.parse(projectJson) as NovelProject;
    } catch (error) {
      console.error("プロジェクトの読み込みに失敗しました:", error);
      return null;
    }
  }

  /**
   * プロジェクトをローカルストレージから削除する
   * @param projectId プロジェクトID
   * @returns 成功したかどうか
   */
  static deleteProject(projectId: string): boolean {
    try {
      // プロジェクトデータを削除
      localStorage.removeItem(`${this.PROJECT_KEY_PREFIX}${projectId}`);

      // プロジェクトリストから削除
      this.removeProjectFromList(projectId);

      return true;
    } catch (error) {
      console.error("プロジェクトの削除に失敗しました:", error);
      return false;
    }
  }

  /**
   * 保存されているすべてのプロジェクトのメタデータのリストを取得する
   * @returns プロジェクトメタデータのリスト
   */
  static getProjectList(): Array<{
    id: string;
    title: string;
    updatedAt: string;
  }> {
    try {
      const listJson = localStorage.getItem(this.PROJECT_LIST_KEY);
      if (!listJson) return [];

      return JSON.parse(listJson) as Array<{
        id: string;
        title: string;
        updatedAt: string;
      }>;
    } catch (error) {
      console.error("プロジェクトリストの取得に失敗しました:", error);
      return [];
    }
  }

  /**
   * プロジェクトリストにプロジェクトを追加または更新します。
   * @param project 保存するプロジェクトデータ
   */
  private static addProjectToList(project: NovelProject): void {
    const projects = this.getProjectList();
    const index = projects.findIndex((p) => p.id === project.id);

    // 既存のプロジェクトの場合は更新
    if (index >= 0) {
      projects[index] = {
        id: project.id,
        title: project.title,
        updatedAt: project.updatedAt.toISOString(),
      };
    } else {
      // 新規プロジェクトの場合は追加
      projects.push({
        id: project.id,
        title: project.title,
        updatedAt: project.updatedAt.toISOString(),
      });
    }

    // リストを保存
    localStorage.setItem(this.PROJECT_LIST_KEY, JSON.stringify(projects));
  }

  /**
   * プロジェクトリストからプロジェクトを削除する
   * @param projectId 削除するプロジェクトID
   */
  private static removeProjectFromList(projectId: string): void {
    let projectList = this.getProjectList();

    // 指定されたIDのプロジェクトを除外
    projectList = projectList.filter((p) => p.id !== projectId);

    // リストを保存
    localStorage.setItem(this.PROJECT_LIST_KEY, JSON.stringify(projectList));
  }

  /**
   * ローカルストレージの使用量を確認する（バイト数）
   * @returns 使用量（バイト数）
   */
  static getStorageUsage(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || "";
        total += key.length + value.length;
      }
    }
    return total * 2; // UTF-16エンコーディングで1文字2バイト
  }

  /**
   * ローカルストレージの残り容量を確認する（おおよその値）
   * @returns 残り容量（バイト数）、ブラウザによって異なる場合もある
   */
  static getRemainingStorage(): number {
    try {
      const testKey = "__storage_test__";
      const oneKB = "A".repeat(1024); // 1KBのデータ
      let i = 0;

      // 試験的にデータを追加して容量を確認
      while (true) {
        localStorage.setItem(testKey + i, oneKB);
        i++;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // エラーは想定内なので処理しない
      const usedSpace = this.getStorageUsage();

      // テストデータをクリーンアップ
      for (let j = 0; j < localStorage.length; j++) {
        const key = localStorage.key(j);
        if (key && key.startsWith("__storage_test__")) {
          localStorage.removeItem(key);
        }
      }

      // 一般的なブラウザの上限は5MBだが、変動する可能性がある
      const estimatedTotal = 5 * 1024 * 1024;
      return Math.max(0, estimatedTotal - usedSpace);
    }

    return 0; // ここには到達しないはず
  }
}

import { TRPGCampaign } from "@trpg-ai-gm/types";

/**
 * ローカルストレージを操作するためのクラス
 */
export class LocalStorageManager {
  private static readonly PROJECT_KEY_PREFIX = "trpg_campaign_";
  private static readonly PROJECT_LIST_KEY = "trpg_campaign_list";

  /**
   * キャンペーンをローカルストレージに保存する
   * @param campaign 保存するキャンペーン
   * @returns 成功したかどうか
   */
  static saveProject(campaign: TRPGCampaign): boolean {
    try {
      // キャンペーンデータをJSON文字列に変換して保存
      const campaignJson = JSON.stringify(campaign);
      localStorage.setItem(
        `${this.PROJECT_KEY_PREFIX}${campaign.id}`,
        campaignJson
      );

      // キャンペーンリストを更新
      this.addProjectToList(campaign);

      return true;
    } catch (error) {
      console.error("キャンペーンの保存に失敗しました:", error);
      return false;
    }
  }

  /**
   * キャンペーンをローカルストレージから読み込む
   * @param campaignId キャンペーンID
   * @returns キャンペーンデータ、存在しない場合はnull
   */
  static loadProject(campaignId: string): TRPGCampaign | null {
    try {
      let campaignJson = localStorage.getItem(
        `${this.PROJECT_KEY_PREFIX}${campaignId}`
      );
      
      
      if (!campaignJson) return null;

      return JSON.parse(campaignJson) as TRPGCampaign;
    } catch (error) {
      console.error("キャンペーンの読み込みに失敗しました:", error);
      return null;
    }
  }

  /**
   * キャンペーンをローカルストレージから削除する
   * @param campaignId キャンペーンID
   * @returns 成功したかどうか
   */
  static deleteProject(campaignId: string): boolean {
    try {
      // キャンペーンデータを削除
      localStorage.removeItem(`${this.PROJECT_KEY_PREFIX}${campaignId}`);

      // キャンペーンリストから削除
      this.removeProjectFromList(campaignId);

      return true;
    } catch (error) {
      console.error("キャンペーンの削除に失敗しました:", error);
      return false;
    }
  }

  /**
   * 保存されているすべてのキャンペーンのメタデータのリストを取得する
   * @returns キャンペーンメタデータのリスト
   */
  static getProjectList(): Array<{
    id: string;
    title: string;
    updatedAt: string;
  }> {
    try {
      let listJson = localStorage.getItem(this.PROJECT_LIST_KEY);
      
      
      if (!listJson) return [];

      return JSON.parse(listJson) as Array<{
        id: string;
        title: string;
        updatedAt: string;
      }>;
    } catch (error) {
      console.error("キャンペーンリストの取得に失敗しました:", error);
      return [];
    }
  }

  /**
   * キャンペーンリストにキャンペーンを追加または更新します。
   * @param campaign 保存するキャンペーンデータ
   */
  private static addProjectToList(campaign: TRPGCampaign): void {
    const campaigns = this.getProjectList();
    const index = campaigns.findIndex((c) => c.id === campaign.id);

    // 既存のキャンペーンの場合は更新
    if (index >= 0) {
      campaigns[index] = {
        id: campaign.id,
        title: campaign.title,
        updatedAt: campaign.updatedAt.toISOString(),
      };
    } else {
      // 新規キャンペーンの場合は追加
      campaigns.push({
        id: campaign.id,
        title: campaign.title,
        updatedAt: campaign.updatedAt.toISOString(),
      });
    }

    // リストを保存
    localStorage.setItem(this.PROJECT_LIST_KEY, JSON.stringify(campaigns));
  }

  /**
   * キャンペーンリストからキャンペーンを削除する
   * @param campaignId 削除するキャンペーンID
   */
  private static removeProjectFromList(campaignId: string): void {
    let campaignList = this.getProjectList();

    // 指定されたIDのキャンペーンを除外
    campaignList = campaignList.filter((c) => c.id !== campaignId);

    // リストを保存
    localStorage.setItem(this.PROJECT_LIST_KEY, JSON.stringify(campaignList));
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

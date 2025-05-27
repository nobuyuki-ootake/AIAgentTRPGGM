import {
  NovelProject as Project,
  Chapter,
  Section,
} from "@novel-ai-assistant/types";

/**
 * プロジェクトエクスポート用のユーティリティクラス
 */
export class ExportUtil {
  /**
   * プロジェクトをJSONファイルとしてエクスポートする
   * @param project エクスポートするプロジェクト
   * @returns エクスポートが成功したかどうか
   */
  static exportProjectAsJson(project: Project): boolean {
    try {
      // プロジェクトデータをJSON文字列に変換
      const json = JSON.stringify(project, null, 2);
      const blob = new Blob([json], { type: "application/json" });

      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // ファイル名をプロジェクト名と日付で生成
      link.download = `${project.title.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.json`;

      // ダウンロードを開始
      document.body.appendChild(link);
      link.click();

      // クリーンアップ
      URL.revokeObjectURL(url);
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error("JSONエクスポートに失敗しました:", error);
      return false;
    }
  }

  /**
   * プロジェクトの統計情報をエクスポートする
   * @param project エクスポートするプロジェクト
   * @returns エクスポートが成功したかどうか
   */
  static exportProjectStats(project: Project): boolean {
    try {
      // プロジェクトの統計情報を生成
      const statsText = this.generateProjectStats(project);

      // テキストファイルとしてBlobオブジェクトを作成
      const blob = new Blob([statsText], {
        type: "text/plain;charset=utf-8",
      });

      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.title.replace(/\s+/g, "_")}_stats_${
        new Date().toISOString().split("T")[0]
      }.txt`;

      // ダウンロードを開始
      document.body.appendChild(link);
      link.click();

      // クリーンアップ
      URL.revokeObjectURL(url);
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error("統計情報のエクスポートに失敗しました:", error);
      return false;
    }
  }

  /**
   * プロジェクトを小説テキストとしてエクスポートする
   * @param project エクスポートするプロジェクト
   * @returns エクスポートが成功したかどうか
   */
  static exportNovelText(project: Project): boolean {
    try {
      // 章ごとのテキストを結合
      let novelText = `# ${project.title}\n\n`;

      if (project.synopsis) {
        novelText += `${project.synopsis}\n\n`;
      }

      // 各章のテキストを追加
      project.chapters
        .sort((a: Chapter, b: Chapter) => {
          const aOrder = typeof a.order === "number" ? a.order : 0;
          const bOrder = typeof b.order === "number" ? b.order : 0;
          return aOrder - bOrder;
        })
        .forEach((chapter: Chapter) => {
          novelText += `## ${chapter.title}\n\n${chapter.content || ""}\n\n`;

          // セクションがあれば追加
          const sections = (chapter as any).sections as Section[];
          if (sections && Array.isArray(sections) && sections.length > 0) {
            sections
              .sort((a: Section, b: Section) => {
                const aOrder = typeof a.order === "number" ? a.order : 0;
                const bOrder = typeof b.order === "number" ? b.order : 0;
                return aOrder - bOrder;
              })
              .forEach((section: Section) => {
                novelText += `### ${section.title}\n\n${
                  section.content || ""
                }\n\n`;
              });
          }
        });

      // テキストファイルとしてBlobオブジェクトを作成
      const blob = new Blob([novelText], { type: "text/plain;charset=utf-8" });

      // ダウンロードリンクを作成
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.title.replace(/\s+/g, "_")}_text_${
        new Date().toISOString().split("T")[0]
      }.txt`;

      // ダウンロードを開始
      document.body.appendChild(link);
      link.click();

      // クリーンアップ
      URL.revokeObjectURL(url);
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error("小説テキストのエクスポートに失敗しました:", error);
      return false;
    }
  }

  /**
   * プロジェクトの統計情報を生成する
   * @param project 統計を生成するプロジェクト
   * @returns 統計情報のテキスト
   */
  private static generateProjectStats(project: Project): string {
    // 文字数と単語数を計算
    let totalCharCount = 0;
    let totalWordCount = 0;

    // チャプターごとに文字数をカウント
    project.chapters.forEach((chapter: Chapter) => {
      const chapterContent = chapter.content || "";
      totalCharCount += chapterContent.toString().length;

      // 単語数をカウント（簡易的な実装）
      const words = chapterContent
        .toString()
        .split(/\s+/)
        .filter((word: string) => word.length > 0);
      totalWordCount += words.length;

      // セクションがあれば処理
      const sections = (chapter as any).sections as Section[];
      if (sections && Array.isArray(sections) && sections.length > 0) {
        sections.forEach((section: Section) => {
          const sectionContent = section.content || "";
          totalCharCount += sectionContent.toString().length;

          const sectionWords = sectionContent
            .toString()
            .split(/\s+/)
            .filter((word: string) => word.length > 0);
          totalWordCount += sectionWords.length;
        });
      }
    });

    // 統計情報のテキストを生成
    let stats = `「${project.title}」の統計情報\n`;
    stats += `===================================\n\n`;
    stats += `作成日: ${new Date(project.createdAt).toLocaleDateString(
      "ja-JP"
    )}\n`;
    stats += `最終更新日: ${new Date(project.updatedAt).toLocaleDateString(
      "ja-JP"
    )}\n\n`;

    stats += `キャラクター数: ${project.characters.length}名\n`;

    // 場所数を安全に取得
    const placeCount = project.worldBuilding?.places?.length || 0;
    stats += `場所数: ${placeCount}箇所\n`;

    stats += `タイムラインイベント数: ${project.timeline.length}件\n`;
    stats += `章数: ${project.chapters.length}章\n\n`;

    stats += `総文字数: ${totalCharCount}文字\n`;
    stats += `総単語数: ${totalWordCount}語\n\n`;

    if (project.metadata?.wordCountGoal) {
      const progress = (totalWordCount / project.metadata.wordCountGoal) * 100;
      stats += `単語数目標: ${project.metadata.wordCountGoal}語\n`;
      stats += `進捗: ${progress.toFixed(2)}%\n\n`;
    }

    if (project.metadata?.genre && project.metadata.genre.length > 0) {
      stats += `ジャンル: ${project.metadata.genre.join(", ")}\n`;
    }

    if (project.metadata?.tags && project.metadata.tags.length > 0) {
      stats += `タグ: ${project.metadata.tags.join(", ")}\n`;
    }

    return stats;
  }
}

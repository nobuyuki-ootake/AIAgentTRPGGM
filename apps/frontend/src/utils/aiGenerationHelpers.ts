import { aiAgentApi } from "../api/aiAgent";

/**
 * あらすじ生成
 */
export const generateSynopsisContent = async (
  message: string,
  projectData: Record<string, unknown>
): Promise<string> => {
  try {
    const response = await aiAgentApi.generateSynopsis(message, projectData);

    if (response.status === "success") {
      return (
        response.data || response.rawContent || "あらすじが生成されました。"
      );
    } else {
      throw new Error(response.message || "あらすじ生成に失敗しました");
    }
  } catch (error) {
    console.error("あらすじ生成エラー:", error);
    throw error;
  }
};

/**
 * キャラクター生成
 */
export const generateCharacterContent = async (
  message: string,
  projectData: Record<string, unknown>,
  batchGeneration: boolean
): Promise<string> => {
  try {
    // TODO: キャラクター生成APIの実装
    console.log("キャラクター生成:", { message, projectData, batchGeneration });
    return "キャラクター生成機能は実装中です。";
  } catch (error) {
    console.error("キャラクター生成エラー:", error);
    throw error;
  }
};

/**
 * プロット生成
 */
export const generatePlotContent = async (
  message: string,
  projectData: Record<string, unknown>
): Promise<string> => {
  try {
    const response = await aiAgentApi.generatePlot(message, projectData);

    if (response.status === "success") {
      return (
        response.data || response.rawContent || "プロットが生成されました。"
      );
    } else {
      throw new Error(response.message || "プロット生成に失敗しました");
    }
  } catch (error) {
    console.error("プロット生成エラー:", error);
    throw error;
  }
};

/**
 * 世界観生成
 */
export const generateWorldBuildingContent = async (
  message: string,
  projectData: Record<string, unknown>,
  batchGeneration: boolean
): Promise<string> => {
  try {
    // TODO: 世界観生成APIの実装
    console.log("世界観生成:", { message, projectData, batchGeneration });
    return "世界観生成機能は実装中です。";
  } catch (error) {
    console.error("世界観生成エラー:", error);
    throw error;
  }
};

/**
 * タイムライン生成
 */
export const generateTimelineContent = async (
  message: string,
  projectData: Record<string, unknown>
): Promise<string> => {
  try {
    // TODO: タイムライン生成APIの実装
    console.log("タイムライン生成:", { message, projectData });
    return "タイムライン生成機能は実装中です。";
  } catch (error) {
    console.error("タイムライン生成エラー:", error);
    throw error;
  }
};

/**
 * 汎用コンテンツ生成
 */
export const generateGenericContent = async (
  message: string,
  projectData: Record<string, unknown>
): Promise<string> => {
  try {
    // TODO: 汎用生成APIの実装
    console.log("汎用生成:", { message, projectData });
    return "汎用生成機能は実装中です。";
  } catch (error) {
    console.error("汎用生成エラー:", error);
    throw error;
  }
};

import { aiAgentApi } from "../api/aiAgent";
import { PlotElement, Character } from "@novel-ai-assistant/types";

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
        response.data ||
        response.rawContent ||
        "あらすじを生成できませんでした。"
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
 * キャラクター生成（バッチ処理対応）
 */
export const generateCharacterContent = async (
  message: string,
  projectData: Record<string, unknown>,
  batchGeneration: boolean = true,
  onProgress?: (
    current: number,
    total: number,
    currentCharacterName?: string
  ) => void
): Promise<string> => {
  try {
    console.log("=== キャラクター生成開始 ===");
    console.log("メッセージ:", message);
    console.log("まとめて生成（バッチ処理）:", batchGeneration);
    console.log("プロジェクトデータ:", projectData);

    // プロット要素と既存キャラクターを一度だけ抽出
    const plotElements = Array.isArray(projectData.plot)
      ? (projectData.plot as PlotElement[])
      : [];
    const existingCharacters = Array.isArray(projectData.characters)
      ? (projectData.characters as Character[])
      : [];

    console.log("プロット要素数:", plotElements.length);
    console.log("既存キャラクター数:", existingCharacters.length);

    if (!batchGeneration) {
      // 1つずつ詳細に生成する場合（単発生成）
      console.log("=== 単発生成モード（1つずつ詳細に生成） ===");
      const response = await aiAgentApi.generateCharacter(
        message,
        plotElements,
        existingCharacters
      );
      if (response.status === "success") {
        return (
          response.data ||
          response.rawContent ||
          "キャラクターを生成できませんでした。"
        );
      } else {
        throw new Error(response.message || "キャラクター生成に失敗しました");
      }
    }

    // バッチ処理フロー（まとめて生成する場合）
    console.log("=== バッチ処理フロー開始（まとめて生成） ===");

    // 第1段階: キャラクターリスト生成
    console.log("第1段階: キャラクターリスト生成開始");
    onProgress?.(0, 2, "キャラクターリストを生成中...");

    const listResponse = await aiAgentApi.generateCharacterList(
      message,
      plotElements,
      existingCharacters
    );

    console.log("キャラクターリスト生成レスポンス:", listResponse);

    if (listResponse.status !== "success" || !listResponse.data) {
      throw new Error(
        listResponse.message || "キャラクターリスト生成に失敗しました"
      );
    }

    const characterList = listResponse.data;
    console.log(`生成されたキャラクターリスト: ${characterList.length}件`);
    console.log("キャラクターリスト詳細:", characterList);

    // 第2段階: 各キャラクターの詳細をバッチ処理で生成
    console.log("第2段階: キャラクター詳細生成開始");
    const totalCharacters = characterList.length;

    const detailPromises = characterList.map(
      async (
        charInfo: {
          name: string;
          role: string;
          importance: string;
          description: string;
        },
        index: number
      ) => {
        try {
          console.log(`キャラクター${index + 1}の詳細生成開始:`, charInfo.name);
          onProgress?.(index + 1, totalCharacters + 1, charInfo.name);

          const detailMessage = `以下のキャラクターの詳細情報を生成してください：

名前: ${charInfo.name}
役割: ${
            charInfo.role === "protagonist"
              ? "主人公"
              : charInfo.role === "antagonist"
              ? "敵役"
              : "脇役"
          }
重要度: ${charInfo.importance}
概要: ${charInfo.description}

詳細な背景、性格、外見、動機などを含めて、魅力的なキャラクター設定を作成してください。`;

          const detailResponse = await aiAgentApi.generateCharacterDetail(
            charInfo.name,
            charInfo.role === "protagonist"
              ? "主人公"
              : charInfo.role === "antagonist"
              ? "敵役"
              : "脇役",
            detailMessage
          );

          console.log(
            `キャラクター${index + 1}の詳細生成レスポンス:`,
            detailResponse
          );

          if (detailResponse.status === "success") {
            return {
              name: charInfo.name,
              role: charInfo.role,
              importance: charInfo.importance,
              summary: charInfo.description,
              details:
                detailResponse.data ||
                detailResponse.rawContent ||
                "詳細を生成できませんでした",
            };
          } else {
            console.warn(
              `${charInfo.name}の詳細生成に失敗:`,
              detailResponse.message
            );
            return {
              name: charInfo.name,
              role: charInfo.role,
              importance: charInfo.importance,
              summary: charInfo.description,
              details: "詳細の生成に失敗しました",
            };
          }
        } catch (error) {
          console.error(`${charInfo.name}の詳細生成エラー:`, error);
          return {
            name: charInfo.name,
            role: charInfo.role,
            importance: charInfo.importance,
            summary: charInfo.description,
            details: "詳細の生成中にエラーが発生しました",
          };
        }
      }
    );

    // 全ての詳細生成を並行実行
    console.log("全キャラクターの詳細生成を並行実行中...");
    const characterDetails = await Promise.all(detailPromises);

    console.log(`キャラクター詳細生成完了: ${characterDetails.length}件`);
    onProgress?.(totalCharacters + 1, totalCharacters + 1, "生成完了");

    // 結果をフォーマットして返す
    const formattedResult = characterDetails
      .map((char, index) => {
        // 詳細情報を適切に文字列化
        let detailsText = "";
        if (typeof char.details === "object" && char.details !== null) {
          // オブジェクトの場合、YAML形式で文字列化
          try {
            detailsText = Object.entries(char.details)
              .map(([key, value]) => {
                if (Array.isArray(value)) {
                  return `${key}: ${value.join(", ")}`;
                } else if (typeof value === "object" && value !== null) {
                  return `${key}: ${JSON.stringify(value)}`;
                } else {
                  return `${key}: ${value}`;
                }
              })
              .join("\n");
          } catch (error) {
            console.warn("詳細情報の文字列化に失敗:", error);
            detailsText = String(char.details);
          }
        } else {
          detailsText = String(char.details || "詳細情報なし");
        }

        return `【キャラクター${index + 1}】
名前: ${char.name}
役割: ${
          char.role === "protagonist"
            ? "主人公"
            : char.role === "antagonist"
            ? "敵役"
            : "脇役"
        }
重要度: ${char.importance}
概要: ${char.summary}

詳細:
${detailsText}`;
      })
      .join("\n\n" + "=".repeat(50) + "\n\n");

    console.log("=== キャラクター生成完了 ===");
    return formattedResult;
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
        response.data ||
        response.rawContent ||
        "プロットを生成できませんでした。"
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

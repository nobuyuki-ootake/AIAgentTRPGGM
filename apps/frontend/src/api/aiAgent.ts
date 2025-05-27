import axios, { AxiosError } from "axios";
import { WorldBuildingApiResponse } from "../types/apiResponse";
import {
  WorldBuildingElementType,
  PlotElement,
  Character,
  WorldBuildingElement,
  TimelineEvent,
  StandardAIResponse,
} from "@novel-ai-assistant/types";

// APIのベースURL
const buildApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  if (!envUrl) {
    // 開発環境では相対パス
    return "/api/ai-agent";
  }

  // 環境変数が既に /api/ai-agent を含んでいるかチェック
  if (envUrl.endsWith("/api/ai-agent")) {
    return envUrl;
  }

  // 末尾のスラッシュを正規化
  const baseUrl = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  return `${baseUrl}/api/ai-agent`;
};

const API_BASE_URL = buildApiBaseUrl();

// デバッグ用ログ
console.log("環境変数 VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
console.log("構築されたAPI_BASE_URL:", API_BASE_URL);

// APIエラーハンドリング共通関数
const handleApiError = (error: AxiosError | Error, operationName: string) => {
  // ネットワークエラーの処理 (Error 型の場合)
  if (!(error instanceof AxiosError) && error.message === "Network Error") {
    console.error(`${operationName} - ネットワークエラー:`, error);
    throw new Error(
      `サーバーへの接続に失敗しました。ネットワーク接続を確認してください。`
    );
  }

  // Axiosエラーレスポンスの処理
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    const errorData = error.response.data as { error?: string }; // errorData の型を仮定

    console.error(`${operationName} - APIエラー (${status}):`, errorData);

    // ステータスコードに応じたエラーメッセージ
    switch (status) {
      case 401:
        throw new Error("認証に失敗しました。APIキーを確認してください。");
      case 400:
        throw new Error(
          errorData?.error || "リクエストが不正です。入力を確認してください。"
        );
      case 429:
        throw new Error(
          "リクエスト制限を超過しました。しばらく待ってから再試行してください。"
        );
      case 500:
        throw new Error(
          "サーバー内部エラーが発生しました。管理者に連絡してください。"
        );
      default:
        throw new Error(errorData?.error || "エラーが発生しました。");
    }
  }

  // その他のエラー (AxiosError ではない Error インスタンスなど)
  console.error(`${operationName} - 予期しないエラー:`, error);
  throw error;
};

// AIエージェントAPIクライアント
export const aiAgentApi = {
  /**
   * AIエージェントのステータスを確認する
   * @returns ステータス情報
   */
  getStatus: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/status`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "AIエージェントステータス確認");
      }
      throw error;
    }
  },

  /**
   * AIエージェントとチャットする
   * @param message ユーザーのメッセージ
   * @param selectedElements 関連要素（キャラクター、プロット等）
   * @param networkType 使用するネットワークタイプ
   */
  chat: async (
    message: string,
    selectedElements: Array<
      PlotElement | Character | WorldBuildingElement
    > = [],
    networkType:
      | "novel-creation"
      | "plot-development"
      | "writing-improvement" = "novel-creation"
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message,
        selectedElements,
        networkType,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "AIエージェントチャット");
      }
      throw error;
    }
  },

  /**
   * プロットに関するアドバイスを取得
   * @param message ユーザーのメッセージ
   * @param plotElements プロット要素
   */
  getPlotAdvice: async (message: string, plotElements: PlotElement[] = []) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/plot-advice`, {
        message,
        plotElements,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "プロットアドバイス取得");
      }
      throw error;
    }
  },

  /**
   * あらすじ生成を行う
   * @param message ユーザーのメッセージ
   * @param projectData プロジェクトデータ
   * @param model 使用するAIモデル
   * @param format 出力フォーマット
   */
  generateSynopsis: async (
    message: string,
    projectData: Record<string, unknown> = {},
    model: string = "gpt-4o",
    format: "text" | "json" | "yaml" = "text"
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/synopsis-generation`, {
        userMessage: message,
        projectData,
        model,
        format,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "あらすじ生成");
      }
      throw error;
    }
  },

  /**
   * あらすじに関するアドバイスを取得
   * @param message ユーザーのメッセージ
   * @param titleContext タイトル情報など
   */
  getSynopsisAdvice: async (
    message: string,
    titleContext: { title?: string; synopsis?: string }[] = []
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/synopsis-advice`, {
        message,
        titleContext,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "あらすじアドバイス取得");
      }
      throw error;
    }
  },

  /**
   * キャラクターに関するアドバイスを取得
   * @param message ユーザーのメッセージ
   * @param characterElements キャラクター要素
   */
  getCharacterAdvice: async (
    message: string,
    characterElements: Character[] = []
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/character-advice`, {
        message,
        characterElements,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "キャラクターアドバイス取得");
      }
      throw error;
    }
  },

  /**
   * キャラクター生成を行う
   * @param message ユーザーのメッセージ
   * @param plotElements プロット要素
   * @param existingCharacters 既存のキャラクター
   */
  generateCharacter: async (
    message: string,
    plotElements: PlotElement[] = [],
    existingCharacters: Character[] = []
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/character-generation`,
        {
          message,
          plotElements,
          existingCharacters,
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "キャラクター生成");
      }
      throw error;
    }
  },

  /**
   * キャラクターの概要リストを生成する（分割リクエスト第1段階）
   * @param message ユーザーのメッセージ
   * @param plotElements プロット要素
   * @param existingCharacters 既存のキャラクター
   * @returns キャラクター名と役割のリスト
   */
  generateCharacterList: async (
    message: string,
    plotElements: PlotElement[] = [],
    existingCharacters: Character[] = []
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/character-list-generation`,
        {
          message,
          plotElements,
          existingCharacters,
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "キャラクターリスト生成");
      }
      throw error;
    }
  },

  /**
   * 特定のキャラクターの詳細情報を生成する（分割リクエスト第2段階）
   * @param characterName キャラクター名
   * @param characterRole キャラクターの役割
   * @param message 追加の指示
   * @param plotElements プロット要素
   * @param existingCharacters 既存のキャラクター
   * @returns キャラクターの詳細情報
   */
  generateCharacterDetail: async (
    characterName: string,
    characterRole: string,
    message: string = "",
    plotElements: PlotElement[] = [],
    existingCharacters: Character[] = []
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/character-detail-generation`,
        {
          characterName,
          characterRole,
          message,
          plotElements,
          existingCharacters,
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "キャラクター詳細生成");
      }
      throw error;
    }
  },

  /**
   * 文体に関するアドバイスを取得
   * @param message ユーザーのメッセージ（オプション）
   * @param textContent 分析対象のテキスト
   */
  getStyleAdvice: async (textContent: string, message?: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/style-advice`, {
        message,
        textContent,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "文体アドバイス取得");
      }
      throw error;
    }
  },

  /**
   * 世界観構築に関するアドバイスを取得
   * @param message ユーザーのメッセージ
   * @param worldElements 世界観要素
   */
  getWorldBuildingAdvice: async (
    message: string,
    worldElements: WorldBuildingElement[] = []
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/worldbuilding-advice`,
        {
          message,
          worldElements,
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "世界観構築アドバイス取得");
      }
      throw error;
    }
  },

  /**
   * 世界観の要素リストを生成する（分割リクエスト第1段階）
   * @param message ユーザーのメッセージ
   * @param plotElements プロット要素
   * @param charactersElements キャラクター要素
   * @param model 使用するAIモデル（省略時はGemini Pro 1.5を使用）
   * @param format レスポンス形式（json/yaml、デフォルトはjson）
   * @param elementType 生成する要素タイプ（places/cultures）
   * @returns 世界観要素のリスト（場所や文化など）
   */
  generateWorldBuildingList: async (
    message: string,
    plotElements: PlotElement[] = [],
    charactersElements: Character[] = [],
    model: string = "gemini-1.5-pro",
    format: string = "json",
    elementType: string = "places"
  ) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/worldbuilding-list-generation`,
        {
          message,
          plotElements,
          charactersElements,
          model,
          format,
          elementType,
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "世界観要素リスト生成");
      }
      throw error;
    }
  },

  /**
   * 特定の世界観要素の詳細情報を生成する（分割リクエスト第2段階）
   * @param elementName 要素名（場所名など）
   * @param elementType 要素タイプ（place, culture, ruleなど）
   * @param message 追加の指示
   * @param plotElements プロット要素
   * @param charactersElements キャラクター要素
   * @param format レスポンス形式（json/yaml、デフォルトはjson）
   * @returns 世界観要素の詳細情報
   */
  generateWorldBuildingDetail: async (
    elementName: string,
    elementType: string,
    message: string = "",
    plotElements: PlotElement[] = [],
    charactersElements: Character[] = [],
    format: string = "json"
  ): Promise<WorldBuildingApiResponse> => {
    try {
      // 要素タイプの正規化（小文字に変換）
      const normalizedElementType =
        elementType?.toLowerCase() || WorldBuildingElementType.FREE_FIELD;

      // APIリクエストを送信（プロンプト生成はバックエンド側で行われる）
      const response = await axios.post<WorldBuildingApiResponse>(
        `${API_BASE_URL}/worldbuilding-detail-generation`,
        {
          elementName,
          elementType: normalizedElementType,
          message, // 追加指示はそのままバックエンドに渡す
          plotElements,
          charactersElements,
          format,
        }
      );

      // 型の検証
      if (!isWorldBuildingApiResponse(response.data)) {
        console.error("期待される型: WorldBuildingApiResponse", {
          status: "string",
          data: "Record<string, unknown>",
          rawContent: "string",
          metadata: {
            model: "string",
            processingTime: "number",
            requestType: "string",
            format: "string",
          },
        });
        console.error("実際のレスポンス:", response.data);
        throw new Error("レスポンスの型が不正です");
      }

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        // handleApiError は void を返すことがあるため、Promise<WorldBuildingApiResponse> と型が合わない
        // ここではエラーをそのまま throw するか、エラー用のレスポンスを整形して返す必要がある
        console.error("世界観要素詳細生成エラー (詳細):", error);
        if (error instanceof AxiosError && error.response) {
          throw new Error(
            `API Error ${error.response.status}: ${
              error.response.data?.error || error.message
            }`
          );
        }
        throw error;
      }
      throw error;
    }
  },

  /**
   * API設定を保存する
   * @param providerSettings プロバイダー設定
   */
  saveApiSettings: async (providerSettings: {
    provider: string;
    apiKey: string;
    modelName: string;
    parameters?: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    };
  }) => {
    try {
      // APIキーは暗号化してから送信
      const { apiKey, ...rest } = providerSettings;
      const encryptedKey = await encryptApiKey(apiKey);

      const response = await axios.post(`${API_BASE_URL}/settings`, {
        ...rest,
        apiKey: encryptedKey,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "API設定の保存");
      }
      throw error;
    }
  },

  /**
   * API設定を取得する
   */
  getApiSettings: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`);
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "API設定の取得");
      }
      throw error;
    }
  },

  /**
   * APIキーの有効性をテストする
   * @param provider プロバイダー名
   * @param apiKey APIキー
   * @param modelName モデル名
   */
  testApiKey: async (provider: string, apiKey: string, modelName: string) => {
    try {
      // APIキーは暗号化してから送信
      const encryptedKey = await encryptApiKey(apiKey);

      const response = await axios.post(`${API_BASE_URL}/test-key`, {
        provider,
        apiKey: encryptedKey,
        modelName,
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "APIキーテスト");
      }
      throw error;
    }
  },

  /**
   * AIに章の本文を生成させる
   * @param chapterTitle 章のタイトル
   * @param relatedEvents 関連するタイムラインイベント (ID, title, description を含むオブジェクトの配列)
   * @param charactersInChapter 登場キャラクター (ID, name, description, role を含むオブジェクトの配列)
   * @param selectedLocations 関連する場所 (ID, name, description を含むオブジェクトの配列)
   * @param userInstructions ユーザーからの追加指示
   * @param targetChapterLength 目標とする章の長さ
   * @param model 使用するAIモデル (オプション)
   * @returns AIが生成した章の本文を含むレスポンス
   */
  generateChapterContent: async (
    chapterTitle: string,
    relatedEvents: Pick<TimelineEvent, "id" | "title" | "description">[],
    charactersInChapter: Pick<
      Character,
      "id" | "name" | "description" | "role"
    >[],
    selectedLocations: Pick<
      WorldBuildingElement,
      "id" | "name" | "description"
    >[],
    userInstructions?: string,
    targetChapterLength?: "short" | "medium" | "long",
    model?: string
  ): Promise<StandardAIResponse> => {
    try {
      const response = await axios.post<StandardAIResponse>(
        `${API_BASE_URL}/chapter-generation`,
        {
          chapterTitle,
          relatedEvents,
          charactersInChapter,
          selectedLocations,
          userInstructions,
          targetChapterLength,
          model,
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        let errorMessage = "章の本文生成中にAPIエラーが発生しました";
        if (
          error instanceof AxiosError &&
          error.response &&
          typeof error.response.data?.error === "string"
        ) {
          errorMessage = error.response.data.error;
        } else if (error.message) {
          errorMessage = error.message;
        }
        console.error("章本文生成APIエラー (詳細):", error);
        throw new Error(errorMessage);
      }
      throw error;
    }
  },
};

/**
 * APIキーを暗号化する簡易関数
 * 実際の実装ではもっと安全な方法を使用すべき
 */
const encryptApiKey = async (apiKey: string): Promise<string> => {
  // ここではデモとして単純なBase64エンコードを使用
  // 実際の実装ではAES-256などの強力な暗号化を使用するべき
  return btoa(apiKey);
};

// 型ガード関数の作成
function isWorldBuildingApiResponse(
  data: unknown
): data is WorldBuildingApiResponse {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const d = data as Record<string, unknown>; // より安全な型アサーション
  return (
    typeof d.status === "string" &&
    typeof d.data === "object" && // data が object であることだけを確認 (中身は WorldBuildingApiResponse 型定義に依存)
    d.rawContent !== undefined && // undefined チェックのみ (stringであるかは WorldBuildingApiResponse 型定義に依存)
    typeof d.metadata === "object" &&
    d.metadata !== null &&
    typeof (d.metadata as Record<string, unknown>).model === "string" &&
    typeof (d.metadata as Record<string, unknown>).processingTime ===
      "number" &&
    typeof (d.metadata as Record<string, unknown>).requestType === "string" &&
    typeof (d.metadata as Record<string, unknown>).format === "string"
  );
}

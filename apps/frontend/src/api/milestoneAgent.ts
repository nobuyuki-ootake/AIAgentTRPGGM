import axios, { AxiosError } from "axios";

// APIのベースURL
const buildApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (!envUrl) {
    return "/api/ai-agent";
  }

  if (envUrl.endsWith("/api/ai-agent")) {
    return envUrl;
  }

  const baseUrl = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  return `${baseUrl}/api/ai-agent`;
};

const API_BASE_URL = buildApiBaseUrl();

// APIエラーハンドリング共通関数
const handleApiError = (error: AxiosError | Error, operationName: string) => {
  if (!(error instanceof AxiosError) && error.message === "Network Error") {
    throw new Error(
      `サーバーへの接続に失敗しました。ネットワーク接続を確認してください。`
    );
  }

  if (error instanceof AxiosError && error.response) {
    const { status, data } = error.response;
    const errorMessage = data?.error || data?.message || `${operationName}中にエラーが発生しました`;
    
    if (status === 400) {
      throw new Error(`リクエストエラー: ${errorMessage}`);
    } else if (status === 401) {
      throw new Error("認証が必要です。APIキーを確認してください。");
    } else if (status === 403) {
      throw new Error("アクセス権限がありません。APIキーを確認してください。");
    } else if (status === 429) {
      throw new Error("リクエスト制限に達しました。しばらく時間をおいてから再試行してください。");
    } else if (status >= 500) {
      throw new Error("サーバーエラーが発生しました。しばらく時間をおいてから再試行してください。");
    }
    
    throw new Error(`${operationName}エラー (${status}): ${errorMessage}`);
  }

  throw new Error(`${operationName}中に予期しないエラーが発生しました: ${error.message}`);
};

/**
 * マイルストーン関連のAI agent API
 */
export const milestoneAgentApi = {
  /**
   * マイルストーン誘導メッセージ生成
   * 現在のマイルストーン情報に基づいてAIが適切な誘導を行います
   */
  generateMilestoneGuidance: async (params: {
    milestoneContext: string;
    currentSituation: string;
    playerMessage?: string;
    urgencyLevel: 'normal' | 'urgent' | 'critical' | 'overdue';
    campaignContext?: {
      title: string;
      currentDay: number;
      location: string;
      characters: string[];
    };
  }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/milestone-guidance`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 20000, // 20秒タイムアウト
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "マイルストーン誘導生成");
      }
      throw error;
    }
  },

  /**
   * マイルストーン達成判定とお祝いメッセージ生成
   */
  generateMilestoneAchievement: async (params: {
    achievedMilestone: {
      title: string;
      description: string;
      completionDetails: string;
    };
    nextMilestone?: {
      title: string;
      description: string;
      targetDay: number;
    };
    campaignContext: {
      title: string;
      currentDay: number;
      characters: string[];
    };
  }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/milestone-achievement`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15秒タイムアウト
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "マイルストーン達成お祝い生成");
      }
      throw error;
    }
  },

  /**
   * マイルストーン期限警告メッセージ生成
   */
  generateMilestoneWarning: async (params: {
    milestone: {
      title: string;
      description: string;
      targetDay: number;
      deadline: boolean;
    };
    currentDay: number;
    progress: number;
    remainingRequirements: string[];
    campaignContext: {
      title: string;
      location: string;
      characters: string[];
    };
  }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/milestone-warning`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15秒タイムアウト
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "マイルストーン警告生成");
      }
      throw error;
    }
  },

  /**
   * 自然な誘導メッセージ生成（通常のチャット中に使用）
   */
  generateNaturalGuidance: async (params: {
    milestoneContext: string;
    conversationHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
    currentSituation: string;
    guidanceIntensity: 'subtle' | 'moderate' | 'direct';
  }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/milestone-natural-guidance`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError || error instanceof Error) {
        return handleApiError(error, "自然な誘導生成");
      }
      throw error;
    }
  }
};
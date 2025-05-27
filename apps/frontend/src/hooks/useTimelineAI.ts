import { useState } from "react";
import {
  TimelineEventSeed,
  PlotElement,
  StandardAIRequest,
  StandardAIResponse,
  Character,
  PlaceElement,
} from "@novel-ai-assistant/types";
import axios from "axios";

// タイムラインイベントの「種」をAIに生成させるためのAPIの想定レスポンス型
// 実際にはAPIクライアントの型定義に依存します
// interface GenerateEventSeedsResponse {
//   seeds: TimelineEventSeed[];
//   // 必要に応じて他の情報（例: AIの提案理由、コストなど）
// }

// useTimelineAI フックのインターフェース
export interface UseTimelineAIReturn {
  eventSeeds: TimelineEventSeed[];
  isLoading: boolean;
  error: Error | null;
  generateEventSeeds: (params: {
    prompt: string;
    plotId?: string | null;
    allPlots?: PlotElement[];
    characters?: Character[];
    places?: PlaceElement[];
  }) => Promise<void>;
}

/**
 * タイムライン関連のAI機能を提供するカスタムフック
 */
export const useTimelineAI = (): UseTimelineAIReturn => {
  const [eventSeeds, setEventSeeds] = useState<TimelineEventSeed[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * AIに指示を送信し、イベントの「種」のリストを生成・取得する関数
   * @param params AIへの指示内容と関連プロアントとコンテキスト情報
   */
  const generateEventSeeds = async (params: {
    prompt: string;
    plotId?: string | null;
    allPlots?: PlotElement[];
    characters?: Character[];
    places?: PlaceElement[];
  }): Promise<void> => {
    const {
      prompt,
      plotId,
      allPlots,
      characters,
      places: placeElements,
    } = params;
    setIsLoading(true);
    setError(null);
    try {
      console.log(
        `AIにイベント生成をリクエスト: "${prompt}", 関連プロットID: ${
          plotId || "なし"
        }`
      );

      const requestPayload: StandardAIRequest = {
        requestType: "timeline-event-generation",
        userPrompt: prompt,
        context: {
          targetPlotId: plotId,
          allPlots: allPlots,
          characters: characters,
          places: placeElements,
        },
        options: {
          responseFormat: "json",
        },
      };

      const response = await axios.post<StandardAIResponse>(
        "/api/ai-agent/timeline-event-generation",
        requestPayload
      );

      if (response.data.status === "success" && response.data.content) {
        const receivedSeeds = response.data.content as TimelineEventSeed[];
        setEventSeeds(receivedSeeds);
        console.log("AIからのイベントシード受信:", receivedSeeds);
      } else if (response.data.status === "error") {
        console.error("AI処理エラー (APIレスポンス):", response.data.error);
        throw new Error(
          response.data.error?.message ||
            "AI処理中にAPIからエラーが返されました。"
        );
      } else {
        console.error("AIからの予期しないレスポンス形式:", response.data);
        throw new Error("AIからのレスポンス形式が不正です。");
      }
    } catch (err) {
      console.error("イベントの種の生成に失敗しました (フック内):", err);
      const errMessage =
        err instanceof Error
          ? err.message
          : "AIによるイベント生成中に不明なエラーが発生しました。";
      if (axios.isAxiosError(err) && err.response) {
        console.error("Axiosエラー詳細:", err.response.data);
        setError(
          new Error(
            `${errMessage} (サーバー: ${
              err.response.data?.error?.message || "詳細不明"
            })`
          )
        );
      } else {
        setError(new Error(errMessage));
      }
      setEventSeeds([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    eventSeeds,
    isLoading,
    error,
    generateEventSeeds,
  };
};

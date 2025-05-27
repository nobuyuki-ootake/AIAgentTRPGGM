import { useRecoilState } from "recoil";
import {
  aiChatContextState,
  aiChatPanelOpenState,
  aiChatTabState,
  AssistConfig,
  PageContext,
  SelectedElement,
} from "../store/atoms";
import { NovelProject } from "@novel-ai-assistant/types";
import { toast } from "sonner";

// エラーの種類
type IntegrationError =
  | "invalid_config"
  | "missing_project"
  | "invalid_context";

// バリデーション結果
interface ValidationResult {
  isValid: boolean;
  error?: IntegrationError;
  message?: string;
}

export const useAIChatIntegration = () => {
  const [, setContext] = useRecoilState(aiChatContextState);
  const [, setAIChatPanelOpen] = useRecoilState(aiChatPanelOpenState);
  const [, setActiveTab] = useRecoilState(aiChatTabState);

  // AssistConfigのバリデーション
  const validateAssistConfig = (config: AssistConfig): ValidationResult => {
    if (!config.title || !config.description) {
      return {
        isValid: false,
        error: "invalid_config",
        message: "タイトルと説明は必須です。",
      };
    }

    if (!config.defaultMessage && !config.onComplete && !config.onGenerate) {
      return {
        isValid: false,
        error: "invalid_config",
        message: "デフォルトメッセージまたはコールバック関数が必要です。",
      };
    }

    return { isValid: true };
  };

  // ページコンテキストのバリデーション
  const validatePageContext = (pageContext: PageContext): ValidationResult => {
    const validContexts: PageContext[] = [
      "characters",
      "plot",
      "timeline",
      "worldbuilding",
      "writing",
      "synopsis",
      "plot-item",
    ];

    if (!validContexts.includes(pageContext)) {
      return {
        isValid: false,
        error: "invalid_context",
        message: `無効なページコンテキスト: ${pageContext}`,
      };
    }

    return { isValid: true };
  };

  const openAIAssist = (
    pageContext: PageContext,
    assistConfig: AssistConfig,
    projectData?: NovelProject | null,
    selectedElements?: SelectedElement[]
  ): boolean => {
    try {
      // ページコンテキストのバリデーション
      const contextValidation = validatePageContext(pageContext);
      if (!contextValidation.isValid) {
        console.error("Invalid page context:", contextValidation.message);
        toast.error(
          contextValidation.message || "無効なページコンテキストです。"
        );
        return false;
      }

      // AssistConfigのバリデーション
      const configValidation = validateAssistConfig(assistConfig);
      if (!configValidation.isValid) {
        console.error("Invalid assist config:", configValidation.message);
        toast.error(configValidation.message || "無効なアシスト設定です。");
        return false;
      }

      // プロジェクトデータの確認（必須ではないが警告）
      if (!projectData) {
        console.warn("No project data provided for AI assist");
        toast.warning(
          "プロジェクトデータが設定されていません。一部の機能が制限される可能性があります。"
        );
      }

      // コンテキストを設定
      setContext({
        mode: "assist",
        pageContext,
        projectData: projectData || null,
        selectedElements: selectedElements || [],
        assistConfig,
      });

      // アシストタブに切り替え
      setActiveTab("assist");

      // AIチャットパネルを開く
      setAIChatPanelOpen(true);

      return true;
    } catch (error) {
      console.error("Error opening AI assist:", error);
      toast.error("AIアシスト機能の起動に失敗しました。");
      return false;
    }
  };

  const closeAIAssist = (): void => {
    try {
      // チャットタブに戻す
      setActiveTab("chat");

      // コンテキストをリセット
      setContext((prev) => ({
        ...prev,
        mode: "chat",
        assistConfig: undefined,
      }));
    } catch (error) {
      console.error("Error closing AI assist:", error);
      toast.error("AIアシスト機能の終了に失敗しました。");
    }
  };

  const switchToChat = (): void => {
    try {
      setActiveTab("chat");
      setContext((prev) => ({
        ...prev,
        mode: "chat",
      }));
    } catch (error) {
      console.error("Error switching to chat:", error);
      toast.error("チャットタブへの切り替えに失敗しました。");
    }
  };

  return {
    openAIAssist,
    closeAIAssist,
    switchToChat,
    validateAssistConfig,
    validatePageContext,
  };
};

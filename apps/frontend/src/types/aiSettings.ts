/**
 * AI設定関連の型定義
 */

/**
 * AIプロバイダーの種類
 */
export type AIProvider = "openai" | "anthropic" | "gemini" | "custom";

/**
 * モデルパラメータ
 */
export interface ModelParameters {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * プロバイダー設定
 */
export interface ProviderSettings {
  provider: AIProvider;
  apiKey: string;
  modelName: string;
  parameters?: ModelParameters;
}

/**
 * 使用可能なモデル情報
 */
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  features: string[];
  maxTokens: number;
  provider: AIProvider;
  isRecommended?: boolean;
  pricingInfo?: string;
}

/**
 * 使用可能なモデルリスト
 */
export const availableModels: ModelInfo[] = [
  {
    id: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    description: "高速で経済的な汎用モデル",
    features: ["チャット応答", "創作支援", "校正"],
    maxTokens: 4096,
    provider: "openai",
    isRecommended: true,
    pricingInfo: "入力: $0.001/1Kトークン, 出力: $0.002/1Kトークン",
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    description: "高度な推論能力を持つ大規模モデル",
    features: ["複雑な執筆", "高度な推論", "長文理解"],
    maxTokens: 8192,
    provider: "openai",
    pricingInfo: "入力: $0.03/1Kトークン, 出力: $0.06/1Kトークン",
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    description: "高速で効率的なモデル",
    features: ["高速応答", "創作支援", "校正"],
    maxTokens: 200000,
    provider: "anthropic",
    pricingInfo: "入力: $0.25/1Mトークン, 出力: $1.25/1Mトークン",
  },
  {
    id: "claude-3-sonnet",
    name: "Claude 3 Sonnet",
    description: "高度な創作能力を持つ中規模モデル",
    features: ["詳細な創作", "高度な分析", "長文理解"],
    maxTokens: 200000,
    provider: "anthropic",
    isRecommended: true,
    pricingInfo: "入力: $3/1Mトークン, 出力: $15/1Mトークン",
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Googleの高性能マルチモーダルモデル",
    features: ["創作支援", "推論", "長文理解"],
    maxTokens: 1000000,
    provider: "gemini",
    isRecommended: true,
    pricingInfo: "入力: $0.00035/1Kトークン, 出力: $0.00105/1Kトークン",
  },
];

/**
 * 各プロバイダーの基本情報
 */
export const providerInfo = {
  openai: {
    name: "OpenAI",
    website: "https://platform.openai.com/",
    description: "GPTモデルを提供する業界リーダー",
    apiKeyInstructions:
      "APIキーは https://platform.openai.com/api-keys から取得できます",
  },
  anthropic: {
    name: "Anthropic",
    website: "https://console.anthropic.com/",
    description: "Claude LLMで知られる企業、長文理解に優れたモデルを提供",
    apiKeyInstructions:
      "APIキーは https://console.anthropic.com/settings/keys から取得できます",
  },
  gemini: {
    name: "Google Gemini",
    website: "https://ai.google.dev/",
    description: "Googleが開発した最新のAIモデル",
    apiKeyInstructions:
      "APIキーは https://ai.google.dev/tutorials/setup から取得できます",
  },
  custom: {
    name: "カスタムプロバイダー",
    website: "",
    description: "独自のAPIエンドポイントを設定（開発者向け）",
    apiKeyInstructions: "接続先のAPIドキュメントを参照してください",
  },
};

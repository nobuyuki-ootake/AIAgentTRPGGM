import React, { useState } from "react";
import {
  ProviderSettings,
  ModelInfo,
  AIProvider,
  providerInfo,
} from "../../types/aiSettings";

interface AISettingsTabProps {
  provider: AIProvider;
  availableModels: ModelInfo[];
  currentSettings?: ProviderSettings;
  onSave: (settings: ProviderSettings) => Promise<void>;
  onTest: (
    provider: AIProvider,
    apiKey: string,
    modelName: string
  ) => Promise<boolean>;
}

/**
 * AIプロバイダーごとの設定タブ
 */
export const AISettingsTab: React.FC<AISettingsTabProps> = ({
  provider,
  availableModels,
  currentSettings,
  onSave,
  onTest,
}) => {
  // プロバイダーに関連するモデルのみをフィルタリング
  const providerModels = availableModels.filter(
    (model) => model.provider === provider
  );

  // フォームの状態
  const [apiKey, setApiKey] = useState(currentSettings?.apiKey || "");
  const [modelName, setModelName] = useState(
    currentSettings?.modelName ||
      providerModels.find((m) => m.isRecommended)?.id ||
      (providerModels.length > 0 ? providerModels[0].id : "")
  );
  const [temperature, setTemperature] = useState(
    currentSettings?.parameters?.temperature || 0.7
  );
  const [maxTokens, setMaxTokens] = useState(
    currentSettings?.parameters?.maxTokens ||
      providerModels.find((m) => m.id === modelName)?.maxTokens ||
      1000
  );

  // UI状態
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // モデル変更時に最大トークン数も更新
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModelId = e.target.value;
    setModelName(newModelId);

    // 選択したモデルの最大トークン数を設定
    const selectedModel = providerModels.find((m) => m.id === newModelId);
    if (selectedModel) {
      setMaxTokens(selectedModel.maxTokens / 4); // デフォルトはモデル最大の1/4
    }
  };

  // APIキーのテスト
  const handleTestApiKey = async () => {
    if (!apiKey) {
      setTestResult({ success: false, message: "APIキーを入力してください" });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const success = await onTest(provider, apiKey, modelName);
      setTestResult({
        success,
        message: success
          ? "APIキーは有効です！"
          : "APIキーが無効か、接続に問題があります",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message:
          error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 設定の保存
  const handleSaveSettings = async () => {
    if (!apiKey) {
      setTestResult({ success: false, message: "APIキーを入力してください" });
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        provider,
        apiKey,
        modelName,
        parameters: {
          temperature,
          maxTokens: Number(maxTokens),
        },
      });
      setTestResult({ success: true, message: "設定が保存されました" });
    } catch (error) {
      setTestResult({
        success: false,
        message:
          error instanceof Error ? error.message : "設定の保存に失敗しました",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const providerData = providerInfo[provider];

  return (
    <div className="space-y-6">
      {/* プロバイダー情報 */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-2">{providerData.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          {providerData.description}
        </p>
        {providerData.website && (
          <a
            href={providerData.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm"
          >
            詳細はこちら →
          </a>
        )}
      </div>

      {/* APIキー入力 */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor={`${provider}-api-key`}
            className="block text-sm font-medium mb-1"
          >
            APIキー
          </label>
          <div className="relative">
            <input
              id={`${provider}-api-key`}
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="sk-..."
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {providerData.apiKeyInstructions}
          </p>
        </div>

        {/* モデル選択 */}
        <div>
          <label
            htmlFor={`${provider}-model`}
            className="block text-sm font-medium mb-1"
          >
            モデル
          </label>
          <select
            id={`${provider}-model`}
            value={modelName}
            onChange={handleModelChange}
            className="w-full p-2 border rounded-md bg-white"
          >
            {providerModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
                {model.isRecommended ? " (推奨)" : ""}
              </option>
            ))}
          </select>

          {/* 選択中のモデル情報 */}
          {modelName && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              <p className="font-medium">
                {providerModels.find((m) => m.id === modelName)?.description}
              </p>
              <p className="mt-1">
                最大トークン:{" "}
                {providerModels
                  .find((m) => m.id === modelName)
                  ?.maxTokens.toLocaleString()}
              </p>
              <p className="mt-1">
                {providerModels.find((m) => m.id === modelName)?.pricingInfo}
              </p>
            </div>
          )}
        </div>

        {/* 詳細設定 */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-3">詳細設定</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Temperature */}
            <div>
              <label
                htmlFor={`${provider}-temperature`}
                className="block text-sm mb-1"
              >
                Temperature: {temperature}
              </label>
              <input
                id={`${provider}-temperature`}
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0: 決定的</span>
                <span>1: ランダム</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label
                htmlFor={`${provider}-max-tokens`}
                className="block text-sm mb-1"
              >
                最大トークン数
              </label>
              <input
                id={`${provider}-max-tokens`}
                type="number"
                min="100"
                max={
                  providerModels.find((m) => m.id === modelName)?.maxTokens ||
                  8000
                }
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* テスト結果表示 */}
      {testResult && (
        <div
          className={`p-3 rounded-md ${
            testResult.success
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {testResult.message}
        </div>
      )}

      {/* ボタン */}
      <div className="flex space-x-4 pt-4 border-t">
        <button
          onClick={handleTestApiKey}
          disabled={isTesting || !apiKey}
          className={`px-4 py-2 text-sm rounded-md ${
            isTesting
              ? "bg-gray-200 text-gray-500"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
          }`}
        >
          {isTesting ? "テスト中..." : "APIキーをテスト"}
        </button>

        <button
          onClick={handleSaveSettings}
          disabled={isSaving || !apiKey}
          className={`px-4 py-2 text-sm rounded-md ${
            isSaving
              ? "bg-gray-200 text-gray-500"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {isSaving ? "保存中..." : "設定を保存"}
        </button>
      </div>
    </div>
  );
};

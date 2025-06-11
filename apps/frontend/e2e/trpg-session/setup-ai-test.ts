import { Page } from "@playwright/test";

/**
 * AI APIキーの設定とテスト環境のセットアップ
 * 注意: テストではモックAPIキーのみを使用し、実際のAPIキーは使用しない
 */
export async function setupAIForTest(page: Page): Promise<void> {
  // LocalStorageにテスト用のモックAPIキーを設定
  await page.addInitScript(() => {
    // テスト用の固定APIキーを設定（実際のAPIキーは使用しない）
    const testApiKey = "test-mock-api-key-for-e2e-testing";
    localStorage.setItem("gemini-api-key", testApiKey);
    localStorage.setItem("selected-ai-provider", "gemini");

    // テストモードフラグを設定
    localStorage.setItem("test-mode", "true");
  });
}

/**
 * AIレスポンスのモック設定
 */
export async function mockAIResponses(page: Page): Promise<void> {
  // APIレスポンスをインターセプト
  await page.route("**/api/ai-agent/**", async (route) => {
    const url = route.request().url();

    if (url.includes("/chat")) {
      // チャットレスポンスのモック
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          response:
            "モックAIレスポンス: 冒険者よ、ようこそ！今日はどのような冒険に出かけましょうか？",
          metadata: {
            provider: "gemini-mock",
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } else if (url.includes("/test-key")) {
      // APIキーテストのモック
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          valid: true,
          provider: "gemini",
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * 実際のGemini APIを使用する場合の設定
 * 注意: セキュリティ上の理由から、実際のAPIキーはプロキシサーバー側で管理し、
 * フロントエンドには渡さない
 */
export async function setupRealGeminiAPI(page: Page): Promise<void> {
  // テストでも実際のAPIキーはフロントエンドに渡さない
  // プロキシサーバー側で環境変数から読み取る
  console.warn(
    "Real API keys should not be exposed to frontend. Using mock responses.",
  );
  await mockAIResponses(page);

  // テスト用のフラグを設定
  await page.addInitScript(() => {
    localStorage.setItem("gemini-api-key", "test-mock-api-key");
    localStorage.setItem("selected-ai-provider", "gemini");
    localStorage.setItem("use-proxy-api-key", "true"); // プロキシサーバー側のAPIキーを使用
  });
}

/**
 * AIテスト環境のセットアップ（メインエントリーポイント）
 */
export async function setupAITestEnvironment(page: Page): Promise<void> {
  // テストでは常にモックを使用（セキュリティのため）
  await page.addInitScript(() => {
    // テスト用のモックAPIキーを設定
    localStorage.setItem("gemini-api-key", "test-mock-api-key-for-e2e");
    localStorage.setItem("selected-ai-provider", "gemini");

    // 開発者モードの有効化
    localStorage.setItem("developerMode", "true");

    // テストモードフラグ
    localStorage.setItem("test-mode", "true");
  });

  // 常にモックレスポンスを使用
  console.log(
    "🔧 Using mock AI responses for testing (security best practice).",
  );
  await mockAIResponses(page);

  // 実際のAPIを使用したい場合は、プロキシサーバー側で環境変数を設定し、
  // フロントエンドからはモックキーでリクエストを送る
}

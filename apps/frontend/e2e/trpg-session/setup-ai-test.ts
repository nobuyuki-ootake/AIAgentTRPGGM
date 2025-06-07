import { Page } from '@playwright/test';

/**
 * AI APIキーの設定とテスト環境のセットアップ
 */
export async function setupAIForTest(page: Page): Promise<void> {
  // LocalStorageにGemini APIキーを設定
  await page.addInitScript(() => {
    // 環境変数またはテスト用のAPIキーを設定
    const testApiKey = process.env.GEMINI_API_KEY || 'test-api-key';
    localStorage.setItem('gemini-api-key', testApiKey);
    localStorage.setItem('selected-ai-provider', 'gemini');
    
    // テストモードフラグを設定
    localStorage.setItem('test-mode', 'true');
  });
}

/**
 * AIレスポンスのモック設定
 */
export async function mockAIResponses(page: Page): Promise<void> {
  // APIレスポンスをインターセプト
  await page.route('**/api/ai-agent/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/chat')) {
      // チャットレスポンスのモック
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'モックAIレスポンス: 冒険者よ、ようこそ！今日はどのような冒険に出かけましょうか？',
          metadata: {
            provider: 'gemini-mock',
            timestamp: new Date().toISOString()
          }
        })
      });
    } else if (url.includes('/test-key')) {
      // APIキーテストのモック
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          provider: 'gemini'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * 実際のGemini APIを使用する場合の設定
 */
export async function setupRealGeminiAPI(page: Page): Promise<void> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY is not set. Tests will use mock responses.');
    await mockAIResponses(page);
    return;
  }
  
  // 実際のAPIキーを設定
  await page.addInitScript((apiKey) => {
    localStorage.setItem('gemini-api-key', apiKey);
    localStorage.setItem('selected-ai-provider', 'gemini');
  }, geminiApiKey);
}

/**
 * AIテスト環境のセットアップ（メインエントリーポイント）
 */
export async function setupAITestEnvironment(page: Page): Promise<void> {
  // 実際のAPIキーを使用するか確認
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  await page.addInitScript((apiKey) => {
    // 実際のAPIキーまたはテスト用のキーを設定
    if (apiKey) {
      localStorage.setItem('gemini-api-key', apiKey);
    }
    localStorage.setItem('selected-ai-provider', 'gemini');
    
    // 開発者モードの有効化
    localStorage.setItem('developerMode', 'true');
  }, geminiApiKey || '');
  
  // APIキーがない場合のみモックを使用
  if (!geminiApiKey) {
    console.log('🔧 GEMINI_API_KEY not found. Using mock AI responses for testing.');
    await mockAIResponses(page);
  } else {
    console.log('✅ Using real Gemini API for testing.');
  }
}
import { test, expect } from '@playwright/test';

test('localhost:5173の状態確認', async ({ page }) => {
  // コンソールログをキャプチャ
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    // localhost:5173にアクセス
    console.log('localhost:5173にアクセス中...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // ページタイトルを確認
    const title = await page.title();
    console.log('ページタイトル:', title);

    // HTML内容を確認
    const bodyText = await page.locator('body').textContent();
    console.log('ページ内容（最初の500文字）:', bodyText?.substring(0, 500));

    // DOMが読み込まれているか確認
    const rootElement = await page.locator('#root').count();
    console.log('Reactルート要素の存在:', rootElement > 0 ? 'あり' : 'なし');

    // スクリーンショット撮影
    await page.screenshot({ 
      path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/debug-localhost-screenshot.png',
      fullPage: true 
    });
    console.log('スクリーンショットを保存しました: debug-localhost-screenshot.png');

    // ネットワークエラーチェック
    const errors = [];
    page.on('response', response => {
      if (!response.ok()) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('ネットワークエラー:', errors);
    }

  } catch (error) {
    console.log('エラーが発生しました:', error.message);
    
    // エラー時もスクリーンショット撮影
    try {
      await page.screenshot({ 
        path: '/mnt/c/Users/irure/git/AIAgentTRPGGM/apps/frontend/debug-localhost-error.png',
        fullPage: true 
      });
    } catch (screenshotError) {
      console.log('スクリーンショット撮影に失敗:', screenshotError.message);
    }
    
    throw error;
  }
});
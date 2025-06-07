import { test, expect } from '@playwright/test';
import { setupRealGeminiAPI, mockAIResponses } from './setup-ai-test';

/**
 * TRPGセッションAIゲームプレイテスト
 * 
 * このテストでは以下を検証します：
 * 1. AIゲームマスターからの実際のレスポンスを待機
 * 2. Gemini APIを使用したリアルタイムセッション
 * 3. AIレスポンスに基づいた動的なゲーム進行
 * 4. エラーハンドリングとタイムアウト処理
 */

test.describe('TRPGセッションAIゲームプレイテスト', () => {
  test.beforeEach(async ({ page }) => {
    // コンソールログの監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    // ネットワークエラーの監視
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });

    // Gemini APIのセットアップ（環境変数がある場合は実際のAPI、なければモック）
    await setupRealGeminiAPI(page);

    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // サンプルキャンペーンを選択
    await page.waitForSelector('[data-testid="campaign-card"]', { timeout: 10000 });
    await page.click('[data-testid="campaign-card"]');
    await page.waitForLoadState('networkidle');
  });

  test('AIゲームマスターとのリアルタイムセッション', async ({ page }) => {
    // スクリーンショット用カウンター
    let screenshotCounter = 1;
    
    // TRPGセッションページに移動
    await page.click('text=TRPGセッション');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `ai-gameplay-${String(screenshotCounter++).padStart(2, '0')}-session-page.png` });
    
    // セッションチャットが表示されているか確認
    await expect(page.locator('text=セッションチャット')).toBeVisible();
    
    // AIゲームマスターセッション開始
    console.log('=== AIゲームマスターセッション開始 ===');
    await page.click('text=AIにセッションを始めてもらう');
    
    // AIレスポンスを待機（最大30秒）
    await page.waitForSelector('text=AIゲームマスター', { timeout: 30000 });
    
    // AIからの初期メッセージを確認
    const aiInitialMessage = await page.waitForSelector('.chat-message:has-text("AIゲームマスター")', { timeout: 30000 });
    await expect(aiInitialMessage).toBeVisible();
    await page.screenshot({ path: `ai-gameplay-${String(screenshotCounter++).padStart(2, '0')}-ai-initial.png` });
    
    // プレイヤーの行動を入力
    const chatInput = page.locator('input[placeholder*="メッセージを入力"]');
    await chatInput.fill('冒険者ギルドで新しいクエストを探します。掲示板を確認します。');
    await page.click('button[aria-label*="送信"], button:has-text("送信"), [aria-label*="Send"], button[type="submit"]');
    
    // AIレスポンスを待機
    await waitForAIResponse(page);
    await page.screenshot({ path: `ai-gameplay-${String(screenshotCounter++).padStart(2, '0')}-quest-board.png` });
    
    // 戦闘シナリオをテスト
    await chatInput.fill('森の盗賊団退治のクエストを受けます。準備を整えて森へ向かいます。');
    await page.click('button[type="submit"]');
    
    await waitForAIResponse(page);
    await page.screenshot({ path: `ai-gameplay-${String(screenshotCounter++).padStart(2, '0')}-forest-journey.png` });
    
    // 戦闘開始
    await chatInput.fill('盗賊団を発見しました。戦闘を開始します！');
    await page.click('button[type="submit"]');
    
    await waitForAIResponse(page);
    
    // ダイス機能の使用をテスト
    const diceButton = page.locator('button:has-text("ダイス")');
    if (await diceButton.isVisible()) {
      await diceButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `ai-gameplay-${String(screenshotCounter++).padStart(2, '0')}-dice-dialog.png` });
      
      // ダイスロール
      const rollButton = page.locator('button:has-text("ロール")');
      if (await rollButton.isVisible()) {
        await rollButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // 戦闘結果をAIに報告
    await chatInput.fill('攻撃が成功！盗賊に8ポイントのダメージを与えました。');
    await page.click('button[type="submit"]');
    
    await waitForAIResponse(page);
    await page.screenshot({ path: `ai-gameplay-${String(screenshotCounter++).padStart(2, '0')}-combat-result.png` });
    
    // NPCとの対話
    await chatInput.fill('街に戻り、宿屋の主人バルトスに戦果を報告します。');
    await page.click('button[type="submit"]');
    
    await waitForAIResponse(page);
    await page.screenshot({ path: `ai-gameplay-${String(screenshotCounter++).padStart(2, '0')}-npc-dialogue.png` });
    
    // セッション状態の確認
    await page.click('text=ステータス');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `ai-gameplay-${String(screenshotCounter++).padStart(2, '0')}-status-check.png` });
    
    // 最終確認
    await expect(page.locator('text=セッションチャット')).toBeVisible();
    console.log('=== AIゲームプレイテスト完了 ===');
    console.log(`合計スクリーンショット数: ${screenshotCounter - 1}`);
  });

  test('AIレスポンスエラーハンドリング', async ({ page }) => {
    await page.click('text=TRPGセッション');
    await page.waitForLoadState('networkidle');
    
    // ネットワークをオフラインに設定
    await page.context().setOffline(true);
    
    // AIセッション開始を試みる
    await page.click('text=AIにセッションを始めてもらう');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=接続エラー')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'ai-error-handling.png' });
    
    // ネットワークを復旧
    await page.context().setOffline(false);
  });

  test('長時間セッションでのAI応答性', async ({ page }) => {
    await page.click('text=TRPGセッション');
    await page.waitForLoadState('networkidle');
    
    await page.click('text=AIにセッションを始めてもらう');
    await waitForAIResponse(page);
    
    const chatInput = page.locator('input[placeholder*="メッセージを入力"]');
    
    // 複数回の対話でAIの応答性をテスト
    const interactions = [
      '宿屋で休憩します。',
      '商店で装備を購入したいです。',
      '次のクエストについて情報を集めます。',
      'パーティメンバーと作戦会議をします。',
      '準備完了。次の冒険に出発します！'
    ];
    
    for (let i = 0; i < interactions.length; i++) {
      await chatInput.fill(interactions[i]);
      await page.click('button[type="submit"]');
      
      // 各インタラクションでAIレスポンスを待機
      await waitForAIResponse(page);
      await page.screenshot({ path: `long-session-${i + 1}.png` });
    }
    
    // セッション継続性の確認
    await expect(page.locator('.chat-message')).toHaveCount(interactions.length * 2 + 1); // プレイヤー+AI+初期メッセージ
  });
});

/**
 * AIレスポンスを待機するヘルパー関数
 * @param page - Playwrightのページオブジェクト
 * @param timeout - タイムアウト時間（ミリ秒）
 */
async function waitForAIResponse(page: any, timeout: number = 30000): Promise<void> {
  // 現在のメッセージ数を取得
  const messageCountBefore = await page.locator('.chat-message').count();
  
  // AIレスポンスが追加されるまで待機
  await page.waitForFunction(
    (count: number) => {
      const messages = document.querySelectorAll('.chat-message');
      return messages.length > count;
    },
    messageCountBefore,
    { timeout }
  );
  
  // レスポンスが完全に表示されるまで少し待機
  await page.waitForTimeout(1000);
}
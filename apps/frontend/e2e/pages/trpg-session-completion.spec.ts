import { test, expect, Page } from '@playwright/test';

/**
 * 🎮 TRPGセッション完了テスト
 * 一般ユーザーがセッションを開始から完了まで実行するフローをテスト
 */
test.describe('TRPGセッション完了テスト - 一般ユーザー', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete a full TRPG session', async () => {
    test.setTimeout(90000); // 90秒のタイムアウト設定

    // ============================================================================
    // 1. キャンペーン選択からセッション開始まで
    // ============================================================================
    await test.step('キャンペーン選択とセッション開始', async () => {
      // 既存キャンペーンがあるか確認、なければ作成
      const campaignCard = page.locator('[data-testid="campaign-card"]').first();
      if (await campaignCard.count() === 0) {
        // キャンペーン作成
        await page.click('[data-testid="new-campaign-button"]');
        await page.fill('[data-testid="campaign-name"]', 'テストキャンペーン');
        await page.fill('[data-testid="campaign-description"]', 'E2Eテスト用キャンペーン');
        await page.click('[data-testid="save-campaign"]');
        await page.waitForSelector('[data-testid="campaign-card"]');
      }

      // キャンペーン選択
      await page.click('[data-testid="campaign-card"]').first();
      await page.waitForSelector('[data-testid="campaign-detail"]');

      // セッション開始
      await page.click('[data-testid="start-session-button"]');
      await page.waitForSelector('[data-testid="session-mode-selector"]');

      // シングルプレイモード選択
      await page.click('[data-testid="single-play-mode"]');
      await page.waitForSelector('[data-testid="character-selector"]');

      // キャラクター選択
      const characterOption = page.locator('[data-testid="character-option"]').first();
      if (await characterOption.count() > 0) {
        await characterOption.click();
      } else {
        // キャラクターがない場合はスキップ（デフォルトキャラクター使用）
        console.log('No character found, using default');
      }

      // セッション開始確認
      await page.click('[data-testid="confirm-session-start"]');
      await page.waitForSelector('[data-testid="session-interface"]', { timeout: 10000 });
    });

    // ============================================================================
    // 2. タイムラインイベントの発生確認
    // ============================================================================
    await test.step('タイムラインイベントの発生', async () => {
      // AIからの初期メッセージを待つ
      await page.waitForSelector('[data-testid="ai-message"]', { timeout: 15000 });
      
      // イベント発生インジケーターを確認
      const eventIndicator = page.locator('[data-testid="event-indicator"]');
      await expect(eventIndicator).toBeVisible({ timeout: 20000 });

      // イベント詳細を確認
      const eventNotification = page.locator('[data-testid="event-notification"]');
      await expect(eventNotification).toBeVisible();
      
      // イベントタイプを確認
      const eventType = await eventNotification.getAttribute('data-event-type');
      expect(['encounter', 'trap', 'discovery', 'story']).toContain(eventType);
    });

    // ============================================================================
    // 3. 敵接敵時の自動戦闘開始確認
    // ============================================================================
    await test.step('敵との遭遇と戦闘開始', async () => {
      // 戦闘イベントを待つか、探索して遭遇を誘発
      const combatIndicator = page.locator('[data-testid="combat-indicator"]');
      
      // 戦闘が始まらない場合は移動して遭遇を誘発
      if (await combatIndicator.count() === 0) {
        await page.fill('[data-testid="chat-input"]', '北の通路を進む');
        await page.click('[data-testid="send-message"]');
        
        // AI応答を待つ
        await page.waitForSelector('[data-testid="ai-message"]:last-child', { timeout: 10000 });
      }

      // 戦闘開始を確認（タイムアウトを長めに設定）
      await expect(combatIndicator).toBeVisible({ timeout: 30000 });
      
      // 戦闘UIが表示されることを確認
      await expect(page.locator('[data-testid="combat-interface"]')).toBeVisible();
      
      // イニシアチブ順序が表示されることを確認
      await expect(page.locator('[data-testid="initiative-order"]')).toBeVisible();
    });

    // ============================================================================
    // 4. トラップイベントの発生・解決確認
    // ============================================================================
    await test.step('トラップイベントの処理', async () => {
      // トラップイベントを探す
      const trapEvent = page.locator('[data-testid="trap-event"]');
      
      if (await trapEvent.count() > 0) {
        // ダイス判定ダイアログが表示されることを確認
        await expect(page.locator('[data-testid="dice-dialog"]')).toBeVisible({ timeout: 5000 });
        
        // 指定されたダイスを確認
        const requiredDice = await page.locator('[data-testid="required-dice"]').textContent();
        expect(requiredDice).toMatch(/d\d+/); // d20, d6などの形式
        
        // ダイスロール実行
        await page.click('[data-testid="roll-dice-button"]');
        
        // 結果表示を待つ
        await page.waitForSelector('[data-testid="dice-result"]', { timeout: 5000 });
        
        // 結果に基づく処理を確認
        await expect(page.locator('[data-testid="trap-result"]')).toBeVisible();
      }
    });

    // ============================================================================
    // 5. AI GMの応答確認
    // ============================================================================
    await test.step('AI GMの適切な応答', async () => {
      // プレイヤーアクションを送信
      await page.fill('[data-testid="chat-input"]', '周囲を調べる');
      await page.click('[data-testid="send-message"]');
      
      // AI応答を待つ
      const aiResponse = page.locator('[data-testid="ai-message"]:last-child');
      await expect(aiResponse).toBeVisible({ timeout: 15000 });
      
      // 応答内容を確認
      const responseText = await aiResponse.textContent();
      expect(responseText).toBeTruthy();
      expect(responseText!.length).toBeGreaterThan(20); // 意味のある応答であること
      
      // コンテキストに基づいた応答であることを確認
      expect(responseText).toMatch(/調べ|発見|見つ|気づ|観察/);
    });

    // ============================================================================
    // 6. セッション進行状況の保存確認
    // ============================================================================
    await test.step('進行状況の自動保存', async () => {
      // 自動保存インジケーターを確認
      const saveIndicator = page.locator('[data-testid="save-indicator"]');
      await expect(saveIndicator).toBeVisible();
      
      // 保存完了を待つ
      await expect(saveIndicator).toHaveText(/保存完了|Saved/, { timeout: 10000 });
      
      // セッション状態を確認
      const sessionState = page.locator('[data-testid="session-state"]');
      const stateText = await sessionState.textContent();
      expect(stateText).toMatch(/進行中|In Progress/);
    });

    // ============================================================================
    // 7. セッション完了時の結果画面表示
    // ============================================================================
    await test.step('セッション完了と結果表示', async () => {
      // セッション完了をトリガー（クエスト完了または時間経過）
      // ここでは簡易的にセッション終了ボタンを使用
      await page.click('[data-testid="end-session-button"]');
      
      // 確認ダイアログ
      await page.click('[data-testid="confirm-end-session"]');
      
      // 結果画面の表示を待つ
      await page.waitForSelector('[data-testid="session-result"]', { timeout: 10000 });
      
      // 結果要素の確認
      await expect(page.locator('[data-testid="session-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="experience-gained"]')).toBeVisible();
      await expect(page.locator('[data-testid="achievements"]')).toBeVisible();
      
      // 結果の保存
      await page.click('[data-testid="save-results"]');
      await expect(page.locator('[data-testid="result-saved-notification"]')).toBeVisible();
    });

    // ============================================================================
    // エビデンス収集
    // ============================================================================
    await test.step('スクリーンショット収集', async () => {
      await page.screenshot({
        path: 'evidence/session-completion-final-state.png',
        fullPage: true
      });
    });
  });

  test('セッション中断と再開', async () => {
    await test.step('セッション中断', async () => {
      // セッション開始（前のテストと同様）
      await page.click('[data-testid="campaign-card"]').first();
      await page.click('[data-testid="start-session-button"]');
      await page.click('[data-testid="single-play-mode"]');
      await page.click('[data-testid="confirm-session-start"]');
      await page.waitForSelector('[data-testid="session-interface"]');

      // 中断
      await page.click('[data-testid="pause-session-button"]');
      await page.click('[data-testid="confirm-pause"]');
      
      // 中断データ保存を確認
      await expect(page.locator('[data-testid="session-paused-notification"]')).toBeVisible();
    });

    await test.step('セッション再開', async () => {
      // ホームに戻る
      await page.goto('/');
      
      // 中断されたセッションを確認
      await expect(page.locator('[data-testid="paused-session-indicator"]')).toBeVisible();
      
      // 再開
      await page.click('[data-testid="resume-session-button"]');
      await page.waitForSelector('[data-testid="session-interface"]');
      
      // 状態が復元されていることを確認
      const sessionState = await page.locator('[data-testid="session-state"]').textContent();
      expect(sessionState).toBeTruthy();
    });
  });

  test('エラー処理とリカバリー', async () => {
    await test.step('ネットワークエラー時の処理', async () => {
      // ネットワークエラーをシミュレート
      await page.route('**/api/ai-agent/**', route => route.abort());
      
      // セッション開始
      await page.click('[data-testid="campaign-card"]').first();
      await page.click('[data-testid="start-session-button"]');
      await page.click('[data-testid="single-play-mode"]');
      await page.click('[data-testid="confirm-session-start"]');
      
      // メッセージ送信
      await page.fill('[data-testid="chat-input"]', 'テストメッセージ');
      await page.click('[data-testid="send-message"]');
      
      // エラー表示を確認
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible({ timeout: 5000 });
      
      // オフラインモードへの切り替えを確認
      await expect(page.locator('[data-testid="offline-mode-indicator"]')).toBeVisible();
      
      // ルートを復元
      await page.unroute('**/api/ai-agent/**');
    });
  });
});
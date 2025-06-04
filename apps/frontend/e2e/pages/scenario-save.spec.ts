import { test, expect, Page } from '@playwright/test';

/**
 * 📝 シナリオ保存機能テスト
 * 一般ユーザーがシナリオの進行状況を保存・復元するフローをテスト
 */
test.describe('シナリオ保存機能 - 一般ユーザー', () => {
  let page: Page;
  let scenarioName: string;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    scenarioName = `テストシナリオ_${Date.now()}`;
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should save scenario progress', async () => {
    test.setTimeout(60000);

    // ============================================================================
    // 1. セッション進行状況の記録
    // ============================================================================
    await test.step('セッションを開始して進行状況を作る', async () => {
      // キャンペーン選択
      const campaignCard = page.locator('[data-testid="campaign-card"]').first();
      if (await campaignCard.count() === 0) {
        await page.click('[data-testid="new-campaign-button"]');
        await page.fill('[data-testid="campaign-name"]', 'シナリオ保存テスト用キャンペーン');
        await page.click('[data-testid="save-campaign"]');
        await page.waitForSelector('[data-testid="campaign-card"]');
      }

      await page.click('[data-testid="campaign-card"]').first();
      await page.click('[data-testid="start-session-button"]');
      await page.click('[data-testid="single-play-mode"]');
      await page.click('[data-testid="confirm-session-start"]');
      await page.waitForSelector('[data-testid="session-interface"]');

      // いくつかアクションを実行
      await page.fill('[data-testid="chat-input"]', '東の扉を開ける');
      await page.click('[data-testid="send-message"]');
      await page.waitForSelector('[data-testid="ai-message"]:last-child', { timeout: 10000 });

      // ダイスロール
      await page.click('[data-testid="dice-roll-button"]');
      await page.selectOption('[data-testid="dice-select"]', 'd20');
      await page.click('[data-testid="roll-dice"]');
      await page.waitForSelector('[data-testid="dice-result"]');
      
      // アイテム取得をシミュレート
      await page.fill('[data-testid="chat-input"]', '宝箱を調べる');
      await page.click('[data-testid="send-message"]');
      await page.waitForSelector('[data-testid="ai-message"]:last-child', { timeout: 10000 });
    });

    // ============================================================================
    // 2. 途中保存機能の確認
    // ============================================================================
    await test.step('手動保存の実行', async () => {
      // 保存メニューを開く
      await page.click('[data-testid="session-menu-button"]');
      await page.click('[data-testid="save-progress-button"]');

      // 保存ダイアログ
      await page.waitForSelector('[data-testid="save-dialog"]');
      await page.fill('[data-testid="save-name"]', scenarioName);
      await page.fill('[data-testid="save-description"]', 'E2Eテスト用のシナリオ保存データ');
      
      // 保存タイプを選択
      await page.click('[data-testid="save-type-checkpoint"]');
      
      // 保存実行
      await page.click('[data-testid="confirm-save"]');
      
      // 保存完了通知を確認
      await expect(page.locator('[data-testid="save-success-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="save-success-notification"]')).toContainText('保存完了');
    });

    // ============================================================================
    // 3. 自動保存確認
    // ============================================================================
    await test.step('自動保存の動作確認', async () => {
      // 自動保存インジケーター確認
      const autoSaveIndicator = page.locator('[data-testid="auto-save-indicator"]');
      await expect(autoSaveIndicator).toBeVisible();

      // さらにアクションを実行して自動保存をトリガー
      await page.fill('[data-testid="chat-input"]', '階段を上る');
      await page.click('[data-testid="send-message"]');
      
      // 自動保存の実行を待つ（通常3秒間隔）
      await page.waitForTimeout(4000);
      
      // 自動保存完了を確認
      await expect(autoSaveIndicator).toHaveAttribute('data-status', 'saved');
      
      // 最終保存時刻が更新されていることを確認
      const lastSaveTime = await page.locator('[data-testid="last-save-time"]').textContent();
      expect(lastSaveTime).toMatch(/\d{1,2}:\d{2}/); // 時刻形式
    });

    // ============================================================================
    // 4. 保存されたシナリオの一覧表示確認
    // ============================================================================
    await test.step('保存済みシナリオ一覧の確認', async () => {
      // セッションを一旦終了
      await page.click('[data-testid="session-menu-button"]');
      await page.click('[data-testid="exit-session"]');
      await page.click('[data-testid="confirm-exit"]');

      // ホーム画面に戻る
      await page.waitForSelector('[data-testid="home-screen"]');
      
      // 保存済みシナリオセクションを確認
      await page.click('[data-testid="saved-scenarios-tab"]');
      await page.waitForSelector('[data-testid="saved-scenarios-list"]');
      
      // 保存したシナリオが表示されることを確認
      const savedScenario = page.locator(`[data-testid="scenario-item"]:has-text("${scenarioName}")`);
      await expect(savedScenario).toBeVisible();
      
      // シナリオ情報を確認
      await expect(savedScenario.locator('[data-testid="scenario-date"]')).toBeVisible();
      await expect(savedScenario.locator('[data-testid="scenario-progress"]')).toBeVisible();
      await expect(savedScenario.locator('[data-testid="scenario-playtime"]')).toBeVisible();
    });

    // ============================================================================
    // 5. 保存したシナリオからの再開機能確認
    // ============================================================================
    await test.step('シナリオの読み込みと再開', async () => {
      // 保存したシナリオを選択
      await page.click(`[data-testid="scenario-item"]:has-text("${scenarioName}")`);
      
      // 詳細プレビューを確認
      await page.waitForSelector('[data-testid="scenario-preview"]');
      await expect(page.locator('[data-testid="preview-character-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-location"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-inventory"]')).toBeVisible();
      
      // シナリオを読み込む
      await page.click('[data-testid="load-scenario-button"]');
      await page.click('[data-testid="confirm-load"]');
      
      // セッション画面に遷移
      await page.waitForSelector('[data-testid="session-interface"]', { timeout: 10000 });
      
      // 状態が復元されていることを確認
      const chatHistory = page.locator('[data-testid="chat-history"]');
      await expect(chatHistory).toContainText('東の扉を開ける');
      await expect(chatHistory).toContainText('宝箱を調べる');
      await expect(chatHistory).toContainText('階段を上る');
      
      // キャラクター状態の確認
      const characterStatus = page.locator('[data-testid="character-status"]');
      await expect(characterStatus).toBeVisible();
      
      // 現在地の確認
      const currentLocation = await page.locator('[data-testid="current-location"]').textContent();
      expect(currentLocation).toBeTruthy();
    });

    // ============================================================================
    // エビデンス収集
    // ============================================================================
    await test.step('スクリーンショット収集', async () => {
      // 復元されたセッション画面
      await page.screenshot({
        path: 'evidence/scenario-loaded-state.png',
        fullPage: true
      });
      
      // 保存済みシナリオ一覧
      await page.goto('/');
      await page.click('[data-testid="saved-scenarios-tab"]');
      await page.screenshot({
        path: 'evidence/saved-scenarios-list.png',
        fullPage: true
      });
    });
  });

  test('複数セーブスロットの管理', async () => {
    await test.step('複数のセーブデータ作成', async () => {
      // 3つの異なる進行状況を作成
      for (let i = 1; i <= 3; i++) {
        await page.goto('/');
        await page.click('[data-testid="campaign-card"]').first();
        await page.click('[data-testid="start-session-button"]');
        await page.click('[data-testid="single-play-mode"]');
        await page.click('[data-testid="confirm-session-start"]');
        
        // 異なる進行状況を作る
        await page.fill('[data-testid="chat-input"]', `セーブスロット${i}のアクション`);
        await page.click('[data-testid="send-message"]');
        await page.waitForSelector('[data-testid="ai-message"]:last-child');
        
        // 保存
        await page.click('[data-testid="session-menu-button"]');
        await page.click('[data-testid="save-progress-button"]');
        await page.fill('[data-testid="save-name"]', `セーブスロット${i}`);
        await page.click('[data-testid="confirm-save"]');
        await page.waitForSelector('[data-testid="save-success-notification"]');
        
        // セッション終了
        await page.click('[data-testid="session-menu-button"]');
        await page.click('[data-testid="exit-session"]');
        await page.click('[data-testid="confirm-exit"]');
      }
    });

    await test.step('セーブスロットの管理確認', async () => {
      await page.goto('/');
      await page.click('[data-testid="saved-scenarios-tab"]');
      
      // 3つのセーブスロットが存在することを確認
      for (let i = 1; i <= 3; i++) {
        await expect(page.locator(`text=セーブスロット${i}`)).toBeVisible();
      }
      
      // セーブデータの削除機能
      await page.click('[data-testid="scenario-item"]:has-text("セーブスロット1") [data-testid="scenario-menu"]');
      await page.click('[data-testid="delete-scenario"]');
      await page.click('[data-testid="confirm-delete"]');
      
      // 削除確認
      await expect(page.locator('text=セーブスロット1')).not.toBeVisible();
      await expect(page.locator('text=セーブスロット2')).toBeVisible();
      await expect(page.locator('text=セーブスロット3')).toBeVisible();
    });
  });

  test('オートセーブとクイックセーブ', async () => {
    await test.step('オートセーブ機能の確認', async () => {
      await page.goto('/');
      await page.click('[data-testid="campaign-card"]').first();
      await page.click('[data-testid="start-session-button"]');
      await page.click('[data-testid="single-play-mode"]');
      await page.click('[data-testid="confirm-session-start"]');
      
      // オートセーブ設定確認
      await page.click('[data-testid="session-settings"]');
      const autoSaveToggle = page.locator('[data-testid="auto-save-toggle"]');
      await expect(autoSaveToggle).toBeChecked();
      
      // オートセーブ間隔確認
      const autoSaveInterval = await page.locator('[data-testid="auto-save-interval"]').inputValue();
      expect(parseInt(autoSaveInterval)).toBe(3); // 3秒間隔
      
      // 設定を閉じる
      await page.click('[data-testid="close-settings"]');
    });

    await test.step('クイックセーブの実行', async () => {
      // クイックセーブショートカット（Ctrl+S）
      await page.keyboard.press('Control+S');
      
      // クイックセーブ通知を確認
      await expect(page.locator('[data-testid="quick-save-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-save-notification"]')).toContainText('クイックセーブ完了');
      
      // クイックセーブスロットの確認
      await page.click('[data-testid="session-menu-button"]');
      await page.click('[data-testid="load-menu"]');
      await expect(page.locator('[data-testid="quick-save-slot"]')).toBeVisible();
      
      // メニューを閉じる
      await page.keyboard.press('Escape');
    });
  });

  test('セーブデータの互換性とエラー処理', async () => {
    await test.step('破損データの処理', async () => {
      // 破損したセーブデータをシミュレート
      await page.evaluate(() => {
        localStorage.setItem('corrupted_save', '{"invalid": "json"');
      });
      
      await page.goto('/');
      await page.click('[data-testid="saved-scenarios-tab"]');
      
      // エラー表示を確認
      const errorMessage = page.locator('[data-testid="save-error-message"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage).toContainText('読み込みエラー');
      }
    });

    await test.step('バージョン互換性の確認', async () => {
      // 古いバージョンのセーブデータをシミュレート
      await page.evaluate(() => {
        const oldSave = {
          version: '0.1.0',
          data: { characterName: 'Test Character' }
        };
        localStorage.setItem('old_version_save', JSON.stringify(oldSave));
      });
      
      await page.reload();
      await page.click('[data-testid="saved-scenarios-tab"]');
      
      // 互換性警告を確認
      const compatWarning = page.locator('[data-testid="compatibility-warning"]');
      if (await compatWarning.count() > 0) {
        await expect(compatWarning).toContainText('旧バージョン');
      }
    });
  });
});
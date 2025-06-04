import { test, expect, Page } from '@playwright/test';

/**
 * 📅 タイムラインイベント管理テスト - 開発者モード
 * 開発者ユーザーがタイムライン上でイベントを管理するフローをテスト
 */
test.describe('タイムラインイベント管理テスト - 開発者モード', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 開発者モードを有効化
    await enableDeveloperMode(page);
    
    // タイムラインページに移動
    await page.click('[href="/timeline"]');
    await page.waitForLoadState('networkidle');
  });

  async function enableDeveloperMode(page: Page) {
    const devModeToggle = page.locator('[data-testid="developer-mode-toggle"]');
    if (await devModeToggle.isVisible()) {
      const isChecked = await devModeToggle.isChecked();
      if (!isChecked) {
        await devModeToggle.check();
        await page.waitForTimeout(500);
      }
    }
  }

  test('should add and configure timeline events', async () => {
    test.setTimeout(120000); // 2分のタイムアウト

    // ============================================================================
    // 1. タイムラインページアクセス確認
    // ============================================================================
    await test.step('タイムライン画面の表示確認', async () => {
      // タイムライン基本要素の確認
      await expect(page.locator('[data-testid="timeline-canvas"]')).toBeVisible();
      await expect(page.locator('[data-testid="timeline-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="timeline-legend"]')).toBeVisible();

      // 開発者モード専用要素の確認
      await expect(page.locator('[data-testid="add-event-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="event-templates"]')).toBeVisible();
      await expect(page.locator('[data-testid="timeline-settings"]')).toBeVisible();

      // タイムライン表示モードの確認
      await expect(page.locator('[data-testid="view-mode-daily"]')).toBeVisible();
      await expect(page.locator('[data-testid="view-mode-weekly"]')).toBeVisible();
      await expect(page.locator('[data-testid="view-mode-monthly"]')).toBeVisible();
    });

    // ============================================================================
    // 2. イベント追加フォーム動作確認
    // ============================================================================
    await test.step('新規イベント作成フォーム', async () => {
      await page.click('[data-testid="add-event-button"]');
      await page.waitForSelector('[data-testid="event-creation-dialog"]');

      // ステップ1: 基本情報
      await page.fill('[data-testid="event-title"]', '古代遺跡の発見');
      await page.fill('[data-testid="event-description"]', 
        '森の奥深くで発見された謎の古代遺跡。内部には古代文明の秘密が眠っている。');
      
      await page.selectOption('[data-testid="event-category"]', 'discovery');
      await page.selectOption('[data-testid="event-importance"]', 'high');

      // 次のステップへ
      await page.click('[data-testid="next-step-button"]');

      // ステップ2: 発生条件
      await page.waitForSelector('[data-testid="trigger-conditions-panel"]');
      
      // 時間条件
      await page.selectOption('[data-testid="trigger-time-type"]', 'specific-date');
      await page.fill('[data-testid="trigger-date"]', '2024-06-15');
      await page.selectOption('[data-testid="trigger-time"]', 'afternoon');

      // 場所条件
      await page.click('[data-testid="location-condition-enabled"]');
      await page.selectOption('[data-testid="trigger-location"]', 'forest-region');
      await page.fill('[data-testid="location-radius"]', '500'); // 500m範囲

      // 前提条件
      await page.click('[data-testid="prerequisite-enabled"]');
      await page.click('[data-testid="add-prerequisite"]');
      await page.selectOption('[data-testid="prerequisite-type"]', 'quest-completion');
      await page.fill('[data-testid="prerequisite-quest"]', '森の探索');
      
      await page.click('[data-testid="next-step-button"]');
    });

    // ============================================================================
    // 3. イベント発生条件設定確認
    // ============================================================================
    await test.step('詳細発生条件の設定', async () => {
      // ステップ3: 詳細条件
      await page.waitForSelector('[data-testid="detailed-conditions-panel"]');

      // キャラクター条件
      await page.click('[data-testid="character-condition-enabled"]');
      await page.click('[data-testid="required-character-add"]');
      await page.selectOption('[data-testid="required-character-select"]', 'any-pc');
      await page.fill('[data-testid="min-characters"]', '2');

      // アイテム条件
      await page.click('[data-testid="item-condition-enabled"]');
      await page.click('[data-testid="required-item-add"]');
      await page.fill('[data-testid="required-item-name"]', '古代の地図');
      await page.selectOption('[data-testid="item-condition-type"]', 'must-have');

      // 確率設定
      await page.fill('[data-testid="event-probability"]', '75'); // 75%の確率
      await page.selectOption('[data-testid="probability-check-type"]', 'daily-check');

      await page.click('[data-testid="next-step-button"]');
    });

    // ============================================================================
    // 4. イベントプレビュー機能確認
    // ============================================================================
    await test.step('イベント内容設定とプレビュー', async () => {
      // ステップ4: イベント内容
      await page.waitForSelector('[data-testid="event-content-panel"]');

      // イベントタイプ別設定
      await page.selectOption('[data-testid="event-type"]', 'exploration');
      
      // 探索イベントの詳細設定
      await page.fill('[data-testid="exploration-difficulty-dc"]', '15'); // DC 15
      await page.selectOption('[data-testid="exploration-skill"]', 'investigation');
      
      // 成功時の結果
      await page.click('[data-testid="success-result-tab"]');
      await page.fill('[data-testid="success-description"]', 
        '遺跡の入り口を発見した。古代の文字が刻まれた石扉が見える。');
      await page.click('[data-testid="success-reward-add"]');
      await page.selectOption('[data-testid="reward-type"]', 'experience');
      await page.fill('[data-testid="reward-amount"]', '200');

      // 失敗時の結果
      await page.click('[data-testid="failure-result-tab"]');
      await page.fill('[data-testid="failure-description"]', 
        '遺跡の痕跡は見つからなかった。もう少し詳しく調べる必要がありそうだ。');

      // プレビュー機能
      await page.click('[data-testid="preview-event"]');
      await page.waitForSelector('[data-testid="event-preview-dialog"]');
      
      // プレビュー内容の確認
      await expect(page.locator('[data-testid="preview-title"]')).toHaveText('古代遺跡の発見');
      await expect(page.locator('[data-testid="preview-conditions"]')).toContainText('2024-06-15');
      await expect(page.locator('[data-testid="preview-probability"]')).toContainText('75%');

      await page.click('[data-testid="close-preview"]');
      await page.click('[data-testid="next-step-button"]');
    });

    // ============================================================================
    // 5. イベント後続処理設定
    // ============================================================================
    await test.step('後続処理と世界状態変更', async () => {
      // ステップ5: 後続処理
      await page.waitForSelector('[data-testid="followup-actions-panel"]');

      // 世界状態の変更
      await page.click('[data-testid="world-state-change-enabled"]');
      await page.click('[data-testid="add-state-change"]');
      await page.selectOption('[data-testid="state-change-type"]', 'location-discovery');
      await page.fill('[data-testid="state-change-location"]', '古代遺跡');
      await page.selectOption('[data-testid="state-change-status"]', 'discovered');

      // 後続イベントの設定
      await page.click('[data-testid="followup-event-enabled"]');
      await page.click('[data-testid="add-followup-event"]');
      await page.fill('[data-testid="followup-event-title"]', '遺跡の内部探索');
      await page.fill('[data-testid="followup-delay"]', '1'); // 1日後
      await page.selectOption('[data-testid="followup-delay-unit"]', 'days');

      // フラグ設定
      await page.click('[data-testid="flag-setting-enabled"]');
      await page.click('[data-testid="add-flag"]');
      await page.fill('[data-testid="flag-name"]', 'ancient_ruins_discovered');
      await page.selectOption('[data-testid="flag-value"]', 'true');

      await page.click('[data-testid="next-step-button"]');
    });

    // ============================================================================
    // 6. 最終確認と保存
    // ============================================================================
    await test.step('イベント保存と一覧表示確認', async () => {
      // ステップ6: 最終確認
      await page.waitForSelector('[data-testid="final-confirmation-panel"]');

      // 設定内容のサマリー確認
      await expect(page.locator('[data-testid="summary-title"]')).toHaveText('古代遺跡の発見');
      await expect(page.locator('[data-testid="summary-category"]')).toContainText('発見');
      await expect(page.locator('[data-testid="summary-location"]')).toContainText('森');
      await expect(page.locator('[data-testid="summary-probability"]')).toContainText('75%');

      // 保存実行
      await page.click('[data-testid="save-event"]');
      await page.waitForSelector('[data-testid="event-saved-notification"]');

      // タイムライン上にイベントが表示されることを確認
      await expect(page.locator('[data-testid="timeline-event"]:has-text("古代遺跡の発見")')).toBeVisible();
    });

    // ============================================================================
    // 7. イベント編集機能確認
    // ============================================================================
    await test.step('既存イベントの編集', async () => {
      // 作成したイベントをクリック
      await page.click('[data-testid="timeline-event"]:has-text("古代遺跡の発見")');
      await page.waitForSelector('[data-testid="event-details-panel"]');

      // 編集ボタン
      await page.click('[data-testid="edit-event-button"]');
      await page.waitForSelector('[data-testid="event-creation-dialog"]');

      // 確率を変更
      await page.click('[data-testid="goto-step-3"]'); // 詳細条件ステップに移動
      await page.fill('[data-testid="event-probability"]', '85'); // 85%に変更

      // 変更を保存
      await page.click('[data-testid="goto-step-6"]'); // 最終確認に移動
      await page.click('[data-testid="save-event"]');
      await page.waitForSelector('[data-testid="event-updated-notification"]');
    });

    // ============================================================================
    // エビデンス収集
    // ============================================================================
    await test.step('スクリーンショット収集', async () => {
      // タイムライン全体ビュー
      await page.screenshot({
        path: 'evidence/timeline-event-management-overview.png',
        fullPage: true
      });

      // 月間ビューに切り替え
      await page.click('[data-testid="view-mode-monthly"]');
      await page.screenshot({
        path: 'evidence/timeline-monthly-view.png',
        fullPage: true
      });

      // イベント詳細表示
      await page.click('[data-testid="timeline-event"]:has-text("古代遺跡の発見")');
      await page.screenshot({
        path: 'evidence/timeline-event-details.png',
        fullPage: true
      });
    });
  });

  test('複数イベントの依存関係設定', async () => {
    await test.step('連続イベントチェーンの作成', async () => {
      const events = [
        {
          title: '謎の商人との出会い',
          category: 'social',
          order: 1
        },
        {
          title: '古代の地図の入手',
          category: 'discovery',
          order: 2,
          prerequisite: '謎の商人との出会い'
        },
        {
          title: '遺跡への道のり',
          category: 'travel',
          order: 3,
          prerequisite: '古代の地図の入手'
        }
      ];

      for (const event of events) {
        await page.click('[data-testid="add-event-button"]');
        await page.fill('[data-testid="event-title"]', event.title);
        await page.selectOption('[data-testid="event-category"]', event.category);

        // 前提条件設定
        if (event.prerequisite) {
          await page.click('[data-testid="next-step-button"]'); // 発生条件へ
          await page.click('[data-testid="prerequisite-enabled"]');
          await page.click('[data-testid="add-prerequisite"]');
          await page.selectOption('[data-testid="prerequisite-type"]', 'event-completion');
          await page.fill('[data-testid="prerequisite-event"]', event.prerequisite);
        }

        // 簡易保存
        await page.click('[data-testid="quick-save-event"]');
        await page.waitForSelector('[data-testid="event-saved-notification"]');
      }

      // 依存関係の可視化確認
      await page.click('[data-testid="show-dependencies"]');
      await expect(page.locator('[data-testid="dependency-lines"]')).toBeVisible();
    });
  });

  test('条件発火型イベントシステム', async () => {
    await test.step('様々なトリガー条件の設定', async () => {
      // 場所ベースイベント
      await page.click('[data-testid="add-event-button"]');
      await page.fill('[data-testid="event-title"]', '隠し部屋の発見');
      await page.click('[data-testid="next-step-button"]');
      
      await page.selectOption('[data-testid="trigger-type"]', 'location-based');
      await page.selectOption('[data-testid="trigger-location"]', 'library');
      await page.click('[data-testid="trigger-condition-add"]');
      await page.selectOption('[data-testid="condition-type"]', 'item-interaction');
      await page.fill('[data-testid="condition-item"]', '古い本棚');

      await page.click('[data-testid="quick-save-event"]');

      // 時間ベースイベント
      await page.click('[data-testid="add-event-button"]');
      await page.fill('[data-testid="event-title"]', '夜中の訪問者');
      await page.click('[data-testid="next-step-button"]');
      
      await page.selectOption('[data-testid="trigger-type"]', 'time-based');
      await page.selectOption('[data-testid="trigger-time"]', 'midnight');
      await page.click('[data-testid="trigger-condition-add"]');
      await page.selectOption('[data-testid="condition-type"]', 'location-type');
      await page.selectOption('[data-testid="condition-location-type"]', 'inn');

      await page.click('[data-testid="quick-save-event"]');

      // キャラクター状態ベースイベント
      await page.click('[data-testid="add-event-button"]');
      await page.fill('[data-testid="event-title"]', '体力限界による休息');
      await page.click('[data-testid="next-step-button"]');
      
      await page.selectOption('[data-testid="trigger-type"]', 'character-state');
      await page.click('[data-testid="trigger-condition-add"]');
      await page.selectOption('[data-testid="condition-type"]', 'hp-threshold');
      await page.fill('[data-testid="condition-hp-percentage"]', '25'); // HP25%以下

      await page.click('[data-testid="quick-save-event"]');
    });
  });

  test('トラップイベントシステム', async () => {
    await test.step('トラップの設定と発動条件', async () => {
      await page.click('[data-testid="add-event-button"]');
      await page.fill('[data-testid="event-title"]', '圧力プレートトラップ');
      await page.selectOption('[data-testid="event-category"]', 'trap');
      await page.click('[data-testid="next-step-button"]');

      // トラップ固有設定
      await page.click('[data-testid="trap-settings-tab"]');
      await page.selectOption('[data-testid="trap-type"]', 'pressure-plate');
      await page.fill('[data-testid="trap-detection-dc"]', '15');
      await page.fill('[data-testid="trap-disarm-dc"]', '12');
      
      // 発動条件
      await page.selectOption('[data-testid="trap-trigger"]', 'movement');
      await page.fill('[data-testid="trap-area"]', '5'); // 5フィート範囲

      // トラップ効果
      await page.click('[data-testid="trap-effects-tab"]');
      await page.selectOption('[data-testid="trap-damage-type"]', 'piercing');
      await page.fill('[data-testid="trap-damage"]', '2d6');
      await page.fill('[data-testid="trap-save-dc"]', '13');
      await page.selectOption('[data-testid="trap-save-type"]', 'dexterity');

      // 検出・解除の設定
      await page.click('[data-testid="trap-detection-tab"]');
      await page.selectOption('[data-testid="detection-skill"]', 'perception');
      await page.selectOption('[data-testid="disarm-skill"]', 'thieves-tools');
      await page.click('[data-testid="allow-multiple-attempts"]');

      await page.click('[data-testid="quick-save-event"]');
      await page.waitForSelector('[data-testid="event-saved-notification"]');

      // トラップイベントの表示確認
      const trapEvent = page.locator('[data-testid="timeline-event"]:has-text("圧力プレートトラップ")');
      await expect(trapEvent).toHaveClass(/trap-event/);
    });
  });

  test('イベント結果による世界状態変化', async () => {
    await test.step('世界状態管理システム', async () => {
      // 世界状態を変更するイベント作成
      await page.click('[data-testid="add-event-button"]');
      await page.fill('[data-testid="event-title"]', '村長との交渉');
      await page.selectOption('[data-testid="event-category"]', 'social');

      // 結果による分岐設定
      await page.click('[data-testid="goto-step-4"]'); // イベント内容へ
      await page.selectOption('[data-testid="event-type"]', 'negotiation');

      // 成功時の世界状態変更
      await page.click('[data-testid="success-result-tab"]');
      await page.click('[data-testid="add-world-state-change"]');
      await page.selectOption('[data-testid="state-type"]', 'faction-reputation');
      await page.selectOption('[data-testid="faction-name"]', 'village-council');
      await page.fill('[data-testid="reputation-change"]', '+20');

      // 失敗時の世界状態変更
      await page.click('[data-testid="failure-result-tab"]');
      await page.click('[data-testid="add-world-state-change"]');
      await page.selectOption('[data-testid="state-type"]', 'faction-reputation');
      await page.selectOption('[data-testid="faction-name"]', 'village-council');
      await page.fill('[data-testid="reputation-change"]', '-10');

      // 世界状態への影響を可視化
      await page.click('[data-testid="preview-world-impact"]');
      await page.waitForSelector('[data-testid="world-impact-preview"]');
      
      await expect(page.locator('[data-testid="impact-success"]')).toContainText('村議会: +20');
      await expect(page.locator('[data-testid="impact-failure"]')).toContainText('村議会: -10');

      await page.click('[data-testid="close-impact-preview"]');
      await page.click('[data-testid="quick-save-event"]');
    });
  });

  test('イベントテストとシミュレーション', async () => {
    await test.step('イベント実行シミュレーション', async () => {
      // 既存イベントを選択
      await page.click('[data-testid="timeline-event"]').first();
      await page.waitForSelector('[data-testid="event-details-panel"]');

      // テストモードに入る
      await page.click('[data-testid="test-event-button"]');
      await page.waitForSelector('[data-testid="event-test-dialog"]');

      // テスト用パラメータ設定
      await page.selectOption('[data-testid="test-character"]', 'test-character-1');
      await page.selectOption('[data-testid="test-location"]', 'test-location');
      await page.fill('[data-testid="test-date"]', '2024-06-15');

      // シミュレーション実行
      await page.click('[data-testid="run-simulation"]');
      await page.waitForSelector('[data-testid="simulation-result"]');

      // 結果確認
      await expect(page.locator('[data-testid="simulation-outcome"]')).toBeVisible();
      await expect(page.locator('[data-testid="dice-rolls-log"]')).toBeVisible();
      await expect(page.locator('[data-testid="state-changes-log"]')).toBeVisible();

      // 複数回実行して確率検証
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="run-simulation"]');
        await page.waitForTimeout(500);
      }

      // 統計情報確認
      await expect(page.locator('[data-testid="success-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-outcome"]')).toBeVisible();

      await page.click('[data-testid="close-test-dialog"]');
    });
  });
});
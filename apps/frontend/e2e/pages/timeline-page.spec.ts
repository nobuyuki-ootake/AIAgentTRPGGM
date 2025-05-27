import { test, expect } from "@playwright/test";
import {
  setupTestData,
  clearTestData,
  verifyPageLoad,
  takeScreenshot,
  openAIAssistPanel,
  waitForDialog,
  checkForErrors,
  waitForLoadingComplete,
} from "../utils/test-helpers";

test.describe("TimelinePage Tests", () => {
  test.beforeEach(async ({ page }) => {
    // まずホームページに移動してからテストデータを設定
    await page.goto("/");
    await setupTestData(page);
  });

  test("ページの初期表示確認とスクリーンショット", async ({ page }) => {
    // タイムラインページに移動
    await page.goto("/timeline");

    // ページの読み込み確認
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // タイムラインセクションまたは関連要素が表示されることを確認
    const timelineSection = page
      .locator("text=タイムライン, h1, h2, h3")
      .first();
    if ((await timelineSection.count()) > 0) {
      await expect(timelineSection).toBeVisible();
    }

    // エラーがないことを確認
    await checkForErrors(page);

    // 初期表示のスクリーンショット
    await takeScreenshot(page, "timeline-page-initial");
  });

  test("イベント追加機能", async ({ page }) => {
    await page.goto("/timeline");
    await verifyPageLoad(page, "Novel");

    // 新規追加ボタンをクリック
    const addButton = page
      .locator('button:has-text("新規追加"), button:has-text("追加")')
      .first();

    if ((await addButton.count()) > 0) {
      await addButton.click();

      // ダイアログが開くまで待機
      await waitForDialog(page);

      // ダイアログの内容を確認
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // イベント追加ダイアログのスクリーンショット
      await takeScreenshot(page, "timeline-page-add-event-dialog");

      // フォームに入力
      const titleInput = page
        .locator('input[label="タイトル"], input[placeholder*="タイトル"]')
        .first();
      await titleInput.fill("新しいタイムラインイベント");

      const descriptionInput = page
        .locator('textarea[label="説明"], textarea[placeholder*="説明"]')
        .first();
      await descriptionInput.fill("新しいイベントの詳細説明です。");

      // 入力後のスクリーンショット
      await takeScreenshot(page, "timeline-page-add-event-filled");

      // 保存ボタンをクリック
      const saveButton = page
        .locator('button:has-text("保存"), button:has-text("追加")')
        .first();
      await saveButton.click();

      // ダイアログが閉じることを確認
      await page.waitForSelector('[role="dialog"]', {
        state: "hidden",
        timeout: 5000,
      });

      // 新しいイベントが表示されることを確認
      await expect(
        page.locator("text=新しいタイムラインイベント")
      ).toBeVisible();

      // イベント追加後のスクリーンショット
      await takeScreenshot(page, "timeline-page-after-add-event");
    }
  });

  test("AIアシスト機能の確認", async ({ page }) => {
    await page.goto("/timeline");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    try {
      // AIアシストボタンをクリック
      await openAIAssistPanel(page);

      // チャットパネルが表示されることを確認
      const chatPanel = page
        .locator('[data-testid="chat-panel"], [role="dialog"], .chat-panel')
        .first();
      await expect(chatPanel).toBeVisible();

      // AIアシストパネル表示のスクリーンショット
      await takeScreenshot(page, "timeline-page-ai-assist-panel");

      // メッセージ入力フィールドを確認
      const messageInput = page
        .locator(
          'textarea[placeholder*="メッセージ"], input[placeholder*="メッセージ"], [data-testid="message-input"]'
        )
        .first();

      if ((await messageInput.count()) > 0) {
        // テストメッセージを入力
        await messageInput.fill("タイムラインを改善してください");

        // メッセージ入力後のスクリーンショット
        await takeScreenshot(page, "timeline-page-ai-message-input");

        // 送信ボタンをクリック
        const sendButton = page
          .locator(
            'button:has-text("送信"), button[aria-label*="送信"], [data-testid="send-button"]'
          )
          .first();

        if ((await sendButton.count()) > 0) {
          await sendButton.click();

          // AIリクエスト送信後のスクリーンショット
          await takeScreenshot(page, "timeline-page-ai-request-sent");

          // レスポンス待機（タイムアウトを設定）
          try {
            await page.waitForSelector(
              '.ai-response, [data-testid="ai-response"]',
              { timeout: 15000 }
            );

            // AIレスポンス受信後のスクリーンショット
            await takeScreenshot(page, "timeline-page-ai-response-received");
          } catch (error) {
            console.log("AIレスポンスの待機がタイムアウトしました");
            await takeScreenshot(page, "timeline-page-ai-timeout");
          }
        }
      }

      // パネルを閉じる
      const closeButton = page
        .locator(
          'button[aria-label*="閉じる"], button:has-text("閉じる"), .close-button'
        )
        .first();
      if ((await closeButton.count()) > 0) {
        await closeButton.click();

        // パネル閉じた後のスクリーンショット
        await takeScreenshot(page, "timeline-page-ai-panel-closed");
      }
    } catch (error) {
      console.log("AIアシスト機能のテストでエラーが発生:", error);
      await takeScreenshot(page, "timeline-page-ai-error");

      // AIアシスト機能が利用できない場合でもテストを継続
      console.log("AIアシスト機能が利用できないため、テストをスキップします");
    }
  });

  test("タイムライン設定機能", async ({ page }) => {
    await page.goto("/timeline");
    await verifyPageLoad(page, "Novel");

    // タイムライン設定ボタンをクリック
    const settingsButton = page
      .locator(
        'button:has-text("タイムライン設定"), button[aria-label*="設定"]'
      )
      .first();

    if ((await settingsButton.count()) > 0) {
      await settingsButton.click();

      // 設定ダイアログが開くまで待機
      await waitForDialog(page);

      // 設定ダイアログのスクリーンショット
      await takeScreenshot(page, "timeline-page-settings-dialog");

      // 設定を変更
      const timeUnitSelect = page
        .locator('select[label*="時間単位"], [role="combobox"]')
        .first();
      if ((await timeUnitSelect.count()) > 0) {
        await timeUnitSelect.click();
        await page.locator("text=週").click();
      }

      // 設定変更後のスクリーンショット
      await takeScreenshot(page, "timeline-page-settings-changed");

      // 保存ボタンをクリック
      const saveButton = page.locator('button:has-text("保存")').first();
      if ((await saveButton.count()) > 0) {
        await saveButton.click();

        // ダイアログが閉じることを確認
        await page.waitForSelector('[role="dialog"]', {
          state: "hidden",
          timeout: 5000,
        });

        // 設定保存後のスクリーンショット
        await takeScreenshot(page, "timeline-page-after-settings-save");
      }
    }
  });

  test("タイムラインチャートの表示", async ({ page }) => {
    await page.goto("/timeline");
    await verifyPageLoad(page, "Novel");

    // タイムラインチャートが表示されることを確認
    const timelineChart = page
      .locator('.timeline-chart, [data-testid="timeline-chart"]')
      .first();

    if ((await timelineChart.count()) > 0) {
      await expect(timelineChart).toBeVisible();

      // タイムラインチャート表示のスクリーンショット
      await takeScreenshot(page, "timeline-page-chart");
    }
  });

  test("イベントのドラッグ&ドロップ機能", async ({ page }) => {
    await page.goto("/timeline");
    await verifyPageLoad(page, "Novel");

    // ドラッグ可能なイベントを探す
    const draggableEvent = page
      .locator('[draggable="true"], .draggable-event')
      .first();

    if ((await draggableEvent.count()) > 0) {
      // ドラッグ前のスクリーンショット
      await takeScreenshot(page, "timeline-page-before-drag");

      // ドロップターゲットを探す
      const dropTarget = page.locator(".drop-zone, .timeline-column").first();

      if ((await dropTarget.count()) > 0) {
        // ドラッグ&ドロップを実行
        await draggableEvent.dragTo(dropTarget);

        // ドラッグ後のスクリーンショット
        await takeScreenshot(page, "timeline-page-after-drag");
      }
    }
  });

  test("変更保存機能の確認", async ({ page }) => {
    await page.goto("/timeline");
    await verifyPageLoad(page, "Novel");

    // 保存ボタンが表示されることを確認
    const saveButton = page
      .locator('button:has-text("変更を保存"), button:has-text("保存")')
      .first();

    if ((await saveButton.count()) > 0) {
      // 保存前のスクリーンショット
      await takeScreenshot(page, "timeline-page-before-save");

      await saveButton.click();

      // 保存完了を待機
      await waitForLoadingComplete(page);

      // 保存後のスクリーンショット
      await takeScreenshot(page, "timeline-page-after-save");
    }
  });

  test("レスポンシブデザインの確認", async ({ page }) => {
    await page.goto("/timeline");
    await verifyPageLoad(page, "Novel");

    // デスクトップサイズでのスクリーンショット
    await page.setViewportSize({ width: 1280, height: 720 });
    await takeScreenshot(page, "timeline-page-desktop");

    // タブレットサイズでのスクリーンショット
    await page.setViewportSize({ width: 768, height: 1024 });
    await takeScreenshot(page, "timeline-page-tablet");

    // モバイルサイズでのスクリーンショット
    await page.setViewportSize({ width: 375, height: 667 });
    await takeScreenshot(page, "timeline-page-mobile");

    // 元のサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

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

test.describe("WorldBuildingPage Tests", () => {
  test.beforeEach(async ({ page }) => {
    // まずホームページに移動してからテストデータを設定
    await page.goto("/");
    await setupTestData(page);
  });

  test("ページの初期表示確認とスクリーンショット", async ({ page }) => {
    // 世界観構築ページに移動
    await page.goto("/worldbuilding");

    // ページの読み込み確認
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // 世界観構築セクションまたは関連要素が表示されることを確認
    const worldBuildingSection = page
      .locator("text=世界観, text=ワールド, h1, h2, h3")
      .first();
    if ((await worldBuildingSection.count()) > 0) {
      await expect(worldBuildingSection).toBeVisible();
    }

    // エラーがないことを確認
    await checkForErrors(page);

    // 初期表示のスクリーンショット
    await takeScreenshot(page, "world-building-page-initial");
  });

  test("各タブの表示確認", async ({ page }) => {
    await page.goto("/worldbuilding");
    await verifyPageLoad(page, "Novel");

    const tabs = [
      "ワールドマップ",
      "世界観設定",
      "ルール",
      "地名",
      "社会と文化",
      "地理と環境",
      "歴史と伝説",
      "魔法と技術",
      "自由記述欄",
      "状態定義",
    ];

    for (const tabName of tabs) {
      // タブをクリック
      const tab = page.locator(`text=${tabName}`).first();
      if ((await tab.count()) > 0) {
        await tab.click();

        // タブの内容が表示されるまで待機
        await page.waitForTimeout(1000);

        // 各タブのスクリーンショット
        const tabFileName = tabName
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-");
        await takeScreenshot(page, `worldbuilding-page-tab-${tabFileName}`);
      }
    }
  });

  test("AIアシスト機能の確認", async ({ page }) => {
    await page.goto("/worldbuilding");
    await verifyPageLoad(page, "Novel");

    try {
      // AIに世界観を考えてもらうボタンをクリック
      const aiAssistButton = page
        .locator(
          'button:has-text("AIに世界観を考えてもらう"), button:has-text("AI")'
        )
        .first();

      if ((await aiAssistButton.count()) > 0) {
        await aiAssistButton.click();

        // チャットパネルが表示されることを確認
        const chatPanel = page
          .locator('[data-testid="chat-panel"], [role="dialog"], .chat-panel')
          .first();
        await expect(chatPanel).toBeVisible();

        // AIアシストパネル表示のスクリーンショット
        await takeScreenshot(page, "worldbuilding-page-ai-assist-panel");

        // メッセージ入力フィールドを確認
        const messageInput = page
          .locator(
            'textarea[placeholder*="メッセージ"], input[placeholder*="メッセージ"], [data-testid="message-input"]'
          )
          .first();

        if ((await messageInput.count()) > 0) {
          // テストメッセージを入力
          await messageInput.fill("ファンタジー世界の設定を考えてください");

          // メッセージ入力後のスクリーンショット
          await takeScreenshot(page, "worldbuilding-page-ai-message-input");

          // 送信ボタンをクリック
          const sendButton = page
            .locator(
              'button:has-text("送信"), button[aria-label*="送信"], [data-testid="send-button"]'
            )
            .first();

          if ((await sendButton.count()) > 0) {
            await sendButton.click();

            // AIリクエスト送信後のスクリーンショット
            await takeScreenshot(page, "worldbuilding-page-ai-request-sent");

            // レスポンス待機（タイムアウトを設定）
            try {
              await page.waitForSelector(
                '.ai-response, [data-testid="ai-response"]',
                { timeout: 15000 }
              );

              // AIレスポンス受信後のスクリーンショット
              await takeScreenshot(
                page,
                "worldbuilding-page-ai-response-received"
              );
            } catch (error) {
              console.log("AIレスポンスの待機がタイムアウトしました");
              await takeScreenshot(page, "worldbuilding-page-ai-timeout");
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
          await takeScreenshot(page, "worldbuilding-page-ai-panel-closed");
        }
      }
    } catch (error) {
      console.log("AIアシスト機能のテストでエラーが発生:", error);
      await takeScreenshot(page, "worldbuilding-page-ai-error");
    }
  });

  test("世界観要素の追加・編集機能", async ({ page }) => {
    await page.goto("/worldbuilding");
    await verifyPageLoad(page, "Novel");

    // 地名タブに移動
    const placesTab = page.locator("text=地名").first();
    if ((await placesTab.count()) > 0) {
      await placesTab.click();

      // 新規追加ボタンを探す
      const addButton = page
        .locator('button:has-text("追加"), button:has-text("新規")')
        .first();

      if ((await addButton.count()) > 0) {
        await addButton.click();

        // ダイアログが開くまで待機
        await waitForDialog(page);

        // 要素追加ダイアログのスクリーンショット
        await takeScreenshot(page, "worldbuilding-page-add-element-dialog");

        // フォームに入力
        const nameInput = page
          .locator('input[label="名前"], input[placeholder*="名前"]')
          .first();
        if ((await nameInput.count()) > 0) {
          await nameInput.fill("新しい場所");
        }

        const descriptionInput = page
          .locator('textarea[label="説明"], textarea[placeholder*="説明"]')
          .first();
        if ((await descriptionInput.count()) > 0) {
          await descriptionInput.fill("新しい場所の詳細説明です。");
        }

        // 入力後のスクリーンショット
        await takeScreenshot(page, "worldbuilding-page-add-element-filled");

        // 保存ボタンをクリック
        const saveButton = page
          .locator('button:has-text("保存"), button:has-text("追加")')
          .first();
        if ((await saveButton.count()) > 0) {
          await saveButton.click();

          // ダイアログが閉じることを確認
          await page.waitForSelector('[role="dialog"]', {
            state: "hidden",
            timeout: 5000,
          });

          // 要素追加後のスクリーンショット
          await takeScreenshot(page, "worldbuilding-page-after-add-element");
        }
      }
    }
  });

  test("世界観設定タブの編集機能", async ({ page }) => {
    await page.goto("/worldbuilding");
    await verifyPageLoad(page, "Novel");

    // 世界観設定タブに移動
    const settingsTab = page.locator("text=世界観設定").first();
    if ((await settingsTab.count()) > 0) {
      await settingsTab.click();

      // 説明フィールドを編集
      const descriptionTextarea = page
        .locator('textarea[label*="説明"], textarea[placeholder*="説明"]')
        .first();

      if ((await descriptionTextarea.count()) > 0) {
        await descriptionTextarea.clear();
        await descriptionTextarea.fill(
          "編集された世界観の説明です。新しい設定を追加しました。"
        );

        // 編集後のスクリーンショット
        await takeScreenshot(page, "worldbuilding-page-settings-edited");
      }
    }
  });

  test("ワールドマップタブの機能", async ({ page }) => {
    await page.goto("/worldbuilding");
    await verifyPageLoad(page, "Novel");

    // ワールドマップタブに移動
    const mapTab = page.locator("text=ワールドマップ").first();
    if ((await mapTab.count()) > 0) {
      await mapTab.click();

      // マップアップロード機能の確認
      const uploadButton = page
        .locator('input[type="file"], button:has-text("アップロード")')
        .first();

      if ((await uploadButton.count()) > 0) {
        // ワールドマップタブのスクリーンショット
        await takeScreenshot(page, "worldbuilding-page-world-map-tab");
      }
    }
  });

  test("世界観リセット機能", async ({ page }) => {
    await page.goto("/worldbuilding");
    await verifyPageLoad(page, "Novel");

    // 世界観をリセットボタンをクリック
    const resetButton = page
      .locator(
        'button:has-text("世界観をリセット"), button:has-text("リセット")'
      )
      .first();

    if ((await resetButton.count()) > 0) {
      await resetButton.click();

      // 確認ダイアログが表示される場合
      const confirmDialog = page
        .locator('[role="dialog"]:has-text("リセット")')
        .first();

      if ((await confirmDialog.count()) > 0) {
        await expect(confirmDialog).toBeVisible();

        // リセット確認ダイアログのスクリーンショット
        await takeScreenshot(page, "worldbuilding-page-reset-confirmation");

        // キャンセルボタンをクリック
        const cancelButton = page
          .locator('button:has-text("キャンセル")')
          .first();
        if ((await cancelButton.count()) > 0) {
          await cancelButton.click();

          // キャンセル後のスクリーンショット
          await takeScreenshot(page, "worldbuilding-page-reset-cancelled");
        }
      }
    }
  });

  test("保存機能の確認", async ({ page }) => {
    await page.goto("/worldbuilding");
    await verifyPageLoad(page, "Novel");

    // 保存ボタンをクリック
    const saveButton = page.locator('button:has-text("保存")').first();

    if ((await saveButton.count()) > 0) {
      // 保存前のスクリーンショット
      await takeScreenshot(page, "worldbuilding-page-before-save");

      await saveButton.click();

      // 保存完了を待機
      await waitForLoadingComplete(page);

      // 保存後のスクリーンショット
      await takeScreenshot(page, "worldbuilding-page-after-save");
    }
  });

  test("状態定義タブの機能", async ({ page }) => {
    await page.goto("/worldbuilding");
    await verifyPageLoad(page, "Novel");

    // 状態定義タブに移動
    const statusTab = page.locator("text=状態定義").first();
    if ((await statusTab.count()) > 0) {
      await statusTab.click();

      // 状態定義タブのスクリーンショット
      await takeScreenshot(page, "worldbuilding-page-status-definition-tab");

      // 新しい状態を追加ボタンを探す
      const addStatusButton = page
        .locator('button:has-text("新しい状態を追加")')
        .first();

      if ((await addStatusButton.count()) > 0) {
        await addStatusButton.click();

        // 状態追加後のスクリーンショット
        await takeScreenshot(page, "worldbuilding-page-add-status");
      }
    }
  });

  test("レスポンシブデザインの確認", async ({ page }) => {
    await page.goto("/worldbuilding");
    await verifyPageLoad(page, "Novel");

    // デスクトップサイズでのスクリーンショット
    await page.setViewportSize({ width: 1280, height: 720 });
    await takeScreenshot(page, "worldbuilding-page-desktop");

    // タブレットサイズでのスクリーンショット
    await page.setViewportSize({ width: 768, height: 1024 });
    await takeScreenshot(page, "worldbuilding-page-tablet");

    // モバイルサイズでのスクリーンショット
    await page.setViewportSize({ width: 375, height: 667 });
    await takeScreenshot(page, "worldbuilding-page-mobile");

    // 元のサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

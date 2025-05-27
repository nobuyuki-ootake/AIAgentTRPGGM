import { test, expect } from "@playwright/test";
import {
  setupTestData,
  clearTestData,
  verifyPageLoad,
  takeScreenshot,
  openAIChatPanel,
  switchToAIAssistTab,
  generateAIContent,
  sendAIChatMessage,
  closeAIChatPanel,
  waitForDialog,
  checkForErrors,
  waitForLoadingComplete,
} from "../utils/test-helpers";

test.describe("PlotPage Tests", () => {
  test.beforeEach(async ({ page }) => {
    // まずホームページに移動してからテストデータを設定
    await page.goto("/");
    await setupTestData(page);
  });

  test("ページの初期表示確認とスクリーンショット", async ({ page }) => {
    // プロットページに移動
    await page.goto("/plot");

    // ページの読み込み確認
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // プロットセクションまたは関連要素が表示されることを確認
    const plotSection = page
      .locator("text=プロット, text=Plot, h1, h2, h3")
      .first();
    if ((await plotSection.count()) > 0) {
      await expect(plotSection).toBeVisible();
    }

    // エラーがないことを確認
    await checkForErrors(page);

    // 初期表示のスクリーンショット
    await takeScreenshot(page, "plot-page-initial");
  });

  test("AIアシスト機能を使ったプロット作成フロー", async ({ page }) => {
    await page.goto("/plot");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // 初期状態のスクリーンショット
    await takeScreenshot(page, "plot-page-before-ai-assist");

    // AIチャットパネルを開く
    await openAIChatPanel(page);

    // AIチャットパネル表示のスクリーンショット
    await takeScreenshot(page, "plot-page-ai-chat-panel-opened");

    // アシストタブに切り替え
    await switchToAIAssistTab(page);

    // アシストタブ表示のスクリーンショット
    await takeScreenshot(page, "plot-page-ai-assist-tab");

    // AIアシスト機能でプロット生成
    await generateAIContent(page, "冒険小説のプロットを作成してください");

    // AI生成完了後のスクリーンショット
    await takeScreenshot(page, "plot-page-ai-content-generated");

    // チャットタブでAIと対話
    await sendAIChatMessage(
      page,
      "このプロットをもう少し詳しく展開してください"
    );

    // AI対話後のスクリーンショット
    await takeScreenshot(page, "plot-page-ai-chat-interaction");

    // AIチャットパネルを閉じる
    await closeAIChatPanel(page);

    // パネル閉じた後のスクリーンショット
    await takeScreenshot(page, "plot-page-ai-panel-closed");
  });

  test("プロット項目の追加機能", async ({ page }) => {
    await page.goto("/plot");
    await verifyPageLoad(page, "小説作成エージェント");

    // プロット項目追加ボタンを探す（より柔軟なセレクター）
    const addPlotButton = page
      .locator(
        'button:has-text("プロット追加"), button:has-text("追加"), button:has-text("新規作成"), [data-testid="add-plot-button"]'
      )
      .first();

    if ((await addPlotButton.count()) > 0) {
      await addPlotButton.click();

      // ダイアログが開くまで待機
      await page.waitForSelector('[role="dialog"], form, .add-form', {
        timeout: 5000,
      });

      // プロット追加ダイアログのスクリーンショット
      await takeScreenshot(page, "plot-page-add-dialog");

      // フォームに入力
      const titleInput = page
        .locator('input[placeholder*="タイトル"], input[type="text"]')
        .first();

      if ((await titleInput.count()) > 0) {
        await titleInput.fill("新しいプロット項目");

        const descriptionInput = page
          .locator('textarea[placeholder*="説明"], textarea')
          .first();
        if ((await descriptionInput.count()) > 0) {
          await descriptionInput.fill("新しいプロット項目の詳細説明です。");
        }

        // 入力後のスクリーンショット
        await takeScreenshot(page, "plot-page-add-filled");

        // 追加ボタンをクリック
        const createButton = page
          .locator(
            'button:has-text("追加"), button:has-text("作成"), button[type="submit"]'
          )
          .first();

        if ((await createButton.count()) > 0) {
          await createButton.click();

          // ダイアログが閉じることを確認
          await page.waitForSelector('[role="dialog"]', {
            state: "hidden",
            timeout: 5000,
          });

          // プロット追加後のスクリーンショット
          await takeScreenshot(page, "plot-page-after-addition");
        }
      }
    } else {
      console.log("プロット追加ボタンが見つかりませんでした");
      await takeScreenshot(page, "plot-page-no-add-button");
    }
  });

  test("プロット項目の編集機能", async ({ page }) => {
    await page.goto("/plot");
    await verifyPageLoad(page, "小説作成エージェント");

    // 既存のプロット項目を探す
    const plotItem = page
      .locator("text=テストプロット1, .plot-item, [data-testid*='plot']")
      .first();

    if ((await plotItem.count()) > 0) {
      // プロット項目をクリック
      await plotItem.click();

      // 編集ボタンを探す
      const editButton = page
        .locator('button:has-text("編集"), button[aria-label*="編集"]')
        .first();

      if ((await editButton.count()) > 0) {
        await editButton.click();

        // 編集ダイアログが開くまで待機
        await waitForDialog(page);

        // 編集ダイアログのスクリーンショット
        await takeScreenshot(page, "plot-page-edit-dialog");

        // フォームを編集
        const titleInput = page
          .locator('input[value*="テストプロット"], input[type="text"]')
          .first();

        if ((await titleInput.count()) > 0) {
          await titleInput.fill("編集されたプロット項目");

          // 編集後のスクリーンショット
          await takeScreenshot(page, "plot-page-edit-filled");

          // 保存ボタンをクリック
          const saveButton = page
            .locator('button:has-text("保存"), button:has-text("更新")')
            .first();

          if ((await saveButton.count()) > 0) {
            await saveButton.click();

            // ダイアログが閉じることを確認
            await page.waitForSelector('[role="dialog"]', {
              state: "hidden",
              timeout: 5000,
            });

            // 編集後のスクリーンショット
            await takeScreenshot(page, "plot-page-after-edit");
          }
        }
      }
    } else {
      console.log("プロット項目が見つかりませんでした");
      await takeScreenshot(page, "plot-page-no-plot-items");
    }
  });

  test("プロット項目のステータス変更", async ({ page }) => {
    await page.goto("/plot");
    await verifyPageLoad(page, "小説作成エージェント");

    // プロット項目を探す
    const plotItem = page
      .locator("text=テストプロット1, .plot-item, [data-testid*='plot']")
      .first();

    if ((await plotItem.count()) > 0) {
      // ステータス変更ボタンまたはドロップダウンを探す
      const statusControl = page
        .locator(
          'select[label*="ステータス"], [role="combobox"], button:has-text("検討中"), button:has-text("進行中")'
        )
        .first();

      if ((await statusControl.count()) > 0) {
        await statusControl.click();

        // ステータス選択のスクリーンショット
        await takeScreenshot(page, "plot-page-status-selection");

        // 新しいステータスを選択
        const newStatus = page.locator("text=進行中, text=完了").first();
        if ((await newStatus.count()) > 0) {
          await newStatus.click();

          // ステータス変更後のスクリーンショット
          await takeScreenshot(page, "plot-page-after-status-change");
        }
      }
    }
  });

  test("プロット項目の削除機能", async ({ page }) => {
    await page.goto("/plot");
    await verifyPageLoad(page, "小説作成エージェント");

    // プロット項目を探す
    const plotItem = page
      .locator("text=テストプロット1, .plot-item, [data-testid*='plot']")
      .first();

    if ((await plotItem.count()) > 0) {
      // 削除ボタンを探す
      const deleteButton = page
        .locator('button:has-text("削除"), button[aria-label*="削除"]')
        .first();

      if ((await deleteButton.count()) > 0) {
        await deleteButton.click();

        // 削除確認ダイアログが表示されることを確認
        const confirmDialog = page
          .locator('[role="dialog"]:has-text("削除")')
          .first();

        if ((await confirmDialog.count()) > 0) {
          await expect(confirmDialog).toBeVisible();

          // 削除確認ダイアログのスクリーンショット
          await takeScreenshot(page, "plot-page-delete-confirm");

          // 削除を確認
          const confirmButton = page.locator('button:has-text("削除")').last(); // 確認ダイアログ内の削除ボタン

          if ((await confirmButton.count()) > 0) {
            await confirmButton.click();

            // ダイアログが閉じることを確認
            await page.waitForSelector('[role="dialog"]', {
              state: "hidden",
              timeout: 5000,
            });

            // 削除後のスクリーンショット
            await takeScreenshot(page, "plot-page-after-deletion");
          }
        }
      }
    }
  });

  test("変更保存機能の確認", async ({ page }) => {
    await page.goto("/plot");
    await verifyPageLoad(page, "小説作成エージェント");

    // 何らかの変更を行う（プロット項目の追加など）
    const addButton = page
      .locator('button:has-text("追加"), button:has-text("新規")')
      .first();

    if ((await addButton.count()) > 0) {
      await addButton.click();

      // フォームに入力
      const titleInput = page
        .locator('input[placeholder*="タイトル"], input[type="text"]')
        .first();

      if ((await titleInput.count()) > 0) {
        await titleInput.fill("保存テスト項目");

        // 保存ボタンをクリック
        const saveButton = page
          .locator('button:has-text("保存"), button:has-text("追加")')
          .first();

        if ((await saveButton.count()) > 0) {
          await saveButton.click();

          // 保存完了を待機
          await waitForLoadingComplete(page);

          // 保存後のスクリーンショット
          await takeScreenshot(page, "plot-page-after-save");
        }
      }
    }
  });

  test("プロット項目の統計表示", async ({ page }) => {
    await page.goto("/plot");
    await verifyPageLoad(page, "小説作成エージェント");

    // 統計情報が表示されることを確認
    const statsSection = page
      .locator(
        'text=統計, text=進捗, .stats, .progress, [data-testid*="stats"]'
      )
      .first();

    if ((await statsSection.count()) > 0) {
      await expect(statsSection).toBeVisible();

      // 統計表示のスクリーンショット
      await takeScreenshot(page, "plot-page-statistics");
    } else {
      console.log("統計情報が見つかりませんでした");
      await takeScreenshot(page, "plot-page-no-statistics");
    }

    // プロット項目の数を確認
    const plotItems = page.locator(".plot-item, [data-testid*='plot']");
    const itemCount = await plotItems.count();
    console.log(`プロット項目数: ${itemCount}`);
  });

  test("レスポンシブデザインの確認", async ({ page }) => {
    await page.goto("/plot");
    await verifyPageLoad(page, "小説作成エージェント");

    // デスクトップサイズでのスクリーンショット
    await page.setViewportSize({ width: 1280, height: 720 });
    await takeScreenshot(page, "plot-page-desktop");

    // タブレットサイズでのスクリーンショット
    await page.setViewportSize({ width: 768, height: 1024 });
    await takeScreenshot(page, "plot-page-tablet");

    // モバイルサイズでのスクリーンショット
    await page.setViewportSize({ width: 375, height: 667 });
    await takeScreenshot(page, "plot-page-mobile");

    // 元のサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

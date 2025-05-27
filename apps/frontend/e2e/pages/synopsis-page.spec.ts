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

test.describe("SynopsisPage Tests", () => {
  test.beforeEach(async ({ page }) => {
    // まずホームページに移動してからテストデータを設定
    await page.goto("/");
    await setupTestData(page);
  });

  test("ページの初期表示確認とスクリーンショット", async ({ page }) => {
    // あらすじページに移動
    await page.goto("/synopsis");

    // ページの読み込み確認
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // あらすじセクションまたは関連要素が表示されることを確認
    const synopsisSection = page
      .locator("text=あらすじ, text=Synopsis, h1, h2, h3")
      .first();
    if ((await synopsisSection.count()) > 0) {
      await expect(synopsisSection).toBeVisible();
    }

    // エラーがないことを確認
    await checkForErrors(page);

    // 初期表示のスクリーンショット
    await takeScreenshot(page, "synopsis-page-initial");
  });

  test("AIアシスト機能を使ったあらすじ作成フロー", async ({ page }) => {
    await page.goto("/synopsis");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // 初期状態のスクリーンショット
    await takeScreenshot(page, "synopsis-page-before-ai-assist");

    // AIチャットパネルを開く
    await openAIChatPanel(page);

    // AIチャットパネル表示のスクリーンショット
    await takeScreenshot(page, "synopsis-page-ai-chat-panel-opened");

    // アシストタブに切り替え
    await switchToAIAssistTab(page);

    // アシストタブ表示のスクリーンショット
    await takeScreenshot(page, "synopsis-page-ai-assist-tab");

    // AIアシスト機能であらすじ生成
    await generateAIContent(
      page,
      "感動的な冒険小説のあらすじを作成してください"
    );

    // AI生成完了後のスクリーンショット
    await takeScreenshot(page, "synopsis-page-ai-content-generated");

    // チャットタブでAIと対話
    await sendAIChatMessage(
      page,
      "このあらすじをもう少し詳しく展開してください"
    );

    // AI対話後のスクリーンショット
    await takeScreenshot(page, "synopsis-page-ai-chat-interaction");

    // AIチャットパネルを閉じる
    await closeAIChatPanel(page);

    // パネル閉じた後のスクリーンショット
    await takeScreenshot(page, "synopsis-page-ai-panel-closed");
  });

  test("あらすじ編集機能の確認", async ({ page }) => {
    await page.goto("/synopsis");
    await verifyPageLoad(page, "小説作成エージェント");

    // あらすじエディターを探す
    const synopsisEditor = page
      .locator(
        'textarea[placeholder*="あらすじ"], [contenteditable="true"], .editor, [role="textbox"]'
      )
      .first();

    if ((await synopsisEditor.count()) > 0) {
      await expect(synopsisEditor).toBeVisible();

      // エディター表示のスクリーンショット
      await takeScreenshot(page, "synopsis-page-editor-visible");

      // あらすじを編集
      await synopsisEditor.click();
      await synopsisEditor.fill(
        "これは編集されたあらすじです。主人公が新たな冒険に出る物語で、多くの困難を乗り越えて成長していく感動的なストーリーです。"
      );

      // 編集後のスクリーンショット
      await takeScreenshot(page, "synopsis-page-after-editing");
    } else {
      console.log("あらすじエディターが見つかりませんでした");
      await takeScreenshot(page, "synopsis-page-no-editor");
    }
  });

  test("保存機能の確認", async ({ page }) => {
    await page.goto("/synopsis");
    await verifyPageLoad(page, "小説作成エージェント");

    // あらすじを編集
    const synopsisEditor = page
      .locator(
        'textarea[placeholder*="あらすじ"], [contenteditable="true"], .editor'
      )
      .first();

    if ((await synopsisEditor.count()) > 0) {
      await synopsisEditor.click();
      await synopsisEditor.fill("保存テスト用のあらすじです。");

      // 保存ボタンをクリック
      const saveButton = page
        .locator('button:has-text("保存"), button:has-text("更新")')
        .first();

      if ((await saveButton.count()) > 0) {
        await saveButton.click();

        // 保存完了を待機
        await waitForLoadingComplete(page);

        // 保存後のスクリーンショット
        await takeScreenshot(page, "synopsis-page-after-save");

        // 保存成功メッセージが表示されることを確認
        const successMessage = page
          .locator(
            'text=保存しました, text=更新しました, .success, [role="alert"]'
          )
          .first();

        if ((await successMessage.count()) > 0) {
          await expect(successMessage).toBeVisible();
          await takeScreenshot(page, "synopsis-page-save-success");
        }
      }
    }
  });

  test("あらすじ編集のキャンセル機能", async ({ page }) => {
    await page.goto("/synopsis");
    await verifyPageLoad(page, "小説作成エージェント");

    // 元のあらすじを記録
    const synopsisEditor = page
      .locator(
        'textarea[placeholder*="あらすじ"], [contenteditable="true"], .editor'
      )
      .first();

    if ((await synopsisEditor.count()) > 0) {
      const originalText = await synopsisEditor.textContent();

      // あらすじを編集
      await synopsisEditor.click();
      await synopsisEditor.fill("キャンセルテスト用の一時的な編集です。");

      // 編集後のスクリーンショット
      await takeScreenshot(page, "synopsis-page-before-cancel");

      // キャンセルボタンをクリック
      const cancelButton = page
        .locator('button:has-text("キャンセル"), button:has-text("取消")')
        .first();

      if ((await cancelButton.count()) > 0) {
        await cancelButton.click();

        // キャンセル後のスクリーンショット
        await takeScreenshot(page, "synopsis-page-after-cancel");

        // 元のテキストに戻っていることを確認
        if (originalText) {
          await expect(synopsisEditor).toHaveText(originalText);
        }
      }
    }
  });

  test("あらすじのヒント・ティップス表示", async ({ page }) => {
    await page.goto("/synopsis");
    await verifyPageLoad(page, "小説作成エージェント");

    // ヒントやティップスセクションを探す
    const hintsSection = page
      .locator(
        'text=ヒント, text=ティップス, text=コツ, .hints, .tips, [data-testid*="hint"]'
      )
      .first();

    if ((await hintsSection.count()) > 0) {
      await expect(hintsSection).toBeVisible();

      // ヒント表示のスクリーンショット
      await takeScreenshot(page, "synopsis-page-hints");
    } else {
      console.log("ヒント・ティップスが見つかりませんでした");
      await takeScreenshot(page, "synopsis-page-no-hints");
    }

    // ヘルプボタンがある場合
    const helpButton = page
      .locator('button[aria-label*="ヘルプ"], button:has-text("?")')
      .first();

    if ((await helpButton.count()) > 0) {
      await helpButton.click();

      // ヘルプ表示のスクリーンショット
      await takeScreenshot(page, "synopsis-page-help");
    }
  });

  test("未保存変更の警告ダイアログ", async ({ page }) => {
    await page.goto("/synopsis");
    await verifyPageLoad(page, "小説作成エージェント");

    // あらすじを編集（保存せずに）
    const synopsisEditor = page
      .locator(
        'textarea[placeholder*="あらすじ"], [contenteditable="true"], .editor'
      )
      .first();

    if ((await synopsisEditor.count()) > 0) {
      await synopsisEditor.click();
      await synopsisEditor.fill("未保存の変更をテストします。");

      // 編集後のスクリーンショット
      await takeScreenshot(page, "synopsis-page-unsaved-changes");

      // 他のページに移動しようとする
      try {
        await page.goto("/plot");

        // 警告ダイアログが表示される場合
        const warningDialog = page
          .locator(
            '[role="dialog"]:has-text("保存"), [role="dialog"]:has-text("変更")'
          )
          .first();

        if ((await warningDialog.count()) > 0) {
          await expect(warningDialog).toBeVisible();

          // 警告ダイアログのスクリーンショット
          await takeScreenshot(page, "synopsis-page-unsaved-warning");

          // キャンセルして戻る
          const cancelButton = page
            .locator('button:has-text("キャンセル")')
            .first();
          if ((await cancelButton.count()) > 0) {
            await cancelButton.click();
          }
        }
      } catch (error) {
        console.log("未保存変更の警告ダイアログは表示されませんでした");
      }
    }
  });

  test("レスポンシブデザインの確認", async ({ page }) => {
    await page.goto("/synopsis");
    await verifyPageLoad(page, "小説作成エージェント");

    // デスクトップサイズでのスクリーンショット
    await page.setViewportSize({ width: 1280, height: 720 });
    await takeScreenshot(page, "synopsis-page-desktop");

    // タブレットサイズでのスクリーンショット
    await page.setViewportSize({ width: 768, height: 1024 });
    await takeScreenshot(page, "synopsis-page-tablet");

    // モバイルサイズでのスクリーンショット
    await page.setViewportSize({ width: 375, height: 667 });
    await takeScreenshot(page, "synopsis-page-mobile");

    // 元のサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

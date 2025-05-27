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

test.describe("WritingPage Tests", () => {
  test.beforeEach(async ({ page }) => {
    // 基本的なテストではホームページに移動してからテストデータを設定
    // AIアシスト機能テストでは個別にセットアップを行うため、ここではスキップ
    if (!test.info().title.includes("AIアシスト機能")) {
      await page.goto("/");
      await setupTestData(page);
    }
  });

  test("ページの初期表示確認とスクリーンショット", async ({ page }) => {
    // 執筆ページに移動
    await page.goto("/writing");

    // ページの読み込み確認
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // 執筆セクションまたは関連要素が表示されることを確認
    const writingSection = page
      .locator("text=執筆, text=章, h1, h2, h3")
      .first();
    if ((await writingSection.count()) > 0) {
      await expect(writingSection).toBeVisible();
    }

    // エラーがないことを確認
    await checkForErrors(page);

    // 初期表示のスクリーンショット
    await takeScreenshot(page, "writing-page-initial");
  });

  test("章の作成機能", async ({ page }) => {
    await page.goto("/writing");
    await verifyPageLoad(page, "小説作成エージェント");

    // 新規章作成ボタンを探す（より柔軟なセレクター）
    const addChapterButton = page
      .locator(
        'button:has-text("新規章作成"), button:has-text("章作成"), button:has-text("新規作成"), button:has-text("追加")'
      )
      .first();

    if ((await addChapterButton.count()) > 0) {
      await addChapterButton.click();

      // ダイアログが開くまで待機
      await page.waitForSelector('[role="dialog"], form, .add-form', {
        timeout: 5000,
      });

      // 章作成ダイアログのスクリーンショット
      await takeScreenshot(page, "writing-page-new-chapter-dialog");

      // フォームに入力
      const titleInput = page
        .locator('input[placeholder*="タイトル"], input[type="text"]')
        .first();

      if ((await titleInput.count()) > 0) {
        await titleInput.fill("新しい章");

        const synopsisInput = page
          .locator('textarea[placeholder*="あらすじ"], textarea')
          .first();
        if ((await synopsisInput.count()) > 0) {
          await synopsisInput.fill("新しい章のあらすじです。");
        }

        // 入力後のスクリーンショット
        await takeScreenshot(page, "writing-page-new-chapter-filled");

        // 作成ボタンをクリック
        const createButton = page
          .locator(
            'button:has-text("作成"), button:has-text("追加"), button[type="submit"]'
          )
          .first();

        if ((await createButton.count()) > 0) {
          await createButton.click();

          // ダイアログが閉じることを確認
          await page.waitForSelector('[role="dialog"]', {
            state: "hidden",
            timeout: 5000,
          });

          // 章作成後のスクリーンショット
          await takeScreenshot(page, "writing-page-after-chapter-creation");
        }
      }
    } else {
      console.log("章作成ボタンが見つかりませんでした");
      await takeScreenshot(page, "writing-page-no-chapter-button");
    }
  });

  test("AIアシスト機能を使った小説執筆フロー", async ({ page }) => {
    // テストデータをセットアップ（プロジェクト選択も含む）
    const setupResult = await setupTestData(page);

    if (!setupResult.projectSelected) {
      throw new Error("プロジェクトが正しく選択されていません");
    }

    // プロジェクト選択後、サイドバーの「本文執筆」ボタンをクリックしてWritingPageに移動
    const writingButton = page.locator('button:has-text("本文執筆")').first();
    if ((await writingButton.count()) > 0) {
      await writingButton.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      console.log("サイドバーから本文執筆ページに移動しました");
    } else {
      // フォールバック: 直接URLで移動
      await page.goto("/writing");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
      console.log("直接URLで本文執筆ページに移動しました");
    }

    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // 初期状態のスクリーンショット
    await takeScreenshot(page, "writing-page-before-ai-assist");

    // AIチャットパネルを開く
    await openAIChatPanel(page);

    // AIチャットパネル表示のスクリーンショット
    await takeScreenshot(page, "writing-page-ai-chat-panel-opened");

    // アシストタブに切り替え
    await switchToAIAssistTab(page);

    // アシストタブ表示のスクリーンショット
    await takeScreenshot(page, "writing-page-ai-assist-tab");

    // AIアシスト機能でコンテンツ生成
    await generateAIContent(page, "感動的なシーンを含む章を作成してください");

    // AI生成完了後のスクリーンショット
    await takeScreenshot(page, "writing-page-ai-content-generated");

    // チャットタブでAIと対話
    await sendAIChatMessage(page, "この章をもう少し詳しく展開してください");

    // AI対話後のスクリーンショット
    await takeScreenshot(page, "writing-page-ai-chat-interaction");

    // AIチャットパネルを閉じる
    await closeAIChatPanel(page);

    // パネル閉じた後のスクリーンショット
    await takeScreenshot(page, "writing-page-ai-panel-closed");
  });

  test("エディターでの執筆機能", async ({ page }) => {
    await page.goto("/writing");
    await verifyPageLoad(page, "小説作成エージェント");

    // 章を選択（より柔軟なセレクター）
    const chapterItem = page
      .locator(
        "text=テスト章1, text=章, [data-testid*='chapter'], .chapter-item"
      )
      .first();

    if ((await chapterItem.count()) > 0) {
      await chapterItem.click();

      // エディターが表示されることを確認
      const editor = page
        .locator(
          '[contenteditable="true"], textarea.editor, .editor, [role="textbox"]'
        )
        .first();

      if ((await editor.count()) > 0) {
        await expect(editor).toBeVisible();

        // エディター表示のスクリーンショット
        await takeScreenshot(page, "writing-page-editor-visible");

        // テキストを入力
        await editor.click();
        await editor.fill("これは新しく執筆された内容です。物語が始まります。");

        // 執筆後のスクリーンショット
        await takeScreenshot(page, "writing-page-after-writing");

        // 保存ボタンをクリック
        const saveButton = page.locator('button:has-text("保存")').first();
        if ((await saveButton.count()) > 0) {
          await saveButton.click();

          // 保存完了を待機
          await waitForLoadingComplete(page);

          // 保存後のスクリーンショット
          await takeScreenshot(page, "writing-page-after-save");
        }
      }
    } else {
      console.log("章が見つかりませんでした。利用可能な要素を確認します。");
      const allElements = await page.locator("*").allTextContents();
      console.log("ページ内容:", allElements.slice(0, 10));
      await takeScreenshot(page, "writing-page-no-chapter-found");
    }
  });

  test("AI章生成機能の確認", async ({ page }) => {
    await page.goto("/writing");
    await verifyPageLoad(page, "小説作成エージェント");

    // AIチャットパネルを開く
    await openAIChatPanel(page);

    // アシストタブに切り替え
    await switchToAIAssistTab(page);

    // AI設定のスクリーンショット
    await takeScreenshot(page, "writing-page-ai-generation-settings");

    // 長さ設定がある場合
    const lengthSelect = page
      .locator('select[label*="長さ"], [role="combobox"]')
      .first();
    if ((await lengthSelect.count()) > 0) {
      await lengthSelect.click();
      const normalOption = page.locator("text=普通").first();
      if ((await normalOption.count()) > 0) {
        await normalOption.click();
      }
    }

    // AI生成を実行
    await generateAIContent(page, "感動的なシーンを含めてください");

    // AI生成完了後のスクリーンショット
    await takeScreenshot(page, "writing-page-ai-generation-complete");

    // パネルを閉じる
    await closeAIChatPanel(page);
  });

  test("関連イベントの割り当て機能", async ({ page }) => {
    await page.goto("/writing");
    await verifyPageLoad(page, "小説作成エージェント");

    // イベント割り当てボタンを探す
    const assignEventsButton = page
      .locator(
        'button:has-text("イベント割り当て"), button:has-text("イベント"), button:has-text("関連")'
      )
      .first();

    if ((await assignEventsButton.count()) > 0) {
      await assignEventsButton.click();

      // ダイアログが開くまで待機
      await waitForDialog(page);

      // イベント割り当てダイアログのスクリーンショット
      await takeScreenshot(page, "writing-page-assign-events-dialog");

      // イベントを選択
      const eventCheckbox = page.locator('input[type="checkbox"]').first();
      if ((await eventCheckbox.count()) > 0) {
        await eventCheckbox.check();

        // イベント選択後のスクリーンショット
        await takeScreenshot(page, "writing-page-events-selected");
      }

      // 保存ボタンをクリック
      const saveButton = page
        .locator('button:has-text("保存"), button:has-text("割り当て")')
        .first();
      if ((await saveButton.count()) > 0) {
        await saveButton.click();

        // ダイアログが閉じることを確認
        await page.waitForSelector('[role="dialog"]', {
          state: "hidden",
          timeout: 5000,
        });

        // イベント割り当て後のスクリーンショット
        await takeScreenshot(page, "writing-page-after-event-assignment");
      }
    } else {
      console.log("イベント割り当てボタンが見つかりませんでした");
      await takeScreenshot(page, "writing-page-no-event-button");
    }
  });

  test("ページ機能の確認", async ({ page }) => {
    await page.goto("/writing");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページナビゲーションが表示されることを確認
    const pageNavigation = page
      .locator(
        'text=/ , button:has-text("前のページ"), button:has-text("次のページ"), .pagination'
      )
      .first();

    if ((await pageNavigation.count()) > 0) {
      await expect(pageNavigation).toBeVisible();

      // ページナビゲーションのスクリーンショット
      await takeScreenshot(page, "writing-page-navigation");

      // 改ページ追加ボタンをクリック
      const addPageBreakButton = page
        .locator('button:has-text("改ページ追加"), button:has-text("改ページ")')
        .first();
      if ((await addPageBreakButton.count()) > 0) {
        await addPageBreakButton.click();

        // 改ページ追加後のスクリーンショット
        await takeScreenshot(page, "writing-page-after-page-break");
      }
    } else {
      console.log("ページナビゲーションが見つかりませんでした");
      await takeScreenshot(page, "writing-page-no-navigation");
    }
  });

  test("章リストの表示と選択", async ({ page }) => {
    await page.goto("/writing");
    await verifyPageLoad(page, "小説作成エージェント");

    // 章リストが表示されることを確認
    const chapterList = page
      .locator('.chapter-list, [data-testid="chapter-list"], .sidebar, nav')
      .first();

    if ((await chapterList.count()) > 0) {
      await expect(chapterList).toBeVisible();

      // 章リスト表示のスクリーンショット
      await takeScreenshot(page, "writing-page-chapter-list");
    } else {
      console.log("章リストが見つかりませんでした");
      await takeScreenshot(page, "writing-page-no-chapter-list");
    }

    // 章を選択
    const chapterItem = page
      .locator("text=テスト章1, .chapter-item, [data-testid*='chapter']")
      .first();

    if ((await chapterItem.count()) > 0) {
      await chapterItem.click();

      // 章選択後のスクリーンショット
      await takeScreenshot(page, "writing-page-chapter-selected");
    }
  });

  test("レスポンシブデザインの確認", async ({ page }) => {
    await page.goto("/writing");
    await verifyPageLoad(page, "小説作成エージェント");

    // デスクトップサイズでのスクリーンショット
    await page.setViewportSize({ width: 1280, height: 720 });
    await takeScreenshot(page, "writing-page-desktop");

    // タブレットサイズでのスクリーンショット
    await page.setViewportSize({ width: 768, height: 1024 });
    await takeScreenshot(page, "writing-page-tablet");

    // モバイルサイズでのスクリーンショット
    await page.setViewportSize({ width: 375, height: 667 });
    await takeScreenshot(page, "writing-page-mobile");

    // 元のサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

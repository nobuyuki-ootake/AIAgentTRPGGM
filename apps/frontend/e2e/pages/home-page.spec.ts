import { test, expect } from "@playwright/test";
import {
  setupTestData,
  clearTestData,
  verifyPageLoad,
  takeScreenshot,
  waitForDialog,
  fillForm,
  checkForErrors,
} from "../utils/test-helpers";

test.describe("HomePage Tests", () => {
  test.beforeEach(async ({ page }) => {
    // テストデータをクリア
    await clearTestData(page);
  });

  test("ページの初期表示確認とスクリーンショット", async ({ page }) => {
    // ホームページに移動
    await page.goto("/");

    // ページの読み込み確認
    await verifyPageLoad(page, "Novel");

    // 主要な要素が表示されることを確認
    await expect(page.locator("h1, h4")).toContainText("小説創作支援ツール");
    await expect(
      page.locator('button:has-text("新規プロジェクト")')
    ).toBeVisible();

    // エラーがないことを確認
    await checkForErrors(page);

    // 初期表示のスクリーンショット
    await takeScreenshot(page, "home-page-initial");
  });

  test("新規プロジェクト作成ダイアログの表示", async ({ page }) => {
    await page.goto("/");
    await verifyPageLoad(page, "Novel");

    // 新規プロジェクトボタンをクリック
    await page.click('button:has-text("新規プロジェクト")');

    // ダイアログが開くまで待機
    await waitForDialog(page);

    // ダイアログの内容を確認
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator("text=新規プロジェクト作成")).toBeVisible();
    await expect(
      page.locator(
        'input[label="プロジェクト名"], input[placeholder*="プロジェクト"], input[type="text"]'
      )
    ).toBeVisible();

    // ダイアログ表示のスクリーンショット
    await takeScreenshot(page, "home-page-new-project-dialog");

    // プロジェクト名を入力
    await page.fill('input[type="text"]', "テスト新規プロジェクト");

    // 入力後のスクリーンショット
    await takeScreenshot(page, "home-page-new-project-filled");

    // 作成ボタンをクリック
    await page.click('button:has-text("作成")');

    // ダイアログが閉じることを確認
    await page.waitForSelector('[role="dialog"]', {
      state: "hidden",
      timeout: 5000,
    });

    // プロジェクト作成後のスクリーンショット
    await takeScreenshot(page, "home-page-after-project-creation");
  });

  test("プロジェクト一覧の表示（既存プロジェクトあり）", async ({ page }) => {
    // テストデータを設定
    await setupTestData(page);

    await page.goto("/");
    await verifyPageLoad(page, "Novel");

    // プロジェクト一覧が表示されることを確認
    await expect(page.locator("text=プロジェクト一覧")).toBeVisible();
    await expect(page.locator("text=テスト小説プロジェクト")).toBeVisible();

    // プロジェクトカードが表示されることを確認
    const projectCard = page
      .locator('[data-testid="project-card"], .project-card')
      .first();
    if ((await projectCard.count()) > 0) {
      await expect(projectCard).toBeVisible();
    }

    // プロジェクト一覧表示のスクリーンショット
    await takeScreenshot(page, "home-page-with-projects");
  });

  test("プロジェクト削除機能の確認", async ({ page }) => {
    // テストデータを設定
    await setupTestData(page);

    await page.goto("/");
    await verifyPageLoad(page, "Novel");

    // 削除ボタンを探してクリック（存在する場合）
    const deleteButton = page
      .locator('button[aria-label*="削除"], button:has-text("削除")')
      .first();

    if ((await deleteButton.count()) > 0) {
      await deleteButton.click();

      // 削除確認ダイアログが表示されることを確認
      await waitForDialog(page);
      await expect(page.locator('button:has-text("削除")')).toBeVisible();

      // 削除確認ダイアログのスクリーンショット
      await takeScreenshot(page, "home-page-delete-confirmation");

      // キャンセルボタンをクリック
      await page.click('button:has-text("キャンセル")');

      // ダイアログが閉じることを確認
      await page.waitForSelector('[role="dialog"]', {
        state: "hidden",
        timeout: 5000,
      });

      // キャンセル後のスクリーンショット
      await takeScreenshot(page, "home-page-after-delete-cancel");
    }
  });

  test("ツールの特徴と使い方セクションの表示", async ({ page }) => {
    await page.goto("/");
    await verifyPageLoad(page, "Novel");

    // ツールの特徴セクションの確認
    await expect(page.locator("text=ツールの特徴")).toBeVisible();
    await expect(page.locator("text=物語の構造化")).toBeVisible();
    await expect(page.locator("text=世界観構築支援")).toBeVisible();
    await expect(page.locator("text=タイムライン管理")).toBeVisible();
    await expect(page.locator("text=AIアシスタント連携")).toBeVisible();

    // 使い方セクションの確認
    await expect(page.locator("text=使い方")).toBeVisible();
    await expect(page.locator("text=プロジェクトの作成")).toBeVisible();
    await expect(page.locator("text=設定の作成")).toBeVisible();
    await expect(page.locator("text=タイムラインの整理")).toBeVisible();
    await expect(page.locator("text=執筆と編集")).toBeVisible();

    // 特徴・使い方セクションのスクリーンショット
    await takeScreenshot(page, "home-page-features-and-usage");
  });

  test("レスポンシブデザインの確認", async ({ page }) => {
    await page.goto("/");
    await verifyPageLoad(page, "Novel");

    // デスクトップサイズでのスクリーンショット
    await page.setViewportSize({ width: 1280, height: 720 });
    await takeScreenshot(page, "home-page-desktop");

    // タブレットサイズでのスクリーンショット
    await page.setViewportSize({ width: 768, height: 1024 });
    await takeScreenshot(page, "home-page-tablet");

    // モバイルサイズでのスクリーンショット
    await page.setViewportSize({ width: 375, height: 667 });
    await takeScreenshot(page, "home-page-mobile");

    // 元のサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

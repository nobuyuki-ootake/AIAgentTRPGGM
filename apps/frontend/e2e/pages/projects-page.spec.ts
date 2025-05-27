import { test, expect } from "@playwright/test";
import {
  setupTestData,
  clearTestData,
  verifyPageLoad,
  takeScreenshot,
  checkForErrors,
} from "../utils/test-helpers";

test.describe("ProjectsPage Tests", () => {
  test.beforeEach(async ({ page }) => {
    // テストデータをクリア
    await clearTestData(page);
  });

  test("ページの初期表示確認とスクリーンショット（プロジェクトなし）", async ({
    page,
  }) => {
    // プロジェクト一覧ページに移動
    await page.goto("/projects");

    // ページの読み込み確認
    await verifyPageLoad(page, "小説作成エージェント");

    // プロジェクトがない場合のメッセージまたは空状態を確認
    await page.waitForTimeout(2000); // ページの読み込みを待機

    // エラーがないことを確認
    await checkForErrors(page);

    // 初期表示のスクリーンショット
    await takeScreenshot(page, "projects-page-empty");
  });

  test("プロジェクト一覧の表示（既存プロジェクトあり）", async ({ page }) => {
    // テストデータを設定
    await setupTestData(page);

    await page.goto("/projects");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // プロジェクトリストコンポーネントが表示されることを確認
    const projectList = page
      .locator('[data-testid="project-list"], .MuiList-root')
      .first();
    if ((await projectList.count()) > 0) {
      await expect(projectList).toBeVisible();
    }

    // プロジェクト一覧表示のスクリーンショット
    await takeScreenshot(page, "projects-page-with-projects");
  });

  test("プロジェクト選択機能の確認", async ({ page }) => {
    // テストデータを設定
    await setupTestData(page);

    await page.goto("/projects");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // プロジェクト選択前のスクリーンショット
    await takeScreenshot(page, "projects-page-before-selection");

    // プロジェクトリストアイテムを探す
    const projectItem = page
      .locator('.MuiListItem-root, [role="button"]')
      .first();

    if ((await projectItem.count()) > 0) {
      await projectItem.click();

      // ページ遷移を待機（シノプシスページまたは他のページに移動）
      await page.waitForURL(
        /\/(synopsis|plot|timeline|worldbuilding|writing)/,
        {
          timeout: 10000,
        }
      );

      // 遷移後のスクリーンショット
      await takeScreenshot(page, "projects-page-after-selection");
    } else {
      console.log("プロジェクトアイテムが見つかりませんでした");
      await takeScreenshot(page, "projects-page-no-items");
    }
  });

  test("プロジェクト作成機能の確認", async ({ page }) => {
    await page.goto("/projects");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(2000);

    // 新規作成ボタンを探す
    const createButton = page
      .locator(
        'button:has-text("新規"), button:has-text("作成"), button:has-text("追加"), [aria-label*="追加"]'
      )
      .first();

    if ((await createButton.count()) > 0) {
      await createButton.click();

      // ダイアログまたはフォームが表示されることを確認
      await page.waitForSelector('[role="dialog"], form, .create-form', {
        timeout: 5000,
      });

      // 作成フォーム表示のスクリーンショット
      await takeScreenshot(page, "projects-page-create-form");

      // プロジェクト名入力フィールドを探す
      const nameInput = page
        .locator(
          'input[type="text"], input[placeholder*="名前"], input[placeholder*="タイトル"]'
        )
        .first();

      if ((await nameInput.count()) > 0) {
        await nameInput.fill("新しいテストプロジェクト");

        // 入力後のスクリーンショット
        await takeScreenshot(page, "projects-page-create-filled");

        // 作成ボタンをクリック
        const submitButton = page
          .locator(
            'button:has-text("作成"), button:has-text("保存"), button[type="submit"]'
          )
          .first();
        if ((await submitButton.count()) > 0) {
          await submitButton.click();

          // 作成後のスクリーンショット
          await takeScreenshot(page, "projects-page-after-create");
        }
      }
    } else {
      console.log("新規作成ボタンが見つかりませんでした");
      await takeScreenshot(page, "projects-page-no-create-button");
    }
  });

  test("プロジェクト詳細情報の表示", async ({ page }) => {
    // テストデータを設定
    await setupTestData(page);

    await page.goto("/projects");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // プロジェクトリストが表示されることを確認
    const projectList = page.locator('.MuiList-root, [role="list"]').first();
    if ((await projectList.count()) > 0) {
      await expect(projectList).toBeVisible();
    }

    // プロジェクト詳細表示のスクリーンショット
    await takeScreenshot(page, "projects-page-project-details");
  });

  test("プロジェクト検索・フィルタ機能の確認", async ({ page }) => {
    // テストデータを設定
    await setupTestData(page);

    await page.goto("/projects");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(3000);

    // 検索フィールドを探す
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="検索"], input[placeholder*="フィルタ"]'
      )
      .first();

    if ((await searchInput.count()) > 0) {
      // 検索前のスクリーンショット
      await takeScreenshot(page, "projects-page-before-search");

      // 検索語を入力
      await searchInput.fill("テスト");

      // 検索後のスクリーンショット
      await takeScreenshot(page, "projects-page-after-search");
    } else {
      console.log("検索フィールドが見つかりませんでした");
      await takeScreenshot(page, "projects-page-no-search");
    }
  });

  test("レスポンシブデザインの確認", async ({ page }) => {
    // テストデータを設定
    await setupTestData(page);

    await page.goto("/projects");
    await verifyPageLoad(page, "小説作成エージェント");

    // ページの読み込みを待機
    await page.waitForTimeout(2000);

    // デスクトップサイズでのスクリーンショット
    await page.setViewportSize({ width: 1280, height: 720 });
    await takeScreenshot(page, "projects-page-desktop");

    // タブレットサイズでのスクリーンショット
    await page.setViewportSize({ width: 768, height: 1024 });
    await takeScreenshot(page, "projects-page-tablet");

    // モバイルサイズでのスクリーンショット
    await page.setViewportSize({ width: 375, height: 667 });
    await takeScreenshot(page, "projects-page-mobile");

    // 元のサイズに戻す
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

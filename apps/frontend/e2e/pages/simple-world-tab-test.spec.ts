import { test } from "@playwright/test";

// 開発サーバーのURL
const BASE_URL = "http://localhost:5173";

test.describe("世界観構築 - シンプルなタブテスト", () => {
  test("地名タブをクリックするテスト", async ({ page }) => {
    // ホームページにアクセス
    console.log("ホームページにアクセスします");
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // 新規プロジェクト作成
    console.log("新規プロジェクトを作成します");
    const newProjectButton = page.getByRole("button", {
      name: "新規プロジェクト",
    });
    await newProjectButton.click();
    await page.waitForTimeout(500);

    // プロジェクト名入力
    await page
      .locator('input[type="text"]')
      .first()
      .fill("タブテスト用プロジェクト");

    // 作成ボタンクリック
    await page.getByRole("button", { name: /作成|保存|確定/ }).click();
    await page.waitForTimeout(1000);

    // 世界観構築ページに移動
    console.log("世界観構築ページに移動します");
    const worldBuildingButton = page.getByRole("button", {
      name: "世界観構築",
    });
    await worldBuildingButton.click();
    await page.waitForTimeout(1000);

    // サイドバーが開いていたら閉じる
    console.log("サイドバーが開いていたら閉じます");
    const backdrop = page.locator(".MuiBackdrop-root");
    if (await backdrop.isVisible()) {
      console.log("バックドロップを閉じます");
      await backdrop.click();
      await page.waitForTimeout(500);
    }

    // 地名タブをクリック
    console.log("地名タブをクリックします");
    // タブのインデックス指定でクリック (通常、地名タブは4番目)
    await page.locator('button[role="tab"]').nth(3).click();
    await page.waitForTimeout(1000);

    // スクリーンショット
    console.log("スクリーンショットを撮影します");
    await page.screenshot({
      path: "test-results/tab-test-result.png",
      fullPage: true,
    });

    console.log("テスト完了");
  });
});

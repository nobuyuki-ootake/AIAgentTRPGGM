import { test, expect } from "@playwright/test";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// スナップショット保存ディレクトリ
const SNAPSHOT_DIR = join(process.cwd(), "test-results", "minimal-test");

// ディレクトリが存在しない場合は作成
if (!existsSync(SNAPSHOT_DIR)) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  console.log(`ディレクトリを作成しました: ${SNAPSHOT_DIR}`);
}

// 開発サーバーのURL
const BASE_URL = "http://localhost:5173";

// テスト設定
test.describe("最小限のスナップショットテスト", () => {
  test.setTimeout(60000); // タイムアウトを60秒に延長

  test("ホームページと世界観構築ページの確認", async ({ page }) => {
    // ホームページにアクセス
    console.log("ホームページにアクセスします");
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // スナップショット: ホームページ
    await page.screenshot({
      path: join(SNAPSHOT_DIR, "01-home-page.png"),
      fullPage: true,
    });

    try {
      // 新規プロジェクト作成
      console.log("新規プロジェクトを作成します");
      const newProjectButton = page.getByRole("button", {
        name: "新規プロジェクト",
      });
      await expect(newProjectButton).toBeVisible({ timeout: 5000 });
      await newProjectButton.click();
      await page.waitForTimeout(1000);

      // スナップショット: 新規プロジェクトモーダル
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "02-new-project-modal.png"),
        fullPage: true,
      });

      // プロジェクト名入力
      await page
        .locator('input[type="text"]')
        .first()
        .fill("最小テスト用プロジェクト");

      // 作成ボタンクリック
      await page.getByRole("button", { name: /作成|保存|確定/ }).click();
      await page.waitForTimeout(2000);

      // スナップショット: プロジェクト作成後
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "03-after-project-creation.png"),
        fullPage: true,
      });

      // 世界観構築ページに移動
      console.log("世界観構築ページに移動します");
      const worldBuildingButton = page.getByRole("button", {
        name: "世界観構築",
      });
      await expect(worldBuildingButton).toBeVisible({ timeout: 5000 });
      await worldBuildingButton.click();
      await page.waitForTimeout(2000);

      // スナップショット: 世界観構築ページ
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "04-world-building-page.png"),
        fullPage: true,
      });

      // サイドバーが開いていたら閉じる
      console.log("サイドバーが開いていたら閉じます");
      try {
        const backdrop = page.locator(".MuiBackdrop-root");
        if (await backdrop.isVisible({ timeout: 1000 })) {
          console.log("バックドロップを閉じます");
          await backdrop.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        console.log(`バックドロップ関連のエラー: ${e.message}`);
      }

      // 地名タブをクリック
      console.log("地名タブをクリックします");
      try {
        // すべてのタブを取得
        const tabs = await page.locator('button[role="tab"]').all();
        console.log(`${tabs.length}個のタブが見つかりました`);

        // 4番目のタブ（地名タブ）をクリック
        if (tabs.length >= 4) {
          await tabs[3].click();
          await page.waitForTimeout(1000);

          // スナップショット: 地名タブクリック後
          await page.screenshot({
            path: join(SNAPSHOT_DIR, "05-place-tab.png"),
            fullPage: true,
          });
        } else {
          console.log("地名タブが見つかりませんでした");
        }
      } catch (error) {
        console.log(`タブクリック時にエラーが発生しました: ${error.message}`);
      }

      console.log("テスト完了");
    } catch (error) {
      // エラー発生時はスクリーンショットを撮影
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "error-screenshot.png"),
        fullPage: true,
      });
      console.error(`テスト実行中にエラーが発生しました: ${error.message}`);
      throw error;
    }
  });
});

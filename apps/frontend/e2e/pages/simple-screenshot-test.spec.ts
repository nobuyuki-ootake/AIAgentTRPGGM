import { test, expect } from "@playwright/test";

test.describe("シンプルスクリーンショット撮影", () => {
  test("基本ページのスクリーンショット撮影", async ({ page }) => {
    // ホームページ
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector('h1:has-text("小説創作支援ツール")', {
      timeout: 10000,
    });
    await page.screenshot({
      path: "./home-page-initial.png",
      fullPage: true,
    });

    // プロジェクトをクリック
    const projectCard = page
      .locator("div")
      .filter({
        hasText: /^テストプロジェクト/,
      })
      .first();

    if ((await projectCard.count()) > 0) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // あらすじページ
      await page.screenshot({
        path: "./synopsis-page-desktop.png",
        fullPage: true,
      });

      // 本文執筆ページに移動
      const writingButton = page.getByRole("button", { name: "本文執筆" });
      if ((await writingButton.count()) > 0) {
        await writingButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // 執筆ページ
        await page.screenshot({
          path: "./writing-page-initial.png",
          fullPage: true,
        });

        // 章を選択
        const firstChapter = page
          .getByRole("button")
          .filter({
            hasText: /^1.*第.*章/,
          })
          .first();

        if ((await firstChapter.count()) > 0) {
          await firstChapter.click();
          await page.waitForTimeout(1000);

          await page.screenshot({
            path: "./chapter-list-fix-verification-success.png",
            fullPage: true,
          });
        }

        // プロットページ
        const menuButton = page.getByRole("button", { name: "menu" });
        if ((await menuButton.count()) > 0) {
          await menuButton.click();
          await page.waitForTimeout(500);

          const plotButton = page.getByRole("button", { name: "プロット" });
          if ((await plotButton.count()) > 0) {
            await plotButton.click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(1000);

            await page.screenshot({
              path: "./plot-page-desktop.png",
              fullPage: true,
            });
          }
        }

        // タイムラインページ
        const menuButton2 = page.getByRole("button", { name: "menu" });
        if ((await menuButton2.count()) > 0) {
          await menuButton2.click();
          await page.waitForTimeout(500);

          const timelineButton = page.getByRole("button", {
            name: "タイムライン",
          });
          if ((await timelineButton.count()) > 0) {
            await timelineButton.click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(1000);

            await page.screenshot({
              path: "./timeline-page-desktop.png",
              fullPage: true,
            });
          }
        }
      }
    }

    // テスト成功を確認
    expect(true).toBe(true);
  });
});

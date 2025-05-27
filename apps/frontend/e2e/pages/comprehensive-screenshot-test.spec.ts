import { test, expect } from "@playwright/test";
import path from "path";

test.describe("包括的スクリーンショット撮影テスト", () => {
  test.beforeEach(async ({ page }) => {
    // ホームページに移動
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("全ページのスクリーンショット撮影", async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), "test-results");

    // 1. ホームページのスクリーンショット
    await page.waitForSelector('h1:has-text("小説創作支援ツール")', {
      timeout: 10000,
    });
    await page.screenshot({
      path: path.join(screenshotDir, "home-page-initial.png"),
      fullPage: true,
    });

    // 2. プロジェクトをクリックして詳細画面に移動
    const projectCard = page
      .locator("div")
      .filter({
        hasText: /^テストプロジェクト作成日:.*更新日:.*$/,
      })
      .first();

    if ((await projectCard.count()) > 0) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // 3. プロジェクト詳細画面（あらすじページ）のスクリーンショット
      await page.screenshot({
        path: path.join(screenshotDir, "synopsis-page-desktop.png"),
        fullPage: true,
      });

      // 4. 本文執筆ページに移動
      const writingButton = page.getByRole("button", { name: "本文執筆" });
      if ((await writingButton.count()) > 0) {
        await writingButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // 5. 執筆ページ（初期状態）のスクリーンショット
        await page.screenshot({
          path: path.join(screenshotDir, "writing-page-initial.png"),
          fullPage: true,
        });

        // 6. 章を選択した状態のスクリーンショット
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
            path: path.join(
              screenshotDir,
              "chapter-list-fix-verification-success.png"
            ),
            fullPage: true,
          });
        }

        // 7. プロットページに移動
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
              path: path.join(screenshotDir, "plot-page-desktop.png"),
              fullPage: true,
            });
          }
        }

        // 8. タイムラインページに移動
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
              path: path.join(screenshotDir, "timeline-page-desktop.png"),
              fullPage: true,
            });
          }
        }

        // 9. ホームに戻る
        const menuButton3 = page.getByRole("button", { name: "menu" });
        if ((await menuButton3.count()) > 0) {
          await menuButton3.click();
          await page.waitForTimeout(500);

          const homeButton = page.getByRole("button", { name: "ホームに戻る" });
          if ((await homeButton.count()) > 0) {
            await homeButton.click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(1000);

            await page.screenshot({
              path: path.join(screenshotDir, "home-page-final.png"),
              fullPage: true,
            });
          }
        }
      }
    }
  });

  test("ChapterList修正の検証テスト", async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), "test-results");

    // ChapterListコンポーネントの「0 is read-only」エラーが修正されていることを確認

    // プロジェクトを選択
    const projectCard = page
      .locator("div")
      .filter({
        hasText: /^テストプロジェクト作成日:.*更新日:.*$/,
      })
      .first();

    if ((await projectCard.count()) > 0) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // 本文執筆ページに移動
      const writingButton = page.getByRole("button", { name: "本文執筆" });
      if ((await writingButton.count()) > 0) {
        await writingButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // コンソールエラーをチェック
        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            consoleErrors.push(msg.text());
          }
        });

        // ページエラーをチェック
        const pageErrors: string[] = [];
        page.on("pageerror", (error) => {
          pageErrors.push(error.message);
        });

        // 章一覧が表示されることを確認
        const chapterList = page.locator('[role="list"]').filter({
          hasText: /第.*章/,
        });

        if ((await chapterList.count()) > 0) {
          // 章をクリックしてソート機能をテスト
          const chapters = page.getByRole("button").filter({
            hasText: /^[0-9]+.*第.*章/,
          });

          const chapterCount = await chapters.count();
          if (chapterCount > 0) {
            // 各章をクリックしてエラーが発生しないことを確認
            for (let i = 0; i < Math.min(chapterCount, 3); i++) {
              await chapters.nth(i).click();
              await page.waitForTimeout(500);
            }
          }
        }

        // エラーが発生していないことを確認
        expect(
          consoleErrors.filter(
            (error) =>
              error.includes("0 is read-only") || error.includes("TypeError")
          )
        ).toHaveLength(0);

        expect(
          pageErrors.filter(
            (error) =>
              error.includes("0 is read-only") || error.includes("TypeError")
          )
        ).toHaveLength(0);

        // 最終的なスクリーンショット
        await page.screenshot({
          path: path.join(screenshotDir, "chapter-list-error-verification.png"),
          fullPage: true,
        });
      }
    }
  });

  test("レスポンシブデザインのスクリーンショット", async ({ page }) => {
    const screenshotDir = path.join(process.cwd(), "test-results");

    // プロジェクトを選択
    const projectCard = page
      .locator("div")
      .filter({
        hasText: /^テストプロジェクト作成日:.*更新日:.*$/,
      })
      .first();

    if ((await projectCard.count()) > 0) {
      await projectCard.click();
      await page.waitForLoadState("networkidle");

      // 本文執筆ページに移動
      const writingButton = page.getByRole("button", { name: "本文執筆" });
      if ((await writingButton.count()) > 0) {
        await writingButton.click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        // デスクトップ表示
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(screenshotDir, "writing-page-desktop.png"),
          fullPage: true,
        });

        // タブレット表示
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(screenshotDir, "writing-page-tablet.png"),
          fullPage: true,
        });

        // モバイル表示
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(screenshotDir, "writing-page-mobile.png"),
          fullPage: true,
        });

        // タイムラインページのモバイル表示
        const menuButton = page.getByRole("button", { name: "menu" });
        if ((await menuButton.count()) > 0) {
          await menuButton.click();
          await page.waitForTimeout(500);

          const timelineButton = page.getByRole("button", {
            name: "タイムライン",
          });
          if ((await timelineButton.count()) > 0) {
            await timelineButton.click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(1000);

            await page.screenshot({
              path: path.join(screenshotDir, "timeline-page-mobile.png"),
              fullPage: true,
            });
          }
        }

        // プロットページのモバイル表示
        const menuButton2 = page.getByRole("button", { name: "menu" });
        if ((await menuButton2.count()) > 0) {
          await menuButton2.click();
          await page.waitForTimeout(500);

          const plotButton = page.getByRole("button", { name: "プロット" });
          if ((await plotButton.count()) > 0) {
            await plotButton.click();
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(1000);

            await page.screenshot({
              path: path.join(screenshotDir, "plot-page-mobile.png"),
              fullPage: true,
            });
          }
        }
      }
    }
  });
});

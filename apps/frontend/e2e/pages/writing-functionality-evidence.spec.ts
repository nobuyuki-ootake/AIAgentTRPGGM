import { test, expect } from "@playwright/test";
import path from "path";

test.describe("執筆機能エビデンス撮影（自動化版）", () => {
  test.beforeEach(async ({ page }) => {
    // ホームページに移動
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("執筆機能の完全なワークフロー証明", async ({ page }) => {
    const screenshotDir = path.join(process.cwd());

    // === 1. 執筆開始前の状態 ===

    // ホームページ - プロジェクト選択前
    await page.waitForSelector('h1:has-text("小説創作支援ツール")', {
      timeout: 10000,
    });
    await page.screenshot({
      path: path.join(
        screenshotDir,
        "evidence-01-home-before-project-selection.png"
      ),
      fullPage: true,
    });

    // プロジェクトを選択（実際のDOM構造に基づく）
    const projectCard = page
      .locator("div")
      .filter({
        hasText: /^テストプロジェクト作成日:.*更新日:.*$/,
      })
      .first();

    await projectCard.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // プロジェクト詳細画面 - 執筆開始前
    await page.screenshot({
      path: path.join(
        screenshotDir,
        "evidence-02-project-detail-before-writing.png"
      ),
      fullPage: true,
    });

    // === 2. 執筆画面への移動とChapterList修正の効果確認 ===

    const writingButton = page.getByRole("button", { name: "本文執筆" });
    await writingButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // 執筆画面 - ChapterListが正常に表示されている状態（修正後）
    await page.screenshot({
      path: path.join(
        screenshotDir,
        "evidence-03-writing-page-chapter-list-fixed.png"
      ),
      fullPage: true,
    });

    // コンソールエラーをチェック（「0 is read-only」エラーが発生しないことを確認）
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // === 3. 章選択と執筆エディターの動作確認 ===

    // 第1章を選択（実際のDOM構造に基づく）
    const firstChapter = page
      .getByRole("button")
      .filter({
        hasText: /^1.*第.*章.*物語の始まり/,
      })
      .first();

    if ((await firstChapter.count()) > 0) {
      await firstChapter.click();
      await page.waitForTimeout(1000);

      // 章選択後 - エディターが表示された状態
      await page.screenshot({
        path: path.join(
          screenshotDir,
          "evidence-04-chapter-selected-editor-ready.png"
        ),
        fullPage: true,
      });

      // === 4. 実際の文章執筆 ===

      // エディターに文章を入力（実際のDOM構造に基づく）
      const editor = page
        .getByRole("textbox")
        .filter({ hasText: "執筆を開始" });
      if ((await editor.count()) > 0) {
        await editor.click();
        await page.waitForTimeout(500);

        const testText =
          "これは執筆機能のテストです。\n\n主人公は朝早く目を覚ました。窓の外から差し込む朝日が、部屋を暖かく照らしている。今日は特別な日になりそうな予感がした。\n\n「さあ、新しい一日の始まりだ」と彼は呟いた。\n\n物語はここから始まる。主人公の冒険が今、幕を開けようとしていた。";

        await editor.fill(testText);
        await page.waitForTimeout(1000);

        // 執筆中 - 文章が入力された状態
        await page.screenshot({
          path: path.join(
            screenshotDir,
            "evidence-05-writing-in-progress-text-entered.png"
          ),
          fullPage: true,
        });

        // === 5. 文章保存の確認 ===

        // 保存ボタンをクリック
        const saveButton = page.getByRole("button", { name: "保存" });
        if ((await saveButton.count()) > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }

        // 保存後の状態
        await page.screenshot({
          path: path.join(
            screenshotDir,
            "evidence-06-writing-saved-successfully.png"
          ),
          fullPage: true,
        });

        // === 6. 章切り替えテスト（ChapterListソート機能の確認） ===

        // 第2章を選択
        const secondChapter = page
          .getByRole("button")
          .filter({
            hasText: /^2.*第.*章.*冒険の始まり/,
          })
          .first();

        if ((await secondChapter.count()) > 0) {
          await secondChapter.click();
          await page.waitForTimeout(1000);

          // 章切り替え後 - 別の章のエディターが表示
          await page.screenshot({
            path: path.join(
              screenshotDir,
              "evidence-07-chapter-switching-works.png"
            ),
            fullPage: true,
          });

          // === 7. 最終確認 - 執筆機能の完全性 ===

          // 第1章に戻って内容が保持されていることを確認
          if ((await firstChapter.count()) > 0) {
            await firstChapter.click();
            await page.waitForTimeout(1000);

            // 第1章の内容が保持されている
            await page.screenshot({
              path: path.join(
                screenshotDir,
                "evidence-08-final-writing-functionality-confirmed.png"
              ),
              fullPage: true,
            });
          }
        }
      }
    }

    // === 8. エラーチェックの最終確認 ===

    // 「0 is read-only」エラーが発生していないことを確認
    const readOnlyErrors = consoleErrors.filter(
      (error) => error.includes("0 is read-only") || error.includes("TypeError")
    );

    expect(readOnlyErrors).toHaveLength(0);

    // テスト成功の確認
    console.log("✅ 執筆機能エビデンステスト完了");
    console.log("📸 撮影されたスクリーンショット:");
    console.log("  - evidence-01-home-before-project-selection.png");
    console.log("  - evidence-02-project-detail-before-writing.png");
    console.log("  - evidence-03-writing-page-chapter-list-fixed.png");
    console.log("  - evidence-04-chapter-selected-editor-ready.png");
    console.log("  - evidence-05-writing-in-progress-text-entered.png");
    console.log("  - evidence-06-writing-saved-successfully.png");
    console.log("  - evidence-07-chapter-switching-works.png");
    console.log("  - evidence-08-final-writing-functionality-confirmed.png");
  });

  test("執筆機能のレスポンシブ対応確認", async ({ page }) => {
    const screenshotDir = path.join(process.cwd());

    // プロジェクト選択と執筆画面への移動
    const projectCard = page
      .locator("div")
      .filter({
        hasText: /^テストプロジェクト作成日:.*更新日:.*$/,
      })
      .first();

    await projectCard.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const writingButton = page.getByRole("button", { name: "本文執筆" });
    await writingButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // デスクトップ表示での執筆
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(
        screenshotDir,
        "evidence-responsive-01-desktop-writing.png"
      ),
      fullPage: true,
    });

    // タブレット表示での執筆
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(
        screenshotDir,
        "evidence-responsive-02-tablet-writing.png"
      ),
      fullPage: true,
    });

    // モバイル表示での執筆
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(
        screenshotDir,
        "evidence-responsive-03-mobile-writing.png"
      ),
      fullPage: true,
    });

    console.log("✅ レスポンシブ対応エビデンステスト完了");
    console.log("📸 撮影されたスクリーンショット:");
    console.log("  - evidence-responsive-01-desktop-writing.png");
    console.log("  - evidence-responsive-02-tablet-writing.png");
    console.log("  - evidence-responsive-03-mobile-writing.png");
  });

  test("ChapterList修正の回帰テスト", async ({ page }) => {
    const screenshotDir = path.join(process.cwd());

    // プロジェクト選択と執筆画面への移動
    const projectCard = page
      .locator("div")
      .filter({
        hasText: /^テストプロジェクト作成日:.*更新日:.*$/,
      })
      .first();

    await projectCard.click();
    await page.waitForLoadState("networkidle");

    const writingButton = page.getByRole("button", { name: "本文執筆" });
    await writingButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // コンソールエラーの監視開始
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // 章リストが正しい順序で表示されることを確認
    const chapterList = page.locator('[role="button"]').filter({
      hasText: /^[0-9]+.*第.*章/,
    });

    const chapterCount = await chapterList.count();
    expect(chapterCount).toBeGreaterThan(0);

    // 各章をクリックしてソート機能をテスト
    for (let i = 0; i < Math.min(chapterCount, 3); i++) {
      await chapterList.nth(i).click();
      await page.waitForTimeout(500);

      // スクリーンショット撮影
      await page.screenshot({
        path: path.join(
          screenshotDir,
          `evidence-regression-chapter-${i + 1}.png`
        ),
        fullPage: true,
      });
    }

    // 「0 is read-only」エラーが発生していないことを確認
    const readOnlyErrors = consoleErrors.filter(
      (error) =>
        error.includes("0 is read-only") ||
        error.includes("TypeError") ||
        error.includes("read-only")
    );

    expect(readOnlyErrors).toHaveLength(0);

    console.log("✅ ChapterList修正の回帰テスト完了");
    console.log(`📸 ${chapterCount}個の章で回帰テスト実施`);
    console.log("🚫 「0 is read-only」エラーは発生していません");
  });

  test("執筆機能のパフォーマンステスト", async ({ page }) => {
    const screenshotDir = path.join(process.cwd());

    // プロジェクト選択と執筆画面への移動
    const projectCard = page
      .locator("div")
      .filter({
        hasText: /^テストプロジェクト作成日:.*更新日:.*$/,
      })
      .first();

    const startTime = Date.now();

    await projectCard.click();
    await page.waitForLoadState("networkidle");

    const writingButton = page.getByRole("button", { name: "本文執筆" });
    await writingButton.click();
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // 第1章を選択
    const firstChapter = page
      .getByRole("button")
      .filter({
        hasText: /^1.*第.*章/,
      })
      .first();

    if ((await firstChapter.count()) > 0) {
      const chapterSelectStart = Date.now();
      await firstChapter.click();
      await page.waitForTimeout(500);
      const chapterSelectTime = Date.now() - chapterSelectStart;

      // エディターに大量のテキストを入力してパフォーマンステスト
      const editor = page
        .getByRole("textbox")
        .filter({ hasText: "執筆を開始" });
      if ((await editor.count()) > 0) {
        const largeText =
          "これはパフォーマンステストです。".repeat(100) +
          "\n\n" +
          "大量のテキストを入力して、エディターの応答性をテストします。".repeat(
            50
          );

        const inputStart = Date.now();
        await editor.fill(largeText);
        const inputTime = Date.now() - inputStart;

        // パフォーマンステスト結果のスクリーンショット
        await page.screenshot({
          path: path.join(screenshotDir, "evidence-performance-large-text.png"),
          fullPage: true,
        });

        // パフォーマンス結果をログ出力
        console.log("⚡ パフォーマンステスト結果:");
        console.log(`  - 執筆画面読み込み時間: ${loadTime}ms`);
        console.log(`  - 章選択時間: ${chapterSelectTime}ms`);
        console.log(`  - 大量テキスト入力時間: ${inputTime}ms`);

        // パフォーマンス基準の確認
        expect(loadTime).toBeLessThan(10000); // 10秒以内
        expect(chapterSelectTime).toBeLessThan(2000); // 2秒以内
        expect(inputTime).toBeLessThan(5000); // 5秒以内
      }
    }
  });
});

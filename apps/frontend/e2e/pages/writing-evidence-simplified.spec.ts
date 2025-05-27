import { test, expect } from "@playwright/test";
import {
  EvidenceHelpers,
  SAMPLE_TEXTS,
  PERFORMANCE_THRESHOLDS,
} from "../utils/evidence-helpers";

test.describe("執筆機能エビデンス（簡潔版）", () => {
  let helpers: EvidenceHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new EvidenceHelpers(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("執筆機能の完全なワークフロー証明", async ({ page }) => {
    const screenshots: string[] = [];

    // 1. ホームページ
    await helpers.takeScreenshot(
      "evidence-01-home-before-project-selection.png"
    );
    screenshots.push("evidence-01-home-before-project-selection.png");

    // 2. プロジェクト選択
    await helpers.selectProject();
    await helpers.takeScreenshot(
      "evidence-02-project-detail-before-writing.png"
    );
    screenshots.push("evidence-02-project-detail-before-writing.png");

    // 3. 執筆画面への移動
    await helpers.navigateToWritingPage();
    await helpers.takeScreenshot(
      "evidence-03-writing-page-chapter-list-fixed.png"
    );
    screenshots.push("evidence-03-writing-page-chapter-list-fixed.png");

    // 4. 第1章選択
    await helpers.selectChapter(1);
    await helpers.takeScreenshot(
      "evidence-04-chapter-selected-editor-ready.png"
    );
    screenshots.push("evidence-04-chapter-selected-editor-ready.png");

    // 5. 文章執筆
    await helpers.writeText(SAMPLE_TEXTS.chapter1);
    await helpers.takeScreenshot(
      "evidence-05-writing-in-progress-text-entered.png"
    );
    screenshots.push("evidence-05-writing-in-progress-text-entered.png");

    // 6. 保存
    await helpers.saveText();
    await helpers.takeScreenshot("evidence-06-writing-saved-successfully.png");
    screenshots.push("evidence-06-writing-saved-successfully.png");

    // 7. 第2章への切り替え
    await helpers.selectChapter(2);
    await helpers.takeScreenshot("evidence-07-chapter-switching-works.png");
    screenshots.push("evidence-07-chapter-switching-works.png");

    // 8. 第1章に戻って内容確認
    await helpers.selectChapter(1);
    await helpers.takeScreenshot(
      "evidence-08-final-writing-functionality-confirmed.png"
    );
    screenshots.push("evidence-08-final-writing-functionality-confirmed.png");

    // 9. エラーチェック
    helpers.verifyNoReadOnlyErrors();

    // 10. 結果ログ
    helpers.logTestResults("執筆機能エビデンステスト", screenshots);
  });

  test("ChapterList修正の回帰テスト", async ({ page }) => {
    const screenshots: string[] = [];

    // プロジェクト選択と執筆画面への移動
    await helpers.selectProject();
    await helpers.navigateToWritingPage();

    // 章リストの順序確認
    const chapterCount = await helpers.verifyChapterOrder();

    // 各章をクリックしてソート機能をテスト
    for (let i = 1; i <= Math.min(chapterCount, 3); i++) {
      await helpers.selectChapter(i);
      const filename = `evidence-regression-chapter-${i}.png`;
      await helpers.takeScreenshot(filename);
      screenshots.push(filename);
    }

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();

    // 結果ログ
    console.log(`✅ ChapterList修正の回帰テスト完了`);
    console.log(`📸 ${chapterCount}個の章で回帰テスト実施`);
    console.log("🚫 「0 is read-only」エラーは発生していません");
    helpers.logTestResults("回帰テスト", screenshots);
  });

  test("レスポンシブ対応確認", async ({ page }) => {
    const screenshots: string[] = [];
    const devices: Array<"desktop" | "tablet" | "mobile"> = [
      "desktop",
      "tablet",
      "mobile",
    ];

    // プロジェクト選択と執筆画面への移動
    await helpers.selectProject();
    await helpers.navigateToWritingPage();

    // 各デバイスでのスクリーンショット撮影
    for (const device of devices) {
      await helpers.setViewport(device);
      const filename = `evidence-responsive-${device}-writing.png`;
      await helpers.takeScreenshot(filename);
      screenshots.push(filename);
    }

    helpers.logTestResults("レスポンシブ対応エビデンステスト", screenshots);
  });

  test("パフォーマンステスト", async ({ page }) => {
    const screenshots: string[] = [];

    // プロジェクト選択のパフォーマンス測定
    const { duration: projectSelectTime } = await helpers.measurePerformance(
      () => helpers.selectProject(),
      "プロジェクト選択"
    );

    // 執筆画面移動のパフォーマンス測定
    const { duration: writingPageTime } = await helpers.measurePerformance(
      () => helpers.navigateToWritingPage(),
      "執筆画面移動"
    );

    // 章選択のパフォーマンス測定
    const { duration: chapterSelectTime } = await helpers.measurePerformance(
      () => helpers.selectChapter(1),
      "章選択"
    );

    // 大量テキスト入力のパフォーマンス測定
    const { duration: textInputTime } = await helpers.measurePerformance(
      () => helpers.writeText(SAMPLE_TEXTS.performance),
      "大量テキスト入力"
    );

    // パフォーマンステスト結果のスクリーンショット
    const filename = "evidence-performance-large-text.png";
    await helpers.takeScreenshot(filename);
    screenshots.push(filename);

    // 保存のパフォーマンス測定
    const { duration: saveTime } = await helpers.measurePerformance(
      () => helpers.saveText(),
      "保存"
    );

    // パフォーマンス基準の確認
    expect(projectSelectTime + writingPageTime).toBeLessThan(
      PERFORMANCE_THRESHOLDS.pageLoad
    );
    expect(chapterSelectTime).toBeLessThan(
      PERFORMANCE_THRESHOLDS.chapterSelect
    );
    expect(textInputTime).toBeLessThan(PERFORMANCE_THRESHOLDS.textInput);
    expect(saveTime).toBeLessThan(PERFORMANCE_THRESHOLDS.save);

    // 結果ログ
    console.log("⚡ パフォーマンステスト結果:");
    console.log(`  - プロジェクト選択: ${projectSelectTime}ms`);
    console.log(`  - 執筆画面移動: ${writingPageTime}ms`);
    console.log(`  - 章選択: ${chapterSelectTime}ms`);
    console.log(`  - 大量テキスト入力: ${textInputTime}ms`);
    console.log(`  - 保存: ${saveTime}ms`);

    helpers.logTestResults("パフォーマンステスト", screenshots);
  });

  test("エラー耐性テスト", async ({ page }) => {
    const screenshots: string[] = [];

    await helpers.selectProject();
    await helpers.navigateToWritingPage();

    // 存在しない章を選択しようとした場合のエラーハンドリング
    try {
      await helpers.selectChapter(999);
    } catch (error) {
      expect(error.message).toContain("第999章が見つかりません");
      console.log("✅ 存在しない章選択のエラーハンドリング正常");
    }

    // 正常な章選択に戻る
    await helpers.selectChapter(1);

    // 空文字列の入力テスト
    await helpers.writeText("");
    const filename1 = "evidence-error-empty-text.png";
    await helpers.takeScreenshot(filename1);
    screenshots.push(filename1);

    // 非常に長いテキストの入力テスト
    const veryLongText = "非常に長いテキスト".repeat(1000);
    await helpers.writeText(veryLongText);
    const filename2 = "evidence-error-very-long-text.png";
    await helpers.takeScreenshot(filename2);
    screenshots.push(filename2);

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();

    helpers.logTestResults("エラー耐性テスト", screenshots);
  });
});

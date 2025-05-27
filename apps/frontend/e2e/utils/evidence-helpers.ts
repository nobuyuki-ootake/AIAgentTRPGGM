import { Page, expect, Locator } from "@playwright/test";
import path from "path";

/**
 * エビデンステスト用のヘルパー関数集
 */
export class EvidenceHelpers {
  private page: Page;
  private consoleErrors: string[] = [];
  private screenshotDir: string;

  constructor(page: Page) {
    this.page = page;
    this.screenshotDir = path.join(process.cwd());
    this.setupErrorMonitoring();
  }

  /**
   * コンソールエラーの監視を開始
   */
  private setupErrorMonitoring(): void {
    this.page.on("console", (msg) => {
      if (msg.type() === "error") {
        this.consoleErrors.push(msg.text());
      }
    });
  }

  /**
   * スクリーンショットを撮影
   */
  async takeScreenshot(
    filename: string,
    fullPage: boolean = true
  ): Promise<void> {
    await this.page.screenshot({
      path: path.join(this.screenshotDir, filename),
      fullPage,
    });
  }

  /**
   * プロジェクトを選択
   */
  async selectProject(): Promise<void> {
    // 複数のセレクターパターンを試行
    const selectors = [
      'div:has-text("テストプロジェクト")',
      '[class*="project"]',
      'div[class*="card"]',
      'div:has-text("作成日")',
      'div:has-text("更新日")',
    ];

    let projectCard: Locator | null = null;

    for (const selector of selectors) {
      const element = this.page.locator(selector).first();
      if ((await element.count()) > 0) {
        projectCard = element;
        break;
      }
    }

    if (!projectCard) {
      // 最後の手段として、最初のクリック可能な要素を選択
      projectCard = this.page
        .locator("div, button, a")
        .filter({
          hasText: /プロジェクト|テスト|作成|更新/,
        })
        .first();
    }

    if (projectCard && (await projectCard.count()) > 0) {
      await projectCard.click();
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForTimeout(2000);
    } else {
      throw new Error(
        "プロジェクトが見つかりません。ページ構造を確認してください。"
      );
    }
  }

  /**
   * 執筆画面に移動
   */
  async navigateToWritingPage(): Promise<void> {
    const writingButton = this.page.getByRole("button", { name: "本文執筆" });
    await writingButton.click();
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
  }

  /**
   * 章を選択
   */
  async selectChapter(chapterNumber: number): Promise<void> {
    const chapterButton = this.page
      .getByRole("button")
      .filter({
        hasText: new RegExp(`^${chapterNumber}.*第.*章`),
      })
      .first();

    if ((await chapterButton.count()) > 0) {
      await chapterButton.click();
      await this.page.waitForTimeout(1000);
    } else {
      throw new Error(`第${chapterNumber}章が見つかりません`);
    }
  }

  /**
   * エディターに文章を入力
   */
  async writeText(text: string): Promise<void> {
    const editor = this.page
      .getByRole("textbox")
      .filter({ hasText: "執筆を開始" });

    if ((await editor.count()) > 0) {
      await editor.click();
      await this.page.waitForTimeout(500);
      await editor.fill(text);
      await this.page.waitForTimeout(1000);
    } else {
      throw new Error("エディターが見つかりません");
    }
  }

  /**
   * 文章を保存
   */
  async saveText(): Promise<void> {
    const saveButton = this.page.getByRole("button", { name: "保存" });

    if ((await saveButton.count()) > 0) {
      await saveButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * 「0 is read-only」エラーが発生していないことを確認
   */
  verifyNoReadOnlyErrors(): void {
    const readOnlyErrors = this.consoleErrors.filter(
      (error) =>
        error.includes("0 is read-only") ||
        error.includes("TypeError") ||
        error.includes("read-only")
    );

    expect(readOnlyErrors).toHaveLength(0);
  }

  /**
   * 章リストの順序を確認
   */
  async verifyChapterOrder(): Promise<number> {
    const chapterList = this.page.locator('[role="button"]').filter({
      hasText: /^[0-9]+.*第.*章/,
    });

    const chapterCount = await chapterList.count();
    expect(chapterCount).toBeGreaterThan(0);

    // 各章の順序を確認
    for (let i = 0; i < chapterCount; i++) {
      const chapterText = await chapterList.nth(i).textContent();
      expect(chapterText).toMatch(new RegExp(`^${i + 1}`));
    }

    return chapterCount;
  }

  /**
   * パフォーマンス測定
   */
  async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;

    console.log(`⚡ ${operationName}: ${duration}ms`);

    return { result, duration };
  }

  /**
   * レスポンシブテスト用のビューポート設定
   */
  async setViewport(device: "desktop" | "tablet" | "mobile"): Promise<void> {
    const viewports = {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 },
    };

    await this.page.setViewportSize(viewports[device]);
    await this.page.waitForTimeout(500);
  }

  /**
   * エラーログを取得
   */
  getConsoleErrors(): string[] {
    return [...this.consoleErrors];
  }

  /**
   * エラーログをクリア
   */
  clearConsoleErrors(): void {
    this.consoleErrors = [];
  }

  /**
   * テスト結果をログ出力
   */
  logTestResults(testName: string, screenshots: string[]): void {
    console.log(`✅ ${testName}完了`);
    console.log("📸 撮影されたスクリーンショット:");
    screenshots.forEach((screenshot) => {
      console.log(`  - ${screenshot}`);
    });
  }
}

/**
 * 標準的な執筆テストのテキスト
 */
export const SAMPLE_TEXTS = {
  chapter1:
    "これは執筆機能のテストです。\n\n主人公は朝早く目を覚ました。窓の外から差し込む朝日が、部屋を暖かく照らしている。今日は特別な日になりそうな予感がした。\n\n「さあ、新しい一日の始まりだ」と彼は呟いた。\n\n物語はここから始まる。主人公の冒険が今、幕を開けようとしていた。",

  chapter2:
    "第2章の内容です。\n\n物語は新たな展開を迎えた。主人公は重要な決断を迫られている。\n\n彼の前には二つの道が広がっていた。一つは安全だが退屈な道、もう一つは危険だが刺激的な道。\n\n「どちらを選ぶべきか...」主人公は深く考え込んだ。",

  performance:
    "これはパフォーマンステストです。".repeat(100) +
    "\n\n" +
    "大量のテキストを入力して、エディターの応答性をテストします。".repeat(50),
};

/**
 * パフォーマンス基準
 */
export const PERFORMANCE_THRESHOLDS = {
  pageLoad: 10000, // 10秒
  chapterSelect: 2000, // 2秒
  textInput: 5000, // 5秒
  save: 3000, // 3秒
};

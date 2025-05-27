# Test info

- Name: 執筆機能エビデンス（簡潔版） >> レスポンシブ対応確認
- Location: C:\Users\irure\git\NovelWithAgent\apps\frontend\e2e\pages\writing-evidence-simplified.spec.ts:107:3

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('div').filter({ hasText: /^テストプロジェクト作成日:.*更新日:.*$/ }).first()

    at EvidenceHelpers.selectProject (C:\Users\irure\git\NovelWithAgent\apps\frontend\e2e\utils\evidence-helpers.ts:53:23)
    at C:\Users\irure\git\NovelWithAgent\apps\frontend\e2e\pages\writing-evidence-simplified.spec.ts:116:19
```

# Page snapshot

```yaml
- region "Notifications alt+T"
- heading "小説創作支援ツール" [level=1]
- button "新規プロジェクト"
- heading "プロジェクト一覧" [level=2]
- text: 思考が現実になる世界
- paragraph: "作成日: 2025年5月27日"
- paragraph: "更新日: 2025年5月27日"
- button "プロジェクトを削除"
- heading "ツールの特徴" [level=2]
- list:
  - listitem:
    - text: 物語の構造化
    - paragraph: あらすじ、プロット、キャラクター設定などを体系的に管理できます。
  - listitem:
    - text: 世界観構築支援
    - paragraph: 小説の世界観や設定を詳細に作り込むための各種ツールを提供します。
  - listitem:
    - text: タイムライン管理
    - paragraph: 物語の時系列を視覚的に管理し、整合性を保ちながら創作できます。
  - listitem:
    - text: AIアシスタント連携
    - paragraph: 創作過程でAIアシスタントからアドバイスやアイデアを得られます。
- heading "使い方" [level=2]
- list:
  - listitem:
    - text: 1. プロジェクトの作成
    - paragraph: 「新規プロジェクト」ボタンから小説のプロジェクトを作成します。
  - listitem:
    - text: 2. 設定の作成
    - paragraph: あらすじ、プロット、キャラクター、世界観などの設定を作成します。
  - listitem:
    - text: 3. タイムラインの整理
    - paragraph: 物語の出来事を時系列順に配置し、整合性を確認します。
  - listitem:
    - text: 4. 執筆と編集
    - paragraph: 設定に基づいて執筆を進め、必要に応じてAIのサポートを受けられます。
```

# Test source

```ts
   1 | import { Page, expect } from "@playwright/test";
   2 | import path from "path";
   3 |
   4 | /**
   5 |  * エビデンステスト用のヘルパー関数集
   6 |  */
   7 | export class EvidenceHelpers {
   8 |   private page: Page;
   9 |   private consoleErrors: string[] = [];
   10 |   private screenshotDir: string;
   11 |
   12 |   constructor(page: Page) {
   13 |     this.page = page;
   14 |     this.screenshotDir = path.join(process.cwd());
   15 |     this.setupErrorMonitoring();
   16 |   }
   17 |
   18 |   /**
   19 |    * コンソールエラーの監視を開始
   20 |    */
   21 |   private setupErrorMonitoring(): void {
   22 |     this.page.on("console", (msg) => {
   23 |       if (msg.type() === "error") {
   24 |         this.consoleErrors.push(msg.text());
   25 |       }
   26 |     });
   27 |   }
   28 |
   29 |   /**
   30 |    * スクリーンショットを撮影
   31 |    */
   32 |   async takeScreenshot(
   33 |     filename: string,
   34 |     fullPage: boolean = true
   35 |   ): Promise<void> {
   36 |     await this.page.screenshot({
   37 |       path: path.join(this.screenshotDir, filename),
   38 |       fullPage,
   39 |     });
   40 |   }
   41 |
   42 |   /**
   43 |    * プロジェクトを選択
   44 |    */
   45 |   async selectProject(): Promise<void> {
   46 |     const projectCard = this.page
   47 |       .locator("div")
   48 |       .filter({
   49 |         hasText: /^テストプロジェクト作成日:.*更新日:.*$/,
   50 |       })
   51 |       .first();
   52 |
>  53 |     await projectCard.click();
      |                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
   54 |     await this.page.waitForLoadState("networkidle");
   55 |     await this.page.waitForTimeout(2000);
   56 |   }
   57 |
   58 |   /**
   59 |    * 執筆画面に移動
   60 |    */
   61 |   async navigateToWritingPage(): Promise<void> {
   62 |     const writingButton = this.page.getByRole("button", { name: "本文執筆" });
   63 |     await writingButton.click();
   64 |     await this.page.waitForLoadState("networkidle");
   65 |     await this.page.waitForTimeout(2000);
   66 |   }
   67 |
   68 |   /**
   69 |    * 章を選択
   70 |    */
   71 |   async selectChapter(chapterNumber: number): Promise<void> {
   72 |     const chapterButton = this.page
   73 |       .getByRole("button")
   74 |       .filter({
   75 |         hasText: new RegExp(`^${chapterNumber}.*第.*章`),
   76 |       })
   77 |       .first();
   78 |
   79 |     if ((await chapterButton.count()) > 0) {
   80 |       await chapterButton.click();
   81 |       await this.page.waitForTimeout(1000);
   82 |     } else {
   83 |       throw new Error(`第${chapterNumber}章が見つかりません`);
   84 |     }
   85 |   }
   86 |
   87 |   /**
   88 |    * エディターに文章を入力
   89 |    */
   90 |   async writeText(text: string): Promise<void> {
   91 |     const editor = this.page
   92 |       .getByRole("textbox")
   93 |       .filter({ hasText: "執筆を開始" });
   94 |
   95 |     if ((await editor.count()) > 0) {
   96 |       await editor.click();
   97 |       await this.page.waitForTimeout(500);
   98 |       await editor.fill(text);
   99 |       await this.page.waitForTimeout(1000);
  100 |     } else {
  101 |       throw new Error("エディターが見つかりません");
  102 |     }
  103 |   }
  104 |
  105 |   /**
  106 |    * 文章を保存
  107 |    */
  108 |   async saveText(): Promise<void> {
  109 |     const saveButton = this.page.getByRole("button", { name: "保存" });
  110 |
  111 |     if ((await saveButton.count()) > 0) {
  112 |       await saveButton.click();
  113 |       await this.page.waitForTimeout(1000);
  114 |     }
  115 |   }
  116 |
  117 |   /**
  118 |    * 「0 is read-only」エラーが発生していないことを確認
  119 |    */
  120 |   verifyNoReadOnlyErrors(): void {
  121 |     const readOnlyErrors = this.consoleErrors.filter(
  122 |       (error) =>
  123 |         error.includes("0 is read-only") ||
  124 |         error.includes("TypeError") ||
  125 |         error.includes("read-only")
  126 |     );
  127 |
  128 |     expect(readOnlyErrors).toHaveLength(0);
  129 |   }
  130 |
  131 |   /**
  132 |    * 章リストの順序を確認
  133 |    */
  134 |   async verifyChapterOrder(): Promise<number> {
  135 |     const chapterList = this.page.locator('[role="button"]').filter({
  136 |       hasText: /^[0-9]+.*第.*章/,
  137 |     });
  138 |
  139 |     const chapterCount = await chapterList.count();
  140 |     expect(chapterCount).toBeGreaterThan(0);
  141 |
  142 |     // 各章の順序を確認
  143 |     for (let i = 0; i < chapterCount; i++) {
  144 |       const chapterText = await chapterList.nth(i).textContent();
  145 |       expect(chapterText).toMatch(new RegExp(`^${i + 1}`));
  146 |     }
  147 |
  148 |     return chapterCount;
  149 |   }
  150 |
  151 |   /**
  152 |    * パフォーマンス測定
  153 |    */
```
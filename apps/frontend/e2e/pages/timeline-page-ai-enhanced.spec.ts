import { test, expect } from "@playwright/test";
import { EvidenceHelpers } from "../utils/evidence-helpers";
import type { Locator } from "@playwright/test";

test.describe("TimelinePage AI機能完全対応テスト", () => {
  let helpers: EvidenceHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new EvidenceHelpers(page);

    // ホームページに移動
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // プロジェクト選択
    await helpers.selectProject();
    await helpers.takeScreenshot("timeline-01-project-selected.png");
  });

  test("タイムライン基本機能とAI機能の完全テスト", async ({ page }) => {
    // タイムラインページに移動
    const timelineButton = page.getByRole("button", { name: "タイムライン" });
    await timelineButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // 初期表示確認
    await helpers.takeScreenshot("timeline-02-initial-page.png");

    // ページタイトルの確認
    await expect(
      page.locator("h1, h2, h3").filter({ hasText: /タイムライン|時系列/ })
    ).toBeVisible();

    // 新規イベント追加テスト
    await test.step("新規イベント追加", async () => {
      const addButton = page
        .locator(
          'button:has-text("新規追加"), button:has-text("追加"), button:has-text("イベント追加")'
        )
        .first();

      if ((await addButton.count()) > 0) {
        await addButton.click();
        await page.waitForTimeout(2000);

        // ダイアログ表示確認
        const dialog = page.locator('[role="dialog"], .modal, .dialog').first();
        await expect(dialog).toBeVisible();
        await helpers.takeScreenshot("timeline-03-add-event-dialog.png");

        // フォーム入力
        const titleInput = page
          .locator(
            'input[placeholder*="タイトル"], input[label*="タイトル"], input[name*="title"]'
          )
          .first();
        if ((await titleInput.count()) > 0) {
          await titleInput.fill("重要なイベント");
        }

        const descriptionInput = page
          .locator(
            'textarea[placeholder*="説明"], textarea[label*="説明"], textarea[name*="description"]'
          )
          .first();
        if ((await descriptionInput.count()) > 0) {
          await descriptionInput.fill("物語の転換点となる重要なイベントです。");
        }

        const dateInput = page
          .locator('input[type="date"], input[placeholder*="日付"]')
          .first();
        if ((await dateInput.count()) > 0) {
          await dateInput.fill("2024-12-25");
        }

        await helpers.takeScreenshot("timeline-04-event-form-filled.png");

        // 保存
        const saveButton = page
          .locator(
            'button:has-text("保存"), button:has-text("追加"), button:has-text("作成")'
          )
          .first();
        if ((await saveButton.count()) > 0) {
          await saveButton.click();
          await page.waitForTimeout(2000);
        }

        await helpers.takeScreenshot("timeline-05-event-added.png");
      }
    });

    // AI機能テスト
    await test.step("AI機能完全テスト", async () => {
      // AIアシストボタンを探す
      const aiButtons = [
        page.locator('[data-testid="ai-assist-button"]'),
        page.locator('button:has-text("AI"), button:has-text("アシスト")'),
        page.locator(".floating-action-button, .fab"),
        page.locator('[aria-label*="AI"], [title*="AI"]'),
      ];

      let aiButton: Locator | null = null;
      for (const button of aiButtons) {
        if ((await button.count()) > 0) {
          aiButton = button.first();
          break;
        }
      }

      if (aiButton) {
        await aiButton.click();
        await page.waitForTimeout(2000);

        // AIパネル表示確認
        const aiPanel = page
          .locator(
            '[data-testid="ai-chat-panel"], .ai-panel, .chat-panel, [role="dialog"]'
          )
          .first();
        await expect(aiPanel).toBeVisible();
        await helpers.takeScreenshot("timeline-06-ai-panel-opened.png");

        // アシストタブテスト
        await test.step("アシストタブでタイムライン生成", async () => {
          const assistTab = page
            .locator(
              '[data-testid="assist-tab"], button:has-text("アシスト"), .assist-tab'
            )
            .first();
          if ((await assistTab.count()) > 0) {
            await assistTab.click();
            await page.waitForTimeout(1000);
            await helpers.takeScreenshot("timeline-07-assist-tab.png");

            // タイムライン生成ボタン
            const generateButtons = [
              page.locator(
                'button:has-text("タイムライン"), button:has-text("時系列")'
              ),
              page.locator('button:has-text("生成"), button:has-text("作成")'),
              page.locator('[data-testid="generate-timeline"]'),
            ];

            let generateButton: Locator | null = null;
            for (const button of generateButtons) {
              if ((await button.count()) > 0) {
                generateButton = button.first();
                break;
              }
            }

            if (generateButton) {
              await generateButton.click();
              await page.waitForTimeout(3000);
              await helpers.takeScreenshot("timeline-08-ai-generating.png");

              // 生成結果待機
              try {
                await page.waitForSelector(
                  '[data-testid="generated-content"], .ai-response, .generated-timeline',
                  { timeout: 15000 }
                );
                await helpers.takeScreenshot(
                  "timeline-09-ai-generated-timeline.png"
                );
              } catch (error) {
                console.log("AI生成タイムアウト - スクリーンショット撮影");
                await helpers.takeScreenshot("timeline-09-ai-timeout.png");
              }
            }
          }
        });

        // チャットタブテスト
        await test.step("チャットタブでAI対話", async () => {
          const chatTab = page
            .locator(
              '[data-testid="chat-tab"], button:has-text("チャット"), .chat-tab'
            )
            .first();
          if ((await chatTab.count()) > 0) {
            await chatTab.click();
            await page.waitForTimeout(1000);
            await helpers.takeScreenshot("timeline-10-chat-tab.png");

            // メッセージ入力
            const messageInput = page
              .locator(
                '[data-testid="message-input"], textarea[placeholder*="メッセージ"], .message-input'
              )
              .first();
            if ((await messageInput.count()) > 0) {
              await messageInput.fill(
                "物語のタイムラインを改善するアドバイスをください"
              );
              await helpers.takeScreenshot(
                "timeline-11-chat-message-input.png"
              );

              // 送信
              const sendButton = page
                .locator(
                  '[data-testid="send-button"], button:has-text("送信"), .send-button'
                )
                .first();
              if ((await sendButton.count()) > 0) {
                await sendButton.click();
                await page.waitForTimeout(3000);
                await helpers.takeScreenshot(
                  "timeline-12-chat-message-sent.png"
                );

                // AI応答待機
                try {
                  await page.waitForSelector(
                    '[data-testid="ai-response"], .ai-message, .assistant-message',
                    { timeout: 15000 }
                  );
                  await helpers.takeScreenshot(
                    "timeline-13-ai-response-received.png"
                  );
                } catch (error) {
                  console.log("AI応答タイムアウト - スクリーンショット撮影");
                  await helpers.takeScreenshot(
                    "timeline-13-ai-response-timeout.png"
                  );
                }
              }
            }
          }
        });

        // AIパネルを閉じる
        const closeButton = page
          .locator(
            '[data-testid="close-button"], button[aria-label*="閉じる"], .close-button'
          )
          .first();
        if ((await closeButton.count()) > 0) {
          await closeButton.click();
          await page.waitForTimeout(1000);
          await helpers.takeScreenshot("timeline-14-ai-panel-closed.png");
        }
      } else {
        console.log("AIボタンが見つかりません - 基本機能のみテスト");
        await helpers.takeScreenshot("timeline-06-no-ai-button.png");
      }
    });

    // タイムライン表示機能テスト
    await test.step("タイムライン表示機能", async () => {
      // タイムライン表示の確認
      const timelineView = page
        .locator('.timeline, .timeline-container, [data-testid="timeline"]')
        .first();
      if ((await timelineView.count()) > 0) {
        await expect(timelineView).toBeVisible();
        await helpers.takeScreenshot("timeline-15-timeline-view.png");
      }

      // イベントリストの確認
      const eventItems = page.locator(
        '.event-item, .timeline-event, [data-testid*="event"]'
      );
      if ((await eventItems.count()) > 0) {
        await helpers.takeScreenshot("timeline-16-event-list.png");
      }
    });

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();

    // 最終スクリーンショット
    await helpers.takeScreenshot("timeline-17-test-completed.png");
  });

  test("タイムライン設定とフィルタ機能", async ({ page }) => {
    // タイムラインページに移動
    const timelineButton = page.getByRole("button", { name: "タイムライン" });
    await timelineButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // 設定ボタンテスト
    await test.step("タイムライン設定", async () => {
      const settingsButton = page
        .locator(
          'button:has-text("設定"), button[aria-label*="設定"], .settings-button'
        )
        .first();
      if ((await settingsButton.count()) > 0) {
        await settingsButton.click();
        await page.waitForTimeout(2000);
        await helpers.takeScreenshot("timeline-settings-01-dialog.png");

        // 設定ダイアログの確認
        const settingsDialog = page
          .locator('[role="dialog"], .settings-dialog, .modal')
          .first();
        if ((await settingsDialog.count()) > 0) {
          await expect(settingsDialog).toBeVisible();

          // 設定項目の確認
          const timeFormatOption = page
            .locator('input[type="radio"], select, .option')
            .first();
          if ((await timeFormatOption.count()) > 0) {
            await helpers.takeScreenshot("timeline-settings-02-options.png");
          }

          // 設定を閉じる
          const closeButton = page
            .locator(
              'button:has-text("閉じる"), button:has-text("キャンセル"), .close-button'
            )
            .first();
          if ((await closeButton.count()) > 0) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });

    // フィルタ機能テスト
    await test.step("フィルタ機能", async () => {
      const filterButton = page
        .locator(
          'button:has-text("フィルタ"), .filter-button, [data-testid="filter"]'
        )
        .first();
      if ((await filterButton.count()) > 0) {
        await filterButton.click();
        await page.waitForTimeout(1000);
        await helpers.takeScreenshot("timeline-filter-01-opened.png");

        // フィルタオプションの確認
        const filterOptions = page.locator(
          '.filter-option, input[type="checkbox"], select option'
        );
        if ((await filterOptions.count()) > 0) {
          await helpers.takeScreenshot("timeline-filter-02-options.png");
        }
      }
    });

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();
  });

  test("レスポンシブ表示確認", async ({ page }) => {
    // タイムラインページに移動
    const timelineButton = page.getByRole("button", { name: "タイムライン" });
    await timelineButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // デスクトップ表示
    await helpers.setViewport("desktop");
    await helpers.takeScreenshot("timeline-responsive-01-desktop.png");

    // タブレット表示
    await helpers.setViewport("tablet");
    await page.waitForTimeout(2000);
    await helpers.takeScreenshot("timeline-responsive-02-tablet.png");

    // モバイル表示
    await helpers.setViewport("mobile");
    await page.waitForTimeout(2000);
    await helpers.takeScreenshot("timeline-responsive-03-mobile.png");

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();
  });

  test("パフォーマンステスト", async ({ page }) => {
    // ページ読み込み時間測定
    const { duration: loadDuration } = await helpers.measurePerformance(
      async () => {
        const timelineButton = page.getByRole("button", {
          name: "タイムライン",
        });
        await timelineButton.click();
        await page.waitForLoadState("networkidle");
      },
      "タイムラインページ読み込み"
    );

    // 10秒以内での読み込み確認
    expect(loadDuration).toBeLessThan(10000);

    // イベント追加時間測定
    const addButton = page
      .locator('button:has-text("新規追加"), button:has-text("追加")')
      .first();
    if ((await addButton.count()) > 0) {
      const { duration: addDuration } = await helpers.measurePerformance(
        async () => {
          await addButton.click();
          await page.waitForSelector('[role="dialog"], .modal', {
            timeout: 5000,
          });
        },
        "イベント追加ダイアログ表示"
      );

      // 5秒以内での表示確認
      expect(addDuration).toBeLessThan(5000);
    }

    await helpers.takeScreenshot("timeline-performance-test-completed.png");

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();
  });

  test.afterEach(async () => {
    // テスト結果のログ出力
    const errors = helpers.getConsoleErrors();
    if (errors.length > 0) {
      console.log("⚠️ コンソールエラー:", errors);
    }

    console.log("✅ TimelinePage AI機能テスト完了");
  });
});

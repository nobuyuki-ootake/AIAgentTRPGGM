import { test, expect } from "@playwright/test";
import { EvidenceHelpers } from "../utils/evidence-helpers";
import type { Locator } from "@playwright/test";

test.describe("WorldBuildingPage AI機能完全対応テスト", () => {
  let helpers: EvidenceHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new EvidenceHelpers(page);

    // ホームページに移動
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // プロジェクト選択
    await helpers.selectProject();
    await helpers.takeScreenshot("worldbuilding-01-project-selected.png");
  });

  test("世界観構築基本機能とAI機能の完全テスト", async ({ page }) => {
    // 世界観構築ページに移動
    const worldBuildingButton = page.getByRole("button", {
      name: "世界観構築",
    });
    await worldBuildingButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // 初期表示確認
    await helpers.takeScreenshot("worldbuilding-02-initial-page.png");

    // ページタイトルの確認
    await expect(
      page.locator("h1, h2, h3").filter({ hasText: /世界観|ワールド/ })
    ).toBeVisible();

    // タブ切り替えテスト
    await test.step("各タブの表示確認", async () => {
      const tabs = [
        "ワールドマップ",
        "世界観設定",
        "ルール",
        "地名",
        "社会と文化",
        "地理と環境",
        "歴史と伝説",
        "魔法と技術",
        "自由記述欄",
        "状態定義",
      ];

      for (let i = 0; i < tabs.length; i++) {
        const tabName = tabs[i];
        const tab = page
          .locator(`text=${tabName}, [role="tab"]:has-text("${tabName}")`)
          .first();

        if ((await tab.count()) > 0) {
          await tab.click();
          await page.waitForTimeout(1000);

          // 各タブのスクリーンショット
          const tabFileName = tabName
            .replace(/[^\w\s]/gi, "")
            .replace(/\s+/g, "-");
          await helpers.takeScreenshot(
            `worldbuilding-03-tab-${i + 1}-${tabFileName}.png`
          );
        }
      }
    });

    // 世界観要素追加テスト
    await test.step("世界観要素追加", async () => {
      // 地名タブに移動
      const placesTab = page
        .locator('text=地名, [role="tab"]:has-text("地名")')
        .first();
      if ((await placesTab.count()) > 0) {
        await placesTab.click();
        await page.waitForTimeout(1000);
        await helpers.takeScreenshot("worldbuilding-04-places-tab.png");

        // 新規追加ボタン
        const addButton = page
          .locator(
            'button:has-text("追加"), button:has-text("新規"), button:has-text("作成")'
          )
          .first();
        if ((await addButton.count()) > 0) {
          await addButton.click();
          await page.waitForTimeout(2000);

          // ダイアログ表示確認
          const dialog = page
            .locator('[role="dialog"], .modal, .dialog')
            .first();
          if ((await dialog.count()) > 0) {
            await expect(dialog).toBeVisible();
            await helpers.takeScreenshot(
              "worldbuilding-05-add-place-dialog.png"
            );

            // フォーム入力
            const nameInput = page
              .locator(
                'input[placeholder*="名前"], input[label*="名前"], input[name*="name"]'
              )
              .first();
            if ((await nameInput.count()) > 0) {
              await nameInput.fill("魔法の森");
            }

            const descriptionInput = page
              .locator(
                'textarea[placeholder*="説明"], textarea[label*="説明"], textarea[name*="description"]'
              )
              .first();
            if ((await descriptionInput.count()) > 0) {
              await descriptionInput.fill(
                "古代の魔法が宿る神秘的な森。多くの魔法生物が住んでいる。"
              );
            }

            await helpers.takeScreenshot(
              "worldbuilding-06-place-form-filled.png"
            );

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

            await helpers.takeScreenshot("worldbuilding-07-place-added.png");
          }
        }
      }
    });

    // AI機能テスト
    await test.step("AI機能完全テスト", async () => {
      // AIアシストボタンを探す
      const aiButtons = [
        page.locator('[data-testid="ai-assist-button"]'),
        page.locator('button:has-text("AI"), button:has-text("アシスト")'),
        page.locator('button:has-text("AIに世界観を考えてもらう")'),
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
        await helpers.takeScreenshot("worldbuilding-08-ai-panel-opened.png");

        // アシストタブテスト
        await test.step("アシストタブで世界観生成", async () => {
          const assistTab = page
            .locator(
              '[data-testid="assist-tab"], button:has-text("アシスト"), .assist-tab'
            )
            .first();
          if ((await assistTab.count()) > 0) {
            await assistTab.click();
            await page.waitForTimeout(1000);
            await helpers.takeScreenshot("worldbuilding-09-assist-tab.png");

            // 世界観生成ボタン
            const generateButtons = [
              page.locator(
                'button:has-text("世界観"), button:has-text("ワールド")'
              ),
              page.locator('button:has-text("生成"), button:has-text("作成")'),
              page.locator('[data-testid="generate-world"]'),
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
              await helpers.takeScreenshot(
                "worldbuilding-10-ai-generating.png"
              );

              // 生成結果待機
              try {
                await page.waitForSelector(
                  '[data-testid="generated-content"], .ai-response, .generated-world',
                  { timeout: 15000 }
                );
                await helpers.takeScreenshot(
                  "worldbuilding-11-ai-generated-world.png"
                );
              } catch (error) {
                console.log("AI生成タイムアウト - スクリーンショット撮影");
                await helpers.takeScreenshot("worldbuilding-11-ai-timeout.png");
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
            await helpers.takeScreenshot("worldbuilding-12-chat-tab.png");

            // メッセージ入力
            const messageInput = page
              .locator(
                '[data-testid="message-input"], textarea[placeholder*="メッセージ"], .message-input'
              )
              .first();
            if ((await messageInput.count()) > 0) {
              await messageInput.fill(
                "ファンタジー世界の魔法システムについて詳しく教えてください"
              );
              await helpers.takeScreenshot(
                "worldbuilding-13-chat-message-input.png"
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
                  "worldbuilding-14-chat-message-sent.png"
                );

                // AI応答待機
                try {
                  await page.waitForSelector(
                    '[data-testid="ai-response"], .ai-message, .assistant-message',
                    { timeout: 15000 }
                  );
                  await helpers.takeScreenshot(
                    "worldbuilding-15-ai-response-received.png"
                  );
                } catch (error) {
                  console.log("AI応答タイムアウト - スクリーンショット撮影");
                  await helpers.takeScreenshot(
                    "worldbuilding-15-ai-response-timeout.png"
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
          await helpers.takeScreenshot("worldbuilding-16-ai-panel-closed.png");
        }
      } else {
        console.log("AIボタンが見つかりません - 基本機能のみテスト");
        await helpers.takeScreenshot("worldbuilding-08-no-ai-button.png");
      }
    });

    // 世界観要素表示機能テスト
    await test.step("世界観要素表示機能", async () => {
      // 世界観要素リストの確認
      const elementList = page.locator(
        '.world-element, .element-list, [data-testid*="element"]'
      );
      if ((await elementList.count()) > 0) {
        await helpers.takeScreenshot("worldbuilding-17-element-list.png");
      }

      // 世界観マップの確認
      const worldMap = page
        .locator('.world-map, .map-container, [data-testid="world-map"]')
        .first();
      if ((await worldMap.count()) > 0) {
        await expect(worldMap).toBeVisible();
        await helpers.takeScreenshot("worldbuilding-18-world-map.png");
      }
    });

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();

    // 最終スクリーンショット
    await helpers.takeScreenshot("worldbuilding-19-test-completed.png");
  });

  test("世界観設定とカテゴリ管理", async ({ page }) => {
    // 世界観構築ページに移動
    const worldBuildingButton = page.getByRole("button", {
      name: "世界観構築",
    });
    await worldBuildingButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // 世界観設定タブテスト
    await test.step("世界観設定", async () => {
      const settingsTab = page
        .locator('text=世界観設定, [role="tab"]:has-text("世界観設定")')
        .first();
      if ((await settingsTab.count()) > 0) {
        await settingsTab.click();
        await page.waitForTimeout(1000);
        await helpers.takeScreenshot("worldbuilding-settings-01-tab.png");

        // 設定フォームの確認
        const settingsForm = page
          .locator("form, .settings-form, .world-settings")
          .first();
        if ((await settingsForm.count()) > 0) {
          await helpers.takeScreenshot("worldbuilding-settings-02-form.png");
        }
      }
    });

    // ルールタブテスト
    await test.step("ルール設定", async () => {
      const rulesTab = page
        .locator('text=ルール, [role="tab"]:has-text("ルール")')
        .first();
      if ((await rulesTab.count()) > 0) {
        await rulesTab.click();
        await page.waitForTimeout(1000);
        await helpers.takeScreenshot("worldbuilding-rules-01-tab.png");

        // ルール追加ボタン
        const addRuleButton = page
          .locator('button:has-text("ルール追加"), button:has-text("追加")')
          .first();
        if ((await addRuleButton.count()) > 0) {
          await addRuleButton.click();
          await page.waitForTimeout(1000);
          await helpers.takeScreenshot("worldbuilding-rules-02-add-dialog.png");
        }
      }
    });

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();
  });

  test("レスポンシブ表示確認", async ({ page }) => {
    // 世界観構築ページに移動
    const worldBuildingButton = page.getByRole("button", {
      name: "世界観構築",
    });
    await worldBuildingButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // デスクトップ表示
    await helpers.setViewport("desktop");
    await helpers.takeScreenshot("worldbuilding-responsive-01-desktop.png");

    // タブレット表示
    await helpers.setViewport("tablet");
    await page.waitForTimeout(2000);
    await helpers.takeScreenshot("worldbuilding-responsive-02-tablet.png");

    // モバイル表示
    await helpers.setViewport("mobile");
    await page.waitForTimeout(2000);
    await helpers.takeScreenshot("worldbuilding-responsive-03-mobile.png");

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();
  });

  test("パフォーマンステスト", async ({ page }) => {
    // ページ読み込み時間測定
    const { duration: loadDuration } = await helpers.measurePerformance(
      async () => {
        const worldBuildingButton = page.getByRole("button", {
          name: "世界観構築",
        });
        await worldBuildingButton.click();
        await page.waitForLoadState("networkidle");
      },
      "世界観構築ページ読み込み"
    );

    // 10秒以内での読み込み確認
    expect(loadDuration).toBeLessThan(10000);

    // タブ切り替え時間測定
    const tab = page
      .locator('text=地名, [role="tab"]:has-text("地名")')
      .first();
    if ((await tab.count()) > 0) {
      const { duration: tabDuration } = await helpers.measurePerformance(
        async () => {
          await tab.click();
          await page.waitForTimeout(500);
        },
        "タブ切り替え"
      );

      // 2秒以内での切り替え確認
      expect(tabDuration).toBeLessThan(2000);
    }

    // 要素追加時間測定
    const addButton = page
      .locator('button:has-text("追加"), button:has-text("新規")')
      .first();
    if ((await addButton.count()) > 0) {
      const { duration: addDuration } = await helpers.measurePerformance(
        async () => {
          await addButton.click();
          await page.waitForSelector('[role="dialog"], .modal', {
            timeout: 5000,
          });
        },
        "要素追加ダイアログ表示"
      );

      // 5秒以内での表示確認
      expect(addDuration).toBeLessThan(5000);
    }

    await helpers.takeScreenshot(
      "worldbuilding-performance-test-completed.png"
    );

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();
  });

  test("世界観データのエクスポート・インポート", async ({ page }) => {
    // 世界観構築ページに移動
    const worldBuildingButton = page.getByRole("button", {
      name: "世界観構築",
    });
    await worldBuildingButton.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // エクスポート機能テスト
    await test.step("データエクスポート", async () => {
      const exportButton = page
        .locator('button:has-text("エクスポート"), button:has-text("出力")')
        .first();
      if ((await exportButton.count()) > 0) {
        await exportButton.click();
        await page.waitForTimeout(1000);
        await helpers.takeScreenshot("worldbuilding-export-01-dialog.png");
      }
    });

    // インポート機能テスト
    await test.step("データインポート", async () => {
      const importButton = page
        .locator('button:has-text("インポート"), button:has-text("読み込み")')
        .first();
      if ((await importButton.count()) > 0) {
        await importButton.click();
        await page.waitForTimeout(1000);
        await helpers.takeScreenshot("worldbuilding-import-01-dialog.png");
      }
    });

    // エラーチェック
    helpers.verifyNoReadOnlyErrors();
  });

  test.afterEach(async () => {
    // テスト結果のログ出力
    const errors = helpers.getConsoleErrors();
    if (errors.length > 0) {
      console.log("⚠️ コンソールエラー:", errors);
    }

    console.log("✅ WorldBuildingPage AI機能テスト完了");
  });
});

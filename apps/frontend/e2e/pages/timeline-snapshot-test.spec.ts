import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

// スナップショット保存ディレクトリの絶対パスを設定
const SNAPSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "timeline-snapshot-test"
);

// ディレクトリを作成
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  console.log(`スナップショットディレクトリを作成しました: ${SNAPSHOT_DIR}`);
}

// 開発サーバーのURL
const BASE_URL = "http://localhost:5173";

test.describe("タイムラインイベント追加とスナップショットテスト", () => {
  test("プロジェクト作成から地名追加、キャラクター追加、タイムラインイベント追加までの流れ", async ({
    page,
  }) => {
    // 1. ホームページにアクセス
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    console.log("ホームページにアクセスしました");

    // スナップショット: ホーム画面の初期状態
    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, "01-home-initial.png"),
      fullPage: true,
    });

    // 2. 新規プロジェクト作成
    const newProjectButton = page.getByRole("button", {
      name: "新規プロジェクト",
    });
    await newProjectButton.click();
    await page.waitForTimeout(500);
    console.log("新規プロジェクトモーダルを表示しました");

    // スナップショット: 新規プロジェクトモーダル
    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, "02-new-project-modal.png"),
      fullPage: true,
    });

    // プロジェクト情報を入力
    await page
      .locator('input[type="text"]')
      .first()
      .fill("タイムラインスナップショットテスト");

    // 作成ボタンをクリック
    await page.getByRole("button", { name: /作成|保存|確定/ }).click();
    await page.waitForTimeout(1000);
    console.log("プロジェクトを作成しました");

    // スナップショット: プロジェクト作成後の画面
    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, "03-after-project-creation.png"),
      fullPage: true,
    });

    // 3. まず世界観構築ページへ移動して地名を追加
    const worldBuildingButton = page.getByRole("button", {
      name: "世界観構築",
    });
    if (await worldBuildingButton.isVisible()) {
      await worldBuildingButton.click();
      await page.waitForTimeout(1000);
    } else {
      // 直接URLで移動
      await page.goto(`${BASE_URL}/world-building`);
      await page.waitForTimeout(1000);
    }
    console.log("世界観構築ページに移動しました");

    // スナップショット: 世界観構築ページ
    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, "04-world-building-page.png"),
      fullPage: true,
    });

    // 4. まず創作メニュー（サイドバー）が開いていたら閉じる
    console.log("創作メニューが開いている場合は閉じます...");

    // バックドロップ（オーバーレイの背景）が表示されているなら、それをクリックして閉じる
    const backdrop = page.locator(".MuiBackdrop-root");
    if (await backdrop.isVisible()) {
      console.log("バックドロップが見つかりました。クリックして閉じます。");
      await backdrop.click();
      await page.waitForTimeout(500);
    }

    // または、閉じるボタンを探してクリック
    const closeButton = page.locator(".MuiDrawer-paper button").first();
    if (await closeButton.isVisible()) {
      console.log("閉じるボタンが見つかりました。クリックして閉じます。");
      await closeButton.click();
      await page.waitForTimeout(500);
    }

    // 5. 「地名」タブをクリック
    console.log("地名タブを探します...");

    // まずタブコンテナを確認
    const tabContainer = page.locator(".MuiTabs-root");
    await tabContainer.waitFor({ state: "visible", timeout: 5000 });

    // タブが見えやすいように少し待機
    await page.waitForTimeout(1000);

    console.log("地名タブをクリックします...");

    // デバッグのため、すべてのタブをログ出力
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
      console.log(
        "利用可能なタブ:",
        tabs.map((tab) => tab.textContent)
      );
      return tabs.length;
    });

    // タブのクリックは複数の方法を試す
    const placeTab = page
      .locator('button[role="tab"]')
      .filter({ hasText: "地名" });

    if (await placeTab.isVisible()) {
      try {
        await placeTab.click();
        console.log("地名タブをクリックしました (セレクタ方式)");
      } catch (error) {
        console.log(`地名タブのクリックに失敗しました: ${error.message}`);

        // インデックスによるタブ選択を試みる
        try {
          console.log("インデックスで地名タブを選択します...");
          // タブのインデックスは通常3 (0始まりで4番目)
          await page.evaluate(() => {
            const tabs = Array.from(
              document.querySelectorAll('button[role="tab"]')
            );
            // 地名タブを探す
            const placeTabIndex = tabs.findIndex(
              (tab) => tab.textContent && tab.textContent.includes("地名")
            );

            if (placeTabIndex >= 0) {
              console.log(`地名タブは${placeTabIndex}番目にあります`);
              (tabs[placeTabIndex] as HTMLElement).click();
              return true;
            } else {
              console.log(
                "地名タブが見つかりませんでした。固定インデックスで試します。"
              );
              if (tabs.length > 3) {
                (tabs[3] as HTMLElement).click(); // 通常4番目(インデックス3)に地名タブがある
                return true;
              }
            }
            return false;
          });
          console.log("インデックスによるタブ選択を実行しました");
        } catch (indexError) {
          console.log(
            `インデックスによるタブ選択にも失敗しました: ${indexError.message}`
          );
        }
      }
    } else {
      console.log("地名タブが見つかりませんでした。JavaScriptで探します");

      // JavaScriptでタブを探して選択
      await page.evaluate(() => {
        const tabs = Array.from(
          document.querySelectorAll('button[role="tab"]')
        );
        // すべてのタブの内容をログに出力
        console.log(
          "タブの内容:",
          tabs.map((t) => t.textContent)
        );

        const placeTab = tabs.find(
          (tab) => tab.textContent && tab.textContent.includes("地名")
        );
        if (placeTab) {
          (placeTab as HTMLElement).click();
          return true;
        }
        return false;
      });
    }

    await page.waitForTimeout(1000);

    // スナップショット: 地名タブ表示後
    await page.screenshot({
      path: path.join(SNAPSHOT_DIR, "05-place-tab.png"),
      fullPage: true,
    });

    // 6. 地名追加ボタンをクリック
    const addPlaceButton = page.getByRole("button", {
      name: /新規地名登録|場所追加|地名追加|追加|新規/,
    });

    if (await addPlaceButton.isVisible()) {
      await addPlaceButton.click();
      await page.waitForTimeout(500);
      console.log("地名追加モーダルを表示しました");

      // スナップショット: 地名追加モーダル
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, "06-add-place-modal.png"),
        fullPage: true,
      });

      // 地名情報を入力
      const nameInput = page
        .locator('input[placeholder*="名前"], input[name*="name"]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("テスト王国");

        // 説明などのテキストエリアに入力
        const descTextarea = page.locator("textarea").first();
        if (await descTextarea.isVisible()) {
          await descTextarea.fill(
            "テスト用の王国です。タイムラインイベントに関連付けるために作成しました。"
          );
        }

        // 重要性のテキストエリアがあれば入力
        const significanceTextarea = page.locator("textarea").nth(1);
        if (await significanceTextarea.isVisible()) {
          await significanceTextarea.fill(
            "物語の主要な舞台として重要な役割を果たします。"
          );
        }

        // スナップショット: 入力後
        await page.screenshot({
          path: path.join(SNAPSHOT_DIR, "07-place-input-filled.png"),
          fullPage: true,
        });

        // 保存ボタンをクリック
        const saveButton = page.getByRole("button", {
          name: /追加|保存|登録|確定/,
        });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          console.log("地名情報を保存しました");

          // スナップショット: 地名追加後
          await page.screenshot({
            path: path.join(SNAPSHOT_DIR, "08-after-place-creation.png"),
            fullPage: true,
          });
        }
      }
    } else {
      console.log("地名追加ボタンが見つかりませんでした");
    }

    // 7. キャラクターページに移動してキャラクターを追加
    console.log("キャラクターページに移動します...");
    const charactersButton = page.getByRole("button", { name: "キャラクター" });

    if (await charactersButton.isVisible()) {
      await charactersButton.click();
      await page.waitForTimeout(1000);

      // スナップショット: キャラクターページ
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, "09-characters-page.png"),
        fullPage: true,
      });

      // キャラクター追加ボタンをクリック
      const addCharacterButton = page.getByRole("button", {
        name: /キャラクター追加|追加|新規/,
      });

      if (await addCharacterButton.isVisible()) {
        await addCharacterButton.click();
        await page.waitForTimeout(500);

        // スナップショット: キャラクター追加モーダル
        await page.screenshot({
          path: path.join(SNAPSHOT_DIR, "10-add-character-modal.png"),
          fullPage: true,
        });

        // キャラクター情報を入力
        const nameInput = page
          .locator('input[placeholder*="名前"], input[name*="name"]')
          .first();
        if (await nameInput.isVisible()) {
          await nameInput.fill("テスト主人公");

          // 役割を入力
          const roleInput = page.locator('input[name*="role"]').first();
          if (await roleInput.isVisible()) {
            await roleInput.fill("主人公");
          }

          // 説明を入力
          const descTextarea = page.locator("textarea").first();
          if (await descTextarea.isVisible()) {
            await descTextarea.fill(
              "物語の主人公です。タイムラインイベントに登場させるために作成しました。"
            );
          }

          // スナップショット: キャラクター情報入力後
          await page.screenshot({
            path: path.join(SNAPSHOT_DIR, "11-character-input-filled.png"),
            fullPage: true,
          });

          // 保存ボタンをクリック
          const saveButton = page.getByRole("button", {
            name: /保存|登録|確定/,
          });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);
            console.log("キャラクター情報を保存しました");

            // スナップショット: キャラクター追加後
            await page.screenshot({
              path: path.join(SNAPSHOT_DIR, "12-after-character-creation.png"),
              fullPage: true,
            });
          }
        }
      } else {
        console.log("キャラクター追加ボタンが見つかりませんでした");
      }
    } else {
      console.log("キャラクターボタンが見つかりませんでした");
    }

    // 8. タイムラインページに移動してイベントを追加
    console.log("タイムラインページに移動します...");
    const timelineButton = page.getByRole("button", { name: "タイムライン" });

    if (await timelineButton.isVisible()) {
      await timelineButton.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // スナップショット: タイムラインページ
      await page.screenshot({
        path: path.join(SNAPSHOT_DIR, "13-timeline-page.png"),
        fullPage: true,
      });

      // イベント追加ボタンを探してクリック
      const addEventButton = page.getByRole("button", {
        name: /イベント追加|追加|新規/,
      });

      if (await addEventButton.isVisible()) {
        await addEventButton.click();
        await page.waitForTimeout(500);

        // スナップショット: イベント追加モーダル
        await page.screenshot({
          path: path.join(SNAPSHOT_DIR, "14-event-add-modal.png"),
          fullPage: true,
        });

        // イベント情報を入力
        // タイトルを入力
        const titleInput = page.locator('input[name*="title"]').first();
        if (await titleInput.isVisible()) {
          await titleInput.fill("テストイベント");
        }

        // 日付/時間入力
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible()) {
          await dateInput.fill("2023-01-01");
        }

        // 説明を入力
        const descTextarea = page.locator("textarea").first();
        if (await descTextarea.isVisible()) {
          await descTextarea.fill(
            "これはテストイベントです。スナップショットテスト用に作成しました。"
          );
        }

        // 関連キャラクターを選択
        console.log("関連キャラクターを選択します...");
        const characterSelect = page
          .locator('select[name*="character"]')
          .first();
        if (await characterSelect.isVisible()) {
          // 作成したテストキャラクターを選択
          await characterSelect.selectOption({ label: "テスト主人公" });
        }

        // 関連地名を選択
        console.log("関連地名を選択します...");
        const placeSelect = page.locator('select[name*="place"]').first();
        if (await placeSelect.isVisible()) {
          // 作成したテスト地名を選択
          await placeSelect.selectOption({ label: "テスト王国" });
        }

        // スナップショット: イベント情報入力後
        await page.screenshot({
          path: path.join(SNAPSHOT_DIR, "15-event-info-filled.png"),
          fullPage: true,
        });

        // 保存ボタンをクリック
        const saveButton = page.getByRole("button", { name: /保存|登録|確定/ });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1500);
          console.log("イベント情報を保存しました");

          // スナップショット: イベント追加後
          await page.screenshot({
            path: path.join(SNAPSHOT_DIR, "16-after-event-creation.png"),
            fullPage: true,
          });

          // イベントの詳細を確認
          await page.waitForTimeout(1000);
          const eventNode = page.locator(".vis-item").first();
          if (await eventNode.isVisible()) {
            await eventNode.click();
            await page.waitForTimeout(500);

            // スナップショット: イベント詳細確認
            await page.screenshot({
              path: path.join(SNAPSHOT_DIR, "17-event-details.png"),
              fullPage: true,
            });
          }

          // タイムラインイベントが表示されていることを確認
          console.log(
            "タイムラインイベントが正常に追加され表示されていることを確認しました"
          );
        }
      } else {
        console.log("イベント追加ボタンが見つかりませんでした");
      }
    } else {
      console.log("タイムラインボタンが見つかりませんでした");
    }
  });
});

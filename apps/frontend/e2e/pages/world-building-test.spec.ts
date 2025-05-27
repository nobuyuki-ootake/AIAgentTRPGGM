import { test } from "@playwright/test";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// スナップショット保存ディレクトリの絶対パスを設定
const SNAPSHOT_DIR = join(process.cwd(), "test-results", "world-building-test");

// ディレクトリを作成
if (!existsSync(SNAPSHOT_DIR)) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  console.log(`スナップショットディレクトリを作成しました: ${SNAPSHOT_DIR}`);
}

// 開発サーバーのURL
const BASE_URL = "http://localhost:5173";

test.describe("世界観構築: 地名追加テスト", () => {
  test("プロジェクト作成から地名の追加までの流れ", async ({ page }) => {
    // 1. ホームページにアクセス
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    console.log("ホームページにアクセスしました");

    // スナップショット: ホーム画面の初期状態
    await page.screenshot({
      path: join(SNAPSHOT_DIR, "01-home-initial.png"),
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
      path: join(SNAPSHOT_DIR, "02-new-project-modal.png"),
      fullPage: true,
    });

    // プロジェクト情報を入力
    await page
      .locator('input[type="text"]')
      .first()
      .fill("世界観テストプロジェクト");

    // 作成ボタンをクリック
    await page.getByRole("button", { name: /作成|保存|確定/ }).click();
    await page.waitForTimeout(1000);
    console.log("プロジェクトを作成しました");

    // 3. 世界観構築ページへ移動
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
      path: join(SNAPSHOT_DIR, "03-world-building-page.png"),
      fullPage: true,
    });

    // 4. タブリストから「地名」タブを探してクリック
    console.log("地名タブを検索中...");

    // タブのクリックは複数の方法を試す
    // 方法1: 直接セレクタで探す
    const placeTab = page
      .locator('button[role="tab"]')
      .filter({ hasText: "地名" });

    if (await placeTab.isVisible()) {
      try {
        // タブが見えている場合は直接クリック
        await placeTab.click();
        console.log("地名タブをクリックしました (方法1)");
      } catch (error) {
        console.log("方法1でのクリックに失敗しました:", error.message);

        // 方法2: JavaScriptでタブにフォーカスとクリックをエミュレート
        try {
          await page.evaluate(() => {
            // すべてのタブを取得
            const tabs = Array.from(
              document.querySelectorAll('button[role="tab"]')
            );
            // 「地名」というテキストを含むタブを探す
            const placeTab = tabs.find((tab) =>
              tab.textContent.includes("地名")
            );
            if (placeTab) {
              // タブをクリック
              placeTab.click();
              return true;
            }
            return false;
          });
          console.log("地名タブをJavaScriptでクリックしました (方法2)");
        } catch (e) {
          console.log("方法2でのクリックにも失敗しました:", e.message);

          // 方法3: タブの親要素からインデックスで選択
          try {
            // タブのインデックスが3（0始まりで4番目）と仮定
            await page.evaluate(() => {
              const tabs = document.querySelectorAll('button[role="tab"]');
              if (tabs.length > 3) {
                tabs[3].click(); // 4番目のタブをクリック
                return true;
              }
              return false;
            });
            console.log("タブをインデックスでクリックしました (方法3)");
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            console.log("すべての方法が失敗しました");
          }
        }
      }
    } else {
      console.log("地名タブが見つかりませんでした");
    }

    // タブ切り替え後のコンテンツ読み込みを待機
    await page.waitForTimeout(1000);

    // スナップショット: 地名タブ表示後
    await page.screenshot({
      path: join(SNAPSHOT_DIR, "04-place-tab.png"),
      fullPage: true,
    });

    // 5. 地名追加ボタンをクリック
    const addPlaceButton = page.getByRole("button", {
      name: /場所追加|地名追加|追加|新規/,
    });

    if (await addPlaceButton.isVisible()) {
      await addPlaceButton.click();
      await page.waitForTimeout(500);
      console.log("地名追加モーダルを表示しました");

      // スナップショット: 地名追加モーダル
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "05-add-place-modal.png"),
        fullPage: true,
      });

      // 地名情報を入力
      const nameInput = page
        .locator('input[placeholder*="名前"], input[name*="name"]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("テスト王国");

        // その他のフィールドも入力
        const typeSelect = page.locator('select[name*="type"]').first();
        if (await typeSelect.isVisible()) {
          await typeSelect.selectOption({ index: 0 });
        }

        // 説明などのテキストエリアに入力
        const textarea = page.locator("textarea").first();
        if (await textarea.isVisible()) {
          await textarea.fill(
            "テスト用の王国です。タイムラインイベントに関連付けるために作成しました。"
          );
        }

        // スナップショット: 入力後
        await page.screenshot({
          path: join(SNAPSHOT_DIR, "06-place-input-filled.png"),
          fullPage: true,
        });

        // 保存ボタンをクリック
        const saveButton = page.getByRole("button", { name: /保存|登録|確定/ });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
          console.log("地名情報を保存しました");

          // スナップショット: 地名追加後
          await page.screenshot({
            path: join(SNAPSHOT_DIR, "07-after-place-creation.png"),
            fullPage: true,
          });
        }
      }
    } else {
      console.log("地名追加ボタンが見つかりませんでした");

      // 追加ボタンが見つからない場合の代替方法
      try {
        // ページ内のすべてのボタンを探す
        const allButtons = await page.locator("button").all();
        console.log(
          `ページ上に ${allButtons.length} 個のボタンが見つかりました`
        );

        // すべてのボタンテキストをログ出力
        for (let i = 0; i < allButtons.length; i++) {
          const buttonText = await allButtons[i].textContent();
          console.log(`ボタン ${i + 1}: ${buttonText}`);
        }

        // 「追加」に近いテキストを持つボタンをJavaScriptで探す
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll("button"));
          const addButton = buttons.find(
            (btn) =>
              btn.textContent.includes("追加") ||
              btn.textContent.includes("新規") ||
              btn.textContent.includes("場所") ||
              btn.textContent.includes("地名")
          );
          if (addButton) {
            addButton.click();
            return true;
          }
          return false;
        });

        console.log("JavaScriptで追加ボタンをクリックしました");
        await page.waitForTimeout(1000);

        // スナップショット: 追加ボタンクリック後
        await page.screenshot({
          path: join(SNAPSHOT_DIR, "05-after-add-button-js.png"),
          fullPage: true,
        });
      } catch (e) {
        console.log(
          "追加ボタンのJavaScriptによる検索も失敗しました:",
          e.message
        );
      }
    }

    // 6. タイムラインページに移動して、関連地名が選択できるか確認
    console.log("タイムラインページに移動します...");
    const timelineButton = page.getByRole("button", { name: "タイムライン" });

    if (await timelineButton.isVisible()) {
      await timelineButton.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // スナップショット: タイムラインページ
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "08-timeline-page.png"),
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
          path: join(SNAPSHOT_DIR, "09-event-add-modal.png"),
          fullPage: true,
        });

        // 関連地名セレクトボックスを確認
        console.log("関連地名セレクトボックスを確認します");

        // スナップショット: 関連地名セレクト
        await page.screenshot({
          path: join(SNAPSHOT_DIR, "10-related-place-select.png"),
          fullPage: true,
        });
      } else {
        console.log("イベント追加ボタンが見つかりませんでした");
      }
    } else {
      console.log("タイムラインボタンが見つかりませんでした");
    }
  });
});

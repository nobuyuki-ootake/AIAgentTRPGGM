import { chromium } from "@playwright/test";

// スナップショットを保存するディレクトリ
const SNAPSHOT_DIR = "e2e/playwright-snapshots/results";

// キャプチャするページの一覧
const pages = [
  { name: "home", path: "/" },
  { name: "writing", path: "/writing" },
  { name: "characters", path: "/characters" },
  { name: "plot", path: "/plot" },
  { name: "world-building", path: "/world-building" },
  { name: "timeline", path: "/timeline" },
  { name: "synopsis", path: "/synopsis" },
];

// メイン処理
async function captureSnapshots() {
  console.log("スナップショットキャプチャを開始します...");

  // ブラウザを起動
  const browser = await chromium.launch({
    headless: false, // UIを表示
  });

  try {
    // 新しいブラウザコンテキストを作成
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }, // スクリーンサイズを設定
    });

    // 新しいページを開く
    const page = await context.newPage();

    // 各ページをキャプチャ
    for (const pageInfo of pages) {
      console.log(`ページをキャプチャ: ${pageInfo.name}`);

      // ページに移動
      await page.goto(`http://localhost:5173${pageInfo.path}`);

      // ネットワークがアイドル状態になるまで待機
      await page.waitForLoadState("networkidle");

      // アニメーションが完了するのを待機
      await page.waitForTimeout(1000);

      // スクリーンショットを撮影
      await page.screenshot({
        path: `${SNAPSHOT_DIR}/${pageInfo.name}-snapshot.png`,
        fullPage: true,
      });

      console.log(`スナップショット保存完了: ${pageInfo.name}`);
    }

    // 以下はオプション: 特定の要素をキャプチャする例

    // ホームページのナビゲーションメニューをキャプチャ
    await page.goto("http://localhost:5173/");
    await page.waitForLoadState("networkidle");

    const navElement = await page.$("nav");
    if (navElement) {
      await navElement.screenshot({
        path: `${SNAPSHOT_DIR}/navigation-menu.png`,
      });
      console.log("ナビゲーションメニューをキャプチャしました");
    }

    // キャラクターページで追加ボタンをクリック
    await page.goto("http://localhost:5173/characters");
    await page.waitForLoadState("networkidle");

    const addCharacterButton = await page.getByRole("button", {
      name: /キャラクター追加|追加|新規/,
    });

    if (await addCharacterButton.isVisible()) {
      await addCharacterButton.click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `${SNAPSHOT_DIR}/characters-add-modal.png`,
        fullPage: true,
      });
      console.log("キャラクター追加モーダルをキャプチャしました");
    }
  } catch (error) {
    console.error("スナップショットキャプチャ中にエラーが発生しました:", error);
  } finally {
    // ブラウザを閉じる
    await browser.close();
    console.log("スナップショットキャプチャが完了しました");
  }
}

// スクリプトを実行
captureSnapshots().catch(console.error);

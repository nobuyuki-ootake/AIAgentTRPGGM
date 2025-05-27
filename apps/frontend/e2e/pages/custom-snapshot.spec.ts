import { test } from "@playwright/test";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// スナップショット保存ディレクトリの絶対パスを設定
const SNAPSHOT_DIR = join(process.cwd(), "test-results", "snapshots");

// ディレクトリを作成
if (!existsSync(SNAPSHOT_DIR)) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  console.log(`スナップショットディレクトリを作成しました: ${SNAPSHOT_DIR}`);
}

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

// 基本的なスナップショットテスト
test.describe("基本ページスナップショット", () => {
  for (const pageInfo of pages) {
    test(`${pageInfo.name}ページのスナップショット`, async ({ page }) => {
      console.log(`ページをキャプチャ: ${pageInfo.name}`);

      // ページに移動
      await page.goto(`http://localhost:5173${pageInfo.path}`);

      // ネットワークがアイドル状態になるまで待機
      await page.waitForLoadState("networkidle");

      // アニメーションが完了するのを待機
      await page.waitForTimeout(1000);

      // スクリーンショットを撮影
      await page.screenshot({
        path: join(SNAPSHOT_DIR, `${pageInfo.name}-snapshot.png`),
        fullPage: true,
      });

      console.log(`スナップショット保存完了: ${pageInfo.name}`);
    });
  }
});

// 特定の要素のスナップショット
test.describe("コンポーネントスナップショット", () => {
  test("ナビゲーションメニューのスナップショット", async ({ page }) => {
    // ホームページに移動
    await page.goto("http://localhost:5173/");
    await page.waitForLoadState("networkidle");

    // ナビゲーション要素を検索
    const navElement = await page.$("nav");
    if (navElement) {
      await navElement.screenshot({
        path: join(SNAPSHOT_DIR, "navigation-menu.png"),
      });
      console.log("ナビゲーションメニューをキャプチャしました");
    } else {
      console.log("ナビゲーションメニュー要素が見つかりませんでした");
    }
  });

  test("ヘッダーのスナップショット", async ({ page }) => {
    // ホームページに移動
    await page.goto("http://localhost:5173/");
    await page.waitForLoadState("networkidle");

    // ヘッダー要素を検索
    const headerElement = await page.$("header");
    if (headerElement) {
      await headerElement.screenshot({
        path: join(SNAPSHOT_DIR, "header.png"),
      });
      console.log("ヘッダーをキャプチャしました");
    } else {
      console.log("ヘッダー要素が見つかりませんでした");
    }
  });
});

// インタラクション後のスナップショット
test.describe("インタラクション後のスナップショット", () => {
  test("キャラクター追加モーダルのスナップショット", async ({ page }) => {
    // キャラクターページに移動
    await page.goto("http://localhost:5173/characters");
    await page.waitForLoadState("networkidle");

    // 追加ボタンを検索
    const addButton = page.getByRole("button", {
      name: /キャラクター追加|追加|新規/,
    });

    if (await addButton.isVisible()) {
      // ボタンをクリック
      await addButton.click();
      await page.waitForTimeout(1000);

      // モーダルが表示された状態をキャプチャ
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "characters-add-modal.png"),
        fullPage: true,
      });
      console.log("キャラクター追加モーダルをキャプチャしました");
    } else {
      console.log("キャラクター追加ボタンが見つかりませんでした");
    }
  });

  test("世界観追加モーダルのスナップショット", async ({ page }) => {
    // 世界観ページに移動
    await page.goto("http://localhost:5173/world-building");
    await page.waitForLoadState("networkidle");

    // 追加ボタンを検索
    const addButton = page.getByRole("button", {
      name: /場所追加|追加|新規/,
    });

    if (await addButton.isVisible()) {
      // ボタンをクリック
      await addButton.click();
      await page.waitForTimeout(1000);

      // モーダルが表示された状態をキャプチャ
      await page.screenshot({
        path: join(SNAPSHOT_DIR, "worldbuilding-add-modal.png"),
        fullPage: true,
      });
      console.log("場所追加モーダルをキャプチャしました");
    } else {
      console.log("場所追加ボタンが見つかりませんでした");
    }
  });
});

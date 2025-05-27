import { test } from "@playwright/test";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// スナップショット保存ディレクトリ
const SNAPSHOT_DIR = join(
  process.cwd(),
  "test-results",
  "simple-timeline-test"
);

// ディレクトリが存在しない場合は作成
if (!existsSync(SNAPSHOT_DIR)) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  console.log(`ディレクトリを作成しました: ${SNAPSHOT_DIR}`);
}

// 開発サーバーのURL
const BASE_URL = "http://localhost:5173";

/**
 * シンプルなワークフローテスト
 * キャラクター1件作成、世界観タブ→地名→地名1件追加、イベント登録まで
 */
test("キャラクター作成、地名追加、イベント登録のワークフロー", async ({
  page,
}) => {
  test.setTimeout(120000); // 2分間のタイムアウト

  console.log(
    "テスト開始: キャラクター作成、地名追加、イベント登録のワークフロー"
  );

  // ステップ1: ホームページに移動してプロジェクト作成
  await page.goto(BASE_URL + "/home");
  await page.waitForLoadState("networkidle");
  console.log("ホームページに移動完了");

  // スナップショット: ホーム画面
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "01-home-page.png"),
  });

  // 新規プロジェクト作成
  await page.getByRole("button", { name: "新規プロジェクト" }).click();
  await page
    .getByRole("textbox", { name: "プロジェクト名" })
    .fill("テスト用プロジェクト");
  await page.getByRole("button", { name: "作成" }).click();
  await page.waitForTimeout(1000);
  console.log("プロジェクト作成完了");

  // ステップ2: キャラクター作成
  await page.getByRole("button", { name: "キャラクター" }).click();
  // 創作メニューを閉じる
  await page.evaluate(() => {
    // サイドバーを強制的に閉じる
    localStorage.setItem("sidebarOpen", "false");
    const event = new Event("closeSidebar");
    window.dispatchEvent(event);
  });
  await page.waitForTimeout(500);

  // 新規キャラクター作成
  await page.getByRole("button", { name: "新規キャラクター" }).click();
  await page.getByRole("textbox", { name: "名前" }).fill("テスト太郎");
  await page.getByRole("combobox", { name: "役割 脇役" }).click();
  await page.getByRole("option", { name: "主人公" }).click();
  await page.getByRole("button", { name: "保存" }).click();
  await page.waitForTimeout(1000);
  console.log("キャラクター作成完了");

  // スナップショット: キャラクター作成後
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "02-character-created.png"),
  });

  // ステップ3: 世界観構築→地名タブ→地名追加
  await page.getByRole("button", { name: "menu" }).click();
  await page.getByRole("button", { name: "世界観構築" }).click();
  // 創作メニューを閉じる
  await page.evaluate(() => {
    // サイドバーを強制的に閉じる
    localStorage.setItem("sidebarOpen", "false");
    const event = new Event("closeSidebar");
    window.dispatchEvent(event);
  });
  await page.waitForTimeout(500);

  // 地名タブに移動
  await page.getByRole("tab", { name: "地名" }).click();
  await page.waitForTimeout(500);

  // 地名入力フォームはすでに表示されているので直接入力する
  await page.getByRole("textbox", { name: "地名" }).fill("テスト王国");
  await page.getByRole("textbox", { name: "物語における重要性" }).fill("高");
  await page.getByRole("textbox", { name: "説明" }).fill("テスト用の王国です");
  await page.getByRole("button", { name: "追加" }).click();
  await page.getByRole("button", { name: "保存" }).click();
  await page.waitForTimeout(1000);
  console.log("地名追加完了");

  // スナップショット: 地名追加後
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "03-place-added.png"),
  });

  // ステップ4: タイムラインページに移動してイベント追加
  await page.getByRole("button", { name: "menu" }).click();
  await page.getByRole("button", { name: "タイムライン" }).click();
  // 創作メニューを閉じる
  await page.evaluate(() => {
    // サイドバーを強制的に閉じる
    localStorage.setItem("sidebarOpen", "false");
    const event = new Event("closeSidebar");
    window.dispatchEvent(event);
  });
  await page.waitForTimeout(500);

  // イベント追加ボタンをクリック
  await page.getByRole("button", { name: "イベント追加" }).click();
  await page.waitForTimeout(500);

  // イベント情報入力
  await page
    .getByRole("textbox", { name: "イベントタイトル" })
    .fill("テストイベント");
  await page.getByRole("combobox", { name: "関連キャラクター" }).click();
  await page.getByRole("option", { name: /テスト太郎/ }).click();
  // 画面の空白部分をクリックしてドロップダウンを閉じる
  await page.mouse.click(10, 10);

  await page.getByRole("combobox", { name: "関連地名" }).click();
  await page.getByRole("option", { name: "テスト王国" }).click();
  // 画面の空白部分をクリックしてドロップダウンを閉じる
  await page.mouse.click(10, 10);

  await page
    .getByRole("textbox", { name: "説明" })
    .fill("テスト用のイベントです");
  await page.getByRole("button", { name: "追加" }).click();
  await page.waitForTimeout(1000);
  console.log("イベント追加完了");

  // イベント追加後に保存ボタンをクリック
  await page.getByRole("button", { name: "保存" }).click();
  await page.waitForTimeout(1000);

  // スナップショット: イベント追加後
  await page.screenshot({
    path: join(SNAPSHOT_DIR, "04-event-added.png"),
  });

  console.log("テスト完了: すべてのステップが正常に完了しました");
});

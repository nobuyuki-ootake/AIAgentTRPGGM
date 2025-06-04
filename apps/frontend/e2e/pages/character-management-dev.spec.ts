import { test, expect, Page } from '@playwright/test';

/**
 * 👥 キャラクター管理テスト - 開発者モード
 * 開発者ユーザーがPC/NPC/エネミーを管理するフローをテスト
 */
test.describe('キャラクター管理テスト - 開発者モード', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 開発者モードを有効化
    await enableDeveloperMode(page);
  });

  async function enableDeveloperMode(page: Page) {
    const devModeToggle = page.locator('[data-testid="developer-mode-toggle"]');
    if (await devModeToggle.isVisible()) {
      const isChecked = await devModeToggle.isChecked();
      if (!isChecked) {
        await devModeToggle.check();
        await page.waitForTimeout(500); // UI更新を待つ
      }
    }
  }

  test('should add PC/NPC/Enemy characters via UI', async () => {
    test.setTimeout(90000);

    // ============================================================================
    // 1. 開発者モード切り替え確認
    // ============================================================================
    await test.step('開発者モードUI変化の確認', async () => {
      // 開発者モード有効時のUI要素確認
      await expect(page.locator('[data-testid="dev-mode-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="dev-mode-indicator"]')).toHaveText(/開発者モード|Developer Mode/);

      // 追加メニューが表示されることを確認
      await page.click('[href="/characters"]');
      await page.waitForLoadState('networkidle');

      await expect(page.locator('[data-testid="add-pc-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-npc-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="add-enemy-button"]')).toBeVisible();
    });

    // ============================================================================
    // 2. PCキャラクター追加・編集・削除
    // ============================================================================
    await test.step('PCキャラクターの作成', async () => {
      await page.click('[data-testid="add-pc-button"]');
      await page.waitForSelector('[data-testid="character-form-dialog"]');

      // 基本情報入力
      await page.fill('[data-testid="character-name"]', 'エルフの魔法使い アリシア');
      await page.fill('[data-testid="character-level"]', '5');
      await page.selectOption('[data-testid="character-race"]', 'elf');
      await page.selectOption('[data-testid="character-class"]', 'wizard');

      // 能力値設定
      await page.fill('[data-testid="stat-strength"]', '8');
      await page.fill('[data-testid="stat-dexterity"]', '14');
      await page.fill('[data-testid="stat-constitution"]', '12');
      await page.fill('[data-testid="stat-intelligence"]', '18');
      await page.fill('[data-testid="stat-wisdom"]', '13');
      await page.fill('[data-testid="stat-charisma"]', '11');

      // 背景設定
      await page.fill('[data-testid="character-background"]', 
        '古代魔法を研究する若きエルフの魔術師。失われた知識を求めて冒険の旅に出た。');

      // スキル選択
      await page.click('[data-testid="skill-arcana"]');
      await page.click('[data-testid="skill-history"]');
      await page.click('[data-testid="skill-investigation"]');

      // 初期装備
      await page.click('[data-testid="equipment-tab"]');
      await page.click('[data-testid="add-equipment"]');
      await page.fill('[data-testid="equipment-name"]', '魔法の杖');
      await page.selectOption('[data-testid="equipment-type"]', 'weapon');
      await page.click('[data-testid="save-equipment"]');

      // 画像設定
      await page.click('[data-testid="image-tab"]');
      // ファイルアップロードをスキップし、デフォルト画像を使用
      await page.click('[data-testid="use-default-image"]');

      // 保存
      await page.click('[data-testid="save-character"]');
      await page.waitForSelector('[data-testid="save-success-notification"]');

      // 作成確認
      await expect(page.locator('[data-testid="character-card"]:has-text("アリシア")')).toBeVisible();
    });

    await test.step('PCキャラクターの編集', async () => {
      // キャラクターカードのメニューを開く
      await page.click('[data-testid="character-card"]:has-text("アリシア") [data-testid="character-menu"]');
      await page.click('[data-testid="edit-character"]');

      // レベルアップ
      await page.fill('[data-testid="character-level"]', '6');
      
      // 新しいスキル追加
      await page.click('[data-testid="skill-perception"]');

      // HP更新
      await page.fill('[data-testid="character-hp-max"]', '32');

      // 変更を保存
      await page.click('[data-testid="save-character"]');
      await page.waitForSelector('[data-testid="update-success-notification"]');

      // 更新確認
      const characterCard = page.locator('[data-testid="character-card"]:has-text("アリシア")');
      await expect(characterCard.locator('[data-testid="character-level-display"]')).toHaveText('Lv.6');
    });

    // ============================================================================
    // 3. NPCキャラクター管理
    // ============================================================================
    await test.step('NPCキャラクターの追加', async () => {
      await page.click('[data-testid="add-npc-button"]');
      await page.waitForSelector('[data-testid="character-form-dialog"]');

      // NPC基本情報
      await page.fill('[data-testid="character-name"]', '宿屋の主人 ガストン');
      await page.selectOption('[data-testid="npc-role"]', 'merchant');
      await page.selectOption('[data-testid="npc-importance"]', 'recurring');

      // NPC特有の設定
      await page.fill('[data-testid="npc-location"]', '冒険者の宿「銀の竪琴亭」');
      await page.fill('[data-testid="npc-schedule"]', '朝6時〜深夜2時まで営業');
      
      // 性格・特徴
      await page.fill('[data-testid="npc-personality"]', 
        '陽気で親切な中年男性。元冒険者で、若い冒険者たちの相談相手。');

      // 提供サービス
      await page.click('[data-testid="npc-services-tab"]');
      await page.click('[data-testid="service-lodging"]');
      await page.click('[data-testid="service-meals"]');
      await page.click('[data-testid="service-information"]');

      // 会話パターン設定
      await page.click('[data-testid="dialogue-tab"]');
      await page.click('[data-testid="add-dialogue"]');
      await page.fill('[data-testid="dialogue-trigger"]', '宿泊');
      await page.fill('[data-testid="dialogue-response"]', 
        'ようこそ銀の竪琴亭へ！一晩10ゴールドで、朝食付きだよ。');
      await page.click('[data-testid="save-dialogue"]');

      // 保存
      await page.click('[data-testid="save-character"]');
      await page.waitForSelector('[data-testid="save-success-notification"]');

      // NPCタブで確認
      await page.click('[data-testid="npc-tab"]');
      await expect(page.locator('[data-testid="npc-card"]:has-text("ガストン")')).toBeVisible();
    });

    // ============================================================================
    // 4. エネミーキャラクター管理
    // ============================================================================
    await test.step('エネミーキャラクターの追加', async () => {
      await page.click('[data-testid="add-enemy-button"]');
      await page.waitForSelector('[data-testid="character-form-dialog"]');

      // エネミー基本情報
      await page.fill('[data-testid="character-name"]', 'ゴブリンの斥候');
      await page.selectOption('[data-testid="enemy-type"]', 'humanoid');
      await page.selectOption('[data-testid="enemy-cr"]', '0.25'); // Challenge Rating

      // 戦闘ステータス
      await page.fill('[data-testid="enemy-ac"]', '13');
      await page.fill('[data-testid="enemy-hp"]', '7');
      await page.fill('[data-testid="enemy-speed"]', '30');

      // 能力値（簡略版）
      await page.fill('[data-testid="stat-strength"]', '8');
      await page.fill('[data-testid="stat-dexterity"]', '14');
      await page.fill('[data-testid="stat-constitution"]', '10');
      await page.fill('[data-testid="stat-intelligence"]', '10');
      await page.fill('[data-testid="stat-wisdom"]', '8');
      await page.fill('[data-testid="stat-charisma"]', '8');

      // 攻撃設定
      await page.click('[data-testid="attacks-tab"]');
      await page.click('[data-testid="add-attack"]');
      await page.fill('[data-testid="attack-name"]', '短剣');
      await page.fill('[data-testid="attack-bonus"]', '+4');
      await page.fill('[data-testid="attack-damage"]', '1d4+2');
      await page.selectOption('[data-testid="attack-type"]', 'piercing');
      await page.click('[data-testid="save-attack"]');

      // AI戦術設定
      await page.click('[data-testid="ai-behavior-tab"]');
      await page.selectOption('[data-testid="ai-aggression"]', 'cautious');
      await page.selectOption('[data-testid="ai-intelligence-level"]', 'low');
      await page.click('[data-testid="ai-flee-when-outnumbered"]');
      await page.fill('[data-testid="ai-flee-hp-threshold"]', '2');

      // 保存
      await page.click('[data-testid="save-character"]');
      await page.waitForSelector('[data-testid="save-success-notification"]');

      // エネミータブで確認
      await page.click('[data-testid="enemy-tab"]');
      await expect(page.locator('[data-testid="enemy-card"]:has-text("ゴブリンの斥候")')).toBeVisible();
    });

    // ============================================================================
    // 5. キャラクター画像アップロード機能確認
    // ============================================================================
    await test.step('画像アップロード機能', async () => {
      // 既存キャラクターを編集
      await page.click('[data-testid="pc-tab"]');
      await page.click('[data-testid="character-card"]:has-text("アリシア") [data-testid="character-menu"]');
      await page.click('[data-testid="edit-character"]');

      await page.click('[data-testid="image-tab"]');

      // AI画像生成オプション確認
      await expect(page.locator('[data-testid="ai-image-generate"]')).toBeVisible();
      
      // プロンプト入力
      await page.fill('[data-testid="image-prompt"]', 
        'エルフの女性魔法使い、青いローブ、魔法の杖を持つ、ファンタジーイラスト風');
      
      // 生成ボタン（実際の生成はスキップ）
      const generateButton = page.locator('[data-testid="generate-image"]');
      await expect(generateButton).toBeVisible();
      
      // キャンセルして閉じる
      await page.click('[data-testid="cancel-edit"]');
    });

    // ============================================================================
    // 6. キャラクター一覧での表示・編集・削除確認
    // ============================================================================
    await test.step('キャラクター一覧操作', async () => {
      // フィルター機能
      await page.click('[data-testid="pc-tab"]');
      await page.fill('[data-testid="character-search"]', 'アリシア');
      await expect(page.locator('[data-testid="character-card"]')).toHaveCount(1);
      await page.fill('[data-testid="character-search"]', ''); // クリア

      // ソート機能
      await page.selectOption('[data-testid="sort-characters"]', 'level-desc');
      
      // 一括選択
      await page.click('[data-testid="select-mode-toggle"]');
      await page.click('[data-testid="character-card"]:has-text("アリシア") [data-testid="select-checkbox"]');
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();

      // 削除確認（実行はしない）
      await page.click('[data-testid="bulk-delete"]');
      await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible();
      await page.click('[data-testid="cancel-delete"]');
      
      // 選択モード解除
      await page.click('[data-testid="select-mode-toggle"]');
    });

    // ============================================================================
    // 7. ゲームシステムテンプレート適用確認
    // ============================================================================
    await test.step('テンプレート適用', async () => {
      await page.click('[data-testid="add-pc-button"]');
      await page.waitForSelector('[data-testid="character-form-dialog"]');

      // テンプレート選択
      await page.click('[data-testid="use-template"]');
      await page.waitForSelector('[data-testid="template-selector"]');

      // D&D 5eテンプレート選択
      await page.click('[data-testid="template-dnd5e"]');
      await page.click('[data-testid="template-class-fighter"]');
      await page.click('[data-testid="apply-template"]');

      // テンプレートが適用されたことを確認
      await expect(page.locator('[data-testid="character-class"]')).toHaveValue('fighter');
      await expect(page.locator('[data-testid="stat-strength"]')).not.toHaveValue('');

      // キャンセルして閉じる
      await page.click('[data-testid="cancel-create"]');
    });

    // ============================================================================
    // エビデンス収集
    // ============================================================================
    await test.step('スクリーンショット収集', async () => {
      // PC一覧
      await page.click('[data-testid="pc-tab"]');
      await page.screenshot({
        path: 'evidence/character-management-pc-list.png',
        fullPage: true
      });

      // NPC一覧
      await page.click('[data-testid="npc-tab"]');
      await page.screenshot({
        path: 'evidence/character-management-npc-list.png',
        fullPage: true
      });

      // エネミー一覧
      await page.click('[data-testid="enemy-tab"]');
      await page.screenshot({
        path: 'evidence/character-management-enemy-list.png',
        fullPage: true
      });
    });
  });

  test('キャラクターインポート機能', async () => {
    await test.step('各種形式でのインポート', async () => {
      await page.goto('/characters');
      await page.click('[data-testid="import-character-button"]');
      await page.waitForSelector('[data-testid="import-dialog"]');

      // インポート形式選択
      const formats = ['udonarium', 'foundry-vtt', 'roll20', 'json'];
      
      for (const format of formats) {
        await page.click(`[data-testid="import-format-${format}"]`);
        
        // 各形式の説明が表示されることを確認
        await expect(page.locator('[data-testid="format-description"]')).toBeVisible();
        
        // サンプルデータのダウンロードリンク確認
        await expect(page.locator('[data-testid="download-sample"]')).toBeVisible();
      }

      // JSONインポートのテスト
      await page.click('[data-testid="import-format-json"]');
      
      // テストデータを入力
      const testCharacterData = {
        name: "インポートテストキャラクター",
        level: 3,
        class: "ranger",
        race: "human",
        stats: {
          strength: 14,
          dexterity: 16,
          constitution: 13,
          intelligence: 11,
          wisdom: 14,
          charisma: 10
        }
      };

      await page.fill('[data-testid="import-json-textarea"]', JSON.stringify(testCharacterData, null, 2));
      
      // プレビュー
      await page.click('[data-testid="preview-import"]');
      await expect(page.locator('[data-testid="import-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-name"]')).toHaveText('インポートテストキャラクター');
      
      // インポート実行
      await page.click('[data-testid="confirm-import"]');
      await page.waitForSelector('[data-testid="import-success-notification"]');
      
      // インポートされたキャラクターを確認
      await expect(page.locator('[data-testid="character-card"]:has-text("インポートテストキャラクター")')).toBeVisible();
    });
  });

  test('キャラクター関係性マップ', async () => {
    await test.step('関係性の設定と表示', async () => {
      await page.goto('/characters');
      
      // 関係性マップビューに切り替え
      await page.click('[data-testid="view-relationship-map"]');
      await page.waitForSelector('[data-testid="relationship-map-canvas"]');
      
      // キャラクター間の関係を追加
      const character1 = page.locator('[data-testid="map-character-node"]:has-text("アリシア")');
      const character2 = page.locator('[data-testid="map-character-node"]:has-text("ガストン")');
      
      // ドラッグで関係線を引く（シミュレート）
      await character1.click();
      await page.click('[data-testid="add-relationship"]');
      await character2.click();
      
      // 関係性詳細を入力
      await page.waitForSelector('[data-testid="relationship-dialog"]');
      await page.selectOption('[data-testid="relationship-type"]', 'ally');
      await page.fill('[data-testid="relationship-description"]', '宿の常連客');
      await page.click('[data-testid="save-relationship"]');
      
      // 関係線が表示されることを確認
      await expect(page.locator('[data-testid="relationship-line"]')).toBeVisible();
    });
  });
});
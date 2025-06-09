// @ts-nocheck
import { TRPGCampaign } from "@trpg-ai-gm/types";

/**
 * TRPGキャンペーン管理用のローカルストレージマネージャー
 */
export class TRPGLocalStorageManager {
  private static readonly CAMPAIGN_KEY_PREFIX = "trpg_campaign_";
  private static readonly CAMPAIGN_LIST_KEY = "trpg_campaign_list";
  private static readonly CURRENT_CAMPAIGN_KEY = "currentCampaignId";


  /**
   * キャンペーンをローカルストレージに保存する
   * @param campaign 保存するキャンペーン
   * @returns 成功したかどうか
   */
  static saveCampaign(campaign: TRPGCampaign): boolean {
    try {
      // キャンペーンデータをJSON文字列に変換して保存
      const campaignJson = JSON.stringify(campaign);
      localStorage.setItem(
        `${this.CAMPAIGN_KEY_PREFIX}${campaign.id}`,
        campaignJson
      );

      // キャンペーンリストを更新
      this.addCampaignToList(campaign);

      console.log(`キャンペーン保存成功: ${campaign.title}`);
      return true;
    } catch (error) {
      console.error("キャンペーンの保存に失敗しました:", error);
      return false;
    }
  }

  /**
   * キャンペーンをローカルストレージから読み込む
   * @param campaignId キャンペーンID
   * @returns キャンペーンデータ、存在しない場合はnull
   */
  static loadCampaign(campaignId: string): TRPGCampaign | null {
    try {
      const campaignJson = localStorage.getItem(
        `${this.CAMPAIGN_KEY_PREFIX}${campaignId}`
      );
      if (!campaignJson) return null;

      const campaign = JSON.parse(campaignJson) as TRPGCampaign;
      
      // 日付オブジェクトの復元
      if (campaign.createdAt) {
        campaign.createdAt = new Date(campaign.createdAt);
      }
      if (campaign.updatedAt) {
        campaign.updatedAt = new Date(campaign.updatedAt);
      }

      return campaign;
    } catch (error) {
      console.error("キャンペーンの読み込みに失敗しました:", error);
      return null;
    }
  }

  /**
   * キャンペーンをローカルストレージから削除する
   * @param campaignId キャンペーンID
   * @returns 成功したかどうか
   */
  static deleteCampaign(campaignId: string): boolean {
    try {
      // キャンペーンデータを削除
      localStorage.removeItem(`${this.CAMPAIGN_KEY_PREFIX}${campaignId}`);

      // キャンペーンリストから削除
      this.removeCampaignFromList(campaignId);

      // 現在選択中のキャンペーンの場合はクリア
      if (this.getCurrentCampaignId() === campaignId) {
        this.setCurrentCampaignId(null);
      }

      return true;
    } catch (error) {
      console.error("キャンペーンの削除に失敗しました:", error);
      return false;
    }
  }

  /**
   * 保存されているすべてのキャンペーンのメタデータのリストを取得する
   * @returns キャンペーンメタデータのリスト
   */
  static getCampaignList(): Array<{
    id: string;
    title: string;
    updatedAt: string;
    summary?: string;
  }> {
    try {
      const listJson = localStorage.getItem(this.CAMPAIGN_LIST_KEY);
      if (!listJson) return [];

      return JSON.parse(listJson) as Array<{
        id: string;
        title: string;
        updatedAt: string;
        summary?: string;
      }>;
    } catch (error) {
      console.error("キャンペーンリストの取得に失敗しました:", error);
      return [];
    }
  }

  /**
   * 現在選択中のキャンペーンIDを取得
   * @returns キャンペーンID、設定されていない場合はnull
   */
  static getCurrentCampaignId(): string | null {
    return localStorage.getItem(this.CURRENT_CAMPAIGN_KEY);
  }

  /**
   * 現在選択中のキャンペーンIDを設定
   * @param campaignId キャンペーンID
   */
  static setCurrentCampaignId(campaignId: string | null): void {
    if (campaignId) {
      localStorage.setItem(this.CURRENT_CAMPAIGN_KEY, campaignId);
    } else {
      localStorage.removeItem(this.CURRENT_CAMPAIGN_KEY);
    }
  }

  /**
   * キャンペーンリストにキャンペーンを追加または更新します。
   * @param campaign 保存するキャンペーンデータ
   */
  private static addCampaignToList(campaign: TRPGCampaign): void {
    const campaigns = this.getCampaignList();
    const index = campaigns.findIndex((c) => c.id === campaign.id);

    // 既存のキャンペーンの場合は更新
    if (index >= 0) {
      campaigns[index] = {
        id: campaign.id,
        title: campaign.title,
        updatedAt: campaign.updatedAt instanceof Date ? campaign.updatedAt.toISOString() : new Date().toISOString(),
        summary: campaign.synopsis,
      };
    } else {
      // 新規キャンペーンの場合は追加
      campaigns.push({
        id: campaign.id,
        title: campaign.title,
        updatedAt: campaign.updatedAt instanceof Date ? campaign.updatedAt.toISOString() : new Date().toISOString(),
        summary: campaign.synopsis,
      });
    }

    // リストを保存
    localStorage.setItem(this.CAMPAIGN_LIST_KEY, JSON.stringify(campaigns));
  }

  /**
   * キャンペーンリストからキャンペーンを削除する
   * @param campaignId 削除するキャンペーンID
   */
  private static removeCampaignFromList(campaignId: string): void {
    let campaignList = this.getCampaignList();

    // 指定されたIDのキャンペーンを除外
    campaignList = campaignList.filter((c) => c.id !== campaignId);

    // リストを保存
    localStorage.setItem(this.CAMPAIGN_LIST_KEY, JSON.stringify(campaignList));
  }

  /**
   * サンプルキャンペーンを作成
   * @returns サンプルキャンペーン
   */
  static createSampleCampaign(): TRPGCampaign {
    const sampleCampaign: TRPGCampaign = {
      id: "sample-campaign-001",
      title: "サンプルキャンペーン：古代遺跡の謎",
      summary: "古代の遺跡で謎を解き明かす冒険",
      characters: [
        {
          id: "pc-001",
          name: "アリア",
          characterType: "PC",
          race: "エルフ",
          class: "レンジャー",
          background: "森の守護者",
          alignment: "中立善",
          gender: "女性",
          age: 120,
          appearance: "銀髪に緑の瞳を持つ美しいエルフ",
          personality: "冷静沈着で自然を愛する",
          motivation: "森を脅かす者から自然を守りたい",
          stats: {
            strength: 14,
            dexterity: 18,
            constitution: 12,
            intelligence: 13,
            wisdom: 16,
            charisma: 11,
            hitPoints: { current: 45, max: 45, temp: 0 },
            armorClass: 16,
            speed: 30,
            level: 5,
            experience: 6500,
            proficiencyBonus: 3,
          },
          skills: {
            AgilitySkills: [],
            CommunicationSkills: [],
            KnowledgeSkills: [],
            ManipulationSkills: [],
            PerceptionSkills: [],
            StealthSkills: [],
            MagicSkills: [],
            WeaponSkills: []
          } as any,
          equipment: ["エルヴンロングボー", "革の鎧", "クローク", "矢筒"],
          progression: [],
          traits: ["暗視", "鋭敏な感覚"],
          relationships: [],
          imageUrl: "",
          customFields: [],
          statuses: [],
          notes: "",
        }
      ],
      npcs: [
        {
          id: "npc-001",
          name: "老賢者ガンダルフ",
          characterType: "NPC",
          npcType: "scholar",
          role: "知識の提供者",
          race: "ヒューマン",
          class: "ウィザード",
          background: "学者",
          alignment: "秩序善",
          gender: "男性",
          age: 75,
          appearance: "長い白髭と杖を持つ老人",
          personality: "知識豊富で親切だが、時折謎めいた発言をする",
          motivation: "若い冒険者を導き、世界の平和を保つ",
          stats: {
            strength: 8,
            dexterity: 10,
            constitution: 12,
            intelligence: 20,
            wisdom: 17,
            charisma: 14,
            hitPoints: { current: 35, max: 35, temp: 0 },
            armorClass: 12,
            speed: 30,
            level: 10,
            experience: 0,
            proficiencyBonus: 4,
          },
          skills: {
            AgilitySkills: [],
            CommunicationSkills: [],
            KnowledgeSkills: [],
            ManipulationSkills: [],
            PerceptionSkills: [],
            StealthSkills: [],
            MagicSkills: [],
            WeaponSkills: []
          } as any,
          equipment: ["魔法の杖", "ローブ", "古い書物"],
          progression: [],
          traits: ["魔法使い", "博識"],
          relationships: [],
          imageUrl: "",
          customFields: [],
          statuses: [],
          notes: "",
          location: "賢者の塔",
          services: ["魔法鑑定", "情報提供", "魔法アイテム販売"],
          secrets: ["古代遺跡の真の目的を知っている"],
          questGiver: true,
          disposition: 80,
          faction: "賢者の評議会",
          voiceDescription: "深く響く落ち着いた声",
          mannerisms: "考え込む時に髭を撫でる",
        }
      ],
      enemies: [
        {
          id: "enemy-001",
          name: "ゴブリンウォリアー",
          characterType: "Enemy",
          enemyType: "mob",
          challengeRating: 1,
          race: "ゴブリン",
          class: "ウォリアー",
          background: "",
          alignment: "混沌悪",
          gender: "男性",
          age: 5,
          appearance: "緑色の肌に鋭い牙を持つ小柄な人型生物",
          personality: "凶暴で狡猾",
          motivation: "略奪と破壊",
          stats: {
            strength: 12,
            dexterity: 14,
            constitution: 10,
            intelligence: 8,
            wisdom: 10,
            charisma: 6,
            hitPoints: { current: 15, max: 15, temp: 0 },
            armorClass: 13,
            speed: 30,
            level: 1,
            experience: 0,
            proficiencyBonus: 2,
          },
          skills: {
            basicAttack: "ショートソードによる攻撃",
            specialSkills: [],
            passives: []
          } as any,
          equipment: ["ショートソード", "ライトクロスボウ", "レザーアーマー"],
          progression: [],
          traits: ["暗視"],
          relationships: [],
          imageUrl: "",
          customFields: [],
          statuses: [],
          notes: "",
          tactics: "群れで襲い掛かり、弱い敵を狙う",
          loot: ["数枚の銅貨", "壊れた武器"],
          spawnLocations: ["洞窟", "森の奥"],
          behaviorPattern: "集団で行動し、強い敵からは逃げる",
        }
      ],
      bases: [],
      worldBuilding: {
        id: "world-001",
        setting: [],
        rules: [],
        places: [],
        cultures: [],
        geographyEnvironment: [],
        historyLegend: [],
        magicTechnology: [],
        freeFields: [],
        worldMapImageUrl: "",
        worldmaps: [],
        stateDefinition: {}
      } as any,
      sessions: [],
      quests: [
        {
          id: "quest-001",
          title: "古代遺跡の調査",
          description: "村の近くで発見された古代遺跡の謎を解明する",
          status: "active",
          priority: "high",
          giver: "老賢者ガンダルフ",
          rewards: ["経験値1000", "魔法のアミュレット"],
          objectives: [
            "遺跡の入り口を見つける",
            "古代文字を解読する",
            "遺跡の守護者を倒す"
          ],
          notes: "危険な魔法の罠が仕掛けられている可能性がある"
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return sampleCampaign;
  }

  /**
   * 初期データをセットアップ（サンプルキャンペーンを作成）
   */
  static setupInitialData(): void {
    // テスト用の無効化フラグをチェック
    const disableSampleCreation = localStorage.getItem('disable_sample_creation');
    if (disableSampleCreation === 'true') {
      console.log("サンプルキャンペーンの自動作成が無効化されています");
      return;
    }
    
    // 既存のキャンペーンがあるかチェック
    const existingCampaigns = this.getCampaignList();
    
    if (existingCampaigns.length === 0) {
      // サンプルキャンペーンを作成
      const sampleCampaign = this.createSampleCampaign();
      this.saveCampaign(sampleCampaign);
      this.setCurrentCampaignId(sampleCampaign.id);
      
      console.log("初期サンプルキャンペーンを作成しました");
    }
  }

  /**
   * ローカルストレージの使用量を確認する（バイト数）
   * @returns 使用量（バイト数）
   */
  static getStorageUsage(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("trpg_")) {
        const value = localStorage.getItem(key) || "";
        total += key.length + value.length;
      }
    }
    return total * 2; // UTF-16エンコーディングで1文字2バイト
  }
}
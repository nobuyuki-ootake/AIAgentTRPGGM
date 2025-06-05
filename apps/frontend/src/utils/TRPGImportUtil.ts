import { TRPGCampaign, TRPGCharacter } from "@trpg-ai-gm/types";
import { TRPGLocalStorageManager } from "./trpgLocalStorage";
import { v4 as uuidv4 } from "uuid";

/**
 * インポートエラー
 */
export interface ImportError {
  field: string;
  message: string;
}

/**
 * 外部TRPGツールの形式
 */
export enum ExternalFormat {
  UDONARIUM = "udonarium",
  FOUNDRY_VTT = "foundry",
  ROLL20 = "roll20",
  D_AND_D_BEYOND = "dndbeyond",
  GENERIC_JSON = "json",
  GENERIC_CSV = "csv"
}

/**
 * TRPGキャラクター・キャンペーンインポート用のユーティリティクラス
 */
export class TRPGImportUtil {
  /**
   * ファイルからキャラクターをインポートする
   */
  static async importCharacterFromFile(
    file: File,
    format: ExternalFormat = ExternalFormat.GENERIC_JSON
  ): Promise<{ character: TRPGCharacter | null; errors: ImportError[] }> {
    try {
      const content = await this.readFileAsText(file);
      
      switch (format) {
        case ExternalFormat.UDONARIUM:
          return this.importFromUdonarium(content);
        case ExternalFormat.FOUNDRY_VTT:
          return this.importFromFoundryVTT(content);
        case ExternalFormat.ROLL20:
          return this.importFromRoll20(content);
        case ExternalFormat.D_AND_D_BEYOND:
          return this.importFromDnDBeyond(content);
        case ExternalFormat.GENERIC_CSV:
          return this.importFromCSV(content);
        default:
          return this.importFromGenericJSON(content);
      }
    } catch (error) {
      return {
        character: null,
        errors: [{
          field: "file",
          message: error instanceof Error ? error.message : "インポートに失敗しました"
        }]
      };
    }
  }

  /**
   * キャンペーン全体をインポートする
   */
  static async importCampaignFromFile(
    file: File
  ): Promise<{ campaign: TRPGCampaign | null; errors: ImportError[] }> {
    try {
      const content = await this.readFileAsText(file);
      const data = JSON.parse(content);
      
      // バリデーション
      const validationResult = this.validateCampaign(data);
      if (validationResult.errors.length > 0) {
        return validationResult;
      }

      // IDの重複チェックと新規ID生成
      const existingCampaign = TRPGLocalStorageManager.loadCampaign(data.id);
      if (existingCampaign) {
        data.id = uuidv4(); // 新しいIDを生成
        data.title = `${data.title} (インポート)`;
      }

      return { campaign: data as TRPGCampaign, errors: [] };
    } catch (error) {
      return {
        campaign: null,
        errors: [{
          field: "file",
          message: error instanceof Error ? error.message : "キャンペーンのインポートに失敗しました"
        }]
      };
    }
  }

  /**
   * ユドナリウム形式からインポート
   */
  private static async importFromUdonarium(
    content: string
  ): Promise<{ character: TRPGCharacter | null; errors: ImportError[] }> {
    try {
      // XMLパース
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/xml");
      
      const characterData = doc.querySelector("character");
      if (!characterData) {
        throw new Error("キャラクターデータが見つかりません");
      }

      // データ抽出
      const name = characterData.querySelector("data[name='name']")?.textContent || "無名のキャラクター";
      const level = parseInt(characterData.querySelector("data[name='level']")?.textContent || "1");
      
      // 能力値の抽出
      const stats = {
        HP: parseInt(characterData.querySelector("data[name='HP']")?.textContent || "10"),
        maxHP: parseInt(characterData.querySelector("data[name='HP']")?.textContent || "10"),
        MP: parseInt(characterData.querySelector("data[name='MP']")?.textContent || "10"),
        maxMP: parseInt(characterData.querySelector("data[name='MP']")?.textContent || "10"),
        strength: parseInt(characterData.querySelector("data[name='STR']")?.textContent || "10"),
        dexterity: parseInt(characterData.querySelector("data[name='DEX']")?.textContent || "10"),
        constitution: parseInt(characterData.querySelector("data[name='CON']")?.textContent || "10"),
        intelligence: parseInt(characterData.querySelector("data[name='INT']")?.textContent || "10"),
        wisdom: parseInt(characterData.querySelector("data[name='WIS']")?.textContent || "10"),
        charisma: parseInt(characterData.querySelector("data[name='CHA']")?.textContent || "10")
      };

      const character: TRPGCharacter = {
        id: uuidv4(),
        name,
        level,
        characterType: "PC",
        race: characterData.querySelector("data[name='race']")?.textContent || "人間",
        class: characterData.querySelector("data[name='class']")?.textContent || "戦士",
        stats,
        skills: [],
        equipment: [],
        abilities: [],
        backstory: characterData.querySelector("data[name='backstory']")?.textContent || "",
        personality: characterData.querySelector("data[name='personality']")?.textContent || "",
        goals: characterData.querySelector("data[name='goals']")?.textContent || "",
        notes: "ユドナリウムからインポート",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return { character, errors: [] };
    } catch (error) {
      return {
        character: null,
        errors: [{
          field: "format",
          message: "ユドナリウム形式の解析に失敗しました"
        }]
      };
    }
  }

  /**
   * Foundry VTT形式からインポート
   */
  private static async importFromFoundryVTT(
    content: string
  ): Promise<{ character: TRPGCharacter | null; errors: ImportError[] }> {
    try {
      const data = JSON.parse(content);
      
      const character: TRPGCharacter = {
        id: uuidv4(),
        name: data.name || "無名のキャラクター",
        level: data.data?.details?.level || 1,
        characterType: "PC",
        race: data.data?.details?.race || "人間",
        class: data.data?.details?.class || "戦士",
        stats: {
          HP: data.data?.attributes?.hp?.value || 10,
          maxHP: data.data?.attributes?.hp?.max || 10,
          MP: data.data?.attributes?.mp?.value || 10,
          maxMP: data.data?.attributes?.mp?.max || 10,
          strength: data.data?.abilities?.str?.value || 10,
          dexterity: data.data?.abilities?.dex?.value || 10,
          constitution: data.data?.abilities?.con?.value || 10,
          intelligence: data.data?.abilities?.int?.value || 10,
          wisdom: data.data?.abilities?.wis?.value || 10,
          charisma: data.data?.abilities?.cha?.value || 10
        },
        skills: Object.entries(data.data?.skills || {}).map(([key, skill]: [string, any]) => ({
          name: skill.label || key,
          level: skill.value || 0,
          description: ""
        })),
        equipment: data.items?.filter((item: any) => item.type === "equipment").map((item: any) => ({
          name: item.name,
          type: item.data?.armorType || item.data?.weaponType || "その他",
          description: item.data?.description?.value || "",
          quantity: item.data?.quantity || 1
        })) || [],
        abilities: data.items?.filter((item: any) => item.type === "feat" || item.type === "spell").map((item: any) => ({
          name: item.name,
          description: item.data?.description?.value || "",
          type: item.type
        })) || [],
        backstory: data.data?.details?.biography?.value || "",
        personality: data.data?.details?.personality || "",
        goals: data.data?.details?.ideals || "",
        notes: "Foundry VTTからインポート",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return { character, errors: [] };
    } catch (error) {
      return {
        character: null,
        errors: [{
          field: "format",
          message: "Foundry VTT形式の解析に失敗しました"
        }]
      };
    }
  }

  /**
   * Roll20形式からインポート
   */
  private static async importFromRoll20(
    content: string
  ): Promise<{ character: TRPGCharacter | null; errors: ImportError[] }> {
    try {
      const data = JSON.parse(content);
      
      const character: TRPGCharacter = {
        id: uuidv4(),
        name: data.name || "無名のキャラクター",
        level: parseInt(data.level || "1"),
        characterType: "PC",
        race: data.race || "人間",
        class: data.class || "戦士",
        stats: {
          HP: parseInt(data.hp || "10"),
          maxHP: parseInt(data.hp_max || "10"),
          MP: parseInt(data.mp || "10"),
          maxMP: parseInt(data.mp_max || "10"),
          strength: parseInt(data.strength || "10"),
          dexterity: parseInt(data.dexterity || "10"),
          constitution: parseInt(data.constitution || "10"),
          intelligence: parseInt(data.intelligence || "10"),
          wisdom: parseInt(data.wisdom || "10"),
          charisma: parseInt(data.charisma || "10")
        },
        skills: [],
        equipment: [],
        abilities: [],
        backstory: data.bio || "",
        personality: data.personality_traits || "",
        goals: data.ideals || "",
        notes: "Roll20からインポート",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return { character, errors: [] };
    } catch (error) {
      return {
        character: null,
        errors: [{
          field: "format",
          message: "Roll20形式の解析に失敗しました"
        }]
      };
    }
  }

  /**
   * D&D Beyond形式からインポート
   */
  private static async importFromDnDBeyond(
    content: string
  ): Promise<{ character: TRPGCharacter | null; errors: ImportError[] }> {
    try {
      const data = JSON.parse(content);
      
      const character: TRPGCharacter = {
        id: uuidv4(),
        name: data.data?.name || "無名のキャラクター",
        level: data.data?.classes?.[0]?.level || 1,
        characterType: "PC",
        race: data.data?.race?.fullName || "人間",
        class: data.data?.classes?.[0]?.definition?.name || "戦士",
        stats: {
          HP: data.data?.currentHitPoints || 10,
          maxHP: data.data?.baseHitPoints || 10,
          MP: 10, // D&D Beyondには通常MPがない
          maxMP: 10,
          strength: data.data?.stats?.[0]?.value || 10,
          dexterity: data.data?.stats?.[1]?.value || 10,
          constitution: data.data?.stats?.[2]?.value || 10,
          intelligence: data.data?.stats?.[3]?.value || 10,
          wisdom: data.data?.stats?.[4]?.value || 10,
          charisma: data.data?.stats?.[5]?.value || 10
        },
        skills: data.data?.modifiers?.class?.filter((mod: any) => mod.type === "skill").map((skill: any) => ({
          name: skill.friendlySubtypeName,
          level: skill.value || 0,
          description: ""
        })) || [],
        equipment: data.data?.inventory?.map((item: any) => ({
          name: item.definition?.name || item.name,
          type: item.definition?.type || "その他",
          description: item.definition?.description || "",
          quantity: item.quantity || 1
        })) || [],
        abilities: data.data?.spells?.class?.map((spell: any) => ({
          name: spell.definition?.name,
          description: spell.definition?.description || "",
          type: "spell"
        })) || [],
        backstory: data.data?.notes?.backstory || "",
        personality: data.data?.traits?.personalityTraits || "",
        goals: data.data?.traits?.ideals || "",
        notes: "D&D Beyondからインポート",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return { character, errors: [] };
    } catch (error) {
      return {
        character: null,
        errors: [{
          field: "format",
          message: "D&D Beyond形式の解析に失敗しました"
        }]
      };
    }
  }

  /**
   * CSV形式からインポート
   */
  private static async importFromCSV(
    content: string
  ): Promise<{ character: TRPGCharacter | null; errors: ImportError[] }> {
    try {
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const values = lines[1]?.split(',').map(v => v.trim()) || [];
      
      const data: any = {};
      headers.forEach((header, index) => {
        data[header.toLowerCase()] = values[index] || "";
      });

      const character: TRPGCharacter = {
        id: uuidv4(),
        name: data.name || "無名のキャラクター",
        level: parseInt(data.level || "1"),
        characterType: "PC",
        race: data.race || "人間",
        class: data.class || "戦士",
        stats: {
          HP: parseInt(data.hp || "10"),
          maxHP: parseInt(data.maxhp || data.hp || "10"),
          MP: parseInt(data.mp || "10"),
          maxMP: parseInt(data.maxmp || data.mp || "10"),
          strength: parseInt(data.str || data.strength || "10"),
          dexterity: parseInt(data.dex || data.dexterity || "10"),
          constitution: parseInt(data.con || data.constitution || "10"),
          intelligence: parseInt(data.int || data.intelligence || "10"),
          wisdom: parseInt(data.wis || data.wisdom || "10"),
          charisma: parseInt(data.cha || data.charisma || "10")
        },
        skills: [],
        equipment: [],
        abilities: [],
        backstory: data.backstory || "",
        personality: data.personality || "",
        goals: data.goals || "",
        notes: "CSVからインポート",
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return { character, errors: [] };
    } catch (error) {
      return {
        character: null,
        errors: [{
          field: "format",
          message: "CSV形式の解析に失敗しました"
        }]
      };
    }
  }

  /**
   * 汎用JSON形式からインポート
   */
  private static async importFromGenericJSON(
    content: string
  ): Promise<{ character: TRPGCharacter | null; errors: ImportError[] }> {
    try {
      const data = JSON.parse(content);
      
      // 最小限のバリデーション
      if (!data.name) {
        throw new Error("キャラクター名が必要です");
      }

      const character: TRPGCharacter = {
        id: data.id || uuidv4(),
        name: data.name,
        level: data.level || 1,
        characterType: data.characterType || "PC",
        race: data.race || "人間",
        class: data.class || "戦士",
        stats: data.stats || {
          HP: 10,
          maxHP: 10,
          MP: 10,
          maxMP: 10,
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10
        },
        skills: data.skills || [],
        equipment: data.equipment || [],
        abilities: data.abilities || [],
        backstory: data.backstory || "",
        personality: data.personality || "",
        goals: data.goals || "",
        notes: data.notes || "JSONからインポート",
        imageUrl: data.imageUrl,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: new Date()
      };

      return { character, errors: [] };
    } catch (error) {
      return {
        character: null,
        errors: [{
          field: "format",
          message: "JSON形式の解析に失敗しました"
        }]
      };
    }
  }

  /**
   * キャンペーンデータのバリデーション
   */
  private static validateCampaign(data: any): {
    campaign: TRPGCampaign | null;
    errors: ImportError[];
  } {
    const errors: ImportError[] = [];

    // 必須フィールドのチェック
    if (!data.title) {
      errors.push({ field: "title", message: "キャンペーンタイトルが必要です" });
    }

    if (!data.gameSystem) {
      errors.push({ field: "gameSystem", message: "ゲームシステムが必要です" });
    }

    // 型チェック
    if (data.characters && !Array.isArray(data.characters)) {
      errors.push({ field: "characters", message: "キャラクターリストは配列である必要があります" });
    }

    if (data.sessions && !Array.isArray(data.sessions)) {
      errors.push({ field: "sessions", message: "セッションリストは配列である必要があります" });
    }

    return {
      campaign: errors.length === 0 ? data : null,
      errors
    };
  }

  /**
   * ファイルをテキストとして読み込む
   */
  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          resolve(event.target.result);
        } else {
          reject(new Error("ファイルの読み込みに失敗しました"));
        }
      };
      
      reader.onerror = () => {
        reject(new Error("ファイルの読み込み中にエラーが発生しました"));
      };
      
      reader.readAsText(file);
    });
  }
}

// シングルトンインスタンス
export const trpgImportUtil = new TRPGImportUtil();
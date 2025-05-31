// TRPGキャラクターデータモデル
import { TRPGCharacter, CharacterStats, Skill, Equipment } from '@novel-ai-assistant/types';
import DatabaseConnection from '../connection.js';
import { v4 as uuidv4 } from 'uuid';

export interface CharacterRow {
  id: string;
  campaign_id: string;
  name: string;
  character_type: 'PC' | 'NPC' | 'Enemy';
  player_id: string | null;
  race: string | null;
  class: string | null;
  background: string | null;
  alignment: string | null;
  gender: string | null;
  age: string | null;
  appearance: string | null;
  personality: string | null;
  motivation: string | null;
  backstory: string | null;
  stats: string; // JSON
  skills: string | null; // JSON
  equipment: string | null; // JSON
  image_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class CharacterModel {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public async create(characterData: Partial<TRPGCharacter> & {
    campaignId: string;
    name: string;
    characterType: 'PC' | 'NPC' | 'Enemy';
    stats: CharacterStats;
  }): Promise<string> {
    const database = this.db.getDatabase();
    const id = uuidv4();

    return this.db.transaction(() => {
      // メインキャラクターレコードを挿入
      const insertStmt = database.prepare(`
        INSERT INTO characters (
          id, campaign_id, name, character_type, player_id,
          race, class, background, alignment, gender, age,
          appearance, personality, motivation, backstory,
          stats, skills, equipment, image_url, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        id,
        characterData.campaignId,
        characterData.name,
        characterData.characterType,
        characterData.playerName || null,
        characterData.race || null,
        characterData.class || null,
        characterData.background || null,
        characterData.alignment || null,
        characterData.gender || null,
        characterData.age || null,
        characterData.appearance || null,
        characterData.personality || null,
        characterData.motivation || null,
        characterData.backstory || null,
        JSON.stringify(characterData.stats),
        JSON.stringify(characterData.skills || []),
        JSON.stringify(characterData.equipment || []),
        characterData.imageUrl || null,
        characterData.notes || null
      );

      // キャラクタータイプ別の追加情報を挿入
      if (characterData.characterType === 'NPC') {
        this.createNPCDetails(id, characterData as any);
      } else if (characterData.characterType === 'Enemy') {
        this.createEnemyDetails(id, characterData as any);
      }

      return id;
    });
  }

  private createNPCDetails(characterId: string, npcData: any): void {
    const database = this.db.getDatabase();
    const stmt = database.prepare(`
      INSERT INTO npc_details (character_id, location, occupation, attitude, knowledge, services)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      characterId,
      npcData.location || null,
      npcData.occupation || null,
      npcData.attitude || 'neutral',
      JSON.stringify(npcData.knowledge || []),
      JSON.stringify(npcData.services || [])
    );
  }

  private createEnemyDetails(characterId: string, enemyData: any): void {
    const database = this.db.getDatabase();
    const stmt = database.prepare(`
      INSERT INTO enemy_details (
        character_id, enemy_type, challenge_rating, tactics, 
        loot, spawn_locations, behavior_pattern
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      characterId,
      enemyData.enemyType || 'mob',
      enemyData.challengeRating || 1,
      enemyData.tactics || null,
      JSON.stringify(enemyData.loot || []),
      JSON.stringify(enemyData.spawnLocations || []),
      enemyData.behaviorPattern || null
    );
  }

  public async findById(id: string): Promise<CharacterRow | null> {
    const database = this.db.getDatabase();
    const stmt = database.prepare('SELECT * FROM characters WHERE id = ? AND is_active = 1');
    const row = stmt.get(id) as CharacterRow | undefined;
    
    return row || null;
  }

  public async findByCampaign(campaignId: string, characterType?: 'PC' | 'NPC' | 'Enemy'): Promise<CharacterRow[]> {
    const database = this.db.getDatabase();
    
    let sql = 'SELECT * FROM characters WHERE campaign_id = ? AND is_active = 1';
    const params: any[] = [campaignId];
    
    if (characterType) {
      sql += ' AND character_type = ?';
      params.push(characterType);
    }
    
    sql += ' ORDER BY character_type, name';
    
    const stmt = database.prepare(sql);
    return stmt.all(...params) as CharacterRow[];
  }

  public async findByPlayer(playerId: string): Promise<CharacterRow[]> {
    const database = this.db.getDatabase();
    const stmt = database.prepare(`
      SELECT * FROM characters 
      WHERE player_id = ? AND character_type = 'PC' AND is_active = 1
      ORDER BY updated_at DESC
    `);
    
    return stmt.all(playerId) as CharacterRow[];
  }

  public async update(id: string, updates: Partial<CharacterRow>): Promise<boolean> {
    const database = this.db.getDatabase();
    
    const fields = Object.keys(updates).filter(key => key !== 'id');
    if (fields.length === 0) return false;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof CharacterRow]);

    const stmt = database.prepare(`
      UPDATE characters 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  public async updateStats(id: string, stats: CharacterStats): Promise<boolean> {
    return this.update(id, { stats: JSON.stringify(stats) });
  }

  public async updateSkills(id: string, skills: Skill[]): Promise<boolean> {
    return this.update(id, { skills: JSON.stringify(skills) });
  }

  public async updateEquipment(id: string, equipment: Equipment[]): Promise<boolean> {
    return this.update(id, { equipment: JSON.stringify(equipment) });
  }

  public async updateHP(id: string, currentHP: number, maxHP?: number, tempHP?: number): Promise<boolean> {
    const character = await this.findById(id);
    if (!character) return false;

    const stats = JSON.parse(character.stats) as CharacterStats;
    stats.hitPoints.current = currentHP;
    
    if (maxHP !== undefined) {
      stats.hitPoints.max = maxHP;
    }
    if (tempHP !== undefined) {
      stats.hitPoints.temp = tempHP;
    }

    return this.updateStats(id, stats);
  }

  public async addExperience(id: string, experience: number, sessionId?: string): Promise<boolean> {
    const character = await this.findById(id);
    if (!character) return false;

    const stats = JSON.parse(character.stats) as CharacterStats;
    const oldLevel = stats.level;
    stats.experience += experience;

    // レベルアップ判定（簡易版）
    const newLevel = Math.floor(stats.experience / 1000) + 1;
    const levelUp = newLevel > oldLevel;
    stats.level = newLevel;

    return this.db.transaction(() => {
      // ステータス更新
      this.updateStats(id, stats);

      // 進歩記録を追加
      if (sessionId) {
        const database = this.db.getDatabase();
        const progressStmt = database.prepare(`
          INSERT INTO character_progression (
            id, character_id, session_id, description, 
            experience_gained, level_up, stat_changes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        progressStmt.run(
          uuidv4(),
          id,
          sessionId,
          `${experience}経験値を獲得${levelUp ? `、レベル${newLevel}にアップ！` : ''}`,
          experience,
          levelUp ? 1 : 0,
          JSON.stringify({ level: newLevel, experience: stats.experience })
        );
      }

      return true;
    });
  }

  public async delete(id: string): Promise<boolean> {
    const database = this.db.getDatabase();
    const stmt = database.prepare('UPDATE characters SET is_active = 0 WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  }

  public async getProgression(characterId: string): Promise<any[]> {
    const database = this.db.getDatabase();
    const stmt = database.prepare(`
      SELECT cp.*, gs.title as session_title, gs.date as session_date
      FROM character_progression cp
      LEFT JOIN game_sessions gs ON cp.session_id = gs.id
      WHERE cp.character_id = ?
      ORDER BY cp.date DESC
    `);
    
    return stmt.all(characterId);
  }

  public async getNPCDetails(characterId: string): Promise<any> {
    const database = this.db.getDatabase();
    const stmt = database.prepare('SELECT * FROM npc_details WHERE character_id = ?');
    return stmt.get(characterId);
  }

  public async getEnemyDetails(characterId: string): Promise<any> {
    const database = this.db.getDatabase();
    const stmt = database.prepare('SELECT * FROM enemy_details WHERE character_id = ?');
    return stmt.get(characterId);
  }
}

export default CharacterModel;
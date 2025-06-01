import { Database } from 'better-sqlite3';
import { BaseRepository } from './BaseRepository';

export interface Enemy {
  id: string;
  campaign_id: string;
  name: string;
  type: string;
  challenge_rating?: number;
  hit_points?: number;
  armor_class?: number;
  attributes?: any;
  abilities?: any;
  attacks?: any;
  loot?: any;
  description?: string;
  tactics?: string;
  image_url?: string;
  is_boss: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnemyEncounter {
  id: string;
  enemy_id: string;
  session_id?: string;
  quantity: number;
  status: 'planned' | 'active' | 'defeated' | 'fled';
  current_hp?: number[];
  notes?: string;
}

export class EnemyRepository extends BaseRepository<Enemy> {
  constructor(db: Database) {
    super(db, 'enemies');
  }

  findByCampaignId(campaignId: string): Enemy[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? ORDER BY challenge_rating DESC, name`;
    return this.db.prepare(query).all(campaignId) as Enemy[];
  }

  findByChallengeRating(campaignId: string, minCR: number, maxCR: number): Enemy[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND challenge_rating >= ? AND challenge_rating <= ? ORDER BY challenge_rating, name`;
    return this.db.prepare(query).all(campaignId, minCR, maxCR) as Enemy[];
  }

  findBosses(campaignId: string): Enemy[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND is_boss = 1 ORDER BY challenge_rating DESC`;
    return this.db.prepare(query).all(campaignId) as Enemy[];
  }

  findByType(campaignId: string, type: string): Enemy[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND type = ? ORDER BY challenge_rating DESC, name`;
    return this.db.prepare(query).all(campaignId, type) as Enemy[];
  }

  searchByName(campaignId: string, searchTerm: string): Enemy[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND name LIKE ? ORDER BY name`;
    return this.db.prepare(query).all(campaignId, `%${searchTerm}%`) as Enemy[];
  }

  // Encounter management
  createEncounter(encounter: Omit<EnemyEncounter, 'id'>): EnemyEncounter {
    const id = `enc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const columns = ['id', ...Object.keys(encounter)];
    const values = [id, ...Object.values(encounter).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    )];
    const placeholders = columns.map(() => '?').join(', ');
    
    const query = `INSERT INTO enemy_encounters (${columns.join(', ')}) VALUES (${placeholders})`;
    
    this.db.prepare(query).run(...values);
    return this.findEncounterById(id)!;
  }

  findEncountersBySessionId(sessionId: string): EnemyEncounter[] {
    const query = `SELECT * FROM enemy_encounters WHERE session_id = ? ORDER BY id`;
    const results = this.db.prepare(query).all(sessionId) as any[];
    return results.map(this.parseEncounterJsonFields);
  }

  findActiveEncounters(sessionId: string): EnemyEncounter[] {
    const query = `SELECT * FROM enemy_encounters WHERE session_id = ? AND status = 'active' ORDER BY id`;
    const results = this.db.prepare(query).all(sessionId) as any[];
    return results.map(this.parseEncounterJsonFields);
  }

  updateEncounterStatus(encounterId: string, status: EnemyEncounter['status']): boolean {
    const query = `UPDATE enemy_encounters SET status = ? WHERE id = ?`;
    const result = this.db.prepare(query).run(status, encounterId);
    return result.changes > 0;
  }

  updateEncounterHP(encounterId: string, currentHp: number[]): boolean {
    const query = `UPDATE enemy_encounters SET current_hp = ? WHERE id = ?`;
    const result = this.db.prepare(query).run(JSON.stringify(currentHp), encounterId);
    return result.changes > 0;
  }

  private findEncounterById(id: string): EnemyEncounter | undefined {
    const query = `SELECT * FROM enemy_encounters WHERE id = ?`;
    const result = this.db.prepare(query).get(id) as any;
    return result ? this.parseEncounterJsonFields(result) : undefined;
  }

  // Override to handle JSON fields
  create(data: Omit<Enemy, 'id' | 'created_at' | 'updated_at'>): Enemy {
    const processedData = {
      ...data,
      attributes: data.attributes ? JSON.stringify(data.attributes) : null,
      abilities: data.abilities ? JSON.stringify(data.abilities) : null,
      attacks: data.attacks ? JSON.stringify(data.attacks) : null,
      loot: data.loot ? JSON.stringify(data.loot) : null
    };
    return super.create(processedData);
  }

  // Override to parse JSON fields
  findById(id: string): Enemy | undefined {
    const result = super.findById(id);
    if (result) {
      return this.parseJsonFields(result);
    }
    return undefined;
  }

  // Override to parse JSON fields for all results
  findAll(): Enemy[] {
    const results = super.findAll();
    return results.map(this.parseJsonFields);
  }

  private parseJsonFields(enemy: any): Enemy {
    return {
      ...enemy,
      attributes: enemy.attributes ? JSON.parse(enemy.attributes) : null,
      abilities: enemy.abilities ? JSON.parse(enemy.abilities) : null,
      attacks: enemy.attacks ? JSON.parse(enemy.attacks) : null,
      loot: enemy.loot ? JSON.parse(enemy.loot) : null,
      is_boss: enemy.is_boss === 1
    };
  }

  private parseEncounterJsonFields(encounter: any): EnemyEncounter {
    return {
      ...encounter,
      current_hp: encounter.current_hp ? JSON.parse(encounter.current_hp) : null
    };
  }
}
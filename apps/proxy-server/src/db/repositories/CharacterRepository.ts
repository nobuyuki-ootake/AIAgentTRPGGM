import { Database } from 'better-sqlite3';
import { BaseRepository } from './BaseRepository';

export interface Character {
  id: string;
  campaign_id: string;
  type: 'PC' | 'NPC';
  name: string;
  player_name?: string;
  race?: string;
  class?: string;
  level?: number;
  attributes?: any;
  skills?: any;
  equipment?: any;
  backstory?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'deceased' | 'retired';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export class CharacterRepository extends BaseRepository<Character> {
  constructor(db: Database) {
    super(db, 'characters');
  }

  findByCampaignId(campaignId: string): Character[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? ORDER BY type, name`;
    return this.db.prepare(query).all(campaignId) as Character[];
  }

  findByType(campaignId: string, type: 'PC' | 'NPC'): Character[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND type = ? ORDER BY name`;
    return this.db.prepare(query).all(campaignId, type) as Character[];
  }

  findActiveCharacters(campaignId: string): Character[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND status = 'active' ORDER BY type, name`;
    return this.db.prepare(query).all(campaignId) as Character[];
  }

  updateAttributes(id: string, attributes: any): Character | undefined {
    return this.update(id, { attributes: JSON.stringify(attributes) });
  }

  updateSkills(id: string, skills: any): Character | undefined {
    return this.update(id, { skills: JSON.stringify(skills) });
  }

  updateStatus(id: string, status: Character['status']): Character | undefined {
    return this.update(id, { status });
  }

  searchByName(campaignId: string, searchTerm: string): Character[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND name LIKE ? ORDER BY name`;
    return this.db.prepare(query).all(campaignId, `%${searchTerm}%`) as Character[];
  }

  // Override to handle JSON fields
  create(data: Omit<Character, 'id' | 'created_at' | 'updated_at'>): Character {
    const processedData = {
      ...data,
      attributes: data.attributes ? JSON.stringify(data.attributes) : null,
      skills: data.skills ? JSON.stringify(data.skills) : null,
      equipment: data.equipment ? JSON.stringify(data.equipment) : null
    };
    return super.create(processedData);
  }

  // Override to parse JSON fields
  findById(id: string): Character | undefined {
    const result = super.findById(id);
    if (result) {
      return this.parseJsonFields(result);
    }
    return undefined;
  }

  // Override to parse JSON fields for all results
  findAll(): Character[] {
    const results = super.findAll();
    return results.map(this.parseJsonFields);
  }

  private parseJsonFields(character: any): Character {
    return {
      ...character,
      attributes: character.attributes ? JSON.parse(character.attributes) : null,
      skills: character.skills ? JSON.parse(character.skills) : null,
      equipment: character.equipment ? JSON.parse(character.equipment) : null
    };
  }
}
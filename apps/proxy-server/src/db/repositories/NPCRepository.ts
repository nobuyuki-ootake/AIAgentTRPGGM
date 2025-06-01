import { Database } from 'better-sqlite3';
import { BaseRepository } from './BaseRepository';

export interface NPC {
  id: string;
  campaign_id: string;
  name: string;
  title?: string;
  occupation?: string;
  faction?: string;
  location?: string;
  personality?: string;
  goals?: string;
  secrets?: string;
  relationships?: any;
  dialogue_notes?: string;
  appearance?: string;
  voice_notes?: string;
  importance: 'major' | 'minor' | 'background';
  status: 'active' | 'inactive' | 'deceased' | 'missing';
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface NPCInteraction {
  id: string;
  npc_id: string;
  session_id?: string;
  interaction_date: string;
  type: 'conversation' | 'quest_given' | 'quest_completed' | 'combat' | 'trade' | 'other';
  summary: string;
  outcome?: string;
  relationship_change?: number;
}

export class NPCRepository extends BaseRepository<NPC> {
  constructor(db: Database) {
    super(db, 'npcs');
  }

  findByCampaignId(campaignId: string): NPC[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? ORDER BY importance ASC, name`;
    return this.db.prepare(query).all(campaignId) as NPC[];
  }

  findByImportance(campaignId: string, importance: NPC['importance']): NPC[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND importance = ? ORDER BY name`;
    return this.db.prepare(query).all(campaignId, importance) as NPC[];
  }

  findByLocation(campaignId: string, location: string): NPC[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND location = ? ORDER BY importance ASC, name`;
    return this.db.prepare(query).all(campaignId, location) as NPC[];
  }

  findByFaction(campaignId: string, faction: string): NPC[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND faction = ? ORDER BY importance ASC, name`;
    return this.db.prepare(query).all(campaignId, faction) as NPC[];
  }

  findActiveNPCs(campaignId: string): NPC[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND status = 'active' ORDER BY importance ASC, name`;
    return this.db.prepare(query).all(campaignId) as NPC[];
  }

  searchByName(campaignId: string, searchTerm: string): NPC[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND (name LIKE ? OR title LIKE ?) ORDER BY importance ASC, name`;
    return this.db.prepare(query).all(campaignId, `%${searchTerm}%`, `%${searchTerm}%`) as NPC[];
  }

  updateStatus(id: string, status: NPC['status']): NPC | undefined {
    return this.update(id, { status });
  }

  // Interaction management
  createInteraction(interaction: Omit<NPCInteraction, 'id'>): NPCInteraction {
    const id = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const columns = ['id', ...Object.keys(interaction)];
    const values = [id, ...Object.values(interaction)];
    const placeholders = columns.map(() => '?').join(', ');
    
    const query = `INSERT INTO npc_interactions (${columns.join(', ')}) VALUES (${placeholders})`;
    
    this.db.prepare(query).run(...values);
    return this.findInteractionById(id)!;
  }

  findInteractionsByNPCId(npcId: string): NPCInteraction[] {
    const query = `SELECT * FROM npc_interactions WHERE npc_id = ? ORDER BY interaction_date DESC`;
    return this.db.prepare(query).all(npcId) as NPCInteraction[];
  }

  findInteractionsBySessionId(sessionId: string): NPCInteraction[] {
    const query = `SELECT * FROM npc_interactions WHERE session_id = ? ORDER BY interaction_date DESC`;
    return this.db.prepare(query).all(sessionId) as NPCInteraction[];
  }

  findInteractionsByType(campaignId: string, type: NPCInteraction['type']): NPCInteraction[] {
    const query = `
      SELECT i.* FROM npc_interactions i
      JOIN npcs n ON i.npc_id = n.id
      WHERE n.campaign_id = ? AND i.type = ?
      ORDER BY i.interaction_date DESC
    `;
    return this.db.prepare(query).all(campaignId, type) as NPCInteraction[];
  }

  getRelationshipSummary(npcId: string): { 
    totalInteractions: number;
    lastInteraction?: NPCInteraction;
    interactionTypes: Record<string, number>;
  } {
    const interactions = this.findInteractionsByNPCId(npcId);
    
    const interactionTypes = interactions.reduce((acc, int) => {
      acc[int.type] = (acc[int.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalInteractions: interactions.length,
      lastInteraction: interactions[0],
      interactionTypes
    };
  }

  private findInteractionById(id: string): NPCInteraction | undefined {
    const query = `SELECT * FROM npc_interactions WHERE id = ?`;
    return this.db.prepare(query).get(id) as NPCInteraction | undefined;
  }

  // Override to handle JSON fields
  create(data: Omit<NPC, 'id' | 'created_at' | 'updated_at'>): NPC {
    const processedData = {
      ...data,
      relationships: data.relationships ? JSON.stringify(data.relationships) : null
    };
    return super.create(processedData);
  }

  // Override to parse JSON fields
  findById(id: string): NPC | undefined {
    const result = super.findById(id);
    if (result) {
      return this.parseJsonFields(result);
    }
    return undefined;
  }

  // Override to parse JSON fields for all results
  findAll(): NPC[] {
    const results = super.findAll();
    return results.map(this.parseJsonFields);
  }

  private parseJsonFields(npc: any): NPC {
    return {
      ...npc,
      relationships: npc.relationships ? JSON.parse(npc.relationships) : null
    };
  }
}
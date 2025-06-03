// キャンペーンデータモデル
import { TRPGCampaign, CampaignMetadata, CampaignStatus } from '@trpg-ai-gm/types';
import DatabaseConnection from '../connection.js';
import { v4 as uuidv4 } from 'uuid';

export interface CampaignRow {
  id: string;
  title: string;
  game_system: string;
  gamemaster_id: string;
  synopsis: string | null;
  status: CampaignStatus;
  difficulty: string;
  target_players_min: number;
  target_players_max: number;
  estimated_sessions: number | null;
  total_play_time: number;
  created_at: string;
  updated_at: string;
}

export class CampaignModel {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public async create(campaignData: Partial<TRPGCampaign> & { 
    gamemaster: string; 
    title: string; 
    gameSystem: string; 
  }): Promise<string> {
    const database = this.db.getDatabase();
    const id = uuidv4();
    
    const insertStmt = database.prepare(`
      INSERT INTO campaigns (
        id, title, game_system, gamemaster_id, synopsis, status,
        difficulty, target_players_min, target_players_max, 
        estimated_sessions, total_play_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const metadata = campaignData.metadata as CampaignMetadata;

    insertStmt.run(
      id,
      campaignData.title,
      campaignData.gameSystem,
      campaignData.gamemaster,
      campaignData.synopsis || null,
      metadata?.status || 'planning',
      metadata?.difficulty || 'intermediate',
      metadata?.targetPlayers?.min || 2,
      metadata?.targetPlayers?.max || 6,
      metadata?.estimatedSessions || null,
      metadata?.totalPlayTime || 0
    );

    return id;
  }

  public async findById(id: string): Promise<CampaignRow | null> {
    const database = this.db.getDatabase();
    const stmt = database.prepare('SELECT * FROM campaigns WHERE id = ?');
    const row = stmt.get(id) as CampaignRow | undefined;
    
    return row || null;
  }

  public async findByGamemaster(gamemasterId: string): Promise<CampaignRow[]> {
    const database = this.db.getDatabase();
    const stmt = database.prepare(`
      SELECT * FROM campaigns 
      WHERE gamemaster_id = ? 
      ORDER BY updated_at DESC
    `);
    
    return stmt.all(gamemasterId) as CampaignRow[];
  }

  public async findByPlayer(playerId: string): Promise<CampaignRow[]> {
    const database = this.db.getDatabase();
    const stmt = database.prepare(`
      SELECT c.* FROM campaigns c
      INNER JOIN campaign_players cp ON c.id = cp.campaign_id
      WHERE cp.user_id = ? AND cp.is_active = 1
      ORDER BY c.updated_at DESC
    `);
    
    return stmt.all(playerId) as CampaignRow[];
  }

  public async update(id: string, updates: Partial<CampaignRow>): Promise<boolean> {
    const database = this.db.getDatabase();
    
    const fields = Object.keys(updates).filter(key => key !== 'id');
    if (fields.length === 0) return false;

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field as keyof CampaignRow]);

    const stmt = database.prepare(`
      UPDATE campaigns 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }

  public async delete(id: string): Promise<boolean> {
    const database = this.db.getDatabase();
    const stmt = database.prepare('DELETE FROM campaigns WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  }

  public async addPlayer(campaignId: string, userId: string, role: string = 'player'): Promise<boolean> {
    const database = this.db.getDatabase();
    const id = uuidv4();
    
    try {
      const stmt = database.prepare(`
        INSERT INTO campaign_players (id, campaign_id, user_id, role)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(id, campaignId, userId, role);
      return true;
    } catch (error) {
      // Unique constraint violation (user already in campaign)
      console.error('Error adding player to campaign:', error);
      return false;
    }
  }

  public async removePlayer(campaignId: string, userId: string): Promise<boolean> {
    const database = this.db.getDatabase();
    const stmt = database.prepare(`
      UPDATE campaign_players 
      SET is_active = 0 
      WHERE campaign_id = ? AND user_id = ?
    `);
    
    const result = stmt.run(campaignId, userId);
    return result.changes > 0;
  }

  public async getPlayers(campaignId: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    joined_at: string;
  }>> {
    const database = this.db.getDatabase();
    const stmt = database.prepare(`
      SELECT u.id, u.name, u.email, cp.role, cp.joined_at
      FROM users u
      INNER JOIN campaign_players cp ON u.id = cp.user_id
      WHERE cp.campaign_id = ? AND cp.is_active = 1
      ORDER BY cp.joined_at
    `);
    
    return stmt.all(campaignId) as Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      joined_at: string;
    }>;
  }

  public async updateStatus(id: string, status: CampaignStatus): Promise<boolean> {
    return this.update(id, { status });
  }

  public async addPlayTime(id: string, minutes: number): Promise<boolean> {
    const database = this.db.getDatabase();
    const stmt = database.prepare(`
      UPDATE campaigns 
      SET total_play_time = total_play_time + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(minutes, id);
    return result.changes > 0;
  }
}

export default CampaignModel;
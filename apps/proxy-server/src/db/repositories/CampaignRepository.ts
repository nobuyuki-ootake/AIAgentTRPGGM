import { Database } from 'better-sqlite3';
import { BaseRepository } from './BaseRepository';

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  system: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  settings?: any;
  created_at: string;
  updated_at: string;
}

export class CampaignRepository extends BaseRepository<Campaign> {
  constructor(db: Database) {
    super(db, 'campaigns');
  }

  findByUserId(userId: string): Campaign[] {
    const query = `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`;
    return this.db.prepare(query).all(userId) as Campaign[];
  }

  findActiveByUserId(userId: string): Campaign[] {
    const query = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC`;
    return this.db.prepare(query).all(userId) as Campaign[];
  }

  updateStatus(id: string, status: Campaign['status']): Campaign | undefined {
    return this.update(id, { status });
  }

  findWithRelatedData(id: string): {
    campaign: Campaign;
    characterCount: number;
    sessionCount: number;
  } | undefined {
    const campaign = this.findById(id);
    if (!campaign) {
      return undefined;
    }

    const characterCountQuery = `SELECT COUNT(*) as count FROM characters WHERE campaign_id = ?`;
    const sessionCountQuery = `SELECT COUNT(*) as count FROM sessions WHERE campaign_id = ?`;
    
    const characterCount = (this.db.prepare(characterCountQuery).get(id) as any).count;
    const sessionCount = (this.db.prepare(sessionCountQuery).get(id) as any).count;

    return {
      campaign,
      characterCount,
      sessionCount
    };
  }
}
import { Database } from 'better-sqlite3';
import { BaseRepository } from './BaseRepository';

export interface Session {
  id: string;
  campaign_id: string;
  session_number: number;
  title: string;
  scheduled_date?: string;
  actual_date?: string;
  duration_minutes?: number;
  summary?: string;
  notes?: any;
  status: 'planned' | 'completed' | 'cancelled';
  participants?: string[];
  created_at: string;
  updated_at: string;
}

export interface SessionLog {
  id: string;
  session_id: string;
  timestamp: string;
  type: 'dice_roll' | 'combat' | 'roleplay' | 'system' | 'note';
  actor?: string;
  action: string;
  result?: any;
  metadata?: any;
}

export class SessionRepository extends BaseRepository<Session> {
  constructor(db: Database) {
    super(db, 'sessions');
  }

  findByCampaignId(campaignId: string): Session[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? ORDER BY session_number DESC`;
    return this.db.prepare(query).all(campaignId) as Session[];
  }

  findUpcoming(campaignId: string): Session[] {
    const now = new Date().toISOString();
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND status = 'planned' AND scheduled_date >= ? ORDER BY scheduled_date ASC`;
    return this.db.prepare(query).all(campaignId, now) as Session[];
  }

  findCompleted(campaignId: string): Session[] {
    const query = `SELECT * FROM ${this.tableName} WHERE campaign_id = ? AND status = 'completed' ORDER BY actual_date DESC`;
    return this.db.prepare(query).all(campaignId) as Session[];
  }

  getNextSessionNumber(campaignId: string): number {
    const query = `SELECT MAX(session_number) as max_number FROM ${this.tableName} WHERE campaign_id = ?`;
    const result = this.db.prepare(query).get(campaignId) as any;
    return (result?.max_number || 0) + 1;
  }

  updateStatus(id: string, status: Session['status']): Session | undefined {
    const updates: Partial<Session> = { status };
    if (status === 'completed') {
      updates.actual_date = new Date().toISOString();
    }
    return this.update(id, updates);
  }

  // Session log operations
  createLog(log: Omit<SessionLog, 'id'>): SessionLog {
    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const columns = ['id', ...Object.keys(log)];
    const values = [id, ...Object.values(log).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    )];
    const placeholders = columns.map(() => '?').join(', ');
    
    const query = `INSERT INTO session_logs (${columns.join(', ')}) VALUES (${placeholders})`;
    
    this.db.prepare(query).run(...values);
    return this.findLogById(id)!;
  }

  findLogsBySessionId(sessionId: string): SessionLog[] {
    const query = `SELECT * FROM session_logs WHERE session_id = ? ORDER BY timestamp ASC`;
    const results = this.db.prepare(query).all(sessionId) as any[];
    return results.map(this.parseLogJsonFields);
  }

  findLogsByType(sessionId: string, type: SessionLog['type']): SessionLog[] {
    const query = `SELECT * FROM session_logs WHERE session_id = ? AND type = ? ORDER BY timestamp ASC`;
    const results = this.db.prepare(query).all(sessionId, type) as any[];
    return results.map(this.parseLogJsonFields);
  }

  private findLogById(id: string): SessionLog | undefined {
    const query = `SELECT * FROM session_logs WHERE id = ?`;
    const result = this.db.prepare(query).get(id) as any;
    return result ? this.parseLogJsonFields(result) : undefined;
  }

  // Override to handle JSON fields
  create(data: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Session {
    const processedData = {
      ...data,
      notes: data.notes ? JSON.stringify(data.notes) : null,
      participants: data.participants ? JSON.stringify(data.participants) : null
    };
    return super.create(processedData);
  }

  // Override to parse JSON fields
  findById(id: string): Session | undefined {
    const result = super.findById(id);
    if (result) {
      return this.parseJsonFields(result);
    }
    return undefined;
  }

  // Override to parse JSON fields for all results
  findAll(): Session[] {
    const results = super.findAll();
    return results.map(this.parseJsonFields);
  }

  private parseJsonFields(session: any): Session {
    return {
      ...session,
      notes: session.notes ? JSON.parse(session.notes) : null,
      participants: session.participants ? JSON.parse(session.participants) : null
    };
  }

  private parseLogJsonFields(log: any): SessionLog {
    return {
      ...log,
      result: log.result ? JSON.parse(log.result) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    };
  }
}
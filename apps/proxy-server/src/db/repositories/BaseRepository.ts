import { Database } from 'better-sqlite3';

export interface Repository<T> {
  findAll(): T[];
  findById(id: string): T | undefined;
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): T;
  update(id: string, data: Partial<T>): T | undefined;
  delete(id: string): boolean;
}

export abstract class BaseRepository<T> implements Repository<T> {
  protected db: Database;
  protected tableName: string;

  constructor(db: Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  findAll(): T[] {
    const query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
    return this.db.prepare(query).all() as T[];
  }

  findById(id: string): T | undefined {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    return this.db.prepare(query).get(id) as T | undefined;
  }

  create(data: any): T {
    const id = this.generateId();
    const now = new Date().toISOString();
    const columns = ['id', 'created_at', 'updated_at', ...Object.keys(data)];
    const values = [id, now, now, ...Object.values(data)];
    const placeholders = columns.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    this.db.prepare(query).run(...values);
    return this.findById(id)!;
  }

  update(id: string, data: Partial<T>): T | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

    const now = new Date().toISOString();
    const updates = { ...data, updated_at: now };
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), id];
    
    const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
    
    this.db.prepare(query).run(...values);
    return this.findById(id);
  }

  delete(id: string): boolean {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = this.db.prepare(query).run(id);
    return result.changes > 0;
  }

  protected generateId(): string {
    return `${this.tableName.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
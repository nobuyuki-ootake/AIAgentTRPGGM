// データベースマイグレーション実行システム
import DatabaseConnection from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Migration {
  id: string;
  name: string;
  sql: string;
  appliedAt?: Date;
}

class DatabaseMigrator {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  public async initialize(): Promise<void> {
    await this.db.initialize();
    await this.createMigrationTable();
  }

  private async createMigrationTable(): Promise<void> {
    const database = this.db.getDatabase();
    
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    database.exec(createTableSql);
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const database = this.db.getDatabase();
    
    try {
      const stmt = database.prepare('SELECT id FROM migrations ORDER BY applied_at');
      const rows = stmt.all() as { id: string }[];
      return rows.map(row => row.id);
    } catch (error) {
      console.error('Error getting applied migrations:', error);
      return [];
    }
  }

  private async loadMigrationFiles(): Promise<Migration[]> {
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('Migrations directory not found');
      return [];
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      const id = path.basename(file, '.sql');
      const name = id.replace(/^\d+_/, ''); // Remove number prefix

      migrations.push({
        id,
        name,
        sql
      });
    }

    return migrations;
  }

  public async runMigrations(): Promise<void> {
    await this.initialize();

    const appliedMigrations = await this.getAppliedMigrations();
    const allMigrations = await this.loadMigrationFiles();
    
    const pendingMigrations = allMigrations.filter(
      migration => !appliedMigrations.includes(migration.id)
    );

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Running ${pendingMigrations.length} pending migrations...`);

    const database = this.db.getDatabase();

    for (const migration of pendingMigrations) {
      try {
        console.log(`Applying migration: ${migration.id}`);

        // トランザクション内でマイグレーションを実行
        this.db.transaction((db) => {
          // SQLを実行
          db.exec(migration.sql);
          
          // マイグレーション記録を挿入
          const insertStmt = db.prepare(
            'INSERT INTO migrations (id, name) VALUES (?, ?)'
          );
          insertStmt.run(migration.id, migration.name);
        });

        console.log(`Migration ${migration.id} applied successfully`);
      } catch (error) {
        console.error(`Error applying migration ${migration.id}:`, error);
        throw error;
      }
    }

    console.log('All migrations applied successfully');
  }

  public async rollbackLastMigration(): Promise<void> {
    // SQLiteでは自動ロールバックは困難なため、
    // 手動でロールバック用SQLファイルを作成することを推奨
    console.warn('Automatic rollback not implemented. Please create rollback SQL manually.');
  }

  public async getMigrationStatus(): Promise<void> {
    await this.initialize();

    const appliedMigrations = await this.getAppliedMigrations();
    const allMigrations = await this.loadMigrationFiles();

    console.log('\n=== Migration Status ===');
    
    for (const migration of allMigrations) {
      const status = appliedMigrations.includes(migration.id) ? '✅ Applied' : '⏳ Pending';
      console.log(`${status} ${migration.id}: ${migration.name}`);
    }

    const pendingCount = allMigrations.length - appliedMigrations.length;
    console.log(`\nTotal: ${allMigrations.length}, Applied: ${appliedMigrations.length}, Pending: ${pendingCount}\n`);
  }
}

export default DatabaseMigrator;
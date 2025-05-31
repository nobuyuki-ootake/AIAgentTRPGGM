// データベース接続設定 - Litestream + SQLite
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface DatabaseConfig {
  filename: string;
  readonly?: boolean;
  fileMustExist?: boolean;
  timeout?: number;
  verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async initialize(): Promise<Database.Database> {
    if (this.db) {
      return this.db;
    }

    // データベースディレクトリが存在しない場合は作成
    const dbDir = process.env.DB_DIR || '/app/data';
    const dbPath = path.join(dbDir, 'trpg.db');

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const config: DatabaseConfig = {
      filename: dbPath,
      timeout: 10000,
    };

    // 開発環境でのみverboseログを有効化
    if (process.env.NODE_ENV === 'development') {
      config.verbose = console.log;
    }

    try {
      this.db = new Database(config.filename, config);

      // WALモードを有効化（パフォーマンス向上とLitestreamとの互換性のため）
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000000');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('temp_store = memory');

      console.log(`Database connected: ${dbPath}`);
      
      // データベースの健全性チェック
      await this.healthCheck();

      return this.db;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // 簡単なクエリでデータベースの健全性をチェック
      const result = this.db.prepare('SELECT 1 as test').get();
      return result?.test === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
  }

  // トランザクションヘルパー
  public transaction<T>(fn: (db: Database.Database) => T): T {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(fn);
    return transaction();
  }

  // 準備済みステートメントのキャッシュ
  private preparedStatements = new Map<string, Database.Statement>();

  public getStatement(sql: string): Database.Statement {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    if (!this.preparedStatements.has(sql)) {
      const statement = this.db.prepare(sql);
      this.preparedStatements.set(sql, statement);
    }

    return this.preparedStatements.get(sql)!;
  }
}

export default DatabaseConnection;
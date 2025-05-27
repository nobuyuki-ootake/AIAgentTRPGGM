import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

// 環境変数の読み込み
// @ts-ignore
dotenv.config();

// @ts-ignore
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/novel_agent',
});

async function runMigration(): Promise<void> {
  // @ts-ignore
  let client: PoolClient | null = null;

  try {
    // @ts-ignore
    client = await pool.connect();
    // @ts-ignore
    await client.query('BEGIN');

    // ユーザーテーブルの作成
    // @ts-ignore
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // APIキーテーブルの作成
    // @ts-ignore
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(20) NOT NULL,
        api_key_encrypted BYTEA NOT NULL,
        nonce BYTEA NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, provider)
      );
    `);

    // 使用量ログテーブルの作成
    // @ts-ignore
    await client.query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        provider VARCHAR(20) NOT NULL,
        request_type VARCHAR(50) NOT NULL,
        tokens_used INTEGER NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // @ts-ignore
    await client.query('COMMIT');
    console.log('マイグレーションが正常に完了しました');
  } catch (e) {
    // @ts-ignore
    if (client) await client.query('ROLLBACK');
    console.error('マイグレーションに失敗しました', e);
    throw e;
  } finally {
    // @ts-ignore
    if (client) await client.release();
  }
}

// マイグレーションの実行
runMigration().catch(console.error);

import { Pool, PoolClient, QueryResult } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { createCipheriv, randomBytes } from 'crypto';

// 環境変数の読み込み
// @ts-ignore
dotenv.config();

// @ts-ignore
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/novel_agent',
});

/**
 * APIキーを暗号化する
 */
function encryptApiKey(
  apiKey: string,
  encryptionKey: Buffer,
): { encryptedData: Buffer; nonce: Buffer } {
  const nonce = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, nonce);

  const encrypted = Buffer.concat([
    cipher.update(apiKey, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();
  return {
    encryptedData: Buffer.concat([encrypted, authTag]),
    nonce,
  };
}

async function seedDatabase(): Promise<void> {
  // @ts-ignore
  let client: PoolClient | null = null;

  try {
    // @ts-ignore
    client = await pool.connect();
    // @ts-ignore
    await client.query('BEGIN');

    // 環境変数からENCRYPTION_KEYを取得
    const encryptionKeyHex = process.env.ENCRYPTION_KEY;
    if (!encryptionKeyHex) {
      throw new Error('ENCRYPTION_KEY環境変数が設定されていません');
    }
    const encryptionKey = Buffer.from(encryptionKeyHex, 'hex');

    // テスト用ユーザーの作成
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // @ts-ignore
    const userResult: QueryResult = await client.query(
      `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO UPDATE SET email = $2, password_hash = $3
      RETURNING id
    `,
      ['testuser', 'test@example.com', passwordHash],
    );

    // @ts-ignore
    const userId = userResult.rows[0].id;
    console.log(`ユーザーID: ${userId} が作成/更新されました`);

    // 開発用APIキーを環境変数から取得
    const apiKeys: Record<string, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      claude: process.env.ANTHROPIC_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
    };

    for (const [provider, apiKey] of Object.entries(apiKeys)) {
      if (apiKey) {
        // APIキーを暗号化
        const { encryptedData, nonce } = encryptApiKey(apiKey, encryptionKey);

        // APIキーをデータベースに保存
        // @ts-ignore
        await client.query(
          `
          INSERT INTO api_keys (user_id, provider, api_key_encrypted, nonce, is_active)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, provider) DO UPDATE SET 
          api_key_encrypted = $3, nonce = $4, is_active = $5
        `,
          [userId, provider, encryptedData, nonce, true],
        );

        console.log(`${provider} APIキーが追加されました`);
      }
    }

    // @ts-ignore
    await client.query('COMMIT');
    console.log('シードデータが正常に追加されました');
  } catch (e) {
    // @ts-ignore
    if (client) await client.query('ROLLBACK');
    console.error('シードデータの追加に失敗しました', e);
    throw e;
  } finally {
    // @ts-ignore
    if (client) await client.release();
  }
}

// シードスクリプトの実行
seedDatabase()
  .catch(console.error)
  .finally(() => {
    // 終了
    process.exit(0);
  });

import express from 'express';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import winston from 'winston';

// ルーターのインポート
import aiAgentRoutes from './routes/aiAgent';

// 環境変数の読み込み
dotenv.config();

// ロガーの設定
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'ai-proxy-server' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Redisクライアントの設定
let redisClient: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);
    redisClient.on('error', (err: any) => {
      // logger.error('Redisエラー:', err);
      // 接続エラーが続く場合はクライアントをnullに設定
      if (err.code === 'ECONNREFUSED') {
        // logger.warn('Redis接続に失敗しました。キャッシュなしで続行します。');
        redisClient = null;
      }
    });
  } catch (error) {
    logger.error('Redisの初期化に失敗しました:', error);
    redisClient = null;
  }
}

// Expressアプリケーションの作成
const app = express();
const PORT = process.env.PORT || 4001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'null',
  undefined,
];

// ミドルウェアの設定
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(
  cors({
    origin: '*', // すべてのオリジンを許可
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  }),
);

// プリフライトリクエスト（OPTIONS）の明示的な処理
app.options(
  '*',
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  }),
);

// レート制限
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // リクエスト制限
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 認証ミドルウェア
const authMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  next();
};

// APIクライアントの初期化
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません');
  }
  return new OpenAI({ apiKey });
};

const getAnthropic = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic APIキーが設定されていません');
  }
  return new Anthropic({ apiKey });
};

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini APIキーが設定されていません');
  }
  return new GoogleGenerativeAI(apiKey);
};

// キャッシュ関数
const getFromCache = async (key: string): Promise<any | null> => {
  if (!redisClient) {
    logger.debug('Redisが利用できないため、キャッシュを使用しません');
    return null;
  }
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    logger.error('キャッシュ取得エラー:', error);
    return null;
  }
};

const setToCache = async (
  key: string,
  value: any,
  expiryInSeconds = 3600,
): Promise<void> => {
  if (!redisClient) {
    logger.debug('Redisが利用できないため、キャッシュを保存しません');
    return;
  }
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', expiryInSeconds);
  } catch (error) {
    logger.error('キャッシュ保存エラー:', error);
  }
};

// ルーターのマウント
app.use('/api/ai-agent', aiAgentRoutes);

// OpenAI APIプロキシ
app.post('/api/openai', authMiddleware, async (req, res) => {
  try {
    const requestBody = req.body;
    const cacheKey = `openai:${JSON.stringify(requestBody)}`;

    // キャッシュチェック
    const cached = await getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const openai = getOpenAI();
    const response = await openai.chat.completions.create(requestBody);

    // キャッシュに保存
    await setToCache(cacheKey, response);

    res.json(response);
  } catch (error: any) {
    logger.error('OpenAI APIエラー:', error);
    res.status(500).json({
      error: 'APIリクエストに失敗しました',
      message: error.message,
    });
  }
});

// Claude APIプロキシ
app.post('/api/claude', authMiddleware, async (req, res) => {
  try {
    const requestBody = req.body;
    const cacheKey = `claude:${JSON.stringify(requestBody)}`;

    // キャッシュチェック
    const cached = await getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const anthropic = getAnthropic();

    // Anthropicのバージョンに応じて適切なAPI呼び出しを行う
    // Anthropic SDK v0.11.0以降ではcompletionsメソッドを使用
    let response;
    if ('completions' in anthropic) {
      response = await anthropic.completions.create({
        model: requestBody.model || 'claude-3-opus-20240229',
        max_tokens_to_sample: requestBody.max_tokens_to_sample || 1000,
        prompt:
          requestBody.prompt ||
          requestBody.messages
            .map(
              (m: any) =>
                `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`,
            )
            .join('\n\n'),
        temperature: requestBody.temperature || 0.7,
      });
    } else if ('complete' in anthropic) {
      // v0.10.0以前のバージョン
      response = await (anthropic as any).complete({
        model: requestBody.model || 'claude-3-opus-20240229',
        max_tokens_to_sample: requestBody.max_tokens_to_sample || 1000,
        prompt:
          requestBody.prompt ||
          requestBody.messages
            .map(
              (m: any) =>
                `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`,
            )
            .join('\n\n'),
        temperature: requestBody.temperature || 0.7,
      });
    } else {
      throw new Error(
        'Anthropic SDKに互換性のあるメソッドが見つかりませんでした',
      );
    }

    // キャッシュに保存
    await setToCache(cacheKey, response);

    res.json(response);
  } catch (error: any) {
    logger.error('Claude APIエラー:', error);
    res.status(500).json({
      error: 'APIリクエストに失敗しました',
      message: error.message,
    });
  }
});

// Gemini APIプロキシ
app.post('/api/gemini', authMiddleware, async (req, res) => {
  try {
    const requestBody = req.body;
    const cacheKey = `gemini:${JSON.stringify(requestBody)}`;

    // キャッシュチェック
    const cached = await getFromCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: requestBody.model || 'gemini-pro',
    });
    const response = await model.generateContent(requestBody.contents);
    const result = response.response;

    // キャッシュに保存
    await setToCache(cacheKey, result);

    res.json(result);
  } catch (error: any) {
    logger.error('Gemini APIエラー:', error);
    res.status(500).json({
      error: 'APIリクエストに失敗しました',
      message: error.message,
    });
  }
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// AI作成支援エンドポイント
app.post('/api/ai/assist', async (req, res) => {
  try {
    const { message, selectedElements = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'メッセージは必須です' });
    }

    // mastraのnovelCreationNetworkを使用
    const { mastra } = require('./mastra');
    const result = await mastra.networks['novel-creation']?.run(message, {
      context: { selectedElements },
      maxSteps: 5,
    });

    // 結果を返す
    res.json({
      response: result?.output || 'エージェントからの応答がありませんでした',
      agentUsed: result?.agentUsed || 'unknown',
    });
  } catch (error) {
    console.error('AIアシストエラー:', error);
    res.status(500).json({
      error: 'AIアシストリクエストに失敗しました',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// サーバー起動
app.listen(PORT, () => {
  logger.info(`プロキシサーバーがポート${PORT}で起動しました`);
});

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  logger.info('SIGTERM受信。シャットダウンを開始します...');

  if (redisClient) {
    await redisClient.quit();
  }

  process.exit(0);
});

export default app;

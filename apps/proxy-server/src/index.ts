import express from 'express';
import { createServer } from 'http';
import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import winston from 'winston';
import aiAgentRoutes from './routes/aiAgent.js';
import authRoutes from './routes/auth.js';
import campaignsRoutes from './routes/campaigns.js';
import charactersRoutes from './routes/characters.js';
import sessionsRoutes from './routes/sessions.js';
import enemiesRoutes from './routes/enemies.js';
import npcsRoutes from './routes/npcs.js';
import imageUploadRoutes from './routes/image-upload.js';
import googleCloudRoutes from './routes/google-cloud.js';
import { authenticateToken, authenticateApiKey } from './middleware/auth.middleware.js';
import SocketService from './services/socket.service.js';
import { mastra } from './mastra/index.js';

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

// ExpressアプリケーションとHTTPサーバーの作成
const app = express();
const server = createServer(app);
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

// Socket.IOサービスの初期化
const socketService = new SocketService(server);

// ルーターのマウント
app.use('/api/ai-agent', aiAgentRoutes);
app.use('/api/auth', authRoutes);

// 認証が必要なTRPG関連API
app.use('/api/campaigns', authenticateToken, campaignsRoutes);
app.use('/api/characters', authenticateToken, charactersRoutes);
app.use('/api/sessions', authenticateToken, sessionsRoutes);
app.use('/api/enemies', authenticateToken, enemiesRoutes);
app.use('/api/npcs', authenticateToken, npcsRoutes);
app.use('/api/images', authenticateToken, imageUploadRoutes);
app.use('/api/google-cloud', authenticateToken, googleCloudRoutes);

// OpenAI APIプロキシ
app.post('/api/openai', authenticateApiKey, async (req, res) => {
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
app.post('/api/claude', authenticateApiKey, async (req, res) => {
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
app.post('/api/gemini', authenticateApiKey, async (req, res) => {
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
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: Number(PORT),
      services: {
        redis: redisClient ? 'connected' : 'disconnected',
        gemini: !!process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
        openai: !!process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
        anthropic: !!process.env.ANTHROPIC_API_KEY
          ? 'configured'
          : 'not configured',
        socketio: 'active',
      },
      realtime: {
        activeSessions: socketService.getActiveSessionsCount(),
        connectedUsers: socketService.getConnectedUsersCount(),
      },
    };

    // Redisの接続状態をテスト
    if (redisClient) {
      try {
        await redisClient.ping();
        healthStatus.services.redis = 'healthy';
      } catch (error) {
        healthStatus.services.redis = 'error';
      }
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('ヘルスチェックエラー:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// AI作成支援エンドポイント
app.post('/api/ai/assist', async (req, res) => {
  try {
    const { message, selectedElements = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'メッセージは必須です' });
    }

    // mastraのnovelCreationNetworkを使用
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
const port = Number(PORT);

// 起動前の基本チェック
const startupChecks = async () => {
  logger.info('起動前チェックを実行中...');

  // 必要な環境変数のチェック
  const requiredEnvVars = ['GEMINI_API_KEY'];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    logger.warn(
      `警告: 以下の環境変数が設定されていません: ${missingVars.join(', ')}`,
    );
  }

  // Redisの接続テスト
  if (redisClient) {
    try {
      await redisClient.ping();
      logger.info('Redis接続: OK');
    } catch (error) {
      logger.warn('Redis接続: エラー', error);
    }
  } else {
    logger.info('Redis: 未設定（キャッシュなしで動作）');
  }

  logger.info('起動前チェック完了');
};

// サーバー起動
const startServer = async () => {
  try {
    await startupChecks();

    server.listen(port, '0.0.0.0', () => {
      logger.info(`TRPGサーバーがポート${port}で起動しました`);
      logger.info(`ヘルスチェック: http://localhost:${port}/health`);
      logger.info(`Socket.IO: 有効`);
    });
  } catch (error) {
    logger.error('サーバー起動エラー:', error);
    process.exit(1);
  }
};

startServer();

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  logger.info('SIGTERM受信。シャットダウンを開始します...');

  if (redisClient) {
    await redisClient.quit();
  }

  process.exit(0);
});

export default app;

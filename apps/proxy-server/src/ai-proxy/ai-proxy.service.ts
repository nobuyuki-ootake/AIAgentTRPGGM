import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import Redis from 'ioredis';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
// import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class AiProxyService {
  private redis: Redis | null = null;
  private readonly logger = new Logger(AiProxyService.name);
  private readonly defaultOpenai: OpenAI;
  private readonly defaultAnthropic: Anthropic;
  private readonly defaultGenAI: GoogleGenerativeAI;

  constructor(
    private configService: ConfigService,
    // private apiKeysService: ApiKeysService,
  ) {
    // Redis接続
    try {
      const redisUrl =
        this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

      // Redisインスタンス初期化時にオプションを設定
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          this.logger.log(`Redis接続を再試行中... (${times}回目)`);
          return Math.min(times * 100, 3000); // 最大3秒間隔で再試行
        },
        maxRetriesPerRequest: 5, // リクエストごとの再試行回数
        enableOfflineQueue: true,
      });

      this.redis.on('connect', () => {
        this.logger.log('Redisに接続しました');
      });

      this.redis.on('error', (err) => {
        this.logger.error(`Redis接続エラー: ${err.message}`);
        // 接続エラーでもクラッシュさせない（サービスは継続）
      });

      this.redis.on('reconnecting', () => {
        this.logger.warn('Redisに再接続中...');
      });
    } catch (err) {
      this.logger.error(`Redis初期化エラー: ${err.message}`);
      this.redis = null;
    }

    // デフォルトのAPIクライアント
    this.defaultOpenai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
    this.defaultAnthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY') || '',
    });
    this.defaultGenAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY') || '',
    );
  }

  private async getCache(key: string): Promise<any | null> {
    if (!this.redis) {
      this.logger.warn('Redisが利用できないためキャッシュをスキップします');
      return null;
    }

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        this.logger.log(`キャッシュヒット: ${key}`);
        return JSON.parse(cached);
      }
      return null;
    } catch (e) {
      this.logger.warn(`Redisからの取得エラー: ${e.message}`);
      // Redisエラーでもクラッシュさせない
      return null;
    }
  }

  private async setCache(
    key: string,
    value: any,
    ttlSec = 3600,
  ): Promise<void> {
    if (!this.redis) {
      this.logger.warn('Redisが利用できないためキャッシュをスキップします');
      return;
    }

    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSec);
      this.logger.log(`キャッシュを保存: ${key} (TTL: ${ttlSec}秒)`);
    } catch (e) {
      this.logger.warn(`Redis保存エラー: ${e.message}`);
      // Redisエラーでもクラッシュさせない
    }
  }

  async proxyOpenAI(body: any, req: Request, res: Response) {
    // リクエスト情報をログに記録
    this.logger.log(`OpenAIリクエスト: モデル=${body.model || 'デフォルト'}`);

    // キャッシュキーの生成
    const cacheKey = `openai:${JSON.stringify(body)}`;

    try {
      // キャッシュの確認
      const cached = await this.getCache(cacheKey);
      if (cached) {
        this.logger.log('キャッシュからレスポンスを返却');
        return res.json(cached);
      }

      // デフォルトのAPIキーを使用
      const openai = this.defaultOpenai;

      // APIリクエスト
      const response = await openai.chat.completions.create(body);
      this.logger.log(`OpenAI成功応答: ${response.id}`);

      // キャッシュに保存
      await this.setCache(cacheKey, response);

      return res.json(response);
    } catch (error) {
      this.logger.error(`OpenAI APIエラー: ${error.message}`, error.stack);

      // エラーレスポンスの詳細情報
      const errorDetails = {
        message: 'OpenAI APIリクエストに失敗しました',
        error: error.message,
        status: error.status || 500,
        type: error.type || 'api_error',
      };

      return res.status(error.status || 500).json(errorDetails);
    }
  }

  async proxyClaude(body: any, req: Request, res: Response) {
    // リクエスト情報をログに記録
    this.logger.log(
      `Claudeリクエスト: モデル=${body.model || 'claude-3-opus-20240229'}`,
    );

    // キャッシュキーの生成
    const cacheKey = `claude:${JSON.stringify(body)}`;

    try {
      // キャッシュの確認
      const cached = await this.getCache(cacheKey);
      if (cached) {
        this.logger.log('キャッシュからレスポンスを返却');
        return res.json(cached);
      }

      // デフォルトのAPIキーを使用
      const anthropic = this.defaultAnthropic;

      // APIリクエスト
      const response = await anthropic.messages.create({
        model: body.model || 'claude-3-opus-20240229',
        max_tokens: body.max_tokens || 1000,
        system: body.system,
        messages: body.messages,
        temperature: body.temperature || 0.7,
      });

      this.logger.log(`Claude成功応答: ${response.id}`);

      // キャッシュに保存
      await this.setCache(cacheKey, response);

      return res.json(response);
    } catch (error) {
      this.logger.error(`Claude APIエラー: ${error.message}`, error.stack);

      // エラーレスポンスの詳細情報
      const errorDetails = {
        message: 'Claude APIリクエストに失敗しました',
        error: error.message,
        status: error.status || 500,
        type: error.type || 'api_error',
      };

      return res.status(error.status || 500).json(errorDetails);
    }
  }

  async proxyGemini(body: any, req: Request, res: Response) {
    // リクエスト情報をログに記録
    this.logger.log(`Geminiリクエスト: モデル=gemini-pro`);

    // キャッシュキーの生成
    const cacheKey = `gemini:${JSON.stringify(body)}`;

    try {
      // キャッシュの確認
      const cached = await this.getCache(cacheKey);
      if (cached) {
        this.logger.log('キャッシュからレスポンスを返却');
        return res.json(cached);
      }

      // デフォルトのAPIキーを使用
      const genAI = this.defaultGenAI;

      // APIリクエスト
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const response = await model.generateContent(body);
      const result = await response.response;

      this.logger.log(`Gemini成功応答を受信`);

      // キャッシュに保存
      await this.setCache(cacheKey, result);

      return res.json(result);
    } catch (error) {
      this.logger.error(`Gemini APIエラー: ${error.message}`, error.stack);

      // エラーレスポンスの詳細情報
      const errorDetails = {
        message: 'Gemini APIリクエストに失敗しました',
        error: error.message,
        status: error.status || 500,
        type: error.type || 'api_error',
      };

      return res.status(error.status || 500).json(errorDetails);
    }
  }
}

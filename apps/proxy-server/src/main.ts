import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // セキュリティ設定
    app.use(helmet());

    // CORS設定
    app.enableCors({
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.ALLOWED_ORIGINS?.split(',') || []
          : 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    });

    // バリデーションパイプ
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        // 詳細なエラーレスポンスをカスタマイズ
        exceptionFactory: (errors) => {
          const formattedErrors = errors.reduce((acc, error) => {
            const constraints = error.constraints
              ? Object.values(error.constraints)
              : [];
            acc[error.property] =
              constraints.length > 0 ? constraints[0] : '無効な値です';
            return acc;
          }, {});

          return {
            message: 'バリデーションエラー',
            errors: formattedErrors,
            statusCode: 400,
          };
        },
      }),
    );

    // グローバルな例外フィルター
    app.useGlobalFilters({
      catch: (exception, host) => {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        // エラーのステータスコードとメッセージを取得
        const status = exception.status || exception.statusCode || 500;
        const message = exception.message || '内部サーバーエラー';

        // 深刻なエラーのみをログに記録
        if (status >= 500) {
          logger.error(
            `${request.method} ${request.url} ${status}: ${message}`,
            exception.stack,
          );
        } else {
          logger.warn(`${request.method} ${request.url} ${status}: ${message}`);
        }

        // クライアントへのレスポンス
        response.status(status).json({
          statusCode: status,
          message,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      },
    });

    // Swagger UI設定
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('小説作成エージェント API')
        .setDescription('AI APIプロキシおよびユーザー管理API')
        .setVersion('1.0')
        .addTag('ai-proxy', 'AI APIプロキシ機能')
        .addTag('users', 'ユーザー管理機能')
        .addTag('api-keys', 'APIキー管理機能')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api-docs', app, document);
    }

    // サーバー起動
    const port = process.env.PORT || 4001;
    await app.listen(port);
    logger.log(`アプリケーションが起動しました: http://localhost:${port}`);
    if (process.env.NODE_ENV !== 'production') {
      logger.log(`Swagger UIが利用可能です: http://localhost:${port}/api-docs`);
    }

    // グレースフルシャットダウンの処理
    process.on('SIGINT', async () => {
      logger.log('アプリケーションをシャットダウンしています...');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error(
      `アプリケーション起動中にエラーが発生しました: ${error.message}`,
      error.stack,
    );
    process.exit(1);
  }
}

bootstrap();

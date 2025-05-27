/**
 * Mastraモックライブラリによる対話型AIエージェントシステムの設定と初期化
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// Geminiクライアントの初期化
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      'ERROR: Gemini APIキーが設定されていません。環境変数 GEMINI_API_KEY を設定してください。',
    );
    throw new Error('Gemini APIキーが設定されていません');
  }
  return new GoogleGenerativeAI(apiKey);
};

// 簡易化したMastraのモッククラス
class MastraMock {
  defaultProvider: string;
  providers: Record<string, any>;
  logger: any;
  agents: Record<string, any> = {};
  tools: Record<string, any> = {};
  networks: Record<string, any> = {};

  constructor(config: {
    defaultProvider: string;
    providers: Record<string, any>;
    logging?: any;
  }) {
    this.defaultProvider = config.defaultProvider;
    this.providers = config.providers;
    this.logger = {
      info: console.info,
      error: console.error,
      debug: console.debug,
      warn: console.warn,
    };
  }

  setErrorHandler(handler: (error: any) => any) {
    // エラーハンドラーを設定
    return this;
  }

  agent(name: string) {
    // エージェント定義用のビルダー
    const agent = {
      name,
      desc: '',
      msg: '',
      description: (desc: string) => {
        agent.desc = desc;
        return agent;
      },
      systemMessage: (message: string) => {
        agent.msg = message;
        this.agents[name] = { ...agent, systemMessage: message };
        return agent;
      },
    };
    return agent;
  }

  tool(name: string) {
    // ツール定義用のビルダー
    const tool = {
      name,
      desc: '',
      schemaObj: {},
      handlerFunc: async () => {},
      description: (desc: string) => {
        tool.desc = desc;
        return tool;
      },
      schema: (schemaObj: any) => {
        tool.schemaObj = schemaObj;
        return tool;
      },
      handler: (handlerFunc: (args?: any) => Promise<any>) => {
        tool.handlerFunc = handlerFunc;
        this.tools[name] = tool;
        return tool;
      },
    };
    return tool;
  }

  network(name: string) {
    // ネットワーク定義用のビルダー
    const network = {
      name,
      desc: '',
      agentsList: [] as string[],
      toolsList: [] as string[],
      routerFunc: async () => '',
      description: (desc: string) => {
        network.desc = desc;
        return network;
      },
      agents: (agentsList: any[]) => {
        network.agentsList = agentsList.map((a) => a.name);
        return network;
      },
      tools: (toolsList: any[]) => {
        network.toolsList = toolsList.map((t) => t.name);
        return network;
      },
      router: (routerFunc: () => Promise<string>) => {
        network.routerFunc = routerFunc;
        this.networks[name] = network;
        return network;
      },
      run: async (input: string, options: any = {}) => {
        const { context = {}, maxSteps = 3 } = options;

        try {
          // ルーターを使用してエージェントを決定
          let agentName;
          if (context.forceAgent && this.agents[context.forceAgent]) {
            agentName = context.forceAgent;
          } else {
            agentName = await network.routerFunc();
          }

          const agent = this.agents[agentName];
          if (!agent) {
            throw new Error(`エージェント "${agentName}" が見つかりません`);
          }

          // 選択されたエージェントでGemini APIを実行
          const geminiClient = this.providers[this.defaultProvider].client;
          const result = await this.runWithGemini(
            geminiClient,
            agent,
            input,
            context.selectedElements || [],
          );

          return {
            output: result,
            agentUsed: agentName,
            steps: [
              {
                agent: agentName,
                input,
                output: result,
              },
            ],
          };
        } catch (error) {
          // 詳細なエラー情報をコンソールに出力
          console.error('[NETWORK ERROR] ネットワーク実行エラー:');
          console.error(JSON.stringify(error, null, 2));

          // エラー情報を構造化
          let errorType = 'GENERAL_ERROR';
          let errorDetails = {};

          if (typeof error === 'object') {
            if (error.type) {
              errorType = error.type;
            }

            if (error.details) {
              errorDetails = error.details;
            } else if (error instanceof Error) {
              errorDetails = {
                name: error.name,
                message: error.message,
                stack: error.stack,
              };
            } else {
              errorDetails = { ...error };
            }
          }

          // 明示的なエラー情報を含む応答を返す
          return {
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : error.message || 'リクエスト処理中にエラーが発生しました',
            error: {
              type: errorType,
              details: errorDetails,
              timestamp: new Date().toISOString(),
            },
            // デバッグ情報を含める
            debug: {
              input: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
              context: context
                ? JSON.stringify(context).substring(0, 100)
                : 'なし',
            },
          };
        }
      },
    };
    return network;
  }

  // Gemini APIを使用してLLMを実行
  async runWithGemini(
    geminiClient: GoogleGenerativeAI,
    agent: any,
    input: string,
    selectedElements: any[] = [],
  ) {
    try {
      // コンテキスト情報を構築
      let contextInfo = '';
      let titleInfo = '';

      if (selectedElements && selectedElements.length > 0) {
        // タイトル情報があれば別途抽出
        const titleElements = selectedElements.filter(
          (el) => el.type === 'title',
        );
        if (titleElements.length > 0) {
          titleInfo = `作品タイトル: ${titleElements[0].content}\n\n`;
        }

        // その他のコンテキスト情報を構築
        const nonTitleElements = selectedElements.filter(
          (el) => el.type !== 'title',
        );
        if (nonTitleElements.length > 0) {
          contextInfo =
            '参考情報:\n' +
            nonTitleElements
              .map((element) => {
                return `${element.type || '項目'}: ${element.name || ''}\n${
                  element.content || ''
                }`;
              })
              .join('\n\n');
        }
      }

      // プロンプトを構築
      const systemPrompt = `${agent.systemMessage}

あなたは小説創作の専門家です。次の要件に基づいて、質の高い応答を生成してください。

${
  titleInfo
    ? `この物語のタイトルは「${titleInfo
        .replace('作品タイトル: ', '')
        .trim()}」です。`
    : ''
}

応答は日本語で、具体的かつ創造的にしてください。
`;

      const userPrompt = contextInfo ? `${contextInfo}\n\n${input}` : input;

      console.log(`[DEBUG] 入力メッセージ: ${input}`);
      console.log(`[DEBUG] タイトル情報: ${titleInfo}`);

      // Gemini APIを使用
      try {
        const model = geminiClient.getGenerativeModel({
          model: 'gemini-1.5-pro',
          generationConfig: {
            temperature: 0.7,
          },
        });

        const result = await model.generateContent([
          { text: systemPrompt + '\n\n' + userPrompt },
        ]);

        const response = result.response;
        return response.text();
      } catch (apiError) {
        // 詳細なエラー情報を出力（デバッグ用）
        console.error('[GEMINI ERROR] API実行エラー:', apiError);
        console.error('[GEMINI ERROR] リクエスト内容:');
        console.error('- エージェント:', agent.name);
        console.error(
          '- システムプロンプト（一部）:',
          systemPrompt.substring(0, 100) + '...',
        );
        console.error(
          '- ユーザー入力（一部）:',
          input.substring(0, 50) + '...',
        );

        // エラー詳細情報を構築
        const errorDetail = {
          message:
            apiError instanceof Error ? apiError.message : '不明なエラー',
          name: apiError instanceof Error ? apiError.name : 'Unknown',
          stack: apiError instanceof Error ? apiError.stack : undefined,
          agentName: agent.name,
          inputLength: input.length,
        };

        // エラーを再スロー（握りつぶさない）
        throw {
          type: 'GEMINI_API_ERROR',
          message: 'Gemini APIでのリクエスト処理中にエラーが発生しました',
          details: errorDetail,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      // 詳細なエラー情報を出力（デバッグ用）
      console.error('[CRITICAL ERROR] エージェント実行エラー:');
      console.error(JSON.stringify(error, null, 2));

      // エラーを再スロー（握りつぶさない）
      throw error;
    }
  }
}

// Gemini APIクライアントの初期化
let gemini;
try {
  gemini = getGeminiClient();
  console.log('Gemini APIクライアントが正常に初期化されました');
} catch (error) {
  console.error('Gemini APIクライアントの初期化に失敗しました:', error);
  throw error; // エラーを握りつぶさず再スロー
}

// LLMプロバイダーの設定（OpenAI関連を削除）
const providers = {
  gemini: {
    client: gemini,
    config: {
      model: 'gemini-1.5-pro',
      temperature: 0.7,
    },
  },
};

// Mastraモックインスタンスを初期化
export const mastra = new MastraMock({
  defaultProvider: 'gemini',
  providers,
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  },
});

// ロガー設定
mastra.logger.info(
  'Gemini APIを使用したMastraモックエージェントシステムが初期化されました',
);

// 小説創作エージェントの定義
mastra.agent('novel-assistant').description('小説創作のアシスタント')
  .systemMessage(`あなたは小説創作の専門家です。ユーザーが小説を書くのを手伝います。
日本語の文学、ストーリーテリング、キャラクター作成、プロット構築など、
創作に関するあらゆる質問に答えることができます。
常に建設的で具体的なアドバイスを提供してください。`);

// 小説創作ネットワークの定義
mastra
  .network('novel-creation')
  .description('小説創作支援ネットワーク')
  .agents([mastra.agents['novel-assistant']])
  .router(async () => 'novel-assistant');

// デフォルトの例外ハンドラー設定
mastra.setErrorHandler((error) => {
  mastra.logger.error('エラー:', error);
  return {
    output: 'すみません、エラーが発生しました。少し後で再試行してください。',
    error: true,
  };
});

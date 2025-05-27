import { OpenAI } from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getSystemPrompt,
  getCombinedSystemPrompt,
  SystemRoles,
} from './systemPrompts';

/**
 * 利用可能なAIプロバイダータイプ
 */
export enum AIProvider {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
}

/**
 * AIリクエストオプション
 */
export interface AIRequestOptions {
  provider: AIProvider;
  temperature?: number;
  maxTokens?: number;
  systemRole?: string | string[];
  cacheKey?: string;
}

/**
 * 選択された要素（コンテキスト）の型定義
 */
export interface SelectedContext {
  type: 'plot' | 'character' | 'chapter' | 'worldbuilding' | 'writing';
  id: string;
  name: string;
  content: string;
  [key: string]: any;
}

/**
 * AIエージェントサービス
 */
export class AIAgentService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  /**
   * OpenAIクライアントを取得
   */
  private getOpenAI(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI APIキーが設定されていません');
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  /**
   * Anthropicクライアントを取得
   */
  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic APIキーが設定されていません');
      }
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  /**
   * Geminiクライアントを取得
   */
  private getGemini(): GoogleGenerativeAI {
    if (!this.gemini) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません');
      }
      this.gemini = new GoogleGenerativeAI(apiKey);
    }
    return this.gemini;
  }

  /**
   * 選択された要素からシステムプロンプトを拡張
   */
  private enhanceSystemPrompt(
    systemPrompt: string,
    selectedElements: SelectedContext[],
  ): string {
    if (!selectedElements || selectedElements.length === 0) {
      return systemPrompt;
    }

    let enhancedPrompt = systemPrompt + '\n\n';
    enhancedPrompt += '以下の選択された要素を考慮してください：\n\n';

    // 要素タイプごとにグループ化
    const typeGroups: Record<string, SelectedContext[]> = {};
    selectedElements.forEach((element) => {
      if (!typeGroups[element.type]) {
        typeGroups[element.type] = [];
      }
      typeGroups[element.type].push(element);
    });

    // タイプごとにコンテキスト情報を追加
    for (const [type, elements] of Object.entries(typeGroups)) {
      enhancedPrompt += `【${this.getJapaneseTypeName(type)}】\n`;

      elements.forEach((element) => {
        enhancedPrompt += `- 名前: ${element.name}\n`;
        if (element.content) {
          enhancedPrompt += `  内容: ${element.content}\n`;
        }
        // 追加属性があれば出力
        Object.entries(element).forEach(([key, value]) => {
          if (
            key !== 'type' &&
            key !== 'id' &&
            key !== 'name' &&
            key !== 'content' &&
            value
          ) {
            enhancedPrompt += `  ${key}: ${value}\n`;
          }
        });
        enhancedPrompt += '\n';
      });
    }

    return enhancedPrompt;
  }

  /**
   * 要素タイプの日本語名を取得
   */
  private getJapaneseTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      plot: 'プロット',
      character: 'キャラクター',
      chapter: '章',
      worldbuilding: '世界観',
      writing: '執筆内容',
    };

    return typeMap[type] || type;
  }

  /**
   * AIエージェントにメッセージを送信
   */
  public async sendMessage(
    message: string,
    selectedElements: SelectedContext[] = [],
    options: AIRequestOptions = { provider: AIProvider.OPENAI },
  ) {
    const {
      provider = AIProvider.OPENAI,
      temperature = 0.7,
      maxTokens = 1000,
      systemRole = SystemRoles.DEFAULT,
    } = options;

    // システムプロンプトを取得
    let systemPrompt: string;
    if (Array.isArray(systemRole)) {
      systemPrompt = getCombinedSystemPrompt(systemRole);
    } else {
      systemPrompt = getSystemPrompt(systemRole);
    }

    // 選択された要素でシステムプロンプトを拡張
    const enhancedSystemPrompt = this.enhanceSystemPrompt(
      systemPrompt,
      selectedElements,
    );

    try {
      switch (provider) {
        case AIProvider.OPENAI:
          return await this.sendOpenAIMessage(
            message,
            enhancedSystemPrompt,
            temperature,
            maxTokens,
          );
        case AIProvider.CLAUDE:
          return await this.sendClaudeMessage(
            message,
            enhancedSystemPrompt,
            temperature,
            maxTokens,
          );
        case AIProvider.GEMINI:
          return await this.sendGeminiMessage(
            message,
            enhancedSystemPrompt,
            temperature,
            maxTokens,
          );
        default:
          throw new Error(`不明なプロバイダー: ${provider}`);
      }
    } catch (error: any) {
      console.error(`AIメッセージ送信エラー (${provider}):`, error);
      throw new Error(`AI応答の生成に失敗しました: ${error.message}`);
    }
  }

  /**
   * OpenAIにメッセージを送信
   */
  private async sendOpenAIMessage(
    message: string,
    systemPrompt: string,
    temperature: number,
    maxTokens: number,
  ) {
    const openai = this.getOpenAI();

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Claudeにメッセージを送信
   */
  private async sendClaudeMessage(
    message: string,
    systemPrompt: string,
    temperature: number,
    maxTokens: number,
  ) {
    const anthropic = this.getAnthropic();

    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      temperature,
      max_tokens: maxTokens,
    });

    return response.content[0].text || '';
  }

  /**
   * Geminiにメッセージを送信
   */
  private async sendGeminiMessage(
    message: string,
    systemPrompt: string,
    temperature: number,
    maxTokens: number,
  ) {
    const genAI = this.getGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Geminiではシステムプロンプトとユーザーメッセージを連結
    const combinedPrompt = `${systemPrompt}\n\nユーザーからの質問: ${message}`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: combinedPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    return result.response.text() || '';
  }
}

// シングルトンインスタンスをエクスポート
export const aiAgentService = new AIAgentService();

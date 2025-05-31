// Google Cloud統合サービス
import { Storage } from '@google-cloud/storage';
import { VertexAI } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9' | '4:3' | '3:4';
  style?: 'photographic' | 'digital-art' | 'anime' | 'fantasy' | 'realistic';
  quality?: 'standard' | 'hd';
  seed?: number;
}

export interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  generatedAt: string;
  cost: number;
  metadata: {
    seed?: number;
    aspectRatio: string;
    style: string;
  };
}

export class GoogleCloudService {
  private storage: Storage;
  private vertexAI: VertexAI;
  private auth: GoogleAuth;
  private bucketName: string;
  private projectId: string;
  private location: string;

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || '';
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    this.bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || '';

    if (!this.projectId || !this.bucketName) {
      console.warn('Google Cloud configuration incomplete. Some features may not work.');
      return;
    }

    // Google Cloud認証設定
    this.auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/devstorage.full_control'
      ]
    });

    // Cloud Storage初期化
    this.storage = new Storage({
      projectId: this.projectId,
      authClient: this.auth
    });

    // Vertex AI初期化
    this.vertexAI = new VertexAI({
      project: this.projectId,
      location: this.location
    });
  }

  // 画像生成（Imagen使用）
  public async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      if (!this.projectId) {
        throw new Error('Google Cloud not configured');
      }

      // Vertex AI Imagen モデルを使用
      const generativeModel = this.vertexAI.getGenerativeModel({
        model: 'imagegeneration@006', // Imagenの最新モデル
      });

      // プロンプトの構築
      let fullPrompt = request.prompt;
      if (request.style && request.style !== 'realistic') {
        fullPrompt += `, ${request.style} style`;
      }

      // 画像生成リクエスト
      const imageRequest = {
        prompt: fullPrompt,
        negativePrompt: request.negativePrompt,
        aspectRatio: request.aspectRatio || '1:1',
        seed: request.seed,
        // Imagenの品質設定
        addWatermark: false,
        safetyFilterLevel: 'block_some',
        personGeneration: 'allow_adult'
      };

      console.log('Generating image with Imagen:', imageRequest);

      // 画像生成実行
      const result = await generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Generate an image: ${JSON.stringify(imageRequest)}`
          }]
        }]
      });

      // 結果から画像データを取得（実際のAPI応答に応じて調整が必要）
      const response = result.response;
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No image generated');
      }

      // 生成された画像をCloud Storageにアップロード
      const imageBuffer = this.extractImageFromResponse(response);
      const fileName = `generated/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      const imageUrl = await this.uploadToStorage(imageBuffer, fileName, 'image/png');

      // コスト計算（Imagenの料金: 約$0.03/画像）
      const cost = 0.03;

      return {
        imageUrl,
        prompt: request.prompt,
        generatedAt: new Date().toISOString(),
        cost,
        metadata: {
          seed: request.seed,
          aspectRatio: request.aspectRatio || '1:1',
          style: request.style || 'realistic'
        }
      };
    } catch (error) {
      console.error('Image generation error:', error);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  // テキスト生成（Gemini Pro使用）
  public async generateText(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  } = {}): Promise<string> {
    try {
      if (!this.projectId) {
        throw new Error('Google Cloud not configured');
      }

      const generativeModel = this.vertexAI.getGenerativeModel({
        model: 'gemini-1.5-pro-002',
        generationConfig: {
          maxOutputTokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
          topP: options.topP || 0.8,
        }
      });

      const result = await generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      });

      const response = result.response;
      return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Text generation error:', error);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  // Cloud Storageにファイルアップロード
  public async uploadToStorage(
    fileBuffer: Buffer, 
    fileName: string, 
    contentType: string,
    isPublic: boolean = true
  ): Promise<string> {
    try {
      if (!this.bucketName) {
        throw new Error('Storage bucket not configured');
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      await file.save(fileBuffer, {
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000', // 1年間キャッシュ
        },
        public: isPublic,
      });

      if (isPublic) {
        await file.makePublic();
        return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
      } else {
        // プライベートファイルの場合は署名付きURLを生成
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24時間有効
        });
        return signedUrl;
      }
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Cloud Storageからファイル削除
  public async deleteFromStorage(fileName: string): Promise<void> {
    try {
      if (!this.bucketName) {
        throw new Error('Storage bucket not configured');
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      await file.delete();
      console.log(`File ${fileName} deleted from storage`);
    } catch (error) {
      console.error('Storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // ファイルリスト取得
  public async listFiles(prefix: string = '', limit: number = 100): Promise<Array<{
    name: string;
    size: number;
    created: string;
    contentType: string;
    publicUrl?: string;
  }>> {
    try {
      if (!this.bucketName) {
        throw new Error('Storage bucket not configured');
      }

      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({
        prefix,
        maxResults: limit
      });

      return files.map(file => ({
        name: file.name,
        size: parseInt(file.metadata.size || '0'),
        created: file.metadata.timeCreated || '',
        contentType: file.metadata.contentType || '',
        publicUrl: file.publicUrl()
      }));
    } catch (error) {
      console.error('List files error:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // Cloud Storage設定確認
  public async verifyStorageAccess(): Promise<boolean> {
    try {
      if (!this.bucketName) {
        return false;
      }

      const bucket = this.storage.bucket(this.bucketName);
      const [exists] = await bucket.exists();
      
      if (!exists) {
        console.warn(`Storage bucket ${this.bucketName} does not exist`);
        return false;
      }

      // テストファイルの作成・削除で書き込み権限を確認
      const testFileName = `test_${Date.now()}.txt`;
      const testFile = bucket.file(testFileName);
      
      await testFile.save('test content', {
        metadata: { contentType: 'text/plain' }
      });
      
      await testFile.delete();
      
      return true;
    } catch (error) {
      console.error('Storage verification error:', error);
      return false;
    }
  }

  // Vertex AI設定確認
  public async verifyVertexAIAccess(): Promise<boolean> {
    try {
      if (!this.projectId) {
        return false;
      }

      // 簡単なテキスト生成で接続確認
      const testResult = await this.generateText('Hello', { maxTokens: 10 });
      return testResult.length > 0;
    } catch (error) {
      console.error('Vertex AI verification error:', error);
      return false;
    }
  }

  // 認証状態確認
  public async getAuthStatus(): Promise<{
    authenticated: boolean;
    projectId: string;
    location: string;
    bucketName: string;
    storageAccess: boolean;
    vertexAIAccess: boolean;
  }> {
    try {
      await this.auth.getAccessToken();
      
      const [storageAccess, vertexAIAccess] = await Promise.all([
        this.verifyStorageAccess(),
        this.verifyVertexAIAccess()
      ]);

      return {
        authenticated: true,
        projectId: this.projectId,
        location: this.location,
        bucketName: this.bucketName,
        storageAccess,
        vertexAIAccess
      };
    } catch (error) {
      console.error('Auth verification error:', error);
      return {
        authenticated: false,
        projectId: this.projectId,
        location: this.location,
        bucketName: this.bucketName,
        storageAccess: false,
        vertexAIAccess: false
      };
    }
  }

  // Imagenレスポンスから画像データを抽出（実装は実際のAPI仕様に依存）
  private extractImageFromResponse(response: any): Buffer {
    // 実際のImagen APIの応答形式に応じて実装
    // これは仮実装です
    try {
      if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        // Base64エンコードされた画像データの場合
        const imageData = response.candidates[0].content.parts[0].inlineData?.data;
        if (imageData) {
          return Buffer.from(imageData, 'base64');
        }
      }
      
      // フォールバック: ダミー画像データ
      throw new Error('No image data in response');
    } catch (error) {
      console.error('Failed to extract image from response:', error);
      throw error;
    }
  }

  // バッチ画像生成
  public async generateImages(requests: ImageGenerationRequest[]): Promise<ImageGenerationResult[]> {
    const results: ImageGenerationResult[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.generateImage(request);
        results.push(result);
        
        // レート制限対応のため少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate image for prompt: ${request.prompt}`, error);
        // エラーは記録するが処理は継続
      }
    }
    
    return results;
  }

  // コスト計算
  public calculateImageGenerationCost(count: number): number {
    return count * 0.03; // Imagenの基本料金
  }

  public calculateTextGenerationCost(inputTokens: number, outputTokens: number): number {
    // Gemini Proの料金（概算）
    const inputCost = (inputTokens / 1000) * 0.00025;  // $0.00025 per 1K tokens
    const outputCost = (outputTokens / 1000) * 0.0005; // $0.0005 per 1K tokens
    return inputCost + outputCost;
  }
}

export default GoogleCloudService;
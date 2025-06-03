/**
 * 🎨 AI画像生成サービス
 * 
 * Google Imagen 3とVertex AIを統合した
 * TRPG用画像生成システム
 */

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  style?: 'fantasy' | 'realistic' | 'anime' | 'artistic' | 'technical';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  quality?: 'draft' | 'standard' | 'high';
  size?: 'small' | 'medium' | 'large';
  seed?: number;
  guidanceScale?: number;
  steps?: number;
  imageType: 'character' | 'location' | 'item' | 'scene' | 'map' | 'portrait';
}

export interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  style: string;
  dimensions: { width: number; height: number };
  generatedAt: Date;
  metadata: {
    model: string;
    parameters: any;
    cost?: number;
    generationTime?: number;
  };
}

export interface ImageGenerationResult {
  success: boolean;
  images: GeneratedImage[];
  error?: string;
  remainingCredits?: number;
  estimatedCost?: number;
}

/**
 * 🎯 画像生成プリセット
 */
export const IMAGE_GENERATION_PRESETS = {
  character: {
    style: 'fantasy',
    aspectRatio: '3:4' as const,
    prompts: {
      prefix: 'Fantasy RPG character portrait, detailed face, high quality, ',
      suffix: ', professional character art, D&D style, detailed clothing and equipment',
      negativePrompt: 'blurry, low quality, distorted, nsfw, modern clothing, photography'
    }
  },
  location: {
    style: 'fantasy',
    aspectRatio: '16:9' as const,
    prompts: {
      prefix: 'Fantasy landscape, detailed environment, atmospheric, ',
      suffix: ', cinematic lighting, high detail, RPG setting, painted art style',
      negativePrompt: 'blurry, low quality, modern buildings, cars, photography'
    }
  },
  item: {
    style: 'realistic',
    aspectRatio: '1:1' as const,
    prompts: {
      prefix: 'Fantasy RPG item, detailed object, clean background, ',
      suffix: ', item art, game asset style, high detail, centered composition',
      negativePrompt: 'blurry, cluttered background, low quality, modern items'
    }
  },
  scene: {
    style: 'artistic',
    aspectRatio: '16:9' as const,
    prompts: {
      prefix: 'Fantasy RPG scene, dramatic composition, detailed environment, ',
      suffix: ', epic scene, cinematic, detailed characters and background',
      negativePrompt: 'blurry, low quality, modern elements, nsfw'
    }
  },
  map: {
    style: 'technical',
    aspectRatio: '1:1' as const,
    prompts: {
      prefix: 'Fantasy map, top-down view, detailed cartography, ',
      suffix: ', RPG map style, clear labels, detailed terrain features',
      negativePrompt: 'blurry, low quality, modern maps, satellite imagery'
    }
  },
  portrait: {
    style: 'realistic',
    aspectRatio: '1:1' as const,
    prompts: {
      prefix: 'Character portrait, detailed face, high quality rendering, ',
      suffix: ', portrait art, detailed facial features, professional lighting',
      negativePrompt: 'blurry, low quality, distorted features, nsfw'
    }
  }
};

/**
 * 🔧 画像生成設定
 */
export const GENERATION_SETTINGS = {
  models: {
    'imagen-3': {
      name: 'Google Imagen 3',
      maxResolution: { width: 2048, height: 2048 },
      supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      costPerImage: 0.04, // USD
      averageGenerationTime: 15000 // ms
    },
    'vertex-ai': {
      name: 'Vertex AI Studio',
      maxResolution: { width: 1024, height: 1024 },
      supportedAspectRatios: ['1:1', '16:9', '9:16'],
      costPerImage: 0.02,
      averageGenerationTime: 8000
    }
  },
  
  qualitySettings: {
    draft: { steps: 20, guidanceScale: 7, size: 'small' },
    standard: { steps: 50, guidanceScale: 10, size: 'medium' },
    high: { steps: 100, guidanceScale: 12, size: 'large' }
  },
  
  sizes: {
    small: { width: 512, height: 512 },
    medium: { width: 1024, height: 1024 },
    large: { width: 2048, height: 2048 }
  }
};

/**
 * 🎨 AI画像生成サービスクラス
 */
export class AIImageGenerationService {
  private apiKey: string | null = null;
  private baseUrl: string = '/api/ai-agent';
  private generationHistory: GeneratedImage[] = [];

  constructor() {
    this.loadSettings();
  }

  /**
   * 🔑 API設定を読み込み
   */
  private loadSettings(): void {
    this.apiKey = localStorage.getItem('google_ai_api_key');
  }

  /**
   * 🎯 メイン画像生成メソッド
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          images: [],
          error: 'Google AI API key not configured'
        };
      }

      const enhancedPrompt = this.enhancePrompt(request);
      const generationParams = this.buildGenerationParams(request);

      const response = await fetch(`${this.baseUrl}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          ...generationParams
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          images: [],
          error: result.error || 'Image generation failed'
        };
      }

      const generatedImages = this.processGenerationResult(result, request);
      this.addToHistory(generatedImages);

      return {
        success: true,
        images: generatedImages,
        remainingCredits: result.remainingCredits,
        estimatedCost: result.estimatedCost
      };

    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        images: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 🎨 プロンプト強化
   */
  private enhancePrompt(request: ImageGenerationRequest): string {
    const preset = IMAGE_GENERATION_PRESETS[request.imageType];
    let enhancedPrompt = request.prompt;

    // プリセットのプレフィックス・サフィックス適用
    if (preset) {
      enhancedPrompt = `${preset.prompts.prefix}${enhancedPrompt}${preset.prompts.suffix}`;
    }

    // スタイル特化の強化
    switch (request.style) {
      case 'fantasy':
        enhancedPrompt += ', fantasy art style, magical atmosphere, detailed fantasy elements';
        break;
      case 'realistic':
        enhancedPrompt += ', photorealistic, detailed textures, realistic lighting';
        break;
      case 'anime':
        enhancedPrompt += ', anime style, cel shading, vibrant colors, manga-inspired';
        break;
      case 'artistic':
        enhancedPrompt += ', artistic style, painterly, creative composition, artistic interpretation';
        break;
      case 'technical':
        enhancedPrompt += ', technical illustration, precise details, clean lines, technical drawing style';
        break;
    }

    return enhancedPrompt;
  }

  /**
   * 🔧 生成パラメータ構築
   */
  private buildGenerationParams(request: ImageGenerationRequest): any {
    const quality = request.quality || 'standard';
    const size = request.size || GENERATION_SETTINGS.qualitySettings[quality].size;
    const preset = IMAGE_GENERATION_PRESETS[request.imageType];

    return {
      negativePrompt: request.negativePrompt || preset?.prompts.negativePrompt || '',
      aspectRatio: request.aspectRatio || preset?.aspectRatio || '1:1',
      quality: quality,
      dimensions: GENERATION_SETTINGS.sizes[size as keyof typeof GENERATION_SETTINGS.sizes],
      seed: request.seed,
      guidanceScale: request.guidanceScale || GENERATION_SETTINGS.qualitySettings[quality].guidanceScale,
      steps: request.steps || GENERATION_SETTINGS.qualitySettings[quality].steps,
      style: request.style || preset?.style || 'fantasy',
      imageType: request.imageType
    };
  }

  /**
   * 📊 生成結果の処理
   */
  private processGenerationResult(result: any, request: ImageGenerationRequest): GeneratedImage[] {
    return result.images.map((imageData: any, index: number) => ({
      id: `img_${Date.now()}_${index}`,
      url: imageData.url,
      thumbnailUrl: imageData.thumbnailUrl,
      prompt: request.prompt,
      style: request.style || 'fantasy',
      dimensions: imageData.dimensions || { width: 1024, height: 1024 },
      generatedAt: new Date(),
      metadata: {
        model: result.model || 'imagen-3',
        parameters: this.buildGenerationParams(request),
        cost: result.cost,
        generationTime: result.generationTime
      }
    }));
  }

  /**
   * 📚 履歴に追加
   */
  private addToHistory(images: GeneratedImage[]): void {
    this.generationHistory.push(...images);
    
    // 履歴の制限（最新100件）
    if (this.generationHistory.length > 100) {
      this.generationHistory = this.generationHistory.slice(-100);
    }

    // ローカルストレージに保存
    localStorage.setItem('ai_image_generation_history', JSON.stringify(this.generationHistory));
  }

  /**
   * 🎯 キャラクター画像生成（専用メソッド）
   */
  async generateCharacterImage(
    characterDescription: string,
    options: Partial<ImageGenerationRequest> = {}
  ): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: characterDescription,
      imageType: 'character',
      style: 'fantasy',
      aspectRatio: '3:4',
      quality: 'standard',
      ...options
    });
  }

  /**
   * 🏰 拠点画像生成（専用メソッド）
   */
  async generateLocationImage(
    locationDescription: string,
    options: Partial<ImageGenerationRequest> = {}
  ): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: locationDescription,
      imageType: 'location',
      style: 'fantasy',
      aspectRatio: '16:9',
      quality: 'standard',
      ...options
    });
  }

  /**
   * 🗺️ マップ生成（専用メソッド）
   */
  async generateMapImage(
    mapDescription: string,
    options: Partial<ImageGenerationRequest> = {}
  ): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: mapDescription,
      imageType: 'map',
      style: 'technical',
      aspectRatio: '1:1',
      quality: 'high',
      ...options
    });
  }

  /**
   * ⚔️ アイテム画像生成（専用メソッド）
   */
  async generateItemImage(
    itemDescription: string,
    options: Partial<ImageGenerationRequest> = {}
  ): Promise<ImageGenerationResult> {
    return this.generateImage({
      prompt: itemDescription,
      imageType: 'item',
      style: 'realistic',
      aspectRatio: '1:1',
      quality: 'standard',
      ...options
    });
  }

  /**
   * 📋 履歴取得
   */
  getGenerationHistory(): GeneratedImage[] {
    return [...this.generationHistory];
  }

  /**
   * 🔍 履歴検索
   */
  searchHistory(query: string): GeneratedImage[] {
    const lowercaseQuery = query.toLowerCase();
    return this.generationHistory.filter(image =>
      image.prompt.toLowerCase().includes(lowercaseQuery) ||
      image.style.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * 🗑️ 履歴クリア
   */
  clearHistory(): void {
    this.generationHistory = [];
    localStorage.removeItem('ai_image_generation_history');
  }

  /**
   * 💰 コスト計算
   */
  calculateEstimatedCost(request: ImageGenerationRequest, model: string = 'imagen-3'): number {
    const modelSettings = GENERATION_SETTINGS.models[model as keyof typeof GENERATION_SETTINGS.models];
    if (!modelSettings) return 0;

    const quality = request.quality || 'standard';
    const qualityMultiplier = {
      draft: 0.5,
      standard: 1.0,
      high: 2.0
    }[quality];

    return modelSettings.costPerImage * qualityMultiplier;
  }

  /**
   * ⚙️ API設定更新
   */
  updateApiSettings(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('google_ai_api_key', apiKey);
  }

  /**
   * ✅ API接続テスト
   */
  async testApiConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/test-image-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      const result = await response.json();

      return {
        success: response.ok,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }
}

export default AIImageGenerationService;
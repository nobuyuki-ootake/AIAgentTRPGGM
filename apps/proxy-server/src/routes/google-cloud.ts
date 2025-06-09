// @ts-nocheck
// Google Cloud API
import express from 'express';
import GoogleCloudService, { ImageGenerationRequest } from '../services/google-cloud.service.js';
import { authenticateToken, requireGMOrAdmin } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const googleCloudService = new GoogleCloudService();

// レート制限設定
const imageGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 20, // 最大20枚/時間
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Image generation rate limit exceeded. Please try again later.'
  }
});

const textGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 50, // 最大50回/15分
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Text generation rate limit exceeded. Please try again later.'
  }
});

// 画像生成
router.post('/generate-image', authenticateToken, imageGenerationLimiter, async (req, res) => {
  try {
    const request: ImageGenerationRequest = req.body;

    // 基本的なバリデーション
    if (!request.prompt || request.prompt.length < 3) {
      return res.status(400).json({
        error: 'Prompt must be at least 3 characters long'
      });
    }

    if (request.prompt.length > 1000) {
      return res.status(400).json({
        error: 'Prompt must be less than 1000 characters'
      });
    }

    // 不適切なコンテンツのフィルタリング（基本的な例）
    const inappropriateTerms = ['nsfw', 'explicit', 'adult', 'nude', 'sexual'];
    const lowercasePrompt = request.prompt.toLowerCase();
    const hasInappropriateContent = inappropriateTerms.some(term => 
      lowercasePrompt.includes(term)
    );

    if (hasInappropriateContent) {
      return res.status(400).json({
        error: 'Inappropriate content detected in prompt'
      });
    }

    // 画像生成実行
    const result = await googleCloudService.generateImage(request);

    res.json({
      success: true,
      image: result,
      cost: result.cost,
      message: 'Image generated successfully'
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    
    if (error.message.includes('not configured')) {
      return res.status(503).json({
        error: 'Image generation service temporarily unavailable'
      });
    }

    if (error.message.includes('quota') || error.message.includes('limit')) {
      return res.status(429).json({
        error: 'Service quota exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Failed to generate image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// バッチ画像生成（GM・管理者のみ）
router.post('/generate-images-batch', authenticateToken, requireGMOrAdmin, async (req, res) => {
  try {
    const { requests }: { requests: ImageGenerationRequest[] } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: 'Requests array is required'
      });
    }

    if (requests.length > 5) {
      return res.status(400).json({
        error: 'Maximum 5 images per batch request'
      });
    }

    // 各リクエストのバリデーション
    for (const request of requests) {
      if (!request.prompt || request.prompt.length < 3) {
        return res.status(400).json({
          error: 'All prompts must be at least 3 characters long'
        });
      }
    }

    // バッチ生成実行
    const results = await googleCloudService.generateImages(requests);
    const totalCost = results.reduce((sum, result) => sum + result.cost, 0);

    res.json({
      success: true,
      images: results,
      totalCost,
      count: results.length,
      message: `${results.length} images generated successfully`
    });
  } catch (error: any) {
    console.error('Batch image generation error:', error);
    res.status(500).json({
      error: 'Failed to generate images',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// テキスト生成
router.post('/generate-text', authenticateToken, textGenerationLimiter, async (req, res) => {
  try {
    const { prompt, maxTokens, temperature, topP } = req.body;

    if (!prompt || prompt.length < 3) {
      return res.status(400).json({
        error: 'Prompt must be at least 3 characters long'
      });
    }

    if (prompt.length > 8000) {
      return res.status(400).json({
        error: 'Prompt must be less than 8000 characters'
      });
    }

    const options = {
      maxTokens: maxTokens ? Math.min(maxTokens, 2000) : 1000,
      temperature: temperature !== undefined ? Math.max(0, Math.min(temperature, 1)) : 0.7,
      topP: topP !== undefined ? Math.max(0.1, Math.min(topP, 1)) : 0.8
    };

    const result = await googleCloudService.generateText(prompt, options);

    // 簡易的なコスト計算
    const inputTokens = Math.ceil(prompt.length / 4); // 概算
    const outputTokens = Math.ceil(result.length / 4); // 概算
    const cost = googleCloudService.calculateTextGenerationCost(inputTokens, outputTokens);

    res.json({
      success: true,
      text: result,
      cost,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      message: 'Text generated successfully'
    });
  } catch (error: any) {
    console.error('Text generation error:', error);
    
    if (error.message.includes('not configured')) {
      return res.status(503).json({
        error: 'Text generation service temporarily unavailable'
      });
    }

    res.status(500).json({
      error: 'Failed to generate text',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ファイルアップロード
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { fileName, contentType, fileData, isPublic = true } = req.body;

    if (!fileName || !contentType || !fileData) {
      return res.status(400).json({
        error: 'fileName, contentType, and fileData are required'
      });
    }

    // Base64データをBufferに変換
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    // ファイルサイズ制限（10MB）
    if (fileBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File size must be less than 10MB'
      });
    }

    const userId = req.user!.userId;
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fullFileName = `uploads/${userId}/${timestamp}_${safeName}`;

    const fileUrl = await googleCloudService.uploadToStorage(
      fileBuffer,
      fullFileName,
      contentType,
      isPublic
    );

    res.json({
      success: true,
      fileUrl,
      fileName: fullFileName,
      size: fileBuffer.length,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ファイル削除
router.delete('/files/:fileName', authenticateToken, async (req, res) => {
  try {
    const { fileName } = req.params;
    const userId = req.user!.userId;

    // セキュリティ: ユーザーは自分のファイルのみ削除可能
    if (!fileName.startsWith(`uploads/${userId}/`) && req.user!.role !== 'admin') {
      return res.status(403).json({
        error: 'You can only delete your own files'
      });
    }

    await googleCloudService.deleteFromStorage(fileName);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error: any) {
    console.error('File delete error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ファイル一覧取得
router.get('/files', authenticateToken, async (req, res) => {
  try {
    const { prefix, limit = 50 } = req.query;
    const userId = req.user!.userId;

    // セキュリティ: ユーザーは自分のファイルのみ閲覧可能（管理者は除く）
    let searchPrefix = prefix as string || '';
    if (req.user!.role !== 'admin') {
      searchPrefix = `uploads/${userId}/`;
    }

    const files = await googleCloudService.listFiles(
      searchPrefix,
      Math.min(parseInt(limit as string), 100)
    );

    res.json({
      success: true,
      files,
      count: files.length,
      prefix: searchPrefix
    });
  } catch (error: any) {
    console.error('List files error:', error);
    res.status(500).json({
      error: 'Failed to list files',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Google Cloud設定状態確認
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await googleCloudService.getAuthStatus();

    // セキュリティ上の理由で一部情報を制限
    res.json({
      success: true,
      status: {
        configured: status.authenticated,
        storageAvailable: status.storageAccess,
        aiServicesAvailable: status.vertexAIAccess,
        location: status.location
      },
      message: 'Google Cloud status retrieved successfully'
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to check status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// コスト見積もり
router.post('/estimate-cost', authenticateToken, async (req, res) => {
  try {
    const { imageCount = 0, textPrompts = [] } = req.body;

    let totalCost = 0;

    // 画像生成コスト
    if (imageCount > 0) {
      totalCost += googleCloudService.calculateImageGenerationCost(imageCount);
    }

    // テキスト生成コスト
    if (Array.isArray(textPrompts) && textPrompts.length > 0) {
      for (const prompt of textPrompts) {
        const inputTokens = Math.ceil((prompt.length || 0) / 4);
        const outputTokens = 1000; // 仮定値
        totalCost += googleCloudService.calculateTextGenerationCost(inputTokens, outputTokens);
      }
    }

    res.json({
      success: true,
      estimate: {
        imageGenerationCost: imageCount > 0 ? googleCloudService.calculateImageGenerationCost(imageCount) : 0,
        textGenerationCost: totalCost - (imageCount > 0 ? googleCloudService.calculateImageGenerationCost(imageCount) : 0),
        totalCost,
        currency: 'USD'
      },
      breakdown: {
        images: imageCount,
        textPrompts: textPrompts.length,
        estimatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Cost estimation error:', error);
    res.status(500).json({
      error: 'Failed to estimate cost',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
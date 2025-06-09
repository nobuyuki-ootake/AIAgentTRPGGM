// @ts-nocheck
// 画像アップロード・管理API
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const router = express.Router();

// アップロード設定
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB制限
  },
  fileFilter: (req, file, cb) => {
    // 画像ファイルのみ許可
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

// アップロードディレクトリの確保
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');
const OPTIMIZED_DIR = path.join(UPLOAD_DIR, 'optimized');

async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
    await fs.mkdir(OPTIMIZED_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
}

// 初期化時にディレクトリを作成
ensureDirectories();

// 画像最適化処理
async function optimizeImage(buffer: Buffer, quality: number = 80): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(1024, 1024, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality })
      .toBuffer();
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
}

// サムネイル生成
async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(200, 200, { 
        fit: 'cover',
        position: 'center' 
      })
      .jpeg({ quality: 70 })
      .toBuffer();
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
}

// 単一画像アップロード
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { category = 'general', description = '' } = req.body;
    const imageId = uuidv4();
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${imageId}${fileExtension}`;
    const optimizedFilename = `${imageId}_optimized.jpg`;
    const thumbnailFilename = `${imageId}_thumb.jpg`;

    // 元画像を一時保存
    const tempPath = path.join(TEMP_DIR, filename);
    await fs.writeFile(tempPath, req.file.buffer);

    // 画像最適化
    const optimizedBuffer = await optimizeImage(req.file.buffer);
    const optimizedPath = path.join(OPTIMIZED_DIR, optimizedFilename);
    await fs.writeFile(optimizedPath, optimizedBuffer);

    // サムネイル生成
    const thumbnailBuffer = await generateThumbnail(req.file.buffer);
    const thumbnailPath = path.join(OPTIMIZED_DIR, thumbnailFilename);
    await fs.writeFile(thumbnailPath, thumbnailBuffer);

    // 画像情報をDBに保存（簡易実装）
    // TODO: 実際のDBテーブルに保存する実装に変更
    const imageRecord = {
      id: imageId,
      originalName: req.file.originalname,
      filename: optimizedFilename,
      thumbnailFilename,
      category,
      description,
      size: optimizedBuffer.length,
      mimeType: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      url: `/api/images/${optimizedFilename}`,
      thumbnailUrl: `/api/images/${thumbnailFilename}`
    };

    // 一時ファイルを削除
    try {
      await fs.unlink(tempPath);
    } catch (error) {
      console.warn('Failed to delete temp file:', error);
    }

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: imageRecord
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 複数画像アップロード
router.post('/upload-multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const { category = 'general' } = req.body;
    const uploadedImages = [];

    for (const file of req.files) {
      const imageId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const optimizedFilename = `${imageId}_optimized.jpg`;
      const thumbnailFilename = `${imageId}_thumb.jpg`;

      try {
        // 画像最適化
        const optimizedBuffer = await optimizeImage(file.buffer);
        const optimizedPath = path.join(OPTIMIZED_DIR, optimizedFilename);
        await fs.writeFile(optimizedPath, optimizedBuffer);

        // サムネイル生成
        const thumbnailBuffer = await generateThumbnail(file.buffer);
        const thumbnailPath = path.join(OPTIMIZED_DIR, thumbnailFilename);
        await fs.writeFile(thumbnailPath, thumbnailBuffer);

        const imageRecord = {
          id: imageId,
          originalName: file.originalname,
          filename: optimizedFilename,
          thumbnailFilename,
          category,
          size: optimizedBuffer.length,
          mimeType: 'image/jpeg',
          uploadedAt: new Date().toISOString(),
          url: `/api/images/${optimizedFilename}`,
          thumbnailUrl: `/api/images/${thumbnailFilename}`
        };

        uploadedImages.push(imageRecord);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        // 個別ファイルのエラーは記録するが、処理を継続
      }
    }

    res.status(201).json({
      message: `${uploadedImages.length} images uploaded successfully`,
      images: uploadedImages
    });
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 画像配信エンドポイント
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // ファイル名の安全性チェック
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(OPTIMIZED_DIR, filename);
    
    try {
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        // 適切なContent-Typeを設定
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        
        switch (ext) {
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.webp':
            contentType = 'image/webp';
            break;
          case '.gif':
            contentType = 'image/gif';
            break;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年間キャッシュ
        
        const fileBuffer = await fs.readFile(filePath);
        res.send(fileBuffer);
      } else {
        res.status(404).json({ error: 'Image not found' });
      }
    } catch (error) {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 画像削除
router.delete('/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    // TODO: データベースから画像情報を取得
    // 現在は簡易実装として、ファイル名ベースで削除
    const optimizedFile = path.join(OPTIMIZED_DIR, `${imageId}_optimized.jpg`);
    const thumbnailFile = path.join(OPTIMIZED_DIR, `${imageId}_thumb.jpg`);

    const deletePromises = [
      fs.unlink(optimizedFile).catch(() => {}), // エラーを無視
      fs.unlink(thumbnailFile).catch(() => {}) // エラーを無視
    ];

    await Promise.all(deletePromises);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 画像一覧取得（カテゴリ別）
router.get('/', async (req, res) => {
  try {
    const { category, limit = 50, offset = 0 } = req.query;
    
    // TODO: データベースから画像一覧を取得
    // 現在は簡易実装として、ディレクトリから取得
    const files = await fs.readdir(OPTIMIZED_DIR);
    const imageFiles = files.filter(file => 
      file.includes('_optimized.') && 
      !file.includes('_thumb.')
    );

    const images = imageFiles.slice(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string)
    ).map(filename => {
      const imageId = filename.split('_optimized.')[0];
      return {
        id: imageId,
        filename,
        thumbnailFilename: `${imageId}_thumb.jpg`,
        url: `/api/images/${filename}`,
        thumbnailUrl: `/api/images/${imageId}_thumb.jpg`,
        category: category || 'general'
      };
    });

    res.json({
      images,
      total: imageFiles.length,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 画像メタデータ更新
router.patch('/:imageId/metadata', async (req, res) => {
  try {
    const { imageId } = req.params;
    const { description, category, tags } = req.body;

    // TODO: データベースでメタデータを更新
    // 現在は簡易実装

    res.json({ 
      message: 'Image metadata updated successfully',
      imageId,
      updates: { description, category, tags }
    });
  } catch (error) {
    console.error('Error updating image metadata:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// エラーハンドリングミドルウェア
router.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
    }
  }
  
  if (error.message === 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.') {
    return res.status(400).json({ error: error.message });
  }

  console.error('Upload error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

export default router;
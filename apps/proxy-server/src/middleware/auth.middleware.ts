// @ts-nocheck
// JWT認証ミドルウェア
import { Request, Response, NextFunction } from 'express';
import AuthService from '../auth/auth.service.js';

// リクエストオブジェクトに認証済みユーザー情報を追加
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: 'player' | 'gamemaster' | 'admin';
      };
    }
  }
}

const authService = new AuthService();

// JWT認証ミドルウェア
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // トークン検証
    const decoded = authService.verifyToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// オプショナル認証ミドルウェア（認証なしでもアクセス可能だが、認証済みの場合はユーザー情報を取得）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = authService.verifyToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      } catch (error) {
        // トークンが無効でも処理を続行
        console.warn('Optional auth token verification failed:', error);
      }
    }

    next();
  } catch (error) {
    // エラーが発生しても処理を続行
    next();
  }
};

// ロール認証ミドルウェア
export const requireRole = (requiredRoles: Array<'player' | 'gamemaster' | 'admin'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: requiredRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// GMまたは管理者のみアクセス可能
export const requireGMOrAdmin = requireRole(['gamemaster', 'admin']);

// 管理者のみアクセス可能
export const requireAdmin = requireRole(['admin']);

// キャンペーンのGMまたは管理者のみアクセス可能
export const requireCampaignGM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 管理者は全てのキャンペーンにアクセス可能
    if (req.user.role === 'admin') {
      return next();
    }

    const campaignId = req.params.campaignId || req.query.campaignId || req.body.campaignId;
    
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID required' });
    }

    // TODO: キャンペーンのGM確認ロジックを実装
    // 現在は簡易実装として、ゲームマスターロールのユーザーは全てアクセス可能
    if (req.user.role === 'gamemaster') {
      return next();
    }

    return res.status(403).json({ 
      error: 'Only campaign GM or admin can access this resource' 
    });
  } catch (error) {
    console.error('Campaign GM check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 開発者モード認証（環境変数で制御）
export const requireDeveloperMode = (req: Request, res: Response, next: NextFunction) => {
  const isDeveloperMode = process.env.DEVELOPER_MODE === 'true';
  
  if (!isDeveloperMode) {
    return res.status(404).json({ error: 'Not found' });
  }

  next();
};

// APIキー認証（既存のAPIエンドポイント用）
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Valid API key required' });
  }
  
  next();
};

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireGMOrAdmin,
  requireAdmin,
  requireCampaignGM,
  requireDeveloperMode,
  authenticateApiKey
};
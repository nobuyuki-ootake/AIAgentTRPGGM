// 認証関連API
import express from 'express';
import AuthService, { LoginCredentials, RegisterData } from '../auth/auth.service.js';
import { authenticateToken, requireDeveloperMode } from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const authService = new AuthService();

// レート制限設定
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回のログイン試行
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts, please try again later'
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 3, // 最大3回の登録試行
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many registration attempts, please try again later'
  }
});

// ユーザー登録
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const userData: RegisterData = req.body;

    // 基本的なバリデーション
    if (!userData.name || !userData.email || !userData.password) {
      return res.status(400).json({
        error: 'Missing required fields: name, email, password'
      });
    }

    // メールアドレス形式の簡易チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // パスワード強度チェック
    if (userData.password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    // ロールのバリデーション
    if (userData.role && !['player', 'gamemaster'].includes(userData.role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be "player" or "gamemaster"'
      });
    }

    const result = await authService.register(userData);

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      tokens: result.tokens
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ユーザーログイン
router.post('/login', authLimiter, async (req, res) => {
  try {
    const credentials: LoginCredentials = req.body;

    if (!credentials.email || !credentials.password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const result = await authService.login(credentials);

    res.json({
      message: 'Login successful',
      user: result.user,
      tokens: result.tokens
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.message.includes('Invalid email or password') || 
        error.message.includes('Account is deactivated')) {
      return res.status(401).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Login failed' });
  }
});

// トークンリフレッシュ
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const newTokens = await authService.refreshTokens(refreshToken);

    res.json({
      message: 'Tokens refreshed successfully',
      tokens: newTokens
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// ログアウト
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    await authService.logout(refreshToken);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// 全デバイスからログアウト
router.post('/logout-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await authService.logoutAll(userId);

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Logout from all devices failed' });
  }
});

// 現在のユーザー情報取得
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const user = await authService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// パスワード変更
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    // 新しいパスワードの強度チェック
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long'
      });
    }

    // 現在のパスワードと同じかチェック
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: 'New password must be different from current password'
      });
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({ 
      message: 'Password changed successfully. Please login again with your new password.' 
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Password change failed' });
  }
});

// アカウント無効化
router.post('/deactivate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await authService.deactivateAccount(userId);

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Account deactivation error:', error);
    res.status(500).json({ error: 'Account deactivation failed' });
  }
});

// トークン検証エンドポイント（フロントエンド用）
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decoded = authService.verifyToken(token);
    
    // ユーザー情報を取得してアカウントの有効性も確認
    const user = await authService.getUserById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

// 期限切れトークンクリーンアップ（開発者モード限定）
router.post('/cleanup-tokens', requireDeveloperMode, async (req, res) => {
  try {
    authService.cleanupExpiredTokens();
    res.json({ message: 'Expired tokens cleaned up successfully' });
  } catch (error) {
    console.error('Token cleanup error:', error);
    res.status(500).json({ error: 'Token cleanup failed' });
  }
});

// 認証状態確認エンドポイント
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.json({ authenticated: false });
    }

    try {
      const decoded = authService.verifyToken(token);
      const user = await authService.getUserById(decoded.userId);

      if (!user || !user.is_active) {
        return res.json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth status check error:', error);
    res.json({ authenticated: false });
  }
});

export default router;
// @ts-nocheck
// JWT認証サービス
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import DatabaseConnection from '../db/connection.js';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'player' | 'gamemaster' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'player' | 'gamemaster';
}

export class AuthService {
  private db: DatabaseConnection;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private jwtExpiresIn: string;
  private jwtRefreshExpiresIn: string;

  constructor() {
    this.db = DatabaseConnection.getInstance();
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (!process.env.JWT_SECRET) {
      console.warn('Warning: JWT_SECRET not set in environment variables');
    }
  }

  // パスワードハッシュ化
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // パスワード検証
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // JWTトークン生成
  private generateTokens(userId: string, email: string, role: string): AuthTokens {
    const payload = { userId, email, role };
    
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'trpg-gm-assistant',
      audience: 'trpg-users'
    });

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.jwtRefreshSecret,
      {
        expiresIn: this.jwtRefreshExpiresIn,
        issuer: 'trpg-gm-assistant',
        audience: 'trpg-users'
      }
    );

    // 15分をミリ秒で表現
    const expiresIn = 15 * 60 * 1000;

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  // JWTトークン検証
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'trpg-gm-assistant',
        audience: 'trpg-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // リフレッシュトークン検証
  public verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'trpg-gm-assistant',
        audience: 'trpg-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // ユーザー登録
  public async register(userData: RegisterData): Promise<{ user: Partial<User>; tokens: AuthTokens }> {
    const database = this.db.getDatabase();
    
    // メールアドレスの重複チェック
    const existingUser = database.prepare('SELECT id FROM users WHERE email = ?').get(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // パスワードハッシュ化
    const passwordHash = await this.hashPassword(userData.password);
    const userId = uuidv4();

    return this.db.transaction(() => {
      // ユーザー作成
      const insertStmt = database.prepare(`
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertStmt.run(
        userId,
        userData.name,
        userData.email,
        passwordHash,
        userData.role || 'player'
      );

      // トークン生成
      const tokens = this.generateTokens(userId, userData.email, userData.role || 'player');

      // リフレッシュトークンをDBに保存
      this.storeRefreshToken(userId, tokens.refreshToken);

      // パスワードハッシュを除いてユーザー情報を返す
      const user = {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'player'
      };

      return { user, tokens };
    });
  }

  // ユーザーログイン
  public async login(credentials: LoginCredentials): Promise<{ user: Partial<User>; tokens: AuthTokens }> {
    const database = this.db.getDatabase();
    
    // ユーザー検索
    const user = database.prepare(`
      SELECT id, name, email, password_hash, role, is_active 
      FROM users 
      WHERE email = ?
    `).get(credentials.email) as User | undefined;

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // パスワード検証
    const passwordValid = await this.verifyPassword(credentials.password, user.password_hash);
    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    // トークン生成
    const tokens = this.generateTokens(user.id, user.email, user.role);

    // リフレッシュトークンをDBに保存
    this.storeRefreshToken(user.id, tokens.refreshToken);

    // パスワードハッシュを除いてユーザー情報を返す
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return { user: userResponse, tokens };
  }

  // トークンリフレッシュ
  public async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshToken);
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid refresh token type');
    }

    const database = this.db.getDatabase();
    
    // リフレッシュトークンがDBに存在するかチェック
    const storedToken = database.prepare(`
      SELECT user_id FROM refresh_tokens 
      WHERE token = ? AND expires_at > datetime('now') AND is_revoked = 0
    `).get(refreshToken);

    if (!storedToken || storedToken.user_id !== payload.userId) {
      throw new Error('Invalid refresh token');
    }

    // ユーザー情報を取得
    const user = database.prepare(`
      SELECT id, email, role FROM users WHERE id = ? AND is_active = 1
    `).get(payload.userId) as Pick<User, 'id' | 'email' | 'role'> | undefined;

    if (!user) {
      throw new Error('User not found or inactive');
    }

    // 新しいトークンを生成
    const newTokens = this.generateTokens(user.id, user.email, user.role);

    // 古いリフレッシュトークンを無効化
    database.prepare(`
      UPDATE refresh_tokens SET is_revoked = 1 WHERE token = ?
    `).run(refreshToken);

    // 新しいリフレッシュトークンを保存
    this.storeRefreshToken(user.id, newTokens.refreshToken);

    return newTokens;
  }

  // リフレッシュトークンをDBに保存
  private storeRefreshToken(userId: string, refreshToken: string): void {
    const database = this.db.getDatabase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日後

    database.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), userId, refreshToken, expiresAt.toISOString());
  }

  // ログアウト（リフレッシュトークンを無効化）
  public async logout(refreshToken: string): Promise<void> {
    const database = this.db.getDatabase();
    
    database.prepare(`
      UPDATE refresh_tokens SET is_revoked = 1 WHERE token = ?
    `).run(refreshToken);
  }

  // 全デバイスからログアウト（ユーザーの全リフレッシュトークンを無効化）
  public async logoutAll(userId: string): Promise<void> {
    const database = this.db.getDatabase();
    
    database.prepare(`
      UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?
    `).run(userId);
  }

  // ユーザー情報取得
  public async getUserById(userId: string): Promise<Partial<User> | null> {
    const database = this.db.getDatabase();
    
    const user = database.prepare(`
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users WHERE id = ?
    `).get(userId) as Omit<User, 'password_hash'> | undefined;

    return user || null;
  }

  // パスワード変更
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const database = this.db.getDatabase();
    
    // 現在のパスワードハッシュを取得
    const user = database.prepare(`
      SELECT password_hash FROM users WHERE id = ? AND is_active = 1
    `).get(userId) as Pick<User, 'password_hash'> | undefined;

    if (!user) {
      throw new Error('User not found');
    }

    // 現在のパスワード検証
    const passwordValid = await this.verifyPassword(currentPassword, user.password_hash);
    if (!passwordValid) {
      throw new Error('Current password is incorrect');
    }

    // 新しいパスワードハッシュ化
    const newPasswordHash = await this.hashPassword(newPassword);

    // パスワード更新
    database.prepare(`
      UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newPasswordHash, userId);

    // セキュリティのため、全デバイスからログアウト
    await this.logoutAll(userId);
  }

  // アカウント無効化
  public async deactivateAccount(userId: string): Promise<void> {
    const database = this.db.getDatabase();
    
    database.prepare(`
      UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(userId);

    // 全リフレッシュトークンを無効化
    await this.logoutAll(userId);
  }

  // 期限切れのリフレッシュトークンをクリーンアップ
  public cleanupExpiredTokens(): void {
    const database = this.db.getDatabase();
    
    database.prepare(`
      DELETE FROM refresh_tokens 
      WHERE expires_at < datetime('now') OR is_revoked = 1
    `).run();
  }
}

export default AuthService;

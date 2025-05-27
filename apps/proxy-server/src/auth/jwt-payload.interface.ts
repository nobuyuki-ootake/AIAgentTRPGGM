/**
 * JWTトークンのペイロード定義
 */
export interface JwtPayload {
  /**
   * ユーザーID (subject)
   */
  sub: string;

  /**
   * ユーザー名
   */
  username: string;

  /**
   * 発行時刻（自動設定）
   */
  iat?: number;

  /**
   * 有効期限（自動設定）
   */
  exp?: number;
}

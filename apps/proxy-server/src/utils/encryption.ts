import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private configService: ConfigService) {
    const keyString = this.configService.get<string>('ENCRYPTION_KEY');
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY環境変数が設定されていません');
    }
    this.encryptionKey = Buffer.from(keyString, 'hex');
  }

  /**
   * 文字列を暗号化します
   * @param text 暗号化する文字列
   * @returns 暗号化されたデータとnonce
   */
  encrypt(text: string): { encryptedData: Buffer; nonce: Buffer } {
    const nonce = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, nonce);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();
    return {
      encryptedData: Buffer.concat([encrypted, authTag]),
      nonce,
    };
  }

  /**
   * 暗号化されたデータを復号化します
   * @param encryptedData 暗号化されたデータ
   * @param nonce 暗号化に使用されたnonce
   * @returns 復号化された文字列
   */
  decrypt(encryptedData: Buffer, nonce: Buffer): string {
    const authTagLength = 16;
    const authTag = encryptedData.slice(encryptedData.length - authTagLength);
    const encryptedContent = encryptedData.slice(
      0,
      encryptedData.length - authTagLength,
    );

    const decipher = createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      nonce,
    );
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encryptedContent),
      decipher.final(),
    ]).toString('utf8');
  }
}

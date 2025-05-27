import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { User } from '../users/entities/user.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { EncryptionService } from '../utils/encryption';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * 新しいAPIキーを作成
   */
  async create(createApiKeyDto: CreateApiKeyDto, user: User): Promise<ApiKey> {
    // 既存のAPIキーを確認
    const existingKey = await this.apiKeyRepository.findOne({
      where: { userId: user.id, provider: createApiKeyDto.provider },
    });

    // 既存のキーがある場合は上書き
    if (existingKey) {
      return this.updateApiKey(existingKey, createApiKeyDto.apiKey);
    }

    // 新しいAPIキーを暗号化
    const { encryptedData, nonce } = this.encryptionService.encrypt(
      createApiKeyDto.apiKey,
    );

    // 新しいAPIキーを作成
    const apiKey = this.apiKeyRepository.create({
      userId: user.id,
      provider: createApiKeyDto.provider,
      apiKeyEncrypted: encryptedData,
      nonce,
      isActive: true,
    });

    return this.apiKeyRepository.save(apiKey);
  }

  /**
   * ユーザーIDに基づいて全てのAPIキーを取得
   */
  async findAllByUser(userId: number): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId },
    });
  }

  /**
   * 特定のAPIキーを取得
   */
  async findOne(id: number, userId: number): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException(`APIキーが見つかりません`);
    }

    // 他のユーザーのAPIキーへのアクセスを防止
    if (apiKey.userId !== userId) {
      throw new ForbiddenException('このAPIキーへのアクセス権がありません');
    }

    return apiKey;
  }

  /**
   * APIキーを削除
   */
  async remove(id: number, userId: number): Promise<void> {
    const apiKey = await this.findOne(id, userId);
    await this.apiKeyRepository.remove(apiKey);
  }

  /**
   * APIキーを更新
   */
  private async updateApiKey(
    apiKey: ApiKey,
    newApiKeyValue: string,
  ): Promise<ApiKey> {
    // 新しいAPIキーを暗号化
    const { encryptedData, nonce } =
      this.encryptionService.encrypt(newApiKeyValue);

    // 既存のAPIキーを更新
    apiKey.apiKeyEncrypted = encryptedData;
    apiKey.nonce = nonce;

    return this.apiKeyRepository.save(apiKey);
  }

  /**
   * プロバイダーとユーザーIDからAPIキーを取得し、復号化する
   */
  async getDecryptedApiKey(
    provider: string,
    userId: number,
  ): Promise<string | null> {
    try {
      const apiKey = await this.apiKeyRepository.findOne({
        where: { provider, userId, isActive: true },
      });

      if (!apiKey) {
        return null;
      }

      // 保存されているAPIキーを復号化
      return this.encryptionService.decrypt(
        apiKey.apiKeyEncrypted,
        apiKey.nonce,
      );
    } catch (error) {
      return null;
    }
  }
}

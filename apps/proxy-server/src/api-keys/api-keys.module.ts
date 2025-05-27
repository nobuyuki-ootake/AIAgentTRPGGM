import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { UsersModule } from '../users/users.module';
import { EncryptionService } from '../utils/encryption';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey]), UsersModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, EncryptionService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}

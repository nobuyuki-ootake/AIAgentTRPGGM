import { Module } from '@nestjs/common';
import { AiProxyController } from './ai-proxy.controller';
import { AiProxyService } from './ai-proxy.service';
// import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  // imports: [ApiKeysModule],
  controllers: [AiProxyController],
  providers: [AiProxyService],
})
export class AiProxyModule {}

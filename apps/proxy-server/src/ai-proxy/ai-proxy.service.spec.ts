import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AiProxyService } from './ai-proxy.service';

describe('AiProxyService', () => {
  let service: AiProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiProxyService],
    }).compile();

    service = module.get<AiProxyService>(AiProxyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

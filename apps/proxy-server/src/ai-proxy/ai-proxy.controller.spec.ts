import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { AiProxyController } from './ai-proxy.controller';

describe('AiProxyController', () => {
  let controller: AiProxyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiProxyController],
    }).compile();

    controller = module.get<AiProxyController>(AiProxyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

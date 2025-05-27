import { Controller, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AiProxyService } from './ai-proxy.service';
import { Request, Response } from 'express';
import { ApiKeyGuard } from './api-key.guard';

@Controller('ai')
export class AiProxyController {
  constructor(private readonly aiProxyService: AiProxyService) {}

  @UseGuards(ApiKeyGuard)
  @Post('openai')
  async proxyOpenAI(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // TODO: レート制限・キャッシュ・OpenAI連携
    return this.aiProxyService.proxyOpenAI(body, req, res);
  }

  @UseGuards(ApiKeyGuard)
  @Post('claude')
  async proxyClaude(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // TODO: レート制限・キャッシュ・Claude連携
    return this.aiProxyService.proxyClaude(body, req, res);
  }

  @UseGuards(ApiKeyGuard)
  @Post('gemini')
  async proxyGemini(
    @Body() body: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // TODO: レート制限・キャッシュ・Gemini連携
    return this.aiProxyService.proxyGemini(body, req, res);
  }
}

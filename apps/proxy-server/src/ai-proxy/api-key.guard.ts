import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY;
    if (!apiKey || apiKey !== validKey) {
      throw new UnauthorizedException('APIキーが不正です');
    }
    return true;
  }
}

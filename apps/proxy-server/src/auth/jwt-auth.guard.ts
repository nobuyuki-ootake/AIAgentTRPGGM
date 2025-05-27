import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  handleRequest(err: any, user: any, info: any) {
    // エラーがあるか、ユーザーが存在しない場合は認証エラー
    if (err || !user) {
      throw err || new UnauthorizedException('認証が必要です');
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    // カスタム認証ロジックをここに追加できます
    return super.canActivate(context);
  }
}

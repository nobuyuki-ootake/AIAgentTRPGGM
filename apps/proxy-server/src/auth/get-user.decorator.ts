import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

/**
 * リクエストからユーザー情報を取得するカスタムデコレータ
 * JWTで認証されたユーザー情報をコントローラのパラメータとして取得できます
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

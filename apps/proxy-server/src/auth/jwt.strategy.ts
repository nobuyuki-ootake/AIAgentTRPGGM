import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'defaultSecret',
    });
  }

  /**
   * JWT検証後にペイロードからユーザーを取得する
   */
  async validate(payload: JwtPayload) {
    const { sub } = payload;
    const userId = parseInt(sub, 10);

    try {
      // ユーザーIDからユーザー情報を取得
      const user = await this.usersService.findOne(userId);
      return user;
    } catch (error) {
      throw new UnauthorizedException('無効なトークンです');
    }
  }
}

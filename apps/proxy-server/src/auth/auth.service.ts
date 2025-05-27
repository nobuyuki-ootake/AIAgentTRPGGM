import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthCredentialsDto } from '../users/dto/auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * ユーザー認証を行い、JWTトークンを発行します
   */
  async login(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const { username, password } = authCredentialsDto;

    // ユーザー名とパスワードの検証
    const user = await this.usersService.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException(
        'ユーザー名またはパスワードが正しくありません',
      );
    }

    // JWTペイロードの作成
    const payload: JwtPayload = {
      sub: user.id.toString(),
      username: user.username,
    };

    // JWTトークンの発行
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AuthCredentialsDto {
  @ApiProperty({
    description: 'ユーザー名またはメールアドレス',
    example: 'johndoe',
  })
  @IsNotEmpty({ message: 'ユーザー名またはメールアドレスは必須です' })
  @IsString({
    message: 'ユーザー名またはメールアドレスは文字列である必要があります',
  })
  username: string;

  @ApiProperty({
    description: 'パスワード',
    example: 'Password123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'パスワードは必須です' })
  @IsString({ message: 'パスワードは文字列である必要があります' })
  @MinLength(8, { message: 'パスワードは8文字以上である必要があります' })
  password: string;
}

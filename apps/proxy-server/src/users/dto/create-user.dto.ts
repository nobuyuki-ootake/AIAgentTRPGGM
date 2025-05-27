import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'ユーザー名',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty({ message: 'ユーザー名は必須です' })
  @IsString({ message: 'ユーザー名は文字列である必要があります' })
  @MinLength(3, { message: 'ユーザー名は3文字以上である必要があります' })
  @MaxLength(50, { message: 'ユーザー名は50文字以下である必要があります' })
  username: string;

  @ApiProperty({
    description: 'メールアドレス',
    example: 'john.doe@example.com',
    maxLength: 100,
  })
  @IsNotEmpty({ message: 'メールアドレスは必須です' })
  @IsEmail({}, { message: '有効なメールアドレスを入力してください' })
  @MaxLength(100, {
    message: 'メールアドレスは100文字以下である必要があります',
  })
  email: string;

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

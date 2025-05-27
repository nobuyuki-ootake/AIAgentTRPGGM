import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'APIプロバイダー',
    example: 'openai',
    enum: ['openai', 'claude', 'gemini'],
  })
  @IsNotEmpty({ message: 'プロバイダーは必須です' })
  @IsString({ message: 'プロバイダーは文字列である必要があります' })
  @IsIn(['openai', 'claude', 'gemini'], {
    message:
      'プロバイダーは openai, claude, gemini のいずれかである必要があります',
  })
  provider: string;

  @ApiProperty({
    description: 'APIキー',
    example: 'sk-xxxxxxxxxxxxxxxxxxxxx',
  })
  @IsNotEmpty({ message: 'APIキーは必須です' })
  @IsString({ message: 'APIキーは文字列である必要があります' })
  apiKey: string;
}

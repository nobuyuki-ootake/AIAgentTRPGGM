import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiKey } from './entities/api-key.entity';

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'APIキーの追加' })
  @ApiResponse({
    status: 201,
    description: 'APIキーが正常に追加されました',
    type: ApiKey,
  })
  @ApiResponse({ status: 400, description: '無効なリクエスト' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  async create(
    @Body() createApiKeyDto: CreateApiKeyDto,
    @GetUser() user: User,
  ) {
    return this.apiKeysService.create(createApiKeyDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'ユーザーのAPIキー一覧を取得' })
  @ApiResponse({
    status: 200,
    description: 'APIキー一覧が正常に取得されました',
    type: [ApiKey],
  })
  @ApiResponse({ status: 401, description: '認証されていません' })
  async findAll(@GetUser() user: User) {
    return this.apiKeysService.findAllByUser(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'APIキーを削除' })
  @ApiResponse({ status: 204, description: 'APIキーが正常に削除されました' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 404, description: 'APIキーが見つかりません' })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return this.apiKeysService.remove(+id, user.id);
  }
}

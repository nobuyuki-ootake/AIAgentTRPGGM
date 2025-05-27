import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'ユーザー登録' })
  @ApiResponse({
    status: 201,
    description: 'ユーザーが正常に登録されました',
    type: User,
  })
  @ApiResponse({ status: 400, description: '無効なリクエスト' })
  @ApiResponse({
    status: 409,
    description: 'ユーザー名またはメールアドレスが既に使用されています',
  })
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ユーザープロフィール取得' })
  @ApiResponse({
    status: 200,
    description: 'ユーザープロフィールが正常に取得されました',
    type: User,
  })
  @ApiResponse({ status: 401, description: '認証されていません' })
  async getProfile(@GetUser() user: User): Promise<User> {
    return user;
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ユーザープロフィール更新' })
  @ApiResponse({
    status: 200,
    description: 'ユーザープロフィールが正常に更新されました',
    type: User,
  })
  @ApiResponse({ status: 400, description: '無効なリクエスト' })
  @ApiResponse({ status: 401, description: '認証されていません' })
  async updateProfile(
    @GetUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'ユーザーアカウント削除' })
  @ApiResponse({
    status: 204,
    description: 'ユーザーアカウントが正常に削除されました',
  })
  @ApiResponse({ status: 401, description: '認証されていません' })
  async deleteProfile(@GetUser() user: User): Promise<void> {
    return this.usersService.remove(user.id);
  }

  // 管理者向けAPIエンドポイント（将来的に管理者権限チェックを追加）
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '全ユーザー取得 (管理者用)' })
  @ApiResponse({
    status: 200,
    description: '全ユーザーが正常に取得されました',
    type: [User],
  })
  @ApiResponse({ status: 401, description: '認証されていません' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ユーザー取得 (管理者用)' })
  @ApiResponse({
    status: 200,
    description: 'ユーザーが正常に取得されました',
    type: User,
  })
  @ApiResponse({ status: 401, description: '認証されていません' })
  @ApiResponse({ status: 404, description: 'ユーザーが見つかりません' })
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(+id);
  }
}

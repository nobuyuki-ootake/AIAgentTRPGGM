import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // ユーザー名またはメールアドレスが既に存在するか確認
    const existingUser = await this.usersRepository.findOne({
      where: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      throw new ConflictException(
        'ユーザー名またはメールアドレスが既に使用されています',
      );
    }

    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    // 新しいユーザーを作成
    const user = this.usersRepository.create({
      username: createUserDto.username,
      email: createUserDto.email,
      passwordHash,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`ID: ${id}のユーザーは存在しません`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException(
        `ユーザー名: ${username}のユーザーは存在しません`,
      );
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(
        `メールアドレス: ${email}のユーザーは存在しません`,
      );
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // パスワードが含まれている場合はハッシュ化
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(updateUserDto.password, salt);
      updateUserDto.password = undefined;
      await this.usersRepository.update(id, { ...updateUserDto, passwordHash });
    } else {
      await this.usersRepository.update(id, updateUserDto);
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ID: ${id}のユーザーは存在しません`);
    }
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByUsername(username);
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (isPasswordValid) {
        return user;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

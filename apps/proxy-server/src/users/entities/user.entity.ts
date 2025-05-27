import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { ApiKey } from '../../api-keys/entities/api-key.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: 'ユーザーID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ユーザー名' })
  @Column({ length: 50, unique: true })
  username: string;

  @ApiProperty({ description: 'メールアドレス' })
  @Column({ length: 100, unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @ApiProperty({ description: 'ユーザーのAPIキー' })
  @OneToMany(() => ApiKey, (apiKey) => apiKey.user)
  apiKeys: ApiKey[];

  @ApiProperty({ description: '作成日時' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新日時' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

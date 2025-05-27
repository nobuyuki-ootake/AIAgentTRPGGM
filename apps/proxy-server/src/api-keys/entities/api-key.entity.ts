import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('api_keys')
export class ApiKey {
  @ApiProperty({ description: 'APIキーID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'ユーザーID' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({ description: 'APIプロバイダー（openai/claude/gemini）' })
  @Column({ length: 20 })
  provider: string;

  @Column({ name: 'api_key_encrypted', type: 'bytea' })
  apiKeyEncrypted: Buffer;

  @Column({ type: 'bytea' })
  nonce: Buffer;

  @ApiProperty({ description: 'アクティブ状態' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.apiKeys)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: '作成日時' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: '更新日時' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

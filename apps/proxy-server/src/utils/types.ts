import { User } from '../users/entities/user.entity';

// Expressのリクエスト型拡張
declare module 'express' {
  export interface Request {
    user?: User;
  }
}

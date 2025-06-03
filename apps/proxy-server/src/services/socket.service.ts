// Socket.IO サービス - リアルタイム通信管理
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import AuthService from '../auth/auth.service.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'player' | 'gamemaster' | 'admin';
  campaignId?: string;
}

interface SessionUser {
  userId: string;
  username: string;
  role: 'player' | 'gamemaster' | 'admin';
  characterId?: string;
}

interface GameSessionRoom {
  sessionId: string;
  campaignId: string;
  gamemaster: string;
  participants: Map<string, SessionUser>;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  mode: 'single' | 'multiplayer'; // セッションモード
  maxPlayers: number;
  isPrivate: boolean;
  inviteCode?: string;
  aiGMEnabled: boolean; // AIセッションマスター有効フラグ
  startTime?: Date;
  lastActivity: Date;
}

export class SocketService {
  private io: SocketIOServer;
  private authService: AuthService;
  private activeSessions: Map<string, GameSessionRoom> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  
  constructor(server: HTTPServer) {
    this.authService = new AuthService();
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Socket認証ミドルウェア
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = this.authService.verifyToken(token);
        const user = await this.authService.getUserById(decoded.userId);

        if (!user || !user.is_active) {
          return next(new Error('Invalid user or account deactivated'));
        }

        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected via socket ${socket.id}`);
      
      // ユーザーのソケット情報を記録
      if (socket.userId) {
        this.userSockets.set(socket.userId, socket.id);
      }

      // セッション作成
      socket.on('create_session', async (data: {
        campaignId: string;
        sessionName: string;
        mode: 'single' | 'multiplayer';
        isPrivate: boolean;
        maxPlayers?: number;
        inviteCode?: string;
        aiGMEnabled: boolean;
      }) => {
        try {
          const session = await this.handleCreateSession(socket, data);
          socket.emit('session_created', { success: true, session });
        } catch (error) {
          console.error('Create session error:', error);
          socket.emit('session_creation_failed', { error: (error as Error).message });
        }
      });

      // セッション参加
      socket.on('join_session', async (data: { sessionId: string; characterId?: string; inviteCode?: string }) => {
        try {
          await this.handleJoinSession(socket, data);
        } catch (error) {
          console.error('Join session error:', error);
          socket.emit('error', { message: 'Failed to join session' });
        }
      });

      // セッション離脱
      socket.on('leave_session', async (data: { sessionId: string }) => {
        try {
          await this.handleLeaveSession(socket, data.sessionId);
        } catch (error) {
          console.error('Leave session error:', error);
          socket.emit('error', { message: 'Failed to leave session' });
        }
      });

      // チャットメッセージ
      socket.on('chat_message', async (data: { 
        sessionId: string; 
        message: string; 
        messageType: 'ic' | 'ooc' | 'system' | 'whisper';
        targetUserId?: string; 
      }) => {
        try {
          await this.handleChatMessage(socket, data);
        } catch (error) {
          console.error('Chat message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // ダイスロール
      socket.on('dice_roll', async (data: {
        sessionId: string;
        diceExpression: string;
        description?: string;
        isSecret?: boolean;
      }) => {
        try {
          await this.handleDiceRoll(socket, data);
        } catch (error) {
          console.error('Dice roll error:', error);
          socket.emit('error', { message: 'Failed to roll dice' });
        }
      });

      // キャラクターステータス更新
      socket.on('character_status_update', async (data: {
        sessionId: string;
        characterId: string;
        statusUpdate: {
          hp?: { current: number; max?: number; temp?: number };
          conditions?: string[];
          notes?: string;
        };
      }) => {
        try {
          await this.handleCharacterStatusUpdate(socket, data);
        } catch (error) {
          console.error('Character status update error:', error);
          socket.emit('error', { message: 'Failed to update character status' });
        }
      });

      // 戦闘開始
      socket.on('start_combat', async (data: {
        sessionId: string;
        participants: Array<{
          characterId: string;
          initiative: number;
          isNPC?: boolean;
        }>;
      }) => {
        try {
          await this.handleStartCombat(socket, data);
        } catch (error) {
          console.error('Start combat error:', error);
          socket.emit('error', { message: 'Failed to start combat' });
        }
      });

      // 戦闘終了
      socket.on('end_combat', async (data: { sessionId: string }) => {
        try {
          await this.handleEndCombat(socket, data.sessionId);
        } catch (error) {
          console.error('End combat error:', error);
          socket.emit('error', { message: 'Failed to end combat' });
        }
      });

      // イニシアチブ順変更
      socket.on('update_initiative', async (data: {
        sessionId: string;
        characterId: string;
        newInitiative: number;
      }) => {
        try {
          await this.handleUpdateInitiative(socket, data);
        } catch (error) {
          console.error('Update initiative error:', error);
          socket.emit('error', { message: 'Failed to update initiative' });
        }
      });

      // 接続切断処理
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected from socket ${socket.id}`);
        
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          
          // 参加中のセッションから離脱
          for (const [sessionId, session] of this.activeSessions) {
            if (session.participants.has(socket.userId)) {
              session.participants.delete(socket.userId);
              
              // セッションに参加者がいなくなった場合は削除
              if (session.participants.size === 0) {
                this.activeSessions.delete(sessionId);
              } else {
                // 他の参加者に離脱を通知
                this.io.to(sessionId).emit('participant_left', {
                  userId: socket.userId,
                  sessionId
                });
              }
            }
          }
        }
      });
    });
  }

  private async handleCreateSession(socket: AuthenticatedSocket, data: {
    campaignId: string;
    sessionName: string;
    mode: 'single' | 'multiplayer';
    isPrivate: boolean;
    maxPlayers?: number;
    inviteCode?: string;
    aiGMEnabled: boolean;
  }): Promise<GameSessionRoom> {
    const userId = socket.userId!;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // ユーザー情報を取得
    const user = await this.authService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // セッションを作成
    const session: GameSessionRoom = {
      sessionId,
      campaignId: data.campaignId,
      gamemaster: userId,
      participants: new Map(),
      status: 'waiting',
      mode: data.mode,
      maxPlayers: data.maxPlayers || (data.mode === 'single' ? 1 : 6),
      isPrivate: data.isPrivate,
      inviteCode: data.inviteCode,
      aiGMEnabled: data.aiGMEnabled,
      lastActivity: new Date(),
    };

    // 作成者をセッションに追加
    session.participants.set(userId, {
      userId,
      username: user.name!,
      role: data.aiGMEnabled ? 'player' : 'gamemaster', // AI GMが有効な場合はプレイヤーとして参加
    });

    this.activeSessions.set(sessionId, session);

    // ソケットをセッションルームに参加
    socket.join(sessionId);
    socket.campaignId = session.campaignId;

    console.log(`Session ${sessionId} created by ${user.name} (mode: ${data.mode}, AI GM: ${data.aiGMEnabled})`);
    
    return session;
  }

  private async handleJoinSession(socket: AuthenticatedSocket, data: { sessionId: string; characterId?: string; inviteCode?: string }) {
    const { sessionId, characterId, inviteCode } = data;
    const userId = socket.userId!;

    // セッション情報を取得
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    // セッション参加可能性チェック
    if (session.status === 'ended') {
      throw new Error('セッションは終了しています');
    }

    if (session.participants.size >= session.maxPlayers) {
      throw new Error('セッションは満員です');
    }

    // プライベートセッションの場合、招待コードをチェック
    if (session.isPrivate && session.inviteCode !== inviteCode) {
      throw new Error('招待コードが正しくありません');
    }

    // シングルモードの場合、作成者以外は参加不可
    if (session.mode === 'single' && session.gamemaster !== userId) {
      throw new Error('シングルモードセッションには参加できません');
    }

    // ユーザーをセッションに追加
    const user = await this.authService.getUserById(userId);
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    session.participants.set(userId, {
      userId,
      username: user.name!,
      role: session.aiGMEnabled ? 'player' : user.role!, // AI GMが有効な場合は全員プレイヤー
      characterId
    });

    session.lastActivity = new Date();

    // ソケットをセッションルームに参加
    socket.join(sessionId);
    socket.campaignId = session.campaignId;

    // 参加成功を通知
    socket.emit('session_joined', {
      sessionId,
      session,
      participants: Array.from(session.participants.values()),
      status: session.status,
      mode: session.mode,
      aiGMEnabled: session.aiGMEnabled
    });

    // 他の参加者に新規参加を通知（マルチプレイの場合のみ）
    if (session.mode === 'multiplayer') {
      socket.to(sessionId).emit('participant_joined', {
        user: session.participants.get(userId),
        sessionId
      });
    }

    console.log(`User ${userId} joined ${session.mode} session ${sessionId} (AI GM: ${session.aiGMEnabled})`);
  }

  private async handleLeaveSession(socket: AuthenticatedSocket, sessionId: string) {
    const userId = socket.userId!;
    const session = this.activeSessions.get(sessionId);

    if (session && session.participants.has(userId)) {
      session.participants.delete(userId);
      socket.leave(sessionId);

      // 離脱を通知
      socket.to(sessionId).emit('participant_left', {
        userId,
        sessionId
      });

      // セッションに参加者がいなくなった場合は削除
      if (session.participants.size === 0) {
        this.activeSessions.delete(sessionId);
      }

      console.log(`User ${userId} left session ${sessionId}`);
    }
  }

  private async handleChatMessage(socket: AuthenticatedSocket, data: {
    sessionId: string;
    message: string;
    messageType: 'ic' | 'ooc' | 'system' | 'whisper';
    targetUserId?: string;
  }) {
    const { sessionId, message, messageType, targetUserId } = data;
    const userId = socket.userId!;
    const session = this.activeSessions.get(sessionId);

    if (!session || !session.participants.has(userId)) {
      throw new Error('User not in session');
    }

    const user = session.participants.get(userId)!;
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      userId,
      username: user.username,
      message,
      messageType,
      timestamp: new Date().toISOString(),
      characterId: user.characterId
    };

    // ささやき（whisper）の場合は対象ユーザーとGMのみに送信
    if (messageType === 'whisper' && targetUserId) {
      const targetSocketId = this.userSockets.get(targetUserId);
      if (targetSocketId) {
        this.io.to(targetSocketId).emit('chat_message', messageData);
      }

      // GMにも送信（GMが送信者でない場合）
      if (user.role !== 'gamemaster') {
        for (const [participantId, participant] of session.participants) {
          if (participant.role === 'gamemaster') {
            const gmSocketId = this.userSockets.get(participantId);
            if (gmSocketId) {
              this.io.to(gmSocketId).emit('chat_message', messageData);
            }
          }
        }
      }

      // 送信者にも確認のため送信
      socket.emit('chat_message', messageData);
    } else {
      // 通常のメッセージはセッション全体に送信
      this.io.to(sessionId).emit('chat_message', messageData);
    }

    console.log(`Chat message in session ${sessionId} from ${user.username}: ${message}`);
  }

  private async handleDiceRoll(socket: AuthenticatedSocket, data: {
    sessionId: string;
    diceExpression: string;
    description?: string;
    isSecret?: boolean;
  }) {
    const { sessionId, diceExpression, description, isSecret } = data;
    const userId = socket.userId!;
    const session = this.activeSessions.get(sessionId);

    if (!session || !session.participants.has(userId)) {
      throw new Error('User not in session');
    }

    const user = session.participants.get(userId)!;
    
    // ダイス計算（簡易実装）
    const result = this.calculateDiceRoll(diceExpression);
    
    const rollData = {
      id: `roll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      userId,
      username: user.username,
      diceExpression,
      result,
      description,
      isSecret,
      timestamp: new Date().toISOString(),
      characterId: user.characterId
    };

    if (isSecret) {
      // シークレットダイスはGMのみに送信
      for (const [participantId, participant] of session.participants) {
        if (participant.role === 'gamemaster') {
          const gmSocketId = this.userSockets.get(participantId);
          if (gmSocketId) {
            this.io.to(gmSocketId).emit('dice_roll', rollData);
          }
        }
      }
      // 送信者にも送信
      socket.emit('dice_roll', rollData);
    } else {
      // 通常のダイスはセッション全体に送信
      this.io.to(sessionId).emit('dice_roll', rollData);
    }

    console.log(`Dice roll in session ${sessionId} by ${user.username}: ${diceExpression} = ${result.total}`);
  }

  private calculateDiceRoll(expression: string): { dice: string[], total: number, details: string } {
    // 簡易ダイス計算実装
    // 例: "2d6+3" → 2個の6面ダイス + 3
    const diceRegex = /(\d+)d(\d+)([+\-]\d+)?/g;
    let total = 0;
    const dice: string[] = [];
    let details = '';

    let match;
    while ((match = diceRegex.exec(expression)) !== null) {
      const [, numDice, numSides, modifier] = match;
      const rolls: number[] = [];
      
      for (let i = 0; i < parseInt(numDice); i++) {
        const roll = Math.floor(Math.random() * parseInt(numSides)) + 1;
        rolls.push(roll);
        dice.push(`d${numSides}:${roll}`);
      }
      
      const rollSum = rolls.reduce((sum, roll) => sum + roll, 0);
      total += rollSum;
      
      if (modifier) {
        const modValue = parseInt(modifier);
        total += modValue;
        details += `${numDice}d${numSides}[${rolls.join(',')}] ${modifier >= 0 ? '+' : ''}${modValue} `;
      } else {
        details += `${numDice}d${numSides}[${rolls.join(',')}] `;
      }
    }

    return { dice, total, details: details.trim() };
  }

  private async handleCharacterStatusUpdate(socket: AuthenticatedSocket, data: {
    sessionId: string;
    characterId: string;
    statusUpdate: any;
  }) {
    const { sessionId, characterId, statusUpdate } = data;
    const userId = socket.userId!;
    const session = this.activeSessions.get(sessionId);

    if (!session || !session.participants.has(userId)) {
      throw new Error('User not in session');
    }

    // ステータス更新をセッション全体に通知
    this.io.to(sessionId).emit('character_status_updated', {
      sessionId,
      characterId,
      statusUpdate,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });

    console.log(`Character status updated in session ${sessionId}: ${characterId}`);
  }

  private async handleStartCombat(socket: AuthenticatedSocket, data: {
    sessionId: string;
    participants: Array<{ characterId: string; initiative: number; isNPC?: boolean }>;
  }) {
    const { sessionId, participants } = data;
    const userId = socket.userId!;
    const session = this.activeSessions.get(sessionId);

    if (!session || !session.participants.has(userId)) {
      throw new Error('User not in session');
    }

    const user = session.participants.get(userId)!;
    if (user.role !== 'gamemaster') {
      throw new Error('Only gamemaster can start combat');
    }

    // イニシアチブ順にソート
    const sortedParticipants = participants.sort((a, b) => b.initiative - a.initiative);

    this.io.to(sessionId).emit('combat_started', {
      sessionId,
      participants: sortedParticipants,
      currentTurn: 0,
      startedBy: userId,
      timestamp: new Date().toISOString()
    });

    console.log(`Combat started in session ${sessionId} by ${user.username}`);
  }

  private async handleEndCombat(socket: AuthenticatedSocket, sessionId: string) {
    const userId = socket.userId!;
    const session = this.activeSessions.get(sessionId);

    if (!session || !session.participants.has(userId)) {
      throw new Error('User not in session');
    }

    const user = session.participants.get(userId)!;
    if (user.role !== 'gamemaster') {
      throw new Error('Only gamemaster can end combat');
    }

    this.io.to(sessionId).emit('combat_ended', {
      sessionId,
      endedBy: userId,
      timestamp: new Date().toISOString()
    });

    console.log(`Combat ended in session ${sessionId} by ${user.username}`);
  }

  private async handleUpdateInitiative(socket: AuthenticatedSocket, data: {
    sessionId: string;
    characterId: string;
    newInitiative: number;
  }) {
    const { sessionId, characterId, newInitiative } = data;
    const userId = socket.userId!;
    const session = this.activeSessions.get(sessionId);

    if (!session || !session.participants.has(userId)) {
      throw new Error('User not in session');
    }

    this.io.to(sessionId).emit('initiative_updated', {
      sessionId,
      characterId,
      newInitiative,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });

    console.log(`Initiative updated in session ${sessionId}: ${characterId} = ${newInitiative}`);
  }

  // パブリックメソッド：外部からの通知用
  public notifySessionUpdate(sessionId: string, data: any) {
    this.io.to(sessionId).emit('session_updated', data);
  }

  public notifyUserMessage(userId: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('user_notification', data);
    }
  }

  public getActiveSessionsCount(): number {
    return this.activeSessions.size;
  }

  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  public getSessionParticipants(sessionId: string): SessionUser[] {
    const session = this.activeSessions.get(sessionId);
    return session ? Array.from(session.participants.values()) : [];
  }
}

export default SocketService;
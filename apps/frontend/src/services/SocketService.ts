// @ts-nocheck
/**
 * 🔗 Socket.IO リアルタイム通信サービス
 * 
 * マルチプレイヤーセッション用のリアルタイム通信を管理
 */

import { io, Socket } from 'socket.io-client';

export interface SessionPlayer {
  id: string;
  name: string;
  character?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  isHost: boolean;
  isConnected: boolean;
  lastActivity: Date;
}

export interface SessionState {
  id: string;
  name: string;
  campaignId: string;
  mode: 'single' | 'multiplayer';
  players: SessionPlayer[];
  currentScene?: string;
  isActive: boolean;
  createdAt: Date;
  gameState?: any;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  type: 'chat' | 'system' | 'dice' | 'action';
  timestamp: Date;
  metadata?: any;
}

export interface DiceRoll {
  id: string;
  playerId: string;
  playerName: string;
  diceNotation: string;
  results: number[];
  total: number;
  modifier?: number;
  reason?: string;
  timestamp: Date;
}

export interface SessionEvent {
  id: string;
  type: 'player_join' | 'player_leave' | 'chat_message' | 'dice_roll' | 'scene_change' | 'game_state_update';
  data: any;
  timestamp: Date;
  playerId?: string;
}

/**
 * 🎮 SocketService クラス
 */
export class SocketService {
  private socket: Socket | null = null;
  private currentSession: SessionState | null = null;
  private isConnected = false;
  private connectionRetries = 0;
  private maxRetries = 5;

  // Event callbacks
  private eventHandlers: { [event: string]: Function[] } = {};

  constructor() {
    this.initializeSocket();
  }

  /**
   * 🔌 Socket.IO初期化
   */
  private initializeSocket(): void {
    const serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      retries: this.maxRetries,
    });

    this.setupEventListeners();
  }

  /**
   * 📡 イベントリスナー設定
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      this.isConnected = true;
      this.connectionRetries = 0;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
      
      // Auto-reconnect
      if (reason === 'io server disconnect') {
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      this.connectionRetries++;
      this.emit('connection_error', { error, retries: this.connectionRetries });
      
      if (this.connectionRetries < this.maxRetries) {
        setTimeout(() => this.reconnect(), 2000 * this.connectionRetries);
      }
    });

    // Session events
    this.socket.on('session_created', (data) => this.emit('session_created', data));
    this.socket.on('session_joined', (data) => this.emit('session_joined', data));
    this.socket.on('session_left', (data) => this.emit('session_left', data));
    this.socket.on('session_updated', (data) => this.emit('session_updated', data));
    this.socket.on('session_ended', (data) => this.emit('session_ended', data));

    // Player events
    this.socket.on('player_joined', (data) => this.emit('player_joined', data));
    this.socket.on('player_left', (data) => this.emit('player_left', data));
    this.socket.on('player_updated', (data) => this.emit('player_updated', data));

    // Communication events
    this.socket.on('chat_message', (data) => this.emit('chat_message', data));
    this.socket.on('dice_roll', (data) => this.emit('dice_roll', data));
    this.socket.on('scene_changed', (data) => this.emit('scene_changed', data));
    this.socket.on('game_state_updated', (data) => this.emit('game_state_updated', data));

    // Error events
    this.socket.on('error', (error) => this.emit('error', error));
  }

  /**
   * 🔄 再接続
   */
  private reconnect(): void {
    if (this.socket) {
      this.socket.connect();
    } else {
      this.initializeSocket();
    }
  }

  /**
   * 📢 イベント発火
   */
  private emit(event: string, data: any): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  /**
   * 👂 イベントリスナー登録
   */
  on(event: string, callback: Function): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
  }

  /**
   * 🚫 イベントリスナー解除
   */
  off(event: string, callback?: Function): void {
    if (!this.eventHandlers[event]) return;
    
    if (callback) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== callback);
    } else {
      delete this.eventHandlers[event];
    }
  }

  /**
   * 🎮 セッション作成
   */
  async createSession(sessionData: {
    name: string;
    campaignId: string;
    mode: 'single' | 'multiplayer';
    isPrivate: boolean;
    inviteCode?: string;
    maxPlayers?: number;
  }): Promise<SessionState> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('create_session', sessionData, (response: any) => {
        if (response.success) {
          this.currentSession = response.session;
          resolve(response.session);
        } else {
          reject(new Error(response.error || 'Failed to create session'));
        }
      });
    });
  }

  /**
   * 🚪 セッション参加
   */
  async joinSession(sessionId: string, playerData: {
    name: string;
    characterId?: string;
    inviteCode?: string;
  }): Promise<SessionState> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('join_session', { sessionId, ...playerData }, (response: any) => {
        if (response.success) {
          this.currentSession = response.session;
          resolve(response.session);
        } else {
          reject(new Error(response.error || 'Failed to join session'));
        }
      });
    });
  }

  /**
   * 🏃 セッション退出
   */
  async leaveSession(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.currentSession) {
        resolve();
        return;
      }

      this.socket.emit('leave_session', { sessionId: this.currentSession.id }, (response: any) => {
        if (response.success) {
          this.currentSession = null;
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to leave session'));
        }
      });
    });
  }

  /**
   * 💬 チャットメッセージ送信
   */
  sendChatMessage(message: string, type: ChatMessage['type'] = 'chat'): void {
    if (!this.socket || !this.currentSession) return;

    const chatMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
      playerId: this.socket.id || '',
      playerName: this.getCurrentPlayerName(),
      message,
      type,
    };

    this.socket.emit('chat_message', {
      sessionId: this.currentSession.id,
      ...chatMessage
    });
  }

  /**
   * 🎲 ダイスロール送信
   */
  sendDiceRoll(diceNotation: string, reason?: string): void {
    if (!this.socket || !this.currentSession) return;

    // ダイス計算は簡単な実装
    const [count, sides] = diceNotation.replace('d', '').split('+')[0].split('d');
    const diceCount = parseInt(count) || 1;
    const diceSides = parseInt(sides) || 20;
    const modifier = diceNotation.includes('+') ? parseInt(diceNotation.split('+')[1]) || 0 : 0;

    const results: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      results.push(Math.floor(Math.random() * diceSides) + 1);
    }
    const total = results.reduce((sum, roll) => sum + roll, 0) + modifier;

    const diceRoll: Omit<DiceRoll, 'id' | 'timestamp'> = {
      playerId: this.socket.id || '',
      playerName: this.getCurrentPlayerName(),
      diceNotation,
      results,
      total,
      modifier: modifier || undefined,
      reason,
    };

    this.socket.emit('dice_roll', {
      sessionId: this.currentSession.id,
      ...diceRoll
    });
  }

  /**
   * 🎬 シーン変更
   */
  changeScene(sceneData: {
    name: string;
    description: string;
    imageUrl?: string;
  }): void {
    if (!this.socket || !this.currentSession) return;

    this.socket.emit('change_scene', {
      sessionId: this.currentSession.id,
      ...sceneData
    });
  }

  /**
   * 🎮 ゲーム状態更新
   */
  updateGameState(gameState: any): void {
    if (!this.socket || !this.currentSession) return;

    this.socket.emit('update_game_state', {
      sessionId: this.currentSession.id,
      gameState
    });
  }

  /**
   * 🔍 アクティブセッション一覧取得
   */
  async getActiveSessions(): Promise<SessionState[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('get_active_sessions', (response: any) => {
        if (response.success) {
          resolve(response.sessions);
        } else {
          reject(new Error(response.error || 'Failed to get sessions'));
        }
      });
    });
  }

  /**
   * 👤 現在のプレイヤー名を取得
   */
  private getCurrentPlayerName(): string {
    // 実際の実装では、ユーザー情報から取得
    return localStorage.getItem('playerName') || 'プレイヤー';
  }

  /**
   * 📊 接続状態取得
   */
  getConnectionStatus(): {
    connected: boolean;
    session: SessionState | null;
    retries: number;
  } {
    return {
      connected: this.isConnected,
      session: this.currentSession,
      retries: this.connectionRetries,
    };
  }

  /**
   * 🛠️ サービス終了
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentSession = null;
    this.isConnected = false;
    this.eventHandlers = {};
  }

  /**
   * 🔄 強制再接続
   */
  forceReconnect(): void {
    this.connectionRetries = 0;
    this.disconnect();
    this.initializeSocket();
  }
}

// Singleton instance
export const socketService = new SocketService();

export default socketService;
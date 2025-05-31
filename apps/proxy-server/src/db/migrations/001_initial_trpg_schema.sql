-- TRPG用初期データベーススキーマ
-- SQLite + Litestream対応

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- キャンペーンテーブル
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    game_system TEXT NOT NULL,
    gamemaster_id TEXT NOT NULL,
    synopsis TEXT,
    status TEXT DEFAULT 'planning', -- planning, active, paused, completed, archived
    difficulty TEXT DEFAULT 'intermediate', -- beginner, intermediate, advanced, expert
    target_players_min INTEGER DEFAULT 2,
    target_players_max INTEGER DEFAULT 6,
    estimated_sessions INTEGER,
    total_play_time INTEGER DEFAULT 0, -- minutes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gamemaster_id) REFERENCES users(id)
);

-- キャンペーン参加者テーブル
CREATE TABLE IF NOT EXISTS campaign_players (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'player', -- player, co_gm, observer
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(campaign_id, user_id)
);

-- キャラクターテーブル
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    character_type TEXT NOT NULL, -- PC, NPC, Enemy
    player_id TEXT, -- PCの場合のプレイヤーID
    
    -- 基本情報
    race TEXT,
    class TEXT,
    background TEXT,
    alignment TEXT,
    gender TEXT,
    age TEXT,
    appearance TEXT,
    personality TEXT,
    motivation TEXT,
    backstory TEXT,
    
    -- ゲーム統計（JSON形式で保存）
    stats TEXT NOT NULL, -- CharacterStats JSON
    skills TEXT, -- Skill[] JSON
    equipment TEXT, -- Equipment[] JSON
    
    -- その他
    image_url TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES users(id)
);

-- NPC専用情報テーブル
CREATE TABLE IF NOT EXISTS npc_details (
    character_id TEXT PRIMARY KEY,
    location TEXT,
    occupation TEXT,
    attitude TEXT DEFAULT 'neutral', -- friendly, neutral, hostile, unknown
    knowledge TEXT, -- string[] JSON
    services TEXT, -- string[] JSON
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- 敵キャラクター専用情報テーブル
CREATE TABLE IF NOT EXISTS enemy_details (
    character_id TEXT PRIMARY KEY,
    enemy_type TEXT NOT NULL, -- mob, elite, boss
    challenge_rating REAL NOT NULL,
    tactics TEXT,
    loot TEXT, -- Equipment[] JSON
    spawn_locations TEXT, -- string[] JSON
    behavior_pattern TEXT,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- キャラクター進歩記録テーブル
CREATE TABLE IF NOT EXISTS character_progression (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,
    session_id TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    experience_gained INTEGER DEFAULT 0,
    level_up BOOLEAN DEFAULT 0,
    new_skills TEXT, -- string[] JSON
    stat_changes TEXT, -- Partial<CharacterStats> JSON
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id)
);

-- クエストテーブル
CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    quest_type TEXT DEFAULT 'メイン', -- メイン, サブ, 個人, 隠し
    status TEXT DEFAULT '未開始', -- 未開始, 進行中, 完了, 失敗, 保留
    difficulty INTEGER DEFAULT 3, -- 1-5
    rewards TEXT, -- string[] JSON
    prerequisites TEXT, -- string[] JSON
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- セッションテーブル
CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    session_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    date DATETIME,
    duration INTEGER DEFAULT 0, -- minutes
    gamemaster_id TEXT NOT NULL,
    synopsis TEXT,
    content TEXT, -- Descendant[] JSON (Slate.js content)
    experience_awarded INTEGER DEFAULT 0,
    status TEXT DEFAULT 'planned', -- planned, inProgress, completed, cancelled
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (gamemaster_id) REFERENCES users(id)
);

-- セッション参加者テーブル
CREATE TABLE IF NOT EXISTS session_attendees (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    character_id TEXT,
    attended BOOLEAN DEFAULT 1,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (character_id) REFERENCES characters(id),
    UNIQUE(session_id, user_id)
);

-- セッションイベントテーブル
CREATE TABLE IF NOT EXISTS session_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    session_day INTEGER DEFAULT 1,
    session_time TEXT,
    event_type TEXT NOT NULL, -- combat, roleplay, exploration, puzzle, social, discovery, rest
    outcome TEXT, -- success, failure, partial, ongoing
    experience_awarded INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    place_id TEXT,
    loot_gained TEXT, -- Equipment[] JSON
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

-- 戦闘エンカウンターテーブル
CREATE TABLE IF NOT EXISTS combat_encounters (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    round INTEGER DEFAULT 0,
    status TEXT DEFAULT 'planning', -- planning, active, completed
    battlemap_url TEXT,
    summary TEXT,
    experience_awarded INTEGER DEFAULT 0,
    loot_dropped TEXT, -- Equipment[] JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

-- 戦闘参加者テーブル
CREATE TABLE IF NOT EXISTS combat_participants (
    id TEXT PRIMARY KEY,
    encounter_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    initiative INTEGER DEFAULT 0,
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    conditions TEXT, -- string[] JSON
    position_x REAL,
    position_y REAL,
    has_acted BOOLEAN DEFAULT 0,
    FOREIGN KEY (encounter_id) REFERENCES combat_encounters(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- ハンドアウトテーブル
CREATE TABLE IF NOT EXISTS handouts (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, map, image, rules, quest, letter, other
    is_public BOOLEAN DEFAULT 0,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- ハンドアウト受信者テーブル
CREATE TABLE IF NOT EXISTS handout_recipients (
    id TEXT PRIMARY KEY,
    handout_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    read_at DATETIME,
    FOREIGN KEY (handout_id) REFERENCES handouts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(handout_id, user_id)
);

-- キャンペーンルールテーブル
CREATE TABLE IF NOT EXISTS campaign_rules (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'house_rule', -- house_rule, variant, custom, clarification
    description TEXT NOT NULL,
    details TEXT,
    applies_to TEXT, -- string[] JSON
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- 世界観構築テーブル（既存のものを維持）
CREATE TABLE IF NOT EXISTS world_building (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    element_type TEXT NOT NULL, -- place, rule, culture, etc.
    name TEXT NOT NULL,
    description TEXT,
    data TEXT, -- JSON data for type-specific fields
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_campaigns_gamemaster ON campaigns(gamemaster_id);
CREATE INDEX IF NOT EXISTS idx_characters_campaign ON characters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_characters_player ON characters(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_campaign ON game_sessions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_session_events_session ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_combat_encounters_session ON combat_encounters(session_id);
CREATE INDEX IF NOT EXISTS idx_handouts_campaign ON handouts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_world_building_campaign ON world_building(campaign_id);

-- 更新日時の自動更新トリガー
CREATE TRIGGER IF NOT EXISTS update_campaigns_updated_at 
    AFTER UPDATE ON campaigns
    BEGIN
        UPDATE campaigns SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_characters_updated_at 
    AFTER UPDATE ON characters
    BEGIN
        UPDATE characters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_sessions_updated_at 
    AFTER UPDATE ON game_sessions
    BEGIN
        UPDATE game_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
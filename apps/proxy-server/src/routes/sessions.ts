// セッション管理API
import express from 'express';
import DatabaseConnection from '../db/connection.js';
import { GameSession, SessionEvent, CombatEncounter } from '@trpg-ai-gm/types';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// セッション一覧取得（キャンペーン別）
router.get('/', async (req, res) => {
  try {
    const { campaignId } = req.query;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId parameter required' });
    }

    const db = DatabaseConnection.getInstance().getDatabase();
    const stmt = db.prepare(`
      SELECT gs.*, 
             COUNT(sa.user_id) as attendee_count,
             GROUP_CONCAT(u.name) as attendee_names
      FROM game_sessions gs
      LEFT JOIN session_attendees sa ON gs.id = sa.session_id AND sa.attended = 1
      LEFT JOIN users u ON sa.user_id = u.id
      WHERE gs.campaign_id = ?
      GROUP BY gs.id
      ORDER BY gs.session_number DESC
    `);

    const sessions = stmt.all(campaignId);

    res.json({ 
      sessions: sessions.map(session => ({
        ...session,
        content: session.content ? JSON.parse(session.content) : [],
        attendee_names: session.attendee_names ? session.attendee_names.split(',') : []
      }))
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セッション詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = DatabaseConnection.getInstance().getDatabase();

    // セッション基本情報を取得
    const sessionStmt = db.prepare('SELECT * FROM game_sessions WHERE id = ?');
    const session = sessionStmt.get(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 参加者情報を取得
    const attendeesStmt = db.prepare(`
      SELECT sa.*, u.name as user_name, c.name as character_name
      FROM session_attendees sa
      LEFT JOIN users u ON sa.user_id = u.id
      LEFT JOIN characters c ON sa.character_id = c.id
      WHERE sa.session_id = ?
    `);
    const attendees = attendeesStmt.all(id);

    // セッションイベントを取得
    const eventsStmt = db.prepare(`
      SELECT * FROM session_events 
      WHERE session_id = ? 
      ORDER BY order_index, session_day, session_time
    `);
    const events = eventsStmt.all(id);

    // 戦闘エンカウンターを取得
    const combatsStmt = db.prepare(`
      SELECT * FROM combat_encounters 
      WHERE session_id = ? 
      ORDER BY created_at
    `);
    const combats = combatsStmt.all(id);

    res.json({
      session: {
        ...session,
        content: session.content ? JSON.parse(session.content) : [],
        attendees: attendees.map(a => ({
          ...a,
          user_name: a.user_name,
          character_name: a.character_name
        })),
        events: events.map(e => ({
          ...e,
          loot_gained: e.loot_gained ? JSON.parse(e.loot_gained) : []
        })),
        combats: combats.map(c => ({
          ...c,
          loot_dropped: c.loot_dropped ? JSON.parse(c.loot_dropped) : []
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セッション作成
router.post('/', async (req, res) => {
  try {
    const sessionData = req.body as Partial<GameSession> & {
      campaignId: string;
      title: string;
      gamemaster: string;
    };

    // 必須フィールドの検証
    if (!sessionData.campaignId || !sessionData.title || !sessionData.gamemaster) {
      return res.status(400).json({
        error: 'Missing required fields: campaignId, title, gamemaster'
      });
    }

    const db = DatabaseConnection.getInstance().getDatabase();
    const id = uuidv4();

    // セッション番号を自動計算
    const countStmt = db.prepare(`
      SELECT COALESCE(MAX(session_number), 0) + 1 as next_number 
      FROM game_sessions 
      WHERE campaign_id = ?
    `);
    const { next_number } = countStmt.get(sessionData.campaignId) as { next_number: number };

    const insertStmt = db.prepare(`
      INSERT INTO game_sessions (
        id, campaign_id, session_number, title, date, duration,
        gamemaster_id, synopsis, content, experience_awarded, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      id,
      sessionData.campaignId,
      next_number,
      sessionData.title,
      sessionData.date ? new Date(sessionData.date).toISOString() : null,
      sessionData.duration || 0,
      sessionData.gamemaster,
      sessionData.synopsis || null,
      JSON.stringify(sessionData.content || []),
      sessionData.experienceAwarded || 0,
      sessionData.status || 'planned',
      sessionData.notes || null
    );

    res.status(201).json({
      id,
      session_number: next_number,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セッション更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // IDフィールドは更新から除外
    delete updates.id;
    delete updates.created_at;
    delete updates.session_number; // セッション番号は変更不可

    const db = DatabaseConnection.getInstance().getDatabase();
    const fields = Object.keys(updates);
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // contentフィールドをJSON文字列化
    if (updates.content) {
      updates.content = JSON.stringify(updates.content);
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);

    const stmt = db.prepare(`
      UPDATE game_sessions 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const result = stmt.run(...values, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session updated successfully' });
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セッション削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = DatabaseConnection.getInstance().getDatabase();

    const stmt = db.prepare('DELETE FROM game_sessions WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 参加者追加
router.post('/:id/attendees', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, characterId, attended = true } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const db = DatabaseConnection.getInstance().getDatabase();
    const attendeeId = uuidv4();

    try {
      const stmt = db.prepare(`
        INSERT INTO session_attendees (id, session_id, user_id, character_id, attended)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(attendeeId, id, userId, characterId || null, attended ? 1 : 0);

      res.json({ message: 'Attendee added successfully' });
    } catch (error) {
      // Unique constraint violation
      res.status(400).json({ error: 'User already added to this session' });
    }
  } catch (error) {
    console.error('Error adding attendee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 参加者削除
router.delete('/:id/attendees/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const db = DatabaseConnection.getInstance().getDatabase();

    const stmt = db.prepare(`
      DELETE FROM session_attendees 
      WHERE session_id = ? AND user_id = ?
    `);

    const result = stmt.run(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Attendee not found' });
    }

    res.json({ message: 'Attendee removed successfully' });
  } catch (error) {
    console.error('Error removing attendee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// セッションステータス更新
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['planned', 'inProgress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const db = DatabaseConnection.getInstance().getDatabase();
    const stmt = db.prepare(`
      UPDATE game_sessions 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const result = stmt.run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session status updated successfully' });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 経験値付与
router.patch('/:id/experience', async (req, res) => {
  try {
    const { id } = req.params;
    const { experience } = req.body;

    if (typeof experience !== 'number' || experience < 0) {
      return res.status(400).json({
        error: 'experience must be a non-negative number'
      });
    }

    const db = DatabaseConnection.getInstance().getDatabase();
    const stmt = db.prepare(`
      UPDATE game_sessions 
      SET experience_awarded = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);

    const result = stmt.run(experience, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Experience awarded updated successfully' });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
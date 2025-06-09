// @ts-nocheck
// エネミー管理API
import express from 'express';
import { CharacterModel } from '../db/models/Character.js';
import { TRPGCharacter, CharacterStats, Equipment } from '@trpg-ai-gm/types';

const router = express.Router();
const characterModel = new CharacterModel();

// エネミー一覧取得（キャンペーン別）
router.get('/', async (req, res) => {
  try {
    const { campaignId, enemyType, challengeRating } = req.query;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId parameter required' });
    }

    let enemies = await characterModel.findByCampaign(campaignId as string, 'Enemy');

    // 敵タイプでフィルタリング
    if (enemyType) {
      const detailedEnemies = await Promise.all(
        enemies.map(async (enemy) => {
          const details = await characterModel.getEnemyDetails(enemy.id);
          return { ...enemy, details };
        })
      );
      enemies = detailedEnemies.filter(e => e.details?.enemy_type === enemyType);
    }

    // チャレンジレーティングでフィルタリング
    if (challengeRating) {
      const cr = parseInt(challengeRating as string);
      const detailedEnemies = await Promise.all(
        enemies.map(async (enemy) => {
          const details = await characterModel.getEnemyDetails(enemy.id);
          return { ...enemy, details };
        })
      );
      enemies = detailedEnemies.filter(e => e.details?.challenge_rating === cr);
    }

    // JSON文字列をパース
    const parsedEnemies = enemies.map(enemy => ({
      ...enemy,
      stats: JSON.parse(enemy.stats),
      skills: enemy.skills ? JSON.parse(enemy.skills) : [],
      equipment: enemy.equipment ? JSON.parse(enemy.equipment) : []
    }));

    res.json({ enemies: parsedEnemies });
  } catch (error) {
    console.error('Error fetching enemies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// エネミー詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const enemy = await characterModel.findById(id);

    if (!enemy || enemy.character_type !== 'Enemy') {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    // JSON文字列をパース
    const parsedEnemy = {
      ...enemy,
      stats: JSON.parse(enemy.stats),
      skills: enemy.skills ? JSON.parse(enemy.skills) : [],
      equipment: enemy.equipment ? JSON.parse(enemy.equipment) : []
    };

    // エネミー固有の詳細情報を取得
    const enemyDetails = await characterModel.getEnemyDetails(id);
    if (enemyDetails) {
      parsedEnemy.enemyDetails = {
        ...enemyDetails,
        loot: JSON.parse(enemyDetails.loot || '[]'),
        spawn_locations: JSON.parse(enemyDetails.spawn_locations || '[]')
      };
    }

    res.json({ enemy: parsedEnemy });
  } catch (error) {
    console.error('Error fetching enemy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// エネミー作成
router.post('/', async (req, res) => {
  try {
    const enemyData = req.body as Partial<TRPGCharacter> & {
      campaignId: string;
      name: string;
      stats: CharacterStats;
      enemyType?: string;
      challengeRating?: number;
      tactics?: string;
      loot?: Equipment[];
      spawnLocations?: string[];
      behaviorPattern?: string;
    };

    // 必須フィールドの検証
    if (!enemyData.campaignId || !enemyData.name || !enemyData.stats) {
      return res.status(400).json({
        error: 'Missing required fields: campaignId, name, stats'
      });
    }

    // エネミータイプを強制設定
    enemyData.characterType = 'Enemy';

    // ステータスの基本検証
    const stats = enemyData.stats;
    if (!stats.hitPoints || typeof stats.hitPoints.max !== 'number') {
      return res.status(400).json({
        error: 'Invalid stats: hitPoints.max is required'
      });
    }

    const enemyId = await characterModel.create(enemyData);

    res.status(201).json({
      id: enemyId,
      message: 'Enemy created successfully'
    });
  } catch (error) {
    console.error('Error creating enemy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// エネミー更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // エネミーかどうか確認
    const enemy = await characterModel.findById(id);
    if (!enemy || enemy.character_type !== 'Enemy') {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    // IDフィールドは更新から除外
    delete updates.id;
    delete updates.created_at;
    delete updates.character_type; // エネミータイプは変更不可

    // JSON文字列化が必要なフィールドを処理
    if (updates.stats) {
      updates.stats = JSON.stringify(updates.stats);
    }
    if (updates.skills) {
      updates.skills = JSON.stringify(updates.skills);
    }
    if (updates.equipment) {
      updates.equipment = JSON.stringify(updates.equipment);
    }

    const updated = await characterModel.update(id, updates);

    if (!updated) {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    res.json({ message: 'Enemy updated successfully' });
  } catch (error) {
    console.error('Error updating enemy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// エネミー削除（論理削除）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // エネミーかどうか確認
    const enemy = await characterModel.findById(id);
    if (!enemy || enemy.character_type !== 'Enemy') {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    const deleted = await characterModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    res.json({ message: 'Enemy deleted successfully' });
  } catch (error) {
    console.error('Error deleting enemy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// エネミーのチャレンジレーティング更新
router.patch('/:id/challenge-rating', async (req, res) => {
  try {
    const { id } = req.params;
    const { challengeRating } = req.body;

    if (typeof challengeRating !== 'number' || challengeRating < 0) {
      return res.status(400).json({
        error: 'challengeRating must be a non-negative number'
      });
    }

    // エネミーかどうか確認
    const enemy = await characterModel.findById(id);
    if (!enemy || enemy.character_type !== 'Enemy') {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    // enemy_detailsテーブルを直接更新
    const enemyDetails = await characterModel.getEnemyDetails(id);
    if (!enemyDetails) {
      return res.status(404).json({ error: 'Enemy details not found' });
    }

    // 簡易更新（本来はCharacterModelに専用メソッドを追加すべき）
    const database = characterModel['db'].getDatabase();
    const stmt = database.prepare(`
      UPDATE enemy_details 
      SET challenge_rating = ? 
      WHERE character_id = ?
    `);
    
    const result = stmt.run(challengeRating, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Failed to update challenge rating' });
    }

    res.json({ message: 'Challenge rating updated successfully' });
  } catch (error) {
    console.error('Error updating challenge rating:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// エネミーの戦術パターン更新
router.patch('/:id/tactics', async (req, res) => {
  try {
    const { id } = req.params;
    const { tactics, behaviorPattern } = req.body;

    // エネミーかどうか確認
    const enemy = await characterModel.findById(id);
    if (!enemy || enemy.character_type !== 'Enemy') {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    const database = characterModel['db'].getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (tactics !== undefined) {
      updates.push('tactics = ?');
      values.push(tactics);
    }
    if (behaviorPattern !== undefined) {
      updates.push('behavior_pattern = ?');
      values.push(behaviorPattern);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const stmt = database.prepare(`
      UPDATE enemy_details 
      SET ${updates.join(', ')} 
      WHERE character_id = ?
    `);
    
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Failed to update tactics' });
    }

    res.json({ message: 'Tactics updated successfully' });
  } catch (error) {
    console.error('Error updating tactics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// エネミーのドロップアイテム更新
router.patch('/:id/loot', async (req, res) => {
  try {
    const { id } = req.params;
    const { loot } = req.body;

    if (!Array.isArray(loot)) {
      return res.status(400).json({ error: 'loot must be an array' });
    }

    // エネミーかどうか確認
    const enemy = await characterModel.findById(id);
    if (!enemy || enemy.character_type !== 'Enemy') {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    const database = characterModel['db'].getDatabase();
    const stmt = database.prepare(`
      UPDATE enemy_details 
      SET loot = ? 
      WHERE character_id = ?
    `);
    
    const result = stmt.run(JSON.stringify(loot), id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Failed to update loot' });
    }

    res.json({ message: 'Loot updated successfully' });
  } catch (error) {
    console.error('Error updating loot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 出現場所更新
router.patch('/:id/spawn-locations', async (req, res) => {
  try {
    const { id } = req.params;
    const { spawnLocations } = req.body;

    if (!Array.isArray(spawnLocations)) {
      return res.status(400).json({ error: 'spawnLocations must be an array' });
    }

    // エネミーかどうか確認
    const enemy = await characterModel.findById(id);
    if (!enemy || enemy.character_type !== 'Enemy') {
      return res.status(404).json({ error: 'Enemy not found' });
    }

    const database = characterModel['db'].getDatabase();
    const stmt = database.prepare(`
      UPDATE enemy_details 
      SET spawn_locations = ? 
      WHERE character_id = ?
    `);
    
    const result = stmt.run(JSON.stringify(spawnLocations), id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Failed to update spawn locations' });
    }

    res.json({ message: 'Spawn locations updated successfully' });
  } catch (error) {
    console.error('Error updating spawn locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
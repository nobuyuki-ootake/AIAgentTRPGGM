// @ts-nocheck
// NPC管理API
import express from 'express';
import { CharacterModel } from '../db/models/Character.js';
import { TRPGCharacter, CharacterStats } from '@trpg-ai-gm/types';

const router = express.Router();
const characterModel = new CharacterModel();

// NPC一覧取得（キャンペーン別）
router.get('/', async (req, res) => {
  try {
    const { campaignId, location, occupation, attitude } = req.query;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId parameter required' });
    }

    let npcs = await characterModel.findByCampaign(campaignId as string, 'NPC');

    // 場所でフィルタリング
    if (location) {
      const detailedNPCs = await Promise.all(
        npcs.map(async (npc) => {
          const details = await characterModel.getNPCDetails(npc.id);
          return { ...npc, details };
        })
      );
      npcs = detailedNPCs.filter(n => n.details?.location === location);
    }

    // 職業でフィルタリング
    if (occupation) {
      const detailedNPCs = await Promise.all(
        npcs.map(async (npc) => {
          const details = await characterModel.getNPCDetails(npc.id);
          return { ...npc, details };
        })
      );
      npcs = detailedNPCs.filter(n => n.details?.occupation === occupation);
    }

    // 態度でフィルタリング
    if (attitude) {
      const detailedNPCs = await Promise.all(
        npcs.map(async (npc) => {
          const details = await characterModel.getNPCDetails(npc.id);
          return { ...npc, details };
        })
      );
      npcs = detailedNPCs.filter(n => n.details?.attitude === attitude);
    }

    // JSON文字列をパース
    const parsedNPCs = npcs.map(npc => ({
      ...npc,
      stats: JSON.parse(npc.stats),
      skills: npc.skills ? JSON.parse(npc.skills) : [],
      equipment: npc.equipment ? JSON.parse(npc.equipment) : []
    }));

    res.json({ npcs: parsedNPCs });
  } catch (error) {
    console.error('Error fetching NPCs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NPC詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const npc = await characterModel.findById(id);

    if (!npc || npc.character_type !== 'NPC') {
      return res.status(404).json({ error: 'NPC not found' });
    }

    // JSON文字列をパース
    const parsedNPC = {
      ...npc,
      stats: JSON.parse(npc.stats),
      skills: npc.skills ? JSON.parse(npc.skills) : [],
      equipment: npc.equipment ? JSON.parse(npc.equipment) : []
    };

    // NPC固有の詳細情報を取得
    const npcDetails = await characterModel.getNPCDetails(id);
    if (npcDetails) {
      parsedNPC.npcDetails = {
        ...npcDetails,
        knowledge: JSON.parse(npcDetails.knowledge || '[]'),
        services: JSON.parse(npcDetails.services || '[]')
      };
    }

    res.json({ npc: parsedNPC });
  } catch (error) {
    console.error('Error fetching NPC:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NPC作成
router.post('/', async (req, res) => {
  try {
    const npcData = req.body as Partial<TRPGCharacter> & {
      campaignId: string;
      name: string;
      stats: CharacterStats;
      location?: string;
      occupation?: string;
      attitude?: 'friendly' | 'neutral' | 'hostile' | 'cautious';
      knowledge?: string[];
      services?: Array<{
        name: string;
        description: string;
        cost?: number;
        availability?: boolean;
      }>;
    };

    // 必須フィールドの検証
    if (!npcData.campaignId || !npcData.name || !npcData.stats) {
      return res.status(400).json({
        error: 'Missing required fields: campaignId, name, stats'
      });
    }

    // NPCタイプを強制設定
    npcData.characterType = 'NPC';

    // ステータスの基本検証
    const stats = npcData.stats;
    if (!stats.hitPoints || typeof stats.hitPoints.max !== 'number') {
      return res.status(400).json({
        error: 'Invalid stats: hitPoints.max is required'
      });
    }

    const npcId = await characterModel.create(npcData);

    res.status(201).json({
      id: npcId,
      message: 'NPC created successfully'
    });
  } catch (error) {
    console.error('Error creating NPC:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NPC更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // NPCかどうか確認
    const npc = await characterModel.findById(id);
    if (!npc || npc.character_type !== 'NPC') {
      return res.status(404).json({ error: 'NPC not found' });
    }

    // IDフィールドは更新から除外
    delete updates.id;
    delete updates.created_at;
    delete updates.character_type; // NPCタイプは変更不可

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
      return res.status(404).json({ error: 'NPC not found' });
    }

    res.json({ message: 'NPC updated successfully' });
  } catch (error) {
    console.error('Error updating NPC:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NPC削除（論理削除）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // NPCかどうか確認
    const npc = await characterModel.findById(id);
    if (!npc || npc.character_type !== 'NPC') {
      return res.status(404).json({ error: 'NPC not found' });
    }

    const deleted = await characterModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'NPC not found' });
    }

    res.json({ message: 'NPC deleted successfully' });
  } catch (error) {
    console.error('Error deleting NPC:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NPCの場所更新
router.patch('/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { location } = req.body;

    if (!location || typeof location !== 'string') {
      return res.status(400).json({ error: 'Valid location is required' });
    }

    // NPCかどうか確認
    const npc = await characterModel.findById(id);
    if (!npc || npc.character_type !== 'NPC') {
      return res.status(404).json({ error: 'NPC not found' });
    }

    // npc_detailsテーブルを直接更新
    const database = characterModel['db'].getDatabase();
    const stmt = database.prepare(`
      UPDATE npc_details 
      SET location = ? 
      WHERE character_id = ?
    `);
    
    const result = stmt.run(location, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Failed to update location' });
    }

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NPCの態度更新
router.patch('/:id/attitude', async (req, res) => {
  try {
    const { id } = req.params;
    const { attitude } = req.body;

    const validAttitudes = ['friendly', 'neutral', 'hostile', 'cautious'];
    if (!validAttitudes.includes(attitude)) {
      return res.status(400).json({
        error: 'Invalid attitude. Must be one of: ' + validAttitudes.join(', ')
      });
    }

    // NPCかどうか確認
    const npc = await characterModel.findById(id);
    if (!npc || npc.character_type !== 'NPC') {
      return res.status(404).json({ error: 'NPC not found' });
    }

    const database = characterModel['db'].getDatabase();
    const stmt = database.prepare(`
      UPDATE npc_details 
      SET attitude = ? 
      WHERE character_id = ?
    `);
    
    const result = stmt.run(attitude, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Failed to update attitude' });
    }

    res.json({ message: 'Attitude updated successfully' });
  } catch (error) {
    console.error('Error updating attitude:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NPCの知識更新
router.patch('/:id/knowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { knowledge } = req.body;

    if (!Array.isArray(knowledge)) {
      return res.status(400).json({ error: 'knowledge must be an array' });
    }

    // NPCかどうか確認
    const npc = await characterModel.findById(id);
    if (!npc || npc.character_type !== 'NPC') {
      return res.status(404).json({ error: 'NPC not found' });
    }

    const database = characterModel['db'].getDatabase();
    const stmt = database.prepare(`
      UPDATE npc_details 
      SET knowledge = ? 
      WHERE character_id = ?
    `);
    
    const result = stmt.run(JSON.stringify(knowledge), id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Failed to update knowledge' });
    }

    res.json({ message: 'Knowledge updated successfully' });
  } catch (error) {
    console.error('Error updating knowledge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NPCのサービス更新
router.patch('/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const { services } = req.body;

    if (!Array.isArray(services)) {
      return res.status(400).json({ error: 'services must be an array' });
    }

    // サービス構造の基本検証
    for (const service of services) {
      if (!service.name || !service.description) {
        return res.status(400).json({
          error: 'Each service must have name and description'
        });
      }
    }

    // NPCかどうか確認
    const npc = await characterModel.findById(id);
    if (!npc || npc.character_type !== 'NPC') {
      return res.status(404).json({ error: 'NPC not found' });
    }

    const database = characterModel['db'].getDatabase();
    const stmt = database.prepare(`
      UPDATE npc_details 
      SET services = ? 
      WHERE character_id = ?
    `);
    
    const result = stmt.run(JSON.stringify(services), id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Failed to update services' });
    }

    res.json({ message: 'Services updated successfully' });
  } catch (error) {
    console.error('Error updating services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 職業更新
router.patch('/:id/occupation', async (req, res) => {
  try {
    const { id } = req.params;
    const { occupation } = req.body;

    if (!occupation || typeof occupation !== 'string') {
      return res.status(400).json({ error: 'Valid occupation is required' });
    }

    // NPCかどうか確認
    const npc = await characterModel.findById(id);
    if (!npc || npc.character_type !== 'NPC') {
      return res.status(404).json({ error: 'NPC not found' });
    }

    const database = characterModel['db'].getDatabase();
    const stmt = database.prepare(`
      UPDATE npc_details 
      SET occupation = ? 
      WHERE character_id = ?
    `);
    
    const result = stmt.run(occupation, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Failed to update occupation' });
    }

    res.json({ message: 'Occupation updated successfully' });
  } catch (error) {
    console.error('Error updating occupation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NPCとの対話記録取得（将来の拡張用）
router.get('/:id/interactions', async (req, res) => {
  try {
    const { id } = req.params;

    // NPCかどうか確認
    const npc = await characterModel.findById(id);
    if (!npc || npc.character_type !== 'NPC') {
      return res.status(404).json({ error: 'NPC not found' });
    }

    // TODO: 将来的に対話記録テーブルを実装
    // 現在は空配列を返す
    res.json({ interactions: [] });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
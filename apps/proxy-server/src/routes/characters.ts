// キャラクター管理API
import express from 'express';
import { CharacterModel } from '../db/models/Character.js';
import { TRPGCharacter, CharacterStats, Skill, Equipment } from '@novel-ai-assistant/types';

const router = express.Router();
const characterModel = new CharacterModel();

// キャラクター一覧取得（キャンペーン別）
router.get('/', async (req, res) => {
  try {
    const { campaignId, characterType, playerId } = req.query;

    if (!campaignId && !playerId) {
      return res.status(400).json({ 
        error: 'campaignId or playerId parameter required' 
      });
    }

    let characters;

    if (playerId) {
      characters = await characterModel.findByPlayer(playerId as string);
    } else {
      characters = await characterModel.findByCampaign(
        campaignId as string, 
        characterType as 'PC' | 'NPC' | 'Enemy'
      );
    }

    // JSON文字列をパース
    const parsedCharacters = characters.map(char => ({
      ...char,
      stats: JSON.parse(char.stats),
      skills: char.skills ? JSON.parse(char.skills) : [],
      equipment: char.equipment ? JSON.parse(char.equipment) : []
    }));

    res.json({ characters: parsedCharacters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャラクター詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const character = await characterModel.findById(id);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // JSON文字列をパース
    const parsedCharacter = {
      ...character,
      stats: JSON.parse(character.stats),
      skills: character.skills ? JSON.parse(character.skills) : [],
      equipment: character.equipment ? JSON.parse(character.equipment) : []
    };

    // キャラクタータイプ別の詳細情報を取得
    if (character.character_type === 'NPC') {
      const npcDetails = await characterModel.getNPCDetails(id);
      if (npcDetails) {
        parsedCharacter.npcDetails = {
          ...npcDetails,
          knowledge: JSON.parse(npcDetails.knowledge || '[]'),
          services: JSON.parse(npcDetails.services || '[]')
        };
      }
    } else if (character.character_type === 'Enemy') {
      const enemyDetails = await characterModel.getEnemyDetails(id);
      if (enemyDetails) {
        parsedCharacter.enemyDetails = {
          ...enemyDetails,
          loot: JSON.parse(enemyDetails.loot || '[]'),
          spawn_locations: JSON.parse(enemyDetails.spawn_locations || '[]')
        };
      }
    }

    // 進歩記録も取得
    const progression = await characterModel.getProgression(id);
    parsedCharacter.progression = progression.map(p => ({
      ...p,
      stat_changes: p.stat_changes ? JSON.parse(p.stat_changes) : null,
      new_skills: p.new_skills ? JSON.parse(p.new_skills) : []
    }));

    res.json({ character: parsedCharacter });
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャラクター作成
router.post('/', async (req, res) => {
  try {
    const characterData = req.body as Partial<TRPGCharacter> & {
      campaignId: string;
      name: string;
      characterType: 'PC' | 'NPC' | 'Enemy';
      stats: CharacterStats;
    };

    // 必須フィールドの検証
    if (!characterData.campaignId || !characterData.name || 
        !characterData.characterType || !characterData.stats) {
      return res.status(400).json({ 
        error: 'Missing required fields: campaignId, name, characterType, stats' 
      });
    }

    // ステータスの基本検証
    const stats = characterData.stats;
    if (!stats.hitPoints || typeof stats.hitPoints.max !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid stats: hitPoints.max is required' 
      });
    }

    const characterId = await characterModel.create(characterData);

    res.status(201).json({
      id: characterId,
      message: 'Character created successfully'
    });
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャラクター更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // IDフィールドは更新から除外
    delete updates.id;
    delete updates.created_at;

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
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'Character updated successfully' });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャラクター削除（論理削除）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await characterModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HPアップデート
router.patch('/:id/hp', async (req, res) => {
  try {
    const { id } = req.params;
    const { current, max, temp } = req.body;

    if (typeof current !== 'number') {
      return res.status(400).json({ error: 'current HP is required and must be a number' });
    }

    const updated = await characterModel.updateHP(id, current, max, temp);

    if (!updated) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'HP updated successfully' });
  } catch (error) {
    console.error('Error updating HP:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 経験値追加
router.patch('/:id/experience', async (req, res) => {
  try {
    const { id } = req.params;
    const { experience, sessionId } = req.body;

    if (typeof experience !== 'number' || experience <= 0) {
      return res.status(400).json({ 
        error: 'experience must be a positive number' 
      });
    }

    const updated = await characterModel.addExperience(id, experience, sessionId);

    if (!updated) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'Experience added successfully' });
  } catch (error) {
    console.error('Error adding experience:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// スキル更新
router.patch('/:id/skills', async (req, res) => {
  try {
    const { id } = req.params;
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'skills must be an array' });
    }

    const updated = await characterModel.updateSkills(id, skills);

    if (!updated) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'Skills updated successfully' });
  } catch (error) {
    console.error('Error updating skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 装備更新
router.patch('/:id/equipment', async (req, res) => {
  try {
    const { id } = req.params;
    const { equipment } = req.body;

    if (!Array.isArray(equipment)) {
      return res.status(400).json({ error: 'equipment must be an array' });
    }

    const updated = await characterModel.updateEquipment(id, equipment);

    if (!updated) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ message: 'Equipment updated successfully' });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 進歩記録取得
router.get('/:id/progression', async (req, res) => {
  try {
    const { id } = req.params;
    const progression = await characterModel.getProgression(id);

    const parsedProgression = progression.map(p => ({
      ...p,
      stat_changes: p.stat_changes ? JSON.parse(p.stat_changes) : null,
      new_skills: p.new_skills ? JSON.parse(p.new_skills) : []
    }));

    res.json({ progression: parsedProgression });
  } catch (error) {
    console.error('Error fetching progression:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
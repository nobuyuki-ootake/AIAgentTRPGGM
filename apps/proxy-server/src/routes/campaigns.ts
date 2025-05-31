// キャンペーン管理API
import express from 'express';
import { CampaignModel } from '../db/models/Campaign.js';
import { TRPGCampaign, CampaignMetadata } from '@novel-ai-assistant/types';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const campaignModel = new CampaignModel();

// キャンペーン一覧取得
router.get('/', async (req, res) => {
  try {
    const { gamemaster, player } = req.query;
    let campaigns;

    if (gamemaster) {
      campaigns = await campaignModel.findByGamemaster(gamemaster as string);
    } else if (player) {
      campaigns = await campaignModel.findByPlayer(player as string);
    } else {
      return res.status(400).json({ error: 'gamemaster or player parameter required' });
    }

    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャンペーン詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await campaignModel.findById(id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // プレイヤー情報も取得
    const players = await campaignModel.getPlayers(id);

    res.json({
      campaign: {
        ...campaign,
        players
      }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャンペーン作成
router.post('/', async (req, res) => {
  try {
    const campaignData = req.body as Partial<TRPGCampaign> & {
      gamemaster: string;
      title: string;
      gameSystem: string;
    };

    // 必須フィールドの検証
    if (!campaignData.title || !campaignData.gameSystem || !campaignData.gamemaster) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, gameSystem, gamemaster' 
      });
    }

    const campaignId = await campaignModel.create(campaignData);

    res.status(201).json({
      id: campaignId,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャンペーン更新
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // IDフィールドは更新から除外
    delete updates.id;
    delete updates.created_at;

    const updated = await campaignModel.update(id, updates);

    if (!updated) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign updated successfully' });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャンペーン削除
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await campaignModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// プレイヤー追加
router.post('/:id/players', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'player' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const added = await campaignModel.addPlayer(id, userId, role);

    if (!added) {
      return res.status(400).json({ error: 'Player already in campaign or campaign not found' });
    }

    res.json({ message: 'Player added to campaign successfully' });
  } catch (error) {
    console.error('Error adding player to campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// プレイヤー削除
router.delete('/:id/players/:playerId', async (req, res) => {
  try {
    const { id, playerId } = req.params;
    const removed = await campaignModel.removePlayer(id, playerId);

    if (!removed) {
      return res.status(404).json({ error: 'Player not found in campaign' });
    }

    res.json({ message: 'Player removed from campaign successfully' });
  } catch (error) {
    console.error('Error removing player from campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// キャンペーンステータス更新
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['planning', 'active', 'paused', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    const updated = await campaignModel.updateStatus(id, status);

    if (!updated) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign status updated successfully' });
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// プレイ時間追加
router.patch('/:id/playtime', async (req, res) => {
  try {
    const { id } = req.params;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
      return res.status(400).json({ error: 'Valid minutes value is required' });
    }

    const updated = await campaignModel.addPlayTime(id, minutes);

    if (!updated) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Play time updated successfully' });
  } catch (error) {
    console.error('Error updating play time:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
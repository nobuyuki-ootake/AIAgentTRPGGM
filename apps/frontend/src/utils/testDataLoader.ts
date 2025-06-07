import { testCampaignData } from '../data/testCampaignData';
import { TRPGCampaign } from '@trpg-ai-gm/types';
import { TRPGLocalStorageManager } from './trpgLocalStorage';

/**
 * テストキャンペーンデータをロード
 */
export const loadTestCampaignData = (): TRPGCampaign => {
  return testCampaignData;
};

/**
 * テストデータをlocalStorageに設定
 */
export const applyTestDataToLocalStorage = (): void => {
  const testData = loadTestCampaignData();
  
  // basesデータはそのまま使用（TypeScript版では既に正しい構造）
  const processedTestData = testData;
  
  // TRPGLocalStorageManagerを使って正しく保存
  TRPGLocalStorageManager.saveCampaign(processedTestData);
  TRPGLocalStorageManager.setCurrentCampaignId(processedTestData.id);
  
  
  console.log('✅ テストデータを適用しました:', {
    id: processedTestData.id,
    title: processedTestData.title,
    characters: processedTestData.characters?.length,
    npcs: processedTestData.npcs?.length,
    enemies: processedTestData.enemies?.length,
    plot: processedTestData.plot?.length,
    bases: processedTestData.bases?.length,
    worldBuilding: processedTestData.worldBuilding ? 'present' : 'missing'
  });
  
  // 詳細ログを出力してデータ内容を確認
  console.log('📝 キャラクターデータ詳細:', processedTestData.characters?.map(c => ({ 
    id: c.id, 
    name: c.name, 
    characterType: c.characterType 
  })));
  
  console.log('🏢 拠点データ詳細:', processedTestData.bases?.map(b => ({ 
    id: b.id, 
    name: b.name, 
    type: b.type 
  })));
};

/**
 * 現在のデータがテストデータかどうかを確認
 */
export const isTestCampaign = (campaignId: string): boolean => {
  const testData = loadTestCampaignData();
  return campaignId === testData.id;
};

/**
 * テストデータをクリア（完全削除）
 */
export const clearTestData = (): void => {
  const testData = loadTestCampaignData();
  
  // TRPGLocalStorageManagerを使って正しく削除
  TRPGLocalStorageManager.deleteCampaign(testData.id);
  
  
  console.log('✅ テストデータをクリアしました');
};

/**
 * テストデータの一部を更新（開発用）
 * 注意：この関数は開発時の一時的な変更用で、永続的な変更はJSONファイルを直接編集すること
 */
export const updateTestDataTemporary = (updates: Partial<TRPGCampaign>): void => {
  const currentCampaign = JSON.parse(localStorage.getItem('currentCampaign') || '{}');
  
  if (!isTestCampaign(currentCampaign.id)) {
    console.warn('⚠️ 現在のキャンペーンはテストデータではありません');
    return;
  }
  
  const updatedCampaign = {
    ...currentCampaign,
    ...updates
  };
  
  localStorage.setItem('currentCampaign', JSON.stringify(updatedCampaign));
  console.log('📝 テストデータを一時的に更新しました（リロードで元に戻ります）');
};

/**
 * テストデータのサマリーを取得
 */
export const getTestDataSummary = () => {
  const testData = loadTestCampaignData();
  return {
    title: testData.title,
    description: testData.synopsis,
    gameSystem: testData.gameSystem,
    characters: testData.characters?.map(c => ({ id: c.id, name: c.name, profession: c.profession })),
    npcs: testData.npcs?.map(n => ({ id: n.id, name: n.name, occupation: n.occupation })),
    enemies: testData.enemies?.map(e => ({ id: e.id, name: e.name, rank: e.rank })),
    plot: testData.plot?.map(q => ({ id: q.id, title: q.title, order: q.order })),
    locations: testData.bases?.map(b => ({ id: b.id, name: b.name }))
  };
};

/**
 * テスト用の場所データを取得
 */
export const getTestLocationOptions = () => {
  const testData = loadTestCampaignData();
  const bases = testData.bases || [];
  
  return bases.map(base => ({
    id: base.id,
    name: base.name,
    description: base.description,
    dangerLevel: base.threats?.dangerLevel || '低'
  }));
};

/**
 * テスト用の拠点データを取得（詳細版）
 */
export const getTestBases = () => {
  const testData = loadTestCampaignData();
  return testData.bases || [];
};
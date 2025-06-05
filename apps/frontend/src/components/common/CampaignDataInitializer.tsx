import React, { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { currentCampaignState } from "../../store/atoms";
import { TRPGLocalStorageManager } from "../../utils/trpgLocalStorage";
import { loadTestCampaignData, applyTestDataToLocalStorage } from "../../utils/testDataLoader";

/**
 * アプリ起動時にキャンペーンデータを初期化するコンポーネント
 */
const CampaignDataInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const setCurrentCampaign = useSetRecoilState(currentCampaignState);

  useEffect(() => {
    const initializeCampaignData = () => {
      console.log('🔄 キャンペーンデータ初期化開始...');
      
      // 強制的にテストデータを読み込み（開発用）
      console.log('🧪 テストデータを強制適用中...');
      const testData = loadTestCampaignData();
      
      // まず、Recoilに直接設定
      setCurrentCampaign(testData);
      console.log('✅ Recoilにテストデータを直接設定:', {
        id: testData.id,
        title: testData.title,
        charactersCount: testData.characters?.length || 0,
        npcsCount: testData.npcs?.length || 0,
        enemiesCount: testData.enemies?.length || 0,
        questsCount: testData.quests?.length || 0,
        basesCount: testData.worldBuilding?.bases?.length || 0
      });
      
      // localStorageにも保存
      try {
        applyTestDataToLocalStorage();
        console.log('💾 localStorageにもテストデータを保存しました');
      } catch (error) {
        console.error('❌ localStorage保存エラー:', error);
      }
      
      return; // 常にテストデータを使用
      
      // 以下は通常の初期化ロジック（現在は使用しない）
      // localStorageから現在のキャンペーンIDを取得
      let currentCampaignId = TRPGLocalStorageManager.getCurrentCampaignId();
      
      // 互換性のため、旧形式のlocalStorageもチェック
      if (!currentCampaignId) {
        currentCampaignId = localStorage.getItem('currentCampaignId');
      }
      
      // 現在のキャンペーンデータを読み込み
      if (currentCampaignId) {
        let campaign = TRPGLocalStorageManager.loadCampaign(currentCampaignId);
        
        // 新形式で見つからない場合、旧形式をチェック
        if (!campaign) {
          const legacyCampaignData = localStorage.getItem('currentCampaign');
          if (legacyCampaignData) {
            try {
              campaign = JSON.parse(legacyCampaignData);
              console.log('📄 旧形式のキャンペーンデータを発見:', campaign?.title);
            } catch (error) {
              console.error('❌ 旧形式のキャンペーンデータ解析エラー:', error);
            }
          }
        }
        
        if (campaign) {
          setCurrentCampaign(campaign);
          console.log('✅ キャンペーンデータを読み込みました:', {
            id: campaign.id,
            title: campaign.title,
            charactersCount: campaign.characters?.length || 0,
            npcsCount: campaign.npcs?.length || 0,
            enemiesCount: campaign.enemies?.length || 0
          });
          return;
        }
      }
      
      console.log('📋 キャンペーンデータがありません。初期状態に設定します。');
      setCurrentCampaign(null);
    };

    initializeCampaignData();
  }, [setCurrentCampaign]);

  return <>{children}</>;
};

export default CampaignDataInitializer;
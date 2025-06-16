// @ts-nocheck
import React, { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { currentCampaignState } from "../../store/atoms";
import { TRPGLocalStorageManager } from "../../utils/trpgLocalStorage";
import {
  loadTestCampaignData,
  applyTestDataToLocalStorage,
} from "../../utils/testDataLoader";

/**
 * アプリ起動時にキャンペーンデータを初期化するコンポーネント
 *
 * 初期化の優先順位:
 * 1. localStorageに保存されているキャンペーンデータ
 * 2. テストデータ（localStorageが空の場合のみ）
 */
const CampaignDataInitializer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setCurrentCampaign = useSetRecoilState(currentCampaignState);

  useEffect(() => {
    const initializeCampaignData = () => {
      console.log("🔄 キャンペーンデータ初期化開始...");

      // 1. まずlocalStorageからキャンペーンデータを読み込み試行
      const currentCampaignId = TRPGLocalStorageManager.getCurrentCampaignId();

      if (currentCampaignId) {
        const campaign =
          TRPGLocalStorageManager.loadCampaign(currentCampaignId);

        if (campaign) {
          setCurrentCampaign(campaign);
          console.log(
            "✅ localStorageからキャンペーンデータを読み込みました:",
            {
              id: campaign.id,
              title: campaign.title,
              charactersCount: campaign.characters?.length || 0,
              npcsCount: campaign.npcs?.length || 0,
              enemiesCount: campaign.enemies?.length || 0,
              questsCount: campaign.quests?.length || 0,
              milestonesCount: campaign.milestones?.length || 0,
              randomEventPoolsCount: campaign.randomEventPools?.length || 0,
            },
          );
          return;
        }
      }

      // 2. localStorageにデータがない場合、開発環境ではテストデータを使用
      if (process.env.NODE_ENV === "development") {
        console.log("🧪 localStorageが空のため、テストデータを読み込みます");
        const testData = loadTestCampaignData();

        // Recoilに設定
        setCurrentCampaign(testData);

        // localStorageにも保存（今後の読み込みのため）
        try {
          applyTestDataToLocalStorage();
          console.log("💾 テストデータをlocalStorageに保存しました");
        } catch (error) {
          console.error("❌ localStorage保存エラー:", error);
        }

        console.log("✅ テストデータを読み込みました:", {
          id: testData.id,
          title: testData.title,
          charactersCount: testData.characters?.length || 0,
          npcsCount: testData.npcs?.length || 0,
          enemiesCount: testData.enemies?.length || 0,
          questsCount: testData.quests?.length || 0,
          milestonesCount: testData.milestones?.length || 0,
        });
        return;
      }

      // 3. プロダクション環境でデータがない場合
      console.log("📋 キャンペーンデータがありません。初期状態に設定します。");
      setCurrentCampaign(null);
    };

    initializeCampaignData();
  }, [setCurrentCampaign]);

  return <>{children}</>;
};

export default CampaignDataInitializer;

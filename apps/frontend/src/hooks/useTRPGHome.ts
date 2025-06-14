import { useState, useEffect, useCallback } from "react";
import { useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { currentCampaignState } from "../store/atoms";
import { TRPGCampaign } from "@trpg-ai-gm/types";
import { TRPGLocalStorageManager } from "../utils/trpgLocalStorage";

export function useTRPGHome() {
  const [campaigns, setCampaigns] = useState<Array<{
    id: string;
    title: string;
    updatedAt: string;
    summary?: string;
  }>>([]);
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [newCampaignTitle, setNewCampaignTitle] = useState("");
  const [newCampaignSummary, setNewCampaignSummary] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化処理
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      // 初期データのセットアップ
      TRPGLocalStorageManager.setupInitialData();
      
      // キャンペーンリストを読み込み
      const campaignList = TRPGLocalStorageManager.getCampaignList();
      setCampaigns(campaignList);
      
      // 現在のキャンペーンを読み込み
      const currentCampaignId = TRPGLocalStorageManager.getCurrentCampaignId();
      if (currentCampaignId) {
        const campaign = TRPGLocalStorageManager.loadCampaign(currentCampaignId);
        if (campaign) {
          setCurrentCampaign(campaign);
        } else {
          // キャンペーンが見つからない場合はクリア
          TRPGLocalStorageManager.setCurrentCampaignId(null);
        }
      }
      
      setIsLoading(false);
    };

    initializeData();
  }, [setCurrentCampaign]);

  // キャンペーンリストを更新
  const refreshCampaigns = useCallback(() => {
    const campaignList = TRPGLocalStorageManager.getCampaignList();
    setCampaigns(campaignList);
  }, []);

  // 新規キャンペーン作成ダイアログを開く
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  // 新規キャンペーン作成ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNewCampaignTitle("");
    setNewCampaignSummary("");
  };

  // 新規キャンペーン作成
  const handleCreateCampaign = () => {
    if (!newCampaignTitle.trim()) return;

    const newCampaign: TRPGCampaign = {
      id: uuidv4(),
      title: newCampaignTitle.trim(),
      synopsis: newCampaignSummary.trim() || "新しいTRPGキャンペーン",
      gameSystem: "オリジナル",
      gamemaster: "",
      players: [],
      characters: [],
      npcs: [],
      enemies: [],
      worldBuilding: {
        id: uuidv4(),
        setting: [],
        rules: [],
        places: [],
        cultures: [],
        geographyEnvironment: [],
        historyLegend: [],
        magicTechnology: [],
        freeFields: [],
        worldmaps: [],
        stateDefinition: [],
        worldMapImageUrl: "",
      },
      timeline: [],
      sessions: [],
      quests: [],
      bases: [],
      items: [],
      itemLocations: [],
      rules: [],
      handouts: [],
      feedback: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // ローカルストレージに保存
    const success = TRPGLocalStorageManager.saveCampaign(newCampaign);
    
    if (success) {
      refreshCampaigns();
      handleCloseDialog();
      
      // 作成したキャンペーンを選択
      handleSelectCampaign(newCampaign.id);
    } else {
      console.error("キャンペーンの作成に失敗しました。");
      // エラー状態をセットして、呼び出し元でハンドリングできるようにする
    }
  };

  // キャンペーンを選択
  const handleSelectCampaign = (campaignId: string) => {
    const campaign = TRPGLocalStorageManager.loadCampaign(campaignId);
    if (campaign) {
      setCurrentCampaign(campaign);
      TRPGLocalStorageManager.setCurrentCampaignId(campaignId);
    }
  };

  // 削除確認ダイアログを開く
  const handleOpenDeleteDialog = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  // 削除確認ダイアログを閉じる
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
  };

  // キャンペーンを削除
  const handleDeleteCampaign = () => {
    if (!campaignToDelete) return;

    const success = TRPGLocalStorageManager.deleteCampaign(campaignToDelete);
    
    if (success) {
      refreshCampaigns();
      
      // 削除したキャンペーンが現在選択中の場合はクリア
      if (currentCampaign?.id === campaignToDelete) {
        setCurrentCampaign(null);
      }
    } else {
      console.error("キャンペーンの削除に失敗しました。");
      // エラー状態をセットして、呼び出し元でハンドリングできるようにする
    }
    
    handleCloseDeleteDialog();
  };

  // キャンペーンを保存
  const updateAndSaveCurrentCampaign = useCallback((campaignToSave: TRPGCampaign | null) => {
    if (!campaignToSave) return;

    const success = TRPGLocalStorageManager.saveCampaign(campaignToSave);
    
    if (success) {
      setCurrentCampaign(campaignToSave);
      refreshCampaigns();
    } else {
      console.error("キャンペーンの保存に失敗しました");
    }
  }, [setCurrentCampaign, refreshCampaigns]);

  // ホームに戻る（キャンペーンの選択を解除）
  const handleReturnToHome = () => {
    setCurrentCampaign(null);
    TRPGLocalStorageManager.setCurrentCampaignId(null);
  };

  return {
    campaigns,
    currentCampaign,
    newCampaignTitle,
    setNewCampaignTitle,
    newCampaignSummary,
    setNewCampaignSummary,
    dialogOpen,
    deleteDialogOpen,
    campaignToDelete,
    isLoading,
    handleOpenDialog,
    handleCloseDialog,
    handleCreateCampaign,
    handleSelectCampaign,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteCampaign,
    updateAndSaveCurrentCampaign,
    handleReturnToHome,
    refreshCampaigns,
  };
}
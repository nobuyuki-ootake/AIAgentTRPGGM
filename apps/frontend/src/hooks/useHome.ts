import { useState, useEffect, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { currentCampaignState } from "../store/atoms";
import { TRPGCampaign, CampaignStatus } from "@trpg-ai-gm/types";
// import { LocalStorageManager } from "../utils/localStorage"; // 未使用のためコメントアウト

export function useHome() {
  const [campaigns, setCampaigns] = useState<TRPGCampaign[]>([]);
  const currentCampaign = useRecoilValue(currentCampaignState);
  const [, setCurrentCampaignStateSetter] = useRecoilState(currentCampaignState);
  const [newCampaignTitle, setNewCampaignTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  // ローカルストレージからキャンペーン一覧を取得
  useEffect(() => {
    const savedCampaigns = localStorage.getItem("trpgCampaigns");
    if (savedCampaigns) {
      setCampaigns(JSON.parse(savedCampaigns));
    }
  }, []);

  // キャンペーン一覧を保存
  const saveCampaigns = (updatedCampaigns: TRPGCampaign[]) => {
    localStorage.setItem("trpgCampaigns", JSON.stringify(updatedCampaigns));
    setCampaigns(updatedCampaigns);
  };

  // 新規プロジェクト作成ダイアログを開く
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  // 新規キャンペーン作成ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNewCampaignTitle("");
  };

  // 新規キャンペーン作成
  const handleCreateCampaign = () => {
    if (!newCampaignTitle.trim()) return;

    const newCampaign: TRPGCampaign = {
      id: uuidv4(),
      title: newCampaignTitle.trim(),
      gameSystem: "Stormbringer",
      gamemaster: "",
      players: [],
      sessions: [],
      bases: [],
      enemies: [],
      npcs: [],
      items: [],
      itemLocations: [],
      // quests: [],
      // events: [],
      rules: [],
      handouts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      synopsis: "",
      quests: [],
      characters: [],
      worldBuilding: {
        id: uuidv4(),
        setting: [],
        rules: [],
        places: [],
        cultures: [],
        historyLegend: [],
        geographyEnvironment: [],
        magicTechnology: [],
        freeFields: [],
        stateDefinition: [],
        worldmaps: [],
      },
      timeline: [],
      // chapters: [],
      feedback: [],
      definedCharacterStatuses: [],
      metadata: {
        version: "1.0.0",
        status: "planning" as CampaignStatus,
        genre: [],
        tags: [],
        difficulty: "intermediate",
        targetPlayers: { min: 3, max: 5 },
        lastBackupDate: undefined,
      },
      notes: [],
    };

    const updatedCampaigns = [...campaigns, newCampaign];
    saveCampaigns(updatedCampaigns);

    // 新規キャンペーンを選択
    setCurrentCampaignStateSetter(newCampaign);
    localStorage.setItem("currentCampaignId", newCampaign.id);

    handleCloseDialog();
  };

  // キャンペーン選択
  const handleSelectCampaign = (campaign: TRPGCampaign) => {
    setCurrentCampaignStateSetter(campaign);
    localStorage.setItem("currentCampaignId", campaign.id);
  };

  // 削除確認ダイアログを開く
  const handleOpenDeleteDialog = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCampaignToDelete(id);
    setDeleteDialogOpen(true);
  };

  // 削除確認ダイアログを閉じる
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
  };

  // キャンペーン削除
  const handleDeleteCampaign = () => {
    if (!campaignToDelete) return;

    const updatedCampaigns = campaigns.filter(
      (campaign) => campaign.id !== campaignToDelete
    );
    saveCampaigns(updatedCampaigns);
    handleCloseDeleteDialog();
  };

  // 現在のキャンペーンデータをlocalStorageに保存する関数
  const updateAndSaveCurrentCampaign = useCallback(
    (campaignToSave: TRPGCampaign | null) => {
      if (!campaignToSave) return;

      const savedCampaignsString = localStorage.getItem("trpgCampaigns");
      let campaignsToUpdate: TRPGCampaign[] = [];
      if (savedCampaignsString) {
        campaignsToUpdate = JSON.parse(savedCampaignsString);
      }

      const campaignIndex = campaignsToUpdate.findIndex(
        (c) => c.id === campaignToSave.id
      );

      if (campaignIndex !== -1) {
        campaignsToUpdate[campaignIndex] = campaignToSave;
      } else {
        // もしキャンペーンリストに存在しない場合（通常はありえないが念のため）、新しいキャンペーンとして追加
        campaignsToUpdate.push(campaignToSave);
      }

      localStorage.setItem("trpgCampaigns", JSON.stringify(campaignsToUpdate));
      setCampaigns(campaignsToUpdate); // ローカルのcampaignsステートも更新
      console.log(
        "[DEBUG] Campaign saved to localStorage:",
        campaignToSave.title
      );
    },
    [] // 依存配列は空でOK (localStorage と campaigns ステートの更新のみのため)
  );

  return {
    campaigns,
    currentCampaign,
    newCampaignTitle,
    setNewCampaignTitle,
    dialogOpen,
    deleteDialogOpen,
    handleOpenDialog,
    handleCloseDialog,
    handleCreateCampaign,
    handleSelectCampaign,
    handleOpenDeleteDialog,
    handleCloseDeleteDialog,
    handleDeleteCampaign,
    updateAndSaveCurrentCampaign,
  };
}

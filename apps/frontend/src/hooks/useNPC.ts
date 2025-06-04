import { useState, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentCampaignState } from "../store/atoms";
import { NPCCharacter, StormbringerWeapon, StormbringerSkill } from "@trpg-ai-gm/types";
import { v4 as uuidv4 } from "uuid";

export const useNPC = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NPC一覧を取得
  const npcs = currentCampaign?.npcs || [];

  // 新しいNPCを作成
  const createNPC = useCallback(async (npcData: Omit<NPCCharacter, "id" | "created_at" | "updated_at">) => {
    if (!currentCampaign) {
      setError("キャンペーンが選択されていません");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newNPC: NPCCharacter = {
        ...npcData,
        id: uuidv4(),
        campaignId: currentCampaign.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedCampaign = {
        ...currentCampaign,
        npcs: [...npcs, newNPC],
      };

      setCurrentCampaign(updatedCampaign);
      return newNPC;
    } catch (err) {
      setError(err instanceof Error ? err.message : "NPCの作成に失敗しました");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign, npcs, setCurrentCampaign]);

  // NPCを更新
  const updateNPC = useCallback(async (npcId: string, updates: Partial<NPCCharacter>) => {
    if (!currentCampaign) {
      setError("キャンペーンが選択されていません");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedNPCs = npcs.map(npc =>
        npc.id === npcId
          ? { ...npc, ...updates, updated_at: new Date().toISOString() }
          : npc
      );

      const updatedCampaign = {
        ...currentCampaign,
        npcs: updatedNPCs,
      };

      setCurrentCampaign(updatedCampaign);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "NPCの更新に失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign, npcs, setCurrentCampaign]);

  // NPCを削除
  const deleteNPC = useCallback(async (npcId: string) => {
    if (!currentCampaign) {
      setError("キャンペーンが選択されていません");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedNPCs = npcs.filter(npc => npc.id !== npcId);

      const updatedCampaign = {
        ...currentCampaign,
        npcs: updatedNPCs,
      };

      setCurrentCampaign(updatedCampaign);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "NPCの削除に失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign, npcs, setCurrentCampaign]);

  // 特定のNPCを取得
  const getNPCById = useCallback((npcId: string): NPCCharacter | undefined => {
    return npcs.find(npc => npc.id === npcId);
  }, [npcs]);

  // 場所別のNPC取得
  const getNPCsByLocation = useCallback((location: string): NPCCharacter[] => {
    return npcs.filter(npc => npc.location === location);
  }, [npcs]);

  // 職業別のNPC取得
  const getNPCsByOccupation = useCallback((occupation: string): NPCCharacter[] => {
    return npcs.filter(npc => npc.occupation === occupation);
  }, [npcs]);

  // 態度別のNPC取得
  const getNPCsByAttitude = useCallback((attitude: NPCCharacter["attitude"]): NPCCharacter[] => {
    return npcs.filter(npc => npc.attitude === attitude);
  }, [npcs]);

  // クエスト関連のNPC取得
  const getNPCsWithQuests = useCallback((): NPCCharacter[] => {
    return npcs.filter(npc => npc.questIds && npc.questIds.length > 0);
  }, [npcs]);

  // 特定サービス提供のNPC取得
  const getNPCsByService = useCallback((service: string): NPCCharacter[] => {
    return npcs.filter(npc => npc.services && npc.services.includes(service));
  }, [npcs]);

  // NPCの基本テンプレート生成
  const createNPCTemplate = useCallback((occupation?: string): Omit<NPCCharacter, "id" | "created_at" | "updated_at"> => {
    const baseSkills: Record<string, StormbringerSkill[]> = {
      AgilitySkills: [
        { name: "Climb", value: 25 },
        { name: "Jump", value: 25 },
        { name: "Dodge", value: 30 },
        { name: "Swim", value: 25 },
        { name: "Ride", value: 20 },
      ],
      CommunicationSkills: [
        { name: "Fast Talk", value: 25 },
        { name: "Persuade", value: 15 },
        { name: "Bargain", value: 20 },
        { name: "Oratory", value: 10 },
        { name: "Language", value: 40 },
      ],
      KnowledgeSkills: [
        { name: "History", value: 15 },
        { name: "Law", value: 10 },
        { name: "Theology", value: 10 },
        { name: "Natural World", value: 20 },
        { name: "Occult", value: 5 },
      ],
      ManipulationSkills: [
        { name: "Craft", value: 20 },
        { name: "Disguise", value: 10 },
        { name: "Locksmith", value: 5 },
        { name: "Sleight of Hand", value: 10 },
        { name: "Forgery", value: 5 },
      ],
      PerceptionSkills: [
        { name: "Spot Hidden", value: 25 },
        { name: "Listen", value: 25 },
        { name: "Track", value: 10 },
        { name: "Sense", value: 20 },
        { name: "Insight", value: 15 },
      ],
      StealthSkills: [
        { name: "Hide", value: 15 },
        { name: "Sneak", value: 15 },
        { name: "Shadowing", value: 10 },
        { name: "Camouflage", value: 10 },
        { name: "Silent Movement", value: 15 },
      ],
      MagicSkills: [
        { name: "Spellcasting", value: 5 },
        { name: "Ritual", value: 5 },
        { name: "Alchemy", value: 5 },
        { name: "Summoning", value: 0 },
        { name: "Enchanting", value: 0 },
      ],
      WeaponSkills: [
        { name: "Sword", value: 20 },
        { name: "Axe", value: 15 },
        { name: "Bow", value: 15 },
        { name: "Spear", value: 15 },
        { name: "Shield", value: 15 },
      ],
    };

    const baseTemplate: Omit<NPCCharacter, "id" | "created_at" | "updated_at"> = {
      name: "",
      characterType: "NPC",
      profession: occupation || "一般人",
      gender: "不明",
      age: 30,
      nation: "不明",
      religion: "不明",
      player: "GM",
      description: "",
      scars: "",
      attributes: {
        STR: 10,
        CON: 10,
        SIZ: 10,
        INT: 10,
        POW: 10,
        DEX: 10,
        CHA: 10,
      },
      derived: {
        HP: 10,
        MP: 10,
        SW: 10,
        RES: 10,
      },
      weapons: [],
      armor: {
        head: 0,
        body: 0,
        leftArm: 0,
        rightArm: 0,
        leftLeg: 0,
        rightLeg: 0,
      },
      skills: baseSkills,
      location: "",
      occupation: occupation || "一般人",
      attitude: "neutral",
      knowledge: [],
      services: [],
      questIds: [],
      dialoguePatterns: [],
    };

    // 職業に応じた調整
    switch (occupation) {
      case "商人":
        return {
          ...baseTemplate,
          attributes: { ...baseTemplate.attributes, CHA: 14, INT: 12 },
          skills: {
            ...baseTemplate.skills,
            CommunicationSkills: baseTemplate.skills.CommunicationSkills.map(skill =>
              skill.name === "Bargain" ? { ...skill, value: 60 } :
              skill.name === "Persuade" ? { ...skill, value: 45 } :
              skill.name === "Fast Talk" ? { ...skill, value: 40 } : skill
            ),
            KnowledgeSkills: [...baseTemplate.skills.KnowledgeSkills, { name: "Market", value: 50 }],
          },
          services: ["物品販売", "情報収集", "価格査定"],
        };

      case "鍛冶屋":
        return {
          ...baseTemplate,
          attributes: { ...baseTemplate.attributes, STR: 14, CON: 12 },
          skills: {
            ...baseTemplate.skills,
            ManipulationSkills: baseTemplate.skills.ManipulationSkills.map(skill =>
              skill.name === "Craft" ? { ...skill, value: 70 } : skill
            ),
          },
          services: ["武器製作", "武器修理", "装備強化"],
        };

      case "僧侶":
        return {
          ...baseTemplate,
          attributes: { ...baseTemplate.attributes, POW: 14, CHA: 12 },
          skills: {
            ...baseTemplate.skills,
            KnowledgeSkills: baseTemplate.skills.KnowledgeSkills.map(skill =>
              skill.name === "Theology" ? { ...skill, value: 60 } : skill
            ),
            MagicSkills: baseTemplate.skills.MagicSkills.map(skill =>
              skill.name === "Spellcasting" ? { ...skill, value: 40 } :
              skill.name === "Ritual" ? { ...skill, value: 50 } : skill
            ),
          },
          services: ["回復", "状態異常治療", "祝福"],
        };

      case "盗賊":
        return {
          ...baseTemplate,
          attributes: { ...baseTemplate.attributes, DEX: 14, INT: 12 },
          skills: {
            ...baseTemplate.skills,
            StealthSkills: baseTemplate.skills.StealthSkills.map(skill => ({ ...skill, value: skill.value + 20 })),
            ManipulationSkills: baseTemplate.skills.ManipulationSkills.map(skill =>
              skill.name === "Locksmith" ? { ...skill, value: 50 } :
              skill.name === "Sleight of Hand" ? { ...skill, value: 45 } : skill
            ),
          },
          services: ["鍵開け", "罠解除", "情報収集"],
        };

      default:
        return baseTemplate;
    }
  }, []);

  return {
    npcs,
    isLoading,
    error,
    createNPC,
    updateNPC,
    deleteNPC,
    getNPCById,
    getNPCsByLocation,
    getNPCsByOccupation,
    getNPCsByAttitude,
    getNPCsWithQuests,
    getNPCsByService,
    createNPCTemplate,
  };
};
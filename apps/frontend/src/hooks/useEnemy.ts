import { useState, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentCampaignState } from "../store/atoms";
import { EnemyCharacter } from "@novel-ai-assistant/types";
import { v4 as uuidv4 } from "uuid";

export const useEnemy = () => {
  const [currentCampaign, setCurrentCampaign] = useRecoilState(currentCampaignState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 敵キャラクター一覧を取得
  const enemies = currentCampaign?.enemies || [];

  // 新しい敵キャラクターを作成
  const createEnemy = useCallback(async (enemyData: Omit<EnemyCharacter, "id" | "created_at" | "updated_at">) => {
    if (!currentCampaign) {
      setError("キャンペーンが選択されていません");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newEnemy: EnemyCharacter = {
        ...enemyData,
        id: uuidv4(),
        campaignId: currentCampaign.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedCampaign = {
        ...currentCampaign,
        enemies: [...enemies, newEnemy],
      };

      setCurrentCampaign(updatedCampaign);
      return newEnemy;
    } catch (err) {
      setError(err instanceof Error ? err.message : "敵キャラクターの作成に失敗しました");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign, enemies, setCurrentCampaign]);

  // 敵キャラクターを更新
  const updateEnemy = useCallback(async (enemyId: string, updates: Partial<EnemyCharacter>) => {
    if (!currentCampaign) {
      setError("キャンペーンが選択されていません");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedEnemies = enemies.map(enemy =>
        enemy.id === enemyId
          ? { ...enemy, ...updates, updated_at: new Date().toISOString() }
          : enemy
      );

      const updatedCampaign = {
        ...currentCampaign,
        enemies: updatedEnemies,
      };

      setCurrentCampaign(updatedCampaign);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "敵キャラクターの更新に失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign, enemies, setCurrentCampaign]);

  // 敵キャラクターを削除
  const deleteEnemy = useCallback(async (enemyId: string) => {
    if (!currentCampaign) {
      setError("キャンペーンが選択されていません");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedEnemies = enemies.filter(enemy => enemy.id !== enemyId);

      const updatedCampaign = {
        ...currentCampaign,
        enemies: updatedEnemies,
      };

      setCurrentCampaign(updatedCampaign);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "敵キャラクターの削除に失敗しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentCampaign, enemies, setCurrentCampaign]);

  // 特定の敵キャラクターを取得
  const getEnemyById = useCallback((enemyId: string): EnemyCharacter | undefined => {
    return enemies.find(enemy => enemy.id === enemyId);
  }, [enemies]);

  // ランク別の敵キャラクター取得
  const getEnemiesByRank = useCallback((rank: EnemyCharacter["rank"]): EnemyCharacter[] => {
    return enemies.filter(enemy => enemy.rank === rank);
  }, [enemies]);

  // 場所別の敵キャラクター取得
  const getEnemiesByLocation = useCallback((location: string): EnemyCharacter[] => {
    return enemies.filter(enemy => enemy.status.location === location);
  }, [enemies]);

  // レベル範囲での敵キャラクター取得
  const getEnemiesByLevelRange = useCallback((minLevel: number, maxLevel: number): EnemyCharacter[] => {
    return enemies.filter(enemy => enemy.level >= minLevel && enemy.level <= maxLevel);
  }, [enemies]);

  // 敵キャラクターのHP/MP更新（戦闘中）
  const updateEnemyStatus = useCallback(async (enemyId: string, statusUpdates: Partial<EnemyCharacter["status"]>) => {
    return updateEnemy(enemyId, { status: { ...getEnemyById(enemyId)?.status, ...statusUpdates } });
  }, [updateEnemy, getEnemyById]);

  // 敵キャラクターの基本テンプレート生成
  const createEnemyTemplate = useCallback((rank: EnemyCharacter["rank"]): Omit<EnemyCharacter, "id" | "created_at" | "updated_at"> => {
    const baseTemplate = {
      name: "",
      rank,
      type: "",
      description: "",
      level: 1,
      attributes: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
      },
      derivedStats: {
        hp: 20,
        mp: 10,
        attack: 15,
        defense: 10,
        magicAttack: 10,
        magicDefense: 10,
        accuracy: 70,
        evasion: 10,
        criticalRate: 5,
        initiative: 10,
      },
      skills: {
        basicAttack: "通常攻撃",
        specialSkills: [],
        passives: [],
      },
      behavior: {
        aiPattern: "基本的な攻撃パターン",
        targeting: "最も近い敵を攻撃",
      },
      drops: {
        exp: 10,
        gold: 5,
        items: [],
        rareDrops: [],
      },
      status: {
        currentHp: 20,
        currentMp: 10,
        statusEffects: [],
        location: "",
      },
    };

    // ランクに応じた調整
    switch (rank) {
      case "モブ":
        return {
          ...baseTemplate,
          level: 1,
          derivedStats: { ...baseTemplate.derivedStats, hp: 15, attack: 10 },
          drops: { ...baseTemplate.drops, exp: 5, gold: 2 },
          status: { ...baseTemplate.status, currentHp: 15 },
        };
      case "中ボス":
        return {
          ...baseTemplate,
          level: 5,
          derivedStats: { ...baseTemplate.derivedStats, hp: 50, attack: 25, defense: 15 },
          drops: { ...baseTemplate.drops, exp: 50, gold: 25 },
          status: { ...baseTemplate.status, currentHp: 50 },
        };
      case "ボス":
        return {
          ...baseTemplate,
          level: 10,
          derivedStats: { ...baseTemplate.derivedStats, hp: 150, attack: 40, defense: 25 },
          drops: { ...baseTemplate.drops, exp: 200, gold: 100 },
          status: { ...baseTemplate.status, currentHp: 150 },
        };
      case "EXボス":
        return {
          ...baseTemplate,
          level: 15,
          derivedStats: { ...baseTemplate.derivedStats, hp: 300, attack: 60, defense: 35 },
          drops: { ...baseTemplate.drops, exp: 500, gold: 250 },
          status: { ...baseTemplate.status, currentHp: 300 },
        };
      default:
        return baseTemplate;
    }
  }, []);

  return {
    enemies,
    isLoading,
    error,
    createEnemy,
    updateEnemy,
    deleteEnemy,
    getEnemyById,
    getEnemiesByRank,
    getEnemiesByLocation,
    getEnemiesByLevelRange,
    updateEnemyStatus,
    createEnemyTemplate,
  };
};
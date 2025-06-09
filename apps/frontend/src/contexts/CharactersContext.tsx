import React, { createContext, useContext, ReactNode } from "react";
import { useCharacters } from "../hooks/useCharacters";
import { useRecoilValue } from "recoil";
import {
  TRPGCharacter,
  TRPGCampaign,
  CustomField,
  CharacterStatus,
} from "@trpg-ai-gm/types";
import { currentCampaignState } from "../store/atoms";

// コンテキストで提供する値の型定義
interface CharactersContextType {
  // TRPGキャラクター状態
  characters: TRPGCharacter[];
  viewMode: "grid" | "list";
  openDialog: boolean;
  editMode: boolean;
  formData: TRPGCharacter;
  formErrors: Record<string, string>;
  tempImageUrl: string;
  selectedEmoji: string;
  newTrait: string;
  newCustomField: CustomField;
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: "success" | "error" | "info" | "warning";
  currentProject: TRPGCampaign | null; // 現在のキャンペーン情報

  // アクション
  handleViewModeChange: (
    event: React.MouseEvent<HTMLElement>,
    newMode: "grid" | "list" | null
  ) => void;
  handleOpenDialog: (characterId?: string) => void;
  handleEditCharacter: (character: TRPGCharacter) => void;
  handleCloseDialog: () => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEmojiSelect: (emoji: string) => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (e: { target: { name: string; value: string } }) => void;
  handleAddTrait: () => void;
  handleRemoveTrait: (index: number) => void;
  handleNewTraitChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCustomFieldChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleAddCustomField: () => void;
  handleRemoveCustomField: (id: string) => void;
  handleDeleteCharacter: (id: string) => void;
  handleSaveCharacter: () => void;
  handleCloseSnackbar: () => void;
  handleSaveStatus: (status: CharacterStatus) => void;
  handleDeleteStatus: (statusId: string) => void;
  addCharacter: (character: TRPGCharacter) => void;
  handleTemplateApplied: (template: any, character: Partial<TRPGCharacter>) => void;

  // TRPGアシスト機能
  parseAIResponseToCharacters: (response: string) => TRPGCharacter[];
  getPCs: () => TRPGCharacter[];
  getNPCs: () => TRPGCharacter[];
  getEnemies: () => TRPGCharacter[];
}

// コンテキストの作成
const CharactersContext = createContext<CharactersContextType | undefined>(
  undefined
);

// プロバイダーコンポーネント
export const CharactersProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const currentProject = useRecoilValue(currentCampaignState);

  // useCharactersフックからキャラクター関連のロジックを取得
  const {
    characters,
    viewMode,
    openDialog,
    editMode,
    formData,
    formErrors,
    tempImageUrl,
    selectedEmoji,
    newTrait,
    newCustomField,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    handleViewModeChange,
    handleOpenDialog,
    handleEditCharacter,
    handleCloseDialog,
    handleImageUpload,
    handleEmojiSelect,
    handleInputChange,
    handleSelectChange,
    handleAddTrait,
    handleRemoveTrait,
    handleNewTraitChange,
    handleCustomFieldChange,
    handleAddCustomField,
    handleRemoveCustomField,
    handleDeleteCharacter,
    handleSaveCharacter,
    handleCloseSnackbar,
    handleSaveStatus,
    handleDeleteStatus,
    addCharacter,
    parseAIResponseToCharacters,
    getPCs,
    getNPCs,
    getEnemies,
  } = useCharacters();

  // ゲームシステムテンプレート適用ハンドラー
  const handleTemplateApplied = (template: any, character: Partial<TRPGCharacter>) => {
    // テンプレートのデータをformDataに適用
    const templateData: Partial<TRPGCharacter> = {
      // 基本情報
      profession: (character as any).class || (character as any).profession || "",
      // 能力値の適用 - Stormbringer形式
      attributes: {
        ...formData.attributes,
        ...(character as any).stats,
      },
      // スキルの適用
      skills: (character as any).skills || formData.skills || {} as any,
    };

    // 各フィールドを個別に更新
    Object.entries(templateData).forEach(([key, value]) => {
      if (key === "stats" && value && typeof value === "object") {
        // 能力値は個別に処理
        Object.entries(value).forEach(([statKey, statValue]) => {
          if (statValue !== undefined) {
            handleInputChange({
              target: {
                name: `stats.${statKey}`,
                value: statValue,
              }
            } as React.ChangeEvent<HTMLInputElement>);
          }
        });
      } else if (key === "skills" && typeof value === "object") {
        // スキルはオブジェクトとして処理
        handleSelectChange({
          target: {
            name: "skills",
            value: value as any,
          }
        });
      } else if (value !== undefined && key !== "stats" && key !== "skills") {
        // その他のフィールド
        handleInputChange({
          target: {
            name: key,
            value: value,
          }
        } as React.ChangeEvent<HTMLInputElement>);
      }
    });
  };

  // コンテキストで提供する値
  const value: CharactersContextType = {
    // キャラクター状態と関数
    characters,
    viewMode,
    openDialog,
    editMode,
    formData,
    formErrors,
    tempImageUrl,
    selectedEmoji,
    newTrait,
    newCustomField,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    currentProject,
    handleViewModeChange,
    handleOpenDialog,
    handleEditCharacter,
    handleCloseDialog,
    handleImageUpload,
    handleEmojiSelect,
    handleInputChange,
    handleSelectChange,
    handleAddTrait,
    handleRemoveTrait,
    handleNewTraitChange,
    handleCustomFieldChange,
    handleAddCustomField,
    handleRemoveCustomField,
    handleDeleteCharacter,
    handleSaveCharacter,
    handleCloseSnackbar,
    handleSaveStatus,
    handleDeleteStatus,
    addCharacter,
    handleTemplateApplied,

    // TRPGアシスト関連
    parseAIResponseToCharacters,
    getPCs,
    getNPCs,
    getEnemies,
  };

  return (
    <CharactersContext.Provider value={value}>
      {children}
    </CharactersContext.Provider>
  );
};

// カスタムフック
export const useCharactersContext = () => {
  const context = useContext(CharactersContext);
  if (context === undefined) {
    throw new Error(
      "useCharactersContext must be used within a CharactersProvider"
    );
  }
  return context;
};

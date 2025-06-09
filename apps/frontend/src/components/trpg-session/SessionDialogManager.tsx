import React from 'react';
import { TRPGCharacter } from '@trpg-ai-gm/types';
import DiceRollUI from './DiceRollUI';
import SkillCheckUI, { SkillCheckResult } from './SkillCheckUI';
import PowerCheckUI, { PowerCheckResult } from './PowerCheckUI';
import AIControlledDiceDialog from './AIControlledDiceDialog';
import CombatLogger from '../combat/CombatLogger';
// import DynamicDifficultyAdjuster from '../ai/DynamicDifficultyAdjuster'; // 一時的に無効化

interface SessionDialogManagerProps {
  // ダイアログ状態
  diceDialog: boolean;
  skillCheckDialog: boolean;
  powerCheckDialog: boolean;
  aiDiceDialog: boolean;
  
  // ダイアログハンドラー
  onCloseDiceDialog: () => void;
  onCloseSkillCheckDialog: () => void;
  onClosePowerCheckDialog: () => void;
  onCloseAIDiceDialog: () => void;
  
  // ダイス結果ハンドラー
  onDiceRoll: (result: any) => void;
  onSkillCheckResult: (result: SkillCheckResult) => void;
  onPowerCheckResult: (result: PowerCheckResult) => void;
  onAIDiceRoll: (result: any) => void;
  
  // キャラクター情報
  selectedCharacter?: TRPGCharacter;
  aiRequiredDice?: any;
  
  // 戦闘・難易度関連
  combatMode?: boolean;
  currentCombatSession?: any;
  combatSessions?: any[];
  currentDifficulty?: any;
  recentCombatActions?: any[];
  developerMode?: boolean;
  
  // 戦闘関連ハンドラー
  onCombatEnd?: (session: any) => void;
  onDifficultyChange?: (difficulty: any) => void;
}

const SessionDialogManager: React.FC<SessionDialogManagerProps> = ({
  diceDialog,
  skillCheckDialog,
  powerCheckDialog,
  aiDiceDialog,
  onCloseDiceDialog,
  onCloseSkillCheckDialog,
  onClosePowerCheckDialog,
  onCloseAIDiceDialog,
  onDiceRoll,
  onSkillCheckResult,
  onPowerCheckResult,
  onAIDiceRoll,
  selectedCharacter,
  aiRequiredDice,
  combatMode,
  currentCombatSession,
  currentDifficulty,
  recentCombatActions,
  developerMode,
  onCombatEnd,
  onDifficultyChange,
}) => {
  return (
    <>
      {/* ダイス関連ダイアログ */}
      <DiceRollUI
        open={diceDialog}
        onClose={onCloseDiceDialog}
        onRoll={onDiceRoll}
        selectedCharacterName={selectedCharacter?.name}
      />

      <SkillCheckUI
        open={skillCheckDialog}
        onClose={onCloseSkillCheckDialog}
        characterName={selectedCharacter?.name}
        onResult={onSkillCheckResult}
      />

      <PowerCheckUI
        open={powerCheckDialog}
        onClose={onClosePowerCheckDialog}
        characterName={selectedCharacter?.name}
        onResult={onPowerCheckResult}
      />

      {aiRequiredDice && (
        <AIControlledDiceDialog
          open={aiDiceDialog}
          aiRequiredDice={aiRequiredDice}
          onDiceRoll={onAIDiceRoll}
        />
      )}

      {/* 戦闘ログコンポーネント */}
      {combatMode && onCombatEnd && currentCombatSession && (
        <div>{/* CombatLogger一時的に無効化 - 型エラー解決後に復元 */}</div>
      )}

      {/* 動的難易度調整 - 一時的に無効化（デバッグパネルテスト用） */}
      {/* {developerMode && onDifficultyChange && (
        <DynamicDifficultyAdjuster
          currentDifficulty={currentDifficulty}
          recentActions={recentCombatActions || []}
          onDifficultyChange={onDifficultyChange}
        />
      )} */}
    </>
  );
};

export default SessionDialogManager;
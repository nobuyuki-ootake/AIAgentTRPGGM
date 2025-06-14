import React from "react";
import { Box, Grid } from "@mui/material";
import {
  useTRPGSessionUI,
  useDebugItemListener,
} from "../hooks/useTRPGSessionUI";
import SessionHeader from "../components/trpg-session/SessionHeader";
import PartyPanel from "../components/trpg-session/PartyPanel";
import MainContentPanel from "../components/trpg-session/MainContentPanel";
import ChatPanel from "../components/trpg-session/ChatPanel";
import SessionDialogManager from "../components/trpg-session/SessionDialogManager";
import StartingLocationDialog from "../components/trpg-session/StartingLocationDialog";
import DebugPanel from "../components/debug/DebugPanel";
import TRPGSessionErrorBoundary from "../components/error/TRPGErrorBoundary";

const TRPGSessionPageContent: React.FC = () => {
  // カスタムフックでビジネスロジックとUI状態を管理
  const {
    // セッションデータ
    currentCampaign,
    developerMode,
    selectedCharacter,
    setSelectedCharacter,
    currentDay,
    actionCount,
    maxActionsPerDay,
    currentLocation,
    combatMode,
    playerCharacters,
    npcs,
    enemies,
    bases,
    availableActions,
    getCurrentBase,
    currentBaseImage,

    // UI状態
    uiState,

    // アクション選択状態
    isAwaitingActionSelection,
    actionSelectionPrompt,

    // 開始場所設定機能
    hasValidStartingLocation,
    handleOpenStartingLocationDialog,
    handleSetStartingLocation,

    // セッションアクション
    executeAction,
    handleExecuteMilestoneAction,
    advanceDay,
    saveSession,
    openAIAssist,
    handleLocationChange,

    // UIアクションハンドラー
    handleOpenDialog,
    handleCloseDialog,
    handleTabChange,
    handleChatInputChange,
    handleSendMessage,
    handleAddSystemMessage,
    handleDiceRoll,
    handleSkillCheckResult,
    handlePowerCheckResult,
    handleAIDiceRoll,
    handleFacilityInteract,

    // デバッグ機能
    toggleDebugPanel,
    debugActions,

    // フラグ管理機能
    getCampaignFlag,
    checkClearConditions,

    // インベントリ管理
    addInventoryItem,
  } = useTRPGSessionUI();

  // デバッグ用のアイテム追加リスナー
  useDebugItemListener(addInventoryItem);

  return (
    <Box
      sx={{
        p: 2,
        height: "100vh", // 画面高さに固定
        maxHeight: "100vh", // 画面高さを超えないよう制限
        bgcolor: "grey.50",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // 全体のスクロールを防ぐ
      }}
    >
      {/* ヘッダー部分 */}
      <SessionHeader
        campaign={currentCampaign || undefined}
        currentLocation={currentLocation}
        currentDay={currentDay}
        actionCount={actionCount}
        maxActionsPerDay={maxActionsPerDay}
        selectedCharacter={selectedCharacter}
        playerCharacters={playerCharacters}
        isSessionStarted={uiState.isSessionStarted}
        developerMode={developerMode}
        showDebugPanel={uiState.showDebugPanel}
        hasValidStartingLocation={hasValidStartingLocation}
        onSaveSession={saveSession}
        onStartAISession={openAIAssist}
        onOpenStartingLocationDialog={handleOpenStartingLocationDialog}
        onToggleDebugPanel={toggleDebugPanel}
      />

      {/* 開始場所表示 - セッション開始前または未設定時に表示 */}
      {(!uiState.isSessionStarted || !currentCampaign?.startingLocation) && (
        <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1, mb: 2 }}>
          {currentCampaign?.startingLocation ? (
            <Box>
              <strong>開始場所:</strong> {currentCampaign.startingLocation.name}
              {currentCampaign.startingLocation.description && (
                <Box component="span" sx={{ ml: 1, color: "text.secondary" }}>
                  - {currentCampaign.startingLocation.description}
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ color: "warning.main" }}>
              開始場所が設定されていません
            </Box>
          )}
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          display: "flex",
          gap: 2,
          minHeight: 0,
          height: "calc(100vh - 120px)", // ヘッダー分を除いた固定高さ
          maxHeight: "calc(100vh - 120px)", // 最大高さも同じに設定
          overflow: "hidden", // 親コンテナでのスクロールを防ぐ
          // デスクトップ: 横並び（1440px以上）
          // タブレット: 横並び（768px-1439px）
          // モバイル: 縦並び（767px以下）
          "@media (max-width: 767px)": {
            flexDirection: "column",
            gap: 1, // モバイルではパネル間のスペースを狭く
            height: "calc(100vh - 140px)", // モバイル用の高さ調整
            maxHeight: "calc(100vh - 140px)",
            overflow: "hidden",
          },
        }}
      >
        {/* 左パネル: キャラクター情報 */}
        <Box
          sx={{
            width: {
              xs: "100%", // モバイル: 全幅
              sm: "280px", // タブレット以上: 固定幅
              md: "300px", // デスクトップ: 少し広く
            },
            flexShrink: 0,
            height: "100%", // 親の高さに合わせる
            minHeight: 0, // フレックス子要素のオーバーフローを防ぐ
          }}
        >
          <PartyPanel
            playerCharacters={playerCharacters}
            npcs={npcs}
            selectedCharacter={selectedCharacter || undefined}
            onSelectCharacter={setSelectedCharacter}
            currentLocation={currentLocation}
            currentLocationImage={currentBaseImage}
            isSessionStarted={uiState.isSessionStarted}
          />
        </Box>

        {/* 中央パネル: チャット・セッションログ（メイン機能） */}
        <Box
          sx={{
            flex: 1,
            minWidth: {
              xs: "100%", // モバイル: 全幅
              sm: "400px", // タブレット以上: 最小幅確保
              md: "450px", // デスクトップ: より広く
            },
            display: "flex",
            height: "100%", // 親の高さに合わせる
            minHeight: 0, // フレックス子要素のオーバーフローを防ぐ
          }}
        >
          <ChatPanel
            chatMessages={uiState.chatMessages}
            chatInput={uiState.chatInput}
            onChatInputChange={handleChatInputChange}
            onSendMessage={handleSendMessage}
            onAddSystemMessage={handleAddSystemMessage}
            onOpenDiceDialog={() => handleOpenDialog("diceDialog")}
            isAwaitingActionSelection={isAwaitingActionSelection}
            actionSelectionPrompt={actionSelectionPrompt}
          />
        </Box>

        {/* 右パネル: 行動・拠点情報・ステータス */}
        <Box
          sx={{
            width: {
              xs: "100%", // モバイル: 全幅
              sm: "380px", // タブレット: 固定幅
              md: "420px", // デスクトップ: より広く
              lg: "480px", // 大画面: 最大幅
            },
            flexShrink: 0,
            height: "100%", // 親の高さに合わせる
            minHeight: 0, // フレックス子要素のオーバーフローを防ぐ
          }}
        >
          <MainContentPanel
            currentLocation={currentLocation}
            currentBaseImage={currentBaseImage}
            availableActions={availableActions}
            actionCount={actionCount}
            maxActionsPerDay={maxActionsPerDay}
            currentBase={getCurrentBase()}
            enemies={enemies}
            npcs={npcs}
            selectedCharacter={selectedCharacter || undefined}
            bases={bases}
            currentCampaign={currentCampaign}
            isSessionStarted={uiState.sessionStatus === "active"}
            getCampaignFlag={getCampaignFlag}
            onExecuteAction={executeAction}
            onExecuteMilestoneAction={handleExecuteMilestoneAction}
            onAdvanceDay={advanceDay}
            onFacilityInteract={handleFacilityInteract}
            onLocationChange={handleLocationChange}
            onAttackEnemies={(selectedEnemies) => {
              console.log("攻撃対象:", selectedEnemies);
              // TODO: 攻撃処理の実装
            }}
          />
        </Box>
      </Box>

      {/* ダイアログ管理 */}
      <SessionDialogManager
        diceDialog={uiState.diceDialog}
        skillCheckDialog={uiState.skillCheckDialog}
        powerCheckDialog={uiState.powerCheckDialog}
        aiDiceDialog={uiState.aiDiceDialog}
        onCloseDiceDialog={() => handleCloseDialog("diceDialog")}
        onCloseSkillCheckDialog={() => handleCloseDialog("skillCheckDialog")}
        onClosePowerCheckDialog={() => handleCloseDialog("powerCheckDialog")}
        onCloseAIDiceDialog={() => handleCloseDialog("aiDiceDialog")}
        onDiceRoll={handleDiceRoll}
        onSkillCheckResult={handleSkillCheckResult}
        onPowerCheckResult={handlePowerCheckResult}
        onAIDiceRoll={handleAIDiceRoll}
        selectedCharacter={selectedCharacter || undefined}
        aiRequiredDice={uiState.aiRequiredDice}
        combatMode={combatMode}
        currentCombatSession={uiState.currentCombatSession}
        currentDifficulty={uiState.currentDifficulty}
        recentCombatActions={uiState.recentCombatActions}
        developerMode={developerMode}
        onCombatEnd={(session) => {
          // 戦闘セッション終了ハンドラー（必要に応じて実装）
          console.log("Combat ended:", session);
        }}
        onDifficultyChange={(difficulty) => {
          // 難易度変更ハンドラー（必要に応じて実装）
          console.log("Difficulty changed:", difficulty);
        }}
      />

      {/* 開始場所設定ダイアログ */}
      <StartingLocationDialog
        open={uiState.startingLocationDialog}
        onClose={() => handleCloseDialog("startingLocationDialog")}
        bases={bases}
        currentStartingLocation={currentCampaign?.startingLocation}
        onSetStartingLocation={handleSetStartingLocation}
      />

      {/* デバッグパネル */}
      {developerMode && uiState.showDebugPanel && (
        <DebugPanel
          currentCampaign={currentCampaign}
          playerCharacters={playerCharacters}
          npcs={npcs}
          enemies={enemies}
          selectedCharacter={selectedCharacter}
          currentLocation={currentLocation}
          currentDay={currentDay}
          actionCount={actionCount}
          maxActionsPerDay={maxActionsPerDay}
          isSessionStarted={uiState.isSessionStarted}
          checkClearConditions={checkClearConditions}
          onCheckEncounters={debugActions.checkEncounters}
          onSimulateEnemyMovement={debugActions.simulateEnemyMovement}
          onReloadTestData={debugActions.reloadTestData}
          onLoadEmptyCampaign={debugActions.loadEmptyCampaign}
          onExportDebugLog={debugActions.exportDebugLog}
          onClose={toggleDebugPanel}
          onOpenDiceDialog={() => handleOpenDialog("diceDialog")}
          onOpenSkillCheckDialog={() => handleOpenDialog("skillCheckDialog")}
          onOpenPowerCheckDialog={() => handleOpenDialog("powerCheckDialog")}
          lastDiceResult={uiState.lastDiceResult}
        />
      )}
    </Box>
  );
};

const TRPGSessionPage: React.FC = () => {
  return (
    <TRPGSessionErrorBoundary>
      <TRPGSessionPageContent />
    </TRPGSessionErrorBoundary>
  );
};

export default TRPGSessionPage;

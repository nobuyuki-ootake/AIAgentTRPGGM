import React from "react";
import {
  Box,
  Grid,
} from "@mui/material";
import { useTRPGSessionUI } from "../hooks/useTRPGSessionUI";
import SessionHeader from "../components/trpg-session/SessionHeader";
import PartyPanel from "../components/trpg-session/PartyPanel";
import MainContentPanel from "../components/trpg-session/MainContentPanel";
import ChatAndDicePanel from "../components/trpg-session/ChatAndDicePanel";
import SessionDialogManager from "../components/trpg-session/SessionDialogManager";
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
    availableActions,
    getCurrentBase,
    currentBaseImage,
    
    // UI状態
    uiState,
    
    // セッションアクション
    executeAction,
    advanceDay,
    saveSession,
    openAIAssist,
    
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
  } = useTRPGSessionUI();

  return (
    <Box sx={{ p: 2, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* ヘッダー部分 */}
      <SessionHeader
        campaign={currentCampaign}
        currentLocation={currentLocation}
        currentDay={currentDay}
        actionCount={actionCount}
        maxActionsPerDay={maxActionsPerDay}
        developerMode={developerMode}
        showDebugPanel={uiState.showDebugPanel}
        onSaveSession={saveSession}
        onOpenAIAssist={openAIAssist}
        onToggleDebugPanel={toggleDebugPanel}
      />

      <Grid container spacing={2}>
        {/* 左パネル: キャラクター情報 */}
        <Grid item xs={12} md={3}>
          <PartyPanel
            playerCharacters={playerCharacters}
            npcs={npcs}
            selectedCharacter={selectedCharacter}
            onSelectCharacter={setSelectedCharacter}
            currentLocation={currentLocation}
            currentLocationImage={currentBaseImage}
          />
        </Grid>

        {/* 中央パネル: チャット・セッションログ（メイン機能） */}
        <Grid item xs={12} md={6}>
          <ChatAndDicePanel
            chatMessages={uiState.chatMessages}
            chatInput={uiState.chatInput}
            onChatInputChange={handleChatInputChange}
            onSendMessage={handleSendMessage}
            onAddSystemMessage={handleAddSystemMessage}
            lastDiceResult={uiState.lastDiceResult}
            onOpenDiceDialog={() => handleOpenDialog('diceDialog')}
            onOpenSkillCheckDialog={() => handleOpenDialog('skillCheckDialog')}
            onOpenPowerCheckDialog={() => handleOpenDialog('powerCheckDialog')}
            selectedCharacter={selectedCharacter}
            rightPanelTab={uiState.rightPanelTab}
            onTabChange={(value) => handleTabChange('rightPanelTab', value)}
          />
        </Grid>

        {/* 右パネル: 行動・拠点情報 */}
        <Grid item xs={12} md={3}>
          <MainContentPanel
            currentLocation={currentLocation}
            currentBaseImage={currentBaseImage}
            availableActions={availableActions}
            actionCount={actionCount}
            maxActionsPerDay={maxActionsPerDay}
            currentBase={getCurrentBase()}
            enemies={enemies}
            selectedCharacter={selectedCharacter}
            onExecuteAction={executeAction}
            onAdvanceDay={advanceDay}
            onFacilityInteract={handleFacilityInteract}
            onAttackEnemies={(selectedEnemies) => {
              console.log('攻撃対象:', selectedEnemies);
              // TODO: 攻撃処理の実装
            }}
          />
        </Grid>
      </Grid>

      {/* ダイアログ管理 */}
      <SessionDialogManager
        diceDialog={uiState.diceDialog}
        skillCheckDialog={uiState.skillCheckDialog}
        powerCheckDialog={uiState.powerCheckDialog}
        aiDiceDialog={uiState.aiDiceDialog}
        onCloseDiceDialog={() => handleCloseDialog('diceDialog')}
        onCloseSkillCheckDialog={() => handleCloseDialog('skillCheckDialog')}
        onClosePowerCheckDialog={() => handleCloseDialog('powerCheckDialog')}
        onCloseAIDiceDialog={() => handleCloseDialog('aiDiceDialog')}
        onDiceRoll={handleDiceRoll}
        onSkillCheckResult={handleSkillCheckResult}
        onPowerCheckResult={handlePowerCheckResult}
        onAIDiceRoll={handleAIDiceRoll}
        selectedCharacter={selectedCharacter}
        aiRequiredDice={uiState.aiRequiredDice}
        combatMode={combatMode}
        currentCombatSession={uiState.currentCombatSession}
        currentDifficulty={uiState.currentDifficulty}
        recentCombatActions={uiState.recentCombatActions}
        developerMode={developerMode}
        onCombatEnd={(session) => {
          // 戦闘セッション終了ハンドラー（必要に応じて実装）
          console.log('Combat ended:', session);
        }}
        onDifficultyChange={(difficulty) => {
          // 難易度変更ハンドラー（必要に応じて実装）
          console.log('Difficulty changed:', difficulty);
        }}
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
          onCheckEncounters={debugActions.checkEncounters}
          onSimulateEnemyMovement={debugActions.simulateEnemyMovement}
          onReloadTestData={debugActions.reloadTestData}
          onLoadEmptyCampaign={debugActions.loadEmptyCampaign}
          onExportDebugLog={debugActions.exportDebugLog}
          onClose={toggleDebugPanel}
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
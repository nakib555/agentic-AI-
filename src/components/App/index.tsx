/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 4 of 4 from src/components/App.tsx
// This is the new main component file.

import React from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { ChatHeader } from '../Chat/ChatHeader';
import { ChatArea } from '../Chat/ChatArea';
import { ThinkingSidebar } from '../Sidebar/ThinkingSidebar';
import { useAppLogic } from './useAppLogic';
import { AppModals } from './AppModals';
import {
  DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS
} from './constants';

export const App = () => {
  const logic = useAppLogic();

  return (
    <div className="flex h-screen bg-transparent overflow-hidden">
      <Sidebar 
        isOpen={logic.isSidebarOpen} 
        setIsOpen={logic.setIsSidebarOpen}
        isCollapsed={logic.isSidebarCollapsed}
        setIsCollapsed={logic.handleSetSidebarCollapsed}
        width={logic.sidebarWidth}
        setWidth={logic.handleSetSidebarWidth}
        isResizing={logic.isResizing}
        setIsResizing={logic.setIsResizing}
        history={logic.chatHistory}
        currentChatId={logic.currentChatId}
        onNewChat={logic.startNewChat}
        onLoadChat={logic.loadChat}
        onDeleteChat={logic.deleteChat}
        onClearAllChats={logic.clearAllChats}
        onUpdateChatTitle={logic.updateChatTitle}
        theme={logic.theme}
        setTheme={logic.setTheme}
        onSettingsClick={() => logic.setIsSettingsOpen(true)}
      />

      <div className={`flex flex-1 min-w-0 ${logic.isResizing || logic.isThinkingResizing ? 'pointer-events-none' : ''}`}>
        <main className="flex-1 flex flex-col overflow-hidden chat-background min-w-0">
          <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto min-h-0">
             <ChatHeader 
                setIsSidebarOpen={logic.setIsSidebarOpen}
                isSidebarCollapsed={logic.isSidebarCollapsed}
                setIsSidebarCollapsed={logic.handleSetSidebarCollapsed}
                onImportChat={logic.handleImportChat}
                onExportChat={logic.handleExportChat}
                onShareChat={() => logic.handleShareChat()}
                isChatActive={logic.isChatActive}
                messages={logic.messages}
                onOpenPinnedModal={() => logic.setIsPinnedModalOpen(true)}
             />
             <ChatArea 
                messageListRef={logic.messageListRef}
                messages={logic.messages}
                isLoading={logic.isLoading}
                sendMessage={logic.sendMessage}
                modelsLoading={logic.modelsLoading}
                onCancel={logic.cancelGeneration}
                ttsVoice={logic.ttsVoice}
                isAutoPlayEnabled={logic.isAutoPlayEnabled}
                currentChatId={logic.currentChatId}
                onTogglePin={logic.toggleMessagePin}
                onShowThinkingProcess={logic.handleShowThinkingProcess}
                approveExecution={logic.approveExecution}
                denyExecution={logic.denyExecution}
             />
          </div>
        </main>

        <ThinkingSidebar
          isOpen={logic.isThinkingSidebarOpen}
          onClose={logic.handleCloseThinkingSidebar}
          message={logic.thinkingMessageForSidebar}
          sendMessage={logic.sendMessage}
          width={logic.thinkingSidebarWidth}
          setWidth={logic.handleSetThinkingSidebarWidth}
          isResizing={logic.isThinkingResizing}
          setIsResizing={logic.setIsThinkingResizing}
        />
      </div>

      <AppModals
        isSettingsOpen={logic.isSettingsOpen}
        setIsSettingsOpen={logic.setIsSettingsOpen}
        isMemoryModalOpen={logic.isMemoryModalOpen}
        setIsMemoryModalOpen={logic.setIsMemoryModalOpen}
        isPinnedModalOpen={logic.isPinnedModalOpen}
        setIsPinnedModalOpen={logic.setIsPinnedModalOpen}
        availableModels={logic.availableModels}
        activeModel={logic.activeModel}
        handleModelChange={logic.handleModelChange}
        modelsLoading={logic.modelsLoading}
        clearAllChats={logic.clearAllChats}
        aboutUser={logic.aboutUser}
        setAboutUser={logic.setAboutUser}
        aboutResponse={logic.aboutResponse}
        setAboutResponse={logic.setAboutResponse}
        temperature={logic.temperature}
        setTemperature={logic.setTemperature}
        maxTokens={logic.maxTokens}
        setMaxTokens={logic.setMaxTokens}
        defaultTemperature={DEFAULT_TEMPERATURE}
        defaultMaxTokens={DEFAULT_MAX_TOKENS}
        isMemoryEnabled={logic.isMemoryEnabled}
        setIsMemoryEnabled={logic.setIsMemoryEnabled}
        memoryContent={logic.memoryContent}
        clearMemory={logic.clearMemory}
        isConfirmationOpen={logic.isConfirmationOpen}
        memorySuggestions={logic.memorySuggestions}
        confirmMemoryUpdate={logic.confirmMemoryUpdate}
        cancelMemoryUpdate={logic.cancelMemoryUpdate}
        ttsVoice={logic.ttsVoice}
        setTtsVoice={logic.setTtsVoice}
        isAutoPlayEnabled={logic.isAutoPlayEnabled}
        setIsAutoPlayEnabled={logic.setIsAutoPlayEnabled}
        messages={logic.messages}
        currentChatId={logic.currentChatId}
        toggleMessagePin={logic.toggleMessagePin}
        handleJumpToMessage={logic.handleJumpToMessage}
      />
    </div>
  );
};
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
import { useAppLogic } from '../../hooks/useAppLogic';
import { AppModals } from './AppModals';
import {
  DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS
} from './constants';
import { TestRunner } from '../Testing';

export const App = () => {
  const logic = useAppLogic();

  const currentChat = logic.currentChatId
    ? logic.chatHistory.find(c => c.id === logic.currentChatId)
    : null;
  const chatTitle = currentChat ? currentChat.title : null;

  return (
    <div ref={logic.appContainerRef} className={`flex h-full bg-transparent overflow-hidden transition-[height] duration-300 ease-in-out ${logic.isResizing || logic.isThinkingResizing ? 'pointer-events-none' : ''}`}>
      <Sidebar
        key={logic.isDesktop ? 'desktop' : 'mobile'}
        isDesktop={logic.isDesktop}
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

      <main className="relative z-10 flex-1 flex flex-col overflow-hidden chat-background min-w-0">
        <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto min-h-0">
           <ChatHeader 
              isDesktop={logic.isDesktop}
              handleToggleSidebar={logic.handleToggleSidebar}
              isSidebarOpen={logic.isSidebarOpen}
              isSidebarCollapsed={logic.isSidebarCollapsed}
              onImportChat={logic.handleImportChat}
              onExportChat={logic.handleExportChat}
              onShareChat={() => logic.handleShareChat()}
              isChatActive={logic.isChatActive}
              chatTitle={chatTitle}
           />
           <ChatArea 
              messageListRef={logic.messageListRef}
              messages={logic.messages}
              isLoading={logic.isLoading || logic.modelsLoading || logic.backendStatus !== 'online'}
              sendMessage={logic.sendMessage}
              modelsLoading={logic.modelsLoading}
              onCancel={logic.cancelGeneration}
              ttsVoice={logic.ttsVoice}
              isAutoPlayEnabled={logic.isAutoPlayEnabled}
              currentChatId={logic.currentChatId}
              onShowThinkingProcess={logic.handleShowThinkingProcess}
              approveExecution={logic.approveExecution}
              denyExecution={logic.denyExecution}
              onRegenerate={logic.regenerateResponse}
              onSetActiveResponseIndex={logic.setActiveResponseIndex}
              isAgentMode={logic.isAgentMode}
              setIsAgentMode={logic.setIsAgentMode}
              backendStatus={logic.backendStatus}
              backendError={logic.backendError}
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
        setIsResizing={logic.setIsResizing}
        onRegenerate={logic.regenerateResponse}
      />

      <AppModals
        isSettingsOpen={logic.isSettingsOpen}
        setIsSettingsOpen={logic.setIsSettingsOpen}
        isMemoryModalOpen={logic.isMemoryModalOpen}
        setIsMemoryModalOpen={logic.setIsMemoryModalOpen}
        onRunTests={() => logic.setIsTestMode(true)}
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
        imageModel={logic.imageModel}
        onImageModelChange={logic.setImageModel}
        videoModel={logic.videoModel}
        onVideoModelChange={logic.setVideoModel}
        defaultTemperature={DEFAULT_TEMPERATURE}
        defaultMaxTokens={DEFAULT_MAX_TOKENS}
        isMemoryEnabled={logic.isMemoryEnabled}
        setIsMemoryEnabled={logic.setIsMemoryEnabled}
        onManageMemory={() => logic.setIsMemoryModalOpen(true)}
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
      />

      {logic.isTestMode && (
          <TestRunner 
              isOpen={logic.isTestMode}
              onClose={() => logic.setIsTestMode(false)}
              runTests={logic.runDiagnosticTests}
          />
      )}
    </div>
  );
};
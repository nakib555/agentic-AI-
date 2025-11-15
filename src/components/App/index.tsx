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
// Fix: The MessageForm component was refactored into its own directory.
// The import path is updated to point to the new barrel file.
import { MessageForm } from '../Chat/MessageForm/index';
import {
  DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS
} from './constants';
import { TestRunner } from '../Testing';

export const App = () => {
  const logic = useAppLogic();
  const messageFormRef = React.useRef(null);

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
        // FIX: Pass a no-argument function to `onNewChat` to match the expected type.
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
              messageFormRef={messageFormRef}
           />
        </div>
        <MessageForm 
          ref={messageFormRef}
          onSubmit={logic.sendMessage} 
          isLoading={logic.isLoading || logic.modelsLoading} 
          onCancel={logic.cancelGeneration}
          isAgentMode={logic.isAgentMode}
          setIsAgentMode={logic.setIsAgentMode}
        />
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
        // FIX: Pass setIsTestMode to the onRunTests prop.
        onRunTests={() => logic.setIsTestMode(true)}
        availableModels={logic.availableModels}
        activeModel={logic.activeModel}
        handleModelChange={logic.handleModelChange}
        modelsLoading={logic.modelsLoading}
        clearAllChats={logic.clearAllChats}
        // FIX: Pass apiKey and setApiKey to the modal.
        apiKey={logic.apiKey}
        onSaveApiKey={logic.setApiKey}
        aboutUser={logic.aboutUser}
        setAboutUser={logic.setAboutUser}
        aboutResponse={logic.aboutResponse}
        setAboutResponse={logic.setAboutResponse}
        temperature={logic.temperature}
        setTemperature={logic.setTemperature}
        maxTokens={logic.maxTokens}
        setMaxTokens={logic.setMaxTokens}
        imageModel={logic.imageModel}
        setImageModel={logic.setImageModel}
        videoModel={logic.videoModel}
        setVideoModel={logic.setVideoModel}
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

      {/* FIX: Use isTestMode from logic to conditionally render the TestRunner. */}
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
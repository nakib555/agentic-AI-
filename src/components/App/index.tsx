
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { ChatHeader } from '../Chat/ChatHeader';
import { ChatArea } from '../Chat/ChatArea';
import { useAppLogic } from './useAppLogic';
import {
  DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS
} from './constants';
import { VersionMismatchOverlay } from '../UI/VersionMismatchOverlay';

// Lazy load secondary components to reduce initial bundle size
const SourcesSidebar = React.lazy(() => import('../AI/SourcesSidebar').then(module => ({ default: module.SourcesSidebar })));
const AppModals = React.lazy(() => import('./AppModals').then(module => ({ default: module.AppModals })));
const TestRunner = React.lazy(() => import('../Testing').then(module => ({ default: module.TestRunner })));

export const App = () => {
  const logic = useAppLogic();

  const currentChat = logic.currentChatId
    ? logic.chatHistory.find(c => c.id === logic.currentChatId)
    : null;
  const chatTitle = currentChat ? currentChat.title : null;

  return (
    <div ref={logic.appContainerRef} className={`flex h-full w-full bg-transparent overflow-hidden transition-[height] duration-300 ease-in-out ${logic.isResizing ? 'pointer-events-none' : ''}`}>
      {logic.versionMismatch && <VersionMismatchOverlay />}
      
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
        isHistoryLoading={logic.isHistoryLoading}
        currentChatId={logic.currentChatId}
        onNewChat={logic.startNewChat}
        isNewChatDisabled={logic.isNewChatDisabled}
        onLoadChat={logic.loadChat}
        onDeleteChat={logic.handleDeleteChatRequest}
        onUpdateChatTitle={logic.updateChatTitle}
        onSettingsClick={() => logic.setIsSettingsOpen(true)}
      />

      <main className="relative z-10 flex-1 flex flex-col overflow-hidden chat-background min-w-0">
        <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto min-h-0">
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
              isLoading={logic.isLoading}
              isAppLoading={logic.modelsLoading || logic.settingsLoading}
              sendMessage={logic.sendMessage}
              onCancel={logic.cancelGeneration}
              ttsVoice={logic.ttsVoice}
              isAutoPlayEnabled={logic.isAutoPlayEnabled}
              currentChatId={logic.currentChatId}
              onShowSources={logic.handleShowSources}
              approveExecution={logic.approveExecution}
              denyExecution={logic.denyExecution}
              onRegenerate={logic.regenerateResponse}
              onSetActiveResponseIndex={logic.setActiveResponseIndex}
              isAgentMode={logic.isAgentMode}
              setIsAgentMode={logic.setIsAgentMode}
              backendStatus={logic.backendStatus}
              backendError={logic.backendError}
              hasApiKey={!!logic.apiKey}
           />
        </div>
      </main>

      <Suspense fallback={null}>
        {logic.isSourcesSidebarOpen && (
          <SourcesSidebar
            isOpen={logic.isSourcesSidebarOpen}
            onClose={logic.handleCloseSourcesSidebar}
            sources={logic.sourcesForSidebar}
            width={logic.sourcesSidebarWidth}
            setWidth={logic.handleSetSourcesSidebarWidth}
            isResizing={logic.isSourcesResizing}
            setIsResizing={logic.setIsSourcesResizing}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <AppModals
          isSettingsOpen={logic.isSettingsOpen}
          setIsSettingsOpen={logic.setIsSettingsOpen}
          isMemoryModalOpen={logic.isMemoryModalOpen}
          setIsMemoryModalOpen={logic.setIsMemoryModalOpen}
          isImportModalOpen={logic.isImportModalOpen}
          setIsImportModalOpen={logic.setIsImportModalOpen}
          handleFileUploadForImport={logic.handleFileUploadForImport}
          onRunTests={() => logic.setIsTestMode(true)}
          onDownloadLogs={logic.handleDownloadLogs}
          onShowDataStructure={logic.handleShowDataStructure}
          availableModels={logic.availableModels}
          availableImageModels={logic.availableImageModels}
          availableVideoModels={logic.availableVideoModels}
          activeModel={logic.activeModel}
          onModelChange={logic.onModelChange}
          modelsLoading={logic.modelsLoading || logic.settingsLoading}
          clearAllChats={logic.clearAllChats}
          apiKey={logic.apiKey}
          onSaveApiKey={logic.onSaveApiKey}
          aboutUser={logic.aboutUser}
          setAboutUser={logic.setAboutUser}
          aboutResponse={logic.aboutResponse}
          setAboutResponse={logic.setAboutResponse}
          temperature={logic.temperature}
          setTemperature={logic.setTemperature}
          maxTokens={logic.maxTokens}
          setMaxTokens={logic.setMaxTokens}
          imageModel={logic.imageModel}
          onImageModelChange={logic.onImageModelChange}
          videoModel={logic.videoModel}
          onVideoModelChange={logic.onVideoModelChange}
          defaultTemperature={DEFAULT_TEMPERATURE}
          defaultMaxTokens={DEFAULT_MAX_TOKENS}
          isMemoryEnabled={logic.isMemoryEnabled}
          setIsMemoryEnabled={logic.setIsMemoryEnabled}
          onManageMemory={() => logic.setIsMemoryModalOpen(true)}
          memoryContent={logic.memoryContent}
          memoryFiles={logic.memoryFiles}
          clearMemory={logic.clearMemory}
          updateBackendMemory={logic.updateBackendMemory}
          updateMemoryFiles={logic.updateMemoryFiles}
          isConfirmationOpen={logic.isConfirmationOpen}
          memorySuggestions={logic.memorySuggestions}
          confirmMemoryUpdate={logic.confirmMemoryUpdate}
          cancelMemoryUpdate={logic.cancelMemoryUpdate}
          ttsVoice={logic.ttsVoice}
          setTtsVoice={logic.setTtsVoice}
          isAutoPlayEnabled={logic.isAutoPlayEnabled}
          setIsAutoPlayEnabled={logic.setIsAutoPlayEnabled}
          confirmation={logic.confirmation}
          onConfirm={logic.handleConfirm}
          onCancel={logic.handleCancel}
          theme={logic.theme}
          setTheme={logic.setTheme}
        />
      </Suspense>

      <Suspense fallback={null}>
        {logic.isTestMode && (
          <TestRunner 
              isOpen={logic.isTestMode}
              onClose={() => logic.setIsTestMode(false)}
              runTests={logic.runDiagnosticTests}
          />
        )}
      </Suspense>
    </div>
  );
};


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { ChatHeader } from '../Chat/ChatHeader';
import { ChatArea } from '../Chat/ChatArea';
import { SourcesSidebar } from '../AI/SourcesSidebar';
import { useAppLogic } from '../../hooks/useAppLogic';
import { AppModals } from './AppModals';
import {
  DEFAULT_TEMPERATURE, DEFAULT_MAX_TOKENS
} from './constants';
import { VersionMismatchOverlay } from '../UI/VersionMismatchOverlay';

// Lazy load the TestRunner to reduce initial bundle size
const TestRunner = React.lazy(() => import('../Testing').then(module => ({ default: module.TestRunner })));

export const App = () => {
  const logic = useAppLogic();

  const currentChat = logic.currentChatId
    ? logic.chatHistory.find(c => c.id === logic.currentChatId)
    : null;
  const chatTitle = currentChat ? currentChat.title : null;

  return (
    <div ref={logic.appContainerRef} className={`flex h-full bg-transparent overflow-hidden transition-[height] duration-300 ease-in-out ${logic.isResizing ? 'pointer-events-none' : ''}`}>
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
        {/* Mobile Sidebar Toggle - Only visible on mobile when sidebar is closed */}
        {!logic.isDesktop && !logic.isSidebarOpen && (
          <button
            onClick={() => logic.setIsSidebarOpen(true)}
            className="absolute top-3 left-4 z-50 p-2 rounded-lg bg-white/80 dark:bg-black/50 backdrop-blur-md border border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-300 shadow-sm"
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        )}

        <div className="flex-1 flex flex-col w-full min-h-0">
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
              ttsModel={logic.ttsModel}
              setTtsVoice={logic.setTtsVoice}
              currentChatId={logic.currentChatId}
              activeModel={logic.activeModel} 
              onShowSources={logic.handleShowSources}
              approveExecution={logic.approveExecution}
              denyExecution={logic.denyExecution}
              onRegenerate={logic.regenerateResponse}
              onSetActiveResponseIndex={logic.setActiveResponseIndex}
              isAgentMode={logic.isAgentMode}
              setIsAgentMode={logic.setIsAgentMode}
              backendStatus={logic.backendStatus}
              backendError={logic.backendError}
              onRetryConnection={logic.retryConnection}
              hasApiKey={!!logic.apiKey}
           />
        </div>
      </main>

      <SourcesSidebar
        isOpen={logic.isSourcesSidebarOpen}
        onClose={logic.handleCloseSourcesSidebar}
        sources={logic.sourcesForSidebar}
        width={logic.sourcesSidebarWidth}
        setWidth={logic.handleSetSourcesSidebarWidth}
        isResizing={logic.isSourcesResizing}
        setIsResizing={logic.setIsSourcesResizing}
      />

      <AppModals
        isDesktop={logic.isDesktop}
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
        availableTtsModels={logic.availableTtsModels}
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
        ttsModel={logic.ttsModel}
        onTtsModelChange={logic.onTtsModelChange}
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
        confirmation={logic.confirmation}
        onConfirm={logic.handleConfirm}
        onCancel={logic.handleCancel}
        theme={logic.theme}
        setTheme={logic.setTheme}
      />

      {logic.isTestMode && (
          <Suspense fallback={null}>
            <TestRunner 
                isOpen={logic.isTestMode}
                onClose={() => logic.setIsTestMode(false)}
                runTests={logic.runDiagnosticTests}
            />
          </Suspense>
      )}
    </div>
  );
};

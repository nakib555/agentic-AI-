/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { loader } from '@monaco-editor/react';
import type { Model } from '../services/modelService';
import { getAvailableModels } from '../services/modelService';
import { useChat } from '../hooks/useChat';
import { useTheme } from '../hooks/useTheme';
import { useSidebar } from '../hooks/useSidebar';
import { Sidebar } from './Sidebar/Sidebar';
import { ChatHeader } from './Chat/ChatHeader';
import { ChatArea } from './Chat/ChatArea';

// Configure the Monaco Editor loader to fetch assets from a CDN.
// This is done once at the top level of the application.
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs'
  }
});

export const App = () => {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [uiSelectedModel, setUiSelectedModel] = useState('');
  
  const { theme, setTheme } = useTheme();
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    handleSetSidebarCollapsed,
    sidebarWidth,
    handleSetSidebarWidth,
  } = useSidebar();

  const { 
    messages, 
    sendMessage, 
    isLoading, 
    chatHistory, 
    currentChatId, 
    startNewChat, 
    loadChat,
    deleteChat,
    clearAllChats,
    cancelGeneration,
  } = useChat(uiSelectedModel);
  

  // Effect to fetch models on startup
  useEffect(() => {
    getAvailableModels().then(models => {
      setAvailableModels(models);
      if (models.length > 0) {
        // Set the default model only after they are loaded
        setUiSelectedModel(models[0].id);
      }
    }).catch(err => {
      console.error("Failed to load models:", err);
      // On error, set to an empty array to signify loading is complete
      setAvailableModels([]);
    }).finally(() => {
      setModelsLoading(false);
    });
  }, []);
  
  // Handler for model selector: changing the model starts a new chat
  const handleModelChange = (modelId: string) => {
    setUiSelectedModel(modelId);
    startNewChat();
  };

  // The model displayed should be the current chat's model, or the selected one for a new chat.
  const activeModel = chatHistory.find(c => c.id === currentChatId)?.model || uiSelectedModel;

  return (
    <div className="flex h-full bg-white dark:bg-[#121212]">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={handleSetSidebarCollapsed}
        width={sidebarWidth}
        setWidth={handleSetSidebarWidth}
        history={chatHistory}
        currentChatId={currentChatId}
        onNewChat={startNewChat}
        onLoadChat={loadChat}
        onDeleteChat={deleteChat}
        onClearAllChats={clearAllChats}
        theme={theme}
        setTheme={setTheme}
      />
      
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            role="button"
            aria-label="Close sidebar"
            tabIndex={0}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden chat-background">
        <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto min-h-0">
           <ChatHeader
              setIsSidebarOpen={setIsSidebarOpen}
              models={availableModels}
              selectedModel={activeModel}
              onModelChange={handleModelChange}
              disabled={modelsLoading}
           />
           <ChatArea 
              messages={messages}
              isLoading={isLoading}
              sendMessage={sendMessage}
              modelsLoading={modelsLoading}
              onCancel={cancelGeneration}
           />
        </div>
      </main>
    </div>
  );
};
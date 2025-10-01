/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useChat } from './hooks/useChat';
import { MessageList } from './components/Chat/MessageList';
import { MessageForm } from './components/Chat/MessageForm';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ModelSelector } from './components/UI/ModelSelector';
import { AnimatePresence, motion } from 'framer-motion';
import { getAvailableModels } from './services/modelService';
import type { Model } from './services/modelService';
import { useTheme } from './hooks/useTheme';
import { useSidebar } from './hooks/useSidebar';
import { FloatingPrompts } from './components/Chat/FloatingPrompts';

const App = () => {
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
    <div className="flex h-screen bg-white dark:bg-slate-900">
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
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 min-h-0">
           {/* Header */}
          <header className="p-4 flex items-center justify-between md:justify-end">
             {/* Hamburger Menu for Mobile */}
             <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              aria-label="Open sidebar"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
             </button>

             <ModelSelector 
                models={availableModels}
                selectedModel={activeModel}
                onModelChange={handleModelChange}
                disabled={modelsLoading}
             />
          </header>
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col pb-4 min-h-0">
            <MessageList messages={messages} />
            <div className="mt-auto pt-4">
              <AnimatePresence>
                {messages.length === 0 && !isLoading && (
                  <FloatingPrompts onPromptClick={sendMessage} />
                )}
              </AnimatePresence>
              <div className="relative">
                <MessageForm onSubmit={sendMessage} isLoading={isLoading || modelsLoading} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
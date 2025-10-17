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
import { SettingsModal } from './Settings/SettingsModal';

// Configure the Monaco Editor loader to fetch assets from a CDN.
// This is done once at the top level of the application.
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs'
  }
});

const DEFAULT_SYSTEM_PROMPT = '';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 0; // 0 or undefined means use model default

export const App = () => {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [uiSelectedModel, setUiSelectedModel] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settings State
  const [systemPrompt, setSystemPrompt] = useState<string>(() => localStorage.getItem('agentic-systemPrompt') || DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState<number>(() => parseFloat(localStorage.getItem('agentic-temperature') || `${DEFAULT_TEMPERATURE}`));
  const [maxTokens, setMaxTokens] = useState<number>(() => parseInt(localStorage.getItem('agentic-maxTokens') || `${DEFAULT_MAX_TOKENS}`, 10));

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
    updateChatModel,
    updateChatSettings,
  } = useChat(uiSelectedModel, { systemPrompt, temperature, maxOutputTokens: maxTokens });
  

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

  // Effect to save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('agentic-systemPrompt', systemPrompt);
    localStorage.setItem('agentic-temperature', String(temperature));
    localStorage.setItem('agentic-maxTokens', String(maxTokens));

    // Also update the settings for the currently active chat session
    if (currentChatId) {
        updateChatSettings(currentChatId, {
            systemPrompt,
            temperature,
            maxOutputTokens: maxTokens,
        });
    }
  }, [systemPrompt, temperature, maxTokens, currentChatId, updateChatSettings]);
  
  // Handler for model selector: updates the model for the current chat or the next new chat.
  const handleModelChange = (modelId: string) => {
    setUiSelectedModel(modelId);
    if (currentChatId) {
        updateChatModel(currentChatId, modelId);
    }
  };

  // The model displayed should be the current chat's model, or the selected one for a new chat.
  const activeModel = chatHistory.find(c => c.id === currentChatId)?.model || uiSelectedModel;

  return (
    <div className="flex h-full bg-transparent">
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
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden chat-background">
        <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto min-h-0">
           <ChatHeader setIsSidebarOpen={setIsSidebarOpen} />
           <ChatArea 
              messages={messages}
              isLoading={isLoading}
              sendMessage={sendMessage}
              modelsLoading={modelsLoading}
              onCancel={cancelGeneration}
           />
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        models={availableModels}
        selectedModel={activeModel}
        onModelChange={handleModelChange}
        disabled={modelsLoading}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        temperature={temperature}
        setTemperature={setTemperature}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        defaultSystemPrompt={DEFAULT_SYSTEM_PROMPT}
        defaultTemperature={DEFAULT_TEMPERATURE}
        defaultMaxTokens={DEFAULT_MAX_TOKENS}
      />
    </div>
  );
};
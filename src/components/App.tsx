/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Model } from '../services/modelService';
import type { ChatSession, Message } from '../../types';
import { getAvailableModels } from '../services/modelService';
import { useChat } from '../hooks/useChat';
import { useTheme } from '../hooks/useTheme';
import { useSidebar } from '../hooks/useSidebar';
import { useMemory } from '../hooks/useMemory';
import { Sidebar } from './Sidebar/Sidebar';
import { ChatHeader } from './Chat/ChatHeader';
import { ChatArea } from './Chat/ChatArea';
import { SettingsModal } from './Settings/SettingsModal';
import { MemoryModal } from './Settings/MemoryModal';
import { MemoryConfirmationModal } from './Settings/MemoryConfirmationModal';
import { exportChatToMarkdown, exportChatToJson, exportChatToPdf, exportChatToClipboard } from '../utils/exportUtils';
import { ThinkingSidebar } from './Sidebar/ThinkingSidebar';


// Configure the Monaco Editor loader to fetch assets from a CDN.
// This is done once at the top level of the application.


const DEFAULT_SYSTEM_PROMPT = '';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 0; // 0 or undefined means use model default
const DEFAULT_TTS_VOICE = 'Kore';
const DEFAULT_AUTO_PLAY_AUDIO = false;

export const App = () => {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [uiSelectedModel, setUiSelectedModel] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isThinkingSidebarOpen, setIsThinkingSidebarOpen] = useState(false);
  const [thinkingMessageIdForSidebar, setThinkingMessageIdForSidebar] = useState<string | null>(null);
  
  // Settings State - these act as the UI state, which is kept in sync with the active chat.
  const [systemPrompt, setSystemPrompt] = useState<string>(() => localStorage.getItem('agentic-systemPrompt') || DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState<number>(() => parseFloat(localStorage.getItem('agentic-temperature') || `${DEFAULT_TEMPERATURE}`));
  const [maxTokens, setMaxTokens] = useState<number>(() => parseInt(localStorage.getItem('agentic-maxTokens') || `${DEFAULT_MAX_TOKENS}`, 10));
  const [ttsVoice, setTtsVoice] = useState<string>(() => localStorage.getItem('agentic-ttsVoice') || DEFAULT_TTS_VOICE);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('agentic-autoPlayAudio');
    return saved ? JSON.parse(saved) : DEFAULT_AUTO_PLAY_AUDIO;
  });

  const { theme, setTheme } = useTheme();
  const {
    isMemoryEnabled,
    setIsMemoryEnabled,
    memoryContent,
    updateMemory,
    clearMemory,
    isConfirmationOpen,
    memorySuggestions,
    confirmMemoryUpdate,
    cancelMemoryUpdate,
  } = useMemory();
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
    updateChatTitle,
    toggleMessagePin,
    approveExecution,
    denyExecution,
    importChat,
  } = useChat(uiSelectedModel, { systemPrompt, temperature, maxOutputTokens: maxTokens }, memoryContent);
  
  const prevChatHistoryRef = useRef<ChatSession[]>([]);

  // Derive the message object for the sidebar. This will update whenever chatHistory changes.
  const thinkingMessageForSidebar = useMemo(() => {
    if (!thinkingMessageIdForSidebar || !currentChatId) return null;
    const currentChat = chatHistory.find(c => c.id === currentChatId);
    return currentChat?.messages.find(m => m.id === thinkingMessageIdForSidebar) ?? null;
  }, [thinkingMessageIdForSidebar, currentChatId, chatHistory]);


  // Effect to automatically update the AI's memory when a chat finishes.
  useEffect(() => {
    // Find chats that were loading in the previous state but are not loading in the current state.
    const justCompletedChats = prevChatHistoryRef.current
        .filter(prevChat => prevChat.isLoading)
        .map(prevChat => {
            const currentVersion = chatHistory.find(c => c.id === prevChat.id);
            return currentVersion && !currentVersion.isLoading ? currentVersion : null;
        })
        .filter(Boolean) as ChatSession[];

    // If we found any, update memory for them.
    for (const chat of justCompletedChats) {
        updateMemory(chat);
    }

    // Update the ref to the current history for the next render cycle.
    prevChatHistoryRef.current = chatHistory;
  }, [chatHistory, updateMemory]);

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

  // Effect to save UI settings changes TO the active chat and localStorage.
  // This runs when the user changes a setting in the modal.
  useEffect(() => {
    // 1. Persist the current UI settings as the new global default for any future chats.
    localStorage.setItem('agentic-systemPrompt', systemPrompt);
    localStorage.setItem('agentic-temperature', String(temperature));
    localStorage.setItem('agentic-maxTokens', String(maxTokens));
    localStorage.setItem('agentic-ttsVoice', ttsVoice);
    localStorage.setItem('agentic-autoPlayAudio', JSON.stringify(isAutoPlayEnabled));

    // 2. If there's an active chat, update its settings, but only if they have actually changed.
    // This check is crucial to prevent an infinite update loop after the other effect loads settings.
    if (currentChatId) {
      const currentChat = chatHistory.find(c => c.id === currentChatId);
      if (currentChat && (
        (currentChat.systemPrompt ?? DEFAULT_SYSTEM_PROMPT) !== systemPrompt ||
        (currentChat.temperature ?? DEFAULT_TEMPERATURE) !== temperature ||
        (currentChat.maxOutputTokens ?? DEFAULT_MAX_TOKENS) !== maxTokens
      )) {
        updateChatSettings(currentChatId, {
          systemPrompt,
          temperature,
          maxOutputTokens: maxTokens,
        });
      }
    }
  }, [systemPrompt, temperature, maxTokens, ttsVoice, isAutoPlayEnabled, currentChatId, chatHistory, updateChatSettings]);
  
  // Effect to sync the settings UI FROM the currently loaded chat session.
  // This runs when the user switches to a different chat or the chat data is updated.
  useEffect(() => {
    const sourceOfTruth = currentChatId 
      ? chatHistory.find(c => c.id === currentChatId) 
      : null;

    const newSystemPrompt = sourceOfTruth?.systemPrompt ?? (localStorage.getItem('agentic-systemPrompt') || DEFAULT_SYSTEM_PROMPT);
    const newTemperature = sourceOfTruth?.temperature ?? parseFloat(localStorage.getItem('agentic-temperature') || `${DEFAULT_TEMPERATURE}`);
    const newMaxTokens = sourceOfTruth?.maxOutputTokens ?? parseInt(localStorage.getItem('agentic-maxTokens') || `${DEFAULT_MAX_TOKENS}`, 10);
    
    // Only call state setters if the value has actually changed. This prevents
    // unnecessary re-renders and is key to breaking the potential effect loop.
    if (newSystemPrompt !== systemPrompt) setSystemPrompt(newSystemPrompt);
    if (newTemperature !== temperature) setTemperature(newTemperature);
    if (newMaxTokens !== maxTokens) setMaxTokens(newMaxTokens);

  }, [currentChatId, chatHistory]);
  
  // Handler for model selector: updates the model for the current chat or the next new chat.
  const handleModelChange = (modelId: string) => {
    setUiSelectedModel(modelId);
    if (currentChatId) {
        updateChatModel(currentChatId, modelId);
    }
  };

  const handleExportChat = (format: 'md' | 'json' | 'pdf') => {
    if (!currentChatId) return;
    const currentChat = chatHistory.find(c => c.id === currentChatId);
    if (currentChat) {
        switch (format) {
            case 'md': exportChatToMarkdown(currentChat); break;
            case 'json': exportChatToJson(currentChat); break;
            case 'pdf': exportChatToPdf(currentChat); break;
        }
    }
  };

  const handleShareChat = (chatId?: string) => {
    const idToShare = chatId || currentChatId;
    if (!idToShare) return;
    const chatToShare = chatHistory.find(c => c.id === idToShare);
    if (chatToShare) {
        exportChatToClipboard(chatToShare);
    }
  };

  const handleImportChat = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const importedSession = JSON.parse(json) as ChatSession;
                importChat(importedSession);
            } catch (error) {
                console.error("Failed to import and parse chat file:", error);
                alert("Failed to read the chat file. It may be corrupted or in an invalid format.");
            }
        };
        reader.onerror = () => {
            console.error("Error reading file:", reader.error);
            alert("An error occurred while reading the file.");
        };
        reader.readAsText(file);
    };
    input.click();
  };

  const handleShowThinkingProcess = (messageId: string) => {
    const currentChat = chatHistory.find(c => c.id === currentChatId);
    if (currentChat) {
      const message = currentChat.messages.find(m => m.id === messageId);
      if (message && message.role === 'model') {
        setThinkingMessageIdForSidebar(messageId);
        setIsThinkingSidebarOpen(true);
      }
    }
  };

  const handleCloseThinkingSidebar = () => {
    setIsThinkingSidebarOpen(false);
    setThinkingMessageIdForSidebar(null);
  };

  // The model displayed should be the current chat's model, or the selected one for a new chat.
  const activeModel = chatHistory.find(c => c.id === currentChatId)?.model || uiSelectedModel;
  const isChatActive = !!currentChatId;

  return (
    <div className="flex h-full bg-transparent overflow-hidden">
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
        onUpdateChatTitle={updateChatTitle}
        theme={theme}
        setTheme={setTheme}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <div className="flex flex-1 min-w-0">
        <main className="flex-1 flex flex-col overflow-hidden chat-background min-w-0">
          <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto min-h-0">
             <ChatHeader 
                setIsSidebarOpen={setIsSidebarOpen}
                isSidebarCollapsed={isSidebarCollapsed}
                setIsSidebarCollapsed={handleSetSidebarCollapsed}
                onImportChat={handleImportChat}
                onExportChat={handleExportChat}
                onShareChat={() => handleShareChat()}
                isChatActive={isChatActive}
             />
             <ChatArea 
                messages={messages}
                isLoading={isLoading}
                sendMessage={sendMessage}
                modelsLoading={modelsLoading}
                onCancel={cancelGeneration}
                ttsVoice={ttsVoice}
                isAutoPlayEnabled={isAutoPlayEnabled}
                currentChatId={currentChatId}
                onTogglePin={toggleMessagePin}
                onShowThinkingProcess={handleShowThinkingProcess}
                approveExecution={approveExecution}
                denyExecution={denyExecution}
             />
          </div>
        </main>

        <ThinkingSidebar
          isOpen={isThinkingSidebarOpen}
          onClose={handleCloseThinkingSidebar}
          message={thinkingMessageForSidebar}
          sendMessage={sendMessage}
        />
      </div>

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
        isMemoryEnabled={isMemoryEnabled}
        setIsMemoryEnabled={setIsMemoryEnabled}
        onManageMemory={() => setIsMemoryModalOpen(true)}
        ttsVoice={ttsVoice}
        setTtsVoice={setTtsVoice}
        isAutoPlayEnabled={isAutoPlayEnabled}
        setIsAutoPlayEnabled={setIsAutoPlayEnabled}
      />
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memoryContent={memoryContent}
        onClearMemory={clearMemory}
      />
      <MemoryConfirmationModal
        isOpen={isConfirmationOpen}
        suggestions={memorySuggestions}
        onConfirm={confirmMemoryUpdate}
        onCancel={cancelMemoryUpdate}
      />
    </div>
  );
};
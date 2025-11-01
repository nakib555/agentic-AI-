/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Model } from '../services/modelService';
import type { ChatSession, Message } from '../types';
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
import type { MessageListHandle } from './Chat/MessageList';
import { PinnedMessagesModal } from './Chat/PinnedMessagesModal';


// Default values for settings
const DEFAULT_ABOUT_USER = '';
const DEFAULT_ABOUT_RESPONSE = '';
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
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [isThinkingSidebarOpen, setIsThinkingSidebarOpen] = useState(false);
  const [thinkingMessageIdForSidebar, setThinkingMessageIdForSidebar] = useState<string | null>(null);
  
  // Settings State
  const [aboutUser, setAboutUser] = useState<string>(() => localStorage.getItem('agentic-aboutUser') || DEFAULT_ABOUT_USER);
  const [aboutResponse, setAboutResponse] = useState<string>(() => localStorage.getItem('agentic-aboutResponse') || DEFAULT_ABOUT_RESPONSE);
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
    isResizing,
    setIsResizing,
  } = useSidebar();

  const combinedSystemPrompt = useMemo(() => {
    if (!aboutUser.trim() && !aboutResponse.trim()) {
      return ''; // No custom instructions
    }
    return `
      <CONTEXT>
      The user has provided the following information about themselves to personalize your responses.
      ${aboutUser}
      </CONTEXT>
      <INSTRUCTIONS>
      The user has provided the following instructions on how you should respond.
      ${aboutResponse}
      </INSTRUCTIONS>
    `.trim();
  }, [aboutUser, aboutResponse]);

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
  } = useChat(uiSelectedModel, { systemPrompt: combinedSystemPrompt, temperature, maxOutputTokens: maxTokens }, memoryContent);
  
  const prevChatHistoryRef = useRef<ChatSession[]>([]);
  const messageListRef = useRef<MessageListHandle>(null);

  const thinkingMessageForSidebar = useMemo(() => {
    if (!thinkingMessageIdForSidebar || !currentChatId) return null;
    const currentChat = chatHistory.find(c => c.id === currentChatId);
    return currentChat?.messages.find(m => m.id === thinkingMessageIdForSidebar) ?? null;
  }, [thinkingMessageIdForSidebar, currentChatId, chatHistory]);


  // Effect to automatically update the AI's memory when a chat finishes.
  useEffect(() => {
    const justCompletedChats = prevChatHistoryRef.current
        .filter(prevChat => prevChat.isLoading)
        .map(prevChat => {
            const currentVersion = chatHistory.find(c => c.id === prevChat.id);
            return currentVersion && !currentVersion.isLoading ? currentVersion : null;
        })
        .filter(Boolean) as ChatSession[];

    for (const chat of justCompletedChats) {
        updateMemory(chat);
    }
    prevChatHistoryRef.current = chatHistory;
  }, [chatHistory, updateMemory]);

  // Effect to fetch models on startup
  useEffect(() => {
    getAvailableModels().then(models => {
      setAvailableModels(models);
      if (models.length > 0) {
        setUiSelectedModel(models[0].id);
      }
    }).catch(err => {
      console.error("Failed to load models:", err);
      setAvailableModels([]);
    }).finally(() => {
      setModelsLoading(false);
    });
  }, []);

  // Effect to save UI settings changes to localStorage and the active chat.
  useEffect(() => {
    localStorage.setItem('agentic-aboutUser', aboutUser);
    localStorage.setItem('agentic-aboutResponse', aboutResponse);
    localStorage.setItem('agentic-temperature', String(temperature));
    localStorage.setItem('agentic-maxTokens', String(maxTokens));
    localStorage.setItem('agentic-ttsVoice', ttsVoice);
    localStorage.setItem('agentic-autoPlayAudio', JSON.stringify(isAutoPlayEnabled));

    if (currentChatId) {
      const currentChat = chatHistory.find(c => c.id === currentChatId);
      if (currentChat && (
        (currentChat.temperature ?? DEFAULT_TEMPERATURE) !== temperature ||
        (currentChat.maxOutputTokens ?? DEFAULT_MAX_TOKENS) !== maxTokens
      )) {
        updateChatSettings(currentChatId, {
          temperature,
          maxOutputTokens: maxTokens,
        });
      }
    }
  }, [aboutUser, aboutResponse, temperature, maxTokens, ttsVoice, isAutoPlayEnabled, currentChatId, chatHistory, updateChatSettings]);
  
  // Effect to sync per-chat settings (temp, tokens) FROM the currently loaded chat session.
  useEffect(() => {
    const sourceOfTruth = currentChatId 
      ? chatHistory.find(c => c.id === currentChatId) 
      : null;

    const newTemperature = sourceOfTruth?.temperature ?? parseFloat(localStorage.getItem('agentic-temperature') || `${DEFAULT_TEMPERATURE}`);
    const newMaxTokens = sourceOfTruth?.maxOutputTokens ?? parseInt(localStorage.getItem('agentic-maxTokens') || `${DEFAULT_MAX_TOKENS}`, 10);
    
    if (newTemperature !== temperature) setTemperature(newTemperature);
    if (newMaxTokens !== maxTokens) setMaxTokens(newMaxTokens);
  }, [currentChatId, chatHistory]);
  
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
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            alert("Invalid file type. Please select a valid JSON (.json) file exported from this application.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                if (!json || !json.trim().startsWith('{')) {
                    throw new Error("File content does not appear to be valid JSON.");
                }
                const importedSession = JSON.parse(json) as ChatSession;
                importChat(importedSession);
            } catch (error) {
                console.error("Failed to import and parse chat file:", error);
                alert("Failed to import chat. The file may be corrupted or in an invalid format. Please ensure you are importing a .json file that was previously exported from this application.");
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

  const handleJumpToMessage = (messageId: string) => {
    setIsPinnedModalOpen(false);
    setTimeout(() => {
      messageListRef.current?.scrollToMessage(messageId);
    }, 150);
  };

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
        isResizing={isResizing}
        setIsResizing={setIsResizing}
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

      <div className={`flex flex-1 min-w-0 ${isResizing ? 'pointer-events-none' : ''}`}>
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
                messages={messages}
                onOpenPinnedModal={() => setIsPinnedModalOpen(true)}
             />
             <ChatArea 
                messageListRef={messageListRef}
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
        onClearAllChats={clearAllChats}
        // Custom Instructions
        aboutUser={aboutUser}
        setAboutUser={setAboutUser}
        aboutResponse={aboutResponse}
        setAboutResponse={setAboutResponse}
        // Model Settings
        temperature={temperature}
        setTemperature={setTemperature}
        maxTokens={maxTokens}
        setMaxTokens={setMaxTokens}
        defaultTemperature={DEFAULT_TEMPERATURE}
        defaultMaxTokens={DEFAULT_MAX_TOKENS}
        // Memory & Speech
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
      <PinnedMessagesModal
        isOpen={isPinnedModalOpen}
        onClose={() => setIsPinnedModalOpen(false)}
        messages={messages}
        onUnpin={(messageId) => {
            if (currentChatId) {
                toggleMessagePin(currentChatId, messageId);
            }
        }}
        onJumpTo={handleJumpToMessage}
      />
    </div>
  );
};
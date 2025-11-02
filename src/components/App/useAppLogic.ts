/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 3 of 4 from src/components/App.tsx
// Lines 16-248 (Logic part)

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Model } from '../../services/modelService';
import type { ChatSession } from '../../types';
import { getAvailableModels } from '../../services/modelService';
// FIX: Update import path for the useChat hook to point to the correct barrel file, as the original hook file was refactored and is now empty.
import { useChat } from '../../hooks/useChat/index';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';
import { useMemory } from '../../hooks/useMemory';
import { exportChatToMarkdown, exportChatToJson, exportChatToPdf, exportChatToClipboard } from '../../utils/exportUtils';
import type { MessageListHandle } from '../Chat/MessageList';
import {
  DEFAULT_ABOUT_USER, DEFAULT_ABOUT_RESPONSE, DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS, DEFAULT_TTS_VOICE, DEFAULT_AUTO_PLAY_AUDIO
} from './constants';
import { useViewport } from '../../hooks/useViewport';
import { useColorTheme } from '../../hooks/useColorTheme';

export const useAppLogic = () => {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [uiSelectedModel, setUiSelectedModel] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isPinnedModalOpen, setIsPinnedModalOpen] = useState(false);
  const [isThinkingSidebarOpen, setIsThinkingSidebarOpen] = useState(false);
  const [thinkingMessageIdForSidebar, setThinkingMessageIdForSidebar] = useState<string | null>(null);
  
  const [aboutUser, setAboutUser] = useState<string>(() => localStorage.getItem('agentic-aboutUser') || DEFAULT_ABOUT_USER);
  const [aboutResponse, setAboutResponse] = useState<string>(() => localStorage.getItem('agentic-aboutResponse') || DEFAULT_ABOUT_RESPONSE);
  const [temperature, setTemperature] = useState<number>(() => parseFloat(localStorage.getItem('agentic-temperature') || `${DEFAULT_TEMPERATURE}`));
  const [maxTokens, setMaxTokens] = useState<number>(() => parseInt(localStorage.getItem('agentic-maxTokens') || `${DEFAULT_MAX_TOKENS}`, 10));
  const [ttsVoice, setTtsVoice] = useState<string>(() => localStorage.getItem('agentic-ttsVoice') || DEFAULT_TTS_VOICE);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('agentic-autoPlayAudio');
    return saved ? JSON.parse(saved) : DEFAULT_AUTO_PLAY_AUDIO;
  });

  const { theme: displayMode, setTheme: setDisplayMode } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();
  const memory = useMemory();
  const sidebar = useSidebar();
  const { isDesktop } = useViewport();
  const prevIsDesktop = useRef(isDesktop);
  const appContainerRef = useRef<HTMLDivElement>(null);

  // This effect handles resizing the app container on mobile when the virtual keyboard appears.
  useEffect(() => {
    const appElement = appContainerRef.current;
    // window.visualViewport is not available in all browsers, so we check for it.
    if (!appElement || typeof window.visualViewport === 'undefined') {
      return;
    }

    const initialHeight = appElement.style.height;

    const updateHeight = () => {
      // On mobile, when the keyboard appears, the visual viewport shrinks.
      // We set the app's height to this new smaller viewport height to prevent
      // the input field from being hidden behind the keyboard.
      appElement.style.height = `${window.visualViewport.height}px`;
    };

    window.visualViewport.addEventListener('resize', updateHeight);
    updateHeight(); // Set the initial height correctly on first load

    // Cleanup function to remove the listener and restore original style
    return () => {
      window.visualViewport.removeEventListener('resize', updateHeight);
      if (appElement) {
        appElement.style.height = initialHeight;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount.


  // Synchronize sidebar state between mobile and desktop views
  useEffect(() => {
    // Only run on the boundary change between mobile and desktop
    if (prevIsDesktop.current === isDesktop) return;

    if (isDesktop) {
      // Switched TO DESKTOP view. Source of truth is mobile state (`isSidebarOpen`).
      // If mobile sidebar was open, desktop should be expanded (not collapsed).
      const shouldBeCollapsed = !sidebar.isSidebarOpen;
      if (sidebar.isSidebarCollapsed !== shouldBeCollapsed) {
        sidebar.handleSetSidebarCollapsed(shouldBeCollapsed);
      }
    } else {
      // Switched TO MOBILE view. Source of truth is desktop state (`isSidebarCollapsed`).
      // If desktop sidebar was expanded (not collapsed), mobile should be open.
      const shouldBeOpen = !sidebar.isSidebarCollapsed;
      if (sidebar.isSidebarOpen !== shouldBeOpen) {
        sidebar.setIsSidebarOpen(shouldBeOpen);
      }
    }

    prevIsDesktop.current = isDesktop;
  }, [isDesktop, sidebar.isSidebarOpen, sidebar.isSidebarCollapsed, sidebar.setIsSidebarOpen, sidebar.handleSetSidebarCollapsed]);

  const handleToggleSidebar = () => {
    if (isDesktop) {
        sidebar.handleSetSidebarCollapsed(!sidebar.isSidebarCollapsed);
    } else {
        sidebar.setIsSidebarOpen(!sidebar.isSidebarOpen);
    }
  };

  const combinedSystemPrompt = useMemo(() => {
    if (!aboutUser.trim() && !aboutResponse.trim()) return '';
    return `<CONTEXT>\nThe user has provided the following information about themselves to personalize your responses.\n${aboutUser}\n</CONTEXT>\n<INSTRUCTIONS>\nThe user has provided the following instructions on how you should respond.\n${aboutResponse}\n</INSTRUCTIONS>`.trim();
  }, [aboutUser, aboutResponse]);

  const chat = useChat(uiSelectedModel, { systemPrompt: combinedSystemPrompt, temperature, maxOutputTokens: maxTokens }, memory.memoryContent);
  
  const prevChatHistoryRef = useRef<ChatSession[]>([]);
  const messageListRef = useRef<MessageListHandle>(null);

  const thinkingMessageForSidebar = useMemo(() => {
    if (!thinkingMessageIdForSidebar || !chat.currentChatId) return null;
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    return currentChat?.messages.find(m => m.id === thinkingMessageIdForSidebar) ?? null;
  }, [thinkingMessageIdForSidebar, chat.currentChatId, chat.chatHistory]);

  useEffect(() => {
    const justCompletedChats = prevChatHistoryRef.current.filter(prevChat => prevChat.isLoading).map(prevChat => {
      const currentVersion = chat.chatHistory.find(c => c.id === prevChat.id);
      return currentVersion && !currentVersion.isLoading ? currentVersion : null;
    }).filter(Boolean) as ChatSession[];

    for (const chatSession of justCompletedChats) {
        memory.updateMemory(chatSession);
    }
    prevChatHistoryRef.current = chat.chatHistory;
  }, [chat.chatHistory, memory.updateMemory]);

  useEffect(() => {
    getAvailableModels().then(models => {
      setAvailableModels(models);
        const defaultModelId = models.find(m => m.id === 'gemini-2.5-flash')?.id || models[0]?.id;
        if (defaultModelId) {
            setUiSelectedModel(defaultModelId);
        }
    }).catch(err => {
        console.error("Failed to load models:", err);
    }).finally(() => {
        setModelsLoading(false);
    });
  }, []);

  useEffect(() => { localStorage.setItem('agentic-aboutUser', aboutUser); }, [aboutUser]);
  useEffect(() => { localStorage.setItem('agentic-aboutResponse', aboutResponse); }, [aboutResponse]);
  useEffect(() => { localStorage.setItem('agentic-temperature', String(temperature)); }, [temperature]);
  useEffect(() => { localStorage.setItem('agentic-maxTokens', String(maxTokens)); }, [maxTokens]);
  useEffect(() => { localStorage.setItem('agentic-ttsVoice', ttsVoice); }, [ttsVoice]);
  useEffect(() => { localStorage.setItem('agentic-autoPlayAudio', JSON.stringify(isAutoPlayEnabled)); }, [isAutoPlayEnabled]);

  const activeModel = useMemo(() => {
      const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
      return currentChat?.model || uiSelectedModel;
  }, [chat.chatHistory, chat.currentChatId, uiSelectedModel]);

  const isChatActive = useMemo(() => {
      return !!chat.currentChatId && chat.messages.length > 0;
  }, [chat.currentChatId, chat.messages]);

  const handleModelChange = (modelId: string) => {
      setUiSelectedModel(modelId);
      if (chat.currentChatId) {
          chat.updateChatModel(chat.currentChatId, modelId);
      }
  };
  
  const handleExportChat = (format: 'md' | 'json' | 'pdf') => {
      const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
      if (!currentChat) return;
      if (format === 'md') exportChatToMarkdown(currentChat);
      if (format === 'json') exportChatToJson(currentChat);
      if (format === 'pdf') exportChatToPdf(currentChat);
  };

  const handleShareChat = () => {
      const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
      if (!currentChat) return;
      exportChatToClipboard(currentChat);
  };
  
  const handleImportChat = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
              const text = await file.text();
              try {
                  const importedChat = JSON.parse(text);
                  chat.importChat(importedChat);
              } catch (error) {
                  console.error("Failed to parse imported chat file:", error);
                  alert("Invalid chat file format.");
              }
          }
      };
      input.click();
  };

  const handleShowThinkingProcess = (messageId: string) => {
      setThinkingMessageIdForSidebar(messageId);
      setIsThinkingSidebarOpen(true);
  };
  
  const handleCloseThinkingSidebar = () => {
      setIsThinkingSidebarOpen(false);
  };
  
  const handleJumpToMessage = (messageId: string) => {
      messageListRef.current?.scrollToMessage(messageId);
      setIsPinnedModalOpen(false);
  };

  return {
    appContainerRef,
    isDesktop,
    
    // Sidebar State
    ...sidebar,
    handleToggleSidebar,

    // Chat State
    ...chat,
    isChatActive,
    messageListRef,

    // Model State
    availableModels,
    modelsLoading,
    activeModel,
    handleModelChange,

    // Thinking Sidebar State
    isThinkingSidebarOpen,
    thinkingMessageIdForSidebar,
    handleShowThinkingProcess,
    handleCloseThinkingSidebar,
    thinkingMessageForSidebar,
    
    // Modal States
    isSettingsOpen, setIsSettingsOpen,
    isMemoryModalOpen, setIsMemoryModalOpen,
    isPinnedModalOpen, setIsPinnedModalOpen,

    // Settings
    aboutUser, setAboutUser,
    aboutResponse, setAboutResponse,
    temperature, setTemperature,
    maxTokens, setMaxTokens,
    ttsVoice, setTtsVoice,
    isAutoPlayEnabled, setIsAutoPlayEnabled,

    // Memory
    ...memory,
    
    // Import/Export
    handleImportChat,
    handleExportChat,
    handleShareChat,

    // Pinned Messages
    handleJumpToMessage,
    
    // Theme
    displayMode, setDisplayMode,
    colorTheme, setColorTheme,
  };
};

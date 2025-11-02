/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 3 of 4 from src/components/App.tsx
// Lines 16-248 (Logic part)

import { useState, useEffect, useRef, useMemo } from 'react';
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
  DEFAULT_MAX_TOKENS, DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL, DEFAULT_TTS_VOICE, DEFAULT_AUTO_PLAY_AUDIO
} from './constants';
import { useViewport } from '../../hooks/useViewport';

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
  const [imageModel, setImageModel] = useState<string>(() => localStorage.getItem('agentic-imageModel') || DEFAULT_IMAGE_MODEL);
  const [videoModel, setVideoModel] = useState<string>(() => localStorage.getItem('agentic-videoModel') || DEFAULT_VIDEO_MODEL);
  const [ttsVoice, setTtsVoice] = useState<string>(() => localStorage.getItem('agentic-ttsVoice') || DEFAULT_TTS_VOICE);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('agentic-autoPlayAudio');
    return saved ? JSON.parse(saved) : DEFAULT_AUTO_PLAY_AUDIO;
  });

  const { theme, setTheme } = useTheme();
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

  const chat = useChat(
    uiSelectedModel,
    { 
        systemPrompt: combinedSystemPrompt, 
        temperature, 
        maxOutputTokens: maxTokens, 
        imageModel, 
        videoModel 
    },
    memory.memoryContent
  );
  
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
      if (models.length > 0) setUiSelectedModel(models[0].id);
    }).catch(err => {
      console.error("Failed to load models:", err);
      setAvailableModels([]);
    }).finally(() => setModelsLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('agentic-aboutUser', aboutUser);
    localStorage.setItem('agentic-aboutResponse', aboutResponse);
    localStorage.setItem('agentic-temperature', String(temperature));
    localStorage.setItem('agentic-maxTokens', String(maxTokens));
    localStorage.setItem('agentic-imageModel', imageModel);
    localStorage.setItem('agentic-videoModel', videoModel);
    localStorage.setItem('agentic-ttsVoice', ttsVoice);
    localStorage.setItem('agentic-autoPlayAudio', JSON.stringify(isAutoPlayEnabled));

    if (chat.currentChatId) {
      const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
      if (currentChat) {
        chat.updateChatSettings(chat.currentChatId, { temperature, maxOutputTokens: maxTokens, imageModel, videoModel });
      }
    }
  }, [aboutUser, aboutResponse, temperature, maxTokens, imageModel, videoModel, ttsVoice, isAutoPlayEnabled, chat.currentChatId, chat.chatHistory, chat.updateChatSettings]);
  
  useEffect(() => {
    const sourceOfTruth = chat.currentChatId ? chat.chatHistory.find(c => c.id === chat.currentChatId) : null;
    
    const newTemperature = sourceOfTruth?.temperature ?? parseFloat(localStorage.getItem('agentic-temperature') || `${DEFAULT_TEMPERATURE}`);
    const newMaxTokens = sourceOfTruth?.maxOutputTokens ?? parseInt(localStorage.getItem('agentic-maxTokens') || `${DEFAULT_MAX_TOKENS}`, 10);
    // FIX: Add parentheses to clarify operator precedence between '??' and '||'.
    const newImageModel = (sourceOfTruth?.imageModel ?? localStorage.getItem('agentic-imageModel')) || DEFAULT_IMAGE_MODEL;
    // FIX: Add parentheses to clarify operator precedence between '??' and '||'.
    const newVideoModel = (sourceOfTruth?.videoModel ?? localStorage.getItem('agentic-videoModel')) || DEFAULT_VIDEO_MODEL;
    
    if (newTemperature !== temperature) setTemperature(newTemperature);
    if (newMaxTokens !== maxTokens) setMaxTokens(newMaxTokens);
    if (newImageModel !== imageModel) setImageModel(newImageModel);
    if (newVideoModel !== videoModel) setVideoModel(newVideoModel);
  }, [chat.currentChatId, chat.chatHistory]);
  
  const handleModelChange = (modelId: string) => {
    setUiSelectedModel(modelId);
    if (chat.currentChatId) chat.updateChatModel(chat.currentChatId, modelId);
  };

  const handleImageModelChange = (modelId: string) => {
    setImageModel(modelId);
    if (chat.currentChatId) chat.updateChatImageModel(chat.currentChatId, modelId);
  };

  const handleVideoModelChange = (modelId: string) => {
    setVideoModel(modelId);
    if (chat.currentChatId) chat.updateChatVideoModel(chat.currentChatId, modelId);
  };

  const handleExportChat = (format: 'md' | 'json' | 'pdf') => {
    if (!chat.currentChatId) return;
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (currentChat) {
      switch (format) {
        case 'md': exportChatToMarkdown(currentChat); break;
        case 'json': exportChatToJson(currentChat); break;
        case 'pdf': exportChatToPdf(currentChat); break;
      }
    }
  };

  const handleShareChat = (chatId?: string) => {
    const idToShare = chatId || chat.currentChatId;
    if (!idToShare) return;
    const chatToShare = chat.chatHistory.find(c => c.id === idToShare);
    if (chatToShare) exportChatToClipboard(chatToShare);
  };

  const handleImportChat = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        alert("Invalid file type. Please select a valid JSON file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          if (!json || !json.trim().startsWith('{')) throw new Error("File content is not valid JSON.");
          const importedSession = JSON.parse(json) as ChatSession;
          chat.importChat(importedSession);
        } catch (error) {
          console.error("Failed to import chat:", error);
          alert("Failed to import chat. The file may be invalid.");
        }
      };
      reader.onerror = () => alert("An error occurred while reading the file.");
      reader.readAsText(file);
    };
    input.click();
  };

  const handleShowThinkingProcess = (messageId: string) => {
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (currentChat?.messages.find(m => m.id === messageId && m.role === 'model')) {
      setThinkingMessageIdForSidebar(messageId);
      setIsThinkingSidebarOpen(true);
    }
  };

  const handleCloseThinkingSidebar = () => {
    setIsThinkingSidebarOpen(false);
    setThinkingMessageIdForSidebar(null);
  };

  const handleJumpToMessage = (messageId: string) => {
    setIsPinnedModalOpen(false);
    setTimeout(() => messageListRef.current?.scrollToMessage(messageId), 150);
  };

  const activeModel = chat.chatHistory.find(c => c.id === chat.currentChatId)?.model || uiSelectedModel;
  const isChatActive = !!chat.currentChatId;

  return {
    ...chat, ...memory, ...sidebar, theme, setTheme,
    availableModels, modelsLoading, uiSelectedModel, isSettingsOpen,
    setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen,
    isPinnedModalOpen, setIsPinnedModalOpen, isThinkingSidebarOpen,
    thinkingMessageForSidebar, aboutUser, setAboutUser, aboutResponse,
    setAboutResponse, temperature, setTemperature, maxTokens, setMaxTokens,
    imageModel, setImageModel: handleImageModelChange, videoModel, setVideoModel: handleVideoModelChange,
    ttsVoice, setTtsVoice, isAutoPlayEnabled, setIsAutoPlayEnabled,
    handleModelChange, handleExportChat, handleShareChat, handleImportChat,
    handleShowThinkingProcess, handleCloseThinkingSidebar, handleJumpToMessage,
    activeModel, isChatActive, messageListRef, handleToggleSidebar,
    isDesktop,
    appContainerRef,
  };
};

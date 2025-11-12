/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file contains the logic extracted from App.tsx.
// It uses a custom hook to manage state, side effects, and event handlers.

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useChat } from '../../hooks/useChat/index';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';
import { useViewport } from '../../hooks/useViewport';
import { useMemory } from '../../hooks/useMemory';
import { useModeToggle } from '../../hooks/useModeToggle';
import { getAvailableModels, type Model, validModels } from '../../services/modelService';
// Fix: Correct import path for types to point to src/types.
import type { Message, ChatSession } from '../types';
import {
  exportChatToJson,
  exportChatToMarkdown,
  exportChatToPdf,
  exportChatToClipboard,
} from '../../utils/exportUtils';
import type { MessageListHandle } from '../Chat/MessageList';
import {
  DEFAULT_ABOUT_USER,
  DEFAULT_ABOUT_RESPONSE,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_TTS_VOICE,
  DEFAULT_AUTO_PLAY_AUDIO
} from './constants';
import { API_BASE_URL } from '../utils/api';


export const useAppLogic = () => {
  const appContainerRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<MessageListHandle>(null);

  // --- Core Hooks ---
  const { theme, setTheme } = useTheme();
  const { isDesktop } = useViewport();
  const sidebar = useSidebar();
  const { isAgentMode, setIsAgentMode } = useModeToggle();
  const memory = useMemory();

  // --- UI State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isThinkingSidebarOpen, setIsThinkingSidebarOpen] = useState(false);
  const [thinkingMessageId, setThinkingMessageId] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [backendError, setBackendError] = useState<string | null>(null);

  // --- Model Management ---
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [activeModel, setActiveModel] = useState(validModels[1]?.id || validModels[0]?.id);

  // --- Settings State ---
  const [aboutUser, setAboutUser] = useState(() => localStorage.getItem('agentic-aboutUser') || DEFAULT_ABOUT_USER);
  const [aboutResponse, setAboutResponse] = useState(() => localStorage.getItem('agentic-aboutResponse') || DEFAULT_ABOUT_RESPONSE);
  const [temperature, setTemperature] = useState(() => parseFloat(localStorage.getItem('agentic-temperature') || `${DEFAULT_TEMPERATURE}`));
  const [maxTokens, setMaxTokens] = useState(() => parseInt(localStorage.getItem('agentic-maxTokens') || `${DEFAULT_MAX_TOKENS}`, 10));
  const [imageModel, setImageModel] = useState(() => localStorage.getItem('agentic-imageModel') || DEFAULT_IMAGE_MODEL);
  const [videoModel, setVideoModel] = useState(() => localStorage.getItem('agentic-videoModel') || DEFAULT_VIDEO_MODEL);
  const [ttsVoice, setTtsVoice] = useState(() => localStorage.getItem('agentic-ttsVoice') || DEFAULT_TTS_VOICE);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(() => {
    const saved = localStorage.getItem('agentic-autoPlayAudio');
    return saved ? JSON.parse(saved) : DEFAULT_AUTO_PLAY_AUDIO;
  });

  // --- Effect to save settings to localStorage ---
  useEffect(() => { localStorage.setItem('agentic-aboutUser', aboutUser); }, [aboutUser]);
  useEffect(() => { localStorage.setItem('agentic-aboutResponse', aboutResponse); }, [aboutResponse]);
  useEffect(() => { localStorage.setItem('agentic-temperature', String(temperature)); }, [temperature]);
  useEffect(() => { localStorage.setItem('agentic-maxTokens', String(maxTokens)); }, [maxTokens]);
  useEffect(() => { localStorage.setItem('agentic-imageModel', imageModel); }, [imageModel]);
  useEffect(() => { localStorage.setItem('agentic-videoModel', videoModel); }, [videoModel]);
  useEffect(() => { localStorage.setItem('agentic-ttsVoice', ttsVoice); }, [ttsVoice]);
  useEffect(() => { localStorage.setItem('agentic-autoPlayAudio', JSON.stringify(isAutoPlayEnabled)); }, [isAutoPlayEnabled]);

  // --- Fetch available models on mount ---
  useEffect(() => {
    getAvailableModels().then(models => {
      setAvailableModels(models);
      setModelsLoading(false);
    });
  }, []);

  // --- Health check effect ---
  useEffect(() => {
    let intervalId: number | null = null;

    const checkBackendStatus = async () => {
        try {
            setBackendStatus('checking');
            const response = await fetch(`${API_BASE_URL}/api/health`);
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();
            if (data.status !== 'ok') throw new Error('Invalid health response');

            setBackendStatus('online');
            setBackendError(null);
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        } catch (error) {
            setBackendStatus('offline');
            setBackendError("Could not connect to the backend server. Please ensure it is running.");
            if (!intervalId) {
                intervalId = window.setInterval(checkBackendStatus, 5000);
            }
        }
    };

    checkBackendStatus();

    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
  }, []);


  // --- Chat Core ---
  const chatSettings = useMemo(() => ({
    systemPrompt: `About me: ${aboutUser}\nHow to respond: ${aboutResponse}`,
    temperature,
    maxOutputTokens: maxTokens,
    imageModel,
    videoModel,
  }), [aboutUser, aboutResponse, temperature, maxTokens, imageModel, videoModel]);

  const chat = useChat(activeModel, chatSettings, memory.memoryContent, isAgentMode);
  const { updateChatModel, updateChatSettings } = chat;

  // --- Derived State & Memos ---
  const isChatActive = !!chat.currentChatId && chat.messages.length > 0;
  
  const thinkingMessageForSidebar = useMemo((): Message | null => {
    if (!thinkingMessageId || !chat.currentChatId) return null;
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    return currentChat?.messages.find(m => m.id === thinkingMessageId) || null;
  }, [thinkingMessageId, chat.currentChatId, chat.chatHistory]);

  const handleModelChange = useCallback((modelId: string) => {
    setActiveModel(modelId);
    if (chat.currentChatId) {
      updateChatModel(chat.currentChatId, modelId);
    }
  }, [chat.currentChatId, updateChatModel]);
  
  // Update chat settings when global settings change for the active chat
  useEffect(() => {
    if (chat.currentChatId) {
      updateChatSettings(chat.currentChatId, { temperature, maxOutputTokens: maxTokens, imageModel, videoModel });
    }
  }, [temperature, maxTokens, imageModel, videoModel, chat.currentChatId, updateChatSettings]);
  
  // Update memory after a chat is completed
  useEffect(() => {
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (currentChat && !currentChat.isLoading && currentChat.messages.length > 0) {
      memory.updateMemory(currentChat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.isLoading, chat.currentChatId, memory.updateMemory]);

  // --- Handlers ---
  const handleToggleSidebar = useCallback(() => {
    if (isDesktop) {
      sidebar.handleSetSidebarCollapsed(!sidebar.isSidebarCollapsed);
    } else {
      sidebar.setIsSidebarOpen(!sidebar.isSidebarOpen);
    }
  }, [isDesktop, sidebar]);

  const handleShowThinkingProcess = (messageId: string) => {
    setThinkingMessageId(messageId);
    setIsThinkingSidebarOpen(true);
  };
  
  const handleCloseThinkingSidebar = () => {
    setIsThinkingSidebarOpen(false);
    setThinkingMessageId(null);
  };

  const handleExportChat = useCallback((format: 'md' | 'json' | 'pdf') => {
    if (!chat.currentChatId) return;
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (!currentChat) return;

    if (format === 'json') exportChatToJson(currentChat);
    if (format === 'md') exportChatToMarkdown(currentChat);
    if (format === 'pdf') exportChatToPdf(currentChat);
  }, [chat.currentChatId, chat.chatHistory]);

  const handleShareChat = () => {
    if (!chat.currentChatId) return;
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (currentChat) exportChatToClipboard(currentChat);
  };
  
  const handleImportChat = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedChat = JSON.parse(event.target?.result as string);
            chat.importChat(importedChat as ChatSession);
          } catch (error) {
            console.error("Failed to parse imported chat file:", error);
            alert('Invalid chat file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  
  // --- Return all state and handlers ---
  return {
    appContainerRef, messageListRef, theme, setTheme, isDesktop, ...sidebar, isAgentMode, setIsAgentMode, ...memory,
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen,
    isThinkingSidebarOpen, setIsThinkingSidebarOpen, thinkingMessageId, setThinkingMessageId,
    backendStatus, backendError,
    availableModels, modelsLoading, activeModel, handleModelChange,
    aboutUser, setAboutUser, aboutResponse, setAboutResponse, temperature, setTemperature, maxTokens, setMaxTokens,
    imageModel, setImageModel, videoModel, setVideoModel, ttsVoice, setTtsVoice, isAutoPlayEnabled, setIsAutoPlayEnabled,
    ...chat, isChatActive, thinkingMessageForSidebar,
    handleToggleSidebar, handleShowThinkingProcess, handleCloseThinkingSidebar,
    handleExportChat, handleShareChat, handleImportChat
  };
};
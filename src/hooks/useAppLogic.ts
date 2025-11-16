/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file contains the logic extracted from App.tsx.
// It uses a custom hook to manage state, side effects, and event handlers.

import { useState, useEffect, useMemo, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useChat } from './useChat/index';
import { useTheme } from './useTheme';
import { useSidebar } from './useSidebar';
import { useViewport } from './useViewport';
import { useMemory } from './useMemory';
import { getAvailableModels, type Model, validModels } from '../services/modelService';
import type { Message, ChatSession } from '../types';
import {
  exportChatToJson,
  exportChatToMarkdown,
  exportChatToPdf,
  exportChatToClipboard,
} from '../utils/exportUtils';
import type { MessageListHandle } from '../components/Chat/MessageList';
import {
  DEFAULT_ABOUT_USER,
  DEFAULT_ABOUT_RESPONSE,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_TTS_VOICE,
  DEFAULT_AUTO_PLAY_AUDIO
} from '../components/App/constants';
import { fetchFromApi } from '../utils/api';
import { testSuite, type TestResult, type TestProgress } from '../components/Testing/testSuite';
import { getSettings, updateSettings } from '../services/settingsService';
import { logCollector } from '../utils/logCollector';


export const useAppLogic = () => {
  const appContainerRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<MessageListHandle>(null);

  // --- Core Hooks ---
  const { theme, setTheme } = useTheme();
  const { isDesktop } = useViewport();
  const sidebar = useSidebar();
  
  // --- UI State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isThinkingSidebarOpen, setIsThinkingSidebarOpen] = useState(false);
  const [thinkingMessageId, setThinkingMessageId] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // --- Model Management ---
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [activeModel, setActiveModel] = useState(validModels[1]?.id || validModels[0]?.id);

  // --- Settings State ---
  const [apiKey, setApiKey] = useState('');
  const [aboutUser, setAboutUser] = useState(DEFAULT_ABOUT_USER);
  const [aboutResponse, setAboutResponse] = useState(DEFAULT_ABOUT_RESPONSE);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [videoModel, setVideoModel] = useState(DEFAULT_VIDEO_MODEL);
  const [ttsVoice, setTtsVoice] = useState(DEFAULT_TTS_VOICE);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(DEFAULT_AUTO_PLAY_AUDIO);
  const [isAgentMode, setIsAgentModeState] = useState(true);
  
  // Memory state is managed by its own hook, but we need to pass the enabled flag.
  const [isMemoryEnabled, setIsMemoryEnabledState] = useState(false);
  const memory = useMemory(isMemoryEnabled);

  // --- Settings Management ---

  // --- Start Log Collector on Mount ---
  useEffect(() => {
    logCollector.start();
  }, []);

  // Fetch all settings from backend on initial load
  useEffect(() => {
    const loadSettings = async () => {
        try {
            setSettingsLoading(true);
            const settings = await getSettings();
            setApiKey(settings.apiKey);
            setAboutUser(settings.aboutUser);
            setAboutResponse(settings.aboutResponse);
            setTemperature(settings.temperature);
            setMaxTokens(settings.maxTokens);
            setImageModel(settings.imageModel);
            setVideoModel(settings.videoModel);
            setIsMemoryEnabledState(settings.isMemoryEnabled);
            setTtsVoice(settings.ttsVoice);
            setIsAutoPlayEnabled(settings.isAutoPlayEnabled);
            setIsAgentModeState(settings.isAgentMode);
        } catch (error) {
            console.error("Failed to load settings from backend:", error);
        } finally {
            setSettingsLoading(false);
        }
    };
    loadSettings();
  }, []);

  // Generic function to create a state setter that also persists to the backend
  // FIX: Use Dispatch and SetStateAction directly to avoid React namespace error.
  const createSettingUpdater = <T,>(
    setter: Dispatch<SetStateAction<T>>, 
    key: string
  ) => {
    return useCallback((newValue: T) => {
        setter(newValue);
        updateSettings({ [key]: newValue }).catch(err => console.error(`Failed to save setting ${key}:`, err));
    }, [setter, key]);
  };

  const handleSetApiKey = createSettingUpdater(setApiKey, 'apiKey');
  const handleSetAboutUser = createSettingUpdater(setAboutUser, 'aboutUser');
  const handleSetAboutResponse = createSettingUpdater(setAboutResponse, 'aboutResponse');
  const handleSetTemperature = createSettingUpdater(setTemperature, 'temperature');
  const handleSetMaxTokens = createSettingUpdater(setMaxTokens, 'maxTokens');
  const handleSetImageModel = createSettingUpdater(setImageModel, 'imageModel');
  const handleSetVideoModel = createSettingUpdater(setVideoModel, 'videoModel');
  const handleSetTtsVoice = createSettingUpdater(setTtsVoice, 'ttsVoice');
  const handleSetIsAutoPlayEnabled = createSettingUpdater(setIsAutoPlayEnabled, 'isAutoPlayEnabled');
  const handleSetIsAgentMode = createSettingUpdater(setIsAgentModeState, 'isAgentMode');
  const handleSetIsMemoryEnabled = createSettingUpdater(setIsMemoryEnabledState, 'isMemoryEnabled');

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
            const response = await fetchFromApi('/api/health');
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

  // FIX: Pass arguments to startNewChat and make wrapper async.
  const startNewChat = useCallback(async () => {
    await chat.startNewChat(activeModel, chatSettings);
  }, [chat, activeModel, chatSettings]);


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
    if (currentChat && !currentChat.isLoading && currentChat.messages && currentChat.messages.length > 0) {
      memory.updateMemory(currentChat);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.isLoading, chat.currentChatId, chat.chatHistory, memory.updateMemory]);

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
    setIsImportModalOpen(true);
  };

  const handleFileUploadForImport = (file: File) => {
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

  const handleDownloadLogs = useCallback(() => {
    const logContent = logCollector.formatLogs();
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `agentic-ai-console-log-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const runDiagnosticTests = useCallback(async (onProgress: (progress: TestProgress) => void) => {
    const results: TestResult[] = [];
    let testsPassed = 0;

    for (let i = 0; i < testSuite.length; i++) {
        const testCase = testSuite[i];
        onProgress({
            total: testSuite.length,
            current: i + 1,
            description: testCase.description,
            status: 'running',
            results
        });

        let result: TestResult;
        try {
            await startNewChat();
            
            const responseMessage = await chat.sendMessageForTest(testCase.prompt, testCase.options);
            const validation = await testCase.validate(responseMessage);
            
            result = { description: testCase.description, ...validation };
        } catch (error: any) {
            result = {
                description: testCase.description,
                pass: false,
                details: `Test runner failed: ${error.message || 'Unknown error'}`
            };
        }
        
        if (result.pass) testsPassed++;
        results.push(result);

        onProgress({
            total: testSuite.length,
            current: i + 1,
            description: testCase.description,
            status: result.pass ? 'pass' : 'fail',
            results
        });
    }

    // Final report generation
    let report = `Agentic AI Chat - Diagnostic Test Report\n`;
    report += `Date: ${new Date().toISOString()}\n`;
    report += `----------------------------------------\n`;
    report += `Summary: ${testsPassed} / ${testSuite.length} tests passed.\n\n`;
    
    results.forEach(res => {
        report += `[${res.pass ? 'PASS' : 'FAIL'}] ${res.description}\n`;
        report += `     Details: ${res.details}\n\n`;
    });

    return report;
  }, [chat, startNewChat]);
  
  // --- Return all state and handlers ---
  // FIX: Fix props not being passed down correctly.
  return {
    appContainerRef, messageListRef, theme, setTheme, isDesktop, ...sidebar, isAgentMode, ...memory,
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen,
    isImportModalOpen, setIsImportModalOpen,
    isThinkingSidebarOpen, setIsThinkingSidebarOpen, thinkingMessageId, setThinkingMessageId,
    backendStatus, backendError, isTestMode, setIsTestMode, settingsLoading,
    availableModels, modelsLoading, activeModel, handleModelChange,
    apiKey,
    onSaveApiKey: handleSetApiKey,
    aboutUser,
    setAboutUser: handleSetAboutUser,
    aboutResponse,
    setAboutResponse: handleSetAboutResponse,
    temperature,
    setTemperature: handleSetTemperature,
    maxTokens,
    setMaxTokens: handleSetMaxTokens,
    imageModel,
    onImageModelChange: handleSetImageModel,
    videoModel,
    onVideoModelChange: handleSetVideoModel,
    ttsVoice,
    setTtsVoice: handleSetTtsVoice,
    isAutoPlayEnabled,
    setIsAutoPlayEnabled: handleSetIsAutoPlayEnabled,
    isMemoryEnabled,
    setIsMemoryEnabled: handleSetIsMemoryEnabled,
    setIsAgentMode: handleSetIsAgentMode,
    ...chat, isChatActive, thinkingMessageForSidebar,
    startNewChat,
    handleToggleSidebar, handleShowThinkingProcess, handleCloseThinkingSidebar,
    handleExportChat, handleShareChat, handleImportChat, runDiagnosticTests,
    handleFileUploadForImport,
    handleDownloadLogs,
  };
};

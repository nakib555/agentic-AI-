
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file contains the logic extracted from App.tsx.
// It uses a custom hook to manage state, side effects, and event handlers.

import { useState, useEffect, useMemo, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useChat } from '../../hooks/useChat/index';
import { useTheme } from '../../hooks/useTheme';
import { useSidebar } from '../../hooks/useSidebar';
import { useViewport } from '../../hooks/useViewport';
import { useMemory } from '../../hooks/useMemory';
import type { Message, ChatSession, Model, Source } from '../../types';
import {
  exportChatToJson,
  exportChatToMarkdown,
  exportChatToPdf,
  exportChatToClipboard,
} from '../../utils/exportUtils/index';
import type { MessageListHandle } from '../Chat/MessageList';
import {
  DEFAULT_ABOUT_USER,
  DEFAULT_ABOUT_RESPONSE,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TTS_VOICE,
  DEFAULT_AUTO_PLAY_AUDIO
} from './constants';
import { fetchFromApi, setOnVersionMismatch } from '../../utils/api';
import { testSuite, type TestResult, type TestProgress } from '../Testing/testSuite';
import { getSettings, updateSettings, type UpdateSettingsResponse } from '../../services/settingsService';
import { logCollector } from '../../utils/logCollector';


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
  const [isSourcesSidebarOpen, setIsSourcesSidebarOpen] = useState(false);
  const [sourcesForSidebar, setSourcesForSidebar] = useState<Source[]>([]);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [versionMismatch, setVersionMismatch] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    prompt: string;
    onConfirm: () => void;
    onCancel?: () => void;
    destructive?: boolean;
  } | null>(null);


  // --- Model Management ---
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [availableImageModels, setAvailableImageModels] = useState<Model[]>([]);
  const [availableVideoModels, setAvailableVideoModels] = useState<Model[]>([]);
  const [availableTtsModels, setAvailableTtsModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [activeModel, setActiveModel] = useState('gemini-2.5-pro');

  // --- Settings State ---
  const [apiKey, setApiKey] = useState('');
  const [aboutUser, setAboutUser] = useState(DEFAULT_ABOUT_USER);
  const [aboutResponse, setAboutResponse] = useState(DEFAULT_ABOUT_RESPONSE);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);
  const [imageModel, setImageModel] = useState('');
  const [videoModel, setVideoModel] = useState('');
  const [ttsModel, setTtsModel] = useState('');
  const [ttsVoice, setTtsVoice] = useState(DEFAULT_TTS_VOICE);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(DEFAULT_AUTO_PLAY_AUDIO);
  const [isAgentMode, setIsAgentModeState] = useState(true);
  
  // Memory state is managed by its own hook, but we need to pass the enabled flag.
  const [isMemoryEnabled, setIsMemoryEnabledState] = useState(false);
  const memory = useMemory(isMemoryEnabled);

  // --- Start Log Collector & Version Mismatch Handler on Mount ---
  useEffect(() => {
    console.log('[APP_LOGIC] Initializing app...');
    logCollector.start();
    setOnVersionMismatch(() => setVersionMismatch(true));
  }, []);
  
  // --- Settings and Model Management ---

  const processModelData = useCallback((data: { models?: Model[], imageModels?: Model[], videoModels?: Model[], ttsModels?: Model[] }) => {
    const newModels = data.models || [];
    const newImageModels = data.imageModels || [];
    const newVideoModels = data.videoModels || [];
    const newTtsModels = data.ttsModels || [];

    setAvailableModels(newModels);
    setAvailableImageModels(newImageModels);
    setAvailableVideoModels(newVideoModels);
    setAvailableTtsModels(newTtsModels);
    
    // Set default chat model if none is selected or the selected one is no longer available
    if (newModels.length > 0 && (!activeModel || !newModels.some((m: Model) => m.id === activeModel))) {
      const proModel = newModels.find(m => m.id.includes('pro'));
      setActiveModel(proModel ? proModel.id : newModels[0].id);
    } else if (newModels.length === 0) {
      setActiveModel('');
    }
    
    // Set default image model
    if (newImageModels.length > 0 && (!imageModel || !newImageModels.some(m => m.id === imageModel))) {
        const defaultImg = newImageModels.find(m => m.id.includes('imagen') || m.id.includes('flash-image')) || newImageModels[0];
        setImageModel(defaultImg.id);
    } else if (newImageModels.length === 0) {
        setImageModel('');
    }

    // Set default video model
    if (newVideoModels.length > 0 && (!videoModel || !newVideoModels.some(m => m.id === videoModel))) {
        const defaultVid = newVideoModels.find(m => m.id.includes('veo')) || newVideoModels[0];
        setVideoModel(defaultVid.id);
    } else if (newVideoModels.length === 0) {
        setVideoModel('');
    }

    // Set default tts model
    if (newTtsModels.length > 0 && (!ttsModel || !newTtsModels.some(m => m.id === ttsModel))) {
        const defaultTts = newTtsModels.find(m => m.id.includes('gemini-2.5-flash-preview-tts')) || newTtsModels[0];
        setTtsModel(defaultTts.id);
    } else if (newTtsModels.length === 0) {
        setTtsModel('');
    }
  }, [activeModel, imageModel, videoModel, ttsModel]);

  const fetchModels = useCallback(async () => {
    try {
        console.log('[APP_LOGIC] Fetching available models...');
        setModelsLoading(true);
        const response = await fetchFromApi('/api/models');
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        console.log('[APP_LOGIC] Models fetched successfully:', data);
        processModelData(data);
    } catch (error) {
        if ((error as Error).message === 'Version mismatch') return;
        console.error("Failed to fetch available models:", error);
        setAvailableModels([]);
        setAvailableImageModels([]);
        setAvailableVideoModels([]);
        setAvailableTtsModels([]);
    } finally {
        setModelsLoading(false);
    }
  }, [processModelData]);

  // Fetch all settings from backend on initial load
  useEffect(() => {
    const loadSettings = async () => {
        try {
            console.log('[APP_LOGIC] Loading settings from backend...');
            setSettingsLoading(true);
            const settings = await getSettings();
            console.log('[APP_LOGIC] Settings loaded successfully:', settings);
            setApiKey(settings.apiKey);
            setAboutUser(settings.aboutUser);
            setAboutResponse(settings.aboutResponse);
            setTemperature(settings.temperature);
            setMaxTokens(settings.maxTokens);
            setImageModel(settings.imageModel);
            setVideoModel(settings.videoModel);
            setTtsModel(settings.ttsModel || 'gemini-2.5-flash-preview-tts');
            setIsMemoryEnabledState(settings.isMemoryEnabled);
            setTtsVoice(settings.ttsVoice);
            setIsAutoPlayEnabled(settings.isAutoPlayEnabled);
            setIsAgentModeState(settings.isAgentMode);
        } catch (error) {
            if ((error as Error).message === 'Version mismatch') return;
            console.error("Failed to load settings from backend:", error);
        } finally {
            setSettingsLoading(false);
        }
    };
    loadSettings();
  }, []);

  // Fetch models after settings (including API key) are loaded
  useEffect(() => {
    if (!settingsLoading) {
      fetchModels();
    }
  }, [settingsLoading, fetchModels]);

  const createSettingUpdater = <T,>(
    setter: Dispatch<SetStateAction<T>>, 
    key: string
  ) => {
    return useCallback((newValue: T) => {
        setter(newValue);
        updateSettings({ [key]: newValue }).catch(err => {
            if ((err as Error).message === 'Version mismatch') return;
            console.error(`Failed to save setting ${key}:`, err)
        });
    }, [setter, key]);
  };
  
  // Special handler for API key to trigger model re-fetch
  const handleSetApiKey = useCallback(async (newApiKey: string) => {
    setApiKey(newApiKey);
    try {
        const response: UpdateSettingsResponse = await updateSettings({ apiKey: newApiKey });
        
        // If backend returned models (verification success), update state immediately
        if (response.models && response.models.length > 0) {
            processModelData({
                models: response.models,
                imageModels: response.imageModels,
                videoModels: response.videoModels,
                ttsModels: response.ttsModels,
            });
        } else {
            // Fallback if backend didn't return models but key saved OK (unlikely with new logic)
            fetchModels(); 
        }
    } catch (error) {
        // If save fails, the key is invalid. Clear the available models.
        setAvailableModels([]);
        setAvailableImageModels([]);
        setAvailableVideoModels([]);
        setAvailableTtsModels([]);
        console.error("API Key save/verify failed:", error);
        throw error; // Re-throw to be caught by the UI
    }
  }, [processModelData, fetchModels]);

  const handleSetAboutUser = createSettingUpdater(setAboutUser, 'aboutUser');
  const handleSetAboutResponse = createSettingUpdater(setAboutResponse, 'aboutResponse');
  const handleSetTemperature = createSettingUpdater(setTemperature, 'temperature');
  const handleSetMaxTokens = createSettingUpdater(setMaxTokens, 'maxTokens');
  const handleSetImageModel = createSettingUpdater(setImageModel, 'imageModel');
  const handleSetVideoModel = createSettingUpdater(setVideoModel, 'videoModel');
  const handleSetTtsModel = createSettingUpdater(setTtsModel, 'ttsModel');
  const handleSetTtsVoice = createSettingUpdater(setTtsVoice, 'ttsVoice');
  const handleSetIsAutoPlayEnabled = createSettingUpdater(setIsAutoPlayEnabled, 'isAutoPlayEnabled');
  const handleSetIsAgentMode = createSettingUpdater(setIsAgentModeState, 'isAgentMode');
  const handleSetIsMemoryEnabled = createSettingUpdater(setIsMemoryEnabledState, 'isMemoryEnabled');

  // --- Health check effect ---
  useEffect(() => {
    let intervalId: number | null = null;

    const checkBackendStatus = async () => {
        try {
            console.log('[APP_LOGIC] Checking backend status...');
            setBackendStatus('checking');
            const response = await fetchFromApi('/api/health');
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();
            if (data.status !== 'ok') throw new Error('Invalid health response');

            console.log('[APP_LOGIC] Backend is online.');
            setBackendStatus('online');
            setBackendError(null);
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        } catch (error) {
            if ((error as Error).message === 'Version mismatch') return;
            console.error('[APP_LOGIC] Backend is offline:', error);
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

  // Pass apiKey to useChat
  const chat = useChat(activeModel, chatSettings, memory.memoryContent, isAgentMode, apiKey);
  const { updateChatModel, updateChatSettings } = chat;

  const startNewChat = useCallback(async () => {
    // Check if the most recent chat is already a new, empty chat.
    const mostRecentChat = chat.chatHistory[0];
    
    // CRITICAL FIX: Check if messages array exists before accessing length.
    // Chat history summaries from the backend do not include the messages array.
    if (mostRecentChat && mostRecentChat.title === 'New Chat' && mostRecentChat.messages?.length === 0) {
      // If we are currently in it, do nothing (avoid duplicate empty chats)
      if (chat.currentChatId === mostRecentChat.id) {
          return;
      }
      // If we are in another chat, switch to the existing empty one instead of creating a new one.
      chat.loadChat(mostRecentChat.id);
      return;
    }
    
    // Otherwise, create a new chat session.
    await chat.startNewChat(activeModel, chatSettings);
  }, [chat, activeModel, chatSettings]);
  
  // Calculate if the new chat button should be visually disabled
  const isNewChatDisabled = useMemo(() => {
      const mostRecentChat = chat.chatHistory[0];
      if (!mostRecentChat) return false;
      
      // CRITICAL FIX: Check if messages array exists before accessing length.
      const isMostRecentEmptyNewChat = mostRecentChat.title === 'New Chat' && mostRecentChat.messages?.length === 0;
      const isCurrentChat = chat.currentChatId === mostRecentChat.id;
      
      // Disable only if we are ALREADY sitting in the empty new chat.
      return isMostRecentEmptyNewChat && isCurrentChat;
  }, [chat.chatHistory, chat.currentChatId]);

  // --- Confirmation Modal Logic ---
  const requestConfirmation = useCallback((
    prompt: string,
    onConfirm: () => void,
    options?: { onCancel?: () => void; destructive?: boolean }
  ) => {
      setConfirmation({ prompt, onConfirm, onCancel: options?.onCancel, destructive: options?.destructive });
  }, []);

  const handleConfirm = useCallback(() => {
      if (confirmation) {
          confirmation.onConfirm();
          setConfirmation(null);
      }
  }, [confirmation]);

  const handleCancel = useCallback(() => {
      if (confirmation) {
          confirmation.onCancel?.();
          setConfirmation(null);
      }
  }, [confirmation]);

  const handleDeleteChatRequest = useCallback((chatId: string) => {
      requestConfirmation(
          'Are you sure you want to delete this chat? This will also delete any associated files.',
          () => chat.deleteChat(chatId),
          { destructive: true }
      );
  }, [chat.deleteChat, requestConfirmation]);

  const handleRequestClearAll = useCallback(() => {
      requestConfirmation(
          'Are you sure you want to delete all conversations? This action cannot be undone.',
          chat.clearAllChats,
          { destructive: true }
      );
  }, [chat.clearAllChats, requestConfirmation]);


  // --- Derived State & Memos ---
  const isChatActive = !!chat.currentChatId && chat.messages.length > 0;
  
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

  const handleShowSources = (sources: Source[]) => {
    setSourcesForSidebar(sources);
    setIsSourcesSidebarOpen(true);
  };

  const handleCloseSourcesSidebar = () => {
    setIsSourcesSidebarOpen(false);
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

  const handleShowDataStructure = useCallback(async () => {
    try {
        const response = await fetchFromApi('/api/handler?task=debug_data_tree', {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to fetch data tree');
        const { tree } = await response.json();
        
        console.log('--- Server Data Structure ---\n' + tree);
        
        const blob = new Blob([tree], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-structure-${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error fetching data structure:', error);
        alert('Failed to fetch data structure.');
    }
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
  
  // Wrap the sendMessage from useChat to add logging
  const wrappedSendMessage = useCallback((message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean }) => {
      console.log('[DEBUG] useAppLogic: sendMessage called', { message, fileCount: files?.length, options });
      chat.sendMessage(message, files, options);
  }, [chat]);

  return {
    appContainerRef, messageListRef, theme, setTheme, isDesktop, ...sidebar, isAgentMode, ...memory,
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen,
    isImportModalOpen, setIsImportModalOpen,
    isSourcesSidebarOpen, sourcesForSidebar,
    backendStatus, backendError, isTestMode, setIsTestMode, settingsLoading,
    versionMismatch,
    confirmation, handleConfirm, handleCancel,
    availableModels,
    availableImageModels,
    availableVideoModels,
    availableTtsModels,
    modelsLoading,
    activeModel,
    onModelChange: handleModelChange,
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
    ttsModel,
    onTtsModelChange: handleSetTtsModel,
    ttsVoice,
    setTtsVoice: handleSetTtsVoice,
    isAutoPlayEnabled,
    setIsAutoPlayEnabled: handleSetIsAutoPlayEnabled,
    isMemoryEnabled,
    setIsMemoryEnabled: handleSetIsMemoryEnabled,
    setIsAgentMode: handleSetIsAgentMode,
    ...chat, isChatActive,
    sendMessage: wrappedSendMessage, // Use the wrapped version
    startNewChat, isNewChatDisabled,
    handleDeleteChatRequest, handleRequestClearAll,
    handleToggleSidebar, 
    handleShowSources, handleCloseSourcesSidebar,
    handleExportChat, handleShareChat, handleImportChat, runDiagnosticTests,
    handleFileUploadForImport,
    handleDownloadLogs,
    handleShowDataStructure, // Export new handler
    updateBackendMemory: memory.updateBackendMemory, // Explicitly pass this
    memoryFiles: memory.memoryFiles,
    updateMemoryFiles: memory.updateMemoryFiles
  };
};

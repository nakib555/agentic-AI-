
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useChat } from './useChat/index';
import { useTheme } from './useTheme';
import { useSidebar } from './useSidebar';
import { useViewport } from './useViewport';
import { useMemory } from './useMemory';
import type { Model, Source } from '../types';
import {
  exportChatToJson,
  exportChatToMarkdown,
  exportChatToPdf,
  exportChatToClipboard,
} from '../utils/exportUtils/index';
import type { MessageListHandle } from '../components/Chat/MessageList';
import {
  DEFAULT_ABOUT_USER,
  DEFAULT_ABOUT_RESPONSE,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TTS_VOICE
} from '../components/App/constants';
import { fetchFromApi, setOnVersionMismatch } from '../utils/api';
import { testSuite, type TestResult, type TestProgress } from '../components/Testing/testSuite';
import { getSettings, updateSettings, type UpdateSettingsResponse } from '../services/settingsService';
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
  
  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
      setToast({ message, type });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);


  // --- Model Management ---
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [availableImageModels, setAvailableImageModels] = useState<Model[]>([]);
  const [availableVideoModels, setAvailableVideoModels] = useState<Model[]>([]);
  const [availableTtsModels, setAvailableTtsModels] = useState<Model[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [activeModel, setActiveModel] = useState('');

  // --- Settings State ---
  const [apiKey, setApiKey] = useState('');
  const [suggestionApiKey, setSuggestionApiKey] = useState('');
  const [aboutUser, setAboutUser] = useState(DEFAULT_ABOUT_USER);
  const [aboutResponse, setAboutResponse] = useState(DEFAULT_ABOUT_RESPONSE);
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);
  const [imageModel, setImageModel] = useState('');
  const [videoModel, setVideoModel] = useState('');
  const [ttsModel, setTtsModel] = useState('');
  const [ttsVoice, setTtsVoice] = useState(DEFAULT_TTS_VOICE);
  const [isAgentMode, setIsAgentModeState] = useState(true);
  
  // Memory state is managed by its own hook
  const [isMemoryEnabled, setIsMemoryEnabledState] = useState(false);
  const memory = useMemory(isMemoryEnabled);

  // --- Initialization ---
  useEffect(() => {
    setOnVersionMismatch(() => setVersionMismatch(true));
  }, []);

  // --- State Refs to break dependency cycles ---
  const activeModelRef = useRef(activeModel);
  const imageModelRef = useRef(imageModel);
  const videoModelRef = useRef(videoModel);
  const ttsModelRef = useRef(ttsModel);

  useEffect(() => { activeModelRef.current = activeModel; }, [activeModel]);
  useEffect(() => { imageModelRef.current = imageModel; }, [imageModel]);
  useEffect(() => { videoModelRef.current = videoModel; }, [videoModel]);
  useEffect(() => { ttsModelRef.current = ttsModel; }, [ttsModel]);
  
  // --- Data Loading ---
  const processModelData = useCallback((data: { models?: Model[], imageModels?: Model[], videoModels?: Model[], ttsModels?: Model[] }) => {
    // Backend sends pre-sorted and filtered lists
    const newModels = data.models || [];
    const newImageModels = data.imageModels || [];
    const newVideoModels = data.videoModels || [];
    const newTtsModels = data.ttsModels || [];

    setAvailableModels(newModels);
    setAvailableImageModels(newImageModels);
    setAvailableVideoModels(newVideoModels);
    setAvailableTtsModels(newTtsModels);
    
    // Smart Defaults Logic using Refs to avoid dependency cycles
    
    const currentActiveModel = activeModelRef.current;
    if (newModels.length > 0) {
        if (!currentActiveModel || !newModels.some((m: Model) => m.id === currentActiveModel)) {
            setActiveModel(newModels[0].id);
        }
    } else {
        // Only clear if we really have no models, otherwise keep the user's setting (might be offline/loading issue)
        if (!currentActiveModel) setActiveModel('');
    }
    
    const currentImageModel = imageModelRef.current;
    if (newImageModels.length > 0) {
        if (!currentImageModel || !newImageModels.some((m: Model) => m.id === currentImageModel)) {
            setImageModel(newImageModels[0].id);
        }
    }

    const currentVideoModel = videoModelRef.current;
    if (newVideoModels.length > 0) {
        if (!currentVideoModel || !newVideoModels.some((m: Model) => m.id === currentVideoModel)) {
            setVideoModel(newVideoModels[0].id);
        }
    }

    const currentTtsModel = ttsModelRef.current;
    if (newTtsModels.length > 0) {
        if (!currentTtsModel || !newTtsModels.some((m: Model) => m.id === currentTtsModel)) {
            setTtsModel(newTtsModels[0].id);
        }
    }

  }, []); // No dependencies needed due to Refs

  const fetchModels = useCallback(async () => {
    try {
        setModelsLoading(true);
        const response = await fetchFromApi('/api/models');
        if (!response.ok) return; // Fail silently, settings modal will show empty state
        const data = await response.json();
        processModelData(data);
    } catch (error) {
        // Network error handled by backendStatus check
    } finally {
        setModelsLoading(false);
    }
  }, [processModelData]);

  // Initial Data Load
  useEffect(() => {
    const loadSettings = async () => {
        try {
            setSettingsLoading(true);
            const settings = await getSettings();
            setApiKey(settings.apiKey);
            setSuggestionApiKey(settings.suggestionApiKey);
            setAboutUser(settings.aboutUser);
            setAboutResponse(settings.aboutResponse);
            setTemperature(settings.temperature);
            setMaxTokens(settings.maxTokens);
            
            // Set initial state from settings
            setActiveModel(settings.activeModel);
            setImageModel(settings.imageModel);
            setVideoModel(settings.videoModel);
            setTtsModel(settings.ttsModel);
            
            setIsMemoryEnabledState(settings.isMemoryEnabled);
            setTtsVoice(settings.ttsVoice);
            setIsAgentModeState(settings.isAgentMode);
            
            // Models can be loaded after settings are known
            fetchModels();
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setSettingsLoading(false);
        }
    };
    loadSettings();
  }, [fetchModels]);

  // --- Settings Updaters ---
  // Helper to create simple update handlers for global settings
  const createSettingUpdater = <T,>(setter: Dispatch<SetStateAction<T>>, key: string) => {
    return useCallback((newValue: T) => {
        setter(newValue);
        updateSettings({ [key]: newValue });
    }, [setter, key]);
  };
  
  const handleSetApiKey = useCallback(async (newApiKey: string) => {
    setApiKey(newApiKey);
    try {
        const response: UpdateSettingsResponse = await updateSettings({ apiKey: newApiKey });
        if (response.models) {
            processModelData(response);
        } else {
            fetchModels(); 
        }
    } catch (error) {
        setAvailableModels([]); // Clear on error
        throw error;
    }
  }, [processModelData, fetchModels]);

  // Simple global-only settings
  const handleSetSuggestionApiKey = createSettingUpdater(setSuggestionApiKey, 'suggestionApiKey');
  const handleSetAboutUser = createSettingUpdater(setAboutUser, 'aboutUser');
  const handleSetAboutResponse = createSettingUpdater(setAboutResponse, 'aboutResponse');
  const handleSetTtsModel = createSettingUpdater(setTtsModel, 'ttsModel');
  const handleSetTtsVoice = createSettingUpdater(setTtsVoice, 'ttsVoice');
  const handleSetIsAgentMode = createSettingUpdater(setIsAgentModeState, 'isAgentMode');
  const handleSetIsMemoryEnabled = createSettingUpdater(setIsMemoryEnabledState, 'isMemoryEnabled');

  // --- Chat Settings ---
  // These require specialized handling to update the active chat if one exists
  
  const chatSettings = useMemo(() => ({
    systemPrompt: `About me: ${aboutUser}\nHow to respond: ${aboutResponse}`,
    temperature,
    maxOutputTokens: maxTokens,
    imageModel,
    videoModel,
  }), [aboutUser, aboutResponse, temperature, maxTokens, imageModel, videoModel]);

  // Pass showToast to useChat
  const chat = useChat(activeModel, chatSettings, memory.memoryContent, isAgentMode, apiKey, showToast);
  const { updateChatModel, updateChatSettings } = chat;

  // Handler Wrappers that update Global AND Current Chat
  const handleSetTemperature = useCallback((val: number) => {
      setTemperature(val);
      updateSettings({ temperature: val });
      if (chat.currentChatId) updateChatSettings(chat.currentChatId, { temperature: val });
  }, [chat.currentChatId, updateChatSettings]);

  const handleSetMaxTokens = useCallback((val: number) => {
      setMaxTokens(val);
      updateSettings({ maxTokens: val });
      if (chat.currentChatId) updateChatSettings(chat.currentChatId, { maxOutputTokens: val });
  }, [chat.currentChatId, updateChatSettings]);

  const handleSetImageModel = useCallback((val: string) => {
      setImageModel(val);
      updateSettings({ imageModel: val });
      if (chat.currentChatId) updateChatSettings(chat.currentChatId, { imageModel: val });
  }, [chat.currentChatId, updateChatSettings]);

  const handleSetVideoModel = useCallback((val: string) => {
      setVideoModel(val);
      updateSettings({ videoModel: val });
      if (chat.currentChatId) updateChatSettings(chat.currentChatId, { videoModel: val });
  }, [chat.currentChatId, updateChatSettings]);

  const handleModelChange = useCallback((modelId: string) => {
    setActiveModel(modelId);
    updateSettings({ activeModel: modelId }); // Persist global default
    if (chat.currentChatId) updateChatModel(chat.currentChatId, modelId);
  }, [chat.currentChatId, updateChatModel]);

  // --- Hydration Effect ---
  // When switching chats, load that chat's settings into the UI state.
  // Use a ref to track the previous ID so we only hydrate on an actual switch,
  // preventing the chat state from overwriting active user edits in settings.
  const prevChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run hydration if the chat ID actually changed
    if (chat.currentChatId === prevChatIdRef.current) return;
    prevChatIdRef.current = chat.currentChatId;

    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (currentChat) {
        // Update local state to match current chat without triggering save handlers
        // This ensures the UI controls reflect the active chat's configuration
        if (currentChat.model) setActiveModel(currentChat.model);
        if (currentChat.temperature !== undefined) setTemperature(currentChat.temperature);
        if (currentChat.maxOutputTokens !== undefined) setMaxTokens(currentChat.maxOutputTokens);
        if (currentChat.imageModel) setImageModel(currentChat.imageModel);
        if (currentChat.videoModel) setVideoModel(currentChat.videoModel);
    }
  }, [chat.currentChatId, chat.chatHistory]); 

  // --- Health Check ---
  const checkBackendStatusTimeoutRef = useRef<number | null>(null);

  const checkBackendStatus = useCallback(async () => {
    if (checkBackendStatusTimeoutRef.current) {
        window.clearTimeout(checkBackendStatusTimeoutRef.current);
        checkBackendStatusTimeoutRef.current = null;
    }

    try {
        setBackendStatus('checking');
        const response = await fetchFromApi('/api/health');
        if (response.ok) {
            setBackendStatus('online');
            setBackendError(null);
        } else {
            throw new Error();
        }
    } catch (error) {
        setBackendStatus('offline');
        setBackendError("Connection lost.");
        checkBackendStatusTimeoutRef.current = window.setTimeout(checkBackendStatus, 5000);
    }
  }, []);

  useEffect(() => {
    checkBackendStatus();
    return () => {
        if (checkBackendStatusTimeoutRef.current) {
            window.clearTimeout(checkBackendStatusTimeoutRef.current);
        }
    };
  }, [checkBackendStatus]);


  const startNewChat = useCallback(async () => {
    const mostRecentChat = chat.chatHistory[0];
    // Don't create duplicates of empty new chats
    if (mostRecentChat && mostRecentChat.title === 'New Chat' && mostRecentChat.messages?.length === 0) {
      if (chat.currentChatId !== mostRecentChat.id) chat.loadChat(mostRecentChat.id);
      return;
    }
    await chat.startNewChat(activeModel, chatSettings);
  }, [chat, activeModel, chatSettings]);
  
  const isNewChatDisabled = useMemo(() => {
      const mostRecentChat = chat.chatHistory[0];
      return mostRecentChat && mostRecentChat.title === 'New Chat' && mostRecentChat.messages?.length === 0 && chat.currentChatId === mostRecentChat.id;
  }, [chat.chatHistory, chat.currentChatId]);

  // --- Confirmation Modal ---
  const requestConfirmation = useCallback((prompt: string, onConfirm: () => void, options?: { onCancel?: () => void; destructive?: boolean }) => {
      setConfirmation({ prompt, onConfirm, onCancel: options?.onCancel, destructive: options?.destructive });
  }, []);

  const handleConfirm = useCallback(() => {
      confirmation?.onConfirm();
      setConfirmation(null);
  }, [confirmation]);

  
  useEffect(() => {
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (currentChat && !currentChat.isLoading && currentChat.messages?.length > 0) {
      memory.updateMemory(currentChat);
    }
  }, [chat.isLoading, chat.currentChatId, chat.chatHistory, memory.updateMemory]);

  const handleExportChat = useCallback((format: 'md' | 'json' | 'pdf') => {
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (!currentChat) return;
    if (format === 'json') exportChatToJson(currentChat);
    if (format === 'md') exportChatToMarkdown(currentChat);
    if (format === 'pdf') exportChatToPdf(currentChat);
  }, [chat.currentChatId, chat.chatHistory]);

  const handleShareChat = () => {
    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (currentChat) exportChatToClipboard(currentChat);
  };
  
  const handleFileUploadForImport = (file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          chat.importChat(JSON.parse(event.target?.result as string));
        } catch { alert('Invalid chat file format.'); }
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadLogs = useCallback(() => {
    const blob = new Blob([logCollector.formatLogs()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleShowDataStructure = useCallback(async () => {
    try {
        const response = await fetchFromApi('/api/handler?task=debug_data_tree', { method: 'POST' });
        const data = await response.json();
        if (data.ascii) console.log(data.ascii);
        
        const blob = new Blob([JSON.stringify(data.json || data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-structure.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch { alert('Failed to fetch data structure.'); }
  }, []);

  const handleDeleteChatRequest = useCallback((chatId: string) => {
      requestConfirmation(
          'Are you sure you want to delete this chat? This will also delete any associated files.',
          () => chat.deleteChat(chatId),
          { destructive: true }
      );
  }, [chat.deleteChat, requestConfirmation]);

  const runDiagnosticTests = useCallback(async (onProgress: (progress: TestProgress) => void) => {
    const results: TestResult[] = [];
    for (let i = 0; i < testSuite.length; i++) {
        const testCase = testSuite[i];
        onProgress({ total: testSuite.length, current: i + 1, description: testCase.description, status: 'running', results });
        try {
            await startNewChat();
            const responseMessage = await chat.sendMessageForTest(testCase.prompt, testCase.options);
            const validation = await testCase.validate(responseMessage);
            results.push({ description: testCase.description, ...validation });
        } catch (error: any) {
            results.push({ description: testCase.description, pass: false, details: `Error: ${error.message}` });
        }
        onProgress({ total: testSuite.length, current: i + 1, description: testCase.description, status: results[results.length-1].pass ? 'pass' : 'fail', results });
    }
    return JSON.stringify(results, null, 2);
  }, [chat, startNewChat]);
  
  return {
    appContainerRef, messageListRef, theme, setTheme, isDesktop, ...sidebar, isAgentMode, ...memory,
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen,
    isImportModalOpen, setIsImportModalOpen, isSourcesSidebarOpen, sourcesForSidebar,
    backendStatus, backendError, isTestMode, setIsTestMode, settingsLoading, versionMismatch,
    retryConnection: checkBackendStatus,
    confirmation, handleConfirm, handleCancel: () => setConfirmation(null),
    toast, closeToast, showToast, // Export toast functionality
    availableModels, availableImageModels, availableVideoModels, availableTtsModels,
    modelsLoading, activeModel, onModelChange: handleModelChange,
    apiKey, onSaveApiKey: handleSetApiKey, suggestionApiKey, onSaveSuggestionApiKey: handleSetSuggestionApiKey,
    aboutUser, setAboutUser: handleSetAboutUser,
    aboutResponse, setAboutResponse: handleSetAboutResponse, temperature, setTemperature: handleSetTemperature,
    maxTokens, setMaxTokens: handleSetMaxTokens, imageModel, onImageModelChange: handleSetImageModel,
    videoModel, onVideoModelChange: handleSetVideoModel, ttsModel, onTtsModelChange: handleSetTtsModel,
    ttsVoice, setTtsVoice: handleSetTtsVoice, isMemoryEnabled, setIsMemoryEnabled: handleSetIsMemoryEnabled,
    setIsAgentMode: handleSetIsAgentMode, ...chat, isChatActive: !!chat.currentChatId && chat.messages.length > 0,
    sendMessage: chat.sendMessage, startNewChat, isNewChatDisabled,
    handleDeleteChatRequest, handleRequestClearAll: () => requestConfirmation('Delete all data?', chat.clearAllChats, { destructive: true }),
    handleToggleSidebar: () => isDesktop ? sidebar.handleSetSidebarCollapsed(!sidebar.isSidebarCollapsed) : sidebar.setIsSidebarOpen(!sidebar.isSidebarOpen),
    handleShowSources: (s: Source[]) => { setSourcesForSidebar(s); setIsSourcesSidebarOpen(true); },
    handleCloseSourcesSidebar: () => setIsSourcesSidebarOpen(false),
    handleExportChat, handleShareChat, handleImportChat: () => setIsImportModalOpen(true),
    runDiagnosticTests, handleFileUploadForImport, handleDownloadLogs, handleShowDataStructure,
    updateBackendMemory: memory.updateBackendMemory, memoryFiles: memory.memoryFiles, updateMemoryFiles: memory.updateMemoryFiles
  };
};

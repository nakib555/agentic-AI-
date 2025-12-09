
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
  const [isAgentMode, setIsAgentModeState] = useState(true);
  
  // Memory state is managed by its own hook
  const [isMemoryEnabled, setIsMemoryEnabledState] = useState(false);
  const memory = useMemory(isMemoryEnabled);

  // --- Initialization ---
  useEffect(() => {
    logCollector.start();
    setOnVersionMismatch(() => setVersionMismatch(true));
  }, []);
  
  // --- Data Loading ---
  const processModelData = useCallback((data: { models?: Model[], imageModels?: Model[], videoModels?: Model[], ttsModels?: Model[] }) => {
    // Backend sends pre-sorted and filtered lists
    const newModels = data.models || [];
    setAvailableModels(newModels);
    setAvailableImageModels(data.imageModels || []);
    setAvailableVideoModels(data.videoModels || []);
    setAvailableTtsModels(data.ttsModels || []);
    
    // Smart Defaults Logic
    if (newModels.length > 0 && (!activeModel || !newModels.some((m: Model) => m.id === activeModel))) {
      setActiveModel(newModels[0].id); // Backend puts preferred model first
    } else if (newModels.length === 0) {
      setActiveModel('');
    }
    
    if (data.imageModels?.length && !imageModel) setImageModel(data.imageModels[0].id);
    if (data.videoModels?.length && !videoModel) setVideoModel(data.videoModels[0].id);
    if (data.ttsModels?.length && !ttsModel) setTtsModel(data.ttsModels[0].id);

  }, [activeModel, imageModel, videoModel, ttsModel]);

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
            setAboutUser(settings.aboutUser);
            setAboutResponse(settings.aboutResponse);
            setTemperature(settings.temperature);
            setMaxTokens(settings.maxTokens);
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

  const createSettingUpdater = <T,>(setter: Dispatch<SetStateAction<T>>, key: string) => {
    return useCallback((newValue: T) => {
        setter(newValue);
        // Fire-and-forget update to backend
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

  const handleSetAboutUser = createSettingUpdater(setAboutUser, 'aboutUser');
  const handleSetAboutResponse = createSettingUpdater(setAboutResponse, 'aboutResponse');
  const handleSetTemperature = createSettingUpdater(setTemperature, 'temperature');
  const handleSetMaxTokens = createSettingUpdater(setMaxTokens, 'maxTokens');
  const handleSetImageModel = createSettingUpdater(setImageModel, 'imageModel');
  const handleSetVideoModel = createSettingUpdater(setVideoModel, 'videoModel');
  const handleSetTtsModel = createSettingUpdater(setTtsModel, 'ttsModel');
  const handleSetTtsVoice = createSettingUpdater(setTtsVoice, 'ttsVoice');
  const handleSetIsAgentMode = createSettingUpdater(setIsAgentModeState, 'isAgentMode');
  const handleSetIsMemoryEnabled = createSettingUpdater(setIsMemoryEnabledState, 'isMemoryEnabled');

  // --- Health Check ---
  useEffect(() => {
    const checkBackendStatus = async () => {
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
            setBackendError("Connection lost. Retrying...");
            setTimeout(checkBackendStatus, 5000);
        }
    };
    checkBackendStatus();
  }, []);


  // --- Chat ---
  const chatSettings = useMemo(() => ({
    systemPrompt: `About me: ${aboutUser}\nHow to respond: ${aboutResponse}`,
    temperature,
    maxOutputTokens: maxTokens,
    imageModel,
    videoModel,
  }), [aboutUser, aboutResponse, temperature, maxTokens, imageModel, videoModel]);

  const chat = useChat(activeModel, chatSettings, memory.memoryContent, isAgentMode, apiKey);
  const { updateChatModel, updateChatSettings } = chat;

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

  // --- Handlers ---
  const handleModelChange = useCallback((modelId: string) => {
    setActiveModel(modelId);
    if (chat.currentChatId) updateChatModel(chat.currentChatId, modelId);
  }, [chat.currentChatId, updateChatModel]);
  
  useEffect(() => {
    if (chat.currentChatId) updateChatSettings(chat.currentChatId, { temperature, maxOutputTokens: maxTokens, imageModel, videoModel });
  }, [temperature, maxTokens, imageModel, videoModel, chat.currentChatId, updateChatSettings]);
  
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
    confirmation, handleConfirm, handleCancel: () => setConfirmation(null),
    availableModels, availableImageModels, availableVideoModels, availableTtsModels,
    modelsLoading, activeModel, onModelChange: handleModelChange,
    apiKey, onSaveApiKey: handleSetApiKey, aboutUser, setAboutUser: handleSetAboutUser,
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

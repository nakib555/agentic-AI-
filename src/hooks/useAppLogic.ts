/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { useChat } from './useChat/index';
import { useTheme } from './useTheme';
import { useSidebar } from './useSidebar';
import { useSourcesSidebar } from './useSourcesSidebar';
import { useArtifactSidebar } from './useArtifactSidebar';
import { useViewport } from './useViewport';
import { useMemory } from './useMemory';
import type { Model, Source } from '../types';
import {
  exportChatToJson,
  exportChatToMarkdown,
  exportChatToPdf,
  exportChatToClipboard,
  exportAllChatsToJson,
} from '../utils/exportUtils/index';
import type { MessageListHandle } from '../components/Chat/MessageList';
import {
  DEFAULT_ABOUT_USER,
  DEFAULT_ABOUT_RESPONSE,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TTS_VOICE
} from '../components/App/constants';
import { fetchFromApi, setOnVersionMismatch, getApiBaseUrl } from '../utils/api';
import { testSuite, type TestResult, type TestProgress } from '../components/Testing/testSuite';
import { getSettings, updateSettings, type UpdateSettingsResponse } from '../services/settingsService';
import { logCollector } from '../utils/logCollector';
import { OllamaService } from '../services/ollamaService';


export const useAppLogic = () => {
  const appContainerRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<MessageListHandle>(null);

  // --- Core Hooks ---
  const { theme, setTheme } = useTheme();
  const { isDesktop, visualViewportHeight } = useViewport();
  
  // --- Sidebar Hooks ---
  const sidebar = useSidebar();
  const sourcesSidebar = useSourcesSidebar();
  
  // Artifact sidebar with auto-close logic for mobile
  const artifactSidebar = useArtifactSidebar(() => {
    // On artifact open:
    if (!isDesktop) {
        sidebar.setIsSidebarOpen(false);
        sourcesSidebar.closeSources();
    }
  });
  
  // --- UI State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
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
  
  // Listen for Open Settings requests (e.g. from error prompts)
  useEffect(() => {
      const handleOpenSettings = () => setIsSettingsOpen(true);
      window.addEventListener('open-settings', handleOpenSettings);
      return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  // Global Resize Logic
  // Aggregates resizing state from all sidebars to enforce global UI locks (cursor, pointer-events)
  const isAnyResizing = sidebar.isResizing || sourcesSidebar.isResizing || artifactSidebar.isResizing;

  useEffect(() => {
      if (isAnyResizing) {
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
          document.body.style.webkitUserSelect = 'none'; // Safari
      } else {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.body.style.webkitUserSelect = '';
      }
      return () => {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.body.style.webkitUserSelect = '';
      };
  }, [isAnyResizing]);

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
  const [provider, setProvider] = useState<'gemini' | 'openrouter' | 'ollama'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('');
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
  const [serverUrl, setServerUrl] = useState(() => getApiBaseUrl());
  
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
    // Ensure arrays even if backend sends bad data
    const newModels = Array.isArray(data.models) ? data.models : [];
    const newImageModels = Array.isArray(data.imageModels) ? data.imageModels : [];
    const newVideoModels = Array.isArray(data.videoModels) ? data.videoModels : [];
    const newTtsModels = Array.isArray(data.ttsModels) ? data.ttsModels : [];

    setAvailableModels(newModels);
    setAvailableImageModels(newImageModels);
    setAvailableVideoModels(newVideoModels);
    setAvailableTtsModels(newTtsModels);
    
    const currentActiveModel = activeModelRef.current;
    if (newModels.length > 0) {
        if (!currentActiveModel || !newModels.some((m: Model) => m.id === currentActiveModel)) {
            setActiveModel(newModels[0].id);
        }
    } else {
        if (!currentActiveModel) setActiveModel('');
    }
    
    // For specialized models, keep existing unless invalid/empty
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

  }, []);

  const fetchModels = useCallback(async () => {
    setModelsLoading(true);
    
    // Direct Client-Side Fetch for Ollama
    if (provider === 'ollama' && ollamaUrl) {
        try {
            console.log('[AppLogic] Fetching models directly from local Ollama...');
            const models = await OllamaService.getModels(ollamaUrl);
            setAvailableModels(models);
            
            // Set first model if none selected
            if (models.length > 0 && (!activeModelRef.current || !models.some(m => m.id === activeModelRef.current))) {
                setActiveModel(models[0].id);
            }
            
            // Clear other categories as Ollama doesn't segregate them by API yet
            setAvailableImageModels([]);
            setAvailableVideoModels([]);
            setAvailableTtsModels([]);
        } catch (e) {
            console.error('[AppLogic] Local Ollama fetch failed:', e);
            setAvailableModels([]);
            // IMPORTANT: Throw the error so the caller (Settings Modal) receives it
            throw e;
        } finally {
            setModelsLoading(false);
        }
        return;
    }

    // Backend Fetch for other providers
    try {
        console.log('[AppLogic] Requesting model list from backend...');
        const response = await fetchFromApi('/api/models');
        if (!response.ok) {
             const error = new Error(`Model fetch failed: ${response.status}`);
             console.error('[AppLogic]', error);
             throw error;
        }
        const data = await response.json();
        console.log('[AppLogic] Received model data:', data);
        processModelData(data);
    } catch (error) {
        console.error('[AppLogic] Model fetch error:', error);
        throw error;
    } finally {
        setModelsLoading(false);
    }
  }, [processModelData, provider, ollamaUrl]);

  // Initial Data Load
  useEffect(() => {
    const loadSettings = async () => {
        try {
            setSettingsLoading(true);
            const settings = await getSettings();
            setProvider(settings.provider || 'gemini');
            setApiKey(settings.apiKey);
            setOpenRouterApiKey(settings.openRouterApiKey);
            setOllamaUrl(settings.ollamaUrl || '');
            setSuggestionApiKey(settings.suggestionApiKey);
            setAboutUser(settings.aboutUser);
            setAboutResponse(settings.aboutResponse);
            setTemperature(settings.temperature);
            setMaxTokens(settings.maxTokens);
            setActiveModel(settings.activeModel);
            setImageModel(settings.imageModel);
            setVideoModel(settings.videoModel);
            setTtsModel(settings.ttsModel);
            setIsMemoryEnabledState(settings.isMemoryEnabled);
            setTtsVoice(settings.ttsVoice);
            setIsAgentModeState(settings.isAgentMode);
            // Trigger initial fetch after settings loaded
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setSettingsLoading(false);
        }
    };
    loadSettings();
  }, []);
  
  // Trigger fetch when provider/url changes (and initial load finish)
  useEffect(() => {
      if (!settingsLoading) {
          // Swallow errors for auto-fetch to avoid unhandled promise rejections in console during normal nav
          fetchModels().catch(e => {
              // Only log if it's not a generic abort
              // console.debug("Auto-fetch models suppressed error:", e);
          });
      }
  }, [provider, ollamaUrl, settingsLoading]); 

  const createSettingUpdater = <T,>(setter: Dispatch<SetStateAction<T>>, key: string) => {
    return useCallback((newValue: T) => {
        setter(newValue);
        updateSettings({ [key]: newValue });
    }, [setter, key]);
  };
  
  const handleSetApiKey = useCallback(async (newApiKey: string, providerType: 'gemini' | 'openrouter' | 'ollama') => {
    const isGemini = providerType === 'gemini';
    const isOllama = providerType === 'ollama';

    if (isGemini) setApiKey(newApiKey);
    else if (isOllama) setOllamaUrl(newApiKey); // Reusing key input for URL logic
    else setOpenRouterApiKey(newApiKey);

    try {
        const payload = isGemini 
            ? { apiKey: newApiKey, provider: providerType } 
            : isOllama 
                ? { ollamaUrl: newApiKey, provider: providerType }
                : { openRouterApiKey: newApiKey, provider: providerType };
        
        const response: UpdateSettingsResponse = await updateSettings(payload);
        
        // If switching to backend-managed providers, use the response data
        if (!isOllama && response.models) {
            processModelData(response);
        } else {
            // For Ollama or missing data, trigger manual fetch and await it to catch errors
            await fetchModels(); 
        }
    } catch (error) {
        setAvailableModels([]);
        throw error;
    }
  }, [processModelData, fetchModels]);

  const handleProviderChange = useCallback((newProvider: 'gemini' | 'openrouter' | 'ollama') => {
      setProvider(newProvider);
      updateSettings({ provider: newProvider }).then(response => {
          // If moving away from Ollama, rely on backend data if available
          if (newProvider !== 'ollama' && response.models) {
             processModelData(response);
          }
          // fetchModels effect will trigger for Ollama or fallbacks
      });
  }, [processModelData]);

  const handleSaveServerUrl = useCallback(async (newUrl: string): Promise<boolean> => {
      if (typeof window !== 'undefined') {
          if (!newUrl) localStorage.removeItem('custom_server_url');
          else localStorage.setItem('custom_server_url', newUrl);
      }
      try {
          const response = await fetchFromApi('/api/health');
          if (response.ok) {
              setServerUrl(newUrl);
              setBackendStatus('online');
              setBackendError(null);
              // Safely attempt to fetch models, ignoring errors for the health check step
              fetchModels().catch(() => {});
              return true;
          }
          throw new Error('Health check failed');
      } catch (error) {
          if (typeof window !== 'undefined') {
              if (serverUrl) localStorage.setItem('custom_server_url', serverUrl);
              else localStorage.removeItem('custom_server_url');
          }
          return false;
      }
  }, [fetchModels, serverUrl]);

  const handleSetSuggestionApiKey = createSettingUpdater(setSuggestionApiKey, 'suggestionApiKey');
  const handleSetAboutUser = createSettingUpdater(setAboutUser, 'aboutUser');
  const handleSetAboutResponse = createSettingUpdater(setAboutResponse, 'aboutResponse');
  const handleSetTtsModel = createSettingUpdater(setTtsModel, 'ttsModel');
  const handleSetTtsVoice = createSettingUpdater(setTtsVoice, 'ttsVoice');
  const handleSetIsAgentMode = createSettingUpdater(setIsAgentModeState, 'isAgentMode');
  const handleSetIsMemoryEnabled = createSettingUpdater(setIsMemoryEnabledState, 'isMemoryEnabled');
  
  // Custom handler for Ollama URL saving that performs validation
  const handleSaveOllamaUrl = useCallback(async (url: string) => {
      setOllamaUrl(url); 
      await updateSettings({ ollamaUrl: url });
      // Important: await this to propagate connection errors to the UI
      await fetchModels();
  }, [fetchModels]);

  const chatSettings = useMemo(() => {
    return {
        // We do not combine them here anymore to avoid duplication in the backend.
        // The backend handles the structuring and prioritization.
        systemPrompt: '', 
        aboutUser: aboutUser.trim(),
        aboutResponse: aboutResponse.trim(),
        temperature,
        maxOutputTokens: maxTokens,
        imageModel,
        videoModel,
        isAgentMode // Include current state
    };
  }, [aboutUser, aboutResponse, temperature, maxTokens, imageModel, videoModel, isAgentMode]);

  // Pass active API key based on provider for client-side tools if necessary (though most are backend now)
  const effectiveClientKey = provider === 'gemini' ? apiKey : provider === 'openrouter' ? openRouterApiKey : 'ollama';
  
  const chat = useChat(
      activeModel, 
      chatSettings, 
      memory.memoryContent, 
      isAgentMode, 
      effectiveClientKey, 
      provider,    // Pass provider
      ollamaUrl,   // Pass URL for local calls
      showToast
  );
  
  const { updateChatModel, updateChatSettings, editMessage, navigateBranch, setResponseIndex } = chat; 

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

  // Ref for debouncing model settings saves
  const settingsSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleModelChange = useCallback((modelId: string) => {
    // 1. Instant UI update
    setActiveModel(modelId);
    
    // 2. Debounce Global Settings Save
    if (settingsSaveTimeoutRef.current) clearTimeout(settingsSaveTimeoutRef.current);
    settingsSaveTimeoutRef.current = setTimeout(() => {
        updateSettings({ activeModel: modelId }).catch(console.error);
    }, 1000);

    // 3. Debounce Chat Persistence (if active chat)
    if (chat.currentChatId) {
        updateChatModel(chat.currentChatId, modelId, 1000);
    }
  }, [chat.currentChatId, updateChatModel]);

  const prevChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only update prevChatIdRef if it actually changed
    if (chat.currentChatId !== prevChatIdRef.current) {
        prevChatIdRef.current = chat.currentChatId;
    }

    const currentChat = chat.chatHistory.find(c => c.id === chat.currentChatId);
    if (currentChat) {
        // Force sync activeModel with chat model if they differ
        // This ensures visual consistency if the backend/hook updates independently
        if (currentChat.model && currentChat.model !== activeModel) {
            setActiveModel(currentChat.model);
        }
        
        if (currentChat.temperature !== undefined) setTemperature(currentChat.temperature);
        if (currentChat.maxOutputTokens !== undefined) setMaxTokens(currentChat.maxOutputTokens);
        if (currentChat.imageModel) setImageModel(currentChat.imageModel);
        if (currentChat.videoModel) setVideoModel(currentChat.videoModel);
        
        // NEW: Sync Agent Mode
        if (currentChat.isAgentMode !== undefined) {
            setIsAgentModeState(currentChat.isAgentMode);
        }
    }
  }, [chat.currentChatId, chat.chatHistory, activeModel]); 

  const checkBackendStatusTimeoutRef = useRef<number | null>(null);

  const checkBackendStatus = useCallback(async () => {
    if (checkBackendStatusTimeoutRef.current) {
        window.clearTimeout(checkBackendStatusTimeoutRef.current);
        checkBackendStatusTimeoutRef.current = null;
    }

    try {
        setBackendStatus('checking');
        const response = await fetchFromApi('/api/health');
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
            setBackendStatus('online');
            setBackendError(null);
        } else {
            throw new Error("Invalid response from server");
        }
    } catch (error) {
        setBackendStatus('offline');
        setBackendError("Connection lost. Please check your backend URL.");
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

  const handleExportAllChats = useCallback(() => {
      exportAllChatsToJson(chat.chatHistory);
  }, [chat.chatHistory]);

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
          async () => {
            try {
                await chat.deleteChat(chatId);
                showToast('Chat deleted.', 'success');
            } catch (e) {
                showToast('Failed to delete chat.', 'error');
            }
          },
          { destructive: true }
      );
  }, [chat.deleteChat, requestConfirmation, showToast]);

  const handleRequestClearAll = useCallback(() => {
      requestConfirmation(
          'Are you sure you want to delete all conversation history? This cannot be undone.',
          async () => {
              try {
                  await chat.clearAllChats();
                  showToast('All conversations cleared successfully', 'success');
              } catch (error) {
                  showToast('Failed to clear conversations', 'error');
              }
          },
          { destructive: true }
      );
  }, [requestConfirmation, chat.clearAllChats, showToast]);

  const runDiagnosticTests = useCallback(async (onProgress: (progress: TestProgress) => void) => {
    const results: TestResult[] = [];
    for (let i = 0; i < testSuite.length; i++) {
        const testCase = testSuite[i];
        onProgress({ total: testSuite.length, current: i + 1, description: testCase.description, status: 'running', results });
        try {
            await startNewChat();
            const responseMessage = await chat.sendMessageForTest(testCase.prompt, testCase.options);
            const validation = await testCase.validate(responseMessage);
            results.push(validation);
        } catch (error: any) {
            results.push({ description: testCase.description, pass: false, details: `Error: ${error.message}` });
        }
        onProgress({ total: testSuite.length, current: i + 1, description: testCase.description, status: results[results.length-1].pass ? 'pass' : 'fail', results });
    }
    return JSON.stringify(results, null, 2);
  }, [chat, startNewChat]);

  // Handler for showing sources
  const handleShowSources = useCallback((sources: Source[]) => {
      sourcesSidebar.openSources(sources);
      if (!isDesktop) {
          sidebar.setIsSidebarOpen(false);
      }
  }, [sourcesSidebar, isDesktop, sidebar]);
  
  return {
    appContainerRef, messageListRef, theme, setTheme, isDesktop, visualViewportHeight,
    // Sidebar Props
    ...sidebar,
    handleToggleSidebar: sidebar.toggleSidebar,
    // Sources Sidebar Props
    isSourcesSidebarOpen: sourcesSidebar.isOpen,
    sourcesForSidebar: sourcesSidebar.content,
    sourcesSidebarWidth: sourcesSidebar.width,
    handleSetSourcesSidebarWidth: sourcesSidebar.setWidth,
    isSourcesResizing: sourcesSidebar.isResizing,
    setIsSourcesResizing: sourcesSidebar.setIsResizing,
    handleCloseSourcesSidebar: sourcesSidebar.closeSources,
    handleShowSources,
    // Artifact Sidebar Props
    isArtifactOpen: artifactSidebar.isOpen,
    setIsArtifactOpen: artifactSidebar.setIsOpen,
    artifactContent: artifactSidebar.content,
    artifactLanguage: artifactSidebar.language,
    artifactWidth: artifactSidebar.width,
    setArtifactWidth: artifactSidebar.setWidth,
    isArtifactResizing: artifactSidebar.isResizing,
    setIsArtifactResizing: artifactSidebar.setIsResizing,
    
    isAgentMode, ...memory,
    isAnyResizing,
    isSettingsOpen, setIsSettingsOpen, isMemoryModalOpen, setIsMemoryModalOpen,
    isImportModalOpen, setIsImportModalOpen, 
    backendStatus, backendError, isTestMode, setIsTestMode, settingsLoading, versionMismatch,
    retryConnection: checkBackendStatus,
    confirmation, handleConfirm, handleCancel: () => setConfirmation(null),
    toast, closeToast, showToast,
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
    handleDeleteChatRequest, handleRequestClearAll,
    handleExportChat, handleExportAllChats, handleShareChat, handleImportChat: () => setIsImportModalOpen(true),
    runDiagnosticTests, handleFileUploadForImport, handleDownloadLogs, handleShowDataStructure,
    updateBackendMemory: memory.updateBackendMemory, memoryFiles: memory.memoryFiles, updateMemoryFiles: memory.updateMemoryFiles,
    serverUrl, onSaveServerUrl: handleSaveServerUrl,
    // New Props for Provider
    provider, openRouterApiKey, onProviderChange: handleProviderChange,
    ollamaUrl, onSaveOllamaUrl: handleSaveOllamaUrl, // Updated handler
    // Edit Message and Branch Navigation
    editMessage, navigateBranch,
    setActiveResponseIndex: setResponseIndex
  };
};
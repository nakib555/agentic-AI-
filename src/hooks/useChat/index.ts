/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { runAgenticLoop } from '../../services/agenticLoop/index';
import { type Message, type ChatSession, ModelResponse } from '../../types';
import { fileToBase64 } from '../../utils/fileUtils';
import { useChatHistory } from '../useChatHistory';
import { createAgentCallbacks } from './chat-callbacks';
import { buildApiHistory } from './history-builder';
import { createToolExecutor } from './tool-executor';
import { generateChatTitle, parseApiError } from '../../services/gemini/index';
import { toolDeclarations } from '../../tools/declarations';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    systemPrompt: string; 
    temperature: number; 
    maxOutputTokens: number; 
    imageModel: string;
    videoModel: string;
};

export const useChat = (initialModel: string, settings: ChatSettings, memoryContent: string, isAgentMode: boolean) => {
  const chatHistoryHook = useChatHistory();
  const { chatHistory, currentChatId, updateChatTitle } = chatHistoryHook;
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const executionApprovalRef = useRef<{ resolve: (approved: boolean | string) => void } | null>(null);

  useEffect(() => {
    const currentChat = chatHistory.find(c => c.id === currentChatId);
    if (currentChat && currentChat.title === "New Chat" && currentChat.messages.length >= 2 && !currentChat.isLoading) {
      updateChatTitle(currentChatId!, "Generating title...");
      generateChatTitle(currentChat.messages)
        .then(newTitle => {
            const finalTitle = newTitle.length > 45 ? newTitle.substring(0, 42) + '...' : newTitle;
            updateChatTitle(currentChatId!, finalTitle);
        })
        .catch(err => {
            console.error("Failed to generate chat title:", err);
            updateChatTitle(currentChatId!, "Chat"); 
        });
    }
  }, [chatHistory, currentChatId, updateChatTitle]);

  const messages = useMemo(() => {
    return chatHistory.find(c => c.id === currentChatId)?.messages || [];
  }, [chatHistory, currentChatId]);

  const isLoading = useMemo(() => {
    if (!currentChatId) return false;
    return chatHistory.find(c => c.id === currentChatId)?.isLoading ?? false;
  }, [chatHistory, currentChatId]);

  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    if (executionApprovalRef.current) denyExecution();
  }, []);

  const approveExecution = useCallback((editedPlan: string) => {
    if (executionApprovalRef.current && currentChatId) {
        const lastMessage = chatHistory.find(c=>c.id === currentChatId)!.messages.slice(-1)[0];
        chatHistoryHook.updateMessage(currentChatId, lastMessage.id, { executionState: 'approved' });
        executionApprovalRef.current.resolve(editedPlan);
        executionApprovalRef.current = null;
    }
  }, [currentChatId, chatHistory, chatHistoryHook]);
  
  const denyExecution = useCallback(() => {
    if (executionApprovalRef.current && currentChatId) {
        const lastMessage = chatHistory.find(c=>c.id === currentChatId)!.messages.slice(-1)[0];
        chatHistoryHook.updateMessage(currentChatId, lastMessage.id, { executionState: 'denied' });
        executionApprovalRef.current.resolve(false);
        executionApprovalRef.current = null;
    }
  }, [currentChatId, chatHistory, chatHistoryHook]);

  const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean, isThinkingModeEnabled?: boolean } = {}) => {
    if (isLoading) cancelGeneration();
    abortControllerRef.current = new AbortController();

    const { isHidden = false, isThinkingModeEnabled: optionIsThinkingModeEnabled = false } = options;
    const hasFiles = files && files.length > 0;
    const isThinkingModeEnabled = isAgentMode && (!hasFiles || optionIsThinkingModeEnabled);
    
    let activeChatId = currentChatId || chatHistoryHook.createNewChat(initialModel, { 
        temperature: settings.temperature, 
        maxOutputTokens: settings.maxOutputTokens,
        imageModel: settings.imageModel,
        videoModel: settings.videoModel,
    });

    const attachmentsData = hasFiles ? await Promise.all(files.map(async (file) => ({
        name: file.name, mimeType: file.type, data: await fileToBase64(file),
    }))) : undefined;
    
    const userMessageObj: Message = { id: generateId(), role: 'user', text: userMessage, isHidden, attachments: attachmentsData, activeResponseIndex: 0 };
    chatHistoryHook.addMessagesToChat(activeChatId, [userMessageObj]);

    chatHistoryHook.setChatLoadingState(activeChatId, true);
    const modelPlaceholder: Message = {
        id: generateId(), role: 'model', text: '',
        responses: [{ text: '', toolCallEvents: [], startTime: Date.now() }],
        activeResponseIndex: 0, isThinking: true,
    };
    chatHistoryHook.addMessagesToChat(activeChatId, [modelPlaceholder]);
    
    const activeChat = chatHistoryHook.chatHistory.find(c => c.id === activeChatId);
    const modelForApi = isThinkingModeEnabled ? 'gemini-2.5-pro' : (activeChat?.model || initialModel);
    
    const agenticLoopSettings = {
        isAgentMode: isAgentMode,
        tools: isAgentMode ? toolDeclarations : [{ googleSearch: {} }],
        systemPrompt: settings.systemPrompt,
        temperature: activeChat?.temperature ?? settings.temperature,
        maxOutputTokens: activeChat?.maxOutputTokens ?? settings.maxOutputTokens,
        thinkingBudget: isAgentMode && isThinkingModeEnabled ? 32768 : undefined,
        memoryContent: memoryContent,
    };
    
    const allMessagesForApi = [...(activeChat?.messages || []), userMessageObj];
    const historyForApi = buildApiHistory(allMessagesForApi);
    const toolExecutor = createToolExecutor(
        activeChat?.imageModel || settings.imageModel,
        activeChat?.videoModel || settings.videoModel
    );
    const callbacks = createAgentCallbacks(activeChatId, modelPlaceholder.id, chatHistoryHook, { abortControllerRef }, isThinkingModeEnabled, executionApprovalRef);

    await runAgenticLoop({
      model: modelForApi, history: historyForApi, toolExecutor, callbacks,
      signal: abortControllerRef.current.signal, settings: agenticLoopSettings,
    });
  };

  const regenerateResponse = useCallback(async (aiMessageId: string) => {
    if (!currentChatId || isLoading) return;
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (!chat || chat.messages.findIndex(m => m.id === aiMessageId) < 1) return;
    
    abortControllerRef.current = new AbortController();

    const historyForApi = buildApiHistory(chat.messages.slice(0, chat.messages.findIndex(m => m.id === aiMessageId)));
    
    chatHistoryHook.setChatLoadingState(currentChatId, true);
    chatHistoryHook.updateMessage(currentChatId, aiMessageId, { isThinking: true });
    
    const newResponsePlaceholder: ModelResponse = { text: '', toolCallEvents: [], startTime: Date.now() };
    chatHistoryHook.addModelResponse(currentChatId, aiMessageId, newResponsePlaceholder);

    const isThinkingModeEnabled = isAgentMode && !historyForApi.some(m => m.parts.some(p => 'inlineData' in p));
    const modelForApi = isThinkingModeEnabled ? 'gemini-2.5-pro' : (chat?.model || initialModel);
        
    const agenticLoopSettings = {
        isAgentMode,
        tools: isAgentMode ? toolDeclarations : [{ googleSearch: {} }],
        systemPrompt: settings.systemPrompt,
        temperature: chat?.temperature ?? settings.temperature,
        maxOutputTokens: chat?.maxOutputTokens ?? settings.maxOutputTokens,
        thinkingBudget: isAgentMode && isThinkingModeEnabled ? 32768 : undefined,
        memoryContent,
    };
    
    const toolExecutor = createToolExecutor(chat?.imageModel || settings.imageModel, chat?.videoModel || settings.videoModel);
    const callbacks = createAgentCallbacks(currentChatId, aiMessageId, chatHistoryHook, { abortControllerRef }, isThinkingModeEnabled, executionApprovalRef);

    await runAgenticLoop({
      model: modelForApi, history: historyForApi, toolExecutor, callbacks,
      signal: abortControllerRef.current.signal, settings: agenticLoopSettings,
    });

  }, [currentChatId, chatHistory, isLoading, chatHistoryHook, initialModel, settings, memoryContent, isAgentMode]);
  
  return { ...chatHistoryHook, messages, sendMessage, isLoading, cancelGeneration, approveExecution, denyExecution, regenerateResponse };
};
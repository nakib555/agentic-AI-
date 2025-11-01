/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 4 of 4 from src/hooks/useChat.ts
// The new main hook file, composing the refactored parts.

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { runAgenticLoop } from '../../services/agenticLoop/index';
import { type Message, type ChatSession } from '../../types';
import { fileToBase64 } from '../../utils/fileUtils';
import { useChatHistory } from '../useChatHistory';
import { createAgentCallbacks } from './chat-callbacks';
import { buildApiHistory } from './history-builder';
import { createToolExecutor } from './tool-executor';
import { generateChatTitle } from '../../services/gemini/index';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    systemPrompt: string; 
    temperature: number; 
    maxOutputTokens: number; 
};

export const useChat = (initialModel: string, settings: ChatSettings, memoryContent: string) => {
  const chatHistoryHook = useChatHistory();
  const { chatHistory, currentChatId, updateChatTitle } = chatHistoryHook;
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const executionApprovalRef = useRef<{ resolve: (approved: boolean) => void } | null>(null);

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
    if (chatHistoryHook.isHistoryLoading) {
      return [{ id: 'initial-loading-placeholder', role: 'model' as const, text: '', isThinking: true }];
    }
    return chatHistory.find(c => c.id === currentChatId)?.messages || [];
  }, [chatHistoryHook.isHistoryLoading, chatHistory, currentChatId]);

  const isLoading = useMemo(() => {
    if (chatHistoryHook.isHistoryLoading) return true;
    if (!currentChatId) return false;
    return chatHistory.find(c => c.id === currentChatId)?.isLoading ?? false;
  }, [chatHistoryHook.isHistoryLoading, chatHistory, currentChatId]);

  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    if (executionApprovalRef.current) {
        denyExecution();
    }
  }, []);

  const approveExecution = useCallback(() => {
    if (executionApprovalRef.current && currentChatId) {
        chatHistoryHook.updateLastMessage(currentChatId, () => ({ executionState: 'approved' }));
        executionApprovalRef.current.resolve(true);
        executionApprovalRef.current = null;
    }
  }, [currentChatId, chatHistoryHook]);
  
  const denyExecution = useCallback(() => {
    if (executionApprovalRef.current && currentChatId) {
        chatHistoryHook.updateLastMessage(currentChatId, () => ({ executionState: 'denied' }));
        executionApprovalRef.current.resolve(false);
        executionApprovalRef.current = null;
    }
  }, [currentChatId, chatHistoryHook]);

  const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean, isThinkingModeEnabled?: boolean } = {}) => {
    if (isLoading) cancelGeneration();
    abortControllerRef.current = new AbortController();

    const { isHidden = false, isThinkingModeEnabled = false } = options;
    
    let activeChatId = currentChatId;
    if (!activeChatId) {
        activeChatId = chatHistoryHook.createNewChat(initialModel, { 
            temperature: settings.temperature, 
            maxOutputTokens: settings.maxOutputTokens
        });
    }

    const attachmentsData = files && files.length > 0 ? await Promise.all(files.map(async (file) => ({
        name: file.name, mimeType: file.type, data: await fileToBase64(file),
    }))) : undefined;
    
    const userMessageObj: Message = { id: generateId(), role: 'user', text: userMessage, isHidden, attachments: attachmentsData };
    chatHistoryHook.addMessagesToChat(activeChatId, [userMessageObj]);

    chatHistoryHook.setChatLoadingState(activeChatId, true);
    const modelPlaceholder: Message = { id: generateId(), role: 'model', text: '', isThinking: true, toolCallEvents: [], startTime: Date.now() };
    chatHistoryHook.addMessagesToChat(activeChatId, [modelPlaceholder]);

    const activeChat = chatHistoryHook.chatHistory.find(c => c.id === activeChatId);
    const hasVideoAttachment = userMessageObj.attachments?.some(att => att.mimeType.startsWith('video/')) ?? false;
    const modelForApi = isThinkingModeEnabled || hasVideoAttachment ? 'gemini-2.5-pro' : (activeChat?.model || initialModel);
        
    const chatSettings = {
        systemPrompt: settings.systemPrompt,
        temperature: activeChat?.temperature ?? settings.temperature,
        maxOutputTokens: activeChat?.maxOutputTokens ?? settings.maxOutputTokens,
        thinkingBudget: isThinkingModeEnabled ? 32768 : undefined,
        memoryContent: memoryContent,
    };
    
    const allMessagesForApi = [...(activeChat?.messages || []), userMessageObj];
    const historyForApi = buildApiHistory(allMessagesForApi);
    const toolExecutor = createToolExecutor(chatHistory, activeChatId);
    const callbacks = createAgentCallbacks(activeChatId, chatHistoryHook, { abortControllerRef }, isThinkingModeEnabled, executionApprovalRef);

    await runAgenticLoop({
      model: modelForApi, history: historyForApi, toolExecutor, callbacks,
      signal: abortControllerRef.current.signal, settings: chatSettings,
    });
  };
  
  return { ...chatHistoryHook, messages, sendMessage, isLoading, cancelGeneration, approveExecution, denyExecution };
};

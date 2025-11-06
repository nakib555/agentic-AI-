/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { runAgenticLoop } from '../../services/agenticLoop/index';
import { type Message, type ChatSession, ModelResponse } from '../../types';
import { fileToBase64 } from '../../utils/fileUtils';
import { useChatHistory } from '../useChatHistory';
import { buildApiHistory } from './history-builder';
import { generateChatTitle } from '../../services/gemini/index';
import { chatStore } from '../../services/chatStore';

const generateId = () => Math.random().toString(36).substring(2, 9);
const CHAT_UPDATES_CHANNEL = new BroadcastChannel('chat-updates');

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
    }
  }, [chatHistory, currentChatId, updateChatTitle]);

  const messages = useMemo(() => {
    return chatHistory.find(c => c.id === currentChatId)?.messages || [];
  }, [chatHistory, currentChatId]);

  const isLoading = useMemo(() => {
    return chatHistory.find(c => c.id === currentChatId)?.isLoading ?? false;
  }, [chatHistory, currentChatId]);

  const cancelGeneration = useCallback(() => {
    if (!currentChatId) return;
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (!chat || !chat.isLoading) return;

    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage?.role === 'model' && lastMessage.isThinking) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CANCEL_GENERATION',
        payload: { messageId: lastMessage.id },
      });
    }
    if (executionApprovalRef.current) {
        denyExecution();
    }
  }, [chatHistory, currentChatId]);

  const approveExecution = useCallback(async (editedPlan: string) => {
    if (!currentChatId) return;
    const chat = await chatStore.getChat(currentChatId);
    if (!chat) return;

    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage?.role === 'model') {
        lastMessage.executionState = 'approved';
        await chatStore.saveChat(chat);
        CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
        
        navigator.serviceWorker.controller?.postMessage({
            type: 'APPROVE_EXECUTION',
            payload: { messageId: lastMessage.id, editedPlan },
        });
    }
  }, [currentChatId]);
  
  const denyExecution = useCallback(async () => {
    if (!currentChatId) return;
    const chat = await chatStore.getChat(currentChatId);
    if (!chat) return;
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage?.role === 'model') {
        navigator.serviceWorker.controller?.postMessage({
            type: 'CANCEL_GENERATION',
            payload: { messageId: lastMessage.id },
        });
    }
  }, [currentChatId]);

  const sendMessage = async (userMessage: string, files?: File[], options: { isHidden?: boolean, isThinkingModeEnabled?: boolean } = {}) => {
    if (isLoading) cancelGeneration();

    const { isHidden = false, isThinkingModeEnabled: optionIsThinkingModeEnabled = false } = options;
    const hasFiles = files && files.length > 0;
    const isThinkingModeEnabled = isAgentMode && (!hasFiles || optionIsThinkingModeEnabled);
    
    let activeChatId = currentChatId;
    if (!activeChatId) {
        activeChatId = await chatHistoryHook.createNewChat(initialModel, settings);
    }
    
    const attachmentsData = hasFiles ? await Promise.all(files.map(async (file) => ({
        name: file.name, mimeType: file.type, data: await fileToBase64(file),
    }))) : undefined;
    
    const userMessageObj: Message = { id: generateId(), role: 'user', text: userMessage, isHidden, attachments: attachmentsData, activeResponseIndex: 0 };
    const modelPlaceholder: Message = { id: generateId(), role: 'model', text: '', responses: [{ text: '', startTime: Date.now() }], activeResponseIndex: 0, isThinking: true };

    await chatHistoryHook.addMessagesToChat(activeChatId, [userMessageObj, modelPlaceholder]);
    chatHistoryHook.setChatLoadingState(activeChatId, true);

    const activeChat = await chatStore.getChat(activeChatId);
    if (!activeChat) return;

    const modelForApi = isAgentMode ? 'gemini-2.5-pro' : (activeChat?.model || initialModel);
    
    const agenticLoopSettings = {
        systemPrompt: settings.systemPrompt,
        temperature: activeChat?.temperature ?? settings.temperature,
        maxOutputTokens: activeChat?.maxOutputTokens ?? settings.maxOutputTokens,
        memoryContent: memoryContent,
        apiKey: process.env.API_KEY,
    };
    
    const historyForApi = buildApiHistory(activeChat.messages);

    navigator.serviceWorker.controller?.postMessage({
        type: 'START_GENERATION',
        payload: {
            chatId: activeChatId,
            messageId: modelPlaceholder.id,
            model: modelForApi,
            history: historyForApi,
            settings: agenticLoopSettings,
        }
    });
  };

  const regenerateResponse = useCallback(async (aiMessageId: string) => {
    if (!currentChatId || isLoading) return;

    const chat = await chatStore.getChat(currentChatId);
    if (!chat) return;

    const aiMessageIndex = chat.messages.findIndex(m => m.id === aiMessageId);
    if (aiMessageIndex < 1) return;

    // Create a new response placeholder
    const newResponse: ModelResponse = { text: '', startTime: Date.now() };
    const aiMessage = chat.messages[aiMessageIndex];
    aiMessage.responses.push(newResponse);
    aiMessage.activeResponseIndex = aiMessage.responses.length - 1;
    aiMessage.isThinking = true;

    await chatStore.saveChat(chat);
    CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
    chatHistoryHook.setChatLoadingState(currentChatId, true);

    const historyForApi = buildApiHistory(chat.messages.slice(0, aiMessageIndex));
    const modelForApi = isAgentMode ? 'gemini-2.5-pro' : (chat.model || initialModel);
    
    const agenticLoopSettings = { /* ... similar to sendMessage ... */ 
        systemPrompt: settings.systemPrompt,
        temperature: chat?.temperature ?? settings.temperature,
        maxOutputTokens: chat?.maxOutputTokens ?? settings.maxOutputTokens,
        memoryContent: memoryContent,
        apiKey: process.env.API_KEY,
    };

    navigator.serviceWorker.controller?.postMessage({
        type: 'START_GENERATION',
        payload: {
            chatId: currentChatId,
            messageId: aiMessageId,
            model: modelForApi,
            history: historyForApi,
            settings: agenticLoopSettings,
        }
    });
  }, [currentChatId, isLoading, isAgentMode, initialModel, settings, memoryContent, chatHistoryHook]);
  
  return { ...chatHistoryHook, messages, sendMessage, isLoading, cancelGeneration, approveExecution, denyExecution, regenerateResponse };
};

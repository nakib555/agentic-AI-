/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, Message } from '../types';
import { chatStore } from '../services/chatStore';
import { DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL } from '../components/App/constants';

const generateId = () => Math.random().toString(36).substring(2, 9);
const CHAT_UPDATES_CHANNEL = new BroadcastChannel('chat-updates');
const CURRENT_CHAT_ID_KEY = 'currentChatId';

type ChatSettings = { 
    temperature: number; 
    maxOutputTokens: number; 
    imageModel: string;
    videoModel: string;
};

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => localStorage.getItem(CURRENT_CHAT_ID_KEY));
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const refreshHistory = useCallback(async () => {
    try {
        const history = await chatStore.getHistory();
        setChatHistory(history);
    } catch (error) {
        console.error("Failed to refresh history from IndexedDB:", error);
    }
  }, []);

  // Load from IndexedDB and listen for updates
  useEffect(() => {
    refreshHistory().finally(() => setIsHistoryLoading(false));
    
    const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'HISTORY_UPDATED') {
            refreshHistory();
        }
    };
    CHAT_UPDATES_CHANNEL.addEventListener('message', handleMessage);

    return () => {
        CHAT_UPDATES_CHANNEL.removeEventListener('message', handleMessage);
    };
  }, [refreshHistory]);

  // Persist current chat ID to localStorage for quick access on reload
  useEffect(() => {
    if (currentChatId) {
        localStorage.setItem(CURRENT_CHAT_ID_KEY, currentChatId);
    } else {
        localStorage.removeItem(CURRENT_CHAT_ID_KEY);
    }
  }, [currentChatId]);


  const startNewChat = useCallback(() => {
    setCurrentChatId(null);
  }, []);

  const loadChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);
  
  const deleteChat = useCallback(async (chatId: string) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      await chatStore.deleteChat(chatId);
      CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
      if (currentChatId === chatId) {
          setCurrentChatId(null);
      }
    }
  }, [currentChatId]);

  const clearAllChats = useCallback(async () => {
    await chatStore.clearAll();
    CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
    setCurrentChatId(null);
  }, []);

  const importChat = useCallback(async (importedChat: ChatSession) => {
    if (!importedChat || typeof importedChat.title !== 'string' || !Array.isArray(importedChat.messages)) {
        alert("The selected file is not a valid chat export.");
        return;
    }
    const newChat: ChatSession = {
        ...importedChat,
        id: generateId(),
        createdAt: Date.now(),
        isLoading: false,
        imageModel: importedChat.imageModel || DEFAULT_IMAGE_MODEL,
        videoModel: importedChat.videoModel || DEFAULT_VIDEO_MODEL,
    };
    await chatStore.saveChat(newChat);
    CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
    setCurrentChatId(newChat.id);
  }, []);

  const createNewChat = useCallback(async (initialModel: string, settings: ChatSettings): Promise<string> => {
    const newChatId = generateId();
    const newChat: ChatSession = {
        id: newChatId,
        title: "New Chat",
        messages: [],
        model: initialModel,
        isLoading: false,
        createdAt: Date.now(),
        ...settings,
    };
    await chatStore.saveChat(newChat);
    CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
    setCurrentChatId(newChatId);
    return newChatId;
  }, []);
  
  const updateChatProperty = useCallback(async <K extends keyof ChatSession>(
    chatId: string,
    property: K,
    value: ChatSession[K]
  ) => {
    const chat = await chatStore.getChat(chatId);
    if (chat) {
        chat[property] = value;
        await chatStore.saveChat(chat);
        CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
    }
  }, []);

  const updateChatTitle = useCallback((chatId: string, title: string) => updateChatProperty(chatId, 'title', title), [updateChatProperty]);
  const updateChatModel = useCallback((chatId: string, model: string) => updateChatProperty(chatId, 'model', model), [updateChatProperty]);
  const updateChatSettings = useCallback((chatId: string, newSettings: Partial<Pick<ChatSession, 'temperature' | 'maxOutputTokens' | 'imageModel' | 'videoModel'>>) => {
     chatStore.getChat(chatId).then(chat => {
        if(chat) {
            const updatedChat = { ...chat, ...newSettings };
            chatStore.saveChat(updatedChat).then(() => {
                CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
            });
        }
     });
  }, []);
  const setActiveResponseIndex = useCallback((chatId: string, messageId: string, index: number) => {
    chatStore.getChat(chatId).then(chat => {
        if(chat) {
            const msgIndex = chat.messages.findIndex(m => m.id === messageId);
            if (msgIndex !== -1) {
                chat.messages[msgIndex].activeResponseIndex = index;
                chatStore.saveChat(chat).then(() => {
                    CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
                });
            }
        }
    });
  }, []);

  return { 
    chatHistory, currentChatId, isHistoryLoading,
    startNewChat, loadChat, deleteChat, clearAllChats, createNewChat,
    updateChatTitle, updateChatModel, updateChatSettings, importChat,
    setActiveResponseIndex,
    // Methods that are now handled by the service worker and useChat hook
    addMessagesToChat: async (chatId: string, messages: Message[]) => {
        await chatStore.addMessages(chatId, messages);
        CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
    },
    setChatLoadingState: (chatId: string, isLoading: boolean) => updateChatProperty(chatId, 'isLoading', isLoading),
    updateMessage: async (chatId: string, messageId: string, update: Partial<Message>) => {
      const chat = await chatStore.getChat(chatId);
      if (chat) {
        const msgIndex = chat.messages.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
            chat.messages[msgIndex] = { ...chat.messages[msgIndex], ...update };
            await chatStore.saveChat(chat);
            CHAT_UPDATES_CHANNEL.postMessage({ type: 'HISTORY_UPDATED' });
        }
      }
    },
  };
};

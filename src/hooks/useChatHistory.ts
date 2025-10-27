/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, Message } from '../types';
import { validModels } from '../services/modelService';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    systemPrompt: string; 
    temperature: number; 
    maxOutputTokens: number; 
};

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Load from local storage
  useEffect(() => {
    try {
      const savedHistoryJSON = localStorage.getItem('chatHistory');
      const savedChatId = localStorage.getItem('currentChatId');
      
      const validModelIds = new Set(validModels.map(m => m.id));
      const defaultModelId = validModels.find(m => m.id === 'gemini-2.5-flash')?.id || validModels[0].id;

      // Add a migration step to add createdAt timestamp and validate model
      const history = (savedHistoryJSON ? JSON.parse(savedHistoryJSON) : []).map((chat: any) => {
          const migratedChat = {
            ...chat,
            createdAt: chat.createdAt || Date.now()
          };

          if (!migratedChat.model || !validModelIds.has(migratedChat.model)) {
              migratedChat.model = defaultModelId;
          }

          return migratedChat;
      });

      setChatHistory(history);

      if (savedChatId && savedChatId !== 'null') {
        if (history.some((c: ChatSession) => c.id === savedChatId)) {
          setCurrentChatId(savedChatId);
        } else {
          setCurrentChatId(null);
        }
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      localStorage.removeItem('chatHistory');
      localStorage.removeItem('currentChatId');
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    localStorage.setItem('currentChatId', String(currentChatId));
  }, [chatHistory, currentChatId]);

  const startNewChat = useCallback(() => {
    setCurrentChatId(null);
  }, []);

  const loadChat = useCallback((chatId: string) => {
    if (chatHistory.some(c => c.id === chatId)) {
      setCurrentChatId(chatId);
    }
  }, [chatHistory]);
  
  const deleteChat = useCallback((chatId: string) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      setChatHistory(prev => prev.filter(c => c.id !== chatId));
      setCurrentChatId(prevCurrentChatId => {
        if (prevCurrentChatId === chatId) {
          return null;
        }
        return prevCurrentChatId;
      });
    }
  }, []);

  const clearAllChats = useCallback(() => {
    setChatHistory([]);
    setCurrentChatId(null);
  }, []);

  const createNewChat = useCallback((initialModel: string, settings: ChatSettings): string => {
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
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    return newChatId;
  }, []);
  
  const addMessagesToChat = useCallback((chatId: string, messages: Message[]) => {
    setChatHistory(prev => prev.map(s => {
      if (s.id !== chatId) return s;
      return { ...s, messages: [...s.messages, ...messages] };
    }));
  }, []);
  
  const updateLastMessage = useCallback((chatId: string, updateFn: (msg: Message) => Partial<Message>) => {
      setChatHistory(prev => prev.map(s => {
          if (s.id !== chatId) return s;
          const lastMsgIndex = s.messages.length - 1;
          if (lastMsgIndex < 0) return s;
          const updatedMessages = [...s.messages];
          const update = updateFn(updatedMessages[lastMsgIndex]);
          updatedMessages[lastMsgIndex] = { ...updatedMessages[lastMsgIndex], ...update };
          return { ...s, messages: updatedMessages };
      }));
  }, []);

  const setChatLoadingState = useCallback((chatId: string, isLoading: boolean) => {
      setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, isLoading } : s));
  }, []);

  const completeChatLoading = useCallback((chatId: string) => {
      setChatLoadingState(chatId, false);
  }, [setChatLoadingState]);

  const updateMessage = useCallback((chatId: string, messageId: string, update: Partial<Message>) => {
    setChatHistory(prev => prev.map(chat => {
        if (chat.id !== chatId) return chat;
        const messageIndex = chat.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return chat;
        
        const updatedMessages = [...chat.messages];
        updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], ...update };
        
        return { ...chat, messages: updatedMessages };
    }));
  }, []);

  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, title } : s));
  }, []);

  const updateChatModel = useCallback((chatId: string, model: string) => {
    setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, model } : s));
  }, []);

  const updateChatSettings = useCallback((chatId: string, newSettings: Partial<Pick<ChatSession, 'systemPrompt' | 'temperature' | 'maxOutputTokens'>>) => {
    setChatHistory(prev => prev.map(s => {
      if (s.id !== chatId) return s;
      return { ...s, ...newSettings };
    }));
  }, []);

  return { 
    chatHistory, 
    currentChatId,
    isHistoryLoading,
    startNewChat, 
    loadChat, 
    deleteChat, 
    clearAllChats,
    createNewChat,
    addMessagesToChat,
    updateLastMessage,
    setChatLoadingState,
    updateMessage,
    completeChatLoading,
    updateChatTitle,
    updateChatModel,
    updateChatSettings,
  };
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, Message } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Load from local storage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('chatHistory');
      const savedChatId = localStorage.getItem('currentChatId');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
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

  const createNewChat = useCallback((initialModel: string): string => {
    const newChatId = generateId();
    const newChat: ChatSession = {
        id: newChatId,
        title: "New Chat",
        messages: [],
        model: initialModel,
        isLoading: false,
    };
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    return newChatId;
  }, []);
  
  const addMessagesToChat = useCallback((chatId: string, messages: Message[]) => {
    setChatHistory(prev => prev.map(s => {
      if (s.id !== chatId) return s;
      return { ...s, messages: [...s.messages, ...messages], isLoading: true };
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

  const completeChatLoading = useCallback((chatId: string) => {
      setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, isLoading: false } : s));
  }, []);

  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, title } : s));
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
    completeChatLoading,
    updateChatTitle,
  };
};

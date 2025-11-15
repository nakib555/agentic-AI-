/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, Message, ModelResponse } from '../types';
import { API_BASE_URL } from '../utils/api';

const fetchApi = async (url: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'API request failed');
    }
    if (response.status === 204) return null; // No Content
    return response.json();
};

export const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Load history from backend on initial mount
  useEffect(() => {
    const loadHistory = async () => {
        try {
            const history = await fetchApi('/api/history');
            setChatHistory(history);
            
            const savedChatId = localStorage.getItem('currentChatId');
            if (savedChatId && history.some((c: ChatSession) => c.id === savedChatId)) {
                setCurrentChatId(savedChatId);
            } else {
                setCurrentChatId(null);
            }
        } catch (error) {
            console.error("Failed to load chat history from backend:", error);
        } finally {
            setIsHistoryLoading(false);
        }
    };
    loadHistory();
  }, []);

  // Save currentChatId to localStorage for session persistence
  useEffect(() => {
    if (!isHistoryLoading) {
        localStorage.setItem('currentChatId', String(currentChatId));
    }
  }, [currentChatId, isHistoryLoading]);

  const startNewChat = useCallback(async (model: string, settings: any): Promise<ChatSession | null> => {
    try {
        const newChat: ChatSession = await fetchApi('/api/chats/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, ...settings }),
        });
        setChatHistory(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        return newChat;
    } catch (error) {
        console.error("Failed to create new chat:", error);
        return null;
    }
  }, []);

  const loadChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);
  
  const deleteChat = useCallback(async (chatId: string) => {
    if (window.confirm('Are you sure you want to delete this chat? This will also delete any associated files.')) {
        try {
            await fetchApi(`/api/chats/${chatId}`, { method: 'DELETE' });
            setChatHistory(prev => prev.filter(c => c.id !== chatId));
            if (currentChatId === chatId) {
                setCurrentChatId(null);
            }
        } catch (error) {
            console.error(`Failed to delete chat ${chatId}:`, error);
        }
    }
  }, [currentChatId]);

  const clearAllChats = useCallback(async () => {
    try {
        await fetchApi('/api/history', { method: 'DELETE' });
        setChatHistory([]);
        setCurrentChatId(null);
    } catch (error) {
        console.error('Failed to clear all chats:', error);
    }
  }, []);

  const importChat = useCallback(async (importedChat: ChatSession) => {
    try {
        const newChat = await fetchApi('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(importedChat),
        });
        setChatHistory(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
    } catch (error) {
        console.error('Failed to import chat:', error);
        alert('Failed to import chat. Please check the file format.');
    }
  }, []);
  
  // Local state updates for real-time UI changes during a chat session
  const addMessagesToChat = useCallback((chatId: string, messages: Message[]) => {
    setChatHistory(prev => prev.map(s => s.id !== chatId ? s : { ...s, messages: [...s.messages, ...messages] }));
  }, []);

  const addModelResponse = useCallback((chatId: string, messageId: string, newResponse: ModelResponse) => {
    setChatHistory(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      const messageIndex = chat.messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return chat;
      const updatedMessages = [...chat.messages];
      const targetMessage = { ...updatedMessages[messageIndex] };
      targetMessage.responses = [...(targetMessage.responses || []), newResponse];
      targetMessage.activeResponseIndex = targetMessage.responses.length - 1;
      updatedMessages[messageIndex] = targetMessage;
      return { ...chat, messages: updatedMessages };
    }));
  }, []);
  
  const updateActiveResponseOnMessage = useCallback((chatId: string, messageId: string, updateFn: (response: ModelResponse) => Partial<ModelResponse>) => {
    setChatHistory(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      const messageIndex = chat.messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1 || chat.messages[messageIndex].role !== 'model') return chat;
      const updatedMessages = [...chat.messages];
      const messageToUpdate = { ...updatedMessages[messageIndex] };
      if (!messageToUpdate.responses) return chat;
      const activeIdx = messageToUpdate.activeResponseIndex;
      if (activeIdx < 0 || activeIdx >= messageToUpdate.responses.length) return chat;
      const updatedResponses = [...messageToUpdate.responses];
      const currentResponse = updatedResponses[activeIdx];
      // FIX: Use `updateFn(currentResponse)` instead of `update`
      updatedResponses[activeIdx] = { ...currentResponse, ...updateFn(currentResponse) };
      messageToUpdate.responses = updatedResponses;
      updatedMessages[messageIndex] = messageToUpdate;
      return { ...chat, messages: updatedMessages };
    }));
  }, []);

  const setActiveResponseIndex = useCallback((chatId: string, messageId: string, index: number) => {
    setChatHistory(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      const messageIndex = chat.messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return chat;
      const updatedMessages = [...chat.messages];
      const currentMessage = updatedMessages[messageIndex];
      if (index >= 0 && index < (currentMessage.responses?.length || 0)) {
        updatedMessages[messageIndex] = { ...currentMessage, activeResponseIndex: index };
      }
      return { ...chat, messages: updatedMessages };
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

  const updateChatProperty = async (chatId: string, update: Partial<ChatSession>) => {
      try {
          await fetchApi(`/api/chats/${chatId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(update),
          });
          setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, ...update } : s));
      } catch (error) {
          console.error(`Failed to update chat ${chatId}:`, error);
      }
  };
  
  const updateChatTitle = (chatId: string, title: string) => updateChatProperty(chatId, { title });
  const updateChatModel = (chatId: string, model: string) => updateChatProperty(chatId, { model });
  const updateChatSettings = (chatId: string, settings: Partial<Pick<ChatSession, 'temperature' | 'maxOutputTokens' | 'imageModel' | 'videoModel'>>) => updateChatProperty(chatId, settings);

  return { 
    chatHistory, currentChatId, isHistoryLoading,
    startNewChat, loadChat, deleteChat, clearAllChats, importChat,
    addMessagesToChat, addModelResponse, updateActiveResponseOnMessage, setActiveResponseIndex,
    updateMessage, setChatLoadingState, completeChatLoading,
    updateChatTitle, updateChatModel, updateChatSettings
  };
};
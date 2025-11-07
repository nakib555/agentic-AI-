/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, Message, ModelResponse } from '../types';
import { validModels } from '../services/modelService';
import { DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL } from '../components/App/constants';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    temperature: number; 
    maxOutputTokens: number; 
    imageModel: string;
    videoModel: string;
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
          const migratedChat: ChatSession = {
            ...chat,
            createdAt: chat.createdAt || Date.now()
          };
          
          delete (migratedChat as any).systemPrompt;

          if (!migratedChat.model || !validModelIds.has(migratedChat.model)) {
              migratedChat.model = defaultModelId;
          }

          if (!migratedChat.imageModel) {
            migratedChat.imageModel = DEFAULT_IMAGE_MODEL;
          }

          if (!migratedChat.videoModel) {
            migratedChat.videoModel = DEFAULT_VIDEO_MODEL;
          }
          
          // Migration for regeneration feature
          migratedChat.messages = (migratedChat.messages || []).map((msg: any) => {
            if (msg.role === 'user') {
              return { ...msg, activeResponseIndex: 0 };
            }
            if (msg.role === 'model' && !msg.responses) {
               return {
                  id: msg.id,
                  role: 'model',
                  responses: [{
                    text: msg.text,
                    toolCallEvents: msg.toolCallEvents,
                    error: msg.error,
                    startTime: msg.startTime || 0,
                    endTime: msg.endTime,
                    suggestedActions: msg.suggestedActions,
                    plan: msg.plan,
                  }],
                  activeResponseIndex: msg.activeResponseIndex ?? 0,
                  isThinking: msg.isThinking,
                  isHidden: msg.isHidden,
                  isPinned: msg.isPinned,
                  executionState: msg.executionState,
               };
            }
            return msg;
          });

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
    try {
      localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
      localStorage.setItem('currentChatId', String(currentChatId));
    } catch (error) {
      console.error("Failed to save chat history to localStorage:", error);
    }
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

  const importChat = useCallback((importedChat: ChatSession) => {
    // Validate the imported chat object
    if (!importedChat || typeof importedChat.title !== 'string' || !Array.isArray(importedChat.messages)) {
        console.error("Invalid chat file format.");
        alert("The selected file is not a valid chat export.");
        return;
    }

    const newChat: ChatSession = {
        ...importedChat,
        id: generateId(), // Always generate a new ID
        createdAt: Date.now(), // Always set a new creation date
        isLoading: false, // Ensure it's not in a loading state
        imageModel: importedChat.imageModel || DEFAULT_IMAGE_MODEL,
        videoModel: importedChat.videoModel || DEFAULT_VIDEO_MODEL,
    };
    
    delete (newChat as any).systemPrompt;

    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id); // Automatically load the imported chat
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
    setChatHistory(prev => {
      return prev.map(chat => {
        if (chat.id !== chatId) return chat;

        const messageIndex = chat.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || chat.messages[messageIndex].role !== 'model') {
          console.warn(`Attempted to update a response on a message that doesn't exist or isn't a model message. ChatID: ${chatId}, MessageID: ${messageId}`);
          return chat;
        }

        const updatedMessages = [...chat.messages];
        const messageToUpdate = { ...updatedMessages[messageIndex] };
        
        if (!messageToUpdate.responses) return chat;

        const activeIdx = messageToUpdate.activeResponseIndex;
        if (activeIdx < 0 || activeIdx >= messageToUpdate.responses.length) return chat;

        const updatedResponses = [...messageToUpdate.responses];
        const currentResponse = updatedResponses[activeIdx];
        const update = updateFn(currentResponse);
        updatedResponses[activeIdx] = { ...currentResponse, ...update };
        
        messageToUpdate.responses = updatedResponses;
        updatedMessages[messageIndex] = messageToUpdate;

        return { ...chat, messages: updatedMessages };
      });
    });
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

  const toggleMessagePin = useCallback((chatId: string, messageId: string) => {
    setChatHistory(prev => prev.map(chat => {
        if (chat.id !== chatId) return chat;
        const messageIndex = chat.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return chat;
        
        const updatedMessages = [...chat.messages];
        const currentMessage = updatedMessages[messageIndex];
        updatedMessages[messageIndex] = { ...currentMessage, isPinned: !currentMessage.isPinned };
        
        return { ...chat, messages: updatedMessages };
    }));
  }, []);

  const updateChatTitle = useCallback((chatId: string, title: string) => {
    setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, title } : s));
  }, []);

  const updateChatModel = useCallback((chatId: string, model: string) => {
    setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, model } : s));
  }, []);

  const updateChatImageModel = useCallback((chatId: string, imageModel: string) => {
    setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, imageModel } : s));
  }, []);

  const updateChatVideoModel = useCallback((chatId: string, videoModel: string) => {
    setChatHistory(prev => prev.map(s => s.id === chatId ? { ...s, videoModel } : s));
  }, []);

  const updateChatSettings = useCallback((chatId: string, newSettings: Partial<Pick<ChatSession, 'temperature' | 'maxOutputTokens' | 'imageModel' | 'videoModel'>>) => {
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
    addModelResponse,
    updateActiveResponseOnMessage,
    setActiveResponseIndex,
    updateMessage,
    toggleMessagePin,
    setChatLoadingState,
    completeChatLoading,
    updateChatTitle,
    updateChatModel,
    updateChatImageModel,
    updateChatVideoModel,
    updateChatSettings,
    importChat,
  };
};

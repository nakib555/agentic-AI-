/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FunctionCall } from "@google/genai";
import { generateChatTitle } from '../services/gemini';
import { toolImplementations } from '../tools';
import { runAgenticLoop } from '../services/agenticLoop';
import { type Message, type ToolCallEvent, type ChatSession, type MessageError, ToolError } from '../../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useChat = (initialModel: string) => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load from local storage on initial mount
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
    }
  }, []);

  // Save to local storage whenever history or current chat changes
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    localStorage.setItem('currentChatId', String(currentChatId));
  }, [chatHistory, currentChatId]);

  // Effect to automatically generate a title for new chats
  useEffect(() => {
    const currentChat = chatHistory.find(c => c.id === currentChatId);

    // Trigger conditions: chat is new, has first exchange, and isn't loading
    if (currentChat && currentChat.title === "New Chat" && currentChat.messages.length >= 2 && !currentChat.isLoading) {
      
      // Prevent re-triggering by immediately updating the title
      setChatHistory(prev => prev.map(s =>
          s.id === currentChatId ? { ...s, title: "Generating title..." } : s
      ));
      
      generateChatTitle(currentChat.messages).then(newTitle => {
          // The title from generateChatTitle is already cleaned, vetted, and has a fallback.
          // We just need to apply it and handle truncation.
          const finalTitle = newTitle.length > 45 ? newTitle.substring(0, 42) + '...' : newTitle;
          setChatHistory(prev => prev.map(s =>
              s.id === currentChatId ? { ...s, title: finalTitle } : s
          ));
      });
    }
  }, [chatHistory, currentChatId]);

  const messages = useMemo(() => {
    return chatHistory.find(c => c.id === currentChatId)?.messages || [];
  }, [chatHistory, currentChatId]);

  const isLoading = useMemo(() => {
    if (!currentChatId) return false;
    return chatHistory.find(c => c.id === currentChatId)?.isLoading ?? false;
  }, [chatHistory, currentChatId]);

  const startNewChat = useCallback(() => {
    setCurrentChatId(null);
  }, []);

  const loadChat = (chatId: string) => {
    if (chatHistory.some(c => c.id === chatId)) {
      setCurrentChatId(chatId);
    }
  };
  
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
    if (window.confirm('Are you sure you want to delete all conversations? This action cannot be undone.')) {
      setChatHistory([]);
      setCurrentChatId(null);
    }
  }, []);

  const sendMessage = async (userMessage: string, options: { isHidden?: boolean } = {}) => {
    const { isHidden = false } = options;
    let activeChatId = currentChatId;
    let sessionForApi: ChatSession;

    // --- 1. Setup Chat Session & Add User Message ---
    if (!activeChatId) {
      const newChatId = generateId();
      sessionForApi = {
        id: newChatId,
        title: "New Chat",
        messages: [],
        model: initialModel,
        isLoading: true,
      };
      setChatHistory(prev => [sessionForApi, ...prev]);
      setCurrentChatId(newChatId);
      activeChatId = newChatId;
    } else {
      sessionForApi = chatHistory.find(c => c.id === activeChatId)!;
    }
    
    const userMessageObj: Message = { id: generateId(), role: 'user', text: userMessage, isHidden };
    setChatHistory(prev => prev.map(s => 
      s.id === activeChatId 
        ? { ...s, messages: [...s.messages, userMessageObj] } 
        : s
    ));
    
    // --- 2. Add Model Placeholder & Prepare for Loop ---
    const modelMessageId = generateId();
    const modelPlaceholder: Message = { id: modelMessageId, role: 'model', text: '', isThinking: true, toolCallEvents: [] };
    setChatHistory(prev => prev.map(s => 
      s.id === activeChatId 
        ? { ...s, messages: [...s.messages, modelPlaceholder], isLoading: true } 
        : s
    ));

    const toolExecutor = async (name: string, args: any): Promise<string> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const toolImplementation = toolImplementations[name];
        if (!toolImplementation) {
            throw new ToolError(name, 'TOOL_NOT_FOUND', `Tool "${name}" not found.`);
        }
        try {
            return await Promise.resolve(toolImplementation(args));
        } catch (err) {
            if (err instanceof ToolError) {
                throw err; // Re-throw custom tool errors directly
            }
            const originalError = err instanceof Error ? err : new Error(String(err));
            throw new ToolError(name, 'TOOL_EXECUTION_FAILED', originalError.message, originalError);
        }
    };

    const callbacks = {
        onTextChunk: (chunk: string) => {
            setChatHistory(prev => prev.map(s => {
                if (s.id !== activeChatId) return s;
                const lastMsg = s.messages[s.messages.length - 1];
                if (lastMsg.id === modelMessageId) {
                    return { ...s, messages: [...s.messages.slice(0, -1), { ...lastMsg, text: lastMsg.text + chunk }] };
                }
                return s;
            }));
        },
        onNewToolCalls: (toolCalls: FunctionCall[]): Promise<ToolCallEvent[]> => {
            const newToolCallEvents: ToolCallEvent[] = toolCalls.map(fc => ({ id: generateId(), call: fc }));
            setChatHistory(prev => prev.map(s => {
                if (s.id !== activeChatId) return s;
                const lastMsg = s.messages[s.messages.length - 1];
                if (lastMsg.id === modelMessageId) {
                    const updatedEvents = [...(lastMsg.toolCallEvents || []), ...newToolCallEvents];
                    return { ...s, messages: [...s.messages.slice(0, -1), { ...lastMsg, toolCallEvents: updatedEvents }] };
                }
                return s;
            }));
            return Promise.resolve(newToolCallEvents);
        },
        onToolResult: (eventId: string, result: string) => {
            setChatHistory(prev => prev.map(s => {
                if (s.id !== activeChatId) return s;
                const lastMsg = s.messages[s.messages.length - 1];
                if (lastMsg.id === modelMessageId && lastMsg.toolCallEvents) {
                    const updatedEvents = lastMsg.toolCallEvents.map(event => 
                        event.id === eventId ? { ...event, result } : event
                    );
                    return { ...s, messages: [...s.messages.slice(0, -1), { ...lastMsg, toolCallEvents: updatedEvents }] };
                }
                return s;
            }));
        },
        onComplete: () => {
            setChatHistory(prev => prev.map(s => {
                if (s.id !== activeChatId) return s;
                const lastMsg = s.messages[s.messages.length - 1];
                if (lastMsg.id === modelMessageId) {
                    // The agentic loop now handles multi-part responses internally.
                    // This callback is called once the entire response is complete.
                    // We clean up any lingering [AUTO_CONTINUE] markers as a final step.
                    const cleanedText = lastMsg.text.replace(/\[AUTO_CONTINUE\]/g, '').trim();
                    return { ...s, messages: [...s.messages.slice(0, -1), { ...lastMsg, text: cleanedText, isThinking: false }], isLoading: false };
                }
                return { ...s, isLoading: false }; // Ensure loading is always false on completion
            }));
        },
        onError: (error: MessageError) => {
            console.error("Error received in useChat:", error);
            setChatHistory(prev => prev.map(s => {
                if (s.id !== activeChatId) return s;
                const lastMsg = s.messages[s.messages.length - 1];
                if (lastMsg.id === modelMessageId) {
                    // Set the structured error object on the message
                    return { ...s, messages: [...s.messages.slice(0, -1), { ...lastMsg, error: error, isThinking: false }], isLoading: false };
                }
                return s;
            }));
        },
    };

    // --- 3. Run Agentic Loop ---
    await runAgenticLoop({
      session: sessionForApi,
      initialMessage: userMessage,
      toolExecutor,
      callbacks,
    });
  };
  
  return { messages, sendMessage, isLoading, chatHistory, currentChatId, startNewChat, loadChat, deleteChat, clearAllChats };
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// PART 4 of 4 from src/hooks/useChat.ts
// The new main hook file, composing the refactored parts.

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { runAgenticLoop } from '../../services/agenticLoop/index';
import { type Message, type ChatSession } from '../../types';
import { fileToBase64, base64ToFile, base64ToBlob } from '../../utils/fileUtils';
import { useChatHistory } from '../useChatHistory';
import { createAgentCallbacks } from './chat-callbacks';
import { buildApiHistory } from './history-builder';
import { createToolExecutor } from './tool-executor';
import { generateChatTitle, parseApiError } from '../../services/gemini/index';
import { fileStore } from '../../services/fileStore';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    systemPrompt: string; 
    temperature: number; 
    maxOutputTokens: number; 
    imageModel: string;
    videoModel: string;
};

export const useChat = (initialModel: string, settings: ChatSettings, memoryContent: string) => {
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
    if (chatHistoryHook.isHistoryLoading) {
      return [];
    }
    return chatHistory.find(c => c.id === currentChatId)?.messages || [];
  }, [chatHistoryHook.isHistoryLoading, chatHistory, currentChatId]);

  const isLoading = useMemo(() => {
    if (chatHistoryHook.isHistoryLoading) return true;
    if (!currentChatId) return false;
    return chatHistory.find(c => c.id === currentChatId)?.isLoading ?? false;
  }, [chatHistoryHook.isHistoryLoading, chatHistory, currentChatId]);

  // Prevent accidental reloads while the AI is generating a response.
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ''; // Required for cross-browser compatibility.
    };

    if (isLoading) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoading]);

  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    if (executionApprovalRef.current) {
        denyExecution();
    }
  }, []);

  const approveExecution = useCallback((editedPlan: string) => {
    if (executionApprovalRef.current && currentChatId) {
        chatHistoryHook.updateLastMessage(currentChatId, () => ({ executionState: 'approved' }));
        executionApprovalRef.current.resolve(editedPlan);
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

    const { isHidden = false, isThinkingModeEnabled: optionIsThinkingModeEnabled = false } = options;
    const hasFiles = files && files.length > 0;
    const isThinkingModeEnabled = !hasFiles || optionIsThinkingModeEnabled;
    
    let activeChatId = currentChatId;
    if (!activeChatId) {
        activeChatId = chatHistoryHook.createNewChat(initialModel, { 
            temperature: settings.temperature, 
            maxOutputTokens: settings.maxOutputTokens,
            imageModel: settings.imageModel,
            videoModel: settings.videoModel,
        });
    }

    const attachmentsData = files && files.length > 0 ? await Promise.all(files.map(async (file) => ({
        name: file.name, mimeType: file.type, data: await fileToBase64(file),
    }))) : undefined;
    
    const userMessageObj: Message = { id: generateId(), role: 'user', text: userMessage, isHidden, attachments: attachmentsData };
    chatHistoryHook.addMessagesToChat(activeChatId, [userMessageObj]);

    const isImageEditRequest = 
        attachmentsData && 
        attachmentsData.length === 1 && 
        attachmentsData[0].mimeType.startsWith('image/') && 
        userMessage.trim().length > 0;

    // --- Start loading states ---
    chatHistoryHook.setChatLoadingState(activeChatId, true);
    const modelPlaceholder: Message = { id: generateId(), role: 'model', text: '', isThinking: true, toolCallEvents: [], startTime: Date.now() };
    chatHistoryHook.addMessagesToChat(activeChatId, [modelPlaceholder]);

    // --- Handle Image Edit Request (Special Case) ---
    if (isImageEditRequest) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const imagePart = { inlineData: { mimeType: attachmentsData[0].mimeType, data: attachmentsData[0].data } };
        const textPart = { text: userMessage };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        
        let editedImageBase64: string | undefined;
        let editedImageMimeType = 'image/png';

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    editedImageBase64 = part.inlineData.data;
                    editedImageMimeType = part.inlineData.mimeType;
                    break;
                }
            }
        }

        if (!editedImageBase64) {
            throw new Error("Image editing failed: The model did not return an image.");
        }
        
        const imageBlob = base64ToBlob(editedImageBase64, editedImageMimeType);
        const imagePath = `/main/output/edited-image-${generateId()}.png`;
        await fileStore.saveFile(imagePath, imageBlob);
        
        const imageData = { fileKey: imagePath, prompt: userMessage, caption: "Edited image" };
        const imageComponentText = `[IMAGE_COMPONENT]${JSON.stringify(imageData)}[/IMAGE_COMPONENT]`;
        
        chatHistoryHook.updateLastMessage(activeChatId, () => ({
            text: imageComponentText,
            isThinking: false,
            endTime: Date.now(),
        }));
      } catch (err) {
        const error = parseApiError(err);
        chatHistoryHook.updateLastMessage(activeChatId, () => ({
            error: error, isThinking: false, endTime: Date.now(),
        }));
      } finally {
        chatHistoryHook.completeChatLoading(activeChatId);
        abortControllerRef.current = null;
      }
      return;
    }
    
    // --- Handle Standard Agentic Loop ---
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
    const toolExecutor = createToolExecutor(
        chatHistory, 
        activeChatId,
        activeChat?.imageModel || settings.imageModel,
        activeChat?.videoModel || settings.videoModel
    );
    const callbacks = createAgentCallbacks(activeChatId, chatHistoryHook, { abortControllerRef }, isThinkingModeEnabled, executionApprovalRef);

    await runAgenticLoop({
      model: modelForApi, history: historyForApi, toolExecutor, callbacks,
      signal: abortControllerRef.current.signal, settings: chatSettings,
    });
  };

  const regenerateResponse = useCallback((aiMessageId: string) => {
    if (!currentChatId) return;
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (!chat) return;
    const aiMessageIndex = chat.messages.findIndex(m => m.id === aiMessageId);
    if (aiMessageIndex < 1) return;

    let precedingUserMessage: Message | null = null;
    for (let i = aiMessageIndex - 1; i >= 0; i--) {
        if (chat.messages[i].role === 'user' && !chat.messages[i].isHidden) {
            precedingUserMessage = chat.messages[i];
            break;
        }
    }

    if (precedingUserMessage) {
        // Find the AI message to be regenerated and all messages after it.
        const newMessages = chat.messages.slice(0, aiMessageIndex);
        
        // This is a more complex operation, so for now we'll just resubmit the prompt
        // which will append a new response rather than replacing the old one.
        const files = precedingUserMessage.attachments?.map(att => 
            base64ToFile(att.data, att.name, att.mimeType)
        ) || [];
        
        sendMessage(precedingUserMessage.text, files);
    }
}, [currentChatId, chatHistory, sendMessage]);
  
  return { ...chatHistoryHook, messages, sendMessage, isLoading, cancelGeneration, approveExecution, denyExecution, regenerateResponse };
};

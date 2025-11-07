/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { runAgenticLoop } from '../../services/agenticLoop/index';
import { type Message, type ChatSession, ModelResponse } from '../../types';
import { fileToBase64, base64ToFile, base64ToBlob } from '../../utils/fileUtils';
import { useChatHistory } from '../useChatHistory';
import { createAgentCallbacks } from './chat-callbacks';
import { buildApiHistory } from './history-builder';
import { createToolExecutor } from './tool-executor';
import { generateChatTitle, parseApiError } from '../../services/gemini/index';
import { fileStore } from '../../services/fileStore';
import { systemInstruction } from '../../prompts/system';
import { toolDeclarations } from '../../tools';
import { PREAMBLE } from '../../prompts/preamble';
import { CHAT_PERSONA_AND_UI_FORMATTING } from '../../prompts/chatPersona';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ChatSettings = { 
    systemPrompt: string; 
    temperature: number; 
    maxOutputTokens: number; 
    imageModel: string;
    videoModel: string;
};

const chatModeSystemInstruction = [
    PREAMBLE,
    `
# 💬 Conversational Mode Directives

- Your primary goal is to provide a direct, helpful, and conversational response.
- You are in "Chat Mode". This means you MUST NOT use any tools or follow the complex agentic workflow. Your capabilities are limited to conversation and knowledge recall.
- You MUST NOT use agentic workflow formatting (e.g., \`[STEP]\`, \`[AGENT:]\`). Do not think in steps.
- You MUST adhere to all persona and formatting guidelines defined below for conversational responses.
- You MUST NOT mention or allude to the agentic workflow, tools, agents, "HATF", or a "task force." Your identity is that of a helpful AI assistant.
- Your response should be a single, direct answer, formatted for the user as per the persona guide.
    `,
    CHAT_PERSONA_AND_UI_FORMATTING,
].join('\n\n');


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
    
    const userMessageObj: Message = { id: generateId(), role: 'user', text: userMessage, isHidden, attachments: attachmentsData, activeResponseIndex: 0 };
    chatHistoryHook.addMessagesToChat(activeChatId, [userMessageObj]);

    const isImageEditRequest = 
        attachmentsData && 
        attachmentsData.length === 1 && 
        attachmentsData[0].mimeType.startsWith('image/') && 
        userMessage.trim().length > 0;

    // --- Start loading states ---
    chatHistoryHook.setChatLoadingState(activeChatId, true);
    const modelPlaceholder: Message = {
        id: generateId(),
        role: 'model',
        text: '', // Kept for potential compatibility, but response text is source of truth.
        responses: [{
            text: '',
            toolCallEvents: [],
            startTime: Date.now(),
        }],
        activeResponseIndex: 0,
        isThinking: true,
    };
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
        
        chatHistoryHook.updateActiveResponseOnMessage(activeChatId, modelPlaceholder.id, () => ({
            text: imageComponentText,
            endTime: Date.now(),
        }));
        chatHistoryHook.updateMessage(activeChatId, modelPlaceholder.id, { isThinking: false });

      } catch (err) {
        const error = parseApiError(err);
        chatHistoryHook.updateActiveResponseOnMessage(activeChatId, modelPlaceholder.id, () => ({
            error: error,
            endTime: Date.now(),
        }));
        chatHistoryHook.updateMessage(activeChatId, modelPlaceholder.id, { isThinking: false });
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
    
    const agenticLoopSettings = {
        systemInstruction: isAgentMode ? systemInstruction : chatModeSystemInstruction,
        tools: isAgentMode ? toolDeclarations : undefined,
        systemPrompt: settings.systemPrompt,
        temperature: activeChat?.temperature ?? settings.temperature,
        maxOutputTokens: activeChat?.maxOutputTokens ?? settings.maxOutputTokens,
        thinkingBudget: isAgentMode && isThinkingModeEnabled ? 32768 : undefined,
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
    const callbacks = createAgentCallbacks(activeChatId, modelPlaceholder.id, chatHistoryHook, { abortControllerRef }, isThinkingModeEnabled, executionApprovalRef);

    await runAgenticLoop({
      model: modelForApi, history: historyForApi, toolExecutor, callbacks,
      signal: abortControllerRef.current.signal, settings: agenticLoopSettings,
    });
  };

  const regenerateResponse = useCallback(async (aiMessageId: string) => {
    if (!currentChatId) return;
    const chat = chatHistory.find(c => c.id === currentChatId);
    if (!chat) return;

    const aiMessageIndex = chat.messages.findIndex(m => m.id === aiMessageId);
    if (aiMessageIndex < 1) return;

    if (isLoading) cancelGeneration();
    abortControllerRef.current = new AbortController();

    // The history for the regeneration call is everything BEFORE the AI message we're regenerating.
    const historyForApi = buildApiHistory(chat.messages.slice(0, aiMessageIndex));
    
    // Start loading states
    chatHistoryHook.setChatLoadingState(currentChatId, true);
    chatHistoryHook.updateMessage(currentChatId, aiMessageId, { isThinking: true });
    
    // Add a new placeholder response to the existing AI message. This also sets it as the active response.
    const newResponsePlaceholder: ModelResponse = { text: '', toolCallEvents: [], startTime: Date.now() };
    chatHistoryHook.addModelResponse(currentChatId, aiMessageId, newResponsePlaceholder);

    const isThinkingModeEnabled = isAgentMode && !historyForApi.some(m => m.parts.some(p => 'inlineData' in p));
    const modelForApi = isThinkingModeEnabled ? 'gemini-2.5-pro' : (chat?.model || initialModel);
        
    const agenticLoopSettings = {
        systemInstruction: isAgentMode ? systemInstruction : chatModeSystemInstruction,
        tools: isAgentMode ? toolDeclarations : undefined,
        systemPrompt: settings.systemPrompt,
        temperature: chat?.temperature ?? settings.temperature,
        maxOutputTokens: chat?.maxOutputTokens ?? settings.maxOutputTokens,
        thinkingBudget: isAgentMode && isThinkingModeEnabled ? 32768 : undefined,
        memoryContent: memoryContent,
    };
    
    const toolExecutor = createToolExecutor(
        chatHistory, 
        currentChatId,
        chat?.imageModel || settings.imageModel,
        chat?.videoModel || settings.videoModel
    );
    
    const callbacks = createAgentCallbacks(currentChatId, aiMessageId, chatHistoryHook, { abortControllerRef }, isThinkingModeEnabled, executionApprovalRef);

    await runAgenticLoop({
      model: modelForApi, history: historyForApi, toolExecutor, callbacks,
      signal: abortControllerRef.current.signal, settings: agenticLoopSettings,
    });

  }, [currentChatId, chatHistory, isLoading, cancelGeneration, chatHistoryHook, initialModel, settings, memoryContent, isAgentMode]);
  
  return { ...chatHistoryHook, messages, sendMessage, isLoading, cancelGeneration, approveExecution, denyExecution, regenerateResponse };
};

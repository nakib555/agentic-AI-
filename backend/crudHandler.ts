/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Import aliased Request and Response types from express to avoid global type conflicts.
// The previous fix was insufficient. Using direct, non-aliased types from express.
import { Request, Response } from 'express';
import { dataStore } from './data-store.js';
import type { ChatSession } from '../src/types';
import { DEFAULT_CHAT_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL } from './config.js';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const getHistory = async (req: Request, res: Response) => {
    try {
        const history = await dataStore.getChatHistoryList();
        res.status(200).json(history);
    } catch (error) {
        console.error('Failed to get chat history:', error);
        res.status(500).json({ error: 'Failed to retrieve chat history from the server.' });
    }
};

export const getChat = async (req: Request, res: Response) => {
    const chat = await dataStore.getChatSession(req.params.chatId);
    if (chat) {
        res.status(200).json(chat);
    } else {
        res.status(404).json({ error: 'Chat not found' });
    }
};

export const createNewChat = async (req: Request, res: Response) => {
    const { model, temperature, maxOutputTokens, imageModel, videoModel } = req.body;
    const newChatId = generateId();
    const newChat: ChatSession = {
        id: newChatId,
        title: "New Chat",
        messages: [],
        model: model || DEFAULT_CHAT_MODEL,
        isLoading: false,
        createdAt: Date.now(),
        temperature,
        maxOutputTokens,
        imageModel: imageModel || DEFAULT_IMAGE_MODEL,
        videoModel: videoModel || DEFAULT_VIDEO_MODEL,
    };
    await dataStore.saveChatSession(newChat);
    res.status(201).json(newChat);
};

export const updateChat = async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const updates = req.body;
    let chat = await dataStore.getChatSession(chatId);
    
    if (!chat) {
        console.warn(`[CRUD] updateChat called for non-existent chatId "${chatId}". Creating new session.`);
        chat = {
            id: chatId,
            title: "New Chat",
            messages: [],
            model: DEFAULT_CHAT_MODEL,
            createdAt: Date.now(),
        };
    }

    const updatedChat = { ...chat, ...updates };
    await dataStore.saveChatSession(updatedChat);
    res.status(200).json(updatedChat);
};

export const deleteChat = async (req: Request, res: Response) => {
    await dataStore.deleteChatSession(req.params.chatId);
    res.status(204).send();
};

export const deleteAllHistory = async (req: Request, res: Response) => {
    await dataStore.clearAllChatHistory();
    res.status(204).send();
};

export const importChat = async (req: Request, res: Response) => {
    const importedChat = req.body as ChatSession;
    if (!importedChat || typeof importedChat.title !== 'string' || !Array.isArray(importedChat.messages)) {
        return res.status(400).json({ error: "Invalid chat file format." });
    }
    const newChat: ChatSession = {
        ...importedChat,
        id: generateId(),
        createdAt: Date.now(),
        isLoading: false,
    };
    await dataStore.saveChatSession(newChat);
    res.status(201).json(newChat);
};

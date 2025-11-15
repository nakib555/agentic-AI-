/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response } from 'express';
import { dataStore } from './data-store.js';
import type { ChatSession } from '../src/types';
import { validModels } from '../src/services/modelService.js';
import { DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL } from '../src/components/App/constants.js';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const getHistory = async (req: Request, res: Response) => {
    const history = await dataStore.getChatHistoryList();
    res.status(200).json(history);
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
        model: model || validModels[1]?.id || validModels[0]?.id,
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
    const chat = await dataStore.getChatSession(chatId);
    if (chat) {
        const updatedChat = { ...chat, ...updates };
        await dataStore.saveChatSession(updatedChat);
        res.status(200).json(updatedChat);
    } else {
        res.status(404).json({ error: 'Chat not found' });
    }
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
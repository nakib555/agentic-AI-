
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context } from 'hono';
import { historyControl } from './services/historyControl.js';
import type { ChatSession } from '../src/types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const getHistory = async (c: Context) => {
    try {
        const history = await historyControl.getHistoryList();
        return c.json(history);
    } catch (error) {
        console.error('Failed to get chat history:', error);
        return c.json({ error: 'Failed to retrieve chat history.' }, 500);
    }
};

export const getChat = async (c: Context) => {
    const chatId = c.req.param('chatId');
    const chat = await historyControl.getChat(chatId);
    if (chat) {
        return c.json(chat);
    }
    return c.json({ error: 'Chat not found' }, 404);
};

export const createNewChat = async (c: Context) => {
    const body = await c.req.json();
    const { model, temperature, maxOutputTokens, imageModel, videoModel } = body;
    const newChatId = generateId();
    const newChat: ChatSession = {
        id: newChatId,
        title: "New Chat",
        messages: [],
        model: model,
        isLoading: false,
        createdAt: Date.now(),
        temperature,
        maxOutputTokens,
        imageModel,
        videoModel,
    };
    
    try {
        await historyControl.createChat(newChat);
        return c.json(newChat, 201);
    } catch (error) {
        console.error("Failed to create chat:", error);
        return c.json({ error: "Failed to create chat session." }, 500);
    }
};

export const updateChat = async (c: Context) => {
    const chatId = c.req.param('chatId');
    const updates = await c.req.json();
    
    const updatedChat = await historyControl.updateChat(chatId, updates);
    
    if (!updatedChat) {
         // Recovery mechanism
         const recoveredChat: ChatSession = {
            id: chatId,
            title: updates.title || "New Chat",
            messages: updates.messages || [],
            model: updates.model || '',
            createdAt: Date.now(),
            ...updates
        };
        await historyControl.createChat(recoveredChat);
        return c.json(recoveredChat);
    }

    return c.json(updatedChat);
};

export const deleteChat = async (c: Context) => {
    await historyControl.deleteChat(c.req.param('chatId'));
    return c.body(null, 204);
};

export const deleteAllHistory = async (c: Context) => {
    try {
        await historyControl.deleteAllChats();
        return c.body(null, 204);
    } catch (error) {
        return c.json({ error: "Failed to delete all data." }, 500);
    }
};

export const importChat = async (c: Context) => {
    const importedChat = await c.req.json() as ChatSession;
    if (!importedChat || typeof importedChat.title !== 'string' || !Array.isArray(importedChat.messages)) {
        return c.json({ error: "Invalid chat file format." }, 400);
    }
    const newChat: ChatSession = {
        ...importedChat,
        id: generateId(),
        createdAt: Date.now(),
        isLoading: false,
    };
    await historyControl.createChat(newChat);
    return c.json(newChat, 201);
};

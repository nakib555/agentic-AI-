/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChatSession, Message } from '../types';

const DB_NAME = 'AgenticAIDatabase';
const DB_VERSION = 1;
const CHAT_STORE_NAME = 'chatSessions';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in self)) {
        reject(new Error('IndexedDB is not supported.'));
        return;
      }
      
      const request = self.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open IndexedDB.'));
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CHAT_STORE_NAME)) {
          db.createObjectStore(CHAT_STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }
  return dbPromise;
};

export const chatStore = {
  async getHistory(): Promise<ChatSession[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CHAT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CHAT_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const sortedHistory = request.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(sortedHistory);
      };
      request.onerror = () => reject(new Error('Failed to retrieve history.'));
    });
  },

  async getChat(id: string): Promise<ChatSession | undefined> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CHAT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CHAT_STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to retrieve chat.'));
    });
  },

  async saveChat(chat: ChatSession): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CHAT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CHAT_STORE_NAME);
      const request = store.put(chat);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save chat.'));
    });
  },
  
  async addMessages(chatId: string, messages: Message[]): Promise<void> {
    const db = await getDb();
    const transaction = db.transaction(CHAT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(CHAT_STORE_NAME);
    const getRequest = store.get(chatId);

    return new Promise((resolve, reject) => {
      getRequest.onerror = () => reject(new Error('Failed to retrieve chat for adding messages.'));
      getRequest.onsuccess = () => {
        const chat = getRequest.result;
        if (chat) {
          chat.messages.push(...messages);
          const putRequest = store.put(chat);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to save chat after adding messages.'));
        } else {
          reject(new Error(`Chat with id ${chatId} not found.`));
        }
      };
    });
  },

  async deleteChat(id: string): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CHAT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CHAT_STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete chat.'));
    });
  },

  async clearAll(): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CHAT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CHAT_STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear chats.'));
    });
  },
};

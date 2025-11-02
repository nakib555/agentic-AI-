/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'AgenticChatFileStore';
const DB_VERSION = 1;
const STORE_NAME = 'files';

let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB is not supported by this browser.'));
        return;
      }
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB for files.'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }
  return dbPromise;
};

export const fileStore = {
  async saveFile(path: string, blob: Blob): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, path);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save file to IndexedDB.'));
    });
  },

  async getFile(path: string): Promise<Blob | undefined> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(path);
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(new Error('Failed to retrieve file from IndexedDB.'));
    });
  },

  async listFiles(path: string): Promise<string[]> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const range = IDBKeyRange.bound(path, path + '\uffff');
        const request = store.getAllKeys(range);
        request.onsuccess = () => resolve(request.result as string[]);
        request.onerror = () => reject(new Error('Failed to list files from IndexedDB.'));
    });
  },
  
  async deleteFile(path: string): Promise<void> {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(path);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to delete file from IndexedDB.'));
    });
  },
};
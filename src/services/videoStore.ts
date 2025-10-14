
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'AgenticChatVideoStore';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

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
        reject(new Error('Failed to open IndexedDB.'));
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

export const videoStore = {
  async saveVideo(blob: Blob): Promise<string> {
    const db = await getDb();
    const key = crypto.randomUUID();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, key);

      request.onsuccess = () => resolve(key);
      request.onerror = () => reject(new Error('Failed to save video to IndexedDB.'));
    });
  },

  async getVideo(key: string): Promise<Blob | undefined> {
    const db = await getDb();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(new Error('Failed to retrieve video from IndexedDB.'));
    });
  },
};

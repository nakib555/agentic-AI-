/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A simple in-memory store to simulate a virtual filesystem for a single session.
// This is not persistent across server restarts.
const fileStoreData = new Map<string, Blob>();

export const fileStore = {
  async saveFile(path: string, blob: Blob): Promise<void> {
    fileStoreData.set(path, blob);
  },

  async getFile(path: string): Promise<Blob | undefined> {
    return fileStoreData.get(path);
  },

  async listFiles(path: string): Promise<string[]> {
    const files: string[] = [];
    // Basic prefix matching for directory listing
    const normalizedPath = path.endsWith('/') ? path : `${path}/`;
    for (const key of fileStoreData.keys()) {
        if (key.startsWith(normalizedPath)) {
            files.push(key);
        }
    }
    return files;
  },
  
  async deleteFile(path: string): Promise<void> {
    fileStoreData.delete(path);
  },
};

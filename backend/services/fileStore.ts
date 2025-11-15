/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A simple in-memory virtual file system for the agentic workflow.
// In a production environment, this would be replaced with a more robust
// solution like a cloud bucket (S3, GCS) or a persistent disk.

const fileSystem = new Map<string, Blob>();

export const fileStore = {
  async saveFile(path: string, data: Blob): Promise<void> {
    console.log(`[FileStore] Saving file to path: ${path} (size: ${data.size})`);
    fileSystem.set(path, data);
  },

  async getFile(path: string): Promise<Blob | null> {
    console.log(`[FileStore] Getting file from path: ${path}`);
    return fileSystem.get(path) || null;
  },

  async listFiles(dirPath: string): Promise<string[]> {
    console.log(`[FileStore] Listing files in path: ${dirPath}`);
    const files: string[] = [];
    const normalizedDirPath = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
    
    if (dirPath === '/') {
        return Array.from(fileSystem.keys());
    }

    for (const path of fileSystem.keys()) {
      if (path.startsWith(normalizedDirPath)) {
        files.push(path);
      }
    }
    return files;
  },

  async deleteFile(path: string): Promise<void> {
    console.log(`[FileStore] Deleting file from path: ${path}`);
    fileSystem.delete(path);
  },
};

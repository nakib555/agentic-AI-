
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A simple in-memory cache for audio buffers.
// Optimized with LRU eviction to prevent memory leaks on low-RAM devices.
const MAX_CACHE_SIZE = 20;
const cache = new Map<string, AudioBuffer>();

export const audioCache = {
  /**
   * Generates a unique key for the cache.
   * @param text The text content of the audio.
   * @param voice The voice used for TTS.
   * @returns A unique cache key string.
   */
  createKey(text: string, voice: string): string {
    return `${voice}::${text}`;
  },

  /**
   * Retrieves an AudioBuffer from the cache.
   * Promotes the item to the 'most recently used' position.
   * @param key The cache key.
   * @returns The cached AudioBuffer or undefined if not found.
   */
  get(key: string): AudioBuffer | undefined {
    const item = cache.get(key);
    if (item) {
      // LRU: Delete and re-set to move it to the end of the Map (most recent)
      cache.delete(key);
      cache.set(key, item);
    }
    return item;
  },

  /**
   * Stores an AudioBuffer in the cache.
   * Evicts the least recently used item if cache exceeds MAX_CACHE_SIZE.
   * @param key The cache key.
   * @param buffer The AudioBuffer to store.
   */
  set(key: string, buffer: AudioBuffer): void {
    if (cache.size >= MAX_CACHE_SIZE) {
      // The first item in a Map is the least recently used
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
    cache.set(key, buffer);
  },

  /**
   * Checks if an entry exists in the cache.
   * @param key The cache key.
   * @returns True if the key exists, false otherwise.
   */
  has(key: string): boolean {
    return cache.has(key);
  },
  
  /**
   * Clears the entire cache. Useful for low-memory events.
   */
  clear(): void {
    cache.clear();
  }
};

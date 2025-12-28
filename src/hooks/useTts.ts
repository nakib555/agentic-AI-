
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { audioCache } from '../services/audioCache';
import { audioManager } from '../services/audioService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { fetchFromApi } from '../utils/api';
import { splitTextIntoChunks } from '../utils/textChunker';

type AudioState = 'idle' | 'loading' | 'error' | 'playing';

export const useTts = (text: string, voice: string, model: string) => {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  
  // Refs for managing the playback queue and state without triggering re-renders
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const queueIndexRef = useRef(0);
  const isCancelledRef = useRef(false);
  const chunksRef = useRef<string[]>([]);
  const nextBufferPromiseRef = useRef<Promise<AudioBuffer | null> | null>(null);

  const isPlaying = audioState === 'playing';

  useEffect(() => {
      isMounted.current = true;
      return () => { 
          isMounted.current = false; 
          stopPlayback();
      };
  }, []);

  // Stop everything and reset state
  const stopPlayback = useCallback(() => {
      isCancelledRef.current = true;
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
      }
      audioManager.stop();
      if (isMounted.current) {
          setAudioState('idle');
      }
  }, []);

  // Helper to fetch and decode audio for a specific text chunk
  const fetchAudioBuffer = useCallback(async (chunkText: string, signal: AbortSignal): Promise<AudioBuffer | null> => {
      const cacheKey = audioCache.createKey(chunkText, voice, model);
      const cachedBuffer = audioCache.get(cacheKey);
      
      if (cachedBuffer) return cachedBuffer;

      try {
          const response = await fetchFromApi('/api/handler?task=tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: chunkText, voice, model }),
              signal
          });

          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error?.message || `TTS failed: ${response.status}`);
          }

          const { audio: base64Audio } = await response.json();
          if (!base64Audio) throw new Error("No audio data received");

          const audioBuffer = await decodeAudioData(decode(base64Audio), audioManager.context, 24000, 1);
          audioCache.set(cacheKey, audioBuffer);
          return audioBuffer;
      } catch (error: any) {
          if (error.name !== 'AbortError') {
              console.error("TTS Fetch Error:", error);
          }
          return null;
      }
  }, [voice, model]);

  // Main loop to play chunks sequentially
  const processQueue = useCallback(async () => {
      if (isCancelledRef.current || !isMounted.current) return;

      const currentIndex = queueIndexRef.current;
      const chunks = chunksRef.current;

      if (currentIndex >= chunks.length) {
          setAudioState('idle');
          return;
      }

      try {
          let currentBuffer: AudioBuffer | null = null;

          // 1. Get the current buffer (either from the pre-fetch promise or fetch it now)
          if (nextBufferPromiseRef.current) {
              currentBuffer = await nextBufferPromiseRef.current;
              nextBufferPromiseRef.current = null;
          } else {
              currentBuffer = await fetchAudioBuffer(chunks[currentIndex], abortControllerRef.current!.signal);
          }

          if (isCancelledRef.current) return;

          if (!currentBuffer) {
              // Skip failed chunks or handle error
              queueIndexRef.current++;
              processQueue();
              return;
          }

          // 2. Start pre-fetching the NEXT chunk while this one prepares to play
          const nextIndex = currentIndex + 1;
          if (nextIndex < chunks.length) {
              nextBufferPromiseRef.current = fetchAudioBuffer(chunks[nextIndex], abortControllerRef.current!.signal);
          }

          // 3. Play the current buffer
          setAudioState('playing');
          await audioManager.play(currentBuffer, () => {
              if (isMounted.current && !isCancelledRef.current) {
                  queueIndexRef.current++;
                  processQueue(); // Recursive call for next chunk
              }
          });

      } catch (err) {
          console.error("Playback loop error", err);
          if (isMounted.current) {
              setAudioState('error');
              setErrorMessage("Playback failed");
          }
      }
  }, [fetchAudioBuffer]);

  const playOrStopAudio = useCallback(async () => {
    if (audioState === 'playing' || audioState === 'loading') {
      stopPlayback();
      return;
    }
    
    // Valid text check
    if (!text || text.trim().length === 0) {
        setAudioState('error');
        setErrorMessage("No text available.");
        return;
    }

    // Initialize state for new playback
    setAudioState('loading');
    setErrorMessage(undefined);
    
    isCancelledRef.current = false;
    queueIndexRef.current = 0;
    abortControllerRef.current = new AbortController();
    
    // Split text into smart chunks
    chunksRef.current = splitTextIntoChunks(text);
    nextBufferPromiseRef.current = null;

    // Start the loop
    processQueue();

  }, [text, audioState, stopPlayback, processQueue]);

  return { playOrStopAudio, audioState, isPlaying, errorMessage };
};


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { audioCache } from '../services/audioCache';
import { audioManager } from '../services/audioService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { fetchFromApi } from '../utils/api';

type AudioState = 'idle' | 'loading' | 'error' | 'playing';

export const useTts = (text: string, voice: string, model: string) => {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const isMounted = useRef(true);
  const isPlaying = audioState === 'playing';

  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  const playOrStopAudio = useCallback(async () => {
    if (audioState === 'playing') {
      audioManager.stop();
      if (isMounted.current) setAudioState('idle');
      return;
    }
    if (audioState === 'loading' || !text) return;
    
    if (isMounted.current) setAudioState('loading');
    
    const textToSpeak = text;
      
    const cacheKey = audioCache.createKey(textToSpeak, voice, model);
    const cachedBuffer = audioCache.get(cacheKey);

    const doPlay = async (buffer: AudioBuffer) => {
        if (!isMounted.current) return;
        setAudioState('playing');
        await audioManager.play(buffer, () => {
            if (isMounted.current) setAudioState('idle');
        });
    };

    if (cachedBuffer) {
        await doPlay(cachedBuffer);
        return;
    }
    
    try {
        const response = await fetchFromApi('/api/handler?task=tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToSpeak, voice, model }),
        });

        if (!response.ok) throw new Error(`TTS request failed with status ${response.status}`);
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) throw new Error("Backend returned HTML");

        const { audio: base64Audio } = await response.json();
        
        if (base64Audio) {
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioManager.context, 24000, 1);
            audioCache.set(cacheKey, audioBuffer);
            await doPlay(audioBuffer);
        } else {
            throw new Error("No audio data returned from backend.");
        }
    } catch (err) {
        console.error("TTS failed:", err);
        if (isMounted.current) setAudioState('error');
    }
  }, [text, voice, model, audioState]);

  return { playOrStopAudio, audioState, isPlaying };
};

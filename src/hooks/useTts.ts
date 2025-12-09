
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { audioCache } from '../services/audioCache';
import { audioManager } from '../services/audioService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { fetchFromApi } from '../utils/api';

type AudioState = 'idle' | 'loading' | 'error' | 'playing';

export const useTts = (text: string, voice: string, model: string) => {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const isPlaying = audioState === 'playing';

  const playOrStopAudio = useCallback(async () => {
    if (audioState === 'playing') {
      audioManager.stop();
      setAudioState('idle');
      return;
    }
    if (audioState === 'loading' || !text) return;
    
    setAudioState('loading');
    
    // Text cleaning is now handled on the backend
    const textToSpeak = text;
      
    const cacheKey = audioCache.createKey(textToSpeak, voice, model);
    const cachedBuffer = audioCache.get(cacheKey);

    const doPlay = async (buffer: AudioBuffer) => {
        setAudioState('playing');
        await audioManager.play(buffer, () => setAudioState('idle'));
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
        setAudioState('error');
    }
  }, [text, voice, model, audioState]);

  return { playOrStopAudio, audioState, isPlaying };
};

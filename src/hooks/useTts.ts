/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { audioCache } from '../services/audioCache';
import { audioManager } from '../services/audioService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { cleanTextForTts } from '../components/Chat/AiMessage/utils';
import { fetchFromApi } from '../utils/api';

type AudioState = 'idle' | 'loading' | 'error' | 'playing';

export const useTts = (text: string, voice: string) => {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const isMounted = useRef(false);
  const isPlaying = audioState === 'playing';

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Cleanup: Stop audio if component unmounts while playing
      if (audioState === 'playing') {
        audioManager.stop();
      }
    };
  }, [audioState]);

  const playOrStopAudio = useCallback(async () => {
    if (audioState === 'playing') {
      audioManager.stop();
      if (isMounted.current) setAudioState('idle');
      return;
    }
    if (audioState === 'loading' || !text) return;
    
    if (isMounted.current) setAudioState('loading');
    
    const textToSpeak = cleanTextForTts(text);
    if (!textToSpeak) {
        console.error("TTS failed: No text to speak after cleaning.");
        if (isMounted.current) setAudioState('error');
        return;
    }
      
    const cacheKey = audioCache.createKey(textToSpeak, voice);
    const cachedBuffer = audioCache.get(cacheKey);

    const doPlay = async (buffer: AudioBuffer) => {
        if (isMounted.current) setAudioState('playing');
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
            body: JSON.stringify({ text: textToSpeak, voice }),
        });

        if (!response.ok) throw new Error(`TTS request failed with status ${response.status}`);
        
        const { audio: base64Audio } = await response.json();
        
        if (base64Audio) {
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioManager.context, 24000, 1);
            audioCache.set(cacheKey, audioBuffer);
            if (isMounted.current) await doPlay(audioBuffer);
        } else {
            throw new Error("No audio data returned from backend.");
        }
    } catch (err) {
        console.error("TTS failed:", err);
        if (isMounted.current) setAudioState('error');
    }
  }, [text, voice, audioState]);

  return { playOrStopAudio, audioState, isPlaying };
};

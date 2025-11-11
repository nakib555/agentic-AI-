/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { audioCache } from '../services/audioCache';
import { audioManager } from '../services/audioService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { cleanTextForTts } from '../components/Chat/AiMessage/utils';
import { API_BASE_URL } from '../utils/api';

type AudioState = 'idle' | 'loading' | 'error' | 'playing';

export const useTts = (text: string, voice: string) => {
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
    
    const textToSpeak = cleanTextForTts(text);
    if (!textToSpeak) {
        console.error("TTS failed: No text to speak after cleaning.");
        setAudioState('error');
        return;
    }
      
    const cacheKey = audioCache.createKey(textToSpeak, voice);
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
        const response = await fetch(`${API_BASE_URL}/api/handler?task=tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToSpeak, voice }),
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
  }, [text, voice, audioState]);

  return { playOrStopAudio, audioState, isPlaying };
};
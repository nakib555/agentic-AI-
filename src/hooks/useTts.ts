/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { audioCache } from '../services/audioCache';
import { audioManager } from '../services/audioService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { cleanTextForTts } from '../components/Chat/AiMessage/utils';

type AudioState = 'idle' | 'loading' | 'error' | 'playing';

export const useTts = (text: string, voice: string) => {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const isPlaying = audioState === 'playing';

  const playOrStopAudio = useCallback(async () => {
    let shouldStartPlayback = false;
    setAudioState(currentState => {
        if (currentState === 'playing') {
            audioManager.stop();
            return 'idle';
        }
        if (currentState === 'loading') {
            return 'loading';
        }
        shouldStartPlayback = true;
        return 'loading';
    });

    if (!shouldStartPlayback || !text) {
        return;
    }
    
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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
            },
        });

        let base64Audio: string | undefined;
        if (response.candidates && response.candidates.length > 0) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                    base64Audio = part.inlineData.data;
                    break;
                }
            }
        }
        
        if (base64Audio) {
            const audioBuffer = await decodeAudioData(decode(base64Audio), audioManager.context, 24000, 1);
            audioCache.set(cacheKey, audioBuffer);
            await doPlay(audioBuffer);
        } else {
            throw new Error("No audio data returned.");
        }
    } catch (err) {
        console.error("TTS failed:", err);
        setAudioState('error');
    }
  }, [text, voice]);

  return { playOrStopAudio, audioState, isPlaying };
};
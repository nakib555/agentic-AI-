
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Helper to downsample audio to 16kHz PCM
const downsampleTo16kHz = (audioData: Float32Array, sampleRate: number): Int16Array => {
    if (sampleRate === 16000) {
        const int16 = new Int16Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            int16[i] = Math.max(-1, Math.min(1, audioData[i])) * 32767;
        }
        return int16;
    }
    
    const ratio = sampleRate / 16000;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Int16Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
        const offset = Math.floor(i * ratio);
        // Simple nearest neighbor for speed, sufficient for speech
        const val = Math.max(-1, Math.min(1, audioData[offset])); 
        result[i] = val < 0 ? val * 32768 : val * 32767;
    }
    return result;
};

// Base64 helper
const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export type LiveConfig = {
    apiKey: string;
    voiceName?: string;
    systemInstruction?: string;
};

export const useLive = ({ apiKey, voiceName = 'Zephyr', systemInstruction }: LiveConfig) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [volume, setVolume] = useState(0); // 0-1 for visualizer
    const [error, setError] = useState<string | null>(null);

    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    
    // Video Capture Refs
    const videoIntervalRef = useRef<number | null>(null);
    const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // Session Ref
    const sessionRef = useRef<any>(null);

    const connect = useCallback(async (videoElement?: HTMLVideoElement) => {
        if (!apiKey) {
            setError("API Key is required for Live Mode.");
            return;
        }

        try {
            setError(null);
            
            // 1. Setup Audio Context
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: 24000 }); // Output rate
            nextStartTimeRef.current = audioContextRef.current.currentTime;

            // 2. Setup Input Stream (Microphone)
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            mediaStreamRef.current = stream;

            // 3. Initialize Gemini Client
            const client = new GoogleGenAI({ apiKey });
            
            // 4. Create Session
            const session = await client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName } }
                    },
                    systemInstruction: systemInstruction || "You are a helpful, witty, and friendly AI assistant. Keep responses concise and conversational."
                }
            });
            sessionRef.current = session;

            // 5. Wire up Input Audio Processing
            const inputContext = new AudioContextClass(); // Input context (usually 44.1k or 48k)
            const source = inputContext.createMediaStreamSource(stream);
            const processor = inputContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate volume for visualizer
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(Math.min(1, rms * 5)); // Boost slightly for visibility

                // Send to Gemini
                const pcm16 = downsampleTo16kHz(inputData, inputContext.sampleRate);
                const base64 = arrayBufferToBase64(pcm16.buffer);
                
                session.sendRealtimeInput([{
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64
                }]);
            };

            source.connect(processor);
            processor.connect(inputContext.destination); // Required for script processor to run
            
            sourceRef.current = source;
            processorRef.current = processor;

            // 6. Handle Output Audio
            // We use a custom loop to poll the session for messages since the SDK provides an async generator/stream interface logic internally or via callbacks depending on version.
            // Based on provided docs: connect returns a session with sendRealtimeInput. 
            // The docs example uses `callbacks` in connect. Let's adjust to the doc pattern.
            // *Correction*: The provided doc pattern uses `ai.live.connect({ callbacks: ... })`.
            // Let's re-implement step 4 to use that pattern.
            
            // Re-initializing properly with callbacks:
            await sessionRef.current.close(); // Close the basic one we just opened to re-open with callbacks
            
            const liveSession = await client.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnected(true);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData) {
                            setIsSpeaking(true);
                            await queueAudio(audioData);
                        }
                        
                        if (msg.serverContent?.turnComplete) {
                            setIsSpeaking(false);
                        }
                    },
                    onclose: () => {
                        setIsConnected(false);
                    },
                    onerror: (err) => {
                        console.error("Live Error:", err);
                        setError("Connection error. Please try again.");
                        setIsConnected(false);
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName } }
                    },
                    systemInstruction: systemInstruction || "You are a helpful AI."
                }
            });
            sessionRef.current = liveSession;

            // 7. Video Frame Loop (if videoElement provided)
            if (videoElement) {
                const canvas = document.createElement('canvas');
                videoCanvasRef.current = canvas;
                const ctx = canvas.getContext('2d');
                
                videoIntervalRef.current = window.setInterval(() => {
                    if (!ctx || !videoElement.videoWidth) return;
                    
                    canvas.width = videoElement.videoWidth * 0.5; // Downscale for bandwidth
                    canvas.height = videoElement.videoHeight * 0.5;
                    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    
                    const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
                    liveSession.sendRealtimeInput([{
                        mimeType: 'image/jpeg',
                        data: base64Data
                    }]);
                }, 500); // 2 FPS is usually enough for context
            }

        } catch (e: any) {
            console.error("Failed to start Live session:", e);
            setError(e.message || "Failed to start session");
            setIsConnected(false);
        }
    }, [apiKey, voiceName, systemInstruction]);

    const queueAudio = async (base64String: string) => {
        if (!audioContextRef.current) return;
        
        const ctx = audioContextRef.current;
        const binaryString = atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        // Convert PCM (int16) to Float32
        const int16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 32768.0;
        }

        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        // Gapless scheduling
        const currentTime = ctx.currentTime;
        const startTime = Math.max(currentTime, nextStartTimeRef.current);
        
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;
        
        scheduledSourcesRef.current.push(source);
        
        // Visualizer volume boost when AI speaks
        setVolume(0.4 + (Math.random() * 0.3)); // Fake visualizer for output for now as we don't analyze output stream directly here
        
        source.onended = () => {
            scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
            if (scheduledSourcesRef.current.length === 0) {
                setVolume(0); // Reset volume when silence
            }
        };
    };

    const disconnect = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close(); // This is the disconnect method
            sessionRef.current = null;
        }
        
        if (videoIntervalRef.current) {
            clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = null;
        }

        if (sourceRef.current) sourceRef.current.disconnect();
        if (processorRef.current) processorRef.current.disconnect();
        if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        
        scheduledSourcesRef.current.forEach(s => s.stop());
        scheduledSourcesRef.current = [];
        nextStartTimeRef.current = 0;

        setIsConnected(false);
        setIsSpeaking(false);
        setVolume(0);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => disconnect();
    }, [disconnect]);

    return {
        connect,
        disconnect,
        isConnected,
        isSpeaking,
        volume,
        error
    };
};


import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLive } from '../../hooks/useLive';

type LiveInterfaceProps = {
    isOpen: boolean;
    onClose: () => void;
    apiKey: string;
    voiceName: string;
};

// Simple pulsing orb
const VoiceOrb = ({ volume, isSpeaking }: { volume: number, isSpeaking: boolean }) => {
    // Volume is 0-1.
    // Base size 96px (w-24). Scale up to 2x.
    // If speaking, change color.
    const scale = 1 + Math.min(volume * 1.5, 1); 
    
    return (
        <div className="relative flex items-center justify-center">
            {/* Outer Glow */}
            <motion.div 
                className={`absolute w-64 h-64 rounded-full blur-3xl opacity-30 ${isSpeaking ? 'bg-indigo-500' : 'bg-blue-400'}`}
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Core Orb */}
            <motion.div
                className={`w-32 h-32 rounded-full shadow-[0_0_50px_rgba(0,0,0,0.3)] bg-gradient-to-br ${isSpeaking ? 'from-indigo-400 to-purple-600' : 'from-blue-400 to-cyan-500'}`}
                animate={{ scale }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
                <div className="absolute inset-0 rounded-full bg-white opacity-20 blur-sm" />
            </motion.div>
        </div>
    );
};

export const LiveInterface: React.FC<LiveInterfaceProps> = ({ isOpen, onClose, apiKey, voiceName }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    
    const { connect, disconnect, isConnected, isSpeaking, volume, error } = useLive({
        apiKey,
        voiceName,
    });

    useEffect(() => {
        if (isOpen) {
            connect(cameraEnabled ? videoRef.current! : undefined);
        } else {
            disconnect();
            setCameraEnabled(false);
        }
        return () => disconnect();
    }, [isOpen, connect, disconnect]); // Re-connect if camera toggled? ideally connect handles it or we handle camera stream update separately.
    // Simplification: Toggle camera requires restart or dynamic add. For now, simple restart logic in effect or just initial config.
    // Let's allow dynamic camera toggle by re-connecting for V1 simplicity.
    
    useEffect(() => {
        if (isOpen && isConnected && cameraEnabled && videoRef.current) {
            // Re-connect to attach video stream logic (simplified)
            // Ideally useLive would expose a method to addVideo
            // For now we assume connect handles the active state
            disconnect();
            setTimeout(() => connect(videoRef.current!), 100);
        }
    }, [cameraEnabled]);

    useEffect(() => {
        // Setup local video preview
        if (cameraEnabled && videoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }).catch(e => {
                console.error("Camera denied", e);
                setCameraEnabled(false);
            });
        } else if (!cameraEnabled && videoRef.current) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
    }, [cameraEnabled]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden"
                >
                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-sm font-medium tracking-wider uppercase opacity-80">Live &bull; Gemini 2.5</span>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Main Stage */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {/* Video Background/PIP */}
                        {cameraEnabled && (
                            <div className="absolute inset-0 z-0 opacity-30">
                                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                            </div>
                        )}
                        
                        <div className="z-10 relative">
                            <VoiceOrb volume={volume} isSpeaking={isSpeaking} />
                            <p className="mt-8 text-center text-lg font-medium opacity-60 animate-pulse">
                                {isConnected ? (isSpeaking ? "Speaking..." : "Listening...") : "Connecting..."}
                            </p>
                            {error && <p className="mt-4 text-red-400 bg-red-900/20 px-4 py-2 rounded-lg">{error}</p>}
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="p-8 pb-12 flex justify-center items-center gap-6 z-20">
                        <button 
                            onClick={() => setCameraEnabled(!cameraEnabled)}
                            className={`p-4 rounded-full transition-all ${cameraEnabled ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        >
                            {cameraEnabled ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                            )}
                        </button>

                        <button 
                            onClick={onClose}
                            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold tracking-wide shadow-lg hover:scale-105 transition-all"
                        >
                            End Session
                        </button>
                    </div>
                    
                    {/* Hidden video element for processing even if UI is different */}
                    <video ref={videoRef} className="hidden" muted playsInline />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

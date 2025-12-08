
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
import { FloatingPrompts } from './FloatingPrompts';
import { WelcomeLogo } from '../../UI/WelcomeLogo';

const motion = motionTyped as any;

type WelcomeScreenProps = {
  sendMessage: (message: string) => void;
};

export const WelcomeScreen = ({ sendMessage }: WelcomeScreenProps) => (
    <div className="flex flex-col items-center justify-center h-full text-center pb-4 md:pb-24 px-4 relative overflow-hidden overflow-y-auto md:overflow-y-hidden no-scrollbar">
        
        {/* Background Gradients / Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <motion.div 
                animate={{ 
                    x: [0, 50, -50, 0], 
                    y: [0, -50, 50, 0],
                    scale: [1, 1.1, 0.9, 1] 
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-50" 
            />
            <motion.div 
                animate={{ 
                    x: [0, -70, 30, 0], 
                    y: [0, 60, -40, 0],
                    scale: [1, 1.2, 0.8, 1] 
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-50" 
            />
            <motion.div 
                animate={{ 
                    x: [0, 40, -40, 0], 
                    y: [0, -30, 30, 0],
                    scale: [1, 0.9, 1.1, 1] 
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-30" 
            />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto min-h-[400px] z-10">
            <motion.div 
                className="relative mb-8 md:mb-12 flex-shrink-0"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="relative z-10 drop-shadow-2xl">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl flex items-center justify-center">
                        <WelcomeLogo className="w-16 h-16 md:w-20 md:h-20" />
                    </div>
                </div>
            </motion.div>

            <motion.h1 
                className="text-4xl sm:text-6xl md:text-7xl font-bold font-display tracking-tight mb-4 md:mb-8 leading-[1.1]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
                <span className="text-content-primary drop-shadow-sm">Unlock your </span>
                <span className="block sm:inline mt-2 sm:mt-0">
                    <motion.span
                        className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 bg-[length:200%_auto]"
                        animate={{ backgroundPosition: ["0% center", "200% center"] }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    >
                        potential.
                    </motion.span>
                </span>
            </motion.h1>
            
            <motion.p
                className="text-lg md:text-xl text-content-secondary max-w-xs md:max-w-2xl mx-auto mb-10 md:mb-16 leading-relaxed font-medium px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                Your autonomous agent for complex reasoning, creative coding, and deep analysis.
            </motion.p>
            
            <div className="w-full px-2 md:px-0">
                <FloatingPrompts onPromptClick={sendMessage} />
            </div>
        </div>
    </div>
);

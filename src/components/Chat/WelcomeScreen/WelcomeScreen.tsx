
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
        
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary-main/5 rounded-full blur-[80px] md:blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-500/5 rounded-full blur-[80px] md:blur-[128px] pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[400px]">
            <motion.div 
                className="relative mb-6 md:mb-12 flex-shrink-0"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="relative z-10 drop-shadow-2xl">
                    {/* Responsive logo sizing wrapper */}
                    <div className="w-20 h-20 md:w-[120px] md:h-[120px]">
                        <WelcomeLogo className="filter drop-shadow-[0_20px_40px_rgba(99,102,241,0.2)]" />
                    </div>
                </div>
            </motion.div>

            <motion.h1 
                className="text-3xl sm:text-5xl md:text-6xl font-bold font-display tracking-tight mb-3 md:mb-6 leading-[1.1]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            >
                <span className="text-content-primary">Unlock your </span>
                <span className="block sm:inline">
                    <motion.span
                        className="text-transparent bg-clip-text bg-gradient-to-r from-primary-main via-purple-500 to-primary-main bg-[length:200%_auto]"
                        animate={{ backgroundPosition: ["0% center", "200% center"] }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    >
                        potential.
                    </motion.span>
                </span>
            </motion.h1>
            
            <motion.p
                className="text-base md:text-lg text-content-secondary max-w-md md:max-w-lg mx-auto mb-8 md:mb-16 leading-relaxed font-light px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                Your autonomous agent for complex reasoning, creative coding, and deep analysis.
            </motion.p>
            
            <div className="w-full">
                <FloatingPrompts onPromptClick={sendMessage} />
            </div>
        </div>
    </div>
);

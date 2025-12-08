
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
    <div className="flex flex-col items-center justify-center h-full text-center pb-24 px-6 relative overflow-hidden">
        
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-main/5 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px] pointer-events-none" />

        <motion.div 
            className="relative mb-12"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="relative z-10 drop-shadow-2xl">
                <WelcomeLogo size={120} className="filter drop-shadow-[0_20px_40px_rgba(99,102,241,0.2)]" />
            </div>
        </motion.div>

        <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold font-display tracking-tight mb-6 leading-[1.1]"
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
            className="text-lg text-content-secondary max-w-lg mx-auto mb-16 leading-relaxed font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
        >
            Your autonomous agent for complex reasoning, creative coding, and deep analysis.
        </motion.p>
        
        <FloatingPrompts onPromptClick={sendMessage} />
    </div>
);

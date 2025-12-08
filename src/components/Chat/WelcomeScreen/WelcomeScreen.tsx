
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
    <div className="flex flex-col items-center justify-center h-full text-center pb-12 px-4">
        <motion.div 
            className="relative mb-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
            {/* Ambient glow behind the logo */}
            <div className="absolute -inset-12 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/10 animate-pulse"></div>
            
            {/* The Main Logo */}
            <div className="relative drop-shadow-2xl">
                <WelcomeLogo size={140} className="filter drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]" />
            </div>
        </motion.div>

        <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold font-['Space_Grotesk'] tracking-tight mb-5 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
            <span className="text-slate-800 dark:text-slate-100">How can </span>
            <span className="block sm:inline">
                <motion.span
                    className="brand-gradient pb-1" // pb-1 to prevent descenders clipping
                    animate={{ backgroundPosition: ["0% center", "200% center"] }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    I help you today?
                </motion.span>
            </span>
        </motion.h1>
        
        <motion.p
            className="text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            Your autonomous agent for reasoning, coding, and creation.
        </motion.p>
        
        <FloatingPrompts onPromptClick={sendMessage} />
    </div>
);

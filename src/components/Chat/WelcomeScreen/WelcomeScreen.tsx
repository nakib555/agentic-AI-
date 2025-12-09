
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
    <div className="flex flex-col items-center justify-center h-full text-center pb-12 px-4 relative overflow-y-auto custom-scrollbar">
        <motion.div 
            className="relative mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
            {/* Ambient glow behind the logo */}
            <div className="absolute -inset-16 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl animate-pulse"></div>
            
            {/* The Main Logo */}
            <div className="relative drop-shadow-[0_20px_50px_rgba(99,102,241,0.25)]">
                <WelcomeLogo size={140} className="filter" />
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="mb-6 space-y-2"
        >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-['Space_Grotesk'] tracking-tight leading-tight">
                <span className="text-slate-800 dark:text-slate-100">How can </span>
                <span className="brand-gradient">I help you?</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto">
                Your autonomous agent for reasoning, coding, and creation.
            </p>
        </motion.div>
        
        <div className="w-full max-w-3xl">
             <FloatingPrompts onPromptClick={sendMessage} />
        </div>
    </div>
);

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
    <div className="flex flex-col items-center justify-center h-full text-center pb-20 px-4">
        <motion.div 
            className="relative mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
            {/* Ambient glow behind the logo */}
            <div className="absolute -inset-20 rounded-full bg-primary-main/20 blur-3xl animate-pulse"></div>
            <div className="absolute -inset-10 rounded-full bg-blue-500/10 blur-2xl"></div>
            
            {/* The Main Logo */}
            <div className="relative drop-shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                <WelcomeLogo size={160} />
            </div>
        </motion.div>

        <motion.h1 
            className="text-4xl sm:text-6xl font-bold font-['Space_Grotesk'] tracking-tight mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
            <span className="text-content-primary">How can </span>
            <span className="block sm:inline">
                <motion.span
                    className="brand-gradient pb-1"
                    animate={{ backgroundPosition: ["0% center", "200% center"] }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    I help you?
                </motion.span>
            </span>
        </motion.h1>
        
        <motion.p
            className="text-lg text-content-secondary max-w-lg mx-auto mb-16 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
        >
            Your autonomous agent for reasoning, coding, and creation.
        </motion.p>
        
        <FloatingPrompts onPromptClick={sendMessage} />
    </div>
);
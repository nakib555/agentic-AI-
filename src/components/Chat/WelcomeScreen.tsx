/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React from 'react';
// FIX: Cast `motion` to `any` to bypass framer-motion typing issues.
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import { FloatingPrompts } from './FloatingPrompts';

type WelcomeScreenProps = {
  sendMessage: (message: string) => void;
};

export const WelcomeScreen = ({ sendMessage }: WelcomeScreenProps) => (
    <div className="flex flex-col items-center justify-center h-full text-center pb-12 px-4">
        <motion.h1 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 font-['Space_Grotesk']"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
            How can I help you today?
        </motion.h1>
        
        <FloatingPrompts onPromptClick={sendMessage} />
    </div>
);
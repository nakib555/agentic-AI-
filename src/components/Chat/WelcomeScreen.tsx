/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React from 'react';
import { motion } from 'framer-motion';
import { FloatingPrompts } from './FloatingPrompts';

type WelcomeScreenProps = {
  sendMessage: (message: string) => void;
};

export const WelcomeScreen = ({ sendMessage }: WelcomeScreenProps) => (
    <div className="flex flex-col items-center justify-center h-full text-center pb-12 px-4">
        <motion.div 
            className="relative mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-teal-400 to-green-400 opacity-20 blur-2xl"></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-green-400 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white">
                    <path d="M12.243 2.25c-1.552 0-2.887 1.09-3.413 2.53-.083.228.065.46.303.46h.01c1.4 0 2.352.488 2.352 1.76 0 1.272-.952 1.76-2.352 1.76h-.01c-.238 0-.386.232-.303.46.526 1.44 1.861 2.53 3.413 2.53 2.29 0 4.155-1.864 4.155-4.15S14.533 2.25 12.243 2.25zm0 10c-1.552 0-2.887 1.09-3.413 2.53-.083.228.065.46.303.46h.01c1.4 0 2.352.488 2.352 1.76 0 1.272-.952 1.76-2.352 1.76h-.01c-.238 0-.386.232-.303.46.526 1.44 1.861 2.53 3.413 2.53 2.29 0 4.155-1.864 4.155-4.15S14.533 12.25 12.243 12.25z"/>
                 </svg>
            </div>
        </motion.div>
        <motion.h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 dark:text-slate-100 font-['Space_Grotesk']"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
            How can I help you today?
        </motion.h1>
        
        <FloatingPrompts onPromptClick={sendMessage} />
    </div>
);
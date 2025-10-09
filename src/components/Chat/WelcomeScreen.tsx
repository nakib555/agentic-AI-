/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// FIX: Removed invalid 'aistudio' from react import.
import React from 'react';
import { motion } from 'framer-motion';

export const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center pb-12">
        <motion.div 
            className="relative w-24 h-24 mb-6"
            animate={{ y: [0, -10, 0] }}
            transition={{ 
                duration: 1.8, 
                repeat: Infinity, 
                ease: "easeInOut" 
            }}
        >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-300 via-blue-300 to-green-200 opacity-50 blur-xl"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-teal-400 via-blue-400 to-green-300 opacity-60 blur-lg"></div>
            <div className="absolute inset-4 rounded-full bg-white/80 dark:bg-slate-800/80"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-teal-600 dark:text-teal-400 select-none">G</span>
            </div>
        </motion.div>
        <motion.h1 
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
            How can I help you today, <span className="text-teal-600 dark:text-teal-400">darling</span>? ❤️
        </motion.h1>
    </div>
);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
import { FloatingPrompts } from './FloatingPrompts';
const motion = motionTyped as any;

type WelcomeScreenProps = {
  sendMessage: (message: string) => void;
};

export const WelcomeScreen = ({ sendMessage }: WelcomeScreenProps) => (
    <div className="flex flex-col items-center w-full max-w-2xl text-center px-4 py-8">
        <motion.h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold font-['Space_Grotesk'] tracking-tighter text-gradient"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            style={{ letterSpacing: "-0.02em" }}
        >
            How can I help you today?
        </motion.h1>
        
        <FloatingPrompts onPromptClick={sendMessage} />
    </div>
);
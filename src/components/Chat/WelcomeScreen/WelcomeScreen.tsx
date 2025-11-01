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
    <div className="flex flex-col items-center justify-center w-full my-auto text-center pb-12 px-4">
        <motion.h1 
            className="text-4xl sm:text-4xl lg:text-5xl font-bold font-['Space_Grotesk']"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
            <motion.span
                className="brand-gradient bg-clip-text text-transparent"
                animate={{ backgroundPosition: ["0% center", "100% center"] }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "reverse",
                }}
            >
                How can I help you today?
            </motion.span>
        </motion.h1>
        
        <FloatingPrompts onPromptClick={sendMessage} />
    </div>
);
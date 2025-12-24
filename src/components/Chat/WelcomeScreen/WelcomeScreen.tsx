
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
import { FloatingPrompts } from './FloatingPrompts';

const motion = motionTyped as any;

type WelcomeScreenProps = {
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
};

export const WelcomeScreen = ({ sendMessage }: WelcomeScreenProps) => (
    <div className="flex flex-col items-center justify-center h-full text-center pb-12 px-4 relative overflow-y-auto custom-scrollbar">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="mb-12 space-y-3"
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
             <FloatingPrompts onPromptClick={(prompt, options) => sendMessage(prompt, undefined, options)} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 w-full max-w-3xl">
            <CapabilityCard 
                icon="💡"
                title="Reason"
                description="Solve complex problems and provide detailed explanations."
                delay={0.4}
            />
            <CapabilityCard 
                icon="🎨"
                title="Create"
                description="Generate images and videos from your descriptions."
                delay={0.5}
            />
            <CapabilityCard 
                icon="💻"
                title="Code"
                description="Write and execute code to perform calculations and tasks."
                delay={0.6}
            />
            <CapabilityCard 
                icon="🌐"
                title="Search"
                description="Find the latest information from across the web."
                delay={0.7}
            />
        </div>
    </div>
);

const CapabilityCard = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) => (
    <motion.div 
        className="bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/10 h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
        <div className="text-2xl mb-3">{icon}</div>
        <h3 className="font-semibold text-gray-800 dark:text-slate-100 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">{description}</p>
    </motion.div>
);

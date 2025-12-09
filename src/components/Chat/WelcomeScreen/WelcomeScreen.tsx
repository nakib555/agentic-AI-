
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
        
        <div className="mb-12 w-full max-w-3xl">
             <FloatingPrompts onPromptClick={sendMessage} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl px-2">
            <CapabilityCard 
                icon="💡"
                title="Reason"
                description="Solve complex problems."
                delay={0.4}
                color="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20"
            />
            <CapabilityCard 
                icon="🎨"
                title="Create"
                description="Generate images & videos."
                delay={0.5}
                color="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200/50 dark:border-pink-500/20"
            />
            <CapabilityCard 
                icon="💻"
                title="Code"
                description="Execute Python & JS."
                delay={0.6}
                color="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20"
            />
            <CapabilityCard 
                icon="🌐"
                title="Search"
                description="Access real-time info."
                delay={0.7}
                color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20"
            />
        </div>
    </div>
);

const CapabilityCard = ({ icon, title, description, delay, color }: { icon: React.ReactNode, title: string, description: string, delay: number, color: string }) => (
    <motion.div 
        className={`glass-panel p-5 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-1 duration-300 ${color} border bg-opacity-50 dark:bg-opacity-10 backdrop-blur-md`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
        <div className="text-2xl mb-3">{icon}</div>
        <h3 className="font-bold text-base mb-1">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
    </motion.div>
);

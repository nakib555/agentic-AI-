
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FloatingPrompts } from './FloatingPrompts';

type WelcomeScreenProps = {
  sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
};

export const WelcomeScreen = ({ sendMessage }: WelcomeScreenProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Animate Title Section
        tl.fromTo('.welcome-title', 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 }
        );
        
        tl.fromTo('.welcome-subtitle', 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 },
            "-=0.6"
        );

        // Animate Floating Prompts (handled inside the component, but we can trigger the container here if needed)
        // Since FloatingPrompts renders buttons, let's animate the container
        tl.fromTo('.prompts-container',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8 },
            "-=0.4"
        );

    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="flex flex-col items-center justify-center h-full text-center pb-12 px-4 relative overflow-y-auto custom-scrollbar">
            <div className="mb-12 space-y-3">
                <h1 className="welcome-title text-4xl sm:text-5xl md:text-6xl font-bold font-['Space_Grotesk'] tracking-tight leading-tight">
                    <span className="text-slate-800 dark:text-slate-100">How can </span>
                    <span className="brand-gradient">I help you?</span>
                </h1>
                <p className="welcome-subtitle text-lg text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto">
                    Your autonomous agent for reasoning, coding, and creation.
                </p>
            </div>
            
            <div className="prompts-container w-full max-w-3xl">
                 <FloatingPrompts onPromptClick={(prompt, options) => sendMessage(prompt, undefined, options)} />
            </div>
        </div>
    );
};

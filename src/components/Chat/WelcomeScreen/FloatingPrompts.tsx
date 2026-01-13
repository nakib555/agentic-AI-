
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
import { PromptButton, type PromptColor } from './PromptButton';
const motion = motionTyped as any;

type FloatingPromptsProps = {
  onPromptClick: (prompt: string, options?: { isThinkingModeEnabled?: boolean }) => void;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.4,
        staggerChildren: 0.08,
      },
    },
};

const PROMPTS: { icon: string; text: string; prompt: string; color: PromptColor, agent?: boolean }[] = [
    { 
        icon: "📈", 
        text: "Market Analyst", 
        prompt: "Research the current stock prices of Apple (AAPL), Microsoft (MSFT), and Google (GOOGL). Then, use Python to generate a bar chart comparing their values.", 
        color: "violet", 
        agent: true 
    },
    { 
        icon: "🗺️", 
        text: "Travel Agent", 
        prompt: "I want to visit Kyoto, Japan. Find 3 top-rated historical temples, check the current weather there, and display their locations on a map.", 
        color: "emerald", 
        agent: true 
    },
    { 
        icon: "🔬", 
        text: "Data Scientist", 
        prompt: "Write a Python script to perform a Monte Carlo simulation for estimating the value of Pi, and plot the results.", 
        color: "indigo",
        agent: true
    },
    { 
        icon: "🎨", 
        text: "Creative Studio", 
        prompt: "Generate an image of a futuristic eco-city. Then, write a short architectural concept description based on the visual.", 
        color: "fuchsia", 
        agent: true 
    },
    { 
        icon: "🧠", 
        text: "Deep Reasoner", 
        prompt: "Analyze the potential long-term economic impacts of universal basic income (UBI). Provide arguments for and against, citing recent studies.", 
        color: "amber",
        agent: true
    },
    { 
        icon: "🎬", 
        text: "Video Producer", 
        prompt: "Generate a cinematic video of a detective walking through a rainy neon city at night.", 
        color: "rose", 
        agent: true 
    },
];

export const FloatingPrompts = ({ onPromptClick }: FloatingPromptsProps) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="flex flex-wrap justify-center gap-3 w-full max-w-5xl mx-auto"
  >
    {PROMPTS.map((p, i) => (
        <PromptButton 
            key={i} 
            icon={p.icon} 
            text={p.text} 
            color={p.color}
            onClick={() => onPromptClick(p.prompt, { isThinkingModeEnabled: !!p.agent })} 
        />
    ))}
  </motion.div>
);

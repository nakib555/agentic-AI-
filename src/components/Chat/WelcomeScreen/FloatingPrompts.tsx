
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
    { icon: "🧮", text: "1 Tool", prompt: "Use the calculator tool to calculate (153.5 * 44) / 1.5.", color: "cyan", agent: true },
    { icon: "⛓️", text: "Multi-Tool", prompt: "Search for the GDP of France and Germany in 2023. Then, use Python to calculate the difference and create a small bar chart comparing them.", color: "violet", agent: true },
    { icon: "🎨", text: "Image", prompt: "Generate an image of a futuristic robot painting a canvas.", color: "fuchsia", agent: true },
    { icon: "🗺️", text: "Map", prompt: "Show me a map of Central Park, New York.", color: "emerald", agent: true },
    { icon: "🎬", text: "Video", prompt: "Generate a video of a neon city at night.", color: "rose", agent: true },
    { icon: "📍", text: "Nearby", prompt: "Find pizza places near me.", color: "blue", agent: true },
    { icon: "🧠", text: "Reasoning", prompt: "Explain the grandfather paradox in simple terms.", color: "amber" },
    { icon: "📊", text: "Table", prompt: "Create a markdown table comparing React, Vue, and Angular.", color: "indigo" },
];

export const FloatingPrompts = ({ onPromptClick }: FloatingPromptsProps) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="flex flex-wrap justify-center gap-3 w-full max-w-4xl mx-auto"
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

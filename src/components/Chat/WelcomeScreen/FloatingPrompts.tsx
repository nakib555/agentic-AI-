
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
import { PromptButton } from './PromptButton';
const motion = motionTyped as any;

type FloatingPromptsProps = {
  onPromptClick: (prompt: string) => void;
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

const prompts = [
    { icon: "🧠", text: "Reasoning", prompt: "What is the capital of France?", color: "text-violet-600", bg: "bg-violet-500/10", border: "border-violet-200" },
    { icon: "🎬", text: "Video", prompt: "Generate a video of a cat playing a piano.", color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-200" },
    { icon: "🎨", text: "Image", prompt: "Generate an image of a robot eating spaghetti.", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-200" },
    { icon: "🗺️", text: "Map", prompt: "Show me a map of the Eiffel Tower.", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-200" },
    { icon: "🤔", text: "MCQ", prompt: "Ask me a multiple choice question about physics.", color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-200" },
    { icon: "📍", text: "Nearby", prompt: "Find coffee shops near me.", color: "text-cyan-600", bg: "bg-cyan-500/10", border: "border-cyan-200" },
    { icon: "📊", text: "Table", prompt: "Create a markdown table comparing the features of Gemini 2.5 Pro and Gemini 2.5 Flash.", color: "text-indigo-600", bg: "bg-indigo-500/10", border: "border-indigo-200" },
    { icon: "📝", text: "Markdown", prompt: "Show me a comprehensive example of all the markdown formatting you support.", color: "text-fuchsia-600", bg: "bg-fuchsia-500/10", border: "border-fuchsia-200" }
];

export const FloatingPrompts = ({ onPromptClick }: FloatingPromptsProps) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="flex flex-wrap justify-center gap-2 md:gap-3 w-full max-w-3xl mx-auto px-1"
  >
    {prompts.map((p, i) => (
        <PromptButton 
            key={p.text}
            index={i}
            icon={p.icon} 
            text={p.text} 
            onClick={() => onPromptClick(p.prompt)} 
            colorClass={p.color}
            bgClass={p.bg}
            borderClass={p.border}
        />
    ))}
  </motion.div>
);

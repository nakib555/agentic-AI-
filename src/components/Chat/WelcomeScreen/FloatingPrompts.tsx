

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
  isAgentMode: boolean;
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

const AGENT_PROMPTS: { icon: string; text: string; prompt: string; color: PromptColor }[] = [
    { 
        icon: "📈", 
        text: "Market Analyst", 
        prompt: "Research the current stock prices of Apple (AAPL), Microsoft (MSFT), and Google (GOOGL). Then, use Python to generate a bar chart comparing their values.", 
        color: "violet"
    },
    { 
        icon: "🗺️", 
        text: "Travel Agent", 
        prompt: "I want to visit Kyoto, Japan. Find 3 top-rated historical temples, check the current weather there, and display their locations on a map.", 
        color: "emerald"
    },
    { 
        icon: "🔬", 
        text: "Data Scientist", 
        prompt: "Write a Python script to perform a Monte Carlo simulation for estimating the value of Pi, and plot the results.", 
        color: "indigo"
    },
    { 
        icon: "🎨", 
        text: "Creative Studio", 
        prompt: "Generate an image of a futuristic eco-city. Then, write a short architectural concept description based on the visual.", 
        color: "fuchsia"
    },
    { 
        icon: "🧠", 
        text: "Deep Reasoner", 
        prompt: "Analyze the potential long-term economic impacts of universal basic income (UBI). Provide arguments for and against, citing recent studies.", 
        color: "amber"
    },
    { 
        icon: "🎬", 
        text: "Video Producer", 
        prompt: "Generate a cinematic video of a detective walking through a rainy neon city at night.", 
        color: "rose"
    },
];

const CHAT_PROMPTS: { icon: string; text: string; prompt: string; color: PromptColor }[] = [
    {
        icon: "⚛️",
        text: "Explain Quantum",
        prompt: "Explain quantum computing in simple terms.",
        color: "cyan"
    },
    {
        icon: "✍️",
        text: "Creative Writer",
        prompt: "Write a haiku about a robot learning to love.",
        color: "fuchsia"
    },
    {
        icon: "🍵",
        text: "Health Tips",
        prompt: "What are the health benefits of green tea?",
        color: "emerald"
    },
    {
        icon: "🚀",
        text: "Startup Ideas",
        prompt: "Help me brainstorm names for a tech startup focused on sustainability.",
        color: "blue"
    },
    {
        icon: "📚",
        text: "Literature",
        prompt: "Summarize the plot of 'The Great Gatsby' in 3 sentences.",
        color: "amber"
    },
    {
        icon: "🎌",
        text: "Translator",
        prompt: "Translate 'Hello, how are you?' into Japanese, French, and Spanish.",
        color: "rose"
    }
];

export const FloatingPrompts = ({ onPromptClick, isAgentMode }: FloatingPromptsProps) => {
  const prompts = isAgentMode ? AGENT_PROMPTS : CHAT_PROMPTS;

  return (
    <motion.div
      key={isAgentMode ? 'agent' : 'chat'} // Key forces re-animation on switch
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="flex flex-wrap justify-center gap-3 w-full max-w-5xl mx-auto"
    >
        {prompts.map((p, i) => (
            <PromptButton 
                key={i} 
                icon={p.icon} 
                text={p.text} 
                color={p.color}
                onClick={() => onPromptClick(p.prompt, { isThinkingModeEnabled: isAgentMode })} 
            />
        ))}
    </motion.div>
  );
};
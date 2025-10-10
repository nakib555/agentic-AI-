/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { PromptButton } from './PromptButton';

type FloatingPromptsProps = {
  onPromptClick: (prompt: string) => void;
};

export const FloatingPrompts = ({ onPromptClick }: FloatingPromptsProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="flex flex-wrap items-center justify-center gap-2 mb-2"
  >
    <PromptButton icon="🧠" text="Reasoning" onClick={() => onPromptClick("What is the capital of France?")} />
    <PromptButton icon="🎬" text="Video" onClick={() => onPromptClick("Generate a video of a cat playing a piano.")} />
    <PromptButton icon="🎨" text="Image" onClick={() => onPromptClick("Generate an image of a robot eating spaghetti.")} />
    <PromptButton icon="💻" text="Code" onClick={() => onPromptClick("Calculate the 15th Fibonacci number using JavaScript.")} />
    <PromptButton icon="📍" text="Nearby" onClick={() => onPromptClick("Find coffee shops near me.")} />
    <PromptButton icon="📊" text="Table" onClick={() => onPromptClick("Create a markdown table comparing the features of Gemini 2.5 Pro and Gemini 2.5 Flash.")} />
    <PromptButton icon="📝" text="Markdown" onClick={() => onPromptClick("Show me a comprehensive example of all the markdown formatting you support.")} />
  </motion.div>
);
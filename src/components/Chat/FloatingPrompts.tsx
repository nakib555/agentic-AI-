/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// FIX: Cast `motion` to `any` to bypass framer-motion typing issues.
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;
import { PromptButton } from './PromptButton';

type FloatingPromptsProps = {
  onPromptClick: (prompt: string) => void;
};

export const FloatingPrompts = ({ onPromptClick }: FloatingPromptsProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: 'easeOut', delay: 0.4 }}
    className="flex flex-wrap justify-center gap-3 mt-12 w-full max-w-xl"
  >
    <PromptButton icon="🧠" text="Reasoning" onClick={() => onPromptClick("What is the capital of France?")} />
    <PromptButton icon="🎬" text="Video" onClick={() => onPromptClick("Generate a video of a cat playing a piano.")} />
    <PromptButton icon="🎨" text="Image" onClick={() => onPromptClick("Generate an image of a robot eating spaghetti.")} />
    <PromptButton icon="🗺️" text="Map" onClick={() => onPromptClick("Show me a map of the Eiffel Tower.")} />
    <PromptButton icon="🤔" text="MCQ" onClick={() => onPromptClick("Ask me a multiple choice question about physics.")} />
    <PromptButton icon="💻" text="Code" onClick={() => onPromptClick("make pdf of jobs any random.")} />
    <PromptButton icon="📍" text="Nearby" onClick={() => onPromptClick("Find coffee shops near me.")} />
    <PromptButton icon="📊" text="Table" onClick={() => onPromptClick("Create a markdown table comparing the features of Gemini 2.5 Pro and Gemini 2.5 Flash.")} />
    <PromptButton icon="📝" text="Markdown" onClick={() => onPromptClick("Show me a comprehensive example of all the markdown formatting you support.")} />
  </motion.div>
);
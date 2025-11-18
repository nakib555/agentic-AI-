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

export const FloatingPrompts = ({ onPromptClick }: FloatingPromptsProps) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    exit="hidden"
    className="flex flex-wrap justify-center gap-3 mt-12 w-full max-w-xl"
  >
    <PromptButton icon="🧠" text="Reasoning" onClick={() => onPromptClick("What is the capital of France?")} />
    <PromptButton icon="🎬" text="Video" onClick={() => onPromptClick("Generate a video of a cat playing a piano.")} />
    <PromptButton icon="🎨" text="Image" onClick={() => onPromptClick("Generate an image of a robot eating spaghetti.")} />
    <PromptButton icon="🗺️" text="Map" onClick={() => onPromptClick("Show me a map of the Eiffel Tower.")} />
    <PromptButton icon="🤔" text="MCQ" onClick={() => onPromptClick("Ask me a multiple choice question about physics.")} />
    <PromptButton icon="📍" text="Nearby" onClick={() => onPromptClick("Find coffee shops near me.")} />
    <PromptButton icon="📊" text="Table" onClick={() => onPromptClick("Create a markdown table comparing the features of Gemini 2.5 Pro and Gemini 2.5 Flash.")} />
    <PromptButton icon="📝" text="Markdown" onClick={() => onPromptClick("Show me a comprehensive example of all the markdown formatting you support.")} />
  </motion.div>
);
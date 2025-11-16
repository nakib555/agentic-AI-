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
    <PromptButton icon="🧠" text="Solve a riddle" onClick={() => onPromptClick("I have cities, but no houses; forests, but no trees; and water, but no fish. What am I?")} />
    <PromptButton icon="🎬" text="Create a short video" onClick={() => onPromptClick("Generate a video of a cat playing a piano.")} />
    <PromptButton icon="🎨" text="Design an image" onClick={() => onPromptClick("Generate an image of a robot eating spaghetti.")} />
    <PromptButton icon="🗺️" text="Show a map" onClick={() => onPromptClick("Show me a map of the Eiffel Tower.")} />
    <PromptButton icon="🤔" text="Test my knowledge" onClick={() => onPromptClick("Ask me a multiple choice question about physics.")} />
    <PromptButton icon="💻" text="Write some code" onClick={() => onPromptClick("Write a Python script using the reportlab library to generate a PDF containing a list of 5 random job titles. Save the output file as \"jobs.pdf\".")} />
    <PromptButton icon="📍" text="Find places nearby" onClick={() => onPromptClick("Find coffee shops near me.")} />
    <PromptButton icon="📊" text="Compare in a table" onClick={() => onPromptClick("Create a markdown table comparing the features of Gemini 2.5 Pro and Gemini 2.5 Flash.")} />
    <PromptButton icon="📝" text="Showcase formatting" onClick={() => onPromptClick("Show me a comprehensive example of all the markdown formatting you support.")} />
  </motion.div>
);
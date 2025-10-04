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
    <PromptButton icon="🌦️" text="Weather" onClick={() => onPromptClick("What's the weather like in Tokyo?")} />
    <PromptButton icon="🗺️" text="Map" onClick={() => onPromptClick("Show me a map of the Eiffel Tower")} />
    <PromptButton icon="📍" text="Nearby" onClick={() => onPromptClick("Find cafes near me")} />
    <PromptButton icon="💻" text="Code" onClick={() => onPromptClick("Write a simple Python function to find prime numbers.")} />
    <PromptButton icon="📊" text="Table" onClick={() => onPromptClick("Create a markdown table comparing the features of Gemini 2.5 Pro and Gemini 2.5 Flash.")} />
    <PromptButton icon="📝" text="Markdown" onClick={() => onPromptClick("Show me a comprehensive example of all the markdown formatting you support.")} />
    <PromptButton icon="💡" text="Callout" onClick={() => onPromptClick("Show me an example of a 'success' callout block and a 'danger' callout block.")} />
  </motion.div>
);
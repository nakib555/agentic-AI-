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
    <PromptButton icon="✨" text="Create Image" onClick={() => onPromptClick("Create an image of a photorealistic cat wearing a wizard hat")} />
    <PromptButton icon="🌦️" text="Weather" onClick={() => onPromptClick("What's the weather like in Tokyo?")} />
    <PromptButton icon="📍" text="Nearby" onClick={() => onPromptClick("Find cafes near me")} />
  </motion.div>
);
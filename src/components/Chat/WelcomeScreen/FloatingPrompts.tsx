
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { PromptButton, type PromptColor } from './PromptButton';

type FloatingPromptsProps = {
  onPromptClick: (prompt: string, options?: { isThinkingModeEnabled?: boolean }) => void;
};

const PROMPTS: { icon: string; text: string; prompt: string; color: PromptColor, agent?: boolean }[] = [
    { icon: "🧠", text: "Reasoning", prompt: "What is the capital of France?", color: "violet" },
    { icon: "🎬", text: "Video", prompt: "Generate a video of a cat playing a piano.", color: "rose", agent: true },
    { icon: "🎨", text: "Image", prompt: "Generate an image of a robot eating spaghetti.", color: "fuchsia", agent: true },
    { icon: "🗺️", text: "Map", prompt: "Show me a map of the Eiffel Tower.", color: "emerald", agent: true },
    { icon: "🤔", text: "MCQ", prompt: "Ask me a multiple choice question about physics.", color: "amber" },
    { icon: "📍", text: "Nearby", prompt: "Find coffee shops near me.", color: "blue", agent: true },
    { icon: "📊", text: "Table", prompt: "Create a markdown table comparing the features of Gemini 2.5 Pro and Gemini 2.5 Flash.", color: "indigo" },
    { icon: "📝", text: "Markdown", prompt: "Show me a comprehensive example of all the markdown formatting you support.", color: "teal" },
];

export const FloatingPrompts = ({ onPromptClick }: FloatingPromptsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo('.prompt-btn', 
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.05,
        ease: 'back.out(1.7)',
        delay: 0.5 // Wait for title
      }
    );
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap justify-center gap-3 w-full max-w-4xl mx-auto"
    >
      {PROMPTS.map((p, i) => (
          <div key={i} className="prompt-btn opacity-0">
            <PromptButton 
                icon={p.icon} 
                text={p.text} 
                color={p.color}
                onClick={() => onPromptClick(p.prompt, { isThinkingModeEnabled: !!p.agent })} 
            />
          </div>
      ))}
    </div>
  );
};

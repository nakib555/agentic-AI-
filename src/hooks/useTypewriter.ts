
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A hook that progressively reveals text to simulate a typewriter effect.
 * 
 * PERFORMANCE OPTIMIZATION:
 * This hook uses a "Time Budget" strategy.
 * 1. It limits React state updates to ~30fps (33ms) to prevent blocking the main thread.
 * 2. It calculates how many characters to add based on the remaining queue size.
 *    If the queue is large (AI generated a lot of text), it types faster.
 *    If the queue is small, it types at a natural reading speed.
 */
export const useTypewriter = (targetText: string, isThinking: boolean) => {
  // If we are not thinking (e.g. history load), show text immediately
  // This bypasses the effect entirely for instant loading of old chats
  const [displayedText, setDisplayedText] = useState(() => isThinking ? '' : targetText);
  
  const currentLength = useRef(isThinking ? 0 : targetText.length);
  const targetTextRef = useRef(targetText);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    targetTextRef.current = targetText;
    
    // If target text shrinks (e.g. regeneration/branch switch), snap to it immediately
    if (targetText.length < currentLength.current) {
        currentLength.current = targetText.length;
        setDisplayedText(targetText);
    }
    
    // Ensure loop is running if there is work to do
    if (rafRef.current === null && currentLength.current < targetText.length) {
        rafRef.current = requestAnimationFrame(loop);
    }
  }, [targetText]);

  const loop = useCallback((timestamp: number) => {
      const targetLen = targetTextRef.current.length;
      
      // Stop if caught up
      if (currentLength.current >= targetLen) {
          rafRef.current = null;
          return;
      }

      // --- PERFORMANCE THROTTLE ---
      // We cap updates to ~30fps (33ms). 
      // Rendering Markdown/MathJax is expensive. Doing it 60fps (16ms) freezes the UI.
      const MIN_RENDER_INTERVAL = 32; 
      
      if (timestamp - lastUpdateRef.current < MIN_RENDER_INTERVAL) {
          rafRef.current = requestAnimationFrame(loop);
          return;
      }

      // --- ADAPTIVE SPEED CALCULATION ---
      const remainingChars = targetLen - currentLength.current;
      
      // Base speed: Minimum characters to add per frame (e.g., 2 chars per 33ms = ~60 chars/sec)
      let charsToAdd = 2;

      // Acceleration: The further behind we are, the faster we type.
      // This ensures we never lag behind the AI stream indefinitely.
      if (remainingChars > 1500) charsToAdd = 150;      // Instant catch-up for massive blocks
      else if (remainingChars > 500) charsToAdd = 50;   // Very fast for code blocks
      else if (remainingChars > 100) charsToAdd = 15;   // Fast reading speed
      else if (remainingChars > 50) charsToAdd = 5;     // Natural typing speed
      else if (remainingChars > 20) charsToAdd = 3;     // Deceleration

      currentLength.current += charsToAdd;
      
      // Clamp to prevent overshooting
      if (currentLength.current > targetLen) currentLength.current = targetLen;

      // Slicing string is fast; React re-rendering the Markdown component is slow.
      // By throttling the setDisplayedText call above, we solved the lag.
      setDisplayedText(targetTextRef.current.slice(0, currentLength.current));
      
      lastUpdateRef.current = timestamp;
      rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
      return () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
  }, []);

  return displayedText;
};

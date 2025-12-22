
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A hook that progressively reveals text to simulate a typewriter effect.
 * It catches up dynamically if the target text grows significantly faster than the typing speed.
 */
export const useTypewriter = (targetText: string, isThinking: boolean) => {
  // Initialize state. If not thinking (e.g. loading history), show full text immediately.
  const [displayedText, setDisplayedText] = useState(() => isThinking ? '' : targetText);
  
  // Refs for mutable state across frames
  const currentLength = useRef(isThinking ? 0 : targetText.length);
  const targetTextRef = useRef(targetText);
  const rafId = useRef<number | null>(null);
  const isLoopRunning = useRef(false);

  // Sync the latest prop to the ref
  useEffect(() => {
    targetTextRef.current = targetText;
    
    // If not thinking anymore, we must ensure we show the full text immediately
    // to prevent getting stuck in a partial state if the stream ends abruptly.
    if (!isThinking) {
        if (rafId.current) cancelAnimationFrame(rafId.current);
        isLoopRunning.current = false;
        currentLength.current = targetText.length;
        setDisplayedText(targetText);
        return;
    }

    // If the new text is shorter (e.g., reset/regenerate), snap immediately to valid range
    if (targetText.length < currentLength.current) {
        currentLength.current = targetText.length;
        setDisplayedText(targetText);
    }
    
    // Ensure loop is running if there is work to do
    if (!isLoopRunning.current && currentLength.current < targetText.length) {
        startLoop();
    }
  }, [targetText, isThinking]);

  const startLoop = useCallback(() => {
      isLoopRunning.current = true;
      rafId.current = requestAnimationFrame(animate);
  }, []);

  const animate = useCallback(() => {
      // Calculate target length from ref
      const targetLen = targetTextRef.current.length;

      // If fully caught up, stop the loop to save resources
      if (currentLength.current >= targetLen) {
          isLoopRunning.current = false;
          rafId.current = null;
          // Ensure exact match at the end
          if (displayedText !== targetTextRef.current) {
             setDisplayedText(targetTextRef.current);
          }
          return;
      }

      // Dynamic Velocity Calculation
      const distance = targetLen - currentLength.current;
      let jump = 1;
      
      // Adaptive speed curve
      // For very small updates (streaming char by char), stick to 1-2 chars per frame for smoothness.
      // For large dumps (markdown blocks), speed up significantly.
      if (distance > 500) jump = 25;
      else if (distance > 200) jump = 15;
      else if (distance > 100) jump = 8;
      else if (distance > 50) jump = 4;
      else if (distance > 10) jump = 2;

      // Apply jump
      currentLength.current += jump;
      
      // Clamp
      if (currentLength.current > targetLen) currentLength.current = targetLen;

      // Update State (Trigger Render)
      setDisplayedText(targetTextRef.current.slice(0, currentLength.current));
      
      // Schedule next frame
      rafId.current = requestAnimationFrame(animate);
  }, [displayedText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      isLoopRunning.current = false;
    };
  }, []);

  return displayedText;
};

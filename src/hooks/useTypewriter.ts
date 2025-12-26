
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A hook that progressively reveals text to simulate a typewriter effect.
 * It catches up dynamically if the target text grows significantly faster than the typing speed.
 * 
 * OPTIMIZED: Uses a setTimeout loop at ~16ms (60fps) instead of requestAnimationFrame.
 * This ensures visually smooth updates while preventing the UI thread from locking up
 * on high-refresh rate monitors or during intensive rendering.
 */
export const useTypewriter = (targetText: string, isThinking: boolean) => {
  // Initialize state. If not thinking (e.g. loading history), show full text immediately.
  const [displayedText, setDisplayedText] = useState(() => isThinking ? '' : targetText);
  
  // Refs for mutable state across frames without triggering re-renders
  const currentLength = useRef(isThinking ? 0 : targetText.length);
  const targetTextRef = useRef(targetText);
  const timeoutId = useRef<any>(null);
  const isLoopRunning = useRef(false);

  // Sync the latest prop to the ref
  useEffect(() => {
    targetTextRef.current = targetText;
    
    // If the new text is shorter (e.g., reset/regenerate), snap immediately to valid range
    if (targetText.length < currentLength.current) {
        currentLength.current = targetText.length;
        setDisplayedText(targetText);
    }
    
    // Ensure loop is running if there is work to do
    if (!isLoopRunning.current && currentLength.current < targetText.length) {
        startLoop();
    }
  }, [targetText]);

  const startLoop = useCallback(() => {
      isLoopRunning.current = true;
      animate();
  }, []);

  const animate = useCallback(() => {
      // Calculate target length from ref
      const targetLen = targetTextRef.current.length;

      // If fully caught up, stop the loop to save resources
      if (currentLength.current >= targetLen) {
          isLoopRunning.current = false;
          timeoutId.current = null;
          return;
      }

      // Dynamic Velocity Calculation
      // The further behind we are, the faster we type to catch up.
      const distance = targetLen - currentLength.current;
      let jump = 1;
      
      // Adaptive speed curve for 60fps (updates every ~16ms)
      // More aggressive catch-up logic to maintain high speed until the very end
      if (distance > 400) jump = 40;      // Instant catch-up for massive dumps
      else if (distance > 150) jump = 15; // Very fast
      else if (distance > 50) jump = 8;   // Fast catch-up
      else if (distance > 15) jump = 4;   // Moderate speed
      else jump = 2;                      // Minimum cruising speed (doubled from 1)

      // Apply jump
      currentLength.current += jump;
      
      // Clamp
      if (currentLength.current > targetLen) currentLength.current = targetLen;

      // Update State (Trigger Render)
      setDisplayedText(targetTextRef.current.slice(0, currentLength.current));

      // PERFORMANCE OPTIMIZATION:
      // If the content contains heavy rendering elements like tables or math blocks,
      // we slow down the refresh rate slightly to allow the browser to paint properly
      // and prevent the "stuck" feeling caused by main thread blocking.
      const hasComplexMarkdown = targetTextRef.current.includes('|') || 
                                 targetTextRef.current.includes('```') || 
                                 targetTextRef.current.includes('$$');
                                 
      const delay = hasComplexMarkdown ? 32 : 16; // 30fps for complex, 60fps for simple

      // Schedule next frame.
      timeoutId.current = setTimeout(animate, delay);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      isLoopRunning.current = false;
    };
  }, []);

  return displayedText;
};

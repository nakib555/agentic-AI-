
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A hook that progressively reveals text to simulate a typewriter effect.
 * It catches up dynamically if the target text grows significantly faster than the typing speed.
 * 
 * OPTIMIZED: Uses a setTimeout loop instead of requestAnimationFrame to throttle updates
 * to a reasonable framerate (e.g. 30fps). This significantly reduces CPU usage and
 * re-renders on high-refresh rate monitors (120Hz+) during heavy text streaming.
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
      
      // Adaptive speed curve
      if (distance > 200) jump = 15;       // Ultra fast catch-up
      else if (distance > 100) jump = 8;   // Fast
      else if (distance > 50) jump = 4;    // Medium
      else if (distance > 20) jump = 2;    // Cruising

      // Apply jump
      currentLength.current += jump;
      
      // Clamp
      if (currentLength.current > targetLen) currentLength.current = targetLen;

      // Update State (Trigger Render)
      setDisplayedText(targetTextRef.current.slice(0, currentLength.current));

      // Schedule next frame. 33ms is roughly 30fps, which is visually smooth enough for text
      // but far less expensive than 60fps or 144fps.
      timeoutId.current = setTimeout(animate, 33);
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


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A hook that progressively reveals text to simulate a typewriter effect.
 * It uses requestAnimationFrame for smooth visuals but throttles state updates
 * to avoid overloading the React renderer during heavy markdown processing.
 */
export const useTypewriter = (targetText: string, isThinking: boolean) => {
  // If we are not thinking (e.g. history load), show text immediately
  const [displayedText, setDisplayedText] = useState(() => isThinking ? '' : targetText);
  
  const currentLength = useRef(isThinking ? 0 : targetText.length);
  const targetTextRef = useRef(targetText);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    targetTextRef.current = targetText;
    
    // If target text shrinks (e.g. regeneration), snap to it immediately
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
      
      if (currentLength.current >= targetLen) {
          rafRef.current = null;
          return;
      }

      // Throttle frame rate for heavy text rendering (Markdown/MathJax).
      // 60fps (16ms) leaves no time for the main thread to render complex components.
      // 30fps (33ms) is visually smooth for text but gives the browser 2x time to work.
      const interval = 33; 
      
      if (timestamp - lastUpdateRef.current < interval) {
          rafRef.current = requestAnimationFrame(loop);
          return;
      }

      // Dynamic Speed Calculation (Catch-up logic)
      // The further behind we are, the larger the jump to ensure we don't fall behind the stream forever.
      const distance = targetLen - currentLength.current;
      let jump = 1;
      
      if (distance > 3000) jump = 250;     // Critical catch-up
      else if (distance > 1000) jump = 100;
      else if (distance > 500) jump = 50;
      else if (distance > 200) jump = 25;
      else if (distance > 100) jump = 10;
      else if (distance > 50) jump = 5;
      else if (distance > 15) jump = 2;

      currentLength.current += jump;
      
      // Clamp
      if (currentLength.current > targetLen) currentLength.current = targetLen;

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

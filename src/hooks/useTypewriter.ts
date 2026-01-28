/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A hook that progressively reveals text to simulate a typewriter effect.
 */
export const useTypewriter = (targetText: string, isThinking: boolean) => {
  const [displayedText, setDisplayedText] = useState(() => isThinking ? '' : targetText);
  
  const currentLength = useRef(isThinking ? 0 : targetText.length);
  const targetTextRef = useRef(targetText);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const prevIsThinking = useRef(isThinking);

  const loop = useCallback((timestamp: number) => {
      const targetLen = targetTextRef.current.length;
      
      if (currentLength.current >= targetLen) {
          rafRef.current = null;
          return;
      }

      // Adaptive throttle based on content length to maintain 60fps
      let minRenderInterval = 16; // ~60fps default
      
      if (targetLen > 10000) {
          minRenderInterval = 100; // Throttle hard for massive chunks
      } else if (targetLen > 2000) {
          minRenderInterval = 48; // ~20fps for large text
      }
      
      if (timestamp - lastUpdateRef.current < minRenderInterval) {
          rafRef.current = requestAnimationFrame(loop);
          return;
      }

      const remainingChars = targetLen - currentLength.current;
      let charsToAdd = 1;

      // Accelerated catch-up for deep buffers
      if (remainingChars > 5000) charsToAdd = 1000;
      else if (remainingChars > 1000) charsToAdd = 200;
      else if (remainingChars > 500) charsToAdd = 50;
      else if (remainingChars > 100) charsToAdd = 15;
      else if (remainingChars > 20) charsToAdd = 5;
      else charsToAdd = 2;

      currentLength.current = Math.min(currentLength.current + charsToAdd, targetLen);
      
      setDisplayedText(targetTextRef.current.slice(0, currentLength.current));
      
      lastUpdateRef.current = timestamp;
      rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    targetTextRef.current = targetText;
    
    const wasThinking = prevIsThinking.current;
    prevIsThinking.current = isThinking;

    if (!isThinking) {
        if (wasThinking) {
            if (rafRef.current === null && currentLength.current < targetText.length) {
                rafRef.current = requestAnimationFrame(loop);
            }
            return;
        }

        if (currentLength.current !== targetText.length) {
            currentLength.current = targetText.length;
            setDisplayedText(targetText);
        }
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        return;
    } 
    
    if (targetText.length < currentLength.current) {
        currentLength.current = targetText.length;
        setDisplayedText(targetText);
    }
    
    if (rafRef.current === null && currentLength.current < targetText.length) {
        rafRef.current = requestAnimationFrame(loop);
    }
  }, [targetText, isThinking, loop]);

  useEffect(() => {
      return () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
  }, []);

  return displayedText;
};
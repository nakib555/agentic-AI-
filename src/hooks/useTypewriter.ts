
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
 * 1. It limits React state updates to prevent blocking the main thread.
 *    - Short text: ~30fps (32ms) for smoothness.
 *    - Medium text: ~15fps (64ms) to reduce overhead.
 *    - Long text (>2000 chars): ~10fps (100ms) to prevent freezing during markdown rendering.
 * 2. It calculates how many characters to add based on the remaining queue size.
 *    If the queue is large (AI generated a lot of text), it types faster to catch up.
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
    
    // If not thinking (generation complete or branch switch), snap immediately.
    // This prevents the "re-typing" effect when navigating history or switching versions.
    if (!isThinking) {
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
    
    // If target text shrinks (e.g. regeneration start), snap to it immediately
    if (targetText.length < currentLength.current) {
        currentLength.current = targetText.length;
        setDisplayedText(targetText);
    }
    
    // Ensure loop is running if there is work to do
    if (rafRef.current === null && currentLength.current < targetText.length) {
        rafRef.current = requestAnimationFrame(loop);
    }
  }, [targetText, isThinking]);

  const loop = useCallback((timestamp: number) => {
      const targetLen = targetTextRef.current.length;
      
      // Stop if caught up
      if (currentLength.current >= targetLen) {
          rafRef.current = null;
          return;
      }

      // --- PERFORMANCE THROTTLE ---
      // Dynamic throttling based on content length.
      // Rendering huge markdown/code blocks is expensive (can take > 50ms).
      // We slow down the frame rate for larger content to keep the UI responsive.
      let minRenderInterval = 32; // Default 30fps
      
      if (currentLength.current > 5000) {
          minRenderInterval = 150; // 6fps for massive content to prevent freeze
      } else if (currentLength.current > 2000) {
          minRenderInterval = 100; // 10fps for large content
      } else if (currentLength.current > 500) {
          minRenderInterval = 64; // ~15fps for medium content
      }
      
      if (timestamp - lastUpdateRef.current < minRenderInterval) {
          rafRef.current = requestAnimationFrame(loop);
          return;
      }

      // --- ADAPTIVE SPEED CALCULATION ---
      const remainingChars = targetLen - currentLength.current;
      
      // Base speed: Minimum characters to add per frame
      let charsToAdd = 1;

      // Acceleration: The further behind we are, the faster we type.
      // This is crucial for large code blocks or copy-pastes from backend.
      if (remainingChars > 5000) charsToAdd = 2000;     // Instant catch-up for massive dumps
      else if (remainingChars > 2000) charsToAdd = 500; // Very Fast
      else if (remainingChars > 1000) charsToAdd = 150; // Fast
      else if (remainingChars > 500) charsToAdd = 50;   // Moderate Fast
      else if (remainingChars > 200) charsToAdd = 20;   // Reading speed
      else if (remainingChars > 100) charsToAdd = 10;   // Decent pace
      else if (remainingChars > 50) charsToAdd = 5;     // Natural
      else if (remainingChars > 20) charsToAdd = 3;     // Deceleration

      // Adjust chars to add based on the throttle. 
      // If we throttled to 100ms (approx 3x standard 32ms), we should add 3x chars to maintain perceived speed.
      if (minRenderInterval > 32) {
          charsToAdd = Math.ceil(charsToAdd * (minRenderInterval / 32));
      }

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


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

/**
 * A hook that progressively reveals text to simulate a typewriter effect.
 * It catches up dynamically if the target text grows significantly faster than the typing speed.
 * 
 * OPTIMIZED: Now throttled to ~30fps (32ms) to prevent main thread blocking during
 * heavy markdown/code rendering.
 */
export const useTypewriter = (targetText: string, isThinking: boolean) => {
  // If not thinking (e.g. history load), show full text immediately.
  // If thinking, start empty and animate.
  const [displayedText, setDisplayedText] = useState(() => isThinking ? '' : targetText);
  const index = useRef(isThinking ? 0 : targetText.length);
  const timerRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Target roughly 30fps to balance smoothness with performance
  const FRAME_BUDGET_MS = 32;

  useEffect(() => {
    // If we switched to a completely new message (length dropped), reset.
    if (targetText.length < displayedText.length) {
      index.current = targetText.length;
      setDisplayedText(targetText);
      return;
    }

    const animate = () => {
      const now = performance.now();
      const timeSinceLast = now - lastUpdateRef.current;

      if (index.current < targetText.length) {
        // Only update state if enough time has passed to respect our frame budget
        if (timeSinceLast >= FRAME_BUDGET_MS) {
            // Dynamic speed: If we are far behind, type faster (catch up).
            const distance = targetText.length - index.current;
            
            // Base jump calculation:
            // If distance is small (<20), jump 1-2 chars.
            // If distance is large (>100), jump significantly to avoid falling behind.
            let jump = 1;
            
            if (distance > 100) jump = Math.ceil(distance / 5);
            else if (distance > 50) jump = Math.ceil(distance / 10);
            else if (distance > 10) jump = 2;

            index.current += jump;
            
            // Ensure we don't overshoot
            if (index.current > targetText.length) index.current = targetText.length;
            
            setDisplayedText(targetText.slice(0, index.current));
            lastUpdateRef.current = now;
        }
        
        // Schedule next check
        timerRef.current = window.setTimeout(animate, 10); 
      }
    };

    // If we have more text to show, ensure the loop is running
    if (index.current < targetText.length) {
        // Clear any existing timer to prevent overlaps
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(animate, 10);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [targetText, displayedText]);

  return displayedText;
};

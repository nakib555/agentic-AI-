
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

/**
 * A hook that progressively reveals text to simulate a typewriter effect.
 * It catches up dynamically if the target text grows significantly faster than the typing speed.
 */
export const useTypewriter = (targetText: string, isThinking: boolean) => {
  // If not thinking (e.g. history load), show full text immediately.
  // If thinking, start empty and animate.
  const [displayedText, setDisplayedText] = useState(() => isThinking ? '' : targetText);
  const index = useRef(isThinking ? 0 : targetText.length);
  const frameRef = useRef<number>();

  useEffect(() => {
    // If we switched to a completely new message (length dropped), reset.
    if (targetText.length < displayedText.length) {
      index.current = targetText.length;
      setDisplayedText(targetText);
      return;
    }

    const animate = () => {
      if (index.current < targetText.length) {
        // Dynamic speed: If we are far behind, type faster.
        const distance = targetText.length - index.current;
        // Base speed is 1 char per frame (60fps). 
        // If distance > 20, we jump 2 chars. If > 50, jump 3, etc.
        const jump = Math.max(1, Math.ceil(distance / 10));
        
        index.current += jump;
        
        // Ensure we don't overshoot
        if (index.current > targetText.length) index.current = targetText.length;
        
        setDisplayedText(targetText.slice(0, index.current));
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    if (index.current < targetText.length) {
        frameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [targetText, displayedText]);

  return displayedText;
};


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';

/**
 * A hook that progressively reveals text to simulate a typewriter effect.
 * It catches up dynamically if the target text grows significantly faster than the typing speed.
 * 
 * OPTIMIZED: Uses requestAnimationFrame for 60fps smoothness and time-slicing
 * to prevent main thread blocking during heavy rendering.
 */
export const useTypewriter = (targetText: string, isThinking: boolean) => {
  // If not thinking (e.g. history load), show full text immediately.
  const [displayedText, setDisplayedText] = useState(() => isThinking ? '' : targetText);
  
  // Use a ref to track the current length to avoid closure staleness in the animation loop
  const currentLength = useRef(isThinking ? 0 : targetText.length);
  const targetTextRef = useRef(targetText);
  const rafId = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);

  // Sync ref
  useEffect(() => {
    targetTextRef.current = targetText;
  }, [targetText]);

  useEffect(() => {
    // If we switched to a completely new message (length dropped), reset.
    if (targetText.length < displayedText.length) {
      currentLength.current = targetText.length;
      setDisplayedText(targetText);
      return;
    }

    // If fully caught up, stop.
    if (currentLength.current >= targetText.length) {
        return;
    }

    const animate = (time: number) => {
      // Initialize start time
      if (lastFrameTime.current === 0) lastFrameTime.current = time;
      
      const delta = time - lastFrameTime.current;
      const targetLen = targetTextRef.current.length;

      // Target ~30-60fps. We update every frame, but calculating how many chars to add
      // based on the gap between current and target.
      if (currentLength.current < targetLen) {
        
        // Dynamic Velocity:
        // The further behind we are, the faster we type.
        // If we are 1000 chars behind, type 20 chars per frame.
        // If we are 5 chars behind, type 1 char per frame.
        const distance = targetLen - currentLength.current;
        
        let jump = 1;
        if (distance > 200) jump = 15;
        else if (distance > 100) jump = 8;
        else if (distance > 50) jump = 4;
        else if (distance > 20) jump = 2;

        // Apply jump
        currentLength.current += jump;
        
        // Clamp
        if (currentLength.current > targetLen) currentLength.current = targetLen;

        setDisplayedText(targetTextRef.current.slice(0, currentLength.current));
      }

      lastFrameTime.current = time;
      
      if (currentLength.current < targetLen) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [targetText, displayedText.length]); // Dependency on targetText length change

  return displayedText;
};

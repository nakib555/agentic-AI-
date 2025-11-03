/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

type TypingWrapperProps = {
  fullText: string;
  isAnimating: boolean;
  onComplete?: () => void;
  typingSpeed?: number; // Milliseconds per word/part
  delay?: number; // Milliseconds to wait before starting
  children: (displayedText: string) => React.ReactNode;
};

export const TypingWrapper: React.FC<TypingWrapperProps> = ({
  fullText,
  isAnimating,
  onComplete,
  typingSpeed = 80, // Default to 80ms per word/part
  delay = 0,
  children,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const targetTextRef = useRef(fullText);
  const onCompleteRef = useRef(onComplete);
  const partIndexRef = useRef(0);

  // Keep the onComplete callback ref updated without causing re-renders
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Keep the targetText ref updated with the latest fullText from props
  useEffect(() => {
    targetTextRef.current = fullText;
  }, [fullText]);

  // This effect manages the animation loop itself. It starts/stops based on `isAnimating`.
  useEffect(() => {
    if (!isAnimating) {
      // When animation stops, reset the displayed text and call onComplete.
      setDisplayedText('');
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
      return;
    }
    
    // Start with a clean slate whenever a new animation sequence begins.
    setDisplayedText('');
    partIndexRef.current = 0;

    // Split text into words, punctuation, and whitespace to preserve formatting.
    const parts = targetTextRef.current.match(/[\w']+|[.,!?;:"']+|\s+/g) || [];

    let intervalId: number | undefined;

    const timeoutId = setTimeout(() => {
      intervalId = window.setInterval(() => {
        if (partIndexRef.current < parts.length) {
          // Use functional update to avoid stale state in closure
          setDisplayedText(prev => prev + parts[partIndexRef.current]);
          partIndexRef.current++;
        } else {
          // When all parts are displayed, clear interval and call onComplete
          clearInterval(intervalId!);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
      }, typingSpeed);
    }, delay);


    // Cleanup function to clear the interval when the effect stops.
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAnimating, typingSpeed, delay]);

  return <>{children(displayedText)}</>;
};

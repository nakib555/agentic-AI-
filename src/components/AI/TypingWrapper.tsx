/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

type TypingWrapperProps = {
  fullText: string;
  isAnimating: boolean;
  onComplete?: () => void;
  typingSpeed?: number; // Milliseconds per character
  delay?: number; // Milliseconds to wait before starting
  children: (displayedText: string) => React.ReactNode;
};

export const TypingWrapper: React.FC<TypingWrapperProps> = ({
  fullText,
  isAnimating,
  onComplete,
  typingSpeed = 20, // Increased speed for a more responsive feel
  delay = 0,
  children,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const targetTextRef = useRef(fullText);
  const onCompleteRef = useRef(onComplete);

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

    let intervalId: number | undefined;

    const timeoutId = setTimeout(() => {
      intervalId = window.setInterval(() => {
        setDisplayedText((currentDisplayedText) => {
          const currentTarget = targetTextRef.current;
          if (currentDisplayedText.length < currentTarget.length) {
            // Append one character at a time for a smoother effect
            return currentTarget.substring(0, currentDisplayedText.length + 1);
          }
          
          // When text is complete, clear interval and call onComplete
          clearInterval(intervalId);
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return currentDisplayedText;
        });
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

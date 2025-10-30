/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

type TypingWrapperProps = {
  fullText: string;
  isAnimating: boolean;
  onComplete?: () => void;
  typingSpeed?: number; // Milliseconds per word
  children: (displayedText: string) => React.ReactNode;
};

export const TypingWrapper: React.FC<TypingWrapperProps> = ({
  fullText,
  isAnimating,
  onComplete,
  typingSpeed = 80, // Milliseconds per word
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

    const intervalId = setInterval(() => {
      setDisplayedText((currentDisplayedText) => {
        const currentTarget = targetTextRef.current;
        // If we haven't displayed the full target text yet...
        if (currentDisplayedText.length < currentTarget.length) {
          // Find the next chunk (word and/or space) to append.
          const remainingText = currentTarget.substring(currentDisplayedText.length);
          const match = remainingText.match(/^(\s*\S+)/); // Match leading spaces and the next word.
          const nextChunk = match ? match[0] : remainingText; // Fallback to remaining text if no match.
          return currentDisplayedText + nextChunk;
        }
        
        // If we've caught up, return the text as is. The interval will continue checking
        // in case the targetTextRef is updated with more streaming content.
        return currentDisplayedText;
      });
    }, typingSpeed);

    // Cleanup function to clear the interval when the effect stops.
    return () => clearInterval(intervalId);
  }, [isAnimating, typingSpeed]); // This effect only re-runs when `isAnimating` state changes.

  return <>{children(displayedText)}</>;
};
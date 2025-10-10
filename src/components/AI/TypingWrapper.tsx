/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

type TypingWrapperProps = {
  fullText: string;
  isComplete: boolean;
  startTime?: number;
  typingSpeed?: number;
  children: (displayedText: string) => React.ReactNode;
};

export const TypingWrapper: React.FC<TypingWrapperProps> = ({
    fullText,
    isComplete,
    startTime,
    typingSpeed = 10,
    children
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const prevStartTimeRef = useRef(startTime);

    useEffect(() => {
      // Reset for new messages, identified by a change in startTime
      if (startTime !== undefined && startTime !== prevStartTimeRef.current) {
        setDisplayedText('');
        prevStartTimeRef.current = startTime;
      }
    }, [startTime]);
  
    useEffect(() => {
      if (isComplete) {
        if (displayedText !== fullText) {
          setDisplayedText(fullText);
        }
        return;
      }
  
      if (displayedText.length >= fullText.length) {
        return;
      }
  
      const timeoutId = setTimeout(() => {
        // Append a chunk of text for a smoother, more natural typing feel
        const nextIndex = Math.min(displayedText.length + 5, fullText.length);
        setDisplayedText(fullText.substring(0, nextIndex));
      }, typingSpeed);
  
      return () => clearTimeout(timeoutId);
    }, [displayedText, fullText, isComplete, typingSpeed]);

    return <>{children(displayedText)}</>;
};

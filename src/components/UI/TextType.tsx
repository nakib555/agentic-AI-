/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ElementType, useEffect, useState, createElement, useRef } from 'react';
import { motion } from 'framer-motion';

interface TextTypeProps {
  className?: string;
  showCursor?: boolean;
  cursorCharacter?: string | React.ReactNode;
  cursorBlinkDuration?: number;
  cursorClassName?: string;
  // FIX: Changed prop from 'sequence' to 'text' to match usage and fix error.
  text: string[] | string;
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  onSequenceComplete?: () => void;
}

// Generates a random delay within a range for a more human-like typing feel.
const getTypingDelay = (baseSpeed: number, jitter = 0.4): number => {
  return baseSpeed + (Math.random() - 0.5) * baseSpeed * jitter;
};

export const TextType = ({
  // FIX: Changed prop from 'sequence' to 'text'.
  text,
  as: Component = 'span',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 1500,
  deletingSpeed = 30,
  loop = false,
  className = '',
  showCursor = true,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  onSequenceComplete,
  ...props
}: TextTypeProps & React.HTMLAttributes<HTMLElement>) => {
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [phase, setPhase] = useState<'initial' | 'typing' | 'pausing' | 'deleting'>('initial');

  const timeoutRef = useRef<number | null>(null);
  // FIX: Changed ref name to reflect prop change. Also handle string or array for text.
  const textRef = useRef(Array.isArray(text) ? text : [text]);

  // If the text prop changes externally, reset the animation.
  useEffect(() => {
    const newText = Array.isArray(text) ? text : [text];
    // FIX: Changed ref name to reflect prop change.
    if (textRef.current.join() !== newText.join()) {
      textRef.current = newText;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSequenceIndex(0);
      setPhase('deleting'); // Start by deleting the current text
    }
  }, [text]);

  useEffect(() => {
    const schedule = (fn: () => void, delay: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(fn, delay);
    };

    // FIX: Changed ref name to reflect prop change.
    const currentTarget = textRef.current[sequenceIndex] || '';

    switch (phase) {
      case 'initial':
        schedule(() => setPhase('typing'), initialDelay);
        break;

      case 'typing':
        if (displayedText.length < currentTarget.length) {
          const nextChar = currentTarget[displayedText.length];
          // Add a longer pause after spaces or punctuation for realism
          const isWordEnd = nextChar === ' ' || nextChar === ',' || nextChar === '.';
          const delay = getTypingDelay(isWordEnd ? typingSpeed * 3 : typingSpeed);
          schedule(() => setDisplayedText(d => d + nextChar), delay);
        } else {
          // Finished typing, move to pausing
          setPhase('pausing');
        }
        break;

      case 'deleting':
        if (displayedText.length > 0) {
          const delay = getTypingDelay(deletingSpeed, 0.6);
          schedule(() => setDisplayedText(d => d.slice(0, -1)), delay);
        } else {
          // Finished deleting, move to the next item in the sequence
          const nextIndex = sequenceIndex + 1;
          // FIX: Changed ref name to reflect prop change.
          if (nextIndex < textRef.current.length) {
            setSequenceIndex(nextIndex);
            setPhase('typing');
          } else if (loop) {
            setSequenceIndex(0);
            setPhase('typing');
          } else {
            // Sequence is complete
            onSequenceComplete?.();
          }
        }
        break;

      case 'pausing':
        // FIX: Changed ref name to reflect prop change.
        const isLastItem = sequenceIndex === textRef.current.length - 1;
        if (!isLastItem || loop) {
          schedule(() => setPhase('deleting'), pauseDuration);
        } else {
          // Sequence is complete
          onSequenceComplete?.();
        }
        break;
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    sequenceIndex, displayedText, phase, loop, typingSpeed, deletingSpeed, 
    pauseDuration, initialDelay, onSequenceComplete, text
  ]);

  return createElement(
    Component,
    { className: `inline-block whitespace-pre-wrap ${className}`, ...props },
    <span className="inline">{displayedText}</span>,
    showCursor && (
      <motion.span
        className={`ml-px inline-block ${cursorClassName}`}
        animate={phase === 'pausing' ? { opacity: [1, 0, 1] } : { opacity: 1 }}
        transition={phase === 'pausing' ? { duration: cursorBlinkDuration * 2, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
      >
        {cursorCharacter}
      </motion.span>
    )
  );
};
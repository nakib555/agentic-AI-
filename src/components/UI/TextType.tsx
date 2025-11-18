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
  text: string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  onSequenceComplete?: () => void;
}

export const TextType = ({
  text,
  as: Component = 'span',
  typingSpeed = 70,
  initialDelay = 0,
  pauseDuration = 1500,
  deletingSpeed = 60,
  loop = false,
  className = '',
  showCursor = true,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  onSequenceComplete,
  ...props
}: TextTypeProps & React.HTMLAttributes<HTMLElement>) => {
  const [textIndex, setTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState(text[0] || '');
  const [isDeleting, setIsDeleting] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!text.includes(displayedText)) return;

    if (text.length > 1 && text[1] !== displayedText && !isDeleting) {
      setTextIndex(0);
      setIsDeleting(true);
    } else if (text.length === 1 && text[0] !== displayedText) {
      setDisplayedText(text[0]);
    }
  }, [text]);

  useEffect(() => {
    let timeoutId: number;

    const handleAnimation = () => {
      if (!isMounted.current) return;
      
      setIsPaused(false);
      const sequence = text;
      const currentText = sequence[textIndex];
      
      const speed = isDeleting ? deletingSpeed : typingSpeed;
      const randomDelay = speed + (Math.random() - 0.5) * speed * 0.7;

      if (isDeleting) {
        if (displayedText.length > 0) {
          timeoutId = window.setTimeout(() => setDisplayedText(d => d.slice(0, -1)), randomDelay);
        } else {
          setIsDeleting(false);
          const nextIndex = (textIndex + 1);
          if (nextIndex < sequence.length) {
            setTextIndex(nextIndex);
          } else if (loop) {
            setTextIndex(0);
          }
        }
      } else { // Typing
        const targetText = sequence[textIndex];
        if (displayedText.length < targetText.length) {
          timeoutId = window.setTimeout(() => setDisplayedText(targetText.slice(0, displayedText.length + 1)), randomDelay);
        } else {
          setIsPaused(true);
          const isLast = textIndex === sequence.length - 1;
          if (isLast && !loop) {
            if (onSequenceComplete) onSequenceComplete();
            return;
          }
          timeoutId = window.setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      }
    };
    
    const delay = (isDeleting && textIndex === 0 && displayedText.length === text[0].length) ? initialDelay : 0;
    timeoutId = window.setTimeout(handleAnimation, delay);

    return () => clearTimeout(timeoutId);
  }, [displayedText, isDeleting, textIndex, text, loop, typingSpeed, deletingSpeed, pauseDuration, initialDelay, onSequenceComplete]);

  return createElement(
    Component,
    { className: `inline-block whitespace-pre-wrap ${className}`, ...props },
    <span className="inline">{displayedText}</span>,
    showCursor && (
      <motion.span
        className={`ml-px inline-block ${cursorClassName}`}
        animate={isPaused ? { opacity: [1, 0, 1] } : { opacity: 1 }}
        transition={isPaused ? { duration: cursorBlinkDuration * 2, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
      >
        {cursorCharacter}
      </motion.span>
    )
  );
};
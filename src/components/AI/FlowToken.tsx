/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useEffect } from 'react';

type FlowTokenProps = {
  children: string;
  tps?: number; // tokens per second
  onComplete?: () => void;
};

export const FlowToken: React.FC<FlowTokenProps> = ({
  children,
  tps = 10,
  onComplete,
}) => {
  // Split by words and punctuation, but keep spaces attached to the preceding word
  // This helps maintain correct spacing during animation.
  const parts = useMemo(() => children.match(/(\S+\s*)/g) || [], [children]);

  useEffect(() => {
    if (!onComplete) return;
    
    // Calculate total animation duration based on token count and speed.
    // Add a small buffer to ensure onComplete fires after the last animation.
    const animationDuration = 600; // 0.6s from CSS
    const totalDuration = (parts.length / tps) * 1000 + animationDuration;

    const timer = setTimeout(() => {
      onComplete();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [parts, tps, onComplete]);

  // The delay for each word is staggered based on its index.
  // This creates the word-by-word typing effect.
  const interval = 1000 / tps;

  return (
    <span className="flow-token-container">
      {parts.map((part, i) => (
        <span className="flow-token-word-container" key={i}>
          <span
            className="flow-token-word"
            style={{ animationDelay: `${i * interval}ms` }}
          >
            {part}
          </span>
        </span>
      ))}
    </span>
  );
};
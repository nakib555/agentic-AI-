
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type SkeletonProps = {
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div 
      className={`
        relative overflow-hidden rounded-md 
        bg-slate-200/50 dark:bg-white/5 
        ${className}
      `} 
      aria-hidden="true"
    >
      {/* 
        Animation: "Shining Wave"
        Separating the animation (translateX) from the shape (skew) into parent/child divs.
        Uses a refined gradient for a premium glass-like shimmer effect.
      */}
      <div 
        className="absolute inset-0 -translate-x-full animate-shimmer-wave z-10"
        style={{ willChange: 'transform' }}
      >
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent skew-x-12" />
      </div>
    </div>
  );
};

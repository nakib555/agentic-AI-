
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
        bg-slate-200/80 dark:bg-white/5 
        before:absolute before:inset-0
        before:-translate-x-full
        before:animate-shimmer
        before:bg-gradient-to-r
        before:from-transparent 
        before:via-white/50 dark:before:via-white/10
        before:to-transparent
        ${className}
      `} 
      aria-hidden="true"
    />
  );
};

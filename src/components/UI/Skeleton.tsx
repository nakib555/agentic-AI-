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
        bg-gradient-to-r from-slate-200 via-slate-100/50 to-slate-200 
        dark:from-white/5 dark:via-white/10 dark:to-white/5 
        bg-[length:200%_100%] animate-shimmer
        ${className}
      `} 
      aria-hidden="true"
    />
  );
};
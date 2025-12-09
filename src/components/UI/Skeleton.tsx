/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type SkeletonProps = {
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={`animate-pulse bg-slate-200 dark:bg-white/10 rounded-md ${className}`} 
      aria-hidden="true"
    />
  );
};

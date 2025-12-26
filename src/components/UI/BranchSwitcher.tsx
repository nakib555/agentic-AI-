
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type BranchSwitcherProps = {
  count: number;
  activeIndex: number;
  onChange: (index: number) => void;
  className?: string;
};

export const BranchSwitcher: React.FC<BranchSwitcherProps> = ({ count, activeIndex, onChange, className = '' }) => {
  if (count <= 1) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      onChange(activeIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex < count - 1) {
      onChange(activeIndex + 1);
    }
  };

  return (
    <div className={`flex items-center select-none gap-1 font-mono text-xs font-medium text-slate-500 dark:text-slate-400 ${className}`}>
        <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="p-1 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous version"
            title="Previous version"
        >
            &lt;
        </button>
        
        <span className="tabular-nums tracking-wide min-w-[20px] text-center">
            {activeIndex + 1}/{count}
        </span>

        <button
            onClick={handleNext}
            disabled={activeIndex === count - 1}
            className="p-1 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next version"
            title="Next version"
        >
            &gt;
        </button>
    </div>
  );
};

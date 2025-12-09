/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Skeleton } from '../UI/Skeleton';

export const SettingsSkeleton = () => {
  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="mb-6">
        <Skeleton className="h-7 w-48 mb-3" /> {/* Title */}
        <Skeleton className="h-4 w-72" /> {/* Description */}
      </div>

      {/* Setting Items Mockup */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="py-6 border-b border-slate-200/60 dark:border-white/5 last:border-0">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            {/* Label & Description Column */}
            <div className="flex-1 min-w-[200px] space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full max-w-[280px]" />
            </div>
            
            {/* Control Column */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <Skeleton className="h-10 w-full sm:w-48 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type SettingItemProps = {
    label: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
    layout?: 'row' | 'col';
    wrapControls?: boolean;
};

export const SettingItem: React.FC<SettingItemProps> = ({ 
    label, 
    description, 
    children, 
    className = '', 
    layout = 'row',
    wrapControls = true 
}) => {
    // Explicit column layout (used for things like Image Models that need full width)
    if (layout === 'col') {
        return (
            <div className={`py-6 border-b border-slate-200/60 dark:border-white/5 last:border-0 ${className}`}>
                <div className="flex flex-col gap-4">
                    <div className="flex-1 min-w-0">
                        <label className="text-base font-semibold text-slate-800 dark:text-slate-200 block mb-1">{label}</label>
                        {description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="w-full pt-1">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    // Row layout with responsive wrapping (used for sliders, toggles)
    return (
        <div className={`py-6 border-b border-slate-200/60 dark:border-white/5 last:border-0 ${className}`}>
            {/* 
                wrapControls=true: Use flex-wrap with min-width constraints. Controls drop to bottom when text is cramped.
                wrapControls=false: Use flex-nowrap. Controls stay on the right regardless of text length.
            */}
            <div className={`flex ${wrapControls ? 'flex-wrap' : 'flex-nowrap'} items-center justify-between gap-x-8 gap-y-4`}>
                <div className="flex-1 min-w-[200px] max-w-full">
                    <label className="text-base font-semibold text-slate-800 dark:text-slate-200 block mb-1">{label}</label>
                    {description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
                <div className={`flex-shrink-0 ${wrapControls ? 'w-full sm:w-auto pt-1 sm:pt-0' : ''}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

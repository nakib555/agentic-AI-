
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
    danger?: boolean;
};

export const SettingItem: React.FC<SettingItemProps> = ({ 
    label, 
    description, 
    children, 
    className = '', 
    layout = 'row',
    wrapControls = true,
    danger = false
}) => {
    const containerClasses = `
        relative overflow-hidden
        p-5 rounded-2xl mb-4
        border transition-all duration-200
        ${danger 
            ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' 
            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-white/20'
        }
        ${className}
    `;

    // Explicit column layout (for large inputs like textareas or full-width selects)
    if (layout === 'col') {
        return (
            <div className={containerClasses}>
                <div className="flex flex-col gap-4">
                    <div className="flex-1 min-w-0">
                        <label className={`text-base font-bold block mb-1 ${danger ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-200'}`}>
                            {label}
                        </label>
                        {description && (
                            <p className={`text-sm leading-relaxed ${danger ? 'text-red-600/80 dark:text-red-400/80' : 'text-slate-500 dark:text-slate-400'}`}>
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

    // Row layout with smart wrapping (responsive)
    return (
        <div className={containerClasses}>
            <div className={`flex ${wrapControls ? 'flex-wrap' : 'flex-nowrap'} items-center justify-between gap-x-8 gap-y-4`}>
                <div className="flex-1 min-w-[200px] max-w-full">
                    <label className={`text-base font-bold block mb-1 ${danger ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {label}
                    </label>
                    {description && (
                        <p className={`text-sm leading-relaxed ${danger ? 'text-red-600/80 dark:text-red-400/80' : 'text-slate-500 dark:text-slate-400'}`}>
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

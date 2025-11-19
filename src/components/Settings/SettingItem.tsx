
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
};

export const SettingItem: React.FC<SettingItemProps> = ({ label, description, children, className = '', layout = 'row' }) => {
    return (
        <div className={`py-6 border-b border-slate-200/60 dark:border-white/5 last:border-0 ${className}`}>
            <div className={`flex ${layout === 'row' ? 'flex-row items-start md:items-center justify-between gap-4' : 'flex-col gap-4'}`}>
                <div className="flex-1 min-w-0 pr-4">
                    <label className="text-base font-semibold text-slate-800 dark:text-slate-200 block mb-1">{label}</label>
                    {description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
                <div className={`flex-shrink-0 ${layout === 'row' ? '' : 'w-full pt-1'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

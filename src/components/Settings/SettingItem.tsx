
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
        <div className={`py-4 border-b border-border last:border-0 ${className}`}>
            <div className={`flex ${layout === 'row' ? 'flex-row items-center justify-between gap-4' : 'flex-col gap-3'}`}>
                <div className="flex-1 min-w-0">
                    <label className="text-base font-medium text-content-primary block">{label}</label>
                    {description && (
                        <p className="text-sm text-content-secondary mt-0.5 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
                <div className={`flex-shrink-0 ${layout === 'row' ? '' : 'w-full'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

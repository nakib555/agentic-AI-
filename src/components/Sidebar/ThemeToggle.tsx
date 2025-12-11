
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
import type { Theme } from '../../hooks/useTheme';

const motion = motionTyped as any;

export const ThemeToggle = ({ theme, setTheme, isCollapsed, isDesktop }: { theme: Theme, setTheme: (theme: Theme) => void, isCollapsed: boolean, isDesktop: boolean }) => {
    const buttons = [
        { value: 'light', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>, label: 'Light' },
        { value: 'dark', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>, label: 'Dark' },
        { value: 'spocke', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>, label: 'Spocke' },
        { value: 'system', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>, label: 'Auto' },
    ];

    const shouldCollapse = isDesktop && isCollapsed;

    // Clean segmented control style instead of gradient
    const containerClasses = `relative p-1 rounded-xl flex items-center bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/5`;
    const layoutClasses = shouldCollapse ? `flex-col gap-1 w-full ${containerClasses}` : `justify-between gap-1 w-full ${containerClasses}`;

    return (
        <div className={layoutClasses}>
            {buttons.map(btn => {
                const isActive = theme === btn.value;
                return (
                    <button
                        key={btn.value}
                        onClick={() => setTheme(btn.value as Theme)}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-lg text-xs font-medium transition-all duration-200 focus:outline-none ${shouldCollapse ? 'h-9 w-full p-0' : 'py-1.5 px-2 h-8'}`}
                        title={shouldCollapse ? btn.label : undefined}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="theme-pill"
                                className="absolute inset-0 bg-white dark:bg-gray-700 shadow-sm rounded-lg border border-gray-200/50 dark:border-white/10"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                            {btn.icon}
                            {!shouldCollapse && <span className="hidden sm:inline">{btn.label}</span>}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

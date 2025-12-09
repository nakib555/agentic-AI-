
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
        { value: 'system', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>, label: 'System' },
    ];

    const shouldCollapse = isDesktop && isCollapsed;

    // Vibrant purple gradient background
    const containerClasses = `relative p-1 rounded-full flex items-center bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg border border-white/10`;
    const layoutClasses = shouldCollapse ? `flex-col gap-2 ${containerClasses}` : `justify-between ${containerClasses}`;

    return (
        <div className={layoutClasses}>
            {buttons.map(btn => {
                const isActive = theme === btn.value;
                return (
                    <button
                        key={btn.value}
                        onClick={() => setTheme(btn.value as Theme)}
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 rounded-full text-xs font-medium transition-all duration-300 focus:outline-none ${shouldCollapse ? 'h-8 w-8 p-0' : 'py-1.5 px-3'}`}
                        title={shouldCollapse ? btn.label : undefined}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="theme-pill"
                                className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-full shadow-sm border border-white/20"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className={`relative z-10 flex items-center gap-2 ${isActive ? 'text-white font-bold' : 'text-white/80 hover:text-white'}`}>
                            {btn.icon}
                            {!shouldCollapse && <span>{btn.label}</span>}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

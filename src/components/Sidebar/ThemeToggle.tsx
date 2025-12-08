
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
        { value: 'light', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>, label: 'Light' },
        { value: 'dark', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>, label: 'Dark' },
        { value: 'system', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>, label: 'System' },
    ];

    const shouldCollapse = isDesktop && isCollapsed;

    const containerClasses = `relative p-1 rounded-full flex items-center bg-violet-900/50 dark:bg-black/40 border border-white/10 shadow-inner shadow-black/50`;
    const layoutClasses = shouldCollapse ? `flex-col gap-1 ${containerClasses}` : `justify-between ${containerClasses}`;

    return (
        <div className={layoutClasses} style={{ transformStyle: 'preserve-3d', perspective: '800px' }}>
            {buttons.map(btn => {
                const isActive = theme === btn.value;
                return (
                    <motion.div
                        key={btn.value}
                        className="relative group flex-1"
                        whileHover={{ z: 5 }}
                    >
                        <button
                            onClick={() => setTheme(btn.value as Theme)}
                            className={`relative w-full flex items-center justify-center rounded-full text-sm transition-colors z-10 focus:outline-none focus-visible:ring-2 ring-purple-400 ${shouldCollapse ? 'h-9 w-9' : 'px-3 py-1.5'}`}
                            style={{ transform: 'translateZ(0)' }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="theme-knob"
                                    className="absolute inset-0 rounded-full border border-white/20 shadow-lg shadow-purple-500/50 flex items-center justify-center"
                                    style={{
                                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(120,80,220,0.5) 60%, transparent 100%)',
                                    }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                />
                            )}
                            
                            <div className="relative z-10 flex items-center gap-2">
                                <motion.div
                                    className="transition-colors"
                                    animate={{ color: isActive ? '#fff' : '#d8b4fe' }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {btn.icon}
                                </motion.div>
                                <motion.span
                                    className="overflow-hidden font-semibold"
                                    initial={false}
                                    animate={{ 
                                        width: shouldCollapse ? 0 : 'auto', 
                                        opacity: shouldCollapse ? 0 : 1,
                                        marginLeft: shouldCollapse ? 0 : '0.1rem'
                                    }}
                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                >
                                    <motion.span
                                        className="transition-colors"
                                        animate={{ color: isActive ? '#fff' : '#d8b4fe' }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {btn.label}
                                    </motion.span>
                                </motion.span>
                            </div>
                        </button>

                        {shouldCollapse && (
                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white dark:bg-[#2D2D2D] text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-md shadow-lg border border-gray-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                {btn.label}
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};

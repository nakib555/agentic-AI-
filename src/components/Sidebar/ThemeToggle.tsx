
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
        { value: 'light', icon: <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"><path d="M12,18.09A6.09,6.09,0,1,1,18.09,12,6.1,6.1,0,0,1,12,18.09ZM12,6.91A5.09,5.09,0,1,0,17.09,12,5.1,5.1,0,0,0,12,6.91Z"></path><path d="M11.5,2.568v1.6a.5.5,0,1,0,1,0v-1.6a.5.5,0,1,0-1,0Z"></path><path d="M12.5,21.432v-1.6a.5.5,0,0,0-1,0v1.6a.5.5,0,1,0,1,0Z"></path><path d="M21.432,11.5h-1.6a.5.5,0,0,0,0,1h1.6a.5.5,0,1,0,0-1Z"></path><path d="M2.568,12.5h1.6a.5.5,0,1,0,0-1h-1.6a.5.5,0,1,0,0,1Z"></path><path d="M18.316,4.977l-.992.992-.141.141a.514.514,0,0,0-.146.353.508.508,0,0,0,.146.354.5.5,0,0,0,.354.146.515.515,0,0,0,.353-.146l.992-.992.141-.141a.515.515,0,0,0,.147-.354.508.508,0,0,0-.147-.353.5.5,0,0,0-.353-.147.522.522,0,0,0-.354.147Z"></path><path d="M5.684,19.023l.992-.992.141-.141a.514.514,0,0,0,.146-.353.508.508,0,0,0-.146-.354.5.5,0,0,0-.354-.146.515.515,0,0,0-.353.146l-.992.992-.141.141a.515.515,0,0,0-.147.354.508.508,0,0,0,.147.353.5.5,0,0,0,.353.147.522.522,0,0,0,.354-.147Z"></path><path d="M19.023,18.316l-.992-.992-.141-.141a.514.514,0,0,0-.353-.146.508.508,0,0,0-.354.146.5.5,0,0,0-.146.354.515.515,0,0,0,.146.353l.992.992.141.141a.515.515,0,0,0,.354.147.508.508,0,0,0,.353-.147.5.5,0,0,0-.147-.353.522.522,0,0,0-.147-.354Z"></path><path d="M4.977,5.684l.992.992.141.141a.514.514,0,0,0,.353.146.508.508,0,0,0-.354-.146.5.5,0,0,0-.146-.354.515.515,0,0,0-.146-.353l-.992-.992-.141-.141A.515.515,0,0,0,5.33,4.83a.508.508,0,0,0-.353.147.5.5,0,0,0-.147.353.522.522,0,0,0,.147.354Z"></path></svg>, label: 'Light' },
        { value: 'dark', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>, label: 'Dark' },
        { value: 'system', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" /></svg>, label: 'System' },
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

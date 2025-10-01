/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { Theme } from '../../hooks/useTheme';

export const ThemeToggle = ({ theme, setTheme, isCollapsed }: { theme: Theme, setTheme: (theme: Theme) => void, isCollapsed: boolean }) => {
    const buttons = [
        { value: 'light', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.95-4.243-1.591 1.591M5.25 12H3m4.243-4.95L6.343 5.636m4.95-1.386L12 6.343" /></svg>, label: 'Light' },
        { value: 'dark', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>, label: 'Dark' },
        { value: 'system', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z" /></svg>, label: 'System' },
    ];

    return (
        <div className={`p-1 rounded-lg bg-slate-200/60 dark:bg-slate-700/50 flex transition-all ${isCollapsed ? 'flex-col gap-1' : 'justify-between'}`}>
            {buttons.map(btn => (
                <button
                    key={btn.value}
                    onClick={() => setTheme(btn.value as Theme)}
                    className={`flex-1 flex items-center justify-center gap-2 p-1.5 rounded-md text-sm transition-colors ${theme === btn.value ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'}`}
                    aria-label={`Set theme to ${btn.label}`}
                >
                    {btn.icon}
                    <motion.span
                        initial={false}
                        animate={{ width: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1, marginLeft: isCollapsed ? 0 : '0' }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden whitespace-nowrap"
                    >
                      {!isCollapsed && btn.label}
                    </motion.span>
                </button>
            ))}
        </div>
    );
};
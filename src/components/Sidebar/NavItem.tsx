/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

type NavItemProps = { 
    icon: React.ReactNode;
    text: string;
    active?: boolean;
    isCollapsed: boolean;
    isDesktop: boolean;
    onClick: () => void;
    disabled?: boolean;
};

export const NavItem = ({ icon, text, active, isCollapsed, isDesktop, onClick, disabled }: NavItemProps) => {
    const shouldCollapse = isDesktop && isCollapsed;
    return (
        <div className="relative group">
            <button 
                onClick={onClick} 
                disabled={disabled}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left text-sm ${
                    active 
                        ? 'bg-violet-100 text-slate-900 font-semibold dark:bg-violet-900/40 dark:text-slate-50' 
                        : 'text-slate-600 hover:bg-violet-100/60 dark:text-slate-300 dark:hover:bg-violet-900/30 dark:hover:text-slate-100'
                } ${
                    shouldCollapse ? 'justify-center' : ''
                } ${
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
                <div className="flex-shrink-0 w-5 h-5">{icon}</div>
                <motion.span 
                    className="overflow-hidden"
                    initial={false}
                    animate={{ width: shouldCollapse ? 0 : 'auto', opacity: shouldCollapse ? 0 : 1, x: shouldCollapse ? -5 : 0 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                >
                    {text}
                </motion.span>
            </button>
            {shouldCollapse && !disabled && (
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white dark:bg-[#2D2D2D] text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-md shadow-lg border border-gray-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {text}
                </div>
            )}
        </div>
    );
};
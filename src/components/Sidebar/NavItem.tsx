/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';

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
    
    const baseClasses = `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all duration-200`;
    
    const activeClasses = `bg-gray-200/60 dark:bg-violet-900/60 shadow-inner text-slate-900 font-semibold dark:text-slate-50`;
    const inactiveClasses = `bg-gray-100/30 dark:bg-violet-900/20 text-slate-600 dark:text-slate-300 shadow-sm border border-gray-200/50 dark:border-white/10`;
    const hoverClasses = `hover:shadow-md hover:border-gray-300/80 dark:hover:border-white/20 hover:bg-gray-100/80 dark:hover:bg-violet-900/40`;

    const disabledClasses = `opacity-50 cursor-not-allowed`;
    const layoutClasses = shouldCollapse ? 'justify-center' : '';

    return (
        <div className="relative group" style={{ perspective: '800px' }}>
            <motion.button 
                onClick={onClick} 
                disabled={disabled}
                className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${layoutClasses} ${disabled ? disabledClasses : hoverClasses}`}
                whileHover={!disabled ? { scale: 1.03, y: -2, z: 5 } : {}}
                whileTap={!disabled ? { scale: 0.97, y: 1, z: -5 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                style={{ transformStyle: 'preserve-3d' }}
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
            </motion.button>
            {shouldCollapse && !disabled && (
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white dark:bg-[#2D2D2D] text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-md shadow-lg border border-gray-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {text}
                </div>
            )}
        </div>
    );
};
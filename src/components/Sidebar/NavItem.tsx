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
    onClick: () => void;
    disabled?: boolean;
};

export const NavItem = ({ icon, text, active, isCollapsed, onClick, disabled }: NavItemProps) => (
    <div className="relative group">
        <button 
            onClick={onClick} 
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                active 
                    ? 'bg-black/10 text-slate-900 font-semibold dark:bg-white/10 dark:text-slate-50' 
                    : 'text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-slate-100'
            } ${
                isCollapsed ? 'justify-center' : ''
            } ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
            <div className="flex-shrink-0 w-5 h-5">{icon}</div>
            <motion.span 
                className="whitespace-nowrap overflow-hidden"
                initial={false}
                animate={{ width: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -5 : 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
                {text}
            </motion.span>
        </button>
        {isCollapsed && !disabled && (
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white dark:bg-[#2D2D2D] text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-md shadow-lg border border-gray-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {text}
            </div>
        )}
    </div>
);
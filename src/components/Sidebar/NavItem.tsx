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
};

export const NavItem = ({ icon, text, active, isCollapsed, onClick }: NavItemProps) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${active ? 'bg-slate-200 text-slate-900 font-semibold dark:bg-slate-900 dark:text-slate-50' : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-700/60'} ${isCollapsed ? 'justify-center' : ''}`}>
        {icon}
        <motion.span 
            className="whitespace-nowrap overflow-hidden"
            initial={false}
            animate={{ width: isCollapsed ? 0 : 'auto', opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
            {text}
        </motion.span>
    </button>
);

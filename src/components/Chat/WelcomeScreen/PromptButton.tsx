
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

export type PromptColor = 'violet' | 'rose' | 'fuchsia' | 'emerald' | 'amber' | 'blue' | 'indigo' | 'teal' | 'cyan' | 'slate';

export type PromptButtonProps = {
    icon: string;
    text: string;
    onClick: () => void;
    color?: PromptColor;
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
};

const colorStyles: Record<PromptColor, string> = {
    // Mobile: Neutral with border | Desktop: Colorful background
    violet: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-violet-50 md:text-violet-700 md:hover:bg-violet-100 md:dark:bg-violet-900/20 md:dark:text-violet-300 md:dark:hover:bg-violet-900/30",
    
    rose: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-rose-50 md:text-rose-700 md:hover:bg-rose-100 md:dark:bg-rose-900/20 md:dark:text-rose-300 md:dark:hover:bg-rose-900/30",
    
    fuchsia: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-fuchsia-50 md:text-fuchsia-700 md:hover:bg-fuchsia-100 md:dark:bg-fuchsia-900/20 md:dark:text-fuchsia-300 md:dark:hover:bg-fuchsia-900/30",
    
    emerald: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-emerald-50 md:text-emerald-700 md:hover:bg-emerald-100 md:dark:bg-emerald-900/20 md:dark:text-emerald-300 md:dark:hover:bg-emerald-900/30",
    
    amber: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-amber-50 md:text-amber-700 md:hover:bg-amber-100 md:dark:bg-amber-900/20 md:dark:text-amber-300 md:dark:hover:bg-amber-900/30",
    
    blue: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-blue-50 md:text-blue-700 md:hover:bg-blue-100 md:dark:bg-blue-900/20 md:dark:text-blue-300 md:dark:hover:bg-blue-900/30",
    
    indigo: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-indigo-50 md:text-indigo-700 md:hover:bg-indigo-100 md:dark:bg-indigo-900/20 md:dark:text-indigo-300 md:dark:hover:bg-indigo-900/30",
    
    teal: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-teal-50 md:text-teal-700 md:hover:bg-teal-100 md:dark:bg-teal-900/20 md:dark:text-teal-300 md:dark:hover:bg-teal-900/30",
    
    cyan: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-cyan-50 md:text-cyan-700 md:hover:bg-cyan-100 md:dark:bg-cyan-900/20 md:dark:text-cyan-300 md:dark:hover:bg-cyan-900/30",
    
    slate: "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 md:border-transparent md:bg-white/60 md:text-slate-600 md:hover:bg-white/80 md:dark:bg-white/5 md:dark:text-slate-300 md:dark:hover:bg-white/10"
};

export const PromptButton: React.FC<PromptButtonProps> = ({ icon, text, onClick, color = 'slate' }) => {
    const colorClasses = colorStyles[color] || colorStyles.slate;

    return (
        <motion.button
            type="button"
            onClick={onClick}
            className={`
                group flex items-center justify-center gap-2 px-5 py-2 rounded-full shadow-sm transition-all duration-300
                ${colorClasses}
                hover:shadow-md hover:-translate-y-0.5
            `}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className="text-lg filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{icon}</span>
            <span className="text-sm font-semibold tracking-wide whitespace-nowrap">{text}</span>
        </motion.button>
    );
};

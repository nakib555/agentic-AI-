
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
    violet: "bg-violet-50 text-violet-700 border-violet-200 hover:border-violet-300 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700/50 dark:hover:border-violet-500",
    rose: "bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-700/50 dark:hover:border-rose-500",
    fuchsia: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:border-fuchsia-300 dark:bg-fuchsia-900/20 dark:text-fuchsia-300 dark:border-fuchsia-700/50 dark:hover:border-fuchsia-500",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700/50 dark:hover:border-emerald-500",
    amber: "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/50 dark:hover:border-amber-500",
    blue: "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/50 dark:hover:border-blue-500",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-700/50 dark:hover:border-indigo-500",
    teal: "bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-300 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-700/50 dark:hover:border-teal-500",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-700/50 dark:hover:border-cyan-500",
    slate: "bg-white/60 text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-white/5 dark:text-slate-300 dark:border-white/10 dark:hover:border-white/20"
};

export const PromptButton: React.FC<PromptButtonProps> = ({ icon, text, onClick, color = 'slate' }) => {
    const colorClasses = colorStyles[color] || colorStyles.slate;

    return (
        <motion.button
            type="button"
            onClick={onClick}
            className={`
                group flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm backdrop-blur-sm transition-all duration-300
                ${colorClasses}
                hover:shadow-md hover:-translate-y-0.5
            `}
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <span className="text-lg filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{icon}</span>
            <span className="text-sm font-semibold tracking-wide">{text}</span>
        </motion.button>
    );
};


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped } from 'framer-motion';
const motion = motionTyped as any;

type PromptButtonProps = {
    icon: string;
    text: string;
    onClick: () => void;
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
};

export const PromptButton = ({ icon, text, onClick }: PromptButtonProps) => (
    <motion.button
        type="button"
        onClick={onClick}
        className="group flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-white/10 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300"
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
    >
        <span className="text-base filter grayscale group-hover:grayscale-0 transition-all">{icon}</span>
        <span className="text-sm font-medium">{text}</span>
    </motion.button>
);

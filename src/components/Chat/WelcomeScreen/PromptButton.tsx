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
        className="group flex items-center justify-center gap-2.5 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-slate-700 transition-all hover:bg-white/90 dark:border-white/10 dark:bg-black/20 dark:text-slate-300 dark:hover:bg-black/40"
        variants={itemVariants}
        whileHover={{ scale: 1.05, y: -3, boxShadow: "0px 8px 20px rgba(0,0,0,0.08)" }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{text}</span>
    </motion.button>
);
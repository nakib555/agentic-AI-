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
        className="group flex items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-slate-800 backdrop-blur-md transition-all hover:bg-white/20 dark:border-white/10 dark:bg-black/20 dark:text-slate-200 dark:hover:bg-black/30 shadow-md"
        variants={itemVariants}
        whileHover={{ scale: 1.05, y: -3, z: 20, boxShadow: "0px 10px 25px rgba(0,0,0,0.1)" }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{ transformStyle: 'preserve-3d' }}
    >
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{text}</span>
    </motion.button>
);
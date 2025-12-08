
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
    index: number; // Used for staggering animations or generating colors if needed
    colorClass: string; // Tailwind text color class (e.g. text-blue-500)
    bgClass: string; // Tailwind bg color class (e.g. bg-blue-500/10)
    borderClass: string; // Tailwind border color class
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
};

export const PromptButton: React.FC<PromptButtonProps> = ({ icon, text, onClick, index, colorClass, bgClass, borderClass }) => (
    <motion.button
        type="button"
        onClick={onClick}
        className={`
            group flex items-center justify-center gap-2 md:gap-3 
            px-3 py-2 md:px-5 md:py-3 
            bg-white dark:bg-white/5 
            border ${borderClass} dark:border-white/10
            rounded-xl md:rounded-2xl 
            shadow-sm hover:shadow-lg hover:-translate-y-0.5
            transition-all duration-300
            relative overflow-hidden
        `}
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        {/* Hover Background Effect */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${bgClass}`} />

        <span className="text-lg md:text-xl relative z-10">{icon}</span>
        <span className={`text-xs md:text-sm font-medium text-content-primary group-hover:${colorClass} dark:group-hover:text-white transition-colors whitespace-nowrap relative z-10`}>
            {text}
        </span>
    </motion.button>
);

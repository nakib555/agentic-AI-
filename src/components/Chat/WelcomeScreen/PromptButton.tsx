
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
        className="
            group flex items-center justify-center gap-2 md:gap-3 
            px-3 py-2 md:px-5 md:py-3 
            bg-white dark:bg-white/5 
            border border-border-default hover:border-primary-main/30
            rounded-xl md:rounded-2xl 
            shadow-sm hover:shadow-lg hover:shadow-primary-main/5
            transition-all duration-300
        "
        variants={itemVariants}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <span className="text-lg md:text-xl filter grayscale group-hover:grayscale-0 transition-all duration-300">{icon}</span>
        <span className="text-xs md:text-sm font-medium text-content-primary group-hover:text-primary-main transition-colors whitespace-nowrap">{text}</span>
    </motion.button>
);

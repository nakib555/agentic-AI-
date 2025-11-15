/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion as motionTyped, useMotionValue, useTransform } from 'framer-motion';
const motion = motionTyped as any;

type PromptButtonProps = {
    icon: string;
    text: string;
    color: string;
    onClick: () => void;
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
};

export const PromptButton = ({ icon, text, onClick }: PromptButtonProps) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-50, 50], ["10deg", "-10deg"]);
    const rotateY = useTransform(x, [-50, 50], ["-10deg", "10deg"]);

    const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
    <motion.button
        type="button"
        onClick={onClick}
        className="glassmorphic group relative rounded-full px-4 text-slate-700 transition-all"
        style={{
            height: "44px",
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        variants={itemVariants}
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.98, y: -2 }}
        transition={{ type: "spring", stiffness: 350, damping: 15 }}
    >
        <div 
            className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ borderRadius: 'inherit' }}
        />
        <div style={{ transform: "translateZ(10px)" }} className="flex items-center justify-center gap-2">
            <span className="text-lg">{icon}</span>
            <span className="text-sm font-semibold text-[color:var(--text-primary)]">{text}</span>
        </div>
    </motion.button>
);
};
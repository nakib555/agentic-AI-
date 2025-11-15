/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { motion as motionTyped, useMotionValue, useSpring, useTransform } from 'framer-motion';
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

export const PromptButton = ({ icon, text, onClick }: PromptButtonProps) => {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });
    
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            variants={itemVariants}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            style={{
                transformStyle: 'preserve-3d',
                rotateX,
                rotateY,
            }}
            className="glass-morphic group relative flex items-center justify-center gap-2.5 rounded-full px-4 py-2 text-slate-700 transition-all hover:shadow-2xl"
        >
            <span className="text-lg" style={{ transform: 'translateZ(20px)' }}>{icon}</span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200" style={{ transform: 'translateZ(15px)' }}>{text}</span>
            <div className="absolute inset-0 rounded-full bg-white/50 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>
    );
};

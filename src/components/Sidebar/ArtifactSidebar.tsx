
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useLayoutEffect } from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls, useMotionValue, animate } from 'framer-motion';
import { useViewport } from '../../hooks/useViewport';
import { ArtifactContent } from './ArtifactContent';

type ArtifactSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    content: string;
    language: string;
    width: number;
    setWidth: (width: number) => void;
    isResizing: boolean;
    setIsResizing: (isResizing: boolean) => void;
};

export const ArtifactSidebar: React.FC<ArtifactSidebarProps> = React.memo(({ 
    isOpen, onClose, content, language, width, setWidth, isResizing, setIsResizing 
}) => {
    const { isDesktop } = useViewport();
    const dragControls = useDragControls();
    
    // Mobile specific state
    const y = useMotionValue(typeof window !== 'undefined' ? window.innerHeight : 800);

    // Mobile Sheet Logic: Calculate optimal height and animate
    useLayoutEffect(() => {
        if (isDesktop) return;

        const vh = window.innerHeight;
        // Mobile layout constants
        const MAX_H = vh * 0.92; // Taller on mobile for better view
        const MIN_H = vh * 0.5;

        if (isOpen) {
            const targetHeight = MAX_H; 
            const targetY = MAX_H - targetHeight;
            
            animate(y, targetY, { type: "spring", damping: 25, stiffness: 300 });
        } else {
            animate(y, MAX_H, { type: "spring", damping: 25, stiffness: 300 });
        }
    }, [isOpen, isDesktop, y]);

    const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (isDesktop) return;

        const vh = window.innerHeight;
        const MAX_H = vh * 0.92; 
        const MIN_H = vh * 0.5;
        const currentY = y.get();
        const velocityY = info.velocity.y;

        const closingThreshold = MAX_H - (MIN_H / 2);

        if (velocityY > 300 || currentY > closingThreshold) {
            onClose();
        } else if (currentY < (MAX_H - MIN_H) / 2) {
            // Snap to Max
            animate(y, 0, { type: "spring", damping: 30, stiffness: 300 });
        } else {
            // Snap to Min
            animate(y, MAX_H - MIN_H, { type: "spring", damping: 30, stiffness: 300 });
        }
    };

    const startResizingHandler = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
        const handleMouseMove = (e: MouseEvent) => {
            // Invert logic: width depends on distance from right edge
            const newWidth = window.innerWidth - e.clientX;
            // Clamp between 300px and 85% of screen width
            setWidth(Math.max(320, Math.min(newWidth, window.innerWidth * 0.85)));
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [setIsResizing, setWidth]);

    // Mobile Overlay - Only show if open
    if (!isDesktop && !isOpen) return null;

    return (
        <>
            {/* Backdrop for Mobile */}
            <AnimatePresence>
                {!isDesktop && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[60]"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                // Desktop uses width, Mobile uses Y via MotionValue
                animate={isDesktop ? { width: isOpen ? width : 0, x: isOpen ? 0 : '100%' } : undefined} 
                style={!isDesktop ? { y, height: '92vh', maxHeight: '92vh' } : { width }}
                transition={isDesktop ? { 
                    width: { type: isResizing ? 'tween' : 'spring', stiffness: 300, damping: 30 },
                    x: { type: 'spring', stiffness: 300, damping: 30 }
                } : undefined}
                drag={!isDesktop ? "y" : false}
                dragListener={false} // Manual control via drag handle
                dragControls={dragControls}
                dragConstraints={{ top: 0, bottom: (typeof window !== 'undefined' ? window.innerHeight * 0.92 : 800) }}
                dragElastic={{ top: 0, bottom: 0.2 }}
                onDragEnd={onDragEnd}
                className={`
                    flex-shrink-0 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl
                    flex flex-col shadow-[-10px_0_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[-10px_0_40px_-10px_rgba(0,0,0,0.5)]
                    ${isDesktop 
                        ? 'relative h-full z-30 border-l border-gray-200/50 dark:border-white/10' 
                        : 'fixed inset-x-0 bottom-0 z-[70] border-t border-white/20 rounded-t-[20px]'
                    }
                `}
            >
                <div className="flex flex-col h-full overflow-hidden w-full relative">
                    {/* Drag handle for mobile */}
                    {!isDesktop && (
                        <div 
                            className="flex items-center justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none w-full" 
                            onPointerDown={(e) => dragControls.start(e)}
                            aria-hidden="true"
                        >
                            <div className="h-1.5 w-12 bg-gray-300 dark:bg-zinc-700 rounded-full" />
                        </div>
                    )}

                    <ArtifactContent 
                        content={content}
                        language={language}
                        onClose={onClose}
                    />
                </div>

                {/* Resize Handle (Desktop only) */}
                {isDesktop && (
                    <>
                        {/* Invisible large hit area */}
                        <div
                            className="absolute top-0 left-[-8px] h-full z-50 w-4 cursor-col-resize flex justify-center items-center group"
                            onMouseDown={startResizingHandler}
                        >
                            {/* Visible Line Indicator */}
                            <div className={`
                                w-[4px] h-12 rounded-full transition-all duration-300
                                ${isResizing 
                                    ? 'bg-indigo-500 h-full opacity-100 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                                    : 'bg-gray-300 dark:bg-zinc-700 opacity-0 group-hover:opacity-100'
                                }
                            `} />
                        </div>
                        {/* Full height thin border line for visual separation when not resizing */}
                        <div className="absolute top-0 left-0 bottom-0 w-px bg-gray-200/50 dark:bg-white/5 pointer-events-none" />
                    </>
                )}
            </motion.aside>
        </>
    );
});

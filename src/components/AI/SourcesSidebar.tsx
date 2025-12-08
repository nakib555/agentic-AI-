
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Source } from '../../types';
import { useViewport } from '../../hooks/useViewport';
import { SourceItem } from './SourceItem';

type SourcesSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    sources: Source[];
    width: number;
    setWidth: (width: number) => void;
    isResizing: boolean;
    setIsResizing: (isResizing: boolean) => void;
};

export const SourcesSidebar: React.FC<SourcesSidebarProps> = ({ isOpen, onClose, sources, width, setWidth, isResizing, setIsResizing }) => {
    const { isDesktop } = useViewport();

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
        const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
            const newWidth = window.innerWidth - mouseMoveEvent.clientX;
            setWidth(newWidth);
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [setWidth, setIsResizing]);

    const desktopVariants = { open: { width }, closed: { width: 0 } };
    const mobileVariants = { open: { height: '50vh', y: 0 }, closed: { height: 0, y: '100%' } };
    const variants = isDesktop ? desktopVariants : mobileVariants;
    const animateState = isOpen ? 'open' : 'closed';

    return (
        <motion.aside
            initial={false}
            animate={animateState}
            variants={variants}
            transition={{ 
                type: isResizing ? 'tween' : 'spring', 
                duration: isResizing ? 0 : 0.5, 
                stiffness: 260, 
                damping: 25,
                mass: 1
            }}
            className={`flex-shrink-0 overflow-hidden bg-gray-100/70 dark:bg-[#1e1e1e]/70 backdrop-blur-md ${isDesktop ? 'relative border-l border-gray-200 dark:border-white/10' : 'fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 dark:border-white/10'}`}
            role="complementary"
            aria-labelledby="sources-sidebar-title"
            style={{ userSelect: isResizing ? 'none' : 'auto' }}
        >
            <div className="flex flex-col h-full overflow-hidden" style={{ width: isDesktop ? `${width}px` : '100%' }}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                    <h2 id="sources-sidebar-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">Sources</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-black/20" aria-label="Close sources">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {sources && sources.length > 0 ? (
                        <div className="space-y-1">
                            {sources.map((source, index) => <SourceItem key={source.uri + index} source={source} />)}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-slate-400 p-4 text-center">No sources were provided for this response.</div>
                    )}
                </div>
            </div>
            
            {isDesktop && isOpen && (
                <div onMouseDown={startResizing} className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-blue-500/30 transition-colors z-10" title="Resize sidebar" />
            )}
        </motion.aside>
    );
};

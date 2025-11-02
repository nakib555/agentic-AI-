/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
// FIX: Correct the relative import path for types.
import type { Message } from '../../types';
import { ThinkingWorkflow } from '../AI/ThinkingWorkflow';
import { parseMessageText } from '../../utils/messageParser';
import { useViewport } from '../../hooks/useViewport';
import { parseAgenticWorkflow } from '../../services/workflowParser';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { FormattedBlock } from '../Markdown/FormattedBlock';

type ThinkingSidebarProps = {
    isOpen: boolean;
    onClose: () => void;
    message: Message | null;
    sendMessage: (message: string, files?: File[], options?: { isHidden?: boolean; isThinkingModeEnabled?: boolean; }) => void;
    width: number;
    setWidth: (width: number) => void;
    isResizing: boolean;
    setIsResizing: (isResizing: boolean) => void;
    onRegenerate: (messageId: string) => void;
};

// Mobile variants for bottom-up animation
const mobileVariants = {
  open: { height: '50vh', y: 0 },
  closed: { height: 0, y: '100%' },
};

export const ThinkingSidebar: React.FC<ThinkingSidebarProps> = ({ isOpen, onClose, message, sendMessage, width, setWidth, isResizing, setIsResizing, onRegenerate }) => {
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
    
    const { status, statusColor, plan, executionLog } = useMemo(() => {
        if (!message) {
            return { status: 'Idle', statusColor: 'bg-gray-400', plan: '', executionLog: [] };
        }
        const { text, isThinking, error, toolCallEvents } = message;
        const thinkingIsComplete = !isThinking || !!error;
        
        const { plan: parsedPlan, executionLog: parsedLog } = parseAgenticWorkflow(
            parseMessageText(text, !!isThinking, !!error).thinkingText,
            toolCallEvents,
            thinkingIsComplete,
            error
        );

        if (error) {
            return { status: 'Failed', statusColor: 'bg-red-500 dark:bg-red-600', plan: parsedPlan, executionLog: parsedLog };
        }
        if (!isThinking) {
            return { status: 'Completed', statusColor: 'bg-green-500 dark:bg-green-600', plan: parsedPlan, executionLog: parsedLog };
        }
        return { status: 'In Progress', statusColor: 'bg-indigo-500 animate-pulse', plan: parsedPlan, executionLog: parsedLog };
    }, [message]);


    // Desktop variants for side-in animation
    const desktopVariants = {
        open: { width: width },
        closed: { width: 0 },
    };

    const variants = isDesktop ? desktopVariants : mobileVariants;
    const animateState = isOpen ? 'open' : 'closed';

    const thinkingContent = () => {
        if (!message) {
            return (
                <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-slate-400">
                    No thought process to display.
                </div>
            );
        }

        const hasContent = plan || executionLog.length > 0;
        if (!hasContent) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-sm text-gray-500 dark:text-slate-400 p-4 text-center">
                    <p className="mb-4">This message did not involve a complex thought process.</p>
                    {message.error && <ErrorDisplay error={message.error} />}
                </div>
           );
        }

        return (
            <div className="space-y-4 px-4">
                {plan && (
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Mission Briefing
                        </h3>
                        <FormattedBlock content={plan} isStreaming={message.isThinking && executionLog.length === 0} />
                    </div>
                )}
                {executionLog.length > 0 && (
                     <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Execution Log
                        </h3>
                        <ThinkingWorkflow
                            nodes={executionLog}
                            sendMessage={sendMessage}
                            onRegenerate={onRegenerate}
                            messageId={message.id}
                        />
                    </div>
                )}
            </div>
        );
    }


    return (
        <motion.aside
            initial={false}
            animate={animateState}
            variants={variants}
            transition={{
                type: isResizing ? 'tween' : 'spring',
                duration: isResizing ? 0 : undefined,
                stiffness: 500,
                damping: 40,
            }}
            className={`
                flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-[#1e1e1e]
                ${isDesktop 
                    ? 'relative border-l border-gray-200 dark:border-white/10' // Desktop styling
                    : 'fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 dark:border-white/10' // Mobile styling
                }
            `}
            role="complementary"
            aria-labelledby="thinking-sidebar-title"
            style={{ userSelect: isResizing ? 'none' : 'auto' }}
        >
            <div 
                className="flex flex-col h-full overflow-hidden" 
                style={{ width: isDesktop ? `${width}px` : '100%' }}
            >
                {/* Drag handle for mobile (decorative) */}
                {!isDesktop && isOpen && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2.5 h-1.5 w-16 bg-gray-300 dark:bg-slate-600 rounded-full cursor-grab"
                         aria-hidden="true" // Decorative, not interactive
                    ></div>
                )}
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 id="thinking-sidebar-title" className="text-lg font-bold text-gray-800 dark:text-slate-100">Thought Process</h2>
                        <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${statusColor}`}>
                            {status}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200/50 dark:hover:bg-black/20"
                        aria-label="Close thought process"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto py-4 min-h-0">
                    {thinkingContent()}
                </div>
            </div>
            
            {isDesktop && isOpen && (
                <div
                    onMouseDown={startResizing}
                    className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize bg-transparent hover:bg-blue-500/30 transition-colors z-10"
                    title="Resize sidebar"
                />
            )}
        </motion.aside>
    );
};

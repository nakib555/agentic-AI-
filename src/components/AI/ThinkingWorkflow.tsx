/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { MessageError, ToolCallEvent } from '../../types';
import { WorkflowNode, type WorkflowNodeStatus } from './WorkflowNode';
import { parseAgenticWorkflow } from '../../services/workflowParser';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { ActiveIcon, CompletedIcon, FailedIcon, GoalAnalysisIcon, PendingIcon, TodoListIcon, ToolsIcon } from './icons';
import { TypingWrapper } from './TypingWrapper';
import { WorkflowConnector } from './WorkflowConnector';

type ThinkingWorkflowProps = {
  text: string;
  toolCallEvents?: ToolCallEvent[];
  isThinkingComplete: boolean;
  isLiveGeneration: boolean;
  error?: MessageError;
  sendMessage: (message: string, files?: File[]) => void;
};

// --- Helper Component for Auto-Scrolling Content ---
const AutoScrollingRenderer: React.FC<{
    text: string;
    isAnimating: boolean;
    components: any;
    scrollRef: React.RefObject<HTMLDivElement>;
}> = ({ text, isAnimating, components, scrollRef }) => {
    // This effect runs whenever the displayed text changes during an animation,
    // ensuring the view scrolls smoothly to keep the new content visible.
    useEffect(() => {
        if (isAnimating && scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [text, isAnimating, scrollRef]);

    return <ManualCodeRenderer text={text} components={components} />;
};

const SectionHeader: React.FC<{
  title: string;
  statusIcon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ title, statusIcon, isOpen, onToggle }) => (
    <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-2 hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
    >
        <div className="flex items-center gap-3">
            {statusIcon}
            <span className="font-semibold text-slate-200 text-sm">{title}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 0 : -90 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
        </motion.div>
    </button>
);

const StatusIcon = ({ status }: { status: WorkflowNodeStatus }) => {
    switch (status) {
        case 'active': return <ActiveIcon />;
        case 'done': return <CompletedIcon />;
        case 'failed': return <FailedIcon />;
        case 'pending':
        default: return <PendingIcon />;
    }
};


export const ThinkingWorkflow = ({ text, toolCallEvents, isThinkingComplete, isLiveGeneration, error, sendMessage }: ThinkingWorkflowProps) => {
    type SectionName = 'goal' | 'todo' | 'tools';
    type AnimationState = 'pending' | 'animating' | 'complete';

    const [animationStates, setAnimationStates] = useState<Record<SectionName, AnimationState>>(() => {
        if (!isLiveGeneration) {
            return { goal: 'complete', todo: 'complete', tools: 'complete' };
        }
        return { goal: 'pending', todo: 'pending', tools: 'pending' };
    });
    
    const [openSections, setOpenSections] = useState({
        goal: false, todo: false, tools: false, execution: true,
    });
    
    const goalContentRef = useRef<HTMLDivElement>(null);
    const todoContentRef = useRef<HTMLDivElement>(null);
    const toolsContentRef = useRef<HTMLDivElement>(null);
    const executionLogRef = useRef<HTMLUListElement>(null);

    const { goalAnalysis, todoList, tools, executionLog } = useMemo(
        () => parseAgenticWorkflow(text, toolCallEvents, isThinkingComplete, error),
        [text, toolCallEvents, isThinkingComplete, error]
    );

    useEffect(() => {
        if (!isLiveGeneration) return;

        const startSequence = () => {
            if (goalAnalysis && animationStates.goal === 'pending') {
                setOpenSections(prev => ({ ...prev, goal: true }));
                setAnimationStates(prev => ({ ...prev, goal: 'animating' }));
            } else if (!goalAnalysis && todoList && animationStates.todo === 'pending') {
                setOpenSections(prev => ({ ...prev, todo: true }));
                setAnimationStates(prev => ({ ...prev, todo: 'animating' }));
            } else if (!goalAnalysis && !todoList && tools && animationStates.tools === 'pending') {
                setOpenSections(prev => ({ ...prev, tools: true }));
                setAnimationStates(prev => ({ ...prev, tools: 'animating' }));
            }
        };
        startSequence();
    }, [isLiveGeneration, goalAnalysis, todoList, tools, animationStates]);
    
    useEffect(() => {
        if (!isLiveGeneration) return;
        
        if (isThinkingComplete && !error && executionLog.length > 0) {
            const timer = setTimeout(() => {
                setOpenSections(prev => ({ ...prev, execution: false }));
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isLiveGeneration, isThinkingComplete, error, executionLog.length]);

    const handleAnimationComplete = useCallback((section: SectionName) => {
        setAnimationStates(prev => ({ ...prev, [section]: 'complete' }));
        
        if (!isLiveGeneration) return;

        const nextStep = () => {
            if (section === 'goal') {
                setOpenSections(prev => ({ ...prev, goal: false, todo: !!todoList }));
                if (todoList) {
                    setAnimationStates(prev => ({ ...prev, todo: 'animating' }));
                } else if (tools) {
                    setOpenSections(prev => ({ ...prev, tools: true }));
                    setAnimationStates(prev => ({ ...prev, tools: 'animating' }));
                }
            } else if (section === 'todo') {
                setOpenSections(prev => ({ ...prev, todo: false, tools: !!tools }));
                if (tools) {
                    setAnimationStates(prev => ({ ...prev, tools: 'animating' }));
                }
            } else if (section === 'tools') {
                setOpenSections(prev => ({ ...prev, tools: false, execution: true }));
            }
        };
        setTimeout(nextStep, 300);
    }, [isLiveGeneration, todoList, tools]);
    
    const toggleSection = (section: keyof typeof openSections) => {
        const newOpenState = !openSections[section];
        setOpenSections(prev => ({ ...prev, [section]: newOpenState }));

        if (newOpenState && section in animationStates && animationStates[section as SectionName] !== 'complete') {
            setAnimationStates(prev => ({ ...prev, [section as SectionName]: 'complete' }));
        }
    };

    useEffect(() => {
        if (openSections.execution && executionLogRef.current) {
            executionLogRef.current.scrollTo({
                top: executionLogRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [executionLog, openSections.execution]);

    const { executionHeaderTitle, executionStatusIcon } = useMemo(() => {
        if (!isThinkingComplete) return { executionHeaderTitle: 'Executing Tools', executionStatusIcon: <ActiveIcon /> };
        if (error) return { executionHeaderTitle: 'Execution Failed', executionStatusIcon: <FailedIcon /> };
        return { executionHeaderTitle: 'Execution Complete', executionStatusIcon: <CompletedIcon /> };
    }, [isThinkingComplete, error]);

    const hasAnyContent = goalAnalysis || todoList || tools || executionLog.length > 0 || !!error;

    if (!hasAnyContent) return null;

    const visibleSections = [ error && 'error', goalAnalysis && 'goal', todoList && 'todo', tools && 'tools', executionLog.length > 0 && 'execution' ].filter(Boolean);
    const lastVisibleSection = visibleSections[visibleSections.length - 1];
    const getSectionClassName = (sectionName: string) => lastVisibleSection === sectionName ? '' : 'border-b border-slate-600/50';

    const renderSectionContent = (content: string, sectionName: SectionName, ref: React.RefObject<HTMLDivElement>) => (
         <div ref={ref} className="px-4 pt-2 pb-4 overflow-y-auto max-h-[240px] plan-log">
            <TypingWrapper
                fullText={content}
                isAnimating={isLiveGeneration && animationStates[sectionName] === 'animating'}
                onComplete={() => handleAnimationComplete(sectionName)}
            >
                {(text) => (
                    <AutoScrollingRenderer
                        text={!isLiveGeneration || animationStates[sectionName] === 'complete' ? content : text}
                        isAnimating={isLiveGeneration && animationStates[sectionName] === 'animating'}
                        components={WorkflowMarkdownComponents}
                        scrollRef={ref}
                    />
                )}
            </TypingWrapper>
        </div>
    );

    return (
        <div className="bg-[#2D2D2D] dark:bg-[#202123] rounded-xl max-w-[90%] w-full">
            <div className="overflow-y-auto max-h-[500px] workflow-container-log">
                {error && (
                    <div className={`p-4 ${getSectionClassName('error')}`}>
                         <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                            className="bg-red-900/30 border border-red-500/40 p-3 rounded-lg flex items-start gap-3"
                         >
                            <div className="flex-shrink-0 text-red-400 pt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0 -16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" /></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-red-300 break-words">{error.message}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
                {goalAnalysis && (
                    <div className={getSectionClassName('goal')}>
                        <SectionHeader title="Goal Analysis" statusIcon={<GoalAnalysisIcon />} isOpen={openSections.goal} onToggle={() => toggleSection('goal')} />
                        <AnimatePresence>
                            {openSections.goal && (
                                <motion.div
                                    initial="collapsed" animate="open" exit="collapsed"
                                    variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden"
                                >
                                    {renderSectionContent(goalAnalysis, 'goal', goalContentRef)}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
                {todoList && (
                    <div className={getSectionClassName('todo')}>
                        <SectionHeader title="Todo-list" statusIcon={<TodoListIcon />} isOpen={openSections.todo} onToggle={() => toggleSection('todo')} />
                         <AnimatePresence>
                            {openSections.todo && (
                                <motion.div
                                    initial="collapsed" animate="open" exit="collapsed"
                                    variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden"
                                >
                                    {renderSectionContent(todoList, 'todo', todoContentRef)}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
                {tools && (
                    <div className={getSectionClassName('tools')}>
                        <SectionHeader title="Tools" statusIcon={<ToolsIcon />} isOpen={openSections.tools} onToggle={() => toggleSection('tools')} />
                         <AnimatePresence>
                            {openSections.tools && (
                                <motion.div
                                    initial="collapsed" animate="open" exit="collapsed"
                                    variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden"
                                >
                                    {renderSectionContent(tools, 'tools', toolsContentRef)}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
                {executionLog.length > 0 && (
                     <div className={`flex-1 flex flex-col min-h-0 ${getSectionClassName('execution')}`}>
                        <SectionHeader title={executionHeaderTitle} statusIcon={executionStatusIcon} isOpen={openSections.execution} onToggle={() => toggleSection('execution')} />
                         <AnimatePresence>
                            {openSections.execution && (
                                <motion.div
                                    initial="collapsed" animate="open" exit="collapsed"
                                    variants={{ open: { opacity: 1, height: 'auto' }, collapsed: { opacity: 0, height: 0 } }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden"
                                >
                                    <ul ref={executionLogRef} className="flex-1 flex flex-col w-full p-4 overflow-y-auto execution-log max-h-[300px]">
                                        <AnimatePresence>
                                            {executionLog.map((node, index) => {
                                                const isLastNode = index === executionLog.length - 1;
                                                const isActive = node.status === 'active';

                                                return (
                                                    <motion.li
                                                        key={node.id}
                                                        layout="position"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } }}
                                                        exit={{ opacity: 0, y: -10, transition: { duration: 0.2, ease: [0.5, 0, 0.75, 0] } }}
                                                        className="flex items-start gap-4 w-full"
                                                    >
                                                        <div className="flex flex-col items-center h-full">
                                                            <StatusIcon status={node.status} />
                                                            {!isLastNode && <WorkflowConnector isActive={isActive} />}
                                                        </div>

                                                        <div className={`flex-1 min-w-0 ${!isLastNode ? 'pb-8' : 'pb-2'}`}>
                                                            <WorkflowNode node={node} sendMessage={sendMessage} />
                                                        </div>
                                                    </motion.li>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};
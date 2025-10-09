/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import type { MessageError, ToolCallEvent } from '../../types';
import { WorkflowNode } from './WorkflowNode';
import { WorkflowConnector } from './WorkflowConnector';
import { ActiveIcon } from './icons';
import { parseAgenticWorkflow } from '../../services/workflowParser';

type ThinkingWorkflowProps = {
  text: string;
  toolCallEvents?: ToolCallEvent[];
  isThinkingComplete: boolean;
  error?: MessageError;
};

const itemWrapperVariants: Variants = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: {
        opacity: 1, y: 0, scale: 1, x: 0,
        transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] }
    },
    exit: {
        opacity: 0, scale: 0.95,
        transition: { duration: 0.2, ease: [0.5, 0, 0.75, 0] }
    },
    shake: {
        x: [0, -4, 4, -4, 4, 0],
        transition: { duration: 0.4 }
    }
};

const InitialLoadingState = () => (
    <motion.div
      key="initial-loading"
      variants={itemWrapperVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex items-center justify-center p-4 text-sm text-slate-500 dark:text-slate-400 w-full"
    >
      <ActiveIcon />
      <span className="ml-3 font-medium">Analyzing request...</span>
    </motion.div>
);


export const ThinkingWorkflow = ({ text, toolCallEvents, isThinkingComplete, error }: ThinkingWorkflowProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const workflowNodes = useMemo(
    () => parseAgenticWorkflow(text, toolCallEvents, isThinkingComplete, error), 
    [text, toolCallEvents, isThinkingComplete, error]
  );
  
  const showInitialLoadingState = workflowNodes.length === 0 && !isThinkingComplete && !error;

  // Render nothing if there are no steps and thinking is complete. This avoids showing an
  // empty box for simple, single-response answers.
  if (workflowNodes.length === 0 && !showInitialLoadingState) {
      return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg max-w-[90%] w-full border border-slate-200 dark:border-slate-700 p-4">
        <button 
          className="flex items-center gap-3 w-full text-left"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="thinking-workflow-content"
        >
            <div className="w-4 h-4 bg-teal-200 dark:bg-teal-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <div className={`w-2 h-2 ${isThinkingComplete ? 'bg-teal-500' : 'bg-teal-500 animate-pulse'} rounded-full`}></div>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">Thinking Process</span>
            <div className="ml-auto text-slate-400">
                <motion.div animate={{ rotate: isOpen ? 0 : -90 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                </motion.div>
            </div>
        </button>
      
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id="thinking-workflow-content"
              initial="collapsed"
              animate="open"
              exit="collapsed"
              variants={{
                  open: { opacity: 1, height: 'auto', marginTop: '16px' },
                  collapsed: { opacity: 0, height: 0, marginTop: '0px' },
              }}
              transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
              className="overflow-hidden"
            >
              <ul className="flex flex-col items-center w-full">
                  <AnimatePresence mode="wait">
                      {showInitialLoadingState ? (
                          <li key="initial-loading-li" className="w-full">
                            <InitialLoadingState />
                          </li>
                      ) : (
                        workflowNodes.map((node, index) => (
                            <motion.li
                                key={node.id}
                                layout="position"
                                variants={itemWrapperVariants}
                                initial="initial"
                                animate={node.status === 'failed' ? 'shake' : 'animate'}
                                exit="exit"
                                className="w-full flex flex-col items-center"
                            >
                                {index > 0 && (
                                    <WorkflowConnector isActive={node.status !== 'pending'} />
                                )}
                                <WorkflowNode node={node} />
                            </motion.li>
                        ))
                      )}
                  </AnimatePresence>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, Variants } from 'framer-motion';
import type { MessageError, ToolCallEvent } from '../../types';
import { WorkflowNode, WorkflowNodeData, WorkflowNodeType } from './WorkflowNode';
import { WorkflowConnector } from './WorkflowConnector';
import { ActiveIcon } from './icons';

type ThinkingWorkflowProps = {
  text: string;
  toolCallEvents?: ToolCallEvent[];
  isThinkingComplete: boolean;
  error?: MessageError;
};

const parseAgenticWorkflow = (
  rawText: string,
  toolCallEvents: ToolCallEvent[] = [],
  isThinkingComplete: boolean,
  error?: MessageError
): WorkflowNodeData[] => {
    // This regex captures "[STEP] Title:" and the content until the next "[STEP]" or end of string.
    const stepRegex = /\[STEP\]\s*(.*?):\s*([\s\S]*?)(?=\[STEP\]|$)/gs;
    let match;
    const stepNodes: WorkflowNodeData[] = [];
    let stepIndex = 0;

    // 1. Parse all text-based steps from the raw thinking text
    while ((match = stepRegex.exec(rawText)) !== null) {
        const title = match[1].trim();
        const details = match[2].trim();

        if (title.toLowerCase() === 'final answer') {
            continue; // Exclude the final answer from the workflow visualization
        }

        // Infer node type for better icon representation
        let type: WorkflowNodeType = 'plan';
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('execute') || lowerTitle.includes('search')) {
            type = 'task';
        }

        stepNodes.push({
            id: `step-${stepIndex++}`,
            type: type,
            title: title,
            // Status will be set in the final polish stage
            status: 'pending', 
            details: details || 'No details provided.',
        });
    }

    // 2. Create nodes for any tool calls that have occurred, filtering out longRunningTask
    const toolCallNodes: WorkflowNodeData[] = toolCallEvents
        .filter(event => event.call.name !== 'longRunningTask')
        .map(event => ({
            id: event.id,
            type: 'tool',
            title: `Tool: ${event.call.name}`,
            status: event.result ? 'done' : 'active',
            details: event,
        }));
    
    const allNodes = [...stepNodes, ...toolCallNodes];
    if (allNodes.length === 0) return [];

    // 3. Apply final status updates based on the overall state
    if (error) {
        const lastActiveNode = allNodes.slice().reverse().find(n => n.status === 'active');
        if (lastActiveNode) {
            lastActiveNode.status = 'failed';
            lastActiveNode.details = error;
        } else if (allNodes.length > 0) {
            allNodes[allNodes.length - 1].status = 'failed';
            allNodes[allNodes.length - 1].details = error;
        }
        // Mark preceding nodes as done
        for (const node of allNodes) {
            if (node.status === 'pending') node.status = 'done';
            if (node.status === 'failed') break;
        }
    } else if (isThinkingComplete) {
        allNodes.forEach(node => {
            if (node.status !== 'failed') node.status = 'done';
        });
    } else {
        // Mark all text steps as 'done', as their text has been generated.
        stepNodes.forEach(node => node.status = 'done');
        
        const hasActiveTools = toolCallNodes.some(n => n.status === 'active');
        
        // If there are no active tools, the AI's "focus" is on the last text-based
        // step it generated. We mark this as 'active' for better visualization.
        if (!hasActiveTools && allNodes.length > 0) {
            const lastNode = allNodes[allNodes.length - 1];
            // Only mark text-based nodes as active. Tool nodes manage their own status.
            if (lastNode.type === 'plan' || lastNode.type === 'task') {
              lastNode.status = 'active';
            }
        }
    }
    
    return allNodes;
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
    <div className="bg-white dark:bg-slate-800/60 rounded-2xl max-w-[90%] sm:max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <button 
          className="flex items-center gap-3 w-full text-left"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="thinking-workflow-content"
        >
            <div className="w-4 h-4 bg-purple-200 dark:bg-purple-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <div className={`w-2 h-2 ${isThinkingComplete ? 'bg-purple-500' : 'bg-purple-500 animate-pulse'} rounded-full`}></div>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">Thinking Process</span>
            <div className="ml-auto text-slate-400">
                <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" /></svg>
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
              <div className="flex flex-col items-center">
                  <AnimatePresence mode="wait">
                      {showInitialLoadingState ? (
                          <InitialLoadingState />
                      ) : (
                        workflowNodes.map((node, index) => (
                            <motion.div
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
                            </motion.div>
                        ))
                      )}
                  </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};
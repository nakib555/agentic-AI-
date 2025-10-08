/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActiveIcon, CompletedIcon, FailedIcon, PendingIcon } from './icons';
import type { MessageError, ToolCallEvent } from '../../types';
import { ToolCallStep } from './ToolCallStep';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';


export type WorkflowNodeStatus = 'pending' | 'active' | 'done' | 'failed';
export type WorkflowNodeType = 'plan' | 'task' | 'tool';

export type WorkflowNodeData = {
  id: string;
  type: WorkflowNodeType;
  title: string;
  status: WorkflowNodeStatus;
  details?: string | ToolCallEvent | MessageError;
};

const getStatusIcon = (status: WorkflowNodeStatus) => {
  switch (status) {
    case 'active': return <ActiveIcon />;
    case 'done': return <CompletedIcon />;
    case 'failed': return <FailedIcon />;
    case 'pending':
    default: return <PendingIcon />;
  }
};

const CheckboxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-slate-500 dark:text-slate-400"><path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v7A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13.5 3h-11ZM2 4.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5-.5h-11a.5.5 0 0 1-.5-.5v-7Z" /></svg>;

const getTypeIcon = (type: WorkflowNodeType) => {
    switch (type) {
        case 'plan': return <CheckboxIcon />;
        case 'task': return <CheckboxIcon />;
        case 'tool': return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-teal-500"><path d="M4.5 2A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 11.5 2h-7ZM5.5 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5Z" /></svg>;
        default: return null;
    }
}

const renderDetails = (node: WorkflowNodeData) => {
    if (!node.details) return null;

    // Check if details object is a ToolCallEvent
    if (typeof node.details === 'object' && node.details !== null && 'call' in node.details && 'id' in node.details) {
        return <ToolCallStep event={node.details as ToolCallEvent} nodeType={node.type} />;
    }

    if (node.status === 'failed' && typeof node.details === 'object' && 'message' in node.details) {
        const error = node.details as MessageError;
        return (
            <div className="text-xs space-y-1">
                <p className="font-semibold text-red-700 dark:text-red-300">{error.message}</p>
                {error.code && <p><span className="font-semibold">Code:</span> {error.code}</p>}
                {error.details && <pre className="whitespace-pre-wrap font-mono bg-red-100/50 dark:bg-red-900/20 p-2 rounded-md">{error.details}</pre>}
            </div>
        );
    }
    
    if (typeof node.details === 'string') {
        return (
            <div className="text-xs text-slate-800 dark:text-slate-300">
                <ManualCodeRenderer text={node.details} components={WorkflowMarkdownComponents} />
            </div>
        );
    }
    
    return null;
}

const StyledTitle = ({ title }: { title: string }) => {
    const match = title.match(/^(.*?)\s*\*\s*\*\*(.*?)\*\*$/);

    if (match) {
        const mainText = match[1].trim();
        const emphasisText = match[2].trim();
        return (
            <>
                {mainText}
                <span className="text-slate-500 dark:text-slate-400 font-normal ml-2">
                    * <strong className="font-semibold text-slate-700 dark:text-slate-300">{emphasisText}</strong>
                </span>
            </>
        );
    }

    return <>{title}</>;
};

export const WorkflowNode = ({ node }: { node: WorkflowNodeData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasDetails = !!node.details;
  const isClickable = hasDetails || node.status === 'failed';
  const detailsId = `workflow-node-details-${node.id}`;

  return (
    <div className="w-full">
      <button
        onClick={() => isClickable && setIsOpen(!isOpen)}
        disabled={!isClickable}
        aria-expanded={isClickable ? isOpen : undefined}
        aria-controls={isClickable ? detailsId : undefined}
        title={isClickable ? (isOpen ? 'Collapse details' : 'Expand details') : ''}
        className={`w-full flex items-center gap-4 p-3 rounded-lg border transition-all ${
          isClickable ? 'cursor-pointer' : 'cursor-default'
        } ${
          node.status === 'active' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' :
          node.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' :
          'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
                {getStatusIcon(node.status)}
            </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-3 text-left">
            <div className="flex-shrink-0">{getTypeIcon(node.type)}</div>
            <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                <span className="sr-only">Status: {node.status.charAt(0).toUpperCase() + node.status.slice(1)}.</span>
                <StyledTitle title={node.title} />
            </p>
        </div>

        {isClickable && (
          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} className="text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={detailsId}
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: '8px' }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-slate-100/70 dark:bg-slate-900/30 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                {renderDetails(node)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
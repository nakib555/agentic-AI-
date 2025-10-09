/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { MessageError, ToolCallEvent } from '../../types';
import { ToolCallStep } from './ToolCallStep';
import { ManualCodeRenderer } from '../Markdown/ManualCodeRenderer';
import { WorkflowMarkdownComponents } from '../Markdown/markdownComponents';
import { getErrorMessageSuggestion } from '../UI/ErrorDisplay';


export type WorkflowNodeStatus = 'pending' | 'active' | 'done' | 'failed';
export type WorkflowNodeType = 'plan' | 'task' | 'tool' | 'googleSearch';

export type WorkflowNodeData = {
  id: string;
  type: WorkflowNodeType;
  title: string;
  status: WorkflowNodeStatus;
  details?: string | ToolCallEvent | MessageError;
};

const renderDetails = (node: WorkflowNodeData) => {
    if (!node.details) return null;

    // For tool calls, including googleSearch, the details are a ToolCallEvent object.
    if (typeof node.details === 'object' && 'call' in node.details && 'id' in node.details) {
        return <ToolCallStep event={node.details as ToolCallEvent} nodeType={node.type} />;
    }

    if (node.status === 'failed' && typeof node.details === 'object' && 'message' in node.details) {
        const error = node.details as MessageError;
        const suggestion = getErrorMessageSuggestion(error.code);
        return (
            <div className="text-xs space-y-1 text-red-800 dark:text-red-300">
                <p className="font-semibold text-red-700 dark:text-red-300">{error.message}</p>
                {error.code && <p><span className="font-semibold">Code:</span> {error.code}</p>}
                {suggestion && <p className="mt-1 p-2 bg-red-100/50 dark:bg-red-900/20 rounded-md"><span className="font-semibold">Suggestion:</span> {suggestion}</p>}
                {error.details && <pre className="whitespace-pre-wrap font-['Fira_Code',_monospace] bg-red-100/50 dark:bg-red-900/20 p-2 rounded-md mt-1">{error.details}</pre>}
            </div>
        );
    }
    
    // For simple text/plan nodes, the details are a string.
    if (typeof node.details === 'string') {
        return (
            <div className="text-sm text-slate-300 workflow-markdown">
                <ManualCodeRenderer text={node.details} components={WorkflowMarkdownComponents} />
            </div>
        );
    }
    
    return null;
}

export const WorkflowNode = ({ node }: { node: WorkflowNodeData }) => {
  // Don't render a wrapper for nodes that have no title, like simple plan steps.
  // Their details will be rendered directly with bullet points.
  if (!node.title) {
    return renderDetails(node);
  }
  
  // For nodes with a title (like googleSearch), render the full component.
  return renderDetails(node);
};
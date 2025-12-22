
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo } from 'react';
import { WorkflowNodeData } from '../../types';

// This component is kept primarily for the legacy ThinkingSidebar if users still open it.
// The main UI now uses the ManusMessage console.

type WorkflowNodeProps = {
  node: WorkflowNodeData;
  sendMessage: any;
  onRegenerate?: any;
  messageId?: any;
  isLast?: boolean;
};

export const WorkflowNode = memo(({ node }: WorkflowNodeProps) => {
    // Simple rendering for the legacy sidebar view
    return (
        <div className="mb-2 p-2 rounded bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{node.title}</span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${node.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {node.status}
                </span>
            </div>
            {typeof node.details === 'string' && (
                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {node.details}
                </div>
            )}
        </div>
    );
});

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MessageError, ToolCallEvent } from '../types';
import type { WorkflowNodeType } from '../components/AI/WorkflowNode';

export type WorkflowNodeData = {
  id: string;
  type: WorkflowNodeType;
  title: string;
  status: 'pending' | 'active' | 'done' | 'failed';
  details?: string | ToolCallEvent | MessageError;
};

/**
 * Parses the raw thinking text from the AI into a structured list of workflow nodes.
 * @param rawText The raw text from the AI's thinking process.
 * @param toolCallEvents A list of tool call events that have occurred.
 * @param isThinkingComplete A boolean indicating if the entire thinking process is finished.
 * @param error An optional error object if the process failed.
 * @returns An array of `WorkflowNodeData` representing the steps.
 */
export const parseAgenticWorkflow = (
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
        let type: WorkflowNodeType = 'plan'; // Default to 'plan' for strategic steps like 'Think', 'Adapt'
        const lowerTitle = title.toLowerCase();
        const taskKeywords = ['execute', 'search', 'fetch', 'get', 'process', 'act'];

        if (taskKeywords.some(keyword => lowerTitle.includes(keyword))) {
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

    // 2. Create nodes for any tool calls that have occurred
    const toolCallNodes: WorkflowNodeData[] = toolCallEvents
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
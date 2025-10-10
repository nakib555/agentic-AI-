/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MessageError, ToolCallEvent } from '../types';
import type { WorkflowNodeData } from '../components/AI/WorkflowNode';

export type ParsedWorkflow = {
  goalAnalysis: string;
  todoList: string;
  tools: string;
  executionLog: WorkflowNodeData[];
};

// Generic workflow keywords that should be treated as procedural rather than titles.
const GENERIC_STEP_KEYWORDS = new Set(['think', 'act', 'observe', 'adapt', 'system']);

/**
 * Splits the raw thinking text into the initial plan and the subsequent execution steps.
 * @param rawText The raw text from the AI's thinking process.
 * @returns An object containing the plan text and the execution text.
 */
const splitPlanFromExecution = (rawText: string): { planText: string, executionText: string } => {
    const stepMarker = '[STEP]';
    const firstStepIndex = rawText.indexOf(stepMarker);

    if (firstStepIndex === -1) {
        // If there are no [STEP] markers, the whole text is considered part of the plan/initial thought.
        return { planText: rawText, executionText: '' };
    }

    const planText = rawText.substring(0, firstStepIndex).trim();
    const executionText = rawText.substring(firstStepIndex).trim();
    
    return { planText, executionText };
};


/**
 * Parses the raw thinking text from the AI into a structured format for the two-panel UI.
 * @param rawText The raw text from the AI's thinking process.
 * @param toolCallEvents A list of tool call events that have occurred.
 * @param isThinkingComplete A boolean indicating if the entire thinking process is finished.
 * @param error An optional error object if the process failed.
 * @returns A `ParsedWorkflow` object with separated plan and execution log.
 */
export const parseAgenticWorkflow = (
  rawText: string,
  toolCallEvents: ToolCallEvent[] = [],
  isThinkingComplete: boolean,
  error?: MessageError
): ParsedWorkflow => {
    const { planText, executionText } = splitPlanFromExecution(rawText);

    // Parse the planning phase into its three distinct sections using regex
    const goalAnalysisMatch = planText.match(/## Goal Analysis\s*([\s\S]*?)(?=## Todo-list|$)/s);
    const todoListMatch = planText.match(/## Todo-list\s*([\s\S]*?)(?=## Tools|$)/s);
    const toolsMatch = planText.match(/## Tools\s*([\s\S]*?)$/s);

    const goalAnalysis = goalAnalysisMatch ? goalAnalysisMatch[1].trim() : '';
    const todoList = todoListMatch ? todoListMatch[1].trim() : '';
    const tools = toolsMatch ? toolsMatch[1].trim() : '';


    // This regex captures "[STEP] Title:" and the content until the next "[STEP]" or end of string.
    const stepRegex = /\[STEP\]\s*(.*?):\s*([\s\S]*?)(?=\[STEP\]|$)/gs;
    let match;
    const executionNodes: WorkflowNodeData[] = [];
    let stepIndex = 0;

    // 1. Parse all text-based execution steps from the execution text
    while ((match = stepRegex.exec(executionText)) !== null) {
        let title = match[1].trim();
        let details = match[2].trim();

        if (title.toLowerCase() === 'final answer') {
            continue; // Exclude the final answer from the workflow visualization
        }

        // For generic steps like "Observe:", treat the details as the primary content.
        if (GENERIC_STEP_KEYWORDS.has(title.toLowerCase())) {
            title = ''; // The title itself isn't informative, so we hide it.
        }

        executionNodes.push({
            id: `step-${stepIndex++}`,
            type: 'plan', // All text-based steps are 'plan' type for rendering.
            title: title,
            status: 'pending', 
            details: details || 'No details provided.',
        });
    }

    // 2. Create nodes for any tool calls that have occurred
    const toolCallNodes: WorkflowNodeData[] = toolCallEvents
        .map(event => {
            const isGoogleSearch = event.call.name === 'googleSearch';
            return {
                id: event.id,
                type: isGoogleSearch ? 'googleSearch' : 'tool',
                title: isGoogleSearch ? (event.call.args.query ?? 'Searching...') : `Tool: ${event.call.name}`,
                status: event.result ? 'done' : 'active',
                details: event,
            }
        });
    
    const allExecutionNodes = [...executionNodes, ...toolCallNodes];

    // 3. Apply final status updates based on the overall state
    if (error) {
        let failureAssigned = false;
        // Search backwards to find the last step that wasn't already successfully completed.
        for (let i = allExecutionNodes.length - 1; i >= 0; i--) {
            const node = allExecutionNodes[i];
            if (node.status === 'active' || node.status === 'pending') {
                node.status = 'failed';
                node.details = error;
                failureAssigned = true;
                break; // Only fail the most recent in-progress step
            }
        }
        
        // If all nodes were already 'done', or if there were no nodes, the error
        // happened after the last known step. We add a new node to show the error.
        if (!failureAssigned) {
            allExecutionNodes.push({
                id: `error-${stepIndex++}`,
                type: 'task',
                title: 'Error Occurred',
                status: 'failed',
                details: error
            });
        }
        
        // Now, ensure all steps *before* the failure are marked as 'done'.
        let failurePointReached = false;
        allExecutionNodes.forEach(node => {
            if (node.status === 'failed') {
                failurePointReached = true;
            }
            if (node.status === 'pending' && !failurePointReached) {
                node.status = 'done';
            }
        });
    } else if (isThinkingComplete) {
        allExecutionNodes.forEach(node => {
            if (node.status !== 'failed') node.status = 'done';
        });
    } else {
        executionNodes.forEach(node => node.status = 'done');
        const hasActiveTools = toolCallNodes.some(n => n.status === 'active');
        if (!hasActiveTools && allExecutionNodes.length > 0) {
            const lastNode = allExecutionNodes[allExecutionNodes.length - 1];
            if (lastNode.type === 'plan') {
              lastNode.status = 'active';
            }
        }
    }
    
    return { goalAnalysis, todoList, tools, executionLog: allExecutionNodes };
};
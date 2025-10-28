/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MessageError, ToolCallEvent } from '../types';
import type { WorkflowNodeData, WorkflowNodeType } from '../components/AI/WorkflowNode';

export type ParsedWorkflow = {
  goalAnalysis: string;
  todoList: string;
  tools: string;
  executionLog: WorkflowNodeData[];
};

// Generic workflow keywords that should be treated as procedural rather than titles.
const GENERIC_STEP_KEYWORDS = new Set(['observe', 'adapt', 'system']);

/**
 * Parses the raw thinking text from the AI into a structured format for the UI.
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
    // Robustly find and extract planning sections first, regardless of their position.
    const goalAnalysisMatch = rawText.match(/## Goal Analysis\s*([\s\S]*?)(?=## Todo-list|## Tools|\[STEP\]|$)/s);
    const todoListMatch = rawText.match(/## Todo-list\s*([\s\S]*?)(?=## Tools|\[STEP\]|$)/s);
    const toolsMatch = rawText.match(/## Tools\s*([\s\S]*?)(?=\[STEP\]|$)/s);

    const goalAnalysis = goalAnalysisMatch ? goalAnalysisMatch[1].trim() : '';
    const todoList = todoListMatch ? todoListMatch[1].trim() : '';
    const tools = toolsMatch ? toolsMatch[1].trim() : '';
    
    // Remove the planning sections from the raw text to isolate the execution log.
    let executionText = rawText;
    if (goalAnalysisMatch) executionText = executionText.replace(goalAnalysisMatch[0], '');
    if (todoListMatch) executionText = executionText.replace(todoListMatch[0], '');
    if (toolsMatch) executionText = executionText.replace(toolsMatch[0], '');
    executionText = executionText.trim();

    // --- Interleaving Logic for Chronological Workflow ---

    // 1. Parse all text-based steps
    const textNodes: WorkflowNodeData[] = [];
    const stepRegex = /\[STEP\]\s*(.*?):\s*([\s\S]*?)(?=\[STEP\]|$)/gs;
    let match;
    let stepIndex = 0;
    while ((match = stepRegex.exec(executionText)) !== null) {
        let title = match[1].trim();
        const lowerCaseTitle = title.toLowerCase();
        let details = match[2].trim();

        if (lowerCaseTitle === 'final answer') {
            continue;
        }

        let type: WorkflowNodeType = 'plan';
        let agentName: string | undefined;
        let handoff: { from: string; to: string } | undefined;

        // --- Multi-Agent Parsing ---
        const agentMatch = details.match(/^\[AGENT:\s*([^\]]+)\]\s*/);
        if (agentMatch) {
            agentName = agentMatch[1].trim();
            details = details.replace(agentMatch[0], '').trim();
        }

        const handoffMatch = title.match(/^Handoff:\s*(.*?)\s*->\s*(.*)/i);
        if (handoffMatch) {
            type = 'handoff';
            handoff = { from: handoffMatch[1].trim(), to: handoffMatch[2].trim() };
        } else if (lowerCaseTitle.startsWith('validate')) {
            type = 'validation';
        } else if (lowerCaseTitle.startsWith('guardian approval')) {
            type = 'approval';
        } else if (lowerCaseTitle.startsWith('corrective action')) {
            type = 'correction';
        } else if (lowerCaseTitle.startsWith('archive')) {
            type = 'archival';
        } else if (lowerCaseTitle.startsWith('audit')) {
            type = 'audit';
        } else if (lowerCaseTitle === 'think' || lowerCaseTitle === 'adapt') {
            type = 'thought';
            details = `${title}: ${details}`;
            title = 'Thinking';
        } else if (lowerCaseTitle === 'observe') {
            type = 'observation';
            details = details;
            title = 'Observation';
        } else if (lowerCaseTitle === 'act') {
            type = 'act_marker'; // Use a special type for positioning tool calls.
        } else if (GENERIC_STEP_KEYWORDS.has(lowerCaseTitle)) {
            details = `${title}: ${details}`;
            title = '';
        }

        textNodes.push({
            id: `step-${stepIndex++}`,
            type: type,
            title: title,
            status: 'pending', 
            details: details || 'No details provided.',
            agentName: agentName,
            handoff: handoff,
        });
    }

    // 2. Create a queue of tool call nodes
    const toolNodesQueue = toolCallEvents.map(event => {
        const isDuckDuckGoSearch = event.call.name === 'duckduckgoSearch';
        const duration = event.startTime && event.endTime ? (event.endTime - event.startTime) / 1000 : null;
        
        const isError = event.result?.startsWith('Tool execution failed');
        const nodeStatus = event.result ? (isError ? 'failed' : 'done') : 'active';

        return {
            id: event.id,
            type: isDuckDuckGoSearch ? 'duckduckgoSearch' : 'tool',
            title: isDuckDuckGoSearch ? (event.call.args.query ?? 'Searching...') : event.call.name,
            status: nodeStatus,
            details: event,
            duration: duration,
        } as WorkflowNodeData;
    });

    // 3. Interleave tool nodes, replacing 'Act' steps
    const finalExecutionLog: WorkflowNodeData[] = [];
    let lastAgentName: string | undefined;

    for (const textNode of textNodes) {
        if (textNode.agentName) {
            lastAgentName = textNode.agentName;
        }

        // An "Act" marker is a placeholder for a tool call. Replace it with the actual tool node.
        if (textNode.type === 'act_marker') {
            if (toolNodesQueue.length > 0) {
                const toolNode = toolNodesQueue.shift();
                if (toolNode) {
                    // Inherit the agent name from the preceding "Think" step.
                    toolNode.agentName = lastAgentName;
                    finalExecutionLog.push(toolNode);
                }
            }
        } else {
            // For all other nodes (Think, Observe, Plan, etc.), just add them.
            finalExecutionLog.push(textNode);
        }
    }
    
    // Add any remaining tool nodes that didn't have a corresponding "Act" step (e.g., if text stream was cut off)
    for (const toolNode of toolNodesQueue) {
        toolNode.agentName = lastAgentName;
        finalExecutionLog.push(toolNode);
    }


    // 4. Apply final status updates to the entire interleaved log
    if (error) {
        let failureAssigned = false;
        for (let i = finalExecutionLog.length - 1; i >= 0; i--) {
            const node = finalExecutionLog[i];
            if (node.status === 'active' || node.status === 'pending') {
                node.status = 'failed';
                node.details = error;
                failureAssigned = true;
                break;
            }
        }
        if (!failureAssigned) {
            finalExecutionLog.push({ id: `error-${stepIndex++}`, type: 'task', title: 'Error Occurred', status: 'failed', details: error });
        }
        
        let failurePointReached = false;
        finalExecutionLog.forEach(node => {
            if (node.status === 'failed') failurePointReached = true;
            if (node.status !== 'failed' && !failurePointReached) node.status = 'done';
        });

    } else if (isThinkingComplete) {
        finalExecutionLog.forEach(node => {
            if (node.status !== 'failed') node.status = 'done';
        });
    } else {
        // Find the last node that isn't 'done' and mark it 'active'.
        let lastActiveNodeFound = false;
        for (let i = finalExecutionLog.length - 1; i >= 0; i--) {
            const node = finalExecutionLog[i];
            if (!lastActiveNodeFound && node.status !== 'done') {
                node.status = 'active';
                lastActiveNodeFound = true;
            } else if (node.status !== 'done') {
                // Any pending steps before the active one are considered done.
                node.status = 'done';
            }
        }
    }
    
    return { goalAnalysis, todoList, tools, executionLog: finalExecutionLog };
};
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MessageError, ToolCallEvent, WorkflowNodeData, WorkflowNodeType, ParsedWorkflow } from '../types';

// Generic workflow keywords that should be treated as procedural rather than titles.
const GENERIC_STEP_KEYWORDS = new Set(['observe', 'adapt', 'system']);
const ACTION_KEYWORDS = new Set(['act', 'action', 'tool call']);


/**
 * Parses the raw thinking text from the AI into a structured format for the UI.
 * @param rawText The raw text from the AI's thinking process.
 * @param toolCallEvents A list of tool call events that have occurred.
 * @param isThinkingComplete A boolean indicating if the entire thinking process is finished.
 * @param error An optional error object if the process failed.
 * @returns An object containing the `plan` as a string and the `executionLog` as an array of nodes.
 */
export const parseAgenticWorkflow = (
  rawText: string,
  toolCallEvents: ToolCallEvent[] = [],
  isThinkingComplete: boolean,
  error?: MessageError
): ParsedWorkflow => {
  const planMarker = '[STEP] Strategic Plan:';
  const planMarkerIndex = rawText.indexOf(planMarker);

  let planText = '';
  let executionText = rawText;

  // A plan exists if the Strategic Plan marker is present.
  if (planMarkerIndex !== -1) {
    const planContentStartIndex = planMarkerIndex + planMarker.length;
    // The plan ends at the next [STEP] or the end of the string.
    const nextStepIndex = rawText.indexOf('[STEP]', planContentStartIndex);

    if (nextStepIndex !== -1) {
      planText = rawText.substring(planContentStartIndex, nextStepIndex);
      executionText = rawText.substring(nextStepIndex);
    } else {
      // The plan is the only thing in the text.
      planText = rawText.substring(planContentStartIndex);
      executionText = '';
    }
  } else {
    // No plan marker, so everything before the first [STEP] is a simple plan/thought.
    const firstStepIndex = rawText.indexOf('[STEP]');
    if (firstStepIndex !== -1) {
      planText = rawText.substring(0, firstStepIndex);
      executionText = rawText.substring(firstStepIndex);
    } else {
      // No steps at all, so everything is part of the "plan" (or just a simple thought).
      planText = rawText;
      executionText = '';
    }
  }

  planText = planText.replace(/\[AGENT:.*?\]\s*/, '').replace(/\[USER_APPROVAL_REQUIRED\]/, '').trim();
  executionText = executionText.trim();

  // --- Interleaving Logic for Chronological Workflow ---
  
  // 1. Parse all text-based steps from the execution log
  const textNodes: WorkflowNodeData[] = [];
  const stepRegex = /\[STEP\]\s*(.*?):\s*([\s\S]*?)(?=\[STEP\]|$)/gs;
  let match;
  let stepIndex = 0;
  while ((match = stepRegex.exec(executionText)) !== null) {
    let title = match[1].trim().replace(/:$/, '').trim(); // Sanitize: remove trailing colons
    let details = match[2].trim().replace(/\[AUTO_CONTINUE\]/g, '').trim(); // Sanitize: remove auto-continue markers
    const lowerCaseTitle = title.toLowerCase();

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
    } else if (lowerCaseTitle.startsWith('corrective action')) {
        type = 'correction';
    } else if (lowerCaseTitle === 'think' || lowerCaseTitle === 'adapt') {
        type = 'thought';
        details = `${title}: ${details}`;
        title = agentName ? `Thinking` : 'Thinking';
    } else if (lowerCaseTitle === 'observe') {
        type = 'observation';
        title = 'Observation';
    } else if (ACTION_KEYWORDS.has(lowerCaseTitle)) {
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
  const executionLog: WorkflowNodeData[] = [];
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
                executionLog.push(toolNode);
            }
        }
    } else {
        // For all other nodes (Think, Observe, Plan, etc.), just add them.
        executionLog.push(textNode);
    }
  }
  
  // Add any remaining tool nodes that didn't have a corresponding "Act" step (e.g., if text stream was cut off)
  for (const toolNode of toolNodesQueue) {
      toolNode.agentName = lastAgentName;
      executionLog.push(toolNode);
  }

  // 4. Apply final status updates to the entire interleaved log
  if (error) {
    let failureAssigned = false;
    for (let i = executionLog.length - 1; i >= 0; i--) {
        const node = executionLog[i];
        if (node.status === 'active' || node.status === 'pending') {
            node.status = 'failed';
            node.details = error;
            failureAssigned = true;
            break;
        }
    }
    if (!failureAssigned && executionLog.length > 0) {
        executionLog[executionLog.length - 1].status = 'failed';
    }
    // Fix: Complete the function body.
  } else if (isThinkingComplete) {
    // If thinking is done and there's no error, mark all non-failed, non-done nodes as 'done'.
    for (const node of executionLog) {
      if (node.status === 'pending' || node.status === 'active') {
        node.status = 'done';
      }
    }
  } else {
    // Thinking is still in progress. Find the last non-complete node and mark it 'active'.
    // Mark all preceding 'pending' nodes as 'done'.
    let activeNodeFound = false;
    for (let i = executionLog.length - 1; i >= 0; i--) {
      const node = executionLog[i];
      if (!activeNodeFound && (node.status === 'pending' || node.status === 'active')) {
        node.status = 'active';
        activeNodeFound = true;
      } else if (activeNodeFound && node.status === 'pending') {
        // Any pending text nodes before the current active step must be considered done.
        node.status = 'done';
      }
    }
  }

  return { plan: planText, executionLog };
};

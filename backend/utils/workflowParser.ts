
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MessageError, ToolCallEvent, WorkflowNodeData, WorkflowNodeType, ParsedWorkflow } from '../types.js';

const GENERIC_STEP_KEYWORDS = new Set(['observe', 'adapt', 'system']);
const ACTION_KEYWORDS = new Set(['act', 'action', 'tool call']);

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

  if (planMarkerIndex !== -1) {
    const planContentStartIndex = planMarkerIndex + planMarker.length;
    const nextStepIndex = rawText.indexOf('[STEP]', planContentStartIndex);

    if (nextStepIndex !== -1) {
      planText = rawText.substring(planContentStartIndex, nextStepIndex);
      executionText = rawText.substring(nextStepIndex);
    } else {
      planText = rawText.substring(planContentStartIndex);
      executionText = '';
    }
  } else {
    const firstStepIndex = rawText.indexOf('[STEP]');
    if (firstStepIndex !== -1) {
      planText = rawText.substring(0, firstStepIndex);
      executionText = rawText.substring(firstStepIndex);
    } else {
      planText = rawText;
      executionText = '';
    }
  }

  planText = planText.replace(/\[AGENT:.*?\]\s*/, '').replace(/\[USER_APPROVAL_REQUIRED\]/, '').trim();
  executionText = executionText.trim();

  const textNodes: WorkflowNodeData[] = [];
  const stepRegex = /(?:^|\n)\[STEP\]\s*(.*?):\s*([\s\S]*?)(?=(?:^|\n)\[STEP\]|$)/g;
  
  let match;
  let stepIndex = 0;
  while ((match = stepRegex.exec(executionText)) !== null) {
    let title = match[1].trim().replace(/:$/, '').trim();
    let details = match[2].trim().replace(/\[AUTO_CONTINUE\]/g, '').trim();
    const lowerCaseTitle = title.toLowerCase();

    if (lowerCaseTitle === 'final answer') {
        continue;
    }

    let type: WorkflowNodeType = 'plan';
    let agentName: string | undefined;
    let handoff: { from: string; to: string } | undefined;

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
        type = 'act_marker';
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

  const toolNodesQueue = toolCallEvents.map(event => {
    const isDuckDuckGoSearch = event.call.name === 'duckduckgoSearch';
    const duration = event.startTime && event.endTime ? (event.endTime - event.startTime) / 1000 : null;
    
    const isError = event.result?.startsWith('Tool execution failed');
    const nodeStatus = event.result ? (isError ? 'failed' : 'done') : 'active';

    return {
        id: event.id,
        type: isDuckDuckGoSearch ? 'duckduckgoSearch' : 'tool',
        title: isDuckDuckGoSearch ? ((event.call.args as any).query ?? 'Searching...') : event.call.name,
        status: nodeStatus,
        details: event,
        duration: duration,
    } as WorkflowNodeData;
  });

  const executionLog: WorkflowNodeData[] = [];
  let lastAgentName: string | undefined;

  for (const textNode of textNodes) {
    if (textNode.agentName) {
        lastAgentName = textNode.agentName;
    }

    if (textNode.type === 'act_marker') {
        if (toolNodesQueue.length > 0) {
            const toolNode = toolNodesQueue.shift();
            if (toolNode) {
                toolNode.agentName = lastAgentName;
                executionLog.push(toolNode);
            }
        }
    } else {
        executionLog.push(textNode);
    }
  }
  
  for (const toolNode of toolNodesQueue) {
      toolNode.agentName = lastAgentName;
      executionLog.push(toolNode);
  }

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
        executionLog[executionLog.length - 1].details = error;
    }
    
    let failurePointReached = false;
    executionLog.forEach(node => {
        if (node.status === 'failed') failurePointReached = true;
        if (node.status !== 'failed' && !failurePointReached) node.status = 'done';
    });

  } else if (isThinkingComplete) {
    executionLog.forEach(node => {
      if (node.status !== 'failed') node.status = 'done';
    });
  } else {
    let lastActiveNodeFound = false;
    for (let i = executionLog.length - 1; i >= 0; i--) {
        const node = executionLog[i];
        if (!lastActiveNodeFound && node.status !== 'done') {
            node.status = 'active';
            lastActiveNodeFound = true;
        } else if (node.status === 'pending') {
            node.status = 'done';
        }
    }
  }
  
  return { plan: planText, executionLog };
};

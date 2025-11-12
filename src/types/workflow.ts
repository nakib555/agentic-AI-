/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MessageError, ToolCallEvent } from './index';

// Types moved from src/components/AI/WorkflowNode.tsx
export type WorkflowNodeStatus = 'pending' | 'active' | 'done' | 'failed';
export type WorkflowNodeType = 'plan' | 'task' | 'tool' | 'duckduckgoSearch' | 'thought' | 'act_marker' | 'observation' | 'handoff' | 'validation' | 'approval' | 'correction' | 'archival' | 'audit';

export type WorkflowNodeData = {
  id: string;
  type: WorkflowNodeType;
  title: string;
  status: WorkflowNodeStatus;
  details?: string | ToolCallEvent | MessageError;
  duration?: number | null;
  agentName?: string;
  handoff?: { from: string; to: string };
};

// Type moved from src/services/workflowParser.ts
export type ParsedWorkflow = {
  plan: string;
  executionLog: WorkflowNodeData[];
};